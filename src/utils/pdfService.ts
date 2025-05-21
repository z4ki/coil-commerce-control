import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Client, Invoice, Sale, SaleItem, Payment } from '../types';
import { getSettings } from '../services/settingsService';
import { formatCurrency, formatDate } from './format';
import { numberToWords } from './numberToWords';

// Add autoTable type to jsPDF
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface AutoTableOptions {
  head: string[][];
  body: string[][];
  startY: number;
  theme: string;
  headStyles: {
    fillColor: [number, number, number];
    textColor: [number, number, number];
    fontStyle: string;
    halign: string;
  };
  styles: {
    font: string;
    fontSize: number;
    cellPadding: number;
    overflow: string;
    cellWidth: 'auto' | 'wrap' | number;
  };
  columnStyles: {
    [key: number]: { 
      halign: string;
      cellWidth?: 'auto' | 'wrap' | number;
    };
  };
  margin?: { top: number };
  alternateRowStyles?: {
    fillColor: [number, number, number];
  };
}

interface CompanyInfo {
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  nif: string;
  nis: string;
  rc: string;
  ai: string;
}

interface ExtendedInvoice extends Invoice {
  paymentMethod?: string;
  transportationFee?: number;
}

interface PdfOptions {
  showLogo?: boolean;
  showFooter?: boolean;
  title?: string;
  subtitle?: string;
}

