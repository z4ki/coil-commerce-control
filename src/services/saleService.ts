import { v4 as uuidv4 } from 'uuid';
import type { Sale, Invoice } from '@/types/sales';
import type { Client, Payment, BulkPayment, CreditTransaction, AppSettings } from '@/types/index';
import { tauriApi } from '@/lib/tauri-api';

// Mock data storage
let mockClients: Client[] = [
  {
    id: '1',
    name: 'Client A',
    company: 'Company A',
    address: '123 Main St, City A',
    phone: '+213 123 456 789',
    email: 'clienta@example.com',
    nif: '123456789',
    nis: '987654321',
    rc: 'RC123456',
    ai: 'AI789012',
    rib: 'RIB123456789',
    notes: 'Test client A',
    creditBalance: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Client B',
    company: 'Company B',
    address: '456 Oak Ave, City B',
    phone: '+213 987 654 321',
    email: 'clientb@example.com',
    nif: '987654321',
    nis: '123456789',
    rc: 'RC654321',
    ai: 'AI123456',
    rib: 'RIB987654321',
    notes: 'Test client B',
    creditBalance: 500,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-15')
  }
];

let mockSales: Sale[] = [
  {
    id: '1',
    clientId: '1',
    date: new Date('2024-01-15'),
    items: [
      {
        id: '1',
        saleId: '1',
        description: 'Corrugated Steel Sheets',
        coilRef: 'CR001',
        coilThickness: 0.5,
        coilWidth: 1000,
        topCoatRAL: 'RAL3000',
        backCoatRAL: 'RAL9005',
        coilWeight: 2.5,
        quantity: 10,
        pricePerTon: 1200,
        totalAmountHT: 30000,
        totalAmountTTC: 35700,
        createdAt: new Date('2024-01-15'),
        productType: undefined,
        updatedAt: undefined
      }
    ],
    totalAmountHT: 30000,
    totalAmountTTC: 35700,
    isInvoiced: true,
    invoiceId: '1',
    notes: 'Test sale 1',
    paymentMethod: 'bank_transfer',
    transportationFee: 500,
    taxRate: 0.19,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    isPaid: false,
    paidAt: undefined
  },
  {
    id: '2',
    clientId: '2',
    date: new Date('2024-01-20'),
    items: [
      {
        id: '2',
        saleId: '2',
        description: 'Steel Slitting Strips',
        coilRef: 'SS002',
        coilThickness: 0.8,
        coilWidth: 800,
        topCoatRAL: 'RAL5005',
        backCoatRAL: 'RAL9005',
        coilWeight: 3.2,
        quantity: 5,
        pricePerTon: 1400,
        totalAmountHT: 22400,
        totalAmountTTC: 26656,
        createdAt: new Date('2024-01-20'),
        productType: undefined,
        updatedAt: undefined
      }
    ],
    totalAmountHT: 22400,
    totalAmountTTC: 26656,
    isInvoiced: false,
    invoiceId: undefined,
    notes: 'Test sale 2',
    paymentMethod: 'cash',
    transportationFee: 300,
    taxRate: 0.19,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    isPaid: false,
    paidAt: undefined
  }
];

let mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    clientId: '1',
    salesIds: ['1'],
    date: new Date('2024-01-15'),
    dueDate: new Date('2024-02-15'),
    totalAmountHT: 30000,
    totalAmountTTC: 35700,
    isPaid: false,
    paidAt: undefined,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  }
];

let mockPayments: Payment[] = [
  {
    id: '1',
    clientId: '1',
    saleId: '1',
    amount: 20000,
    date: new Date('2024-01-20'),
    method: 'bank_transfer',
    notes: 'Partial payment',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    invoiceId: undefined,
    isDeleted: false,
    deletedAt: undefined,
    checkNumber: undefined,
    bulkPaymentId: undefined
  }
];

let mockBulkPayments: BulkPayment[] = [
  {
    id: '1',
    clientId: '2',
    totalAmount: 15000,
    date: new Date('2024-01-25'),
    method: 'cash',
    notes: 'Bulk payment for multiple sales',
    distribution: [
      { saleId: '2', amount: 15000 }
    ],
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25')
  }
];

