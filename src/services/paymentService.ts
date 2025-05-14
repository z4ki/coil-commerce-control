
import { supabase } from '@/integrations/supabase/client';
import { Payment } from '@/types';

export const getPaymentsByInvoiceId = async (invoiceId: string): Promise<Payment[]> => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
    
    return data.map(item => ({
      id: item.id,
      invoiceId: item.invoice_id,
      date: new Date(item.date),
      amount: Number(item.amount),
      method: item.method as 'cash' | 'bank_transfer' | 'check' | 'credit_card',
      notes: item.notes || '',
      createdAt: new Date(item.created_at),
      updatedAt: item.updated_at ? new Date(item.updated_at) : undefined,
      user_id: item.user_id
    }));
  } catch (error) {
    console.error('Error in getPaymentsByInvoiceId:', error);
    throw error;
  }
};

export const createPayment = async (
  invoiceId: string,
  payment: Omit<Payment, 'id' | 'invoiceId' | 'createdAt' | 'updatedAt' | 'user_id'>
): Promise<Payment> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('payments')
      .insert({
        invoice_id: invoiceId,
        date: payment.date.toISOString(),
        amount: payment.amount,
        method: payment.method,
        notes: payment.notes,
        user_id: user.id
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
      amount: Number(data.amount),
      method: data.method as 'cash' | 'bank_transfer' | 'check' | 'credit_card',
      notes: data.notes || '',
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      user_id: data.user_id
    };
  } catch (error) {
    console.error('Error in createPayment:', error);
    throw error;
  }
};

export const deletePayment = async (id: string): Promise<void> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deletePayment:', error);
    throw error;
  }
};
