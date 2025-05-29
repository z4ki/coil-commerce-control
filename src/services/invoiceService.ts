import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceFilter } from '@/types';
import { formatDateInput } from '@/utils/format';

// Interface for data being inserted into Supabase
interface DbInvoiceInsert {
  invoice_number: string;
  client_id: string;
  date: string;           // ISO string
  due_date: string;       // ISO string
  total_amount: number;
  total_amount_ttc: number; // Was missing, now added
  tax_rate: number;         // Was missing, now added
  is_paid: boolean;
  paid_at?: string | null;
}

// Interface for the row structure returned from Supabase (after select)
interface DbInvoiceResponse {
  id: string;
  invoice_number: string;
  client_id: string;
  date: string;
  due_date: string;
  total_amount: number;
  total_amount_ttc: number;
  tax_rate: number;
  is_paid: boolean;
  paid_at?: string | null;
  created_at: string;
  updated_at?: string | null;
}

// Interface for the mapped DbInvoice (internal representation)
interface DbInvoice {
    id: string;
    invoice_number: string;
    client_id: string;
    date: string;
    due_date: string;
    total_amount: number;
    total_amount_ttc: number;
    tax_rate: number;
    is_paid: boolean;
    paid_at?: string;
    created_at: string;
    updated_at?: string;
}

// Helper to convert database response to DbInvoice
const mapResponseToDbInvoice = (response: DbInvoiceResponse): DbInvoice => ({
  id: response.id,
  invoice_number: response.invoice_number,
  client_id: response.client_id,
  date: response.date,
  due_date: response.due_date,
  total_amount: response.total_amount,
  total_amount_ttc: response.total_amount_ttc,
  tax_rate: response.tax_rate,
  is_paid: response.is_paid,
  paid_at: response.paid_at,
  created_at: response.created_at,
  updated_at: response.updated_at,
});

// Helper to convert database invoice to our application Invoice type
const mapDbInvoiceToInvoice = (dbInvoice: DbInvoice, salesIds: string[] = []): Invoice => ({
  id: dbInvoice.id,
  invoiceNumber: dbInvoice.invoice_number,
  clientId: dbInvoice.client_id,
  date: new Date(dbInvoice.date),
  dueDate: new Date(dbInvoice.due_date),
  salesIds,
  totalAmountHT: Number(dbInvoice.total_amount),
  totalAmountTTC: Number(dbInvoice.total_amount_ttc),
  taxRate: Number(dbInvoice.tax_rate),
  isPaid: dbInvoice.is_paid,
  paidAt: dbInvoice.paid_at ? new Date(dbInvoice.paid_at) : undefined,
  createdAt: new Date(dbInvoice.created_at),
  updatedAt: dbInvoice.updated_at ? new Date(dbInvoice.updated_at) : undefined,
  // Ensure your Invoice type in src/types/index.ts also includes transportationFee if it's part of the app logic for invoices
  // transportationFee: Number(dbInvoice.transportation_fee || 0), // Example if it were part of DbInvoice
  // transportationFeeTTC: Number(dbInvoice.transportation_fee_ttc || 0), // Example
});


export const createInvoice = async (
  invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> & { prefix?: string }
): Promise<Invoice> => {
  try {
    // console.log('[invoiceService] Received invoice data:', JSON.stringify(invoice, null, 2));
    // console.log(`[invoiceService] Initial invoice.totalAmountHT: ${invoice.totalAmountHT} (type: ${typeof invoice.totalAmountHT})`);
    // console.log(`[invoiceService] Initial invoice.totalAmountTTC: ${invoice.totalAmountTTC} (type: ${typeof invoice.totalAmountTTC})`);
    // console.log(`[invoiceService] Initial invoice.taxRate: ${invoice.taxRate} (type: ${typeof invoice.taxRate})`);

    const safeTotalAmountHT = Number.isFinite(invoice.totalAmountHT) ? invoice.totalAmountHT : 0;
    const safeTotalAmountTTC = Number.isFinite(invoice.totalAmountTTC) ? invoice.totalAmountTTC : 0;
    const safeTaxRate = Number.isFinite(invoice.taxRate) ? invoice.taxRate : 0.19;

    // console.log(`[invoiceService] Sanitized values: ht=${safeTotalAmountHT}, ttc=${safeTotalAmountTTC}, taxRate=${safeTaxRate}`);

    const insertData: DbInvoiceInsert = {
      invoice_number: invoice.invoiceNumber,
      client_id: invoice.clientId,
      date: invoice.date.toISOString(),
      due_date: invoice.dueDate.toISOString(),
      total_amount: safeTotalAmountHT,
      total_amount_ttc: safeTotalAmountTTC, // Ensured this is included
      tax_rate: safeTaxRate,               // Ensured this is included
      is_paid: invoice.isPaid || false,
      paid_at: invoice.paidAt ? invoice.paidAt.toISOString() : null
    };
    
    // console.log("[invoiceService] Data for Supabase insert:", JSON.stringify(insertData, null, 2));

    const { data, error } = await supabase
      .from('invoices')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating invoice in service (Supabase error object):', JSON.stringify(error, null, 2));
      throw error; 
    }
    
    if (!data) {
        console.error("Supabase insert returned no data and no error.");
        throw new Error("No data returned from Supabase after invoice insert.");
    }

    if (invoice.salesIds && invoice.salesIds.length > 0) {
      const salesInvoices = invoice.salesIds.map(saleId => ({
        invoice_id: data.id, 
        sale_id: saleId
      }));
      
      const { error: linkError } = await supabase
        .from('invoice_sales')
        .insert(salesInvoices);
      
      if (linkError) {
        console.error('Error linking sales to invoice:', JSON.stringify(linkError, null, 2));
        throw linkError;
      }
    }
    
    const dbInvoice = mapResponseToDbInvoice(data as DbInvoiceResponse);
    return mapDbInvoiceToInvoice(dbInvoice, invoice.salesIds || []);

  } catch (error) {
    console.error('[invoiceService] Exception in createInvoice:', error); 
    throw error; 
  }
};