// Helper function to format currency like "1 000,00 DA"
const formatCurrencyForPDF = (amount: number): string => {
  const parts = amount.toFixed(2).replace('.', ',').split(',');
  const wholePart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${wholePart},${parts[1]} DA`;
};

/**
 * Add a common header with logo and company information
 */
const addHeaderWithLogo = async (doc: jsPDF, title: string, subtitle: string, companyInfo: CompanyInfo): Promise<void> => {
  // Add logo image
  try {
    const logo = companyInfo.logo;
    if (logo) {
      doc.addImage(logo, 'PNG', 14, 10, 30, 15); // Adjusted size and position
    }
  } catch (error) {
    console.error('Error adding logo:', error);
  }
  
  // Add company name and tagline
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(companyInfo.name, 14, 40);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Usine de revêtement et traitement des méteaux', 14, 46);
  
  // Add document title and reference
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DEVIS', 14, 60);
  if (subtitle) {
    doc.setFontSize(10);
    doc.text(subtitle, 14, 66);
  }
};

/**
 * Add client information section
 */
const addClientInfo = (doc: jsPDF, client: Client, date: Date): void => {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Client info
  doc.text('Client:', 14, 80);
  doc.setFont('helvetica', 'bold');
  doc.text(client.name, 14, 86);
  if (client.address) {
    doc.setFont('helvetica', 'normal');
    doc.text(client.address, 14, 92);
  }
  
  // Date and validity
  doc.text('Date:', 140, 80);
  doc.text(formatDate(date), 160, 80);
  doc.text('Validité:', 140, 86);
  
  const validityDate = new Date(date);
  validityDate.setDate(validityDate.getDate() + 30);
  doc.text(formatDate(validityDate), 160, 86);
};

/**
 * Generate a PDF for an invoice
 */
export const generateInvoicePDF = async (
  invoice: ExtendedInvoice,
  client: Client,
  sales: Sale[],
  payments: Payment[],
  companyInfo: CompanyInfo
): Promise<jsPDF> => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add header with logo and company info
  await addHeaderWithLogo(doc, 'FACTURE', '', companyInfo);
  
  // Add company and client information
  addClientInfo(doc, client, invoice.date);
  
  // Items table
  const tableColumn = ['Réference', 'Description', 'Poids/T', 'Prix U.', 'Total'];
  const tableRows: string[][] = [];
  
  let totalHT = 0;
  
  // Add all items from all sales
  sales.forEach(sale => {
    sale.items.forEach(item => {
      const description = `BOBINES D'ACIER PRELAQUE ${item.coilThickness}*${item.coilWidth} RAL ${item.topCoatRAL}`;
      
      tableRows.push([
        item.coilRef || '-',
        description,
        item.quantity.toFixed(1),
        formatCurrency(item.pricePerTon),
        formatCurrency(item.totalAmountHT),
      ]);
      
      totalHT += item.totalAmountHT;
    });
    
    // Add transportation fee if any
    if (sale.transportationFee && sale.transportationFee > 0) {
      tableRows.push([
        '-',
        'Transport',
        '1',
        formatCurrency(sale.transportationFee),
        formatCurrency(sale.transportationFee),
      ]);
      totalHT += sale.transportationFee;
    }
  });
  
  // Generate the table
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 105,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255] as [number, number, number],
      textColor: [0, 0, 0] as [number, number, number],
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 5,
      overflow: 'linebreak',
      cellWidth: 'wrap',
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'left' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
  });
  
  const finalY = doc.lastAutoTable.finalY + 10;
  
  // Add summary section
  const tvaRate = 0.19;
  const tvaAmount = totalHT * tvaRate;
  const totalTTC = totalHT + tvaAmount + (invoice.transportationFee || 0);
  
  // Right-aligned summary table
  const summaryX = 120;
  doc.setFontSize(10);
  
  const summaryData = [
    ['Total HT:', formatCurrency(totalHT)],
    ['TVA (19%):', formatCurrency(tvaAmount)],
    ['Transport:', formatCurrency(invoice.transportationFee || 0)],
    ['Total TTC:', formatCurrency(totalTTC)],
  ];
  
  // Add summary data
  summaryData.forEach((row, index) => {
    const y = finalY + (index * 6);
    doc.setFont('helvetica', index === 3 ? 'bold' : 'normal');
    doc.text(row[0], summaryX, y);
    doc.text(row[1], 195, y, { align: 'right' });
  });
  
  // Add amount in words
  const amountInWords = numberToWords(totalTTC);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Arrêter la presente facture à la somme de ${amountInWords} dinars et zéro centime.`, 14, finalY + 30);
  
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

  const companyInfo: CompanyInfo = {
    name: settings.companyName,
    logo: settings.companyLogo || undefined,
    address: settings.companyAddress,
    phone: settings.companyPhone,
    email: settings.companyEmail,
    nif: settings.nif || '',
    nis: settings.nis || '',
    rc: settings.rc || '',
    ai: settings.ai || '',
  };

  // Create a new PDF document
  const doc = new jsPDF();
  const opt = {
    showLogo: true,
    showFooter: true,
    title: 'DEVIS',
    subtitle: `Réf: DEV-${formatDate(sale.date, 'YYYYMMDD')}-${sale.id.substring(0, 4)}`,
    ...options,
  };
  
  // Add header and client info
  await addHeaderWithLogo(doc, opt.title, opt.subtitle, companyInfo);
  addClientInfo(doc, client, sale.date);
  
  // Sale items table
  const tableColumn = ["Description", "Quantité", "Prix unitaire", "Total HT"];
  const tableRows = sale.items.map(item => {
    const description = `BOBINES D'ACIER PRELAQUE ${item.coilThickness}*${item.coilWidth} RAL ${item.topCoatRAL}`;
    const ref = item.coilRef ? `\nRéf: ${item.coilRef}` : '';
    const dimensions = `${item.coilThickness}mm x ${item.coilWidth}mm`;
    
    return [
      description + ref + '\n' + dimensions,
      item.quantity.toFixed(1) + ' tonnes',
      formatCurrencyForPDF(item.pricePerTon),
      formatCurrencyForPDF(item.totalAmountHT),
    ];
  });
  
  // Generate the table
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 100,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185] as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold',
      halign: 'left'
    },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 6,
      overflow: 'linebreak',
      cellWidth: 'auto'
    },
    columnStyles: {
      0: { cellWidth: 80, halign: 'left' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245] as [number, number, number]
    }
  });
  
  const finalY = doc.lastAutoTable.finalY + 10;
  
  // Add summary section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const summaryX = 130;
  const summaryData = [
    ['Total HT:', formatCurrencyForPDF(sale.totalAmountHT)],
    ['TVA (19%):', formatCurrencyForPDF(sale.totalAmountTTC - sale.totalAmountHT)],
    ['Total TTC:', formatCurrencyForPDF(sale.totalAmountTTC)],
  ];
  
  summaryData.forEach((row, index) => {
    const y = finalY + (index * 6);
    doc.setFont('helvetica', index === 2 ? 'bold' : 'normal');
    doc.text(row[0], summaryX, y);
    doc.text(row[1], 195, y, { align: 'right' });
  });
  
  // Add conditions
  const conditionsY = finalY + 30;
  doc.setFont('helvetica', 'bold');
  doc.text('Conditions:', 14, conditionsY);
  doc.setFont('helvetica', 'normal');
  doc.text([
    '• Devis valable 30 jours à compter de la date d\'émission.',
    '• Livraison: à convenir selon disponibilité.',
    '• Modalité de paiement: à convenir.',
  ], 14, conditionsY + 6);
  
  // Add footer with company info
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.text([
    `${companyInfo.name}`,
    `NIF: ${companyInfo.nif} | NIS: ${companyInfo.nis}`,
  ], 14, pageHeight - 10);
  
  doc.text(`Page 1 sur 1`, doc.internal.pageSize.width / 2, pageHeight - 10, { align: 'center' });
  
  return doc;
};

export default {
  generateInvoicePDF,
  generateSalePDF
};
