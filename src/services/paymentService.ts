
import { supabase } from '@/integrations/supabase/client';
import { Payment } from '@/types';

export const getPaymentsByInvoice = async (invoiceId: string): Promise<Payment[]> => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching payments for invoice:', error);
    throw error;
  }
  
  return (data || []).map(payment => ({
    id: payment.id,
    invoiceId: payment.invoice_id,
    date: new Date(payment.date),
    amount: payment.amount,
    method: payment.method as 'cash' | 'bank_transfer' | 'check' | 'credit_card',
    notes: payment.notes,
    createdAt: new Date(payment.created_at),
    updatedAt: payment.updated_at ? new Date(payment.updated_at) : undefined,
    user_id: payment.user_id
  }));
};

export const createPayment = async (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> => {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      invoice_id: payment.invoiceId,
      date: payment.date.toISOString(),
      amount: payment.amount,
      method: payment.method,
      notes: payment.notes
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
  
  return {
    id: data.id,
    invoiceId: data.invoice_id,
    date: new Date(data.date),
    amount: data.amount,
    method: data.method as 'cash' | 'bank_transfer' | 'check' | 'credit_card',
    notes: data.notes,
    createdAt: new Date(data.created_at),
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
  };
};

export const updatePayment = async (id: string, payment: Partial<Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Payment> => {
  const updateData: any = {
    updated_at: new Date().toISOString()
  };
  
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
  
  if (error) {
    console.error('Error updating payment:', error);
    throw error;
  }
  
  return {
    id: data.id,
    invoiceId: data.invoice_id,
    date: new Date(data.date),
    amount: data.amount,
    method: data.method as 'cash' | 'bank_transfer' | 'check' | 'credit_card',
    notes: data.notes,
    createdAt: new Date(data.created_at),
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
  };
};

export const deletePayment = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting payment:', error);
    throw error;
  }
};

export const getInvoiceRemainingAmount = async (invoiceId: string): Promise<number> => {
  // Get the invoice total
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('total_amount')
    .eq('id', invoiceId)
    .single();
  
  if (invoiceError) {
    console.error('Error fetching invoice total:', invoiceError);
    throw invoiceError;
  }
  
  // Get the sum of payments
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select()
    .eq('invoice_id', invoiceId);
  
  if (paymentsError) {
    console.error('Error fetching invoice payments:', paymentsError);
    throw paymentsError;
  }
  
  const totalPaid = (payments || []).reduce((sum, payment) => sum + payment.amount, 0);
  
  return Math.max(0, invoice.total_amount - totalPaid);
};
