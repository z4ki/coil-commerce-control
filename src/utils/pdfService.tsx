import { Client, Invoice, Sale, Payment, CompanyProfile, SaleItem } from '../types/index';
import { getSettings } from '../services/settingsService';
import { formatCurrency, formatDate } from './format';
import { numberToWords } from './numberToWords';
import React from 'react';

interface PDFGenerationData {
  documentType: 'invoice' | 'sale';
  invoiceNumber: string;
  date: string;
  paymentMethod: string;
  paymentTerms: string;
  companyInfo: CompanyProfile;
  clientInfo: {
    name: string;
    rc: string;
    ai: string;
    nif: string;
    nis: string;
    address: string;
  };
  items: Array<{
    description: string;
    code: string;
    weight: number;
    unitPrice: number;
    total: number;
  }>;
  totalHT: number;
  tax: number;
  totalTTC: number;
  contactInfo: {
    phone: string;
    email: string;
    companyName: string;
  };
  slogan: string;
}

/**
 * Generate a PDF for an invoice
 */
export const generateInvoicePDF = async (
  invoice: Invoice,
  client: Client,
  sales: Sale[] = [],
  payments: Payment[] = [],
  company: CompanyProfile
): Promise<Blob> => {
  // Prepare the data for our PDF template
  const items = sales.flatMap(sale => sale.items.map((item: SaleItem) => ({
    description: item.description || '',
    code: item.coilRef || '',
    weight: ((item as any).productType === 'coil' || (item as any).productType === 'steel_slitting' || (item as any).product_type === 'coil' || (item as any).product_type === 'steel_slitting')
      ? (item.coilWeight || 0)
      : ((item as any).productType === 'corrugated_sheet' || (item as any).product_type === 'corrugated_sheet')
        ? (item.quantity || 0)
        : (item.coilWeight || 0),
    unitPrice: item.pricePerTon,
    total: item.totalAmountHT,
  })));

  // Add transportation fee if present
  if (invoice.transportationFee && invoice.transportationFee > 0) {
    items.push({
      description: 'Transport',
      code: '-',
      weight: 1,
      unitPrice: invoice.transportationFee,
      total: invoice.transportationFee
    });
  }

  const totalInWords = numberToWords(invoice.totalAmountTTC);

  const invoiceData = {
    documentType: 'invoice' as const,
    invoiceNumber: invoice.invoiceNumber,
    date: formatDate(invoice.date),
    paymentMethod: invoice.paymentMethod || 'Bank Transfer',
    paymentTerms: formatDate(invoice.dueDate),
    companyInfo: {
      name: company.name,
      rc: company.rc,
      ai: company.ai,
      nif: company.nif,
      nis: company.nis,
      address: company.address,
    },
    clientInfo: {
      name: client.company || client.name,
      rc: client.rc || '',
      ai: client.ai || '',
      nif: client.nif || '',
      nis: client.nis || '',
      address: client.address || '',
    },
    items,
    totalHT: invoice.totalAmountHT,
    tax: 19, // Using standard tax rate
    totalTTC: invoice.totalAmountTTC,
    totalInWords,
    contactInfo: {
      phone: company.phone,
      email: company.email,
      companyName: company.name,
    },
    slogan: 'Colors that lasts,Quality that endures',
  };

  try {
    const { pdf } = await import('@react-pdf/renderer');
    const { InvoicePDF } = await import('../components/invoice/InvoicePDF');
    const pdfDoc = await pdf(<InvoicePDF {...invoiceData} />).toBlob();
    return pdfDoc;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Generate a PDF for a sale
 */
export const generateSalePDF = async (
  sale: Sale,
  client: Client,
  company: CompanyProfile
): Promise<Blob> => {
  // Prepare the data for our PDF template
  const items = sale.items.map((item: SaleItem) => ({
    description: item.description || '',
    code: item.coilRef || '',
    weight: ((item as any).productType === 'coil' || (item as any).productType === 'steel_slitting' || (item as any).product_type === 'coil' || (item as any).product_type === 'steel_slitting')
      ? (item.coilWeight || 0)
      : ((item as any).productType === 'corrugated_sheet' || (item as any).product_type === 'corrugated_sheet')
        ? (item.quantity || 0)
        : (item.coilWeight || 0),
    unitPrice: item.pricePerTon,
    total: item.totalAmountHT,
  }));
  // Add transportation fee if present
  if (sale.transportationFee && sale.transportationFee > 0) {
    items.push({
      description: 'Transport',
      code: '-',
      weight: 1,
      unitPrice: sale.transportationFee,
      total: sale.transportationFee
    });
  }

  const totalInWords = numberToWords(sale.totalAmountTTC);

  // Format payment method for display
  const formatPaymentMethod = (method: string) => {
    const methodMap: { [key: string]: string } = {
      'cash': 'Espèces',
      'bank_transfer': 'Virement bancaire',
      'check': 'Chèque',
      'term': 'À terme'
    };
    return methodMap[method] || method;
  };

  const saleData = {
    documentType: 'sale' as const,
    invoiceNumber: `Devis-${sale.id.slice(0, 8)}`, // Use first 8 chars of UUID
    date: formatDate(sale.date),
    paymentMethod: sale.paymentMethod ? formatPaymentMethod(sale.paymentMethod) : 'Non spécifié',
    paymentTerms: sale.paymentMethod === 'term' ? 'À terme' : '-',
    companyInfo: {
      name: company.name,
      rc: company.rc,
      ai: company.ai,
      nif: company.nif,
      nis: company.nis,
      address: company.address,
    },
    clientInfo: {
      name: client.company || client.name,
      rc: client.rc || '',
      ai: client.ai || '',
      nif: client.nif || '',
      nis: client.nis || '',
      address: client.address || '',
    },
    items,
    totalHT: sale.totalAmountHT,
    tax: 19, // Using standard tax rate
    totalTTC: sale.totalAmountTTC,
    totalInWords,
    contactInfo: {
      phone: company.phone,
      email: company.email,
      companyName: company.name,
    },
    slogan: 'Colors that lasts,Quality that endures',
  };

  try {
    const { pdf } = await import('@react-pdf/renderer');
    const { InvoicePDF } = await import('../components/invoice/InvoicePDF');
    const pdfDoc = await pdf(<InvoicePDF {...saleData} />).toBlob();
    return pdfDoc;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Save a PDF blob to a file
 */
const savePdfBlob = async (blob: Blob, filename: string): Promise<void> => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Saves the invoice PDF to a file
 */
export const saveInvoicePDF = async (
  invoice: Invoice,
  client: Client,
  sales: Sale[],
  payments: Payment[] = []
): Promise<void> => {
  const settings = await getSettings();
  if (!settings || !settings.company) {
    throw new Error('Company settings not found');
  }
  
  const pdfBlob = await generateInvoicePDF(invoice, client, sales, payments, settings.company);
  await savePdfBlob(pdfBlob, `facture-${invoice.invoiceNumber}.pdf`);
};

/**
 * Saves the sale PDF to a file
 */
export const saveSalePDF = async (
  sale: Sale,
  client: Client
): Promise<void> => {
  const settings = await getSettings();
  if (!settings || !settings.company) {
    throw new Error('Company settings not found');
  }
  
  const pdfBlob = await generateSalePDF(sale, client, settings.company);
  await savePdfBlob(pdfBlob, `devis-${client.company}.pdf`);
};

/**
 * Generate a preview URL for an invoice PDF
 */
export const getInvoicePreviewUrl = async (
  invoice: Invoice,
  client: Client,
  sales: Sale[],
  payments: Payment[] = []
): Promise<string> => {
  const settings = await getSettings();
  if (!settings || !settings.company) {
    throw new Error('Company settings not found');
  }
  
  const pdfBlob = await generateInvoicePDF(invoice, client, sales, payments, settings.company);
  return URL.createObjectURL(pdfBlob);
};

/**
 * Generate a preview URL for a sale PDF
 */
export const getSalePreviewUrl = async (
  sale: Sale,
  client: Client
): Promise<string> => {
  const settings = await getSettings();
  if (!settings || !settings.company) {
    throw new Error('Company settings not found');
  }
  
  const pdfBlob = await generateSalePDF(sale, client, settings.company);
  return URL.createObjectURL(pdfBlob);
};

/**
 * Prints the invoice PDF directly
 */
export const printInvoicePDF = async (
  invoice: Invoice,
  client: Client,
  sales: Sale[],
  payments: Payment[] = []
): Promise<void> => {
  const settings = await getSettings();
  if (!settings || !settings.company) {
    throw new Error('Company settings not found');
  }
  
  const pdfBlob = await generateInvoicePDF(invoice, client, sales, payments, settings.company);
  const url = URL.createObjectURL(pdfBlob);
  
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  
  iframe.onload = () => {
    iframe.contentWindow?.print();
    // Remove iframe after printing
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 1000);
  };
};

/**
 * Prints the sale PDF directly
 */
export const printSalePDF = async (
  sale: Sale,
  client: Client
): Promise<void> => {
  const settings = await getSettings();
  if (!settings || !settings.company) {
    throw new Error('Company settings not found');
  }
  
  const pdfBlob = await generateSalePDF(sale, client, settings.company);
  const url = URL.createObjectURL(pdfBlob);
  
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  
  iframe.onload = () => {
    iframe.contentWindow?.print();
    // Remove iframe after printing
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 1000);
  };
}; 