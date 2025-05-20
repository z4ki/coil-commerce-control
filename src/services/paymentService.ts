import { supabase } from '@/integrations/supabase/client';
import { Payment, BulkPayment } from '@/types';

interface DbPaymentResponse {
  id: string;
  sale_id: string;
  client_id: string;
  bulk_payment_id?: string;
  date: string;
  amount: number;
  method: string;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

interface DbPaymentInsert {
  sale_id: string;
  client_id: string;
  bulk_payment_id?: string;
  date: string;
  amount: number;
  method: string;
  notes?: string | null;
}

const mapDbPaymentToPayment = (dbPayment: DbPaymentResponse): Payment => ({
  id: dbPayment.id,
  saleId: dbPayment.sale_id,
  clientId: dbPayment.client_id,
  bulkPaymentId: dbPayment.bulk_payment_id,
  date: new Date(dbPayment.date),
  amount: dbPayment.amount,
  method: dbPayment.method as Payment['method'],
  notes: dbPayment.notes || undefined,
  createdAt: new Date(dbPayment.created_at),
  updatedAt: dbPayment.updated_at ? new Date(dbPayment.updated_at) : undefined,
});

export const getPaymentsBySale = async (saleId: string): Promise<Payment[]> => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('sale_id', saleId)
    .order('date', { ascending: false });

  if (error) throw error;
  return (data as DbPaymentResponse[]).map(mapDbPaymentToPayment);
};

export const getPaymentsByClient = async (clientId: string): Promise<Payment[]> => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: false });

  if (error) throw error;
  return (data as DbPaymentResponse[]).map(mapDbPaymentToPayment);
};

export const addPayment = async (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> => {
  const insertData: DbPaymentInsert = {
    sale_id: payment.saleId,
    client_id: payment.clientId,
    bulk_payment_id: payment.bulkPaymentId,
    date: payment.date.toISOString(),
    amount: payment.amount,
    method: payment.method,
    notes: payment.notes
  };

  const { data, error } = await supabase
    .from('payments')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return mapDbPaymentToPayment(data as DbPaymentResponse);
};

export const addBulkPayment = async (payment: BulkPayment): Promise<Payment[]> => {
  const bulkPaymentId = crypto.randomUUID();
  const payments: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  let remainingAmount = payment.totalAmount;

  // If distribution is specified, create payments according to it
  if (payment.distribution && payment.distribution.length > 0) {
    for (const dist of payment.distribution) {
      if (remainingAmount <= 0) break;
      const amount = Math.min(dist.amount, remainingAmount);
      payments.push({
        saleId: dist.saleId,
        clientId: payment.clientId,
        bulkPaymentId,
        date: payment.date,
        amount,
        method: payment.method,
        notes: payment.notes
      });
      remainingAmount -= amount;
    }
  }

  // Create all payments in a transaction
  const insertData: DbPaymentInsert[] = payments.map(p => ({
    sale_id: p.saleId,
    client_id: p.clientId,
    bulk_payment_id: p.bulkPaymentId,
    date: p.date.toISOString(),
    amount: p.amount,
    method: p.method,
    notes: p.notes
  }));

  const { data, error } = await supabase
    .from('payments')
    .insert(insertData)
    .select();

  if (error) throw error;
  return (data as DbPaymentResponse[]).map(mapDbPaymentToPayment);
};

export const updatePayment = async (id: string, payment: Partial<Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Payment> => {
  const updateData: Partial<DbPaymentInsert> & { updated_at: string } = {
    updated_at: new Date().toISOString()
  };

  if (payment.saleId !== undefined) updateData.sale_id = payment.saleId;
  if (payment.clientId !== undefined) updateData.client_id = payment.clientId;
  if (payment.date !== undefined) updateData.date = payment.date.toISOString();
  if (payment.amount !== undefined) updateData.amount = payment.amount;
  if (payment.method !== undefined) updateData.method = payment.method;
  if (payment.notes !== undefined) updateData.notes = payment.notes;

  const { data, error } = await supabase
    .from('payments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapDbPaymentToPayment(data as DbPaymentResponse);
};

export const deletePayment = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
