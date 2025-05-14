
import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceFilter } from '@/types';
import { getSaleById } from './saleService';

export const getInvoices = async (): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
  
  // For each invoice, get the sales IDs from the invoice_sales table
  const invoicesWithSales = await Promise.all((data || []).map(async (invoice) => {
    const { data: invoiceSales, error: salesError } = await supabase
      .from('invoice_sales')
      .select('sale_id')
      .eq('invoice_id', invoice.id);
    
    if (salesError) {
      console.error('Error fetching invoice sales:', salesError);
      throw salesError;
    }
    
    const salesIds = (invoiceSales || []).map(item => item.sale_id);
    
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientId: invoice.client_id,
      date: new Date(invoice.date),
      dueDate: new Date(invoice.due_date),
      salesIds: salesIds,
      totalAmount: invoice.total_amount,
      isPaid: invoice.is_paid,
      paidAt: invoice.paid_at ? new Date(invoice.paid_at) : undefined,
      createdAt: new Date(invoice.created_at),
      updatedAt: invoice.updated_at ? new Date(invoice.updated_at) : undefined,
      user_id: invoice.user_id
    };
  }));
  
  return invoicesWithSales;
};

export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching invoice:', error);
    throw error;
  }
  
  if (!data) return null;
  
  // Get the sales IDs for this invoice
  const { data: invoiceSales, error: salesError } = await supabase
    .from('invoice_sales')
    .select('sale_id')
    .eq('invoice_id', id);
  
  if (salesError) {
    console.error('Error fetching invoice sales:', salesError);
    throw salesError;
  }
  
  const salesIds = (invoiceSales || []).map(item => item.sale_id);
  
  return {
    id: data.id,
    invoiceNumber: data.invoice_number,
    clientId: data.client_id,
    date: new Date(data.date),
    dueDate: new Date(data.due_date),
    salesIds: salesIds,
    totalAmount: data.total_amount,
    isPaid: data.is_paid,
    paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    user_id: data.user_id
  };
};

export const getInvoicesByClient = async (clientId: string): Promise<Invoice[]> => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching invoices by client:', error);
    throw error;
  }
  
  // For each invoice, get the sales IDs
  const invoicesWithSales = await Promise.all((data || []).map(async (invoice) => {
    const { data: invoiceSales, error: salesError } = await supabase
      .from('invoice_sales')
      .select('sale_id')
      .eq('invoice_id', invoice.id);
    
    if (salesError) {
      console.error('Error fetching invoice sales:', salesError);
      throw salesError;
    }
    
    const salesIds = (invoiceSales || []).map(item => item.sale_id);
    
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientId: invoice.client_id,
      date: new Date(invoice.date),
      dueDate: new Date(invoice.due_date),
      salesIds: salesIds,
      totalAmount: invoice.total_amount,
      isPaid: invoice.is_paid,
      paidAt: invoice.paid_at ? new Date(invoice.paid_at) : undefined,
      createdAt: new Date(invoice.created_at),
      updatedAt: invoice.updated_at ? new Date(invoice.updated_at) : undefined,
      user_id: invoice.user_id
    };
  }));
  
  return invoicesWithSales;
};

export const getInvoicesByFilter = async (filter: InvoiceFilter): Promise<Invoice[]> => {
  let query = supabase.from('invoices').select('*');
  
  if (filter.clientId) {
    query = query.eq('client_id', filter.clientId);
  }
  
  if (filter.isPaid !== undefined) {
    query = query.eq('is_paid', filter.isPaid);
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
    console.error('Error fetching invoices by filter:', error);
    throw error;
  }
  
  // For each invoice, get the sales IDs
  const invoicesWithSales = await Promise.all((data || []).map(async (invoice) => {
    const { data: invoiceSales, error: salesError } = await supabase
      .from('invoice_sales')
      .select('sale_id')
      .eq('invoice_id', invoice.id);
    
    if (salesError) {
      console.error('Error fetching invoice sales:', salesError);
      throw salesError;
    }
    
    const salesIds = (invoiceSales || []).map(item => item.sale_id);
    
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientId: invoice.client_id,
      date: new Date(invoice.date),
      dueDate: new Date(invoice.due_date),
      salesIds: salesIds,
      totalAmount: invoice.total_amount,
      isPaid: invoice.is_paid,
      paidAt: invoice.paid_at ? new Date(invoice.paid_at) : undefined,
      createdAt: new Date(invoice.created_at),
      updatedAt: invoice.updated_at ? new Date(invoice.updated_at) : undefined,
      user_id: invoice.user_id
    };
  }));
  
  return invoicesWithSales;
};

