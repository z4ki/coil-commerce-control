// Shared types
export type PaymentMethodType = 'cash' | 'bank_transfer' | 'check' | 'term';

import { ProductType, TN40Properties, SteelSlittingProperties } from './productTypes';

// Domain types
export interface SaleItem {
  id: string;
  description: string;
  productType: ProductType;
  // Properties for TN40
  coilRef?: string;
  coilThickness?: number;
  coilWidth?: number;
  topCoatRAL?: string;
  backCoatRAL?: string;
  coilWeight?: number;
  // Properties for Steel Slitting
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
  product_type: ProductType;
  // TN40 properties
  coil_ref: string | null;
  coil_thickness: number | null;
  coil_width: number | null;
  top_coat_ral: string | null;
  back_coat_ral: string | null;
  coil_weight: number | null;
  // Steel Slitting properties
  input_width: number | null;
  output_width: number | null;
  thickness: number | null;
  weight: number | null;
  strips_count: number | null;
  // Common properties
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
