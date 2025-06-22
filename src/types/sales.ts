// SaleItem type
export interface SaleItem {
  id: string;
  saleId: string;
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
  createdAt: Date;
  updatedAt?: Date;
}

// Sale type
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
  paymentMethod?: string;
  transportationFee?: number;
  taxRate: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  date: Date;
  dueDate: Date;
  salesIds: string[];
  totalAmountHT: number;
  totalAmountTTC: number;
  isPaid: boolean;
  paidAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}
