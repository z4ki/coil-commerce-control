// Define the type for a business client
export interface Client {
  id: string;
  name: string;
  company?: string;
  address: string;
  phone: string;
  email: string;
  nif?: string;
  nis?: string;
  rc?: string;
  ai?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Define the type for a sale item (materials sold)
export interface SaleItem {
  id: string;
  description: string;
  coilRef?: string; // Coil reference number
  coilThickness?: number; // Thickness in mm
  coilWidth?: number; // Width in mm
  topCoatRAL?: string; // RAL color code for top coat
  backCoatRAL?: string; // RAL color code for back coat
  coilWeight?: number; // Weight of the coil
  quantity: number; // In tons
  pricePerTon: number;
  totalAmountHT: number;
  totalAmountTTC: number;
}

// Define the type for a sale
export interface Sale {
  id: string;
  clientId: string;
  date: Date;
  items: SaleItem[];
  totalAmountHT: number;
  totalAmountTTC: number;
  isInvoiced: boolean;
  invoiceId?: string;
  notes?: string;
  paymentMethod?: 'cash' | 'bank_transfer' | 'check';
  createdAt: Date;
  updatedAt?: Date;
}

// Define the type for an invoice
export interface Invoice {
  id: string;
  clientId: string;
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  salesIds: string[];
  totalAmountHT: number;
  totalAmountTTC: number;
  isPaid: boolean;
  taxRate: number;
  paymentMethod?: string;
  transportationFee?: number;
  transportationFeeTTC?: number;
  createdAt: Date;
  updatedAt?: Date;
}

// Define the type for a payment
export interface Payment {
  id: string;
  clientId: string;
  saleId: string;
  amount: number;
  date: Date;
  method: 'cash' | 'bank_transfer' | 'check';
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Define the type for bulk payments
export interface BulkPayment {
  id: string;
  clientId: string;
  totalAmount: number;
  date: Date;
  method: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  notes?: string;
  distribution?: {
    saleId: string;
    amount: number;
  }[];
  createdAt: Date;
  updatedAt?: Date;
}

// Define the type for dashboard stats
export interface DashboardStats {
  totalSales: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  totalRevenue: number;
  revenueCollected: number;
  outstandingAmount: number;
  paymentMethodTotals: {
    cash: number;
    bank_transfer: number;
    check: number;
  };
}

// Define the type for company settings
export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  nif: string;
  nis: string;
  rc: string;
  ai: string;
}

// Define the type for app settings
export interface AppSettings {
  company: CompanySettings;
  language: string;
  theme: string;
  currency: string;
}

// Added missing types that were referenced in the code
export interface SalesSummary {
  totalSales: number;
  invoicedSales: number;
  uninvoicedSales: number;
  totalAmount: number;
  monthlySales: {
    month: string;
    amountTTC: number;
  }[];
}

export interface DebtSummary {
  totalDebtTTC: number;
  overdueDebtTTC: number;
  upcomingDebtTTC: number;
  debtByClient: {
    clientId: string;
    clientName: string;
    amountTTC: number;
  }[];
}

export interface SalesFilter {
  clientId?: string;
  isInvoiced?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface InvoiceFilter {
  clientId?: string;
  isPaid?: boolean;
  startDate?: Date;
  endDate?: Date;
}
