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
  getClientCreditBalance: (clientId: string) => number;
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
  cleanupDuplicatePayments: (invoiceId: string) => Promise<void>;
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
        // Sort sales by date in descending order
        setSales(salesData.sort((a, b) => b.date.getTime() - a.date.getTime()));
        // Sort invoices by date in descending order
        setInvoices(invoicesData.sort((a, b) => b.date.getTime() - a.date.getTime()));
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
          // Sort payments by date in descending order
          setPayments(allPayments.sort((a, b) => b.date.getTime() - a.date.getTime()));
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
      
      // Calculate client's debt (never show negative debt)
      const clientDebt = Math.max(0, totalSalesAmount - totalPaidAmount);
      
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
    
    // Calculate total debt (never show negative debt)
    const totalDebt = Math.max(0, totalSales - totalPaid);
    
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
        return sum + Math.max(0, inv.totalAmountTTC - totalPaid);
      }, 0);
    
    // Upcoming debt is total debt minus overdue debt (never show negative)
    const upcomingDebt = Math.max(0, totalDebt - overdueDebt);

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
    
    // Total debt is unpaid invoices (minus payments) plus uninvoiced sales (never show negative)
    return Math.max(0, (totalInvoiceAmount - totalPayments) + uninvoicedAmount);
  };

  const getClientCreditBalance = (clientId: string): number => {
    // Get all invoices for this client
    const clientInvoices = invoices.filter(inv => inv.clientId === clientId);
    
    // Get all sales for this client
    const clientSales = sales.filter(sale => sale.clientId === clientId);
    
    // Calculate total amount from all sales (invoiced and uninvoiced)
    const totalSalesAmount = clientSales.reduce((sum, sale) => sum + sale.totalAmountTTC, 0);
    
    // Calculate total amount client has paid
    const totalPayments = clientInvoices.reduce((sum, invoice) => {
      const invoicePayments = payments.filter(p => p.invoiceId === invoice.id);
      return sum + invoicePayments.reduce((pSum, p) => pSum + p.amount, 0);
    }, 0);
    
    // If totalPayments > totalSalesAmount, the difference is what we owe the client
    return Math.max(0, totalPayments - totalSalesAmount);
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
    const existingInvoice = invoices.find(i => i.id === id);
    
    // Remove automatic payment creation when marking as paid
    const updatedInvoice = await invoiceService.updateInvoice(id, invoice);
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...updatedInvoice } : i));

    // Update related sales if salesIds have changed
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
    // Create the new payment with the exact amount entered by the user
    const newPayment = await paymentService.createPayment(invoiceId, paymentData);
    setPayments(prev => [...prev, newPayment]);

    // Get the invoice
    const invoice = getInvoiceById(invoiceId);
    if (invoice) {
      const invoicePayments = [...payments, newPayment].filter(p => p.invoiceId === invoiceId);
      const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
      
      // Only mark as paid if total paid amount equals or exceeds invoice total
      if (totalPaid >= invoice.totalAmountTTC && !invoice.isPaid) {
        await updateInvoice(invoiceId, {
          isPaid: true,
          paidAt: new Date()
        });
      }
    }

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

    // Get the invoice and check if it should be marked as paid
    const invoice = getInvoiceById(updatedPayment.invoiceId);
    if (invoice) {
      const invoicePayments = payments
        .filter(p => p.invoiceId === updatedPayment.invoiceId)
        .map(p => p.id === id ? updatedPayment : p);
      
      const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
      
      // Update invoice paid status based on total paid amount
      if (totalPaid >= invoice.totalAmountTTC && !invoice.isPaid) {
        await updateInvoice(invoice.id, {
          isPaid: true,
          paidAt: new Date()
        });
      } else if (totalPaid < invoice.totalAmountTTC && invoice.isPaid) {
        await updateInvoice(invoice.id, {
          isPaid: false,
          paidAt: undefined
        });
      }
    }

    return updatedPayment;
  };

  const cleanupDuplicatePayments = async (invoiceId: string) => {
    const invoicePayments = payments.filter(p => p.invoiceId === invoiceId);
    
    // Group payments by their properties to find duplicates
    const paymentGroups = invoicePayments.reduce((groups, payment) => {
      const key = `${payment.amount}-${payment.method}-${new Date(payment.date).getTime()}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(payment);
      return groups;
    }, {} as Record<string, Payment[]>);

    // For each group of duplicate payments, keep the first one and delete the rest
    for (const group of Object.values(paymentGroups)) {
      if (group.length > 1) {
        // Keep the first payment, delete the rest
        const [keep, ...duplicates] = group;
        for (const duplicate of duplicates) {
          await deletePayment(duplicate.id);
        }
      }
    }
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
      getClientCreditBalance,
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
      deletePayment,
      cleanupDuplicatePayments
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
