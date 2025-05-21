import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Client, Invoice, Sale, SaleItem, Payment, CompanySettings } from '../types';
import { getSettings } from '../services/settingsService';
import { formatCurrency, formatDate } from './format';
import { numberToWords } from './numberToWords';

// Add autoTable type to jsPDF
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
    lastAutoTable: { finalY: number; };
  }
}

interface AutoTableOptions {
  head?: string[][];
  body: string[][];
  startY: number;
  theme?: string;
  headStyles?: {
    fillColor: [number, number, number];
    textColor: [number, number, number];
    fontStyle: string;
    halign: string;
  };
  styles: {
    font: string;
    fontSize: number;
    cellPadding?: number;
    overflow?: string;
    cellWidth?: 'auto' | 'wrap' | number;
  };
  columnStyles: {
    [key: number]: {
      halign: string;
      cellWidth?: 'auto' | 'wrap' | number;
    }
  };
  margin?: { left: number };
  tableWidth?: number;
}

interface PdfOptions {
  title?: string;
  showLogo?: boolean;
  showFooter?: boolean;
  showQRCode?: boolean;
}

/**
 * Add document header with invoice/sale details
 */
const addDocumentHeader = (
  doc: jsPDF,
  title: string,
  number: string,
  date: Date,
  paymentMethod?: string
): void => {
  // Add title
  doc.setFontSize(22).setFont("helvetica", "bold");
  doc.text(title, doc.internal.pageSize.width / 2, 20, { align: "center" });
  
  // Document details (top left)
  doc.setFontSize(11).setFont("helvetica", "normal");
  doc.text("N°", 20, 35);
  doc.text("Date:", 20, 42);
  if (paymentMethod) {
    doc.text("Règlement:", 20, 49);
  }
  
  doc.text(number, 60, 35);
  doc.text(formatDate(date), 60, 42);
  if (paymentMethod) {
    doc.text(paymentMethod, 60, 49);
  }
};

/**
 * Add company and client information
 */
const addCompanyClientInfo = (
  doc: jsPDF,
  companyInfo: CompanySettings,
  client: Client
): void => {
  // Company information (left side)
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(companyInfo.name, 20, 65);
  doc.setFont("helvetica", "normal");
  doc.text("RC : " + companyInfo.rc, 20, 72);
  doc.text("A.I : " + companyInfo.ai, 20, 79);
  doc.text("NIF : " + companyInfo.nif, 20, 86);
  doc.text("NIS : " + companyInfo.nis, 20, 93);
  doc.text("Téléphone : " + companyInfo.phone, 20, 100);
  
  // Handle multi-line address
  const addressLines = companyInfo.address.split('\n');
  addressLines.forEach((line, i) => {
    doc.text("Adresse: " + line, 20, 107 + (i * 7));
  });
  
  // Client information (right side)
  doc.text("A:", 120, 65);
  doc.setFont("helvetica", "bold");
  doc.text(client.name, 140, 65);
  doc.setFont("helvetica", "normal");
  doc.text("RC :", 120, 72);
  doc.text("A.I :", 120, 79);
  doc.text("NIF :", 120, 86);
  doc.text("NIS :", 120, 93);
  doc.text("Téléphone :", 120, 100);
  doc.text("Adresse:", 120, 107);
  
  doc.text(client.rc || '', 140, 72);
  doc.text(client.ai || '', 140, 79);
  doc.text(client.nif || '', 140, 86);
  doc.text(client.nis || '', 140, 93);
  doc.text(client.phone || '', 140, 100);
  doc.text(client.address || '', 140, 107);
};

/**
 * Add items table with proper styling
 */
const addItemsTable = (doc: jsPDF, items: string[][]): void => {
  doc.autoTable({
    head: [['Référence', 'Description', 'Quantité', 'Prix U.', 'Total HT']],
    body: items,
    startY: 125,
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 6,
      overflow: 'linebreak',
      cellWidth: 'auto'
    },
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 30 },
      1: { halign: 'left', cellWidth: 85 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 30 }
    }
  });
};

/**
 * Add financial summary
 */
const addFinancialSummary = (
  doc: jsPDF,
  totalHT: number,
  tva: number,
  transport: number = 0
): void => {
  const finalY = doc.lastAutoTable.finalY + 15;
  const totalTTC = totalHT + tva + transport;

  // Summary table
  doc.autoTable({
    body: [
      ['Total HT:', formatCurrency(totalHT)],
      ['TVA (19%):', formatCurrency(tva)],
      ...(transport > 0 ? [['Transport:', formatCurrency(transport)]] : []),
      ['Total TTC:', formatCurrency(totalTTC)]
    ],
    startY: finalY,
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 6,
      overflow: 'linebreak',
      cellWidth: 'auto'
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 40 },
      1: { halign: 'right', cellWidth: 30 }
    },
    margin: { left: 120 },
    theme: 'plain',
    tableWidth: 80
  });

  // Amount in words
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  const amountInWordsY = doc.lastAutoTable.finalY + 15;
  const words = numberToWords(totalTTC);
  doc.text(`Arrêter la presente facture à la somme de ${words}`, 20, amountInWordsY);
  doc.text('dinars et zéro centime.', 20, amountInWordsY + 7);
};

/**
 * Add footer with company details
 */
const addFooter = (doc: jsPDF, companyInfo: CompanySettings): void => {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(companyInfo.name, doc.internal.pageSize.width / 2, pageHeight - 20, { align: 'center' });
  doc.text(
    `NIF: ${companyInfo.nif} | NIS: ${companyInfo.nis} | RC: ${companyInfo.rc} | AI: ${companyInfo.ai}`,
    doc.internal.pageSize.width / 2,
    pageHeight - 15,
    { align: 'center' }
  );
  doc.text(
    `Téléphone: ${companyInfo.phone}`,
    doc.internal.pageSize.width / 2,
    pageHeight - 10,
    { align: 'center' }
  );
};

