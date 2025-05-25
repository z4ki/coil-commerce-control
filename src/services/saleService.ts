import { supabase } from '@/integrations/supabase/client';
import { Sale, SaleItem, SalesFilter } from '@/types';

// Type for what Supabase returns in the database
interface DbSaleBase {
  id: string;
  client_id: string;
  date: string;
  total_amount: number;
  is_invoiced: boolean;
  invoice_id: string | null;
  notes: string | null;
  payment_method: string | null;
  tax_rate: number;
  transportation_fee: number | null;
  created_at: string;
  updated_at: string | null;
}

interface DbSaleItem {
  id: string;
  sale_id: string;
  description: string;
  coil_ref: string | null;
  coil_thickness: number | null;
  coil_width: number | null;
  top_coat_ral: string | null;
  back_coat_ral: string | null;
  coil_weight: number | null;
  quantity: number;
  price_per_ton: number;
  total_amount: number;
}

// Type for what Supabase returns in the response
interface SupabaseResponse extends DbSaleBase {
  sale_items: DbSaleItem[];
}

type DbSaleInsert = Omit<DbSaleBase, 'id' | 'created_at' | 'updated_at'>;

// Helper to convert database sale item to our application SaleItem type
const mapDbSaleItemToSaleItem = (dbItem: DbSaleItem): SaleItem => {
  // Calculate total amounts for the item
  const totalAmountHT = dbItem.quantity * dbItem.price_per_ton;
  const totalAmountTTC = totalAmountHT * 1.19; // Using standard 19% tax rate

  return {
    id: dbItem.id,
    description: dbItem.description,
    coilRef: dbItem.coil_ref || undefined,
    coilThickness: dbItem.coil_thickness || undefined,
    coilWidth: dbItem.coil_width || undefined,
    topCoatRAL: dbItem.top_coat_ral || undefined,
    backCoatRAL: dbItem.back_coat_ral || undefined,
    coilWeight: dbItem.coil_weight || undefined,
    quantity: dbItem.quantity,
    pricePerTon: dbItem.price_per_ton,
    totalAmountHT,
    totalAmountTTC
  };
};

// Helper to convert database sale data to our application Sale type
const mapDbSaleToSale = async (dbSale: SupabaseResponse): Promise<Sale> => {
  // Map sale items first
  const items = dbSale.sale_items.map(mapDbSaleItemToSaleItem);
  
  // Calculate base amounts from mapped items
  const itemsTotalHT = items.reduce((sum, item) => sum + item.totalAmountHT, 0);
  const itemsTotalTTC = items.reduce((sum, item) => sum + item.totalAmountTTC, 0);

  // Add transportation fee if exists
  const transportationFee = dbSale.transportation_fee || 0;
  const transportationFeeTTC = transportationFee * (1 + dbSale.tax_rate);

  // Calculate final totals
  const totalAmountHT = itemsTotalHT + transportationFee;
  const totalAmountTTC = itemsTotalTTC + transportationFeeTTC;

  return {
    id: dbSale.id,
    clientId: dbSale.client_id,
    date: new Date(dbSale.date),
    items,
    totalAmountHT,
    totalAmountTTC,
    isInvoiced: dbSale.is_invoiced,
    invoiceId: dbSale.invoice_id || undefined,
    notes: dbSale.notes || undefined,
    paymentMethod: dbSale.payment_method as Sale['paymentMethod'] || undefined,
    transportationFee: dbSale.transportation_fee || undefined,
    taxRate: dbSale.tax_rate,
    createdAt: new Date(dbSale.created_at),
    updatedAt: dbSale.updated_at ? new Date(dbSale.updated_at) : undefined
  };
};

// Type for raw sale data from Supabase
interface RawSaleData {
  id: string;
  client_id: string;
  date: string;
  total_amount: number;
  is_invoiced: boolean;
  invoice_id: string | null;
  notes: string | null;
  payment_method: string | null;
  tax_rate: number;
  transportation_fee: number | null;
  created_at: string;
  updated_at: string | null;
  sale_items: DbSaleItem[];
}

