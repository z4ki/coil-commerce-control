// Database types for sale service
export type DbPaymentMethodType = 'cash' | 'bank_transfer' | 'check' | 'term';

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
  payment_method: DbPaymentMethodType | null;
  tax_rate: number;
  transportation_fee: number | null;
  created_at: string;
  updated_at: string | null;
  sale_items?: DbSaleItem[];
}
