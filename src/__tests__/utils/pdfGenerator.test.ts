import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { Invoice, Sale, Client, CompanySettings } from '../../types';

describe('PDF Generator', () => {
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

  const mockClient: Client = {
    id: 'client1',
    name: 'Test Client',
    company: 'Client Company',
    address: '456 Client St',
    phone: '987-654-3210',
    email: 'client@example.com',
    nif: 'CLIENT-NIF',
    nis: 'CLIENT-NIS',
    rc: 'CLIENT-RC',
    ai: 'CLIENT-AI',
    rib: 'CLIENT-RIB',
    createdAt: new Date('2024-01-01')
  };

  const mockSale: Sale = {
    id: 'sale1',
    clientId: 'client1',
    date: new Date('2024-01-01'),
    items: [
      {
        id: 'item1',
        description: 'Test Item',
        quantity: 10,
        pricePerTon: 1000,
        totalAmountHT: 10000,
        totalAmountTTC: 11900,
        coilRef: 'COIL-123',
        coilThickness: 1.5,
        coilWidth: 1000,
        coilWeight: 10
      }
    ],
    totalAmountHT: 10000,
    totalAmountTTC: 11900,
    isInvoiced: true,
    invoiceId: 'inv1',
    taxRate: 0.19,
    transportationFee: 1000,
    createdAt: new Date('2024-01-01')
  };

  const mockInvoice: Invoice = {
    id: 'inv1',
    invoiceNumber: 'INV-2024-001',
    clientId: 'client1',
    salesIds: ['sale1'],
    date: new Date('2024-01-01'),
    dueDate: new Date('2024-02-01'),
    totalAmountHT: 10000,
    totalAmountTTC: 11900,
    taxRate: 0.19,
    isPaid: false,
    transportationFee: 1000,
    transportationFeeTTC: 1190,
    createdAt: new Date('2024-01-01')
  };

  it('should generate PDF with correct company information', async () => {
    const pdf = await generateInvoicePDF(mockInvoice, mockClient, [mockSale], mockCompanySettings);
    
    expect(pdf).toBeDefined();
    expect(typeof pdf).toBe('object');
    
    // Convert PDF to text for content verification
    const pdfText = await convertPDFToText(pdf);
    
    // Verify company information
    expect(pdfText).toContain(mockCompanySettings.name);
    expect(pdfText).toContain(mockCompanySettings.address);
    expect(pdfText).toContain(mockCompanySettings.phone);
    expect(pdfText).toContain(mockCompanySettings.email);
    expect(pdfText).toContain(mockCompanySettings.nif);
    expect(pdfText).toContain(mockCompanySettings.rib);
  });

  it('should generate PDF with correct client information', async () => {
    const pdf = await generateInvoicePDF(mockInvoice, mockClient, [mockSale], mockCompanySettings);
    const pdfText = await convertPDFToText(pdf);
    
    expect(pdfText).toContain(mockClient.name);
    expect(pdfText).toContain(mockClient.company);
    expect(pdfText).toContain(mockClient.address);
    expect(pdfText).toContain(mockClient.nif);
    expect(pdfText).toContain(mockClient.rib);
  });

  it('should generate PDF with correct sale items', async () => {
    const pdf = await generateInvoicePDF(mockInvoice, mockClient, [mockSale], mockCompanySettings);
    const pdfText = await convertPDFToText(pdf);
    
    mockSale.items.forEach(item => {
      expect(pdfText).toContain(item.description);
      expect(pdfText).toContain(item.coilRef);
      expect(pdfText).toContain(item.quantity.toString());
      expect(pdfText).toContain(item.pricePerTon.toString());
      expect(pdfText).toContain(item.totalAmountHT.toString());
    });
  });

  it('should generate PDF with correct totals', async () => {
    const pdf = await generateInvoicePDF(mockInvoice, mockClient, [mockSale], mockCompanySettings);
    const pdfText = await convertPDFToText(pdf);
    
    expect(pdfText).toContain(mockInvoice.totalAmountHT.toString());
    expect(pdfText).toContain(mockInvoice.totalAmountTTC.toString());
    expect(pdfText).toContain(mockInvoice.transportationFee?.toString() || '');
    expect(pdfText).toContain(mockInvoice.transportationFeeTTC?.toString() || '');
  });

  it('should handle special characters in text fields', async () => {
    const specialClient = {
      ...mockClient,
      name: 'Société Générale & Cie',
      address: 'Rue de l\'Université, 75007 Paris'
    };
    
    const pdf = await generateInvoicePDF(mockInvoice, specialClient, [mockSale], mockCompanySettings);
    const pdfText = await convertPDFToText(pdf);
    
    expect(pdfText).toContain(specialClient.name);
    expect(pdfText).toContain(specialClient.address);
  });

  it('should handle large numbers correctly', async () => {
    const largeNumbersSale = {
      ...mockSale,
      items: [{
        ...mockSale.items[0],
        quantity: 999999.99,
        pricePerTon: 999999.99,
        totalAmountHT: 999999999.99,
        totalAmountTTC: 1189999999.99
      }]
    };
    
    const pdf = await generateInvoicePDF(mockInvoice, mockClient, [largeNumbersSale], mockCompanySettings);
    const pdfText = await convertPDFToText(pdf);
    
    expect(pdfText).toContain('999,999.99');
    expect(pdfText).toContain('999,999,999.99');
  });

  // Helper function to convert PDF to text for testing
  const convertPDFToText = async (pdf: Buffer): Promise<string> => {
    // Mock implementation for testing
    return pdf.toString('utf-8');
  };
}); 