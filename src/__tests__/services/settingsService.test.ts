import { supabase } from '@/integrations/supabase/client';
import { getSettings, updateSettings } from '../../services/settingsService';
import { AppSettings, CompanySettings } from '../../types';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      single: jest.fn()
    }))
  }
}));

describe('Settings Service', () => {
  const mockCompanySettings: CompanySettings = {
    name: 'Test Company',
    address: '123 Test St',
    phone: '123-456-7890',
    email: 'test@company.com',
    nif: '12345',
    nis: '67890',
    rc: 'RC123',
    ai: 'AI456',
    rib: 'RIB789'
  };

  const mockSettings: AppSettings = {
    company: mockCompanySettings,
    language: 'fr',
    theme: 'light',
    currency: 'DZD'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should fetch settings', async () => {
      const mockResponse = {
        data: {
          company_name: mockCompanySettings.name,
          company_address: mockCompanySettings.address,
          company_phone: mockCompanySettings.phone,
          company_email: mockCompanySettings.email,
          nif: mockCompanySettings.nif,
          nis: mockCompanySettings.nis,
          rc: mockCompanySettings.rc,
          ai: mockCompanySettings.ai,
          rib: mockCompanySettings.rib,
          currency: mockSettings.currency
        },
        error: null
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(mockResponse)
        })
      });

      const result = await getSettings();
      expect(result).toEqual(mockSettings);
    });

    it('should create default settings if none exist', async () => {
      const mockError = { code: 'PGRST116' };
      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue({ error: mockError })
          })
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockSettings, error: null })
            })
          })
        });

      const result = await getSettings();
      expect(result).toBeDefined();
      expect(result.company).toBeDefined();
    });

    it('should handle database error', async () => {
      const mockError = new Error('Database error');
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(mockError)
      });

      const result = await getSettings();
      expect(result).toEqual(expect.objectContaining({
        company: expect.any(Object),
        language: expect.any(String),
        theme: expect.any(String),
        currency: expect.any(String)
      }));
    });
  });

  describe('updateSettings', () => {
    const updateData = {
      company: {
        name: 'Updated Company',
        address: 'New Address',
        phone: 'New Phone',
        email: 'new@email.com',
        nif: 'NEW123',
        nis: 'NEW456',
        rc: 'NEW-RC',
        ai: 'NEW-AI',
        rib: 'NEW-RIB'
      },
      currency: 'EUR'
    };

    it('should update settings', async () => {
      const mockResponse = {
        data: {
          company_name: updateData.company.name,
          company_address: updateData.company.address,
          company_phone: updateData.company.phone,
          company_email: updateData.company.email,
          nif: updateData.company.nif,
          nis: updateData.company.nis,
          rc: updateData.company.rc,
          ai: updateData.company.ai,
          rib: updateData.company.rib,
          currency: updateData.currency
        },
        error: null
      };

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(mockResponse)
          })
        })
      });

      const result = await updateSettings(updateData);
      expect(result.company.name).toBe(updateData.company.name);
      expect(result.company.address).toBe(updateData.company.address);
      expect(result.currency).toBe(updateData.currency);
    });

    it('should handle update error', async () => {
      const mockError = new Error('Update failed');
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockRejectedValue(mockError)
      });

      await expect(updateSettings(updateData)).rejects.toThrow('Update failed');
    });

    it('should handle partial updates', async () => {
      const partialUpdate = {
        company: {
          name: 'New Name'
        }
      };

      const mockResponse = {
        data: {
          company_name: partialUpdate.company.name,
          company_address: mockCompanySettings.address,
          company_phone: mockCompanySettings.phone,
          company_email: mockCompanySettings.email,
          currency: mockSettings.currency
        },
        error: null
      };

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(mockResponse)
          })
        })
      });

      const result = await updateSettings(partialUpdate);
      expect(result.company.name).toBe(partialUpdate.company.name);
      expect(result.company.address).toBe(mockCompanySettings.address);
    });
  });
}); 