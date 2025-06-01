import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ClientDetail from '../ClientDetail';
import { AppContext, AppContextType } from '../../context/AppContext';
import { LanguageContext } from '../../context/LanguageContext';
import { formatCurrency } from '@/utils/format';
import type { Client, Sale, Invoice, Payment } from '@/types';

// Mock translation function that includes the common labels
const t = (key: string) => {
  const translations: { [key: string]: string } = {
    'clientDetails.salesTotal': 'Sales Total',
    'clientDetails.invoicedAmount': 'Invoiced Amount',
    'clientDetails.uninvoicedAmount': 'Uninvoiced Amount',
    'clientDetails.paidAmount': 'Paid Amount',
    'clientDetails.creditBalance': 'Credit Balance',
    'clientDetails.outstandingDebt': 'Outstanding Debt'
  };
  return translations[key] || key;
};

// Helper type for mocked data in renderWithProviders
interface MockData {
  mockSales?: Sale[];
  mockInvoices?: Invoice[];
  mockPayments?: Payment[];
  creditBalance?: number;
}

const mockClient: Client = {
  id: 'client1',
  name: 'Hicham',
  email: 'hicham@example.com',
  phone: '123456789',
  address: '123 Main St',
  createdAt: new Date()
};

// Match both translated text and currency amounts
const findByTextAndAmount = (text: string, amount: number) => {
  return screen.getByText((_content: string, element: Element | null) => {
    if (!element || !element.textContent) return false;
    // Format the amount using the same currency formatter as the component
    const formattedAmount = formatCurrency(amount);
    // Extract just the numeric part from the formatted amount (remove currency symbol and spaces)
    const numericPart = formattedAmount.replace(/[^0-9.,]/g, '');
    // Get the translated text
    const translatedText = t(text);
    // The element's text content should contain both the translated text and the numeric amount
    return element.textContent.includes(translatedText) && 
           element.textContent.includes(numericPart);
  });
};

// Create a mock context value with all required methods
const mockContextValue: Partial<AppContextType> = {
  clients: [mockClient],
  sales: [],
  invoices: [],
  payments: [],
  loading: { clients: false, sales: false, invoices: false, payments: false },
  getClientById: jest.fn().mockReturnValue(mockClient),
  getSalesByClient: jest.fn().mockReturnValue([]),
  getInvoicesByClient: jest.fn().mockReturnValue([]),
  getPaymentsBySale: jest.fn().mockReturnValue([]),
  getClientDebt: jest.fn().mockReturnValue(0),
  getClientCreditBalance: jest.fn().mockReturnValue(0),
  getSaleById: jest.fn(),
  addClient: jest.fn(),
  updateClient: jest.fn(),
  deleteClient: jest.fn(),
  addSale: jest.fn(),
  updateSale: jest.fn(),
  deleteSale: jest.fn(),
  addInvoice: jest.fn(),
  updateInvoice: jest.fn(),
  deleteInvoice: jest.fn(),
  deletePayment: jest.fn(),
  addPayment: jest.fn(),
  addBulkPayment: jest.fn()
};

// Helper function to render with all required providers
const renderWithProviders = (
  ui: React.ReactElement,
  { mockSales = [], mockInvoices = [], mockPayments = [], creditBalance = 0 }: MockData = {}
) => {
  const contextValue = {
    ...mockContextValue,
    getSalesByClient: jest.fn().mockReturnValue(mockSales),
    getInvoicesByClient: jest.fn().mockReturnValue(mockInvoices),
    getPaymentsBySale: jest.fn().mockReturnValue(mockPayments),
    getClientCreditBalance: jest.fn().mockReturnValue(creditBalance)
  };

  return render(
    <AppContext.Provider value={contextValue as AppContextType}>
      <LanguageContext.Provider value={{ t } as any}>
        <MemoryRouter initialEntries={['/clients/client1']}>
          <Routes>
            <Route path="/clients/:id" element={ui} />
          </Routes>
        </MemoryRouter>
      </LanguageContext.Provider>
    </AppContext.Provider>
  );
};

