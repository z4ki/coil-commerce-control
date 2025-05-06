
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Client, 
  Sale, 
  Invoice, 
  SalesSummary, 
  DebtSummary,
  SalesFilter,
  InvoiceFilter
} from '../types';

interface AppContextProps {
  // Clients
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClientById: (id: string) => Client | undefined;
  
  // Sales
  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id' | 'totalAmount' | 'createdAt'>) => Sale;
  updateSale: (id: string, sale: Partial<Sale>) => void;
  deleteSale: (id: string) => void;
  getSaleById: (id: string) => Sale | undefined;
  getSalesByClient: (clientId: string) => Sale[];
  getSalesByFilter: (filter: SalesFilter) => Sale[];
  
  // Invoices
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  getInvoiceById: (id: string) => Invoice | undefined;
  getInvoicesByClient: (clientId: string) => Invoice[];
  getInvoicesByFilter: (filter: InvoiceFilter) => Invoice[];
  
  // Summaries
  getSalesSummary: () => SalesSummary;
  getDebtSummary: () => DebtSummary;
  getClientDebt: (clientId: string) => number;
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
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Client functions
  const addClient = (client: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient = {
      ...client,
      id: uuidv4(),
      createdAt: new Date()
    };
    setClients([...clients, newClient]);
    return newClient;
  };

  const updateClient = (id: string, client: Partial<Client>) => {
    setClients(
      clients.map((c) => (c.id === id ? { ...c, ...client } : c))
    );
  };

  const deleteClient = (id: string) => {
    setClients(clients.filter((c) => c.id !== id));
  };

  const getClientById = (id: string) => clients.find((c) => c.id === id);

  // Sale functions
  const addSale = (sale: Omit<Sale, 'id' | 'totalAmount' | 'createdAt'>) => {
    const totalAmount = sale.quantity * sale.pricePerTon;
    const newSale = {
      ...sale,
      id: uuidv4(),
      totalAmount,
      createdAt: new Date()
    };
    setSales([...sales, newSale]);
    return newSale;
  };

  const updateSale = (id: string, saleUpdate: Partial<Sale>) => {
    setSales(
      sales.map((s) => {
        if (s.id === id) {
          const updatedSale = { ...s, ...saleUpdate };
          // Recalculate total amount if quantity or price changes
          if (saleUpdate.quantity !== undefined || saleUpdate.pricePerTon !== undefined) {
            const quantity = saleUpdate.quantity !== undefined ? saleUpdate.quantity : s.quantity;
            const pricePerTon = saleUpdate.pricePerTon !== undefined ? saleUpdate.pricePerTon : s.pricePerTon;
            updatedSale.totalAmount = quantity * pricePerTon;
          }
          return updatedSale;
        }
        return s;
      })
    );
  };

  const deleteSale = (id: string) => {
    setSales(sales.filter((s) => s.id !== id));
    // Also remove this sale from any invoices
    setInvoices(
      invoices.map((inv) => ({
        ...inv,
        salesIds: inv.salesIds.filter((saleId) => saleId !== id)
      }))
    );
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
  const addInvoice = (invoice: Omit<Invoice, 'id' | 'createdAt'>) => {
    const newInvoice = {
      ...invoice,
      id: uuidv4(),
      createdAt: new Date()
    };
    
    // Mark the associated sales as invoiced
    if (newInvoice.salesIds?.length > 0) {
      setSales(
        sales.map((s) =>
          newInvoice.salesIds.includes(s.id)
            ? { ...s, isInvoiced: true, invoiceId: newInvoice.id }
            : s
        )
      );
    }
    
    setInvoices([...invoices, newInvoice]);
    return newInvoice;
  };

  const updateInvoice = (id: string, invoiceUpdate: Partial<Invoice>) => {
    // Update invoice
    setInvoices(
      invoices.map((inv) => (inv.id === id ? { ...inv, ...invoiceUpdate } : inv))
    );
    
    // If sales IDs are being updated, update sales to reflect changes
    if (invoiceUpdate.salesIds) {
      const currentInvoice = invoices.find((inv) => inv.id === id);
      if (!currentInvoice) return;
      
      // Sales to be removed from this invoice
      const removedSaleIds = currentInvoice.salesIds.filter(
        (saleId) => !invoiceUpdate.salesIds?.includes(saleId)
      );
      
      // Sales to be added to this invoice
      const addedSaleIds = invoiceUpdate.salesIds.filter(
        (saleId) => !currentInvoice.salesIds.includes(saleId)
      );
      
      setSales(
        sales.map((s) => {
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
  };

  const deleteInvoice = (id: string) => {
    // Remove invoice
    setInvoices(invoices.filter((inv) => inv.id !== id));
    
    // Update any sales linked to this invoice
    setSales(
      sales.map((s) =>
        s.invoiceId === id ? { ...s, isInvoiced: false, invoiceId: undefined } : s
      )
    );
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
    
    // Summaries
    getSalesSummary,
    getDebtSummary,
    getClientDebt
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};
