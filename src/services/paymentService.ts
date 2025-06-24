import { supabase } from '@/integrations/supabase/client';
import { Payment, PaymentMethodType } from '@/types/index';
import { core } from '@tauri-apps/api';
import { tauriApi } from '@/lib/tauri-api';

// Interface for what Supabase returns in the database for payments
interface DbPaymentResponse {
  id: string;
  sale_id: string;
  client_id: string;
  bulk_payment_id?: string | null;
  date: string;
  amount: number;
  method: string; // This will be 'cash', 'bank_transfer', 'check', 'term', 'deferred'
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  is_deleted?: boolean | number | null;
  deleted_at?: string | null;
  // Ensure no 'credit_amount' or 'generates_credit' here unless they are truly in your DB table
}

// Interface for data being inserted into Supabase for payments
interface DbPaymentInsert {
  sale_id: string;
  client_id: string;
  bulk_payment_id?: string | null;
  date: string;
  amount: number;
  method: PaymentMethodType | 'deferred'; // Use the correct type for method
  notes: string | null;
  // DO NOT include 'credit_amount' or 'generates_credit' if columns don't exist
}

const mapDbPaymentToPayment = (dbPayment: DbPaymentResponse): Payment => ({
  id: dbPayment.id,
  saleId: dbPayment.sale_id,
  clientId: dbPayment.client_id,
  bulkPaymentId: dbPayment.bulk_payment_id || undefined,
  date: new Date(dbPayment.date),
  amount: Number(dbPayment.amount), // Ensure amount is a number
  method: dbPayment.method as Payment['method'], // Cast to the App's Payment method type
  notes: dbPayment.notes || undefined,
  createdAt: new Date(dbPayment.created_at),
  updatedAt: dbPayment.updated_at ? new Date(dbPayment.updated_at) : undefined,
  isDeleted: !!dbPayment.is_deleted,
  deletedAt: dbPayment.deleted_at ? new Date(dbPayment.deleted_at) : undefined,
});

export const getPayments = async (): Promise<Payment[]> => {
  const backendPayments = await tauriApi.payments.getAll() as any[];
  if (!Array.isArray(backendPayments)) return [];
  return backendPayments.map((p: any) => ({
    id: p.id,
    saleId: p.sale_id,
    clientId: p.client_id,
    bulkPaymentId: p.bulk_payment_id,
    date: new Date(p.date),
    amount: Number(p.amount),
    method: p.method,
    notes: p.notes || undefined,
    createdAt: new Date(p.created_at),
    updatedAt: p.updated_at ? new Date(p.updated_at) : undefined,
    invoiceId: p.invoice_id,
    isDeleted: !!p.is_deleted,
    deletedAt: p.deleted_at ? new Date(p.deleted_at) : undefined,
  }));
};

export const getPaymentsBySale = async (saleId: string): Promise<Payment[]> => {
  const payments = await getPayments();
  return payments.filter(p => p.saleId === saleId);
};

export const getPaymentsByClient = async (clientId: string): Promise<Payment[]> => {
  const payments = await getPayments();
  return payments.filter(p => p.clientId === clientId);
};

