import { tauriApi } from '@/lib/tauri-api';

export interface SoldProductsFilter {
  startDate?: string;
  endDate?: string;
  productType?: string;
  clientId?: string;
  thickness?: number[];
  width?: number[];
  unitPriceMin?: number;
  unitPriceMax?: number;
  paymentStatus?: 'all' | 'paid' | 'unpaid';
}

export interface SoldProduct {
  productName: string;
  clientName: string;
  thickness: number;
  width: number;
  quantity: number;
  weight: number;
  unitPrice: number;
  totalPrice: number;
  invoiceNumber: string;
  saleDate: string;
  paymentStatus: string;
}

export interface SoldProductsSummary {
  totalWeight: number;
  totalRevenue: number; // legacy, item-level
  officialTotalRevenue: number;
  itemTotalRevenue: number;
  totalQuantity: number;
  uniqueProducts: number;
  uniqueClients: number;
  averageOrderValue: number;
}

export interface SoldProductsAnalyticsResult {
  rows: SoldProduct[];
  total: number;
}

// Helper to convert camelCase filter keys to snake_case for backend
function toBackendFilter(filter: SoldProductsFilter): any {
  const mapping: Record<string, string> = {
    startDate: 'start_date',
    endDate: 'end_date',
    productType: 'product_type',
    clientId: 'client_id',
    thickness: 'thickness',
    width: 'width',
    unitPriceMin: 'unit_price_min',
    unitPriceMax: 'unit_price_max',
    paymentStatus: 'payment_status',
  };
  const backend: any = {};
  Object.entries(filter).forEach(([k, v]) => {
    if (v !== undefined && v !== '') {
      backend[mapping[k] || k] = v;
    }
  });
  return backend;
}

export const getSoldProductsAnalytics = async (
  filters: SoldProductsFilter,
  page: number = 1,
  pageSize: number = 5
): Promise<SoldProductsAnalyticsResult> => {
  try {
    console.log('Calling Tauri analytics with filter:', filters, 'page:', page, 'pageSize:', pageSize);
    const result = await tauriApi.analytics.getSoldProducts(
      toBackendFilter(filters),
      page,
      pageSize
    ) as any; // Use any for backend response
    // result: { rows, total }
    return {
      rows: result.rows.map((row: any) => ({
        productName: row.product_name ?? '-',
        clientName: row.client_name ?? '-',
        thickness: row.thickness ?? 0,
        width: row.width ?? 0,
        quantity: row.quantity ?? 0,
        weight: row.weight ?? 0,
        unitPrice: row.unit_price ?? 0,
        totalPrice: row.total_price ?? 0,
        invoiceNumber: row.invoice_number ?? '-',
        saleDate: row.sale_date ?? '-',
        paymentStatus: row.payment_status ?? '-',
      })),
      total: result.total ?? 0,
    };
  } catch (e) {
    throw new Error((e as Error).message || 'Failed to fetch sold products analytics');
  }
};

export const getSoldProductsSummary = async (filters: SoldProductsFilter): Promise<SoldProductsSummary> => {
  try {
    const result = await tauriApi.analytics.getSoldProductsSummary(toBackendFilter(filters));
    const data = result as any;
    // Map snake_case to camelCase for frontend
    return {
      totalWeight: data.total_weight ?? 0,
      totalRevenue: data.total_revenue ?? 0, // legacy
      officialTotalRevenue: data.official_total_revenue ?? 0,
      itemTotalRevenue: data.item_total_revenue ?? 0,
      totalQuantity: data.total_quantity ?? 0,
      uniqueProducts: data.unique_products ?? 0,
      uniqueClients: data.unique_clients ?? 0,
      averageOrderValue: data.average_order_value ?? 0,
    };
  } catch (e) {
    throw new Error((e as Error).message || 'Failed to fetch sold products summary');
  }
};

export async function getUniqueThicknessWidth(): Promise<{ thicknesses: number[]; widths: number[] }> {
  const [thicknesses, widths] = await tauriApi.analytics.getUniqueThicknessWidth() as [number[], number[]];
  return { thicknesses, widths };
} 