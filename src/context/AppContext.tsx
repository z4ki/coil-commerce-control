
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { 
  Client, 
  Sale, 
  Invoice, 
  SalesSummary, 
  DebtSummary,
  SalesFilter,
  InvoiceFilter,
  Payment,
  SaleItem
} from '../types';

// Import Supabase services
import * as clientService from '../services/clientService';
import * as saleService from '../services/saleService';
import * as invoiceService from '../services/invoiceService';
import * as paymentService from '../services/paymentService';

interface AppContextProps {
  // Clients
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<Client>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClientById: (id: string) => Client | undefined;
  
  // Sales
  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id' | 'totalAmount' | 'createdAt'>) => Promise<Sale>;
  updateSale: (id: string, sale: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  getSaleById: (id: string) => Sale | undefined;
  getSalesByClient: (clientId: string) => Sale[];
  getSalesByFilter: (filter: SalesFilter) => Sale[];
  
  // Invoices
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Promise<Invoice>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  getInvoiceById: (id: string) => Invoice | undefined;
  getInvoicesByClient: (clientId: string) => Invoice[];
  getInvoicesByFilter: (filter: InvoiceFilter) => Invoice[];
  
  // Payments
  payments: Payment[];
  addPayment: (invoiceId: string, payment: Omit<Payment, 'id' | 'invoiceId'>) => Promise<Payment>;
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  getPaymentsByInvoice: (invoiceId: string) => Payment[];
  getInvoiceRemainingAmount: (invoiceId: string) => number;
  
  // Summaries
  getSalesSummary: () => SalesSummary;
  getDebtSummary: () => DebtSummary;
  getClientDebt: (clientId: string) => number;
  
  // Loading states
  loading: {
    clients: boolean;
    sales: boolean;
    invoices: boolean;
    payments: boolean;
  };
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  // States for data
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState({
    clients: true,
    sales: true,
    invoices: true,
    payments: true
  });
  
  // Get the authenticated user
  const { user } = useAuth();
  
  // Fetch data when user changes
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          setLoading(prev => ({ ...prev, clients: true }));
          const clientsData = await clientService.getClients();
          setClients(clientsData);
        } catch (error) {
          console.error('Error fetching clients:', error);
          toast.error('Failed to load clients');
        } finally {
          setLoading(prev => ({ ...prev, clients: false }));
        }
        
        try {
          setLoading(prev => ({ ...prev, sales: true }));
          const salesData = await saleService.getSales();
          setSales(salesData);
        } catch (error) {
          console.error('Error fetching sales:', error);
          toast.error('Failed to load sales');
        } finally {
          setLoading(prev => ({ ...prev, sales: false }));
        }
        
        try {
          setLoading(prev => ({ ...prev, invoices: true }));
          const invoicesData = await invoiceService.getInvoices();
          setInvoices(invoicesData);
        } catch (error) {
          console.error('Error fetching invoices:', error);
          toast.error('Failed to load invoices');
        } finally {
          setLoading(prev => ({ ...prev, invoices: false }));
        }
        