export const getSales = async (): Promise<Sale[]> => {
  const { data: salesData, error } = await supabase
    .from('sales')
    .select(`
      *,
      sale_items (*)
    `)
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
  
  // Map each sale and include its items
  const salesWithItems = await Promise.all((salesData || []).map(async (rawSale: RawSaleData) => {
    const sale: DbSaleBase = {
      id: rawSale.id,
      client_id: rawSale.client_id,
      date: rawSale.date,
      total_amount: rawSale.total_amount,
      is_invoiced: rawSale.is_invoiced,
      invoice_id: rawSale.invoice_id,
      notes: rawSale.notes,
      payment_method: rawSale.payment_method || null,
      tax_rate: rawSale.tax_rate,
      transportation_fee: rawSale.transportation_fee,
      created_at: rawSale.created_at,
      updated_at: rawSale.updated_at
    };

    const { data: items } = await supabase
      .from('sale_items')
      .select('*')
      .eq('sale_id', sale.id);
    
    const saleWithItems: SupabaseResponse = {
      ...sale,
      sale_items: (items || []) as DbSaleItem[]
    };
    
    return mapDbSaleToSale(saleWithItems);
  }));
  
  return salesWithItems;
};

export const getSaleById = async (id: string): Promise<Sale | null> => {
  const { data: sale, error } = await supabase
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
  
  if (!sale) return null;

  // Get sale items
  const { data: items } = await supabase
    .from('sale_items')
    .select('*')
    .eq('sale_id', id);
  
  const saleWithItems: SupabaseResponse = {
    ...(sale as DbSaleBase),
    sale_items: (items || []) as DbSaleItem[]
  };
  
  return mapDbSaleToSale(saleWithItems);
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
  total_amount: sale.totalAmountHT,
  is_invoiced: sale.isInvoiced,
  invoice_id: sale.invoiceId || null,
  notes: sale.notes || null,
  payment_method: sale.paymentMethod || null,
  tax_rate: sale.taxRate,
  transportation_fee: sale.transportationFee || null,
});

export const createSale = async (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sale> => {
  // First create the sale
  const saleData = mapSaleToDbSale(sale);
  const { data: newSale, error: saleError } = await supabase
    .from('sales')
    .insert({
      ...saleData,
      total_amount: sale.totalAmountHT // Store HT amount in database
    })
    .select()
    .single();

  if (saleError) throw saleError;
  if (!newSale) throw new Error('Failed to create sale');

  // Then create all sale items
  const saleItems = sale.items.map(item => ({
    sale_id: newSale.id,
    description: item.description,
    coil_ref: item.coilRef || null,
    coil_thickness: item.coilThickness || null,
    coil_width: item.coilWidth || null,
    top_coat_ral: item.topCoatRAL || null,
    back_coat_ral: item.backCoatRAL || null,
    coil_weight: item.coilWeight || null,
    quantity: item.quantity,
    price_per_ton: item.pricePerTon,
    total_amount: item.totalAmountHT // Store HT amount in database
  }));

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(saleItems);

  if (itemsError) throw itemsError;

  // Return the complete sale with items
  return getSaleById(newSale.id) as Promise<Sale>;
};

export const updateSale = async (id: string, sale: Partial<Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Sale> => {
  const updateData = {
    ...(sale.clientId && { client_id: sale.clientId }),
    ...(sale.date && { date: sale.date.toISOString() }),
    ...(sale.totalAmountHT !== undefined && { total_amount: sale.totalAmountHT }),
    ...(sale.isInvoiced !== undefined && { is_invoiced: sale.isInvoiced }),
    ...(sale.invoiceId !== undefined && { invoice_id: sale.invoiceId || null }),
    ...(sale.notes !== undefined && { notes: sale.notes || null }),
    ...(sale.paymentMethod !== undefined && { payment_method: sale.paymentMethod || null }),
    ...(sale.taxRate !== undefined && { tax_rate: sale.taxRate }),
    ...(sale.transportationFee !== undefined && { transportation_fee: sale.transportationFee || null }),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('sales')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapDbSaleToSale(data as SupabaseResponse);
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

