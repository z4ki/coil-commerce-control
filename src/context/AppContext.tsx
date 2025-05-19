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

    // Calculate total amount
    const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmountTTC, 0);

    // Group sales by month and sort by date
    const monthlySales = sales
      .reduce((acc: { month: string; amountTTC: number }[], sale) => {
        const month = new Date(sale.date).toLocaleString('default', { month: 'long' });
        const existingMonth = acc.find(m => m.month === month);
        if (existingMonth) {
          existingMonth.amountTTC += sale.totalAmountTTC;
        } else {
          acc.push({ month, amountTTC: sale.totalAmountTTC });
        }
        return acc;
      }, [])
      .sort((a, b) => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return months.indexOf(a.month) - months.indexOf(b.month);
      });

    return {
      totalSales,
      invoicedSales,
      uninvoicedSales,
      totalAmount,
      monthlySales
    };
  };

  const getDebtSummary = (): DebtSummary => {
    // Calculate total sales amount for each client
    const debtByClient = clients.reduce((acc: { clientId: string; clientName: string; amountTTC: number }[], client) => {
      // Get all sales for this client
      const clientSales = sales.filter(sale => sale.clientId === client.id);
      const totalSalesAmount = clientSales.reduce((sum, sale) => sum + sale.totalAmountTTC, 0);
      
      // Get all payments for this client's invoices
      const clientInvoices = invoices.filter(inv => inv.clientId === client.id);
      const totalPaidAmount = clientInvoices.reduce((sum, invoice) => {
        const invoicePayments = payments.filter(p => p.invoiceId === invoice.id);
        return sum + invoicePayments.reduce((pSum, p) => pSum + p.amount, 0);
      }, 0);
      
      // Calculate client's debt
      const clientDebt = totalSalesAmount - totalPaidAmount;
      
      // Only add client if they have debt
      if (clientDebt > 0) {
        acc.push({
          clientId: client.id,
          clientName: client.name,
          amountTTC: clientDebt
        });
      }
      return acc;
    }, []);

    // Calculate total sales
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmountTTC, 0);
    
    // Calculate total paid amount
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calculate total debt (total sales - total paid)
    const totalDebt = totalSales - totalPaid;
    
    // Calculate overdue amount from unpaid invoices that are past due
    const overdueDebt = invoices
      .filter(inv => {
        // Get payments for this invoice
        const invoicePayments = payments.filter(p => p.invoiceId === inv.id);
        const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
        
        // Check if there's remaining amount and it's overdue
        return totalPaid < inv.totalAmountTTC && new Date(inv.dueDate) < new Date();
      })
      .reduce((sum, inv) => {
        // Calculate remaining amount for this invoice
        const invoicePayments = payments.filter(p => p.invoiceId === inv.id);
        const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
        return sum + (inv.totalAmountTTC - totalPaid);
      }, 0);
    
    // Upcoming debt is total debt minus overdue debt
    const upcomingDebt = totalDebt - overdueDebt;

    return {
      totalDebtTTC: totalDebt,
      overdueDebtTTC: overdueDebt,
      upcomingDebtTTC: upcomingDebt,
      debtByClient
    };
  };

  const getClientDebt = (clientId: string): number => {
    // Calculate debt from unpaid invoices
    const clientInvoices = invoices.filter(inv => inv.clientId === clientId && !inv.isPaid);
    const totalInvoiceAmount = clientInvoices.reduce((sum, inv) => sum + inv.totalAmountTTC, 0);
    
    // Calculate total payments made for these invoices
    const totalPayments = clientInvoices.reduce((sum, invoice) => {
      const invoicePayments = payments.filter(p => p.invoiceId === invoice.id);
      return sum + invoicePayments.reduce((pSum, p) => pSum + p.amount, 0);
    }, 0);

    // Calculate debt from uninvoiced sales
    const uninvoicedSales = sales.filter(sale => sale.clientId === clientId && !sale.isInvoiced);
    const uninvoicedAmount = uninvoicedSales.reduce((sum, sale) => sum + sale.totalAmountTTC, 0);
    
    // Total debt is unpaid invoices (minus payments) plus uninvoiced sales
    return (totalInvoiceAmount - totalPayments) + uninvoicedAmount;
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

    const totalPaid = getPaymentsByInvoice(invoiceId)
      .reduce((sum, payment) => sum + payment.amount, 0);

    return invoice.totalAmountTTC - totalPaid;
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
