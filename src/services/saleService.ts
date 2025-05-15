import { supabase } from '@/integrations/supabase/client';
import { Sale, SaleItem, SalesFilter } from '@/types';

interface DbSale {
  id: string;
  client_id: string;
  date: string;
  total_amount: number;
  is_invoiced: boolean;
  invoice_id?: string;
  notes?: string;
  transportation_fee?: number;
  tax_rate?: number;
  created_at: string;
  updated_at?: string;
}

// Helper to convert database sale data to our application Sale type
const mapDbSaleToSale = async (dbSale: DbSale): Promise<Sale> => {
  // Fetch the sale items for this sale
  const { data: saleItems, error: saleItemsError } = await supabase
    .from('sale_items')
    .select('*')
    .eq('sale_id', dbSale.id);
  
  if (saleItemsError) {
    console.error('Error fetching sale items:', saleItemsError);
    throw saleItemsError;
  }
  
  // Map sale items to our application structure
  const items: SaleItem[] = (saleItems || []).map(item => ({
    id: item.id,
    description: item.description,
    coilRef: item.coil_ref,
    coilThickness: item.coil_thickness,
    coilWidth: item.coil_width,
    topCoatRAL: item.top_coat_ral,
    backCoatRAL: item.back_coat_ral,
    coilWeight: item.coil_weight,
    quantity: item.quantity,
    pricePerTon: item.price_per_ton,
    totalAmount: item.total_amount,
    sale_id: item.sale_id
  }));
  
  return {
    id: dbSale.id,
    clientId: dbSale.client_id,
    date: new Date(dbSale.date),
    items: items,
    totalAmount: dbSale.total_amount,
    isInvoiced: dbSale.is_invoiced,
    invoiceId: dbSale.invoice_id,
    notes: dbSale.notes,
    transportationFee: dbSale.transportation_fee,
    taxRate: dbSale.tax_rate,
    createdAt: new Date(dbSale.created_at),
    updatedAt: dbSale.updated_at ? new Date(dbSale.updated_at) : undefined
  };
};

export const getSales = async (): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
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
    .select('*')
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
  
  return await mapDbSaleToSale(data);
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

export const createSale = async (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sale> => {
  // First create the sale record
  const { data: newSale, error: saleError } = await supabase
    .from('sales')
    .insert({
      client_id: sale.clientId,
      date: sale.date.toISOString(),
      is_invoiced: sale.isInvoiced,
      notes: sale.notes,
      transportation_fee: sale.transportationFee,
      tax_rate: sale.taxRate,
      total_amount: 0 // This will be updated by the trigger after items are inserted
    })
    .select()
    .single();
  
  if (saleError) {
    console.error('Error creating sale:', saleError);
    throw saleError;
  }
  
  // Now create all the sale items
  const saleItems = sale.items.map(item => ({
    sale_id: newSale.id,
    description: item.description,
    coil_ref: item.coilRef,
    coil_thickness: item.coilThickness,
    coil_width: item.coilWidth,
    top_coat_ral: item.topCoatRAL,
    back_coat_ral: item.backCoatRAL,
    coil_weight: item.coilWeight,
    quantity: item.quantity,
    price_per_ton: item.pricePerTon,
    total_amount: item.quantity * item.pricePerTon
  }));
  
  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(saleItems);
  
  if (itemsError) {
    console.error('Error creating sale items:', itemsError);
    // Try to rollback the sale
    await supabase.from('sales').delete().eq('id', newSale.id);
    throw itemsError;
  }
  
  // Get the updated sale with its calculated total
  return await getSaleById(newSale.id) as Sale;
};

export const updateSale = async (id: string, sale: Partial<Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Sale> => {
  // First update the sale record
  interface UpdateData {
    client_id?: string;
    date?: string;
    is_invoiced?: boolean;
    invoice_id?: string;
    notes?: string;
    transportation_fee?: number;
    tax_rate?: number;
    updated_at: string;
  }

  const updateData: UpdateData = {
    updated_at: new Date().toISOString()
  };
  
  if (sale.clientId) updateData.client_id = sale.clientId;
  if (sale.date) updateData.date = sale.date.toISOString();
  if (sale.isInvoiced !== undefined) updateData.is_invoiced = sale.isInvoiced;
  if (sale.invoiceId !== undefined) updateData.invoice_id = sale.invoiceId;
  if (sale.notes !== undefined) updateData.notes = sale.notes;
  if (sale.transportationFee !== undefined) updateData.transportation_fee = sale.transportationFee;
  if (sale.taxRate !== undefined) updateData.tax_rate = sale.taxRate;
  
  const { error: updateError } = await supabase
    .from('sales')
    .update(updateData)
    .eq('id', id);
  
  if (updateError) {
    console.error('Error updating sale:', updateError);
    throw updateError;
  }
  
  // If items are being updated, handle them
  if (sale.items) {
    // First delete existing items
    const { error: deleteError } = await supabase
      .from('sale_items')
      .delete()
      .eq('sale_id', id);
    
    if (deleteError) {
      console.error('Error deleting existing sale items:', deleteError);
      throw deleteError;
    }
    
    // Then insert new items
    const saleItems = sale.items.map(item => ({
      sale_id: id,
      description: item.description,
      coil_ref: item.coilRef,
      coil_thickness: item.coilThickness,
      coil_width: item.coilWidth,
      top_coat_ral: item.topCoatRAL,
      back_coat_ral: item.backCoatRAL,
      coil_weight: item.coilWeight,
      quantity: item.quantity,
      price_per_ton: item.pricePerTon,
      total_amount: item.quantity * item.pricePerTon
    }));
    
    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems);
    
    if (itemsError) {
      console.error('Error creating new sale items:', itemsError);
      throw itemsError;
    }
  }
  
  // Get the updated sale
  return await getSaleById(id) as Sale;
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
