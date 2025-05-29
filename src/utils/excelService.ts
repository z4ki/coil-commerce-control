import * as XLSX from 'xlsx';
import { Sale, SaleItem, Client } from '../types';
import { formatDate, formatCurrency } from './format';

interface ExcelReportOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  columns?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

type SalesReportRow = {
  'Date': string;
  'Client': string;
  'Company': string;
  'Invoice Number': string;
  'Total HT': number;
  'TVA': number;
  'Total TTC': number;
  'Payment Method': string;
  'Status': string;
};

type InventoryReportRow = {
  'Coil Reference': string;
  'Thickness': string | number;
  'Width': string | number;
  'Top Coat RAL': string;
  'Back Coat RAL': string;
  'Total Weight (kg)': number;
  'Total Quantity': number;
  'Last Price': number;
};

type ProductReportRow = {
  'Product': string;
  'Total Quantity': number;
  'Total Revenue': number;
  'Average Price': number;
  'Number of Sales': number;
};

type CustomerReportRow = {
  'Client Name': string;
  'Company': string;
  'Total Purchases': number;
  'Total Revenue': number;
  'Average Order Value': number;
  'Last Purchase Date': string;
};

export const generateSalesReport = (sales: Sale[], clients: Client[], options?: ExcelReportOptions) => {
  // Filter sales by date range if provided
  let filteredSales = sales;
  if (options?.dateRange) {
    filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= options.dateRange!.start && saleDate <= options.dateRange!.end;
    });
  }

  // Sort sales if sorting options provided
  if (options?.sortBy) {
    filteredSales.sort((a, b) => {
      const aValue = (a as any)[options.sortBy!];
      const bValue = (b as any)[options.sortBy!];
      const order = options.sortOrder === 'desc' ? -1 : 1;
      return aValue > bValue ? order : -order;
    });
  }

  // Prepare data for Excel
  const data: SalesReportRow[] = filteredSales.map(sale => {
    const client = clients.find(c => c.id === sale.clientId);
    return {
      'Date': formatDate(sale.date),
      'Client': client?.name || '',
      'Company': client?.company || '',
      'Invoice Number': sale.invoiceNumber || '',
      'Total HT': sale.totalAmountHT,
      'TVA': sale.totalAmountTTC - sale.totalAmountHT,
      'Total TTC': sale.totalAmountTTC,
      'Payment Method': sale.paymentMethod || 'N/A',
      'Status': sale.isInvoiced ? 'Invoiced' : 'Pending'
    };
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length, ...data.map(row => String((row as any)[key]).length))
  }));
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');

  // Generate buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

export const generateInventoryReport = (sales: Sale[]) => {
  // Group items by coil reference
  const inventory: { [key: string]: { 
    coilRef: string;
    totalWeight: number;
    totalQuantity: number;
    lastPrice: number;
    thickness?: number;
    width?: number;
    topCoatRAL?: string;
    backCoatRAL?: string;
  }} = {};

  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (item.coilRef) {
        if (!inventory[item.coilRef]) {
          inventory[item.coilRef] = {
            coilRef: item.coilRef,
            totalWeight: 0,
            totalQuantity: 0,
            lastPrice: item.pricePerTon,
            thickness: item.coilThickness,
            width: item.coilWidth,
            topCoatRAL: item.topCoatRAL,
            backCoatRAL: item.backCoatRAL
          };
        }
        inventory[item.coilRef].totalWeight += item.coilWeight || 0;
        inventory[item.coilRef].totalQuantity += item.quantity;
        inventory[item.coilRef].lastPrice = item.pricePerTon;
      }
    });
  });

  // Convert to array for Excel
  const data: InventoryReportRow[] = Object.values(inventory).map(item => ({
    'Coil Reference': item.coilRef,
    'Thickness': item.thickness || '',
    'Width': item.width || '',
    'Top Coat RAL': item.topCoatRAL || '',
    'Back Coat RAL': item.backCoatRAL || '',
    'Total Weight (kg)': item.totalWeight,
    'Total Quantity': item.totalQuantity,
    'Last Price': item.lastPrice
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length, ...data.map(row => String((row as any)[key]).length))
  }));
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Inventory Report');

  // Generate buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

export const generateProductPerformanceReport = (sales: Sale[]) => {
  // Group items by product description
  const products: { [key: string]: {
    description: string;
    totalQuantity: number;
    totalRevenue: number;
    averagePrice: number;
    salesCount: number;
  }} = {};

  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!products[item.description]) {
        products[item.description] = {
          description: item.description,
          totalQuantity: 0,
          totalRevenue: 0,
          averagePrice: 0,
          salesCount: 0
        };
      }
      products[item.description].totalQuantity += item.quantity;
      products[item.description].totalRevenue += item.totalAmountHT;
      products[item.description].salesCount++;
    });
  });

  // Calculate averages and prepare data
  const data: ProductReportRow[] = Object.values(products).map(product => ({
    'Product': product.description,
    'Total Quantity': product.totalQuantity,
    'Total Revenue': product.totalRevenue,
    'Average Price': product.totalRevenue / product.totalQuantity,
    'Number of Sales': product.salesCount
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length, ...data.map(row => String((row as any)[key]).length))
  }));
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Product Performance');

  // Generate buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

export const generateCustomerAnalyticsReport = (sales: Sale[], clients: Client[]) => {
  // Group sales by client
  const customerAnalytics: { [key: string]: {
    clientId: string;
    clientName: string;
    company: string;
    totalPurchases: number;
    totalRevenue: number;
    averageOrderValue: number;
    lastPurchaseDate: Date;
  }} = {};

  sales.forEach(sale => {
    const client = clients.find(c => c.id === sale.clientId);
    if (!client) return;

    if (!customerAnalytics[client.id]) {
      customerAnalytics[client.id] = {
        clientId: client.id,
        clientName: client.name,
        company: client.company || '',
        totalPurchases: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        lastPurchaseDate: new Date(0)
      };
    }

    customerAnalytics[client.id].totalPurchases++;
    customerAnalytics[client.id].totalRevenue += sale.totalAmountTTC;
    customerAnalytics[client.id].lastPurchaseDate = new Date(Math.max(
      new Date(sale.date).getTime(),
      customerAnalytics[client.id].lastPurchaseDate.getTime()
    ));
  });

  // Calculate averages and prepare data
  const data: CustomerReportRow[] = Object.values(customerAnalytics).map(customer => ({
    'Client Name': customer.clientName,
    'Company': customer.company,
    'Total Purchases': customer.totalPurchases,
    'Total Revenue': customer.totalRevenue,
    'Average Order Value': customer.totalRevenue / customer.totalPurchases,
    'Last Purchase Date': formatDate(customer.lastPurchaseDate)
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length, ...data.map(row => String((row as any)[key]).length))
  }));
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Customer Analytics');

  // Generate buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}; 