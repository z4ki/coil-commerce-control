import { supabase } from '@/integrations/supabase/client';
import { getSales, getSaleById, createSale, updateSale, deleteSale } from '../../services/saleService';
import { Sale, SaleItem } from '../../types';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      eq: jest.fn(),
      single: jest.fn(),
      order: jest.fn()
    }))
  }
}));

describe('Sale Service', () => {
  const mockSaleItem: SaleItem = {
    id: '1',
    description: 'Test Item',
    quantity: 10,
    pricePerTon: 1000,
    totalAmountHT: 10000,
    totalAmountTTC: 11900
  };

  const mockSale: Sale = {
    id: '1',
    clientId: 'client1',
    date: new Date('2024-01-01'),
    items: [mockSaleItem],
    totalAmountHT: 10000,
    totalAmountTTC: 11900,
    isInvoiced: false,
    taxRate: 0.19,
    createdAt: new Date('2024-01-01')
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSales', () => {
    it('should fetch all sales', async () => {
      const mockResponse = { data: [mockSale], error: null };
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await getSales();
      expect(result).toEqual([mockSale]);
    });

    it('should handle empty sales list', async () => {
      const mockResponse = { data: [], error: null };
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await getSales();
      expect(result).toEqual([]);
    });

    it('should handle database error', async () => {
      const mockError = new Error('Database error');
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(mockError)
      });

      await expect(getSales()).rejects.toThrow('Database error');
    });
  });

  describe('getSaleById', () => {
    it('should fetch sale by id', async () => {
      const mockResponse = { data: mockSale, error: null };
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(mockResponse)
          })
        })
      });

      const result = await getSaleById('1');
      expect(result).toEqual(mockSale);
    });

    it('should return null for non-existent sale', async () => {
      const mockResponse = { data: null, error: { code: 'PGRST116' } };
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(mockResponse)
          })
        })
      });

      const result = await getSaleById('999');
      expect(result).toBeNull();
    });
  });

  describe('createSale', () => {
    const newSale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'> = {
      clientId: 'client1',
      date: new Date('2024-01-01'),
      items: [mockSaleItem],
      totalAmountHT: 10000,
      totalAmountTTC: 11900,
      isInvoiced: false,
      taxRate: 0.19
    };

    it('should create a new sale', async () => {
      const mockResponse = { data: mockSale, error: null };
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(mockResponse)
          })
        })
      });

      const result = await createSale(newSale);
      expect(result).toEqual(mockSale);
    });

    it('should handle creation error', async () => {
      const mockError = new Error('Creation failed');
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockRejectedValue(mockError)
      });

      await expect(createSale(newSale)).rejects.toThrow('Creation failed');
    });
  });

  describe('updateSale', () => {
    const updateData: Partial<Sale> = {
      isInvoiced: true,
      invoiceId: 'inv1'
    };

    it('should update an existing sale', async () => {
      const mockResponse = { data: { ...mockSale, ...updateData }, error: null };
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(mockResponse)
            })
          })
        })
      });

      const result = await updateSale('1', updateData);
      expect(result).toEqual({ ...mockSale, ...updateData });
    });

    it('should handle update error', async () => {
      const mockError = new Error('Update failed');
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockRejectedValue(mockError)
      });

      await expect(updateSale('1', updateData)).rejects.toThrow('Update failed');
    });
  });

  describe('deleteSale', () => {
    it('should delete a sale', async () => {
      const mockResponse = { error: null };
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue(mockResponse)
        })
      });

      await expect(deleteSale('1')).resolves.not.toThrow();
    });

    it('should handle deletion error', async () => {
      const mockError = new Error('Deletion failed');
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockRejectedValue(mockError)
      });

      await expect(deleteSale('1')).rejects.toThrow('Deletion failed');
    });
  });
}); 