/**
 * Add watermark for unpaid invoices
 */
const addUnpaidWatermark = (doc: jsPDF): void => {
  // Save current state
  const fontSize = doc.getFontSize();
  const textColor = doc.getTextColor();
  
  // Set watermark style
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(60);
  doc.setFont("helvetica", "bold");
  
  // Add rotated text
  const text = "NON PAYÉ";
  const xPos = doc.internal.pageSize.width / 2;
  const yPos = doc.internal.pageSize.height / 2;
  
  doc.text(text, xPos, yPos, {
    align: "center",
    angle: 45
  });
  
  // Restore original state
  doc.setTextColor(textColor);
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "normal");
};

/**
 * Add QR code for digital payments
 */
const addPaymentQRCode = (doc: jsPDF, invoice: Invoice, companySettings: CompanySettings): void => {
  // Create payment info string
  const paymentInfo = JSON.stringify({
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.totalAmountTTC,
    company: companySettings.name,
    bankAccount: companySettings.bankAccount || '',
    reference: `INV-${invoice.invoiceNumber}`
  });
  
  // Add QR code title
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Scanner pour payer", 20, doc.internal.pageSize.height - 35, { align: "left" });
  
  // Add QR code using qrcode option of jsPDF
  doc.addImage(
    paymentInfo,
    "QR",
    20,
    doc.internal.pageSize.height - 30,
    25,
    25
  );
};

/**
 * Generate a PDF for an invoice
 */
export const generateInvoicePDF = async (
  invoice: Invoice,
  client: Client,
  sales: Sale[],
  payments: Payment[] = [],
  options: PdfOptions = {}
): Promise<jsPDF> => {
  // Get company settings
  const settings = await getSettings();
  if (!settings) {
    throw new Error('Company settings not found');
  }

  const doc = new jsPDF();

  // Add watermark if invoice is not paid
  if (!invoice.isPaid) {
    addUnpaidWatermark(doc);
  }

  // Add header
  addDocumentHeader(
    doc,
    'FACTURE',
    invoice.invoiceNumber,
    invoice.date,
    invoice.paymentMethod
  );

  // Add company and client information
  addCompanyClientInfo(doc, settings.company, client);

  // Prepare items for table
  const items = sales.flatMap(sale =>
    sale.items.map(item => [
      item.coilRef || '-',
      `BOBINES D'ACIER PRELAQUE ${item.coilThickness}*${item.coilWidth} RAL ${item.topCoatRAL}`,
      item.quantity.toFixed(1),
      formatCurrency(item.pricePerTon),
      formatCurrency(item.totalAmountHT)
    ])
  );

  // Add transport as an item if present
  if (invoice.transportationFee && invoice.transportationFee > 0) {
    items.push([
      '-',
      'Transport',
      '1',
      formatCurrency(invoice.transportationFee),
      formatCurrency(invoice.transportationFee)
    ]);
  }

  // Add items table
  addItemsTable(doc, items);

  // Calculate totals
  const totalHT = sales.reduce((sum, sale) => sum + sale.totalAmountHT, 0);
  const tva = totalHT * 0.19;
  const transport = invoice.transportationFee || 0;

  // Add financial summary
  addFinancialSummary(doc, totalHT, tva, transport);

  // Add footer
  addFooter(doc, settings.company);

  // Add QR code if enabled in options
  if (options.showQRCode) {
    addPaymentQRCode(doc, invoice, settings.company);
  }

  return doc;
};

/**
 * Generate a PDF for a sale (quotation)
 */
export const generateSalePDF = async (
  sale: Sale,
  client: Client,
  options: PdfOptions = {}
): Promise<jsPDF> => {
  // Get company settings
  const settings = await getSettings();
  if (!settings) {
    throw new Error('Company settings not found');
  }

  const doc = new jsPDF();

  // Add header
  addDocumentHeader(
    doc,
    options.title || 'DEVIS',
    `DEV-${formatDate(sale.date, 'YYYYMMDD')}-${sale.id.substring(0, 4)}`,
    sale.date
  );

  // Add company and client information
  addCompanyClientInfo(doc, settings.company, client);

  // Prepare items for table
  const items = sale.items.map(item => [
    item.coilRef || '-',
    `BOBINES D'ACIER PRELAQUE ${item.coilThickness}*${item.coilWidth} RAL ${item.topCoatRAL}`,
    item.quantity.toFixed(1),
    formatCurrency(item.pricePerTon),
    formatCurrency(item.totalAmountHT)
  ]);

  // Add items table
  addItemsTable(doc, items);

  // Add financial summary
  const tva = sale.totalAmountHT * 0.19;
  addFinancialSummary(doc, sale.totalAmountHT, tva, sale.transportationFee || 0);

  // Add footer
  addFooter(doc, settings.company);

  return doc;
};

/**
 * Saves the invoice PDF to a file
 */
export const saveInvoicePDF = async (
  invoice: Invoice,
  client: Client,
  sales: Sale[],
  payments: Payment[] = []
): Promise<string> => {
  const doc = await generateInvoicePDF(invoice, client, sales, payments);
  const fileName = `facture-${invoice.invoiceNumber}.pdf`;
  doc.save(fileName);
  return fileName;
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
  const doc = await generateInvoicePDF(invoice, client, sales, payments);
  const url = doc.output('bloburl');
  return url.toString();
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
  const doc = await generateInvoicePDF(invoice, client, sales, payments);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  
  // Create iframe for printing
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
