// Place this file in src/contexts/AppContext.tsx
// This is a partial update that replaces the relevant useEffect in your AppContext

// ... all existing imports ...

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Client, Sale, Invoice, Payment, SalesSummary, DebtSummary, BulkPayment } from '@/types';
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
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Payment>;
  addBulkPayment: (payment: BulkPayment) => Promise<Payment[]>;
  getPaymentsBySale: (saleId: string) => Payment[];
  getSalePaymentStatus: (saleId: string) => {
    totalAmount: number;
    totalPaid: number;
    remainingAmount: number;
    isFullyPaid: boolean;
    payments: Payment[];
  } | null;
  getInvoicePaymentStatus: (invoiceId: string) => {
    totalAmount: number;
    totalPaid: number;
    remainingAmount: number;
    isFullyPaid: boolean;
    payments: Payment[];
  } | null;
  getClientBalance: (clientId: string) => {
    totalSalesAmount: number;
    totalPayments: number;
    balance: number;
  };
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

    const status = getInvoicePaymentStatus(invoiceId);
    return status ? status.remainingAmount : invoice.totalAmountTTC;
  };

  const deletePayment = async (id: string) => {
    const payment = payments.find(p => p.id === id);
    if (!payment) return;

    await paymentService.deletePayment(id);
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  const addPayment = async (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> => {
    const newPayment = await paymentService.addPayment(payment);
    setPayments(prev => [...prev, newPayment]);
    return newPayment;
  };

  const addBulkPayment = async (payment: BulkPayment): Promise<Payment[]> => {
    const newPayments = await paymentService.addBulkPayment(payment);
    setPayments(prev => [...prev, ...newPayments]);
    return newPayments;
  };

  const getPaymentsBySale = (saleId: string) => {
    return payments.filter(payment => payment.saleId === saleId);
  };

  const getSalePaymentStatus = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return null;

    const salePayments = getPaymentsBySale(saleId);
    const totalPaid = salePayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalAmount: sale.totalAmountTTC,
      totalPaid,
      remainingAmount: Math.max(0, sale.totalAmountTTC - totalPaid),
      isFullyPaid: totalPaid >= sale.totalAmountTTC,
      payments: salePayments
    };
  };

  const getInvoicePaymentStatus = (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return null;

    const totalAmount = invoice.totalAmountTTC;
    let totalPaid = 0;
    const allPayments: Payment[] = [];

    // Get payments for all sales in this invoice
    invoice.salesIds.forEach(saleId => {
      const salePayments = getPaymentsBySale(saleId);
      totalPaid += salePayments.reduce((sum, p) => sum + p.amount, 0);
      allPayments.push(...salePayments);
    });

    return {
      totalAmount,
      totalPaid,
      remainingAmount: Math.max(0, totalAmount - totalPaid),
      isFullyPaid: totalPaid >= totalAmount,
      payments: allPayments
    };
  };

  const getClientBalance = (clientId: string) => {
    const clientSales = sales.filter(sale => sale.clientId === clientId);
    const totalSalesAmount = clientSales.reduce((sum, sale) => sum + sale.totalAmountTTC, 0);
    
    const clientPayments = payments.filter(payment => payment.clientId === clientId);
    const totalPayments = clientPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    return {
      totalSalesAmount,
      totalPayments,
      balance: totalSalesAmount - totalPayments
    };
  };

  const cleanupDuplicatePayments = async (invoiceId: string) => {
    const invoice = getInvoiceById(invoiceId);
    if (!invoice) return;

    const status = getInvoicePaymentStatus(invoiceId);
    if (!status) return;

    // Get all payments for this invoice's sales
    const { payments: invoicePayments } = status;

    // Sort payments by date (oldest first)
    const sortedPayments = [...invoicePayments].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    // Keep only the payments that don't exceed the invoice total
    let runningTotal = 0;
    const paymentsToKeep = new Set<string>();

    for (const payment of sortedPayments) {
      if (runningTotal < invoice.totalAmountTTC) {
        const remainingNeeded = invoice.totalAmountTTC - runningTotal;
        if (payment.amount <= remainingNeeded) {
          paymentsToKeep.add(payment.id);
          runningTotal += payment.amount;
        }
      }
    }

    // Delete payments that aren't in the keep set
    const paymentsToDelete = invoicePayments.filter(
      p => !paymentsToKeep.has(p.id)
    );

    // Delete excess payments
    await Promise.all(
      paymentsToDelete.map(p => deletePayment(p.id))
    );
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
      addBulkPayment,
      getPaymentsBySale,
      getSalePaymentStatus,
      getInvoicePaymentStatus,
      getClientBalance,
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
