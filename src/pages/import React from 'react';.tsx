import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientDetail from './ClientDetail';
import { useAppContext } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// src/pages/ClientDetail.test.tsx

// Mock AppContext and LanguageContext
jest.mock('@/context/AppContext');
jest.mock('@/context/LanguageContext');
jest.mock('sonner', () => ({ toast: { success: jest.fn() } }));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'client-1' }),
}));

const t = (key: string) => key;

const janeDoe = {
  id: 'client-1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '123456789',
};

const sale = {
  id: 'sale-1',
  clientId: 'client-1',
  date: new Date('2024-06-01'),
  items: [{ id: 'item-1', name: 'Product', quantity: 1, price: 100 }],
  totalAmountTTC: 100,
  isInvoiced: true,
  invoiceId: 'inv-1',
};

const invoice = {
  id: 'inv-1',
  clientId: 'client-1',
  invoiceNumber: 'INV-001',
  date: new Date('2024-06-02'),
  dueDate: new Date('2024-06-10'),
  totalAmountTTC: 100,
  isPaid: true,
};

const payment = {
  id: 'pay-1',
  saleId: 'sale-1',
  date: new Date('2024-06-03'),
  amount: 100,
  method: 'cash',
};

function setupAppContext({
  client = janeDoe,
  sales = [],
  invoices = [],
  payments = [],
  creditBalance = 0,
  loading = { clients: false, sales: false, payments: false },
} = {}) {
  (useAppContext as jest.Mock).mockReturnValue({
    getClientById: (id: string) => (id === client?.id ? client : undefined),
    deleteClient: jest.fn(),
    getSalesByClient: (id: string) => (id === client?.id ? sales : []),
    getInvoicesByClient: (id: string) => (id === client?.id ? invoices : []),
    getClientDebt: () => Math.max(0, sales.reduce((t, s) => t + s.totalAmountTTC, 0) - payments.reduce((t, p) => t + p.amount, 0)),
    getPaymentsBySale: (saleId: string) => payments.filter(p => p.saleId === saleId),
    getClientCreditBalance: () => creditBalance,
    getSaleById: (id: string) => sales.find(s => s.id === id),
    loading,
  });
  (useLanguage as jest.Mock).mockReturnValue({ t });
}

describe('ClientDetail', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders loading state', () => {
    setupAppContext({ loading: { clients: true, sales: false, payments: false } });
    render(<ClientDetail />);
    expect(screen.getByText('general.loading')).toBeInTheDocument();
  });

  it('renders not found state', () => {
    setupAppContext({ client: undefined });
    render(<ClientDetail />);
    expect(screen.getByText('general.error')).toBeInTheDocument();
    expect(screen.getByText('clients.notFound')).toBeInTheDocument();
  });

  it('renders client with no sales/invoices/payments', () => {
    setupAppContext();
    render(<ClientDetail />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('sales.noSales')).toBeInTheDocument();
    expect(screen.getByText('No invoices for this client.')).toBeInTheDocument();
    expect(screen.getByText('general.noData')).toBeInTheDocument();
    expect(screen.getByText('clientDetails.salesTotal:')).toBeInTheDocument();
    expect(screen.getByText('0.00')).toBeInTheDocument();
  });

  it('renders client with sale, invoice, and payment', () => {
    setupAppContext({
      sales: [sale],
      invoices: [invoice],
      payments: [{ ...payment, sale }],
    });
    render(<ClientDetail />);
    // Sales tab
    expect(screen.getByText('sales.history')).toBeInTheDocument();
    expect(screen.getByText('Product')).not.toBeInTheDocument(); // Only item count shown
    expect(screen.getByText('1 general.items')).toBeInTheDocument();
    expect(screen.getByText('100.00')).toBeInTheDocument();
    // Invoice tab
    fireEvent.click(screen.getByText('invoices.title'));
    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();
    // Payments tab
    fireEvent.click(screen.getByText('form.payment.title'));
    expect(screen.getByText('payments.methods.cash')).toBeInTheDocument();
    expect(screen.getAllByText('100.00').length).toBeGreaterThan(0);
    // Financial summary
    expect(screen.getByText('clientDetails.salesTotal:')).toBeInTheDocument();
    expect(screen.getByText('clientDetails.invoicedAmount:')).toBeInTheDocument();
    expect(screen.getByText('clientDetails.paidAmount:')).toBeInTheDocument();
  });

  it('shows credit balance if present', () => {
    setupAppContext({
      sales: [sale],
      invoices: [invoice],
      payments: [{ ...payment, sale }],
      creditBalance: 50,
    });
    render(<ClientDetail />);
    expect(screen.getByText('clientDetails.creditBalance:')).toBeInTheDocument();
    expect(screen.getByText('50.00')).toBeInTheDocument();
  });

  it('opens and closes edit dialog', () => {
    setupAppContext();
    render(<ClientDetail />);
    fireEvent.click(screen.getByText('general.edit'));
    expect(screen.getByText('Edit Client')).toBeInTheDocument();
    // Simulate dialog close
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
  });

  it('handles delete client', () => {
    setupAppContext();
    window.confirm = jest.fn(() => true);
    render(<ClientDetail />);
    fireEvent.click(screen.getByText('general.delete'));
    expect(window.confirm).toHaveBeenCalled();
  });

  it('navigates back on back button', () => {
    setupAppContext();
    render(<ClientDetail />);
    fireEvent.click(screen.getByText('general.back'));
    expect(mockNavigate).toHaveBeenCalledWith('/clients');
  });
});