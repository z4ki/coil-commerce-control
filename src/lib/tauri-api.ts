import { core } from '@tauri-apps/api';
// import * as coreInvoke from '@tauri-apps/api/core';

export const tauriApi = {
  clients: {
    getClients: (page?: number, pageSize?: number) => core.invoke('get_clients', { page, page_size: pageSize }),
    getById: (id: string) => core.invoke('get_client_by_id', { id }),
    create: (client: any) => core.invoke('create_client', { client }),
    update: (id: string, client: any) => core.invoke('update_client', { id, client }),
    delete: (id: string) => core.invoke('delete_client', { id }),
  },
  sales: {
    getSales: (page?: number, pageSize?: number) => core.invoke('get_sales', { page, page_size: pageSize }),
    getById: (id: string) => core.invoke('get_sale_by_id', { id }),
    create: (sale: any) => core.invoke('create_sale', { sale }),
    delete: (id: string) => core.invoke('delete_sale', { id }),
    restore: (id: string) => core.invoke('restore_sale', { id }),
    getDeleted: () => core.invoke('get_deleted_sales'),
    update: (id: string, sale: any) => core.invoke('update_sale', { id, sale }),
    markInvoiced: async (saleId: string, invoiceId: string) => {
      return await core.invoke('mark_sale_invoiced', {
        saleId,
        invoiceId,
      });
    },
    unmarkInvoiced: async (saleId: string) => {
      return await core.invoke('unmark_sale_invoiced', {
        saleId,
      });
    },
  },
  invoices: {
    getInvoices: (page?: number, pageSize?: number) => core.invoke('get_invoices', { page, page_size: pageSize }),
    create: (invoice: any) => core.invoke('create_invoice', { invoice }),
    delete: (id: string) => core.invoke('delete_invoice', { id }),
    restore: (id: string) => core.invoke('restore_invoice', { id }),
    getDeleted: () => core.invoke('get_deleted_invoices'),
  },
  payments: {
    getAll: () => core.invoke('get_payments'),
    create: (payment: any) => core.invoke('create_payment', { payment }),
    delete: (id: string) => core.invoke('delete_payment', { id }),
    restore: (id: string) => core.invoke('restore_payment', { id }),
    getDeleted: () => core.invoke('get_deleted_payments'),
    // update: (id: string, payment: any) => core.invoke('update_payment', { id, payment }), // Commented out, not implemented in backend
  },
  analytics: {
    getSoldProducts: (filter: any, page?: number, pageSize?: number) => core.invoke('get_sold_products_analytics', { filter, page, page_size: pageSize }),
    getSoldProductsSummary: (filter: any) => core.invoke('get_sold_products_summary', { filter }),
    getUniqueThicknessWidth: () => core.invoke('get_unique_thickness_width'),
  },
  settings: {
    get: () => core.invoke('get_settings'),
    update: (updates: any) => core.invoke('update_settings', { updates }),
    export_db: (export_path?: string) => core.invoke('export_db', { export_path }),
    import_db: (import_path: string) => core.invoke('import_db', { import_path }),
  },
  dashboard: {
    getDashboardStats: () => core.invoke('get_dashboard_stats'),
  },
};

