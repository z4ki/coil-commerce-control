import { supabase } from '@/integrations/supabase/client';
import { CreditTransaction, ClientCreditStatus } from '@/types';

interface DbCreditTransaction {
  id: string;
  client_id: string;
  amount: number;
  type: 'credit' | 'debit';
  source_type: 'payment' | 'refund' | 'manual_adjustment' | 'credit_use';
  source_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

const mapDbTransactionToTransaction = (dbTransaction: DbCreditTransaction): CreditTransaction => ({
  id: dbTransaction.id,
  clientId: dbTransaction.client_id,
  amount: dbTransaction.amount,
  type: dbTransaction.type,
  sourceType: dbTransaction.source_type,
  sourceId: dbTransaction.source_id || undefined,
  notes: dbTransaction.notes || undefined,
  createdAt: new Date(dbTransaction.created_at),
  updatedAt: dbTransaction.updated_at ? new Date(dbTransaction.updated_at) : undefined,
});

export const getClientCreditStatus = async (clientId: string): Promise<ClientCreditStatus> => {
  // Get client's current credit balance
  const { data: client } = await supabase
    .from('clients')
    .select('credit_balance')
    .eq('id', clientId)
    .single();

  // Get all credit transactions for the client
  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  // Calculate pending and used credits
  const pendingCredits = transactions
    ?.filter(t => t.type === 'credit' && t.source_type === 'payment')
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  const usedCredits = transactions
    ?.filter(t => t.type === 'debit' && t.source_type === 'credit_use')
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  return {
    availableCredit: client?.credit_balance || 0,
    pendingCredits,
    usedCredits,
    transactions: (transactions || []).map(mapDbTransactionToTransaction),
  };
};

export const addCreditTransaction = async (
  transaction: Omit<CreditTransaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CreditTransaction> => {
  const { data, error } = await supabase
    .from('credit_transactions')
    .insert({
      client_id: transaction.clientId,
      amount: transaction.amount,
      type: transaction.type,
      source_type: transaction.sourceType,
      source_id: transaction.sourceId || null,
      notes: transaction.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding credit transaction:', error);
    throw error;
  }

  return mapDbTransactionToTransaction(data);
};

export const useClientCredit = async (
  clientId: string,
  amount: number,
  sourceId: string,
  notes?: string
): Promise<CreditTransaction> => {
  // First check if client has enough credit
  const { data: client } = await supabase
    .from('clients')
    .select('credit_balance')
    .eq('id', clientId)
    .single();

  if (!client || client.credit_balance < amount) {
    throw new Error('Insufficient credit balance');
  }

  // Create a debit transaction
  return addCreditTransaction({
    clientId,
    amount,
    type: 'debit',
    sourceType: 'credit_use',
    sourceId,
    notes,
  });
};

export const addOverpaymentCredit = async (
  clientId: string,
  amount: number,
  paymentId: string,
  notes?: string
): Promise<CreditTransaction> => {
  return addCreditTransaction({
    clientId,
    amount,
    type: 'credit',
    sourceType: 'payment',
    sourceId: paymentId,
    notes: notes || 'Overpayment credit',
  });
};

export const addManualCreditAdjustment = async (
  clientId: string,
  amount: number,
  type: 'credit' | 'debit',
  notes: string
): Promise<CreditTransaction> => {
  return addCreditTransaction({
    clientId,
    amount,
    type,
    sourceType: 'manual_adjustment',
    notes,
  });
}; 