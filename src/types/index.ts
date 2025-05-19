// Define the type for a business client
export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  nif?: string; // Numéro d'Identification Fiscale
  nis?: string; // Numéro d'Identification Statistique
  rc?: string;  // Registre du Commerce
  ai?: string;  // Article d'Imposition
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
  sale_id?: string;
}

// Define the type for a sale
export interface Sale {
  id: string;
  clientId: string;
  date: Date;
  items: SaleItem[];
  notes?: string;
  isInvoiced: boolean;
  invoiceId?: string | null;
  transportationFee: number;
  transportationFeeTTC: number;
  totalAmountHT: number;
  totalAmountTTC: number;
  taxRate: number;
  paymentMethod: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Define the type for an invoice
export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  date: Date;
  dueDate: Date;
  salesIds: string[];
  totalAmountHT: number;
  totalAmountTTC: number;
  taxRate: number;
  isPaid: boolean;
  paidAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

// Define the type for a payment
export interface Payment {
  id: string;
  invoiceId: string;
  date: Date;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  notes?: string;
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
}

// Define the type for application settings
export interface AppSettings {
  id?: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyLogo?: string;
  taxRate: number;
  currency: string;
  nif?: string;
  nis?: string;
  rc?: string;
  ai?: string;
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
