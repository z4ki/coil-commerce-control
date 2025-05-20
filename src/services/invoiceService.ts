import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceFilter } from '@/types';
import { formatDateInput, generateInvoiceNumber } from '@/utils/format';

interface DbInvoiceResponse {
  id: string;
  invoice_number: string;
  client_id: string;
  date: string;
  due_date: string;
  total_amount: number;
  total_amount_ht: number;
  total_amount_ttc: number;
  tax_rate: number;
  is_paid: boolean;
  paid_at?: string;
  created_at: string;
  updated_at?: string;
}

interface DbInvoiceInsert {
  invoice_number: string;
  client_id: string;
  date: string;
  due_date: string;
  total_amount: number;
  total_amount_ht: number;
  total_amount_ttc: number;
  tax_rate: number;
  is_paid: boolean;
  paid_at?: string | null;
}

interface DbInvoice {
  id: string;
  invoice_number: string;
  client_id: string;
  date: string;
  due_date: string;
  total_amount_ht: number;
  total_amount_ttc: number;
  tax_rate: number;
  is_paid: boolean;
  paid_at?: string;
  created_at: string;
  updated_at?: string;
}

// Helper to convert database response to DbInvoice
const mapResponseToDbInvoice = (response: DbInvoiceResponse): DbInvoice => ({
  ...response,
  total_amount_ht: response.total_amount_ht || response.total_amount,
  total_amount_ttc: response.total_amount_ttc || (response.total_amount * 1.19),
  tax_rate: response.tax_rate || 0.19
});

// Helper to convert database invoice to our application Invoice type
const mapDbInvoiceToInvoice = (dbInvoice: DbInvoice, salesIds: string[] = []): Invoice => ({
  id: dbInvoice.id,
  invoiceNumber: dbInvoice.invoice_number,
  clientId: dbInvoice.client_id,
  date: new Date(dbInvoice.date),
  dueDate: new Date(dbInvoice.due_date),
  salesIds,
  totalAmountHT: Number(dbInvoice.total_amount_ht),
  totalAmountTTC: Number(dbInvoice.total_amount_ttc),
  taxRate: Number(dbInvoice.tax_rate),
  isPaid: dbInvoice.is_paid,
  paidAt: dbInvoice.paid_at ? new Date(dbInvoice.paid_at) : undefined,
  createdAt: new Date(dbInvoice.created_at),
  updatedAt: dbInvoice.updated_at ? new Date(dbInvoice.updated_at) : undefined
});

export const getInvoices = async (filter?: InvoiceFilter): Promise<Invoice[]> => {
  try {
    let query = supabase
      .from('invoices')
      .select('*')
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
    
    const { data: invoicesData, error } = await query;
    
    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }

    // Fetch all invoice_sales relationships in one query
    const { data: salesData, error: salesError } = await supabase
      .from('invoice_sales')
      .select('invoice_id, sale_id');

    if (salesError) {
      console.error('Error fetching invoice sales:', salesError);
      throw salesError;
    }

    // Create a map of invoice IDs to their sale IDs
    const salesMap = salesData.reduce((acc: { [key: string]: string[] }, item) => {
      if (!acc[item.invoice_id]) {
        acc[item.invoice_id] = [];
      }
      acc[item.invoice_id].push(item.sale_id);
      return acc;
    }, {});
    
    // Map the data to our application type
    return (invoicesData as DbInvoiceResponse[]).map(invoice => {
      const dbInvoice = mapResponseToDbInvoice(invoice);
      return mapDbInvoiceToInvoice(dbInvoice, salesMap[invoice.id] || []);
    });
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
        return null;
      }
      console.error('Error fetching invoice:', error);
      throw error;
    }
    
    if (!data) return null;
    
    // Get associated sales
    const salesIds = await getInvoiceSales(id);
    
    const dbInvoice = mapResponseToDbInvoice(data as DbInvoiceResponse);
    return mapDbInvoiceToInvoice(dbInvoice, salesIds);
  } catch (error) {
    console.error('Error in getInvoiceById:', error);
    throw error;
  }
};

export const createInvoice = async (
  invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> & { prefix?: string }
): Promise<Invoice> => {
  try {
    const insertData: DbInvoiceInsert = {
      invoice_number: invoice.invoiceNumber,
      client_id: invoice.clientId,
      date: invoice.date.toISOString(),
      due_date: invoice.dueDate.toISOString(),
      total_amount: invoice.totalAmountHT,
      total_amount_ht: invoice.totalAmountHT,
      total_amount_ttc: invoice.totalAmountTTC,
      tax_rate: invoice.taxRate,
      is_paid: invoice.isPaid,
      paid_at: invoice.paidAt ? invoice.paidAt.toISOString() : null
    };
    
    // Create invoice
    const { data, error } = await supabase
      .from('invoices')
      .insert(insertData)
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
    
    const dbInvoice = mapResponseToDbInvoice(data as DbInvoiceResponse);
    return mapDbInvoiceToInvoice(dbInvoice, invoice.salesIds || []);
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
    interface UpdateData {
      client_id?: string;
      date?: string;
      due_date?: string;
      total_amount?: number;
      is_paid?: boolean;
      paid_at?: string | null;
      updated_at: string;
    }
    
    const updateData: UpdateData = {
      updated_at: new Date().toISOString()
    };
    
    if (invoice.clientId !== undefined) updateData.client_id = invoice.clientId;
    if (invoice.date !== undefined) updateData.date = invoice.date.toISOString();
    if (invoice.dueDate !== undefined) updateData.due_date = invoice.dueDate.toISOString();
    if (invoice.totalAmountTTC !== undefined) updateData.total_amount = invoice.totalAmountTTC;
    if (invoice.isPaid !== undefined) updateData.is_paid = invoice.isPaid;
    if (invoice.paidAt !== undefined) updateData.paid_at = invoice.paidAt ? invoice.paidAt.toISOString() : null;
    
    // Update invoice
    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
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
      totalAmountHT: Number(data.total_amount_ht),
      totalAmountTTC: Number(data.total_amount_ttc),
      taxRate: Number(data.tax_rate || 0.19),
      isPaid: data.is_paid,
      paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    };
  } catch (error) {
    console.error('Error in updateInvoice:', error);
    throw error;
  }
};

export const deleteInvoice = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteInvoice:', error);
    throw error;
  }
};