        try {
          setLoading(prev => ({ ...prev, payments: true }));
          const allPayments: Payment[] = [];
          
          // For now, we'll fetch payments for all invoices
          // In a real app, you might want to paginate this or fetch on demand
          for (const invoice of invoices) {
            const invoicePayments = await paymentService.getPaymentsByInvoice(invoice.id);
            allPayments.push(...invoicePayments);
          }
          
          setPayments(allPayments);
        } catch (error) {
          console.error('Error fetching payments:', error);
          toast.error('Failed to load payments');
        } finally {
          setLoading(prev => ({ ...prev, payments: false }));
        }
      } else {
        // Reset state when user logs out
        setClients([]);
        setSales([]);
        setInvoices([]);
        setPayments([]);
        setLoading({
          clients: false,
          sales: false,
          invoices: false,
          payments: false
        });
      }
    };
    
    fetchData();
  }, [user]);
  
  // Client functions
  const addClient = async (client: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      const newClient = await clientService.createClient(client);
      setClients([...clients, newClient]);
      toast.success(`${client.name} added successfully`);
      return newClient;
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Failed to add client');
      throw error;
    }
  };

  const updateClient = async (id: string, client: Partial<Client>) => {
    try {
      const updatedClient = await clientService.updateClient(id, client);
      setClients(clients.map(c => c.id === id ? updatedClient : c));
      toast.success(`${client.name || 'Client'} updated successfully`);
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
      throw error;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      await clientService.deleteClient(id);
      setClients(clients.filter(c => c.id !== id));
      toast.success('Client deleted successfully');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
      throw error;
    }
  };

  const getClientById = (id: string) => clients.find((c) => c.id === id);

  // Sale functions
  const addSale = async (sale: Omit<Sale, 'id' | 'totalAmount' | 'createdAt'>) => {
    try {
      const newSale = await saleService.createSale(sale);
      setSales([...sales, newSale]);
      toast.success('Sale added successfully');
      return newSale;
    } catch (error) {
      console.error('Error adding sale:', error);
      toast.error('Failed to add sale');
      throw error;
    }
  };

  const updateSale = async (id: string, sale: Partial<Sale>) => {
    try {
      const updatedSale = await saleService.updateSale(id, sale);
      setSales(sales.map(s => s.id === id ? updatedSale : s));
      toast.success('Sale updated successfully');
    } catch (error) {
      console.error('Error updating sale:', error);
      toast.error('Failed to update sale');
      throw error;
    }
  };

  const deleteSale = async (id: string) => {
    try {
      await saleService.deleteSale(id);
      setSales(sales.filter(s => s.id !== id));
      toast.success('Sale deleted successfully');
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast.error('Failed to delete sale');
      throw error;
    }
  };

  const getSaleById = (id: string) => sales.find((s) => s.id === id);

  const getSalesByClient = (clientId: string) => sales.filter((s) => s.clientId === clientId);

  const getSalesByFilter = (filter: SalesFilter) => {
    return sales.filter((sale) => {
      // Filter by client
      if (filter.clientId && sale.clientId !== filter.clientId) return false;
      
      // Filter by invoice status
      if (filter.isInvoiced !== undefined && sale.isInvoiced !== filter.isInvoiced) return false;
      
      // Filter by date range
      if (filter.startDate && sale.date < filter.startDate) return false;
      if (filter.endDate && sale.date > filter.endDate) return false;
      
      return true;
    });
  };

  // Invoice functions
  const addInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    try {
      const newInvoice = await invoiceService.createInvoice(invoice);
      setInvoices([...invoices, newInvoice]);
      
      // Update sales that are now invoiced
      const updatedSales = sales.map(s =>
        invoice.salesIds.includes(s.id)
          ? { ...s, isInvoiced: true, invoiceId: newInvoice.id }
          : s
      );
      setSales(updatedSales);
      
      toast.success('Invoice created successfully');
      return newInvoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
      throw error;
    }
  };

  const updateInvoice = async (id: string, invoiceUpdate: Partial<Invoice>) => {
    try {
      const updatedInvoice = await invoiceService.updateInvoice(id, invoiceUpdate);
      setInvoices(invoices.map(inv => inv.id === id ? updatedInvoice : inv));
      
      // If salesIds are being updated, update sales to reflect changes
      if (invoiceUpdate.salesIds) {
        const currentInvoice = invoices.find(inv => inv.id === id);
        if (!currentInvoice) return;
        
        // Sales to be removed from this invoice
        const removedSaleIds = currentInvoice.salesIds.filter(
          saleId => !invoiceUpdate.salesIds?.includes(saleId)
        );
        
        // Sales to be added to this invoice
        const addedSaleIds = invoiceUpdate.salesIds.filter(
          saleId => !currentInvoice.salesIds.includes(saleId)
        );
        
        setSales(
          sales.map(s => {
            if (removedSaleIds.includes(s.id)) {
              return { ...s, isInvoiced: false, invoiceId: undefined };
            }
            if (addedSaleIds.includes(s.id)) {
              return { ...s, isInvoiced: true, invoiceId: id };
            }
            return s;
          })
        );
      }
      
      toast.success('Invoice updated successfully');
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
      throw error;
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      await invoiceService.deleteInvoice(id);
      setInvoices(invoices.filter(inv => inv.id !== id));
      
      // Update any sales linked to this invoice
      setSales(
        sales.map(s =>
          s.invoiceId === id ? { ...s, isInvoiced: false, invoiceId: undefined } : s
        )
      );
      
      // Remove any payments for this invoice
      setPayments(payments.filter(p => p.invoiceId !== id));
      
      toast.success('Invoice deleted successfully');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
      throw error;
    }
  };

  const getInvoiceById = (id: string) => invoices.find((inv) => inv.id === id);

  const getInvoicesByClient = (clientId: string) => invoices.filter((inv) => inv.clientId === clientId);

  const getInvoicesByFilter = (filter: InvoiceFilter) => {
    return invoices.filter((invoice) => {
      // Filter by client
      if (filter.clientId && invoice.clientId !== filter.clientId) return false;
      
      // Filter by paid status
      if (filter.isPaid !== undefined && invoice.isPaid !== filter.isPaid) return false;
      
      // Filter by date range
      if (filter.startDate && invoice.date < filter.startDate) return false;
      if (filter.endDate && invoice.date > filter.endDate) return false;
      
      return true;
    });
  };

  // Payment functions
  const addPayment = async (invoiceId: string, paymentData: Omit<Payment, 'id' | 'invoiceId'>) => {
    try {
      const newPayment = await paymentService.createPayment({
        ...paymentData,
        invoiceId
      });
      
      setPayments([...payments, newPayment]);
      
      // Check if invoice is now fully paid
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (invoice) {
        const invoicePayments = [...payments, newPayment].filter(p => p.invoiceId === invoiceId);
        const totalPaid = invoicePayments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // Update invoice paid status if fully paid
        if (totalPaid >= invoice.totalAmount && !invoice.isPaid) {
          const updatedInvoice = { ...invoice, isPaid: true, paidAt: new Date() };
          setInvoices(invoices.map(inv => inv.id === invoiceId ? updatedInvoice : inv));
        }
      }
      
      toast.success('Payment recorded successfully');
      return newPayment;
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('Failed to record payment');
      throw error;
    }
  };
  
  const updatePayment = async (id: string, paymentData: Partial<Payment>) => {
    try {
      const payment = payments.find(p => p.id === id);
      if (!payment) throw new Error('Payment not found');
      
      const updatedPayment = await paymentService.updatePayment(id, paymentData);
      
      setPayments(
        payments.map(p => (p.id === id ? updatedPayment : p))
      );
      
      // Check if invoice paid status needs to be updated
      const invoice = invoices.find(inv => inv.id === payment.invoiceId);
      if (invoice) {
        const invoicePayments = payments.map(p => 
          p.id === id ? updatedPayment : p
        ).filter(p => p.invoiceId === payment.invoiceId);
        
        const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
        
        // Update invoice paid status based on payment total
        if (totalPaid >= invoice.totalAmount && !invoice.isPaid) {
          const updatedInvoice = { ...invoice, isPaid: true, paidAt: new Date() };
          setInvoices(invoices.map(inv => inv.id === invoice.id ? updatedInvoice : inv));
        } else if (totalPaid < invoice.totalAmount && invoice.isPaid) {
          const updatedInvoice = { ...invoice, isPaid: false, paidAt: undefined };
          setInvoices(invoices.map(inv => inv.id === invoice.id ? updatedInvoice : inv));
        }
      }
      
      toast.success('Payment updated successfully');
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment');
      throw error;
    }
  };
  
  const deletePayment = async (id: string) => {
    try {
      const payment = payments.find(p => p.id === id);
      if (!payment) throw new Error('Payment not found');
      
      await paymentService.deletePayment(id);
      
      setPayments(payments.filter(p => p.id !== id));
      
      // Check if invoice paid status needs to be updated
      const invoice = invoices.find(inv => inv.id === payment.invoiceId);
      if (invoice && invoice.isPaid) {
        const invoicePayments = payments.filter(p => 
          p.id !== id && p.invoiceId === payment.invoiceId
        );
        
        const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
        
        // Update invoice paid status if no longer fully paid
        if (totalPaid < invoice.totalAmount) {
          const updatedInvoice = { ...invoice, isPaid: false, paidAt: undefined };
          setInvoices(invoices.map(inv => inv.id === invoice.id ? updatedInvoice : inv));
        }
      }
      
      toast.success('Payment deleted successfully');
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
      throw error;
    }
  };
  
  const getPaymentsByInvoice = (invoiceId: string) => {
    return payments.filter(payment => payment.invoiceId === invoiceId);
  };
  
  const getInvoiceRemainingAmount = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return 0;
    
    const totalPaid = payments
      .filter(p => p.invoiceId === invoiceId)
      .reduce((sum, p) => sum + p.amount, 0);
    
    return Math.max(0, invoice.totalAmount - totalPaid);
  };

  // Summary functions
  const getSalesSummary = (): SalesSummary => {
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const invoicedSales = sales
      .filter((sale) => sale.isInvoiced)
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
    const uninvoicedSales = totalSales - invoicedSales;
    
    // Group sales by month for chart
    const monthlySales: { month: string; amount: number }[] = [];
    const monthlyData = new Map<string, number>();
    
    sales.forEach((sale) => {
      const monthYear = sale.date.toLocaleString('default', { month: 'short', year: 'numeric' });
      const currentAmount = monthlyData.get(monthYear) || 0;
      monthlyData.set(monthYear, currentAmount + sale.totalAmount);
    });
    
    Array.from(monthlyData.entries()).forEach(([month, amount]) => {
      monthlySales.push({ month, amount });
    });
    
    // Sort by date (assuming month-year format)
    monthlySales.sort((a, b) => {
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');
      if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.indexOf(aMonth) - months.indexOf(bMonth);
    });
    
    return { totalSales, invoicedSales, uninvoicedSales, monthlySales };
  };

  const getClientDebt = (clientId: string) => {
    return invoices
      .filter((inv) => inv.clientId === clientId && !inv.isPaid)
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
  };

  const getDebtSummary = (): DebtSummary => {
    const today = new Date();
    
    // Calculate total and overdue debt
    let totalDebt = 0;
    let overdueDebt = 0;
    let upcomingDebt = 0;
    const debtByClient = new Map<string, { clientName: string; amount: number }>();
    
    invoices
      .filter((inv) => !inv.isPaid)
      .forEach((inv) => {
        const client = getClientById(inv.clientId);
        if (!client) return;
        
        totalDebt += inv.totalAmount;
        
        if (inv.dueDate < today) {
          overdueDebt += inv.totalAmount;
        } else {
          upcomingDebt += inv.totalAmount;
        }
        
        // Add to client debt tracking
        const clientDebt = debtByClient.get(inv.clientId) || { clientName: client.name, amount: 0 };
        clientDebt.amount += inv.totalAmount;
        debtByClient.set(inv.clientId, clientDebt);
      });
    
    const debtByClientArray = Array.from(debtByClient.entries()).map(([clientId, { clientName, amount }]) => ({
      clientId,
      clientName,
      amount
    }));
    
    // Sort by debt amount (highest first)
    debtByClientArray.sort((a, b) => b.amount - a.amount);
    
    return { totalDebt, overdueDebt, upcomingDebt, debtByClient: debtByClientArray };
  };

  const contextValue: AppContextProps = {
    // Clients
    clients,
    addClient,
    updateClient,
    deleteClient,
    getClientById,
    
    // Sales
    sales,
    addSale,
    updateSale,
    deleteSale,
    getSaleById,
    getSalesByClient,
    getSalesByFilter,
    
    // Invoices
    invoices,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoiceById,
    getInvoicesByClient,
    getInvoicesByFilter,
    
    // Payments
    payments,
    addPayment,
    updatePayment,
    deletePayment,
    getPaymentsByInvoice,
    getInvoiceRemainingAmount,
    
    // Summaries
    getSalesSummary,
    getDebtSummary,
    getClientDebt,
    
    // Loading states
    loading
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};
