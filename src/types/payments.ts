export interface Payment {
  id: string;
  saleId: string;
  clientId: string;
  bulkPaymentId?: string;
  date: Date;
  amount: number;
  method: string;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  checkNumber?: string;
}
