// Place this file in src/contexts/AppContext.tsx
// This is a partial update that replaces the relevant useEffect in your AppContext

// ... all existing imports ...

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Client, Sale, Invoice, Payment, SalesSummary, DebtSummary, BulkPayment } from '@/types/index';
import * as clientService from '@/services/clientService';
import * as saleService from '@/services/saleService';
import * as invoiceService from '@/services/invoiceService';
import * as paymentService from '@/services/paymentService';
import { markSaleAsInvoiced, unmarkSaleAsInvoiced } from '@/services/saleService';

export interface AppContextType {
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

    const fetchData = async () => {
      try {
        setLoading(prev => ({ ...prev, clients: true }));
        const clientsData = await clientService.getClients();
        if (isMounted) {
          setClients(clientsData || []);
          console.log('Fetched clients:', clientsData);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        if (isMounted) {
          setLoading(prev => ({ ...prev, clients: false }));
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);
  const getClientById = useCallback((id: string): Client | undefined => {
    if (!id) {
      console.warn('getClientById called with empty id');
      return undefined;
    }
    const client = clients.find(client => client.id === id);
    if (!client) {
      console.warn(`No client found with id: ${id}`);
    }
    return client;
  }, [clients]);

  const addClient = async (client: Omit<Client, 'id' | 'createdAt'>) => {
    return await clientService.createClient(client);
  };

  const updateClient = async (id: string, client: Partial<Client>) => {
    await clientService.updateClient(id, client);
  };

  const deleteClient = async (id: string) => {
    await clientService.deleteClient(id);
  };

  const getSalesByClient = (clientId: string) => {
    return sales.filter(sale => sale.clientId === clientId);
  };

  const getInvoicesByClient = (clientId: string) => {
    return invoices.filter(invoice => invoice.clientId === clientId);
  };

  const getSalesSummary = () => {
    const totalSales = sales.length;
    const invoicedSales = sales.filter(sale => sale.isInvoiced).length;
    const uninvoicedSales = totalSales - invoicedSales;

    // Calculate total amount, handling null/undefined values
    const totalAmount = sales.reduce((sum, sale) => {
      const amount = sale.totalAmountTTC || 0;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    // Group sales by month and sort by date
    const monthlySales = sales
      .reduce((acc: { month: string; monthKey: string; amountTTC: number }[], sale) => {
        const date = new Date(sale.date);
        const month = date.toLocaleString('default', { month: 'long' });
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const existingMonth = acc.find(m => m.monthKey === monthKey);
        if (existingMonth) {
          // Handle null/undefined/NaN values
          const amount = sale.totalAmountTTC || 0;
          existingMonth.amountTTC += isNaN(amount) ? 0 : amount;
        } else {
          acc.push({ 
            month,
            monthKey,
            amountTTC: isNaN(sale.totalAmountTTC || 0) ? 0 : (sale.totalAmountTTC || 0)
          });
        }
        return acc;
      }, [])
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map(({ month, amountTTC }) => ({ month, amountTTC }));

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
      const totalSalesAmount = clientSales.reduce((sum, sale) => sum + (sale.totalAmountTTC || 0), 0);
      
      // Get all payments for this client's sales
      const clientPayments = payments.filter(p => p.clientId === client.id);
      const totalPaidAmount = clientPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
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
    const totalSales = sales.reduce((sum, sale) => sum + (sale.totalAmountTTC || 0), 0);
    
    // Calculate total paid amount
    const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Calculate total debt (never show negative debt)
    const totalDebt = Math.max(0, totalSales - totalPaid);
    
    // Calculate overdue amount from unpaid sales
    const overdueDebt = sales
      .filter(sale => {
        // Get payments for this sale
        const salePayments = payments.filter(p => p.saleId === sale.id);
        const totalPaid = salePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        // Check if there's remaining amount and it's overdue
        const invoice = invoices.find(inv => inv.id === sale.invoiceId);
        return totalPaid < (sale.totalAmountTTC || 0) && invoice && new Date(invoice.dueDate) < new Date();
      })
      .reduce((sum, sale) => {
        // Calculate remaining amount for this sale
        const salePayments = payments.filter(p => p.saleId === sale.id);
        const totalPaid = salePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        return sum + Math.max(0, (sale.totalAmountTTC || 0) - totalPaid);
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
    // Get all sales for this client
    const clientSales = sales.filter(sale => sale.clientId === clientId);
    const totalSalesAmount = clientSales.reduce((sum, sale) => sum + sale.totalAmountTTC, 0);
    
    // Get all payments for this client
    const clientPayments = payments.filter(p => p.clientId === clientId);
    const totalPaidAmount = clientPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Total debt is total sales minus total payments (never show negative)
    return Math.max(0, totalSalesAmount - totalPaidAmount);
  };

  const getClientCreditBalance = (clientId: string): number => {
    // Get all sales for this client
    const clientSales = sales.filter(sale => sale.clientId === clientId);
    const totalSalesAmount = clientSales.reduce((sum, sale) => sum + sale.totalAmountTTC, 0);
    
    // Get all payments for this client
    const clientPayments = payments.filter(p => p.clientId === clientId);
    const totalPaidAmount = clientPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // If totalPaidAmount > totalSalesAmount, the difference is what we owe the client
    return Math.max(0, totalPaidAmount - totalSalesAmount);
  };

  const addSale = async (sale: Omit<Sale, 'id' | 'createdAt'>) => {
    await saleService.createSale(sale);
    // Re-fetch all sales from backend to ensure consistency
    const salesData = await saleService.getSales();
    setSales(salesData || []);
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
          markSaleAsInvoiced(saleId, newInvoice.id)
        )
      );
    }

    return newInvoice;
  };

  const updateInvoice = async (id: string, invoice: Partial<Invoice>) => {
    const existingInvoice = invoices.find(i => i.id === id);
    if (!existingInvoice) return;
    
    // If salesIds are being updated, check if all new sales are paid
    if (invoice.salesIds) {
      const allSalesPaid = invoice.salesIds.every(saleId => {
        const saleStatus = getSalePaymentStatus(saleId);
        return saleStatus?.isFullyPaid;
      });
      
      // Automatically update isPaid status based on sales payment status
      invoice.isPaid = allSalesPaid;
      invoice.paidAt = allSalesPaid ? new Date() : undefined;
    }
    
    const updatedInvoice = await invoiceService.updateInvoice(id, invoice);
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...updatedInvoice } : i));

    // Update related sales if salesIds have changed
    if (existingInvoice && invoice.salesIds) {
      // Unmark previously invoiced sales
      await Promise.all(
        existingInvoice.salesIds
          .filter(saleId => !invoice.salesIds?.includes(saleId))
          .map(saleId => unmarkSaleAsInvoiced(saleId))
      );

      // Mark newly added sales as invoiced
      await Promise.all(
        invoice.salesIds
          .filter(saleId => !existingInvoice.salesIds.includes(saleId))
          .map(saleId => markSaleAsInvoiced(saleId, id))
      );
    }
  };

  const deleteInvoice = async (id: string) => {
    const invoice = invoices.find(i => i.id === id);
    if (invoice) {
      // Unmark all related sales as invoiced
      await Promise.all(
        invoice.salesIds.map(saleId =>
          unmarkSaleAsInvoiced(saleId)
        )
      );
    }

    await invoiceService.deleteInvoice(id);
    setInvoices(prev => prev.filter(i => i.id !== id));

    // Re-fetch sales to update their invoiced status in the UI
    const salesData = await saleService.getSales();
    setSales(salesData || []);
  };

  const getInvoiceById = (id: string) => {
    return invoices.find(invoice => invoice.id === id);
  };

  const deletePayment = async (id: string) => {
    const payment = payments.find(p => p.id === id);
    if (!payment) return;

    await paymentService.deletePayment(id);
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  const addPayment = async (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> => {
    const newPayment = await paymentService.addPayment(payment);
    setPayments(prevPayments => [...prevPayments, newPayment].sort((a, b) => b.date.getTime() - a.date.getTime()));
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
    const sale = getSaleById(saleId);
    if (!sale) return null;

    const salePayments = getPaymentsBySale(saleId);
    const totalPaid = salePayments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingAmount = Math.max(0, sale.totalAmountTTC - totalPaid);

    return {
      totalAmount: sale.totalAmountTTC,
      totalPaid,
      remainingAmount,
      isFullyPaid: remainingAmount === 0,
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
    // Get all sales for this client and calculate total, handling null/undefined values
    const clientSales = sales.filter(sale => sale.clientId === clientId);
    const totalSalesAmount = clientSales.reduce((sum, sale) => {
      const amount = sale.totalAmountTTC || 0;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    // Get all payments for this client and calculate total, handling null/undefined values
    const clientPayments = payments.filter(payment => payment.clientId === clientId);
    const totalPayments = clientPayments.reduce((sum, payment) => {
      const amount = payment.amount || 0;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    return {
      totalSalesAmount,
      totalPayments,
      balance: totalSalesAmount - totalPayments
    };
  };

  useEffect(() => {
    let isMounted = true;

    const fetchSales = async () => {
      try {
        setLoading(prev => ({ ...prev, sales: true }));
        const salesData = await saleService.getSales();
        if (isMounted) {
          setSales(salesData || []);
          // console.log('Fetched sales:', salesData);
        }
      } catch (error) {
        console.error('Error fetching sales:', error);
      } finally {
        if (isMounted) {
          setLoading(prev => ({ ...prev, sales: false }));
        }
      }
    };

    fetchSales();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchInvoices = async () => {
      try {
        setLoading(prev => ({ ...prev, invoices: true }));
        const invoicesData = await invoiceService.getInvoices();
        if (isMounted) {
          setInvoices(invoicesData || []);
          // console.log('Fetched invoices:', invoicesData);
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        if (isMounted) {
          setLoading(prev => ({ ...prev, invoices: false }));
        }
      }
    };

    fetchInvoices();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchPayments = async () => {
      try {
        setLoading(prev => ({ ...prev, payments: true }));
        const paymentsData = await paymentService.getPayments();
        if (isMounted) {
          setPayments(paymentsData || []);
          // console.log('Fetched payments:', paymentsData);
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        if (isMounted) {
          setLoading(prev => ({ ...prev, payments: false }));
        }
      }
    };

    fetchPayments();

    return () => {
      isMounted = false;
    };
  }, []);

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
      deletePayment,
      addPayment,
      addBulkPayment,
      getPaymentsBySale,
      getSalePaymentStatus,
      getInvoicePaymentStatus,
      getClientBalance
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
