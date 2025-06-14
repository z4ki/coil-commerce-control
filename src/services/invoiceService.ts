
import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceFilter } from '@/types';
import { formatDateInput, generateInvoiceNumber } from '@/utils/format';

export const getInvoices = async (filter?: InvoiceFilter): Promise<Invoice[]> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    let query = supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    
    // Apply filters if provided
    if (filter) {
      if (filter.clientId) {
        query = query.eq('client_id', filter.clientId);
      }
      
      if (filter.isPaid !== undefined) {
        query = query.eq('is_paid', filter.isPaid);
      }
      
      if (filter.startDate) {
        query = query.gte('date', formatDateInput(filter.startDate));
      }
      
      if (filter.endDate) {
        query = query.lte('date', formatDateInput(filter.endDate));
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
    
    return data.map(item => ({
      id: item.id,
      invoiceNumber: item.invoice_number,
      clientId: item.client_id,
      date: new Date(item.date),
      dueDate: new Date(item.due_date),
      salesIds: [], // Will be populated separately
      totalAmount: Number(item.total_amount),
      isPaid: item.is_paid,
      paidAt: item.paid_at ? new Date(item.paid_at) : undefined,
      createdAt: new Date(item.created_at),
      updatedAt: item.updated_at ? new Date(item.updated_at) : undefined,
      user_id: item.user_id
    }));
  } catch (error) {
    console.error('Error in getInvoices:', error);
    throw error;
  }
};

export const getInvoiceSales = async (invoiceId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('invoice_sales')
      .select('sale_id')
      .eq('invoice_id', invoiceId);
    
    if (error) {
      console.error('Error fetching invoice sales:', error);
      throw error;
    }
    
    return data.map(item => item.sale_id);
  } catch (error) {
    console.error('Error in getInvoiceSales:', error);
    throw error;
  }
};

export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        return null;
      }
      console.error('Error fetching invoice:', error);
      throw error;
    }
    
    // Get associated sales
    const salesIds = await getInvoiceSales(id);
    
    return {
      id: data.id,
      invoiceNumber: data.invoice_number,
      clientId: data.client_id,
      date: new Date(data.date),
      dueDate: new Date(data.due_date),
      salesIds,
      totalAmount: Number(data.total_amount),
      isPaid: data.is_paid,
      paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      user_id: data.user_id
    };
  } catch (error) {
    console.error('Error in getInvoiceById:', error);
    throw error;
  }
};

export const createInvoice = async (
  invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNumber'>
): Promise<Invoice> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();
    
    // Create invoice
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        client_id: invoice.clientId,
        date: invoice.date.toISOString(),
        due_date: invoice.dueDate.toISOString(),
        total_amount: invoice.totalAmount,
        is_paid: invoice.isPaid,
        paid_at: invoice.paidAt ? invoice.paidAt.toISOString() : null,
        user_id: user.id
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
    
    // Associate sales with the invoice
    if (invoice.salesIds && invoice.salesIds.length > 0) {
      const salesInvoices = invoice.salesIds.map(saleId => ({
        invoice_id: data.id,
        sale_id: saleId
      }));
      
      const { error: linkError } = await supabase
        .from('invoice_sales')
        .insert(salesInvoices);
      
      if (linkError) {
        console.error('Error linking sales to invoice:', linkError);
        throw linkError;
      }
    }
    
    return {
      id: data.id,
      invoiceNumber: data.invoice_number,
      clientId: data.client_id,
      date: new Date(data.date),
      dueDate: new Date(data.due_date),
      salesIds: invoice.salesIds || [],
      totalAmount: Number(data.total_amount),
      isPaid: data.is_paid,
      paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      user_id: data.user_id
    };
  } catch (error) {
    console.error('Error in createInvoice:', error);
    throw error;
  }
};

export const updateInvoice = async (
  id: string,
  invoice: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Invoice> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const updateData: any = {};
    
    if (invoice.clientId !== undefined) updateData.client_id = invoice.clientId;
    if (invoice.date !== undefined) updateData.date = invoice.date.toISOString();
    if (invoice.dueDate !== undefined) updateData.due_date = invoice.dueDate.toISOString();
    if (invoice.totalAmount !== undefined) updateData.total_amount = invoice.totalAmount;
    if (invoice.isPaid !== undefined) updateData.is_paid = invoice.isPaid;
    if (invoice.paidAt !== undefined) updateData.paid_at = invoice.paidAt ? invoice.paidAt.toISOString() : null;
    updateData.updated_at = new Date().toISOString();
    
    // Update invoice
    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
    
    // Update sales associations if needed
    if (invoice.salesIds !== undefined) {
      // First, remove all existing associations
      const { error: deleteError } = await supabase
        .from('invoice_sales')
        .delete()
        .eq('invoice_id', id);
      
      if (deleteError) {
        console.error('Error removing invoice sales associations:', deleteError);
        throw deleteError;
      }
      
      // Then, create new associations
      if (invoice.salesIds.length > 0) {
        const salesInvoices = invoice.salesIds.map(saleId => ({
          invoice_id: id,
          sale_id: saleId
        }));
        
        const { error: insertError } = await supabase
          .from('invoice_sales')
          .insert(salesInvoices);
        
        if (insertError) {
          console.error('Error linking sales to invoice:', insertError);
          throw insertError;
        }
      }
    }
    
    // Get associated sales for the response
    const salesIds = await getInvoiceSales(id);
    
    return {
      id: data.id,
      invoiceNumber: data.invoice_number,
      clientId: data.client_id,
      date: new Date(data.date),
      dueDate: new Date(data.due_date),
      salesIds,
      totalAmount: Number(data.total_amount),
      isPaid: data.is_paid,
      paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      user_id: data.user_id
    };
  } catch (error) {
    console.error('Error in updateInvoice:', error);
    throw error;
  }
};

export const deleteInvoice = async (id: string): Promise<void> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteInvoice:', error);
    throw error;
  }
};
