
// Client Model
export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Date;
}

// Sale Model
export interface Sale {
  id: string;
  clientId: string;
  date: Date;
  quantity: number; // in tons
  pricePerTon: number;
  totalAmount: number;
  isInvoiced: boolean;
  invoiceId?: string;
  createdAt: Date;
}

// Invoice Model
export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  date: Date;
  dueDate: Date;
  totalAmount: number;
  isPaid: boolean;
  paidAt?: Date;
  salesIds: string[];
  createdAt: Date;
}

// Dashboard Summary Types
export interface SalesSummary {
  totalSales: number;
  monthlySales: { month: string; amount: number }[];
  invoicedSales: number;
  uninvoicedSales: number;
}

export interface DebtSummary {
  totalDebt: number;
  overdueDebt: number;
  upcomingDebt: number;
  debtByClient: { clientId: string; clientName: string; amount: number }[];
}

// Filter types
export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

export interface ClientFilter {
  clientId?: string;
}

export interface StatusFilter {
  isInvoiced?: boolean;
  isPaid?: boolean;
}

export type SalesFilter = DateRangeFilter & ClientFilter & StatusFilter;
export type InvoiceFilter = DateRangeFilter & ClientFilter & { isPaid?: boolean };