describe('ClientDetail Financial Calculations', () => {
  it('displays client with no financial history', () => {
    renderWithProviders(<ClientDetail />);
    expect(screen.getByText('Hicham')).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(0))).toBeInTheDocument();
  });

  it('displays correct amounts for unpaid invoice', () => {
    const sale = {
      id: 'sale1',
      clientId: 'client1',
      date: new Date('2025-05-29'),
      items: [
        {
          id: 'item1',
          description: 'Product 1',
          quantity: 1,
          pricePerTon: 1000,
          totalAmountHT: 1000,
          totalAmountTTC: 1190 // Including 19% tax
        }
      ],
      totalAmountHT: 1000,
      totalAmountTTC: 1190,
      isInvoiced: true,
      invoiceId: 'inv1'
    };
    const invoice = {
      id: 'inv1',
      invoiceNumber: 'INV-001',
      clientId: 'client1',
      salesIds: ['sale1'],
      date: new Date('2025-05-29'),
      dueDate: new Date('2025-06-29'),
      totalAmountHT: 1000,
      totalAmountTTC: 1190,
      isPaid: false
    };
    
    renderWithProviders(<ClientDetail />, {
      mockSales: [sale],
      mockInvoices: [invoice],
      mockPayments: []
    });

    // Total sales amount should be 1190 (including tax)
    expect(screen.getByText(formatCurrency(1190))).toBeInTheDocument();
    
    // Outstanding debt should be 1190 since nothing is paid
    expect(findByTextAndAmount('clientDetails.outstandingDebt', 1190)).toBeInTheDocument();
    
    // Paid amount should be 0
    expect(findByTextAndAmount('clientDetails.paidAmount', 0)).toBeInTheDocument();
  });

  it('displays correct amounts when invoice is paid with matching payment records', () => {
    const sale = {
      id: 'sale1',
      clientId: 'client1',
      date: new Date('2025-05-29'),
      items: [
        {
          id: 'item1',
          description: 'Product 1',
          quantity: 1,
          pricePerTon: 1000,
          totalAmountHT: 1000,
          totalAmountTTC: 1190 // Including 19% tax
        }
      ],
      totalAmountHT: 1000,
      totalAmountTTC: 1190,
      isInvoiced: true,
      invoiceId: 'inv1'
    };
    const invoice = {
      id: 'inv1',
      invoiceNumber: 'INV-001',
      clientId: 'client1',
      salesIds: ['sale1'],
      date: new Date('2025-05-29'),
      dueDate: new Date('2025-06-29'),
      totalAmountHT: 1000,
      totalAmountTTC: 1190,
      isPaid: true
    };
    const payment = {
      id: 'pay1',
      saleId: 'sale1',
      clientId: 'client1',
      amount: 1190,
      date: new Date('2025-05-29'),
      method: 'cash'
    };

    renderWithProviders(<ClientDetail />, {
      mockSales: [sale],
      mockInvoices: [invoice],
      mockPayments: [payment]
    });

    // Total sales amount should be 1190 (including tax)
    expect(screen.getByText(formatCurrency(1190))).toBeInTheDocument();

    // Paid amount should be 1190
    expect(findByTextAndAmount('clientDetails.paidAmount', 1190)).toBeInTheDocument();

    // Outstanding debt should be 0
    expect(findByTextAndAmount('clientDetails.outstandingDebt', 0)).toBeInTheDocument();
  });

  it('displays correct amounts when invoice is paid but has no payment records', () => {
    const sale = {
      id: 'sale1',
      clientId: 'client1',
      date: new Date('2025-05-29'),
      items: [
        {
          id: 'item1',
          description: 'Product 1',
          quantity: 1,
          pricePerTon: 1000,
          totalAmountHT: 1000,
          totalAmountTTC: 1190 // Including 19% tax
        }
      ],
      totalAmountHT: 1000,
      totalAmountTTC: 1190,
      isInvoiced: true,
      invoiceId: 'inv1'
    };
    const invoice = {
      id: 'inv1',
      invoiceNumber: 'INV-001',
      clientId: 'client1',
      salesIds: ['sale1'],
      date: new Date('2025-05-29'),
      dueDate: new Date('2025-06-29'),
      totalAmountHT: 1000,
      totalAmountTTC: 1190,
      isPaid: true
    };

    renderWithProviders(<ClientDetail />, {
      mockSales: [sale],
      mockInvoices: [invoice],
      mockPayments: [] // No payment records
    });

    // Total sales amount should be 1190
    expect(screen.getByText(formatCurrency(1190))).toBeInTheDocument();

    // Paid amount should be 0 since there are no payment records
    expect(findByTextAndAmount('clientDetails.paidAmount', 0)).toBeInTheDocument();

    // Outstanding debt should be 1190
    expect(findByTextAndAmount('clientDetails.outstandingDebt', 1190)).toBeInTheDocument();
  });

  it('displays correct amounts with multiple sales and partial payments', () => {
    const sale1 = {
      id: 'sale1',
      clientId: 'client1',
      date: new Date('2025-05-29'),
      items: [
        {
          id: 'item1',
          description: 'Product 1',
          quantity: 1,
          pricePerTon: 1000,
          totalAmountHT: 1000,
          totalAmountTTC: 1190 // Including 19% tax
        }
      ],
      totalAmountHT: 1000,
      totalAmountTTC: 1190,
      isInvoiced: true,
      invoiceId: 'inv1'
    };
    const sale2 = {
      id: 'sale2',
      clientId: 'client1',
      date: new Date('2025-05-30'),
      items: [
        {
          id: 'item2',
          description: 'Product 2',
          quantity: 2,
          pricePerTon: 1000,
          totalAmountHT: 2000,
          totalAmountTTC: 2380 // Including 19% tax
        }
      ],
      totalAmountHT: 2000,
      totalAmountTTC: 2380,
      isInvoiced: true,
      invoiceId: 'inv2'
    };
    const invoice1 = {
      id: 'inv1',
      invoiceNumber: 'INV-001',
      clientId: 'client1',
      salesIds: ['sale1'],
      date: new Date('2025-05-29'),
      dueDate: new Date('2025-06-29'),
      totalAmountHT: 1000,
      totalAmountTTC: 1190,
      isPaid: false
    };
    const invoice2 = {
      id: 'inv2',
      invoiceNumber: 'INV-002',
      clientId: 'client1',
      salesIds: ['sale2'],
      date: new Date('2025-05-30'),
      dueDate: new Date('2025-06-30'),
      totalAmountHT: 2000,
      totalAmountTTC: 2380,
      isPaid: false
    };
    const payment1 = {
      id: 'pay1',
      saleId: 'sale1',
      clientId: 'client1',
      amount: 1190,
      date: new Date('2025-05-29'),
      method: 'cash'
    };
    const payment2 = {
      id: 'pay2',
      saleId: 'sale2',
      clientId: 'client1',
      amount: 1000,
      date: new Date('2025-05-30'),
      method: 'check'
    };

    renderWithProviders(<ClientDetail />, {
      mockSales: [sale1, sale2],
      mockInvoices: [invoice1, invoice2],
      mockPayments: [payment1, payment2]
    });

    // Total sales amount should be 3570 (1190 + 2380)
    expect(screen.getByText(formatCurrency(3570))).toBeInTheDocument();

    // Total paid amount should be 2190 (1190 + 1000)
    expect(findByTextAndAmount('clientDetails.paidAmount', 2190)).toBeInTheDocument();

    // Outstanding debt should be 1380 (3570 - 2190)
    expect(findByTextAndAmount('clientDetails.outstandingDebt', 1380)).toBeInTheDocument();
  });

  it('handles credit balance correctly', () => {
    const sale = {
      id: 'sale1',
      clientId: 'client1',
      date: new Date('2025-05-29'),
      items: [
        {
          id: 'item1',
          description: 'Product 1',
          quantity: 1,
          pricePerTon: 1000,
          totalAmountHT: 1000,
          totalAmountTTC: 1190 // Including 19% tax
        }
      ],
      totalAmountHT: 1000,
      totalAmountTTC: 1190,
      isInvoiced: true,
      invoiceId: 'inv1'
    };
    const invoice = {
      id: 'inv1',
      invoiceNumber: 'INV-001',
      clientId: 'client1',
      salesIds: ['sale1'],
      date: new Date('2025-05-29'),
      dueDate: new Date('2025-06-29'),
      totalAmountHT: 1000,
      totalAmountTTC: 1190,
      isPaid: true
    };
    const payment = {
      id: 'pay1',
      saleId: 'sale1',
      clientId: 'client1',
      amount: 1200, // Overpayment
      date: new Date('2025-05-29'),
      method: 'cash'
    };

    renderWithProviders(<ClientDetail />, {
      mockSales: [sale],
      mockInvoices: [invoice],
      mockPayments: [payment],
      creditBalance: 200 // Credit balance from overpayment
    });

    // Should show credit balance of 200
    expect(findByTextAndAmount('clientDetails.creditBalance', 200)).toBeInTheDocument();

    // Outstanding debt should be 0 since payment exceeds total amount
    expect(findByTextAndAmount('clientDetails.outstandingDebt', 0)).toBeInTheDocument();
  });
});
