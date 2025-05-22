import { supabase } from '@/integrations/supabase/client';
import { Sale, SaleItem, SalesFilter } from '@/types';

interface DbSale {
  id: string;
  client_id: string;
  date: string;
  total_amount_ht: number;
  total_amount_ttc: number;
  is_invoiced: boolean;
  invoice_id: string | null;
  notes: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string | null;
}

type DbSaleInsert = Omit<DbSale, 'id' | 'created_at' | 'updated_at'>;

interface DbSaleResponse {
  id: string;
  client_id: string;
  date: string;
  total_amount_ht: number;
  total_amount_ttc: number;
  is_invoiced: boolean;
  invoice_id: string | null;
  notes: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string | null;
  [key: string]: unknown;
}

// Helper to convert database sale data to our application Sale type
const mapDbSaleToSale = (dbSale: DbSaleResponse): Sale => ({
  id: dbSale.id,
  clientId: dbSale.client_id,
  date: new Date(dbSale.date),
  items: [],
  totalAmountHT: dbSale.total_amount_ht,
  totalAmountTTC: dbSale.total_amount_ttc,
  isInvoiced: dbSale.is_invoiced,
  invoiceId: dbSale.invoice_id || undefined,
  notes: dbSale.notes || undefined,
  paymentMethod: dbSale.payment_method as Sale['paymentMethod'] || undefined,
  createdAt: new Date(dbSale.created_at),
  updatedAt: dbSale.updated_at ? new Date(dbSale.updated_at) : undefined,
});

export const getSales = async (): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from('sales')
    .select()
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
  
  // Map each sale and include its items
  const salesWithItems = await Promise.all((data || []).map(mapDbSaleToSale));
  return salesWithItems;
};

export const getSaleById = async (id: string): Promise<Sale | null> => {
  const { data, error } = await supabase
    .from('sales')
    .select()
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching sale:', error);
    throw error;
  }
  
  if (!data) return null;
  
  return mapDbSaleToSale(data as DbSaleResponse);
};

export const getSalesByClient = async (clientId: string): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching sales by client:', error);
    throw error;
  }
  
  const salesWithItems = await Promise.all((data || []).map(mapDbSaleToSale));
  return salesWithItems;
};

export const getSalesByFilter = async (filter: SalesFilter): Promise<Sale[]> => {
  let query = supabase.from('sales').select('*');
  
  if (filter.clientId) {
    query = query.eq('client_id', filter.clientId);
  }
  
  if (filter.isInvoiced !== undefined) {
    query = query.eq('is_invoiced', filter.isInvoiced);
  }
  
  if (filter.startDate) {
    query = query.gte('date', filter.startDate.toISOString());
  }
  
  if (filter.endDate) {
    query = query.lte('date', filter.endDate.toISOString());
  }
  
  query = query.order('date', { ascending: false });
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching sales by filter:', error);
    throw error;
  }
  
  const salesWithItems = await Promise.all((data || []).map(mapDbSaleToSale));
  return salesWithItems;
};

const mapSaleToDbSale = (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>): DbSaleInsert => ({
  client_id: sale.clientId,
  date: sale.date.toISOString(),
  total_amount_ht: sale.totalAmountHT,
  total_amount_ttc: sale.totalAmountTTC,
  is_invoiced: sale.isInvoiced,
  invoice_id: sale.invoiceId || null,
  notes: sale.notes || null,
  payment_method: sale.paymentMethod || null,
});

export const createSale = async (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sale> => {
  const { data, error } = await supabase
    .from('sales')
    .insert([mapSaleToDbSale(sale)])
    .select()
    .single();

  if (error) throw error;
  return mapDbSaleToSale(data as DbSaleResponse);
};

export const updateSale = async (id: string, sale: Partial<Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Sale> => {
  const updateData = {
    ...(sale.clientId && { client_id: sale.clientId }),
    ...(sale.date && { date: sale.date.toISOString() }),
    ...(sale.totalAmountHT !== undefined && { total_amount_ht: sale.totalAmountHT }),
    ...(sale.totalAmountTTC !== undefined && { total_amount_ttc: sale.totalAmountTTC }),
    ...(sale.isInvoiced !== undefined && { is_invoiced: sale.isInvoiced }),
    ...(sale.invoiceId !== undefined && { invoice_id: sale.invoiceId || null }),
    ...(sale.notes !== undefined && { notes: sale.notes || null }),
    ...(sale.paymentMethod !== undefined && { payment_method: sale.paymentMethod || null }),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('sales')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapDbSaleToSale(data as DbSaleResponse);
};

export const deleteSale = async (id: string): Promise<void> => {
  // Delete the sale (cascade will delete the items)
  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting sale:', error);
    throw error;
  }
};

