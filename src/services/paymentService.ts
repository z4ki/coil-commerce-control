import { supabase } from '@/integrations/supabase/client';
import { Payment, BulkPayment } from '@/types';
import { addOverpaymentCredit } from './creditService';
import { getSaleById } from './saleService';
import { Database } from '@/integrations/supabase/types';

type DbPayment = Database['public']['Tables']['payments']['Row'];
type DbPaymentInsert = Database['public']['Tables']['payments']['Insert'];

const mapDbPaymentToPayment = (dbPayment: DbPayment): Payment => ({
  id: dbPayment.id,
  saleId: dbPayment.sale_id,
  clientId: dbPayment.client_id,
  amount: dbPayment.amount,
  date: new Date(dbPayment.date),
  method: dbPayment.method as 'cash' | 'bank_transfer' | 'check',
  notes: dbPayment.notes || undefined,
  generatesCredit: dbPayment.generates_credit,
  creditAmount: dbPayment.credit_amount,
  createdAt: new Date(dbPayment.created_at),
  updatedAt: dbPayment.updated_at ? new Date(dbPayment.updated_at) : undefined,
});

export const getPaymentsBySale = async (saleId: string): Promise<Payment[]> => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('sale_id', saleId)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }

  return (data || []).map(mapDbPaymentToPayment);
};

export const getPaymentsByClient = async (clientId: string): Promise<Payment[]> => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }

  return (data || []).map(mapDbPaymentToPayment);
};

export const getPayments = async (): Promise<Payment[]> => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return (data as unknown as DbPayment[]).map(mapDbPaymentToPayment);
};

export const addPayment = async (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'generatesCredit' | 'creditAmount'>): Promise<Payment> => {
  // Get the sale to check for overpayment
  const sale = await getSaleById(payment.saleId);
  if (!sale) {
    throw new Error('Sale not found');
  }

  // Calculate total paid for this sale
  const { data: existingPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('sale_id', payment.saleId);

  const totalPaid = (existingPayments || []).reduce((sum, p) => sum + p.amount, 0);
  const newTotal = totalPaid + payment.amount;
  const overpaymentAmount = Math.max(0, newTotal - sale.totalAmountTTC);

  // Prepare payment data
  const paymentData: DbPaymentInsert = {
    sale_id: payment.saleId,
    client_id: payment.clientId,
    date: payment.date.toISOString(),
    amount: payment.amount,
    method: payment.method,
    notes: payment.notes || null,
    generates_credit: overpaymentAmount > 0,
    credit_amount: overpaymentAmount,
  };

  // Insert the payment
  const { data, error } = await supabase
    .from('payments')
    .insert(paymentData)
    .select()
    .single();

  if (error) {
    console.error('Error adding payment:', error);
    throw error;
  }

  // If there's an overpayment, create a credit transaction
  if (overpaymentAmount > 0) {
    await addOverpaymentCredit(
      payment.clientId,
      overpaymentAmount,
      data.id,
      'Overpayment from sale ' + payment.saleId
    );
  }

  return mapDbPaymentToPayment(data);
};

export const addBulkPayment = async (payment: BulkPayment): Promise<Payment[]> => {
  const bulkPaymentId = crypto.randomUUID();
  const payments: DbPaymentInsert[] = [];
  let remainingAmount = payment.totalAmount;

  // If distribution is specified, create payments according to it
  if (payment.distribution && payment.distribution.length > 0) {
    for (const dist of payment.distribution) {
      if (remainingAmount <= 0) break;
      const amount = Math.min(dist.amount, remainingAmount);
      payments.push({
        sale_id: dist.saleId,
        client_id: payment.clientId,
        bulk_payment_id: bulkPaymentId,
        date: payment.date.toISOString(),
        amount,
        method: payment.method,
        notes: payment.notes || null
      });
      remainingAmount -= amount;
    }
  }

  const { data, error } = await supabase
    .from('payments')
    .insert(payments)
    .select();

  if (error) throw error;
  return (data as DbPayment[]).map(mapDbPaymentToPayment);
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
  return mapDbPaymentToPayment(data as DbPayment);
};

export const deletePayment = async (paymentId: string): Promise<void> => {
  // Get the payment first to check if it generated credit
  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (fetchError) {
    console.error('Error fetching payment:', fetchError);
    throw fetchError;
  }

  // If the payment generated credit, we need to handle that in the transaction
  if (payment.generates_credit) {
    const { error } = await supabase.rpc('delete_payment_with_credit', {
      payment_id: paymentId
    });

    if (error) {
      console.error('Error deleting payment with credit:', error);
      throw error;
    }
  } else {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId);

    if (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  }
};
