// Shared types
export type PaymentMethodType = 'cash' | 'bank_transfer' | 'check' | 'term';

import { ProductType } from './productTypes';

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

import { Sale, SaleItem, PaymentMethodType } from '@/types/index';
import { Database } from '@/types/supabase';

// Database types
export type DbSale = Database['public']['Tables']['sales']['Row'];
export type DbSaleItem = Database['public']['Tables']['sale_items']['Row'];

// Type guards
export function isSale(obj: any): obj is Sale {
    return obj && 
        typeof obj === 'object' && 
        'id' in obj && 
        'clientId' in obj && 
        'date' in obj && 
        'items' in obj;
}

export function isSaleItem(obj: any): obj is SaleItem {
    return obj && 
        typeof obj === 'object' && 
        'id' in obj && 
        'description' in obj && 
        'quantity' in obj && 
        'pricePerTon' in obj;
}
