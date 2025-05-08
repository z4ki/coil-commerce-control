// Client Model
export interface Client {
  id: string;
  name: string;
  company: string; // maps to company_name in DB
  email: string; // maps to contact_email in DB
  phone: string; // maps to contact_phone in DB
  address: string;
  nif?: string;
  nis?: string;
  rc?: string;
  ai?: string;
  createdAt: Date; // maps to created_at in DB
}

// Article in a Sale
export interface SaleItem {
  id: string;
  description: string;
  coilRef?: string;
  coilThickness?: number; // thickness in mm
  coilWidth?: number; // width in mm
  quantity: number; // in tons
  pricePerTon: number;
  totalAmount: number;
}

// Sale Model
export interface Sale {
  id: string;
  clientId: string;
  date: Date; // maps to sale_date in DB
  items: SaleItem[];
  totalAmount: number;
  isInvoiced: boolean;
  invoiceId?: string;
  notes?: string;
  transportationFee?: number;
  taxRate?: number;
  createdAt: Date;
}

// Invoice Model
export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  date: Date; // maps to issue_date in DB
  dueDate: Date;
  totalAmount: number;
  isPaid: boolean;
  paidAt?: Date;
  salesIds: string[];
  createdAt: Date;
}

// Payment Model
export interface Payment {
  id: string;
  invoiceId: string;
  date: Date; // maps to payment_date in DB
  amount: number; // maps to amount_paid in DB
  method: string; // maps to payment_method in DB
  notes?: string;
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
