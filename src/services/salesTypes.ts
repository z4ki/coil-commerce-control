// Shared types
export type PaymentMethodType = 'cash' | 'bank_transfer' | 'check' | 'term';

// Domain types
export interface SaleItem {
  id: string;
  description: string;
  coilRef?: string;
  coilThickness?: number;
  coilWidth?: number;
  topCoatRAL?: string;
  backCoatRAL?: string;
  coilWeight?: number;
  quantity: number;
  pricePerTon: number;
  totalAmountHT: number;
  totalAmountTTC: number;
}

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
  paymentMethod?: PaymentMethodType;
  transportationFee?: number;
  taxRate: number;
  createdAt: Date;
  updatedAt?: Date;
}

// Database types
export interface DbSaleItem {
  id?: string;
  sale_id: string;
  description: string;
  coil_ref: string | null;
  coil_thickness: number | null;
  coil_width: number | null;
  top_coat_ral: string | null;
  back_coat_ral: string | null;
  coil_weight: number | null;
  quantity: number;
  price_per_ton: number;
  total_amount: number;
}

export interface DbSale {
  id?: string;
  client_id: string;
  date: string;
  total_amount: number;
  is_invoiced: boolean;
  invoice_id: string | null;
  notes: string | null;
  payment_method: PaymentMethodType | null;
  tax_rate: number;
  transportation_fee: number | null;
  created_at: string;
  updated_at: string | null;
  sale_items?: DbSaleItem[];
}
