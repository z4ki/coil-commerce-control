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
  const items: SaleItem[] = (saleItems || []).map(item => {
    const itemTotalHT = Number(item.quantity || 0) * Number(item.price_per_ton || 0);
    return {
      id: item.id,
      description: item.description,
      coilRef: item.coil_ref,
      coilThickness: item.coil_thickness,
      coilWidth: item.coil_width,
      topCoatRAL: item.top_coat_ral,
      backCoatRAL: item.back_coat_ral,
      coilWeight: item.coil_weight,
      quantity: Number(item.quantity || 0),
      pricePerTon: Number(item.price_per_ton || 0),
      totalAmountHT: itemTotalHT,
      totalAmountTTC: itemTotalHT * (1 + (dbSale.tax_rate || 0.19)),
      sale_id: item.sale_id
    };
  });
  
  const totalAmountHT = Number(dbSale.total_amount || 0);
  const taxRate = Number(dbSale.tax_rate || 0.19);
  const totalAmountTTC = totalAmountHT * (1 + taxRate);
  const transportationFee = Number(dbSale.transportation_fee || 0);
  const transportationFeeTTC = transportationFee * (1 + taxRate);
  
  return {
    id: dbSale.id,
    clientId: dbSale.client_id,
    date: new Date(dbSale.date),
    items: items,
    totalAmountHT: totalAmountHT,
    totalAmountTTC: totalAmountTTC,
    isInvoiced: dbSale.is_invoiced,
    invoiceId: dbSale.invoice_id,
    notes: dbSale.notes,
    transportationFee: transportationFee,
    transportationFeeTTC: transportationFeeTTC,
    taxRate: taxRate,
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
  // Calculate total amount HT from items
  const totalAmountHT = sale.items.reduce((sum, item) => 
    sum + (Number(item.quantity || 0) * Number(item.pricePerTon || 0)), 0);
  const totalAmountTTC = totalAmountHT * (1 + Number(sale.taxRate || 0.19));

  // First create the sale record
  const { data: newSale, error: saleError } = await supabase
    .from('sales')
    .insert({
      client_id: sale.clientId,
      date: sale.date.toISOString(),
      is_invoiced: sale.isInvoiced,
      notes: sale.notes,
      transportation_fee: Number(sale.transportationFee || 0),
      tax_rate: Number(sale.taxRate || 0.19),
      total_amount: totalAmountHT // Store HT amount in database
    })
    .select()
    .single();
  
  if (saleError) {
    console.error('Error creating sale:', saleError);
    throw saleError;
  }
  
  // Now create all the sale items
  const saleItems = sale.items.map(item => {
    const itemTotalHT = Number(item.quantity || 0) * Number(item.pricePerTon || 0);
    return {
      sale_id: newSale.id,
      description: item.description,
      coil_ref: item.coilRef,
      coil_thickness: item.coilThickness,
      coil_width: item.coilWidth,
      top_coat_ral: item.topCoatRAL,
      back_coat_ral: item.backCoatRAL,
      coil_weight: item.coilWeight,
      quantity: Number(item.quantity || 0),
      price_per_ton: Number(item.pricePerTon || 0),
      total_amount: itemTotalHT // Store HT amount in database
    };
  });
  
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
  interface UpdateData {
    client_id?: string;
    date?: string;
    is_invoiced?: boolean;
    invoice_id?: string | null;
    notes?: string;
    transportation_fee?: number;
    tax_rate?: number;
    total_amount?: number;
    updated_at: string;
  }

  const updateData: UpdateData = {
    updated_at: new Date().toISOString()
  };

  if (sale.clientId !== undefined) updateData.client_id = sale.clientId;
  if (sale.date !== undefined) updateData.date = sale.date.toISOString();
  if (sale.isInvoiced !== undefined) updateData.is_invoiced = sale.isInvoiced;
  if (sale.invoiceId !== undefined) updateData.invoice_id = sale.invoiceId;
  if (sale.notes !== undefined) updateData.notes = sale.notes;
  if (sale.transportationFee !== undefined) updateData.transportation_fee = Number(sale.transportationFee || 0);
  if (sale.taxRate !== undefined) updateData.tax_rate = Number(sale.taxRate || 0.19);

  // If items are being updated, calculate new total
  if (sale.items) {
    const totalAmountHT = sale.items.reduce((sum, item) => 
      sum + (Number(item.quantity || 0) * Number(item.pricePerTon || 0)), 0);
    updateData.total_amount = totalAmountHT;

    // Update or create sale items
    const { error: deleteError } = await supabase
      .from('sale_items')
      .delete()
      .eq('sale_id', id);

    if (deleteError) {
      console.error('Error deleting old sale items:', deleteError);
      throw deleteError;
    }

    const saleItems = sale.items.map(item => {
      const itemTotalHT = Number(item.quantity || 0) * Number(item.pricePerTon || 0);
      return {
        sale_id: id,
        description: item.description,
        coil_ref: item.coilRef,
        coil_thickness: item.coilThickness,
        coil_width: item.coilWidth,
        top_coat_ral: item.topCoatRAL,
        back_coat_ral: item.backCoatRAL,
        coil_weight: item.coilWeight,
        quantity: Number(item.quantity || 0),
        price_per_ton: Number(item.pricePerTon || 0),
        total_amount: itemTotalHT
      };
    });

    const { error: insertError } = await supabase
      .from('sale_items')
      .insert(saleItems);

    if (insertError) {
      console.error('Error creating new sale items:', insertError);
      throw insertError;
    }
  }

  const { error: updateError } = await supabase
    .from('sales')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    console.error('Error updating sale:', updateError);
    throw updateError;
  }

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

