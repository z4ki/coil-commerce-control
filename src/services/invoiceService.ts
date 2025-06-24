import { tauriApi } from '@/lib/tauri-api';
import { Invoice } from '@/types/sales';
import { formatDateInput } from '@/utils/format';

// Interface for data being inserted into Supabase
interface DbInvoiceInsert {
  invoice_number: string;
  client_id: string;
  date: string;
  due_date: string;
  total_amount_ht: number;    // HT amount
  total_amount_ttc: number;   // TTC amount (fix: use snake_case)
  is_paid: boolean;
  paid_at: string | null;
}

// Interface for the row structure returned from Supabase (after select)
interface DbInvoiceResponse extends DbInvoiceInsert {
  id: string;
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
  total_amount_ht: number;
  total_amount_ttc: number; // fix: use snake_case
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
  total_amount_ht: response.total_amount_ht,
  total_amount_ttc: response.total_amount_ttc,
  is_paid: response.is_paid,
  paid_at: response.paid_at ?? undefined,
  created_at: response.created_at,
  updated_at: response.updated_at ?? undefined,
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
  totalAmountTTC: Number(dbInvoice.total_amount_ttc), // fix: use snake_case
  isPaid: dbInvoice.is_paid,
  paidAt: dbInvoice.paid_at ? new Date(dbInvoice.paid_at) : undefined,
  createdAt: new Date(dbInvoice.created_at),
  updatedAt: dbInvoice.updated_at ? new Date(dbInvoice.updated_at) : undefined,
});

export const getInvoices = async (): Promise<Invoice[]> => {
  try {
    const backendInvoices = await tauriApi.invoices.getAll() as any[];
    if (!Array.isArray(backendInvoices)) return [];
    // Map backend fields to frontend Invoice type
    return backendInvoices.map((inv: any) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      clientId: inv.client_id,
      date: new Date(inv.date),
      dueDate: new Date(inv.due_date),
      salesIds: inv.sales_ids || [],
      totalAmountHT: Number(inv.total_amount_ht),
      totalAmountTTC: Number(inv.total_amount_ttc),
      isPaid: inv.is_paid,
      paidAt: inv.paid_at ? new Date(inv.paid_at) : undefined,
      createdAt: new Date(inv.created_at),
      updatedAt: inv.updated_at ? new Date(inv.updated_at) : undefined,
      isDeleted: !!inv.is_deleted,
      deletedAt: inv.deleted_at ? new Date(inv.deleted_at) : undefined,
    }));
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

export const getDeletedInvoices = async (): Promise<Invoice[]> => {
  try {
    const backendInvoices = await tauriApi.invoices.getDeleted() as any[];
    if (!Array.isArray(backendInvoices)) return [];
    return backendInvoices.map((inv: any) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      clientId: inv.client_id,
      date: new Date(inv.date),
      dueDate: new Date(inv.due_date),
      salesIds: inv.sales_ids || [],
      totalAmountHT: Number(inv.total_amount_ht),
      totalAmountTTC: Number(inv.total_amount_ttc),
      isPaid: inv.is_paid,
      paidAt: inv.paid_at ? new Date(inv.paid_at) : undefined,
      createdAt: new Date(inv.created_at),
      updatedAt: inv.updated_at ? new Date(inv.updated_at) : undefined,
      isDeleted: !!inv.is_deleted,
      deletedAt: inv.deleted_at ? new Date(inv.deleted_at) : undefined,
    }));
  } catch (error) {
    console.error('Error fetching deleted invoices:', error);
    throw error;
  }
};

export const restoreInvoice = async (id: string): Promise<void> => {
  try {
    await tauriApi.invoices.restore(id);
  } catch (error) {
    console.error('Error restoring invoice:', error);
    throw error;
  }
};

export const deleteInvoice = async (id: string): Promise<void> => {
  try {
    await tauriApi.invoices.delete(id);
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
};

export const createInvoice = async (
  invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Invoice> => {
  try {
    // Map camelCase to snake_case for backend
    const backendInvoice = {
      invoice_number: invoice.invoiceNumber,
      client_id: invoice.clientId,
      date: invoice.date.toISOString(),
      due_date: invoice.dueDate.toISOString(),
      sales_ids: invoice.salesIds,
      total_amount_ht: invoice.totalAmountHT,
      total_amount_ttc: invoice.totalAmountTTC,
      is_paid: invoice.isPaid,
      paid_at: invoice.paidAt ? invoice.paidAt.toISOString() : null,
    };
    return await tauriApi.invoices.create(backendInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

// TODO: Implement updateInvoice when backend support is available.