import { tauriApi } from '@/lib/tauri-api';
import { Invoice } from '@/types/index';
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
  deleted_at?: string;
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
const mapDbInvoiceToInvoice = (dbInvoice: DbInvoice, salesIds: string[] = [], extra: any = {}): Invoice => ({
  id: dbInvoice.id,
  invoiceNumber: dbInvoice.invoice_number,
  clientId: dbInvoice.client_id,
  date: new Date(dbInvoice.date),
  dueDate: new Date(dbInvoice.due_date),
  salesIds,
  totalAmountHT: Number(dbInvoice.total_amount_ht),
  totalAmountTTC: Number(dbInvoice.total_amount_ttc),
  taxRate: typeof extra.tax_rate === 'number' ? extra.tax_rate : 0.19,
  isPaid: dbInvoice.is_paid,
  paidAt: dbInvoice.paid_at ? new Date(dbInvoice.paid_at) : undefined,
  paymentMethod: extra.payment_method,
  transportationFee: extra.transportation_fee,
  transportationFeeTTC: extra.transportation_fee_ttc,
  notes: extra.notes,
  createdAt: new Date(dbInvoice.created_at),
  updatedAt: dbInvoice.updated_at ? new Date(dbInvoice.updated_at) : undefined,
  isDeleted: !!extra.is_deleted,
  deletedAt: extra.deleted_at ? new Date(extra.deleted_at) : undefined,
});

// Remove getInvoices (which uses tauriApi.invoices.getAll) and update all usages to use getInvoicesPaginated.
// export const getInvoices = async (): Promise<Invoice[]> => {
//   try {
//     const backendInvoices = await tauriApi.invoices.getAll() as any[];
//     if (!Array.isArray(backendInvoices)) return [];
//     return backendInvoices.map((inv: any) => mapDbInvoiceToInvoice({
//       id: inv.id,
//       invoice_number: inv.invoice_number,
//       client_id: inv.client_id,
//       date: inv.date,
//       due_date: inv.due_date,
//       total_amount_ht: inv.total_amount_ht,
//       total_amount_ttc: inv.total_amount_ttc,
//       is_paid: inv.is_paid,
//       paid_at: inv.paid_at,
//       created_at: inv.created_at,
//       updated_at: inv.updated_at,
//     }, inv.sales_ids || [], inv));
//   } catch (error) {
//     console.error('Error fetching invoices:', error);
//     throw error;
//   }
// };

export const getDeletedInvoices = async (): Promise<Invoice[]> => {
  try {
    const backendInvoices = await tauriApi.invoices.getDeleted() as any[];
    if (!Array.isArray(backendInvoices)) return [];
    return backendInvoices.map((inv: any) => {
      // Defensive: ensure sales_ids is always an array
      let salesIds: string[] = [];
      if (Array.isArray(inv.sales_ids)) {
        salesIds = inv.sales_ids;
      } else if (typeof inv.sales_ids === 'string') {
        salesIds = inv.sales_ids.split(',').filter(Boolean);
      } // else leave as []

      return mapDbInvoiceToInvoice({
        id: inv.id,
        invoice_number: inv.invoice_number,
        client_id: inv.client_id,
        date: inv.date,
        due_date: inv.due_date,
        total_amount_ht: inv.total_amount_ht,
        total_amount_ttc: inv.total_amount_ttc,
        is_paid: inv.is_paid,
        paid_at: inv.paid_at,
        created_at: inv.created_at,
        updated_at: inv.updated_at,
        deleted_at: inv.deleted_at,
      }, salesIds, inv);
    });
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
    return await tauriApi.invoices.create(backendInvoice) as Invoice;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

export interface PaginatedInvoicesResult {
  rows: Invoice[];
  total: number;
}

export const getInvoicesPaginated = async (
  page: number = 1,
  pageSize: number = 5
): Promise<PaginatedInvoicesResult> => {
  const result = await tauriApi.invoices.getInvoices(page, pageSize) as any;
  return {
    rows: result.rows.map((row: any) => {
      // Defensive: ensure sales_ids is always an array
      let salesIds: string[] = [];
      if (Array.isArray(row.sales_ids)) {
        salesIds = row.sales_ids;
      } else if (typeof row.sales_ids === 'string') {
        salesIds = row.sales_ids.split(',').filter(Boolean);
      } // else leave as []
      return mapDbInvoiceToInvoice({
        id: row.id,
        invoice_number: row.invoice_number,
        client_id: row.client_id,
        date: row.date,
        due_date: row.due_date,
        total_amount_ht: row.total_amount_ht,
        total_amount_ttc: row.total_amount_ttc,
        is_paid: row.is_paid,
        paid_at: row.paid_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        deleted_at: row.deleted_at,
      }, salesIds, row);
    }),
    total: result.total,
  };
};

// TODO: Implement updateInvoice when backend support is available.