
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
  user_id?: string; // Added for Supabase
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
  totalAmount: number;
  sale_id?: string; // Added for Supabase
}

// Define the type for a sale
export interface Sale {
  id: string;
  clientId: string;
  date: Date;
  items: SaleItem[];
  totalAmount: number;
  isInvoiced: boolean;
  invoiceId?: string;
  notes?: string;
  transportationFee?: number;
  taxRate: number;
  createdAt: Date;
  updatedAt?: Date;
  user_id?: string; // Added for Supabase
}

// Define the type for an invoice
export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  date: Date;
  dueDate: Date;
  salesIds: string[];
  totalAmount: number;
  isPaid: boolean;
  paidAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
  user_id?: string; // Added for Supabase
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
  user_id?: string; // Added for Supabase
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
  id?: string; // Added for Supabase
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
  user_id?: string; // Added for Supabase
}

// Added missing types that were referenced in the code
export interface SalesSummary {
  totalSales: number;
  invoicedSales: number;
  uninvoicedSales: number;
  monthlySales: { month: string; amount: number }[];
}

export interface DebtSummary {
  totalDebt: number;
  overdueDebt: number;
  upcomingDebt: number;
  debtByClient: { clientId: string; clientName: string; amount: number }[];
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

// Type for the Supabase user and session
export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

// Type for the authentication context
export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}
