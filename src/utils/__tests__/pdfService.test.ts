import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { jsPDF } from 'jspdf';
import { generateInvoicePDF, generateSalePDF } from '../pdfService';
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

// Create a mock jsPDF instance
const createMockJsPDF = () => ({
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  text: vi.fn(),
  internal: {
    pageSize: {
      width: 210,
      height: 297
    }
  },
  autoTable: vi.fn().mockReturnThis(),
  lastAutoTable: {
    finalY: 200
  },
  save: vi.fn()
});

// Mock jsPDF constructor
vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => createMockJsPDF())
}));

// Mock jspdf-autotable
vi.mock('jspdf-autotable');

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
  let mockJsPDF: ReturnType<typeof createMockJsPDF>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create a new mock jsPDF instance
    mockJsPDF = createMockJsPDF();
    (jsPDF as unknown as Mock).mockImplementation(() => mockJsPDF);

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
  });

  describe('generateInvoicePDF', () => {
    it('should create a PDF document with invoice data', async () => {
      const doc = await generateInvoicePDF(
        mockInvoice,
        mockClient,
        [mockSale],
        mockPayments
      );

      expect(doc).toBeDefined();
      expect(jsPDF).toHaveBeenCalled();
      expect(mockJsPDF.setFontSize).toHaveBeenCalled();
      expect(mockJsPDF.setFont).toHaveBeenCalled();
      expect(mockJsPDF.text).toHaveBeenCalled();
      expect(mockJsPDF.autoTable).toHaveBeenCalled();
    });

    it('should handle missing optional fields', async () => {
      const minimalClient = {
        ...mockClient,
        nif: undefined,
        nis: undefined,
        rc: undefined,
        ai: undefined
      };

      const doc = await generateInvoicePDF(
        mockInvoice,
        minimalClient,
        [mockSale],
        mockPayments
      );

      expect(doc).toBeDefined();
      expect(jsPDF).toHaveBeenCalled();
    });

    it('should calculate totals correctly', async () => {
      await generateInvoicePDF(
        mockInvoice,
        mockClient,
        [mockSale],
        mockPayments
      );

      // Verify that autoTable was called with correct totals
      const autoTableCalls = mockJsPDF.autoTable.mock.calls;
      const summaryTableCall = autoTableCalls.find(call => 
        call[0].body.some((row: string[]) => row[0] === 'Total TTC:')
      );

      expect(summaryTableCall).toBeDefined();
      const totalRow = summaryTableCall[0].body.find((row: string[]) => row[0] === 'Total TTC:');
      expect(totalRow[1]).toContain('11 900,00 DA');
    });
  });

  describe('generateSalePDF', () => {
    it('should create a PDF document with sale data', async () => {
      const doc = await generateSalePDF(mockSale, mockClient);

      expect(doc).toBeDefined();
      expect(jsPDF).toHaveBeenCalled();
      expect(mockJsPDF.setFontSize).toHaveBeenCalled();
      expect(mockJsPDF.setFont).toHaveBeenCalled();
      expect(mockJsPDF.text).toHaveBeenCalled();
      expect(mockJsPDF.autoTable).toHaveBeenCalled();
    });

    it('should handle custom options', async () => {
      await generateSalePDF(mockSale, mockClient, {
        title: 'FACTURE PROFORMA',
        showLogo: true,
        showFooter: true
      });

      expect(mockJsPDF.text).toHaveBeenCalledWith(
        'FACTURE PROFORMA',
        expect.any(Number),
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('should throw error when settings are not found', async () => {
      (getSettings as Mock).mockResolvedValueOnce(null);

      await expect(generateSalePDF(mockSale, mockClient))
        .rejects
        .toThrow('Company settings not found');
    });

    it('should format currency correctly', async () => {
      await generateSalePDF(mockSale, mockClient);

      // Verify that autoTable was called with correctly formatted currency
      const autoTableCalls = mockJsPDF.autoTable.mock.calls;
      const itemsTableCall = autoTableCalls.find(call => 
        Array.isArray(call[0].head) && call[0].head[0].includes('Prix U.')
      );

      expect(itemsTableCall).toBeDefined();
      const priceCell = itemsTableCall[0].body[0][3];
      expect(priceCell).toContain('1 000,00 DA');
    });
  });
}); 