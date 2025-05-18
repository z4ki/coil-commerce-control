// Place this file in src/contexts/AppContext.tsx
// This is a partial update that replaces the relevant useEffect in your AppContext

// ... all existing imports ...

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Client, Sale, Invoice, Payment, SalesSummary, DebtSummary } from '@/types';
import * as clientService from '@/services/clientService';
import * as saleService from '@/services/saleService';
import * as invoiceService from '@/services/invoiceService';
import * as paymentService from '@/services/paymentService';

interface AppContextType {
  clients: Client[];
  sales: Sale[];
  invoices: Invoice[];
  payments: Payment[];
  loading: {
    clients: boolean;
    sales: boolean;
    invoices: boolean;
    payments: boolean;
  };
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<Client>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClientById: (id: string) => Client | undefined;
  getSalesByClient: (clientId: string) => Sale[];
  getInvoicesByClient: (clientId: string) => Invoice[];
  getSalesSummary: () => SalesSummary;
  getDebtSummary: () => DebtSummary;
  getClientDebt: (clientId: string) => number;
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<Sale>;
  updateSale: (id: string, sale: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  getSaleById: (id: string) => Sale | undefined;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Promise<Invoice>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  getInvoiceById: (id: string) => Invoice | undefined;
  getPaymentsByInvoice: (invoiceId: string) => Payment[];
  getInvoiceRemainingAmount: (invoiceId: string) => number;
  deletePayment: (id: string) => Promise<void>;
  addPayment: (invoiceId: string, paymentData: { 
    date: Date; 
    amount: number; 
    method: 'cash' | 'bank_transfer' | 'check' | 'credit_card'; 
    notes?: string 
  }) => Promise<Payment>;
  updatePayment: (id: string, paymentData: Partial<{
    date: Date;
    amount: number;
    method: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
    notes?: string;
  }>) => Promise<Payment>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState({
    clients: false,
    sales: false,
    invoices: false,
    payments: false
  });

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        setLoading({ clients: true, sales: true, invoices: true, payments: true });

        const [clientsData, salesData, invoicesData] = await Promise.all([
          clientService.getClients(),
          saleService.getSales(),
          invoiceService.getInvoices()
        ]);

        if (!isMounted) return;

        setClients(clientsData);
        setSales(salesData);
        setInvoices(invoicesData);
        setLoading(prev => ({ ...prev, clients: false, sales: false, invoices: false }));

        const allPayments: Payment[] = [];
        const batchSize = 5;
        for (let i = 0; i < invoicesData.length; i += batchSize) {
          const batch = invoicesData.slice(i, i + batchSize);
          const batchPayments = await Promise.all(
            batch.map(invoice =>
              paymentService.getPaymentsByInvoiceId(invoice.id).catch(err => {
                console.error(`Payment error for ${invoice.id}:`, err);
                return [];
              })
            )
          );
          allPayments.push(...batchPayments.flat());
        }

        if (isMounted) {
          setPayments(allPayments);
          setLoading(prev => ({ ...prev, payments: false }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data. Please refresh.');
        setLoading({ clients: false, sales: false, invoices: false, payments: false });
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []); // No dependencies since we removed auth

  const addClient = async (client: Omit<Client, 'id' | 'createdAt'>) => {
    return await clientService.createClient(client);
  };

  const updateClient = async (id: string, client: Partial<Client>) => {
    await clientService.updateClient(id, client);
  };

  const deleteClient = async (id: string) => {
    await clientService.deleteClient(id);
  };

  const getClientById = (id: string) => {
    return clients.find(client => client.id === id);
  };

  const getSalesByClient = (clientId: string) => {
    return sales.filter(sale => sale.clientId === clientId);
  };

  const getInvoicesByClient = (clientId: string) => {
    return invoices.filter(invoice => invoice.clientId === clientId);
  };

  const getSalesSummary = (): SalesSummary => {
    const totalSales = sales.length;
    const invoicedSales = sales.filter(sale => sale.isInvoiced).length;
    const uninvoicedSales = totalSales - invoicedSales;

    // Group sales by month
    const monthlySales = sales.reduce((acc: { month: string; amount: number }[], sale) => {
      const month = new Date(sale.date).toLocaleString('default', { month: 'long' });
      const existingMonth = acc.find(m => m.month === month);
      if (existingMonth) {
        existingMonth.amount += sale.totalAmount;
      } else {
        acc.push({ month, amount: sale.totalAmount });
      }
      return acc;
    }, []);

    return {
      totalSales,
      invoicedSales,
      uninvoicedSales,
      monthlySales
    };
  };

  const getDebtSummary = (): DebtSummary => {
    const unpaidInvoices = invoices.filter(inv => !inv.isPaid);
    const totalDebt = unpaidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const overdueDebt = unpaidInvoices
      .filter(inv => new Date(inv.dueDate) < new Date())
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    const upcomingDebt = totalDebt - overdueDebt;

    const debtByClient = unpaidInvoices.reduce((acc: { clientId: string; clientName: string; amount: number }[], inv) => {
      const client = getClientById(inv.clientId);
      if (!client) return acc;

      const existingClient = acc.find(c => c.clientId === inv.clientId);
      if (existingClient) {
        existingClient.amount += inv.totalAmount;
      } else {
        acc.push({
          clientId: inv.clientId,
          clientName: client.name,
          amount: inv.totalAmount
        });
      }
      return acc;
    }, []);

    return {
      totalDebt,
      overdueDebt,
      upcomingDebt,
      debtByClient
    };
  };

  const getClientDebt = (clientId: string): number => {
    const clientInvoices = invoices.filter(inv => inv.clientId === clientId && !inv.isPaid);
    return clientInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  };

  const addSale = async (sale: Omit<Sale, 'id' | 'createdAt'>) => {
    const newSale = await saleService.createSale(sale);
    setSales(prev => [...prev, newSale]);
    return newSale;
  };

  const updateSale = async (id: string, sale: Partial<Sale>) => {
    try {
      const updatedSale = await saleService.updateSale(id, sale);
      setSales(prev => prev.map(s => s.id === id ? updatedSale : s));
    } catch (error) {
      console.error('Error updating sale:', error);
      throw error;
    }
  };

  const deleteSale = async (id: string) => {
    await saleService.deleteSale(id);
    setSales(prev => prev.filter(s => s.id !== id));
  };

  const getSaleById = (id: string) => {
    return sales.find(sale => sale.id === id);
  };

  const addInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    const newInvoice = await invoiceService.createInvoice(invoice);
    setInvoices(prev => [...prev, newInvoice]);

    // Mark related sales as invoiced
    if (invoice.salesIds) {
      await Promise.all(
        invoice.salesIds.map(saleId =>
          updateSale(saleId, { isInvoiced: true, invoiceId: newInvoice.id })
        )
      );
    }

    return newInvoice;
  };

  const updateInvoice = async (id: string, invoice: Partial<Invoice>) => {
    await invoiceService.updateInvoice(id, invoice);
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...invoice } : i));

