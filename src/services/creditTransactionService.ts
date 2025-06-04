import { supabase } from '../integrations/supabase/client';
import type { CreditTransaction } from '../types';

export type CreditTransactionInput = Omit<CreditTransaction, 'id' | 'createdAt' | 'updatedAt' | 'user_id'>;
export type CreditTransactionUpdate = Partial<CreditTransactionInput>;

export const createCreditTransaction = async (transaction: CreditTransactionInput): Promise<CreditTransaction> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('credit_transactions')
      .insert({
        client_id: transaction.client_id,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date.toISOString(),
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating credit transaction:', error);
      throw error;
    }

    return {
      id: data.id,
      client_id: data.client_id,
      amount: Number(data.amount),
      description: data.description,
      date: new Date(data.date),
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      user_id: data.user_id
    };
  } catch (error) {
    console.error('Error in createCreditTransaction:', error);
    throw error;
  }
};

export const getCreditTransactionsByClientId = async (clientId: string): Promise<CreditTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching credit transactions:', error);
      throw error;
    }

    return data.map(item => ({
      id: item.id,
      client_id: item.client_id,
      amount: Number(item.amount),
      description: item.description,
      date: new Date(item.date),
      createdAt: new Date(item.created_at),
      updatedAt: item.updated_at ? new Date(item.updated_at) : undefined,
      user_id: item.user_id
    }));
  } catch (error) {
    console.error('Error in getCreditTransactionsByClientId:', error);
    throw error;
  }
};

export const updateCreditTransaction = async (
  id: string, 
  transaction: CreditTransactionUpdate
): Promise<CreditTransaction> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updateData: any = {};
    if (transaction.client_id !== undefined) updateData.client_id = transaction.client_id;
    if (transaction.amount !== undefined) updateData.amount = transaction.amount;
    if (transaction.description !== undefined) updateData.description = transaction.description;
    if (transaction.date !== undefined) updateData.date = transaction.date.toISOString();
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('credit_transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating credit transaction:', error);
      throw error;
    }

    return {
      id: data.id,
      client_id: data.client_id,
      amount: Number(data.amount),
      description: data.description,
      date: new Date(data.date),
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      user_id: data.user_id
    };
  } catch (error) {
    console.error('Error in updateCreditTransaction:', error);
    throw error;
  }
};

export const deleteCreditTransaction = async (id: string): Promise<void> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('credit_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting credit transaction:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteCreditTransaction:', error);
    throw error;
  }
};
