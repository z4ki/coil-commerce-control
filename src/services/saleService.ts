import { supabase } from '@/integrations/supabase/client';
import type { Sale, SaleItem, DbSale, DbSaleItem } from './salesTypes';
import { ProductType } from './productTypes';

// Type for sale filters
export interface SalesFilter {
  clientId?: string;
  isInvoiced?: boolean;
  startDate?: Date;
  endDate?: Date;
}

// Mapping functions
function mapDbSaleItemToSaleItem(dbItem: DbSaleItem): SaleItem {
  return {
    id: dbItem.id || '',
    description: dbItem.description,
    productType: dbItem.product_type,
    // TN40 properties
    coilRef: dbItem.coil_ref || undefined,
    coilThickness: dbItem.coil_thickness || undefined,
    coilWidth: dbItem.coil_width || undefined,
    topCoatRAL: dbItem.top_coat_ral || undefined,
    backCoatRAL: dbItem.back_coat_ral || undefined,
    coilWeight: dbItem.coil_weight || undefined,
    // Steel Slitting properties
    inputWidth: dbItem.input_width || undefined,
    outputWidth: dbItem.output_width || undefined,
    thickness: dbItem.thickness || undefined,
    weight: dbItem.weight || undefined,
    stripsCount: dbItem.strips_count || undefined,
    // Common properties
    quantity: dbItem.quantity,
    pricePerTon: dbItem.price_per_ton,
    totalAmountHT: dbItem.total_amount,
    totalAmountTTC: dbItem.total_amount * 1.19
  };
}

function mapSaleItemToDbSaleItem(item: SaleItem, saleId: string): DbSaleItem {
  return {
    sale_id: saleId,
    description: item.description,
    product_type: item.productType,
    // TN40 properties
    coil_ref: item.coilRef || null,
    coil_thickness: item.coilThickness || null,
    coil_width: item.coilWidth || null,
    top_coat_ral: item.topCoatRAL || null,
    back_coat_ral: item.backCoatRAL || null,
    coil_weight: item.coilWeight || null,
    // Steel Slitting properties
    input_width: item.inputWidth || null,
    output_width: item.outputWidth || null,
    thickness: item.thickness || null,
    weight: item.weight || null,
    strips_count: item.stripsCount || null,
    // Common properties
    quantity: item.quantity,
    price_per_ton: item.pricePerTon,
    total_amount: item.totalAmountHT
  };
}

function mapDbSaleToSale(dbSale: DbSale): Sale {
  const items = dbSale.sale_items?.map(mapDbSaleItemToSaleItem) || [];
  const totalAmountHT = items.reduce((sum, item) => sum + item.totalAmountHT, 0) + (dbSale.transportation_fee || 0);
  const totalAmountTTC = totalAmountHT * (1 + dbSale.tax_rate);

  return {
    id: dbSale.id || '',
    clientId: dbSale.client_id,
    date: new Date(dbSale.date),
    items,
    totalAmountHT,
    totalAmountTTC,
    isInvoiced: dbSale.is_invoiced,
    invoiceId: dbSale.invoice_id || undefined,
    notes: dbSale.notes || undefined,
    paymentMethod: dbSale.payment_method || undefined,
    transportationFee: dbSale.transportation_fee || undefined,
    taxRate: dbSale.tax_rate,
    createdAt: new Date(dbSale.created_at),
    updatedAt: dbSale.updated_at ? new Date(dbSale.updated_at) : undefined
  };
}

// Database operations
export const createSale = async (sale: Omit<Sale, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sale> => {
  const saleData = {
    client_id: sale.clientId,
    date: sale.date.toISOString(),
    total_amount: sale.totalAmountHT,
    is_invoiced: sale.isInvoiced,
    invoice_id: sale.invoiceId || null,
    notes: sale.notes || null,
    payment_method: sale.paymentMethod || null,
    tax_rate: sale.taxRate,
    transportation_fee: sale.transportationFee || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data: newSale, error: saleError } = await supabase
    .from('sales')
    .insert(saleData)
    .select()
    .single();

  if (saleError) throw saleError;
  if (!newSale) throw new Error('Failed to create sale');

  const saleItems = sale.items.map((item: SaleItem) => mapSaleItemToDbSaleItem(item, newSale.id));

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(saleItems);

  if (itemsError) {
    await supabase.from('sales').delete().eq('id', newSale.id);
    throw itemsError;
  }

  const createdSale = await getSaleById(newSale.id);
  if (!createdSale) throw new Error('Failed to retrieve created sale');
  return createdSale;
};

export const getSales = async (): Promise<Sale[]> => {
  const { data: salesData, error } = await supabase
    .from('sales')
    .select(`
      *,
      sale_items (*)
    `)
    .order('date', { ascending: false });
  
  if (error) throw error;
  
  return (salesData || []).map(sale => mapDbSaleToSale(sale as DbSale));
};

export const getSaleById = async (id: string): Promise<Sale | null> => {
  const { data: sale, error } = await supabase
    .from('sales')
    .select(`
      *,
      sale_items (*)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return sale ? mapDbSaleToSale(sale as DbSale) : null;
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
    updated_at: new Date().toISOString()
  };

  const { data: updatedSale, error: updateError } = await supabase
    .from('sales')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) throw updateError;
  if (!updatedSale) throw new Error('Failed to update sale');

  if (sale.items) {
    const { error: deleteError } = await supabase
      .from('sale_items')
      .delete()
      .eq('sale_id', id);
    
    if (deleteError) throw deleteError;

    const saleItems = sale.items.map((item: SaleItem) => mapSaleItemToDbSaleItem(item, id));
    
    const { error: insertError } = await supabase
      .from('sale_items')
      .insert(saleItems);
    
    if (insertError) throw insertError;
  }

  const updatedSaleWithItems = await getSaleById(id);
  if (!updatedSaleWithItems) throw new Error('Failed to retrieve updated sale');
  return updatedSaleWithItems;
};

export const deleteSale = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