    // Update related sales if salesIds have changed
    const existingInvoice = invoices.find(i => i.id === id);
    if (existingInvoice && invoice.salesIds) {
      // Unmark previously invoiced sales
      await Promise.all(
        existingInvoice.salesIds
          .filter(saleId => !invoice.salesIds?.includes(saleId))
          .map(saleId => updateSale(saleId, { isInvoiced: false, invoiceId: null }))
      );

      // Mark newly added sales as invoiced
      await Promise.all(
        invoice.salesIds
          .filter(saleId => !existingInvoice.salesIds.includes(saleId))
          .map(saleId => updateSale(saleId, { isInvoiced: true, invoiceId: id }))
      );
    }
  };

  const deleteInvoice = async (id: string) => {
    const invoice = invoices.find(i => i.id === id);
    if (invoice) {
      // Unmark all related sales as invoiced
      await Promise.all(
        invoice.salesIds.map(saleId =>
          updateSale(saleId, { isInvoiced: false, invoiceId: null })
        )
      );
    }

    await invoiceService.deleteInvoice(id);
    setInvoices(prev => prev.filter(i => i.id !== id));
  };

  const getInvoiceById = (id: string) => {
    return invoices.find(invoice => invoice.id === id);
  };

  const getPaymentsByInvoice = (invoiceId: string) => {
    return payments.filter(payment => payment.invoiceId === invoiceId);
  };

  const getInvoiceRemainingAmount = (invoiceId: string) => {
    const invoice = getInvoiceById(invoiceId);
    if (!invoice) return 0;

    // Calculate TTC (Total with tax)
    const totalTTC = invoice.totalAmount * 1.19; // Adding 19% TVA

    const totalPaid = getPaymentsByInvoice(invoiceId)
      .reduce((sum, payment) => sum + payment.amount, 0);

    return totalTTC - totalPaid;
  };

  const deletePayment = async (id: string) => {
    await paymentService.deletePayment(id);
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  const addPayment = async (invoiceId: string, paymentData: { 
    date: Date; 
    amount: number; 
    method: 'cash' | 'bank_transfer' | 'check' | 'credit_card'; 
    notes?: string 
  }) => {
    const newPayment = await paymentService.createPayment(invoiceId, paymentData);
    setPayments(prev => [...prev, newPayment]);
    return newPayment;
  };

  const updatePayment = async (id: string, paymentData: Partial<{
    date: Date;
    amount: number;
    method: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
    notes?: string;
  }>) => {
    const updatedPayment = await paymentService.updatePayment(id, paymentData);
    setPayments(prev => prev.map(p => p.id === id ? updatedPayment : p));
    return updatedPayment;
  };

  return (
    <AppContext.Provider value={{
      clients,
      sales,
      invoices,
      payments,
      loading,
      addClient,
      updateClient,
      deleteClient,
      getClientById,
      getSalesByClient,
      getInvoicesByClient,
      getSalesSummary,
      getDebtSummary,
      getClientDebt,
      addSale,
      updateSale,
      deleteSale,
      getSaleById,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      getInvoiceById,
      getPaymentsByInvoice,
      getInvoiceRemainingAmount,
      addPayment,
      updatePayment,
      deletePayment
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