let mockCreditTransactions: CreditTransaction[] = [
  {
    id: '1',
    clientId: '2',
    amount: 500,
    type: 'credit',
    sourceType: 'payment',
    sourceId: '1',
    notes: 'Credit from payment',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25')
  }
];

let mockSettings: AppSettings = {
  id: '1',
  company: {
    name: 'HA SALES',
    address: '123 Business St, Algiers',
    phone: '+213 123 456 789',
    email: 'contact@hasales.com',
    nif: '123456789',
    nis: '987654321',
    rc: 'RC123456',
    ai: 'AI789012',
    rib: 'RIB123456789',
    taxId: 'TAX123456'
  },
  language: 'en',
  theme: 'light',
  currency: 'DZD',
  notifications: true,
  darkMode: false
};

// Helper functions
const generateId = (): string => uuidv4();

const updateClientCreditBalance = (clientId: string, amount: number, type: 'credit' | 'debit') => {
  const clientIndex = mockClients.findIndex(c => c.id === clientId);
  if (clientIndex !== -1) {
    if (type === 'credit') {
      mockClients[clientIndex].creditBalance += amount;
    } else {
      mockClients[clientIndex].creditBalance -= amount;
    }
    mockClients[clientIndex].updatedAt = new Date();
  }
};

// Mock database interface
export const localDB = {
  // Client operations
  clients: {
    getAll: async (): Promise<Client[]> => {
      return Promise.resolve([...mockClients]);
    },

    getById: async (id: string): Promise<Client | null> => {
      const client = mockClients.find(c => c.id === id);
      return Promise.resolve(client ? { ...client } : null);
    },

    create: async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
      const newClient: Client = {
        ...client,
        id: generateId(),
        creditBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockClients.push(newClient);
      return Promise.resolve({ ...newClient });
    },

    update: async (id: string, client: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Client> => {
      const index = mockClients.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Client not found');
      
      mockClients[index] = {
        ...mockClients[index],
        ...client,
        updatedAt: new Date()
      };
      return Promise.resolve({ ...mockClients[index] });
    },

    delete: async (id: string): Promise<void> => {
      const index = mockClients.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Client not found');
      mockClients.splice(index, 1);
      return Promise.resolve();
    }
  },

  // Sale operations
  sales: {
    getAll: async (): Promise<Sale[]> => {
      return Promise.resolve([...mockSales]);
    },

    getById: async (id: string): Promise<Sale | null> => {
      const sale = mockSales.find(s => s.id === id);
      return Promise.resolve(sale ? { ...sale } : null);
    },

    getByClient: async (clientId: string): Promise<Sale[]> => {
      const sales = mockSales.filter(s => s.clientId === clientId);
      return Promise.resolve([...sales]);
    },

    getFiltered: async (filter: SalesFilter): Promise<Sale[]> => {
      let filtered = [...mockSales];
      
      if (filter.clientId) {
        filtered = filtered.filter(s => s.clientId === filter.clientId);
      }
      if (filter.isInvoiced !== undefined) {
        filtered = filtered.filter(s => s.isInvoiced === filter.isInvoiced);
      }
      if (filter.startDate) {
        filtered = filtered.filter(s => s.date >= filter.startDate!);
      }
      if (filter.endDate) {
        filtered = filtered.filter(s => s.date <= filter.endDate!);
      }
      
      return Promise.resolve(filtered);
    },

    create: async (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sale> => {
      try {
        // Ensure date is a valid ISO string
        let dateString: string = "";
        if (sale.date instanceof Date && !isNaN(sale.date.getTime())) {
          dateString = sale.date.toISOString();
        } else if (typeof sale.date === 'string' && sale.date.length > 0) {
          // Try to parse and re-serialize
          const d = new Date(sale.date);
          dateString = !isNaN(d.getTime()) ? d.toISOString() : "";
        }
        // Ensure paidAt is a valid ISO string or null
        let paidAtString: string | null = null;
        if (sale.paidAt instanceof Date && !isNaN(sale.paidAt.getTime())) {
          paidAtString = sale.paidAt.toISOString();
        } else if (typeof sale.paidAt === 'string' && sale.paidAt.length > 0) {
          const d = new Date(sale.paidAt);
          paidAtString = !isNaN(d.getTime()) ? d.toISOString() : null;
        }
        const backendSale: any = {
          client_id: sale.clientId,
          date: dateString,
          total_amount: typeof sale.totalAmountHT === 'number' ? sale.totalAmountHT : 0,
          total_amount_ttc: typeof sale.totalAmountTTC === 'number' ? sale.totalAmountTTC : 0,
          is_invoiced: sale.isInvoiced ?? false,
          invoice_id: sale.invoiceId ?? null,
          notes: sale.notes ?? "",
          payment_method: sale.paymentMethod ?? null,
          transportation_fee: typeof sale.transportationFee === 'number' ? sale.transportationFee : 0,
          tax_rate: typeof sale.taxRate === 'number' ? sale.taxRate : 0,
          is_paid: sale.isPaid ?? false,
          paid_at: paidAtString,
          items: (sale.items || []).map(item => ({
            description: item.description,
            coil_ref: item.coilRef ?? null,
            coil_thickness: typeof item.coilThickness === 'number' ? item.coilThickness : 0,
            coil_width: typeof item.coilWidth === 'number' ? item.coilWidth : 0,
            top_coat_ral: item.topCoatRAL ?? null,
            back_coat_ral: item.backCoatRAL ?? null,
            coil_weight: typeof item.coilWeight === 'number' ? item.coilWeight : 0,
            quantity: typeof item.quantity === 'number' ? item.quantity : 0,
            price_per_ton: typeof item.pricePerTon === 'number' ? item.pricePerTon : 0,
            total_amount: typeof item.totalAmountHT === 'number' ? item.totalAmountHT : 0,
            product_type: item.productType ?? 'coil',
          }))
        };
        console.log('[createSale] Payload to backend:', JSON.stringify(backendSale, null, 2));
        return await tauriApi.sales.create(backendSale);
      } catch (error) {
        console.error('Error creating sale:', error);
        throw error;
      }
    },

    update: async (id: string, sale: Partial<Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Sale> => {
      const index = mockSales.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Sale not found');
      
      const updatedSale = {
        ...mockSales[index],
        ...sale,
        items: sale.items ? sale.items.map(item => ({ ...item, id: item.id || generateId() })) : mockSales[index].items,
        updatedAt: new Date()
      };
      
      mockSales[index] = updatedSale;
      return Promise.resolve({ ...updatedSale });
    },

    delete: async (id: string): Promise<void> => {
      const index = mockSales.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Sale not found');
      mockSales.splice(index, 1);
      return Promise.resolve();
    }
  },

  // Invoice operations
  invoices: {
    getAll: async (): Promise<Invoice[]> => {
      return Promise.resolve([...mockInvoices]);
    },

    getById: async (id: string): Promise<Invoice | null> => {
      const invoice = mockInvoices.find(i => i.id === id);
      return Promise.resolve(invoice ? { ...invoice } : null);
    },

    getFiltered: async (filter: InvoiceFilter): Promise<Invoice[]> => {
      let filtered = [...mockInvoices];
      
      if (filter.clientId) {
        filtered = filtered.filter(i => i.clientId === filter.clientId);
      }
      if (filter.isPaid !== undefined) {
        filtered = filtered.filter(i => i.isPaid === filter.isPaid);
      }
      if (filter.startDate) {
        filtered = filtered.filter(i => i.date >= filter.startDate!);
      }
      if (filter.endDate) {
        filtered = filtered.filter(i => i.date <= filter.endDate!);
      }
      
      return Promise.resolve(filtered);
    },

    create: async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> => {
      const newInvoice: Invoice = {
        ...invoice,
        id: generateId(),
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(mockInvoices.length + 1).padStart(3, '0')}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockInvoices.push(newInvoice);
      return Promise.resolve({ ...newInvoice });
    },

    update: async (id: string, invoice: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Invoice> => {
      const index = mockInvoices.findIndex(i => i.id === id);
      if (index === -1) throw new Error('Invoice not found');
      
      mockInvoices[index] = {
        ...mockInvoices[index],
        ...invoice,
        updatedAt: new Date()
      };
      return Promise.resolve({ ...mockInvoices[index] });
    },

    delete: async (id: string): Promise<void> => {
      const index = mockInvoices.findIndex(i => i.id === id);
      if (index === -1) throw new Error('Invoice not found');
      mockInvoices.splice(index, 1);
      return Promise.resolve();
    }
  },

  // Payment operations
  payments: {
    getAll: async (): Promise<Payment[]> => {
      return Promise.resolve([...mockPayments]);
    },

    getById: async (id: string): Promise<Payment | null> => {
      const payment = mockPayments.find(p => p.id === id);
      return Promise.resolve(payment ? { ...payment } : null);
    },

    create: async (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> => {
      const newPayment: Payment = {
        ...payment,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockPayments.push(newPayment);
      return Promise.resolve({ ...newPayment });
    },

    update: async (id: string, payment: Partial<Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Payment> => {
      const index = mockPayments.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Payment not found');
      
      mockPayments[index] = {
        ...mockPayments[index],
        ...payment,
        updatedAt: new Date()
      };
      return Promise.resolve({ ...mockPayments[index] });
    },

    delete: async (id: string): Promise<void> => {
      const index = mockPayments.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Payment not found');
      mockPayments.splice(index, 1);
      return Promise.resolve();
    }
  },

  // Bulk payment operations
  bulkPayments: {
    getAll: async (): Promise<BulkPayment[]> => {
      return Promise.resolve([...mockBulkPayments]);
    },

    getById: async (id: string): Promise<BulkPayment | null> => {
      const bulkPayment = mockBulkPayments.find(bp => bp.id === id);
      return Promise.resolve(bulkPayment ? { ...bulkPayment } : null);
    },

    create: async (bulkPayment: Omit<BulkPayment, 'id' | 'createdAt' | 'updatedAt'>): Promise<BulkPayment> => {
      const newBulkPayment: BulkPayment = {
        ...bulkPayment,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockBulkPayments.push(newBulkPayment);
      return Promise.resolve({ ...newBulkPayment });
    },

    update: async (id: string, bulkPayment: Partial<Omit<BulkPayment, 'id' | 'createdAt' | 'updatedAt'>>): Promise<BulkPayment> => {
      const index = mockBulkPayments.findIndex(bp => bp.id === id);
      if (index === -1) throw new Error('Bulk payment not found');
      
      mockBulkPayments[index] = {
        ...mockBulkPayments[index],
        ...bulkPayment,
        updatedAt: new Date()
      };
      return Promise.resolve({ ...mockBulkPayments[index] });
    },

    delete: async (id: string): Promise<void> => {
      const index = mockBulkPayments.findIndex(bp => bp.id === id);
      if (index === -1) throw new Error('Bulk payment not found');
      mockBulkPayments.splice(index, 1);
      return Promise.resolve();
    }
  },

  // Credit transaction operations
  creditTransactions: {
    getAll: async (): Promise<CreditTransaction[]> => {
      return Promise.resolve([...mockCreditTransactions]);
    },

    getByClient: async (clientId: string): Promise<CreditTransaction[]> => {
      const transactions = mockCreditTransactions.filter(ct => ct.clientId === clientId);
      return Promise.resolve([...transactions]);
    },

    create: async (transaction: Omit<CreditTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<CreditTransaction> => {
      const newTransaction: CreditTransaction = {
        ...transaction,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockCreditTransactions.push(newTransaction);
      
      // Update client credit balance
      updateClientCreditBalance(transaction.clientId, transaction.amount, transaction.type);
      
      return Promise.resolve({ ...newTransaction });
    },

    update: async (id: string, transaction: Partial<Omit<CreditTransaction, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CreditTransaction> => {
      const index = mockCreditTransactions.findIndex(ct => ct.id === id);
      if (index === -1) throw new Error('Credit transaction not found');
      
      mockCreditTransactions[index] = {
        ...mockCreditTransactions[index],
        ...transaction,
        updatedAt: new Date()
      };
      return Promise.resolve({ ...mockCreditTransactions[index] });
    },

    delete: async (id: string): Promise<void> => {
      const index = mockCreditTransactions.findIndex(ct => ct.id === id);
      if (index === -1) throw new Error('Credit transaction not found');
      
      const transaction = mockCreditTransactions[index];
      // Reverse the credit balance change
      updateClientCreditBalance(transaction.clientId, transaction.amount, transaction.type === 'credit' ? 'debit' : 'credit');
      
      mockCreditTransactions.splice(index, 1);
      return Promise.resolve();
    }
  },

  // Settings operations
  settings: {
    get: async (): Promise<AppSettings> => {
      return Promise.resolve({ ...mockSettings });
    },

    update: async (settings: Partial<AppSettings>): Promise<AppSettings> => {
      mockSettings = {
        ...mockSettings,
        ...settings
      };
      return Promise.resolve({ ...mockSettings });
    }
  }
};

// Export mock data for testing
export const mockData = {
  clients: mockClients,
  sales: mockSales,
  invoices: mockInvoices,
  payments: mockPayments,
  bulkPayments: mockBulkPayments,
  creditTransactions: mockCreditTransactions,
  settings: mockSettings
};

export const getSales = async (): Promise<Sale[]> => {
  const backendSales = await tauriApi.sales.getAll() as any[];
  if (!Array.isArray(backendSales)) return [];
  return backendSales.map((sale: any) => ({
    id: sale.id,
    clientId: sale.client_id,
    date: new Date(sale.date),
    items: (sale.items || []).map((item: any) => ({
      id: item.id,
      saleId: sale.id,
      description: item.description,
      coilRef: item.coil_ref,
      coilThickness: item.coil_thickness,
      coilWidth: item.coil_width,
      topCoatRAL: item.top_coat_ral,
      backCoatRAL: item.back_coat_ral,
      coilWeight: item.coil_weight,
      quantity: Number(item.quantity),
      pricePerTon: Number(item.price_per_ton),
      totalAmountHT: Number(item.total_amount_ht ?? item.total_amount),
      totalAmountTTC: Number(item.total_amount_ttc),
      createdAt: item.created_at ? new Date(item.created_at) : new Date(),
      updatedAt: item.updated_at ? new Date(item.updated_at) : undefined,
      productType:
        item.productType ||
        item.product_type ||
        (item.description?.toLowerCase().includes('slitting') ? 'steel_slitting'
        : item.description?.toLowerCase().includes('coil') ? 'coil'
        : item.description?.toLowerCase().includes('corrugated') ? 'corrugated_sheet'
        : undefined),
    })),
    totalAmountHT: Number(sale.total_amount_ht ?? sale.total_amount),
    totalAmountTTC: Number(sale.total_amount_ttc),
    isInvoiced: !!sale.is_invoiced,
    invoiceId: sale.invoice_id,
    notes: sale.notes,
    paymentMethod: sale.payment_method,
    transportationFee: sale.transportation_fee,
    taxRate: sale.tax_rate,
    createdAt: new Date(sale.created_at),
    updatedAt: sale.updated_at ? new Date(sale.updated_at) : undefined,
    isPaid: !!sale.is_paid,
    paidAt: sale.paid_at ? new Date(sale.paid_at) : undefined
  }));
};

export const getDeletedSales = async (): Promise<Sale[]> => {
  const backendSales = await tauriApi.sales.getDeleted() as any[];
  if (!Array.isArray(backendSales)) return [];
  return backendSales.map((sale: any) => ({
    id: sale.id,
    clientId: sale.client_id,
    date: new Date(sale.date),
    items: (sale.items || []).map((item: any) => ({
      id: item.id,
      saleId: sale.id,
      description: item.description,
      coilRef: item.coil_ref,
      coilThickness: item.coil_thickness,
      coilWidth: item.coil_width,
      topCoatRAL: item.top_coat_ral,
      backCoatRAL: item.back_coat_ral,
      coilWeight: item.coil_weight,
      quantity: Number(item.quantity),
      pricePerTon: Number(item.price_per_ton),
      totalAmountHT: Number(item.total_amount_ht ?? item.total_amount),
      totalAmountTTC: Number(item.total_amount_ttc),
      createdAt: item.created_at ? new Date(item.created_at) : new Date(),
      updatedAt: item.updated_at ? new Date(item.updated_at) : undefined,
      productType:
        item.productType ||
        item.product_type ||
        (item.description?.toLowerCase().includes('slitting') ? 'steel_slitting'
        : item.description?.toLowerCase().includes('coil') ? 'coil'
        : item.description?.toLowerCase().includes('corrugated') ? 'corrugated_sheet'
        : undefined),
    })),
    totalAmountHT: Number(sale.total_amount_ht ?? sale.total_amount),
    totalAmountTTC: Number(sale.total_amount_ttc),
    isInvoiced: !!sale.is_invoiced,
    invoiceId: sale.invoice_id,
    notes: sale.notes,
    paymentMethod: sale.payment_method,
    transportationFee: sale.transportation_fee,
    taxRate: sale.tax_rate,
    createdAt: new Date(sale.created_at),
    updatedAt: sale.updated_at ? new Date(sale.updated_at) : undefined,
    isPaid: !!sale.is_paid,
    paidAt: sale.paid_at ? new Date(sale.paid_at) : undefined
  }));
};

export const restoreSale = async (id: string): Promise<void> => {
  await tauriApi.sales.restore(id);
};

export const deleteSale = async (id: string): Promise<void> => {
  try {
    await tauriApi.sales.delete(id);
  } catch (error: any) {
    // Rethrow error so UI can display a warning
    throw error;
  }
};

export const getSaleById = async (id: string): Promise<Sale | null> => {
  try {
    return (await tauriApi.sales.getById(id)) as Sale;
  } catch (error) {
    console.error('Error fetching sale:', error);
    throw error;
  }
};

export const createSale = async (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sale> => {
  try {
    // Ensure date is a valid ISO string
    let dateString: string = "";
    if (sale.date instanceof Date && !isNaN(sale.date.getTime())) {
      dateString = sale.date.toISOString();
    } else if (typeof sale.date === 'string' && sale.date.length > 0) {
      // Try to parse and re-serialize
      const d = new Date(sale.date);
      dateString = !isNaN(d.getTime()) ? d.toISOString() : "";
    }
    // Ensure paidAt is a valid ISO string or null
    let paidAtString: string | null = null;
    if (sale.paidAt instanceof Date && !isNaN(sale.paidAt.getTime())) {
      paidAtString = sale.paidAt.toISOString();
    } else if (typeof sale.paidAt === 'string' && sale.paidAt.length > 0) {
      const d = new Date(sale.paidAt);
      paidAtString = !isNaN(d.getTime()) ? d.toISOString() : null;
    }
    const backendSale: any = {
      client_id: sale.clientId,
      date: dateString,
      total_amount: typeof sale.totalAmountHT === 'number' ? sale.totalAmountHT : 0,
      total_amount_ttc: typeof sale.totalAmountTTC === 'number' ? sale.totalAmountTTC : 0,
      is_invoiced: sale.isInvoiced ?? false,
      invoice_id: sale.invoiceId ?? null,
      notes: sale.notes ?? "",
      payment_method: sale.paymentMethod ?? null,
      transportation_fee: typeof sale.transportationFee === 'number' ? sale.transportationFee : 0,
      tax_rate: typeof sale.taxRate === 'number' ? sale.taxRate : 0,
      is_paid: sale.isPaid ?? false,
      paid_at: paidAtString,
      items: (sale.items || []).map(item => ({
        description: item.description,
        coil_ref: item.coilRef ?? null,
        coil_thickness: typeof item.coilThickness === 'number' ? item.coilThickness : 0,
        coil_width: typeof item.coilWidth === 'number' ? item.coilWidth : 0,
        top_coat_ral: item.topCoatRAL ?? null,
        back_coat_ral: item.backCoatRAL ?? null,
        coil_weight: typeof item.coilWeight === 'number' ? item.coilWeight : 0,
        quantity: typeof item.quantity === 'number' ? item.quantity : 0,
        price_per_ton: typeof item.pricePerTon === 'number' ? item.pricePerTon : 0,
        total_amount: typeof item.totalAmountHT === 'number' ? item.totalAmountHT : 0,
        product_type: item.productType ?? 'coil',
      }))
    };
    console.log('[createSale] Payload to backend:', JSON.stringify(backendSale, null, 2));
    return await tauriApi.sales.create(backendSale);
  } catch (error) {
    console.error('Error creating sale:', error);
    throw error;
  }
};

export const updateSale = async (id: string, sale: Partial<Sale>): Promise<Sale> => {
  // Always fetch the existing sale
  const existing = await getSaleById(id);
  if (!existing) throw new Error('Sale not found');
  const merged = { ...existing, ...sale };
  // Validate required fields
  if (!merged.clientId) throw new Error('clientId is required');
  if (!merged.date) throw new Error('date is required');
  if (!merged.totalAmountHT && merged.totalAmountHT !== 0) throw new Error('totalAmountHT is required');
  if (!merged.totalAmountTTC && merged.totalAmountTTC !== 0) throw new Error('totalAmountTTC is required');
  if (typeof merged.isInvoiced !== 'boolean') throw new Error('isInvoiced is required');
  if (!Array.isArray(merged.items) || merged.items.length === 0) throw new Error('At least one sale item is required');
  if (typeof merged.taxRate !== 'number') throw new Error('taxRate is required');
  // Ensure all items have pricePerTon and required fields
  const items = (merged.items || []).map((item: any, idx: number) => {
    if (item.pricePerTon == null) {
      throw new Error(`Sale item at index ${idx} is missing pricePerTon`);
    }
    if (!item.description) {
      throw new Error(`Sale item at index ${idx} is missing description`);
    }
    if (typeof item.quantity !== 'number') {
      throw new Error(`Sale item at index ${idx} is missing quantity`);
    }
    if (typeof item.totalAmountHT !== 'number') {
      throw new Error(`Sale item at index ${idx} is missing totalAmountHT`);
    }
    if (typeof item.totalAmountTTC !== 'number') {
      throw new Error(`Sale item at index ${idx} is missing totalAmountTTC`);
    }
    if (!item.productType) {
      throw new Error(`Sale item at index ${idx} is missing productType`);
    }
    return {
      description: item.description,
      coil_ref: item.coilRef ?? null,
      coil_thickness: item.coilThickness ?? null,
      coil_width: item.coilWidth ?? null,
      top_coat_ral: item.topCoatRAL ?? null,
      back_coat_ral: item.backCoatRAL ?? null,
      coil_weight: item.coilWeight ?? null,
      quantity: item.quantity,
      price_per_ton: item.pricePerTon,
      total_amount: item.totalAmountHT,
      product_type: item.productType,
    };
  });
  function flattenAndClean(obj: Record<string, any>) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined && v !== null)
    );
  }
  const backendSale: any = flattenAndClean({
    client_id: merged.clientId,
    date:
      merged.date instanceof Date
        ? merged.date.toISOString()
        : (typeof merged.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(merged.date))
          ? new Date(merged.date).toISOString()
          : merged.date,
    total_amount: merged.totalAmountHT,
    total_amount_ttc: merged.totalAmountTTC,
    is_invoiced: merged.isInvoiced,
    invoice_id: merged.invoiceId,
    notes: merged.notes,
    payment_method: merged.paymentMethod,
    transportation_fee: merged.transportationFee,
    tax_rate: merged.taxRate,
    is_paid: merged.isPaid ?? false,
    paid_at: merged.paidAt ? (merged.paidAt instanceof Date ? merged.paidAt.toISOString() : merged.paidAt) : null,
    items,
  });
  // Final check for undefined or NaN fields
  Object.entries(backendSale).forEach(([k, v]) => {
    if (v === undefined) {
      throw new Error(`Field ${k} is undefined`);
    }
    if (typeof v === 'number' && isNaN(v)) {
      throw new Error(`Field ${k} is NaN`);
    }
  });
  // Log the payload for debugging
  console.log('[updateSale] Payload to backend:', JSON.stringify(backendSale, null, 2));
  try {
    const result = await tauriApi.sales.update(id, backendSale);
    console.log('[updateSale] Backend result:', result);
    return result;
  } catch (error) {
    console.error('[updateSale] Error updating sale:', error, '\nPayload:', backendSale);
    throw error;
  }
};

export const markSaleAsInvoiced = async (saleId: string, invoiceId: string): Promise<void> => {
  try {
    await tauriApi.sales.markInvoiced(saleId, invoiceId);
  } catch (error) {
    console.error('Error marking sale as invoiced:', error);
    throw error;
  }
};

export const unmarkSaleAsInvoiced = async (saleId: string): Promise<void> => {
  try {
    await tauriApi.sales.unmarkInvoiced(saleId);
  } catch (error) {
    console.error('Error unmarking sale as invoiced:', error);
    throw error;
  }
};

// TODO: Implement updateSale and other advanced sale operations when backend support is available.