export const createInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> => {
  // Calculate total from the sales
  let totalAmount = 0;
  for (const saleId of invoice.salesIds) {
    const sale = await getSaleById(saleId);
    if (sale) {
      totalAmount += sale.totalAmount;
    }
  }
  
  // Create the invoice
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoice.invoiceNumber,
      client_id: invoice.clientId,
      date: invoice.date.toISOString(),
      due_date: invoice.dueDate.toISOString(),
      total_amount: totalAmount,
      is_paid: invoice.isPaid,
      paid_at: invoice.paidAt?.toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
  
  // Create the invoice-sales relationships
  const invoiceSales = invoice.salesIds.map(saleId => ({
    invoice_id: data.id,
    sale_id: saleId
  }));
  
  if (invoiceSales.length > 0) {
    const { error: relError } = await supabase
      .from('invoice_sales')
      .insert(invoiceSales);
    
    if (relError) {
      console.error('Error creating invoice-sales relationships:', relError);
      // Try to rollback
      await supabase.from('invoices').delete().eq('id', data.id);
      throw relError;
    }
  }
  
  return {
    id: data.id,
    invoiceNumber: data.invoice_number,
    clientId: data.client_id,
    date: new Date(data.date),
    dueDate: new Date(data.due_date),
    salesIds: invoice.salesIds,
    totalAmount: data.total_amount,
    isPaid: data.is_paid,
    paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
  };
};

export const updateInvoice = async (id: string, invoice: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Invoice> => {
  const updateData: any = {
    updated_at: new Date().toISOString()
  };
  
  if (invoice.invoiceNumber !== undefined) updateData.invoice_number = invoice.invoiceNumber;
  if (invoice.clientId !== undefined) updateData.client_id = invoice.clientId;
  if (invoice.date !== undefined) updateData.date = invoice.date.toISOString();
  if (invoice.dueDate !== undefined) updateData.due_date = invoice.dueDate.toISOString();
  if (invoice.isPaid !== undefined) updateData.is_paid = invoice.isPaid;
  if (invoice.paidAt !== undefined) updateData.paid_at = invoice.paidAt?.toISOString();
  
  // If we need to recalculate the total based on new sales
  if (invoice.salesIds) {
    let totalAmount = 0;
    for (const saleId of invoice.salesIds) {
      const sale = await getSaleById(saleId);
      if (sale) {
        totalAmount += sale.totalAmount;
      }
    }
    updateData.total_amount = totalAmount;
    
    // Update the invoice-sales relationships
    // First delete all existing relationships
    const { error: deleteError } = await supabase
      .from('invoice_sales')
      .delete()
      .eq('invoice_id', id);
    
    if (deleteError) {
      console.error('Error deleting invoice-sales relationships:', deleteError);
      throw deleteError;
    }
    
    // Then create the new ones
    if (invoice.salesIds.length > 0) {
      const invoiceSales = invoice.salesIds.map(saleId => ({
        invoice_id: id,
        sale_id: saleId
      }));
      
      const { error: insertError } = await supabase
        .from('invoice_sales')
        .insert(invoiceSales);
      
      if (insertError) {
        console.error('Error creating invoice-sales relationships:', insertError);
        throw insertError;
      }
    }
  }
  
  // Update the invoice
  const { error } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', id);
  
  if (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
  
  // Get the updated invoice
  return await getInvoiceById(id) as Invoice;
};

export const deleteInvoice = async (id: string): Promise<void> => {
  // Delete the invoice (cascade will delete the invoice_sales relationships)
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
};
