import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateInvoicePDF, generateSalePDF } from '../pdfService.tsx';
import { Client, Invoice, Sale, Payment, CompanySettings } from '../../types';
import { getSettings } from '../../services/settingsService';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn().mockReturnValue('fr'),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn()
};
global.localStorage = localStorageMock;

// Mock @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => ({
  pdf: vi.fn().mockResolvedValue({
    toBlob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/pdf' }))
  }),
  Document: vi.fn(),
  Page: vi.fn(),
  Text: vi.fn(),
  View: vi.fn(),
  StyleSheet: {
    create: vi.fn()
  },
  Image: vi.fn(),
  Font: vi.fn()
}));

// Mock settings service
vi.mock('../../services/settingsService', () => ({
  getSettings: vi.fn().mockResolvedValue({
    company: {
      name: 'Test Company',
      address: 'Test Address',
      phone: '123456789',
      email: 'test@company.com',
      nif: '123456',
      nis: '789012',
      rc: '345678',
      ai: '901234'
    },
    language: 'fr',
    theme: 'light',
    currency: 'DA'
  })
}));

describe('PDF Service', () => {
  let mockClient: Client;
  let mockInvoice: Invoice;
  let mockSale: Sale;
  let mockPayments: Payment[];
  let mockCompanySettings: CompanySettings;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup test data
    mockClient = {
      id: 'client1',
      name: 'Test Client',
      company: 'Test Company',
      address: 'Test Address',
      phone: '123456789',
      email: 'test@client.com',
      nif: '123456',
      nis: '789012',
      rc: '345678',
      ai: '901234',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockSale = {
      id: 'sale1',
      clientId: 'client1',
      date: new Date(),
      items: [
        {
          id: 'item1',
          description: 'Test Item',
          coilRef: 'COIL-001',
          coilThickness: 1.5,
          coilWidth: 1000,
          topCoatRAL: '9016',
          backCoatRAL: '9002',
          coilWeight: 5000,
          quantity: 10,
          pricePerTon: 1000,
          totalAmountHT: 10000,
          totalAmountTTC: 11900
        }
      ],
      totalAmountHT: 10000,
      totalAmountTTC: 11900,
      transportationFee: 500,
      transportationFeeTTC: 595,
      isInvoiced: false,
      taxRate: 0.19,
      notes: 'Test notes',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockInvoice = {
      id: 'invoice1',
      clientId: 'client1',
      invoiceNumber: 'INV-001',
      date: new Date(),
      dueDate: new Date(),
      salesIds: ['sale1'],
      totalAmountHT: 10000,
      totalAmountTTC: 11900,
      isPaid: false,
      taxRate: 0.19,
      paymentMethod: 'bank_transfer',
      transportationFee: 500,
      transportationFeeTTC: 595,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockPayments = [
      {
        id: 'payment1',
        clientId: 'client1',
        saleId: 'sale1',
        amount: 5000,
        date: new Date(),
        method: 'bank_transfer',
        notes: 'First payment',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    mockCompanySettings = {
      name: 'Test Company',
      address: 'Test Address',
      phone: '123456789',
      email: 'test@company.com',
      nif: '123456',
      nis: '789012',
      rc: '345678',
      ai: '901234'
    };
  });

  describe('generateInvoicePDF', () => {
    it('should create a PDF blob with invoice data', async () => {
      const pdfBlob = await generateInvoicePDF(
        mockInvoice,
        mockClient,
        [mockSale],
        mockPayments,
        mockCompanySettings
      );

      expect(pdfBlob).toBeDefined();
      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.type).toBe('application/pdf');
    });

    it('should handle missing optional fields', async () => {
      const minimalClient = {
        ...mockClient,
        nif: undefined,
        nis: undefined,
        rc: undefined,
        ai: undefined
      };

      const pdfBlob = await generateInvoicePDF(
        mockInvoice,
        minimalClient,
        [mockSale],
        mockPayments,
        mockCompanySettings
      );

      expect(pdfBlob).toBeDefined();
      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.type).toBe('application/pdf');
    });
  });

  describe('generateSalePDF', () => {
    it('should create a PDF blob with sale data', async () => {
      const pdfBlob = await generateSalePDF(
        mockSale,
        mockClient,
        mockCompanySettings
      );

      expect(pdfBlob).toBeDefined();
      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.type).toBe('application/pdf');
    });

    it('should handle missing optional fields', async () => {
      const minimalClient = {
        ...mockClient,
        nif: undefined,
        nis: undefined,
        rc: undefined,
        ai: undefined
      };

      const pdfBlob = await generateSalePDF(
        mockSale,
        minimalClient,
        mockCompanySettings
      );

      expect(pdfBlob).toBeDefined();
      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.type).toBe('application/pdf');
    });
  });
}); 