export const getInvoices = async (filter?: InvoiceFilter): Promise<Invoice[]> => {
  try {
    let query = supabase
      .from('invoices')
      .select('*')
      .order('date', { ascending: false });
    
    if (filter) {
      if (filter.clientId) query = query.eq('client_id', filter.clientId);
      if (filter.isPaid !== undefined) query = query.eq('is_paid', filter.isPaid);
      if (filter.startDate) query = query.gte('date', formatDateInput(filter.startDate));
      if (filter.endDate) query = query.lte('date', formatDateInput(filter.endDate));
    }
    
    const { data: invoicesData, error } = await query;
    
    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }

    const { data: salesData, error: salesError } = await supabase
      .from('invoice_sales')
      .select('invoice_id, sale_id');

    if (salesError) {
      console.error('Error fetching invoice sales:', salesError);
      throw salesError;
    }

    const salesMap = (salesData || []).reduce((acc: { [key: string]: string[] }, item) => {
      if (!acc[item.invoice_id]) acc[item.invoice_id] = [];
      acc[item.invoice_id].push(item.sale_id);
      return acc;
    }, {});
    
    return (invoicesData as DbInvoiceResponse[] || []).map(invoiceResp => {
      const dbInv = mapResponseToDbInvoice(invoiceResp);
      return mapDbInvoiceToInvoice(dbInv, salesMap[invoiceResp.id] || []);
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
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching invoice:', error);
      throw error;
    }
    
    if (!data) return null;
    
    const salesIds = await getInvoiceSales(id);
    const dbInvoice = mapResponseToDbInvoice(data as DbInvoiceResponse);
    return mapDbInvoiceToInvoice(dbInvoice, salesIds);
  } catch (error) {
    console.error('Error in getInvoiceById:', error);
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
      total_amount_ttc?: number;
      tax_rate?: number;
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
    
    if (invoice.totalAmountHT !== undefined) {
      updateData.total_amount = Number.isFinite(invoice.totalAmountHT) ? invoice.totalAmountHT : 0;
    }
    if (invoice.totalAmountTTC !== undefined) {
      updateData.total_amount_ttc = Number.isFinite(invoice.totalAmountTTC) ? invoice.totalAmountTTC : 0;
    }
    if (invoice.taxRate !== undefined) {
        updateData.tax_rate = Number.isFinite(invoice.taxRate) ? invoice.taxRate : 0.19;
    }

    if (invoice.isPaid !== undefined) updateData.is_paid = invoice.isPaid;
    if (invoice.paidAt !== undefined) updateData.paid_at = invoice.paidAt ? invoice.paidAt.toISOString() : null;
    
    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating invoice:', JSON.stringify(error, null, 2));
      throw error;
    }
     if (!data) {
        throw new Error("No data returned from Supabase after update, though no explicit error was thrown.");
    }
    
    if (invoice.salesIds !== undefined) {
      await supabase.from('invoice_sales').delete().eq('invoice_id', id);
      if (invoice.salesIds.length > 0) {
        const salesInvoices = invoice.salesIds.map(saleId => ({ invoice_id: id, sale_id: saleId }));
        const { error: insertError } = await supabase.from('invoice_sales').insert(salesInvoices);
        if (insertError) {
            console.error('Error linking sales to invoice during update:', JSON.stringify(insertError, null, 2));
            throw insertError;
        }
      }
    }
    
    const salesIds = await getInvoiceSales(id);
    const dbInvoice = mapResponseToDbInvoice(data as DbInvoiceResponse);
    return mapDbInvoiceToInvoice(dbInvoice, salesIds);

  } catch (error) {
    console.error('Error in updateInvoice service:', error);
    throw error;
  }
};

export const deleteInvoice = async (id: string): Promise<void> => {
  try {
    const { error: salesLinkError } = await supabase
      .from('invoice_sales')
      .delete()
      .eq('invoice_id', id);

    if (salesLinkError) {
      console.error('Error deleting invoice_sales links:', salesLinkError);
      throw salesLinkError;
    }

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteInvoice service:', error);
    throw error;
  }
};