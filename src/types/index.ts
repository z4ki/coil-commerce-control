// Define shared types and enums
export type PaymentMethodType = 'cash' | 'bank_transfer' | 'check' | 'term';

export enum ProductType {
    TN40 = 'TN40',
    STEEL_SLITTING = 'STEEL_SLITTING',
    STANDARD = 'STANDARD'
}

// Product type specific properties
export interface TN40Properties {
    coilRef?: string;
    coilThickness?: number;
    coilWidth?: number;
    topCoatRAL?: string;
    backCoatRAL?: string;
    coilWeight?: number;
}

export interface SteelSlittingProperties {
    coilRef?: string;
    inputWidth?: number;
    outputWidth?: number;
    thickness?: number;
    weight?: number;
    stripsCount?: number;
}

// Define base entity type
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt?: Date;
}

// Define client type
export interface Client extends BaseEntity {
    name: string;
    company?: string;
    address: string;
    phone: string;
    email: string;
    nif?: string;
    nis?: string;
    rc?: string;
    ai?: string;
    rib?: string;
    notes?: string;
    creditBalance: number;
}

// Define sale item type
export interface SaleItem {
    id: string;
    description: string;
    productType: ProductType;
    // TN40 properties
    coilRef?: string;
    coilThickness?: number;
    coilWidth?: number;
    topCoatRAL?: string;
    backCoatRAL?: string;
    coilWeight?: number;
    // Steel Slitting properties
    inputWidth?: number;
    outputWidth?: number;
    thickness?: number;
    weight?: number;
    stripsCount?: number;
    // Common properties
    quantity: number;
    pricePerTon: number;
    totalAmountHT: number;
    totalAmountTTC: number;
    sale_id?: string;
}

// Define sale type
export interface Sale extends BaseEntity {
    clientId: string;
    date: Date;
    items: SaleItem[];
    totalAmountHT: number;
    totalAmountTTC: number;
    transportationFee?: number;
    notes?: string;
    isInvoiced: boolean;
    invoiceId?: string;
    paymentMethod: PaymentMethodType;
    productType: ProductType;
    taxRate: number;
}

// Define payment type
export interface Payment extends BaseEntity {
    saleId?: string;
    clientId: string;
    bulkPaymentId?: string;
    date: Date;
    amount: number;
    method: PaymentMethodType;
    notes?: string;
    generatesCredit: boolean;
}

// Define invoice type
export interface Invoice extends BaseEntity {
    clientId: string;
    date: Date;
    number: string;
    salesIds: string[];
    sales: Sale[];
    totalAmountHT: number;
    totalAmountTTC: number;
    transportationFee?: number;
    notes?: string;
    isPaid: boolean;
    dueDate?: Date;
}

// Define payment status type
export interface PaymentStatus {
    totalPaid: number;
    remainingAmount: number;
    isFullyPaid: boolean;
}

// Define credit transaction type
export interface CreditTransaction {
    id: string;
    clientId: string;
    amount: number;
    type: 'credit' | 'debit';
    sourceType: 'payment' | 'refund' | 'manual_adjustment' | 'credit_use';
    sourceId?: string;
    notes?: string;
    createdAt: Date;
    updatedAt?: Date;
}

// Define client credit status type
export interface ClientCreditStatus {
    availableCredit: number;
    pendingCredits: number;
    usedCredits: number;
    transactions: CreditTransaction[];
}

// Define bulk payment type
export interface BulkPayment {
    id: string;
    clientId: string;
    totalAmount: number;
    date: Date;
    method: PaymentMethodType;
    notes?: string;
    distribution?: {
        saleId: string;
        amount: number;
    }[];
    createdAt: Date;
    updatedAt?: Date;
}

// Define dashboard stats type
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

// Define sales summary type
export interface SalesSummary {
    totalSales: number;
    invoicedSales: number;
    uninvoicedSales: number;
    totalAmount: number;
    monthlySales: {
        month: string;
        monthKey?: string;
        amountTTC: number;
    }[];
}

// Define debt summary type
export interface DebtSummary {
    totalDebtTTC: number;
    overdueDebtTTC: number;
    upcomingDebtTTC: number;
    debtByClient: {
        clientId: string;
        clientName: string;
        amountTTC: number;
    }[];
    count: number;
    totalAmount: number;
}

// Define filter types
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

// Define company profile type
export interface CompanyProfile {
    name: string;
    address: string;
    phone: string;
    email: string;
    nif?: string;
    nis?: string;
    rc?: string;
    ai?: string;
    rib?: string;
    taxId?: string;
    logo?: string;
}

// Define company settings type
export interface CompanySettings {
    name: string;
    address: string;
    phone: string;
    email: string;
    nif: string;
    nis: string;
    rc: string;
    ai: string;
    rib: string;
}

// Define app settings type
export interface AppSettings {
    id?: string;
    company: CompanyProfile;
    language: 'en' | 'fr';
    theme: 'light' | 'dark';
    currency: string;
    notifications?: boolean;
    darkMode?: boolean;
    user_id?: string;
}
