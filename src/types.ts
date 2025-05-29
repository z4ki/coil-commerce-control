export interface SaleItem {
  id: string;
  description: string;
  coilRef?: string;
  coilThickness?: number;
  coilWidth?: number;
  topCoatRAL?: string;
  backCoatRAL?: string;
  weightInTons: number;
  quantity: number;
  pricePerTon: number;
  totalAmountHT: number;
  totalAmountTTC: number;
  sale_id?: string;
} 