export const addPayment = async (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> => {
  const req = {
    sale_id: payment.saleId,
    client_id: payment.clientId,
    amount: payment.amount,
    date: payment.date.toISOString(),
    method: payment.method,
    notes: payment.notes || null,
  };
  const result = await core.invoke<any>('create_payment', { payment: req });
  return mapTauriPaymentToPayment(result);
};

function mapTauriPaymentToPayment(p: any): Payment {
  return {
    id: p.id,
    saleId: p.sale_id || p.saleId,
    invoiceId: p.invoice_id || p.invoiceId,
    clientId: p.client_id || p.clientId,
    amount: p.amount,
    date: new Date(p.date),
    method: p.method,
    notes: p.notes || undefined,
    createdAt: new Date(p.created_at),
    updatedAt: p.updated_at ? new Date(p.updated_at) : undefined,
    isDeleted: !!p.is_deleted,
    deletedAt: p.deleted_at ? new Date(p.deleted_at) : undefined,
  };
}

export const addBulkPayment = async (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'saleId' | 'amount'> & { totalAmount: number; distribution?: { saleId: string; amount: number }[] }): Promise<Payment[]> => {
  const paymentsToInsert: DbPaymentInsert[] = [];
  
  if (!payment.distribution || payment.distribution.length === 0) {
    // If no distribution, this function might need to behave differently or throw an error
    // For now, let's assume if distribution is missing, it's an error or not applicable here
    // Or, it could be a single payment not linked to a sale (e.g. general credit) - but our schema requires sale_id
    console.warn("addBulkPayment called without distribution. This scenario might not be fully handled.");
    // Depending on requirements, you might create a "placeholder" payment or throw.
    // For now, returning empty array if no distribution.
    return []; 
  }

  for (const dist of payment.distribution) {
    paymentsToInsert.push({
      sale_id: dist.saleId, // This is required by your schema
      client_id: payment.clientId,
      bulk_payment_id: undefined,
      date: payment.date.toISOString(),
      amount: dist.amount,
      method: payment.method,
      notes: payment.notes || null
    });
  }

  if (paymentsToInsert.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('payments')
    .insert(paymentsToInsert)
    .select();

  if (error) {
    console.error('Error adding bulk payments to Supabase:', error);
    throw error;
  }
  return (data || []).map(p => mapDbPaymentToPayment(p as DbPaymentResponse));
};


export const updatePayment = async (id: string, paymentUpdate: Partial<Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Payment> => {
  const updateData: Partial<DbPaymentInsert> & { updated_at?: string } = { // updated_at should be optional
    updated_at: new Date().toISOString()
  };

  if (paymentUpdate.saleId !== undefined) updateData.sale_id = paymentUpdate.saleId;
  if (paymentUpdate.clientId !== undefined) updateData.client_id = paymentUpdate.clientId;
  if (paymentUpdate.date !== undefined) updateData.date = paymentUpdate.date.toISOString();
  if (paymentUpdate.amount !== undefined) updateData.amount = paymentUpdate.amount;
  if (paymentUpdate.method !== undefined) updateData.method = paymentUpdate.method;
  if (paymentUpdate.notes !== undefined) updateData.notes = paymentUpdate.notes;
  if (paymentUpdate.bulkPaymentId !== undefined) updateData.bulk_payment_id = paymentUpdate.bulkPaymentId;
    
  const { data, error } = await supabase
    .from('payments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating payment in Supabase:', error);
    throw error;
  }
  if (!data) {
    throw new Error("No data returned from Supabase after payment update.");
  }
  return mapDbPaymentToPayment(data as DbPaymentResponse);
};

export const getDeletedPayments = async (): Promise<Payment[]> => {
  const backendPayments = await tauriApi.payments.getDeleted() as any[];
  if (!Array.isArray(backendPayments)) return [];
  return backendPayments.map((p: any) => ({
    id: p.id,
    saleId: p.sale_id,
    clientId: p.client_id,
    bulkPaymentId: p.bulk_payment_id,
    date: new Date(p.date),
    amount: Number(p.amount),
    method: p.method,
    notes: p.notes || undefined,
    createdAt: new Date(p.created_at),
    updatedAt: p.updated_at ? new Date(p.updated_at) : undefined,
    invoiceId: p.invoice_id,
    isDeleted: !!p.is_deleted,
    deletedAt: p.deleted_at ? new Date(p.deleted_at) : undefined,
  }));
};

export const restorePayment = async (id: string): Promise<void> => {
  await tauriApi.payments.restore(id);
};

export const deletePayment = async (id: string): Promise<void> => {
  await tauriApi.payments.delete(id);
};
