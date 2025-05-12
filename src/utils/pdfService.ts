
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './format';
import { Invoice, Sale, Client, SaleItem, Payment } from '../types';

// Company info (could be moved to a settings object/context in the future)
const companyInfo = {
  name: 'Groupe HA',
  logo: '/lovable-uploads/9e20d722-b154-48fe-9e9d-616d64585926.png',
  address: '123 Zone Industrielle, Alger, Algérie',
  phone: '+213 XX XX XX XX',
  email: 'contact@groupeha.com',
  nif: '12345678901234',
  nis: '98765432109876',
  rc: 'RC-XXXX-XXXX',
  ai: 'AI-XXXX-XXXX',
};

interface PdfOptions {
  showLogo?: boolean;
  showFooter?: boolean;
  title?: string;
  subtitle?: string;
}

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
  // Create a new PDF document
  const doc = new jsPDF();
  const opt = {
    showLogo: true,
    showFooter: true,
    title: `FACTURE N° ${invoice.invoiceNumber}`,
    subtitle: '',
    ...options,
  };
  
  // Add common header with logo and company info
  addHeaderWithLogo(doc, opt.title, opt.subtitle);
  
  // Add invoice info
  doc.setFontSize(10);
  doc.setTextColor(100);
  
  // Client info (left side)
  doc.text('Client:', 14, 55);
  doc.setFont('helvetica', 'bold');
  doc.text(client.name, 14, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(client.company, 14, 65);
  doc.text(client.address.split('\n').join(', '), 14, 70);
  
  // Invoice details (right side)
  doc.text('Facture N°:', 140, 55);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.invoiceNumber, 165, 55);
  doc.setFont('helvetica', 'normal');
  doc.text('Date:', 140, 60);
  doc.text(formatDate(invoice.date), 165, 60);
  doc.text('Échéance:', 140, 65);
  doc.text(formatDate(invoice.dueDate), 165, 65);
  
  // Invoice items table
  const tableColumn = ["Description", "Quantité", "Prix unitaire", "Total HT"];
  const tableRows: any[] = [];
  
  let totalHT = 0;
  
  // Add all items from all sales
  sales.forEach(sale => {
    sale.items.forEach(item => {
      let description = item.description;
      if (item.coilRef) {
        description += `\nRéf: ${item.coilRef}`;
      }
      if (item.coilThickness && item.coilWidth) {
        description += `\n${item.coilThickness}mm x ${item.coilWidth}mm`;
      }
      if (item.topCoatRAL || item.backCoatRAL) {
        description += `\nRAL: ${item.topCoatRAL || '-'}/${item.backCoatRAL || '-'}`;
      }
      
      tableRows.push([
        description,
        `${item.quantity} tonnes`,
        formatCurrency(item.pricePerTon),
        formatCurrency(item.totalAmount),
      ]);
      
      totalHT += item.totalAmount;
    });
    
    // Add transportation fee if any
    if (sale.transportationFee && sale.transportationFee > 0) {
      tableRows.push([
        "Frais de transport",
        "1",
        formatCurrency(sale.transportationFee),
        formatCurrency(sale.transportationFee),
      ]);
      totalHT += sale.transportationFee;
    }
  });
  
  // Generate the table
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 80,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    margin: { top: 80 },
    styles: { overflow: 'linebreak', cellWidth: 'wrap' },
    columnStyles: {
      0: { cellWidth: 80 },
      3: { halign: 'right' },
    },
  });
  
  // Calculate the final y position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Add summary section
  doc.setFontSize(10);
  
  // TVA calculation (assuming 19%)
  const tvaRate = 0.19;
  const tvaAmount = totalHT * tvaRate;
  const totalTTC = totalHT + tvaAmount;
  
  // Payment information if any
  let totalPaid = 0;
  if (payments.length > 0) {
    payments.forEach(payment => {
      totalPaid += payment.amount;
    });
  }
  
  const remainingAmount = totalTTC - totalPaid;
  
  // Right-aligned summary table
  const summaryX = 120;
  const summaryData = [
    ['Total HT:', formatCurrency(totalHT)],
    [`TVA (${(tvaRate * 100).toFixed(0)}%):`, formatCurrency(tvaAmount)],
    ['Total TTC:', formatCurrency(totalTTC)],
  ];
  
  if (totalPaid > 0) {
    summaryData.push(['Payé:', formatCurrency(totalPaid)]);
    summaryData.push(['Reste à payer:', formatCurrency(remainingAmount)]);
  }
  
  // Add summary data
  summaryData.forEach((row, index) => {
    const isTotal = index === 2 || index === summaryData.length - 1;
    const y = finalY + (index * 6);
    
    if (isTotal) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    }
    
    doc.text(row[0], summaryX, y);
    doc.text(row[1], 195, y, { align: 'right' });
  });
  
  // Add payment status
  if (invoice.isPaid) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 128, 0); // Green color
    doc.text('PAYÉE', 195, finalY + (summaryData.length * 6) + 10, { align: 'right' });
    doc.setTextColor(0); // Reset to black
  } else if (new Date() > invoice.dueDate) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 0, 0); // Red color
    doc.text('EN RETARD', 195, finalY + (summaryData.length * 6) + 10, { align: 'right' });
    doc.setTextColor(0); // Reset to black
  }
  
  // Add footer with payment details and terms
  const footerY = finalY + (summaryData.length * 6) + 20;
  
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Modalités de paiement:', 14, footerY);
  doc.text('Virement bancaire ou chèque à l\'ordre de Groupe HA', 14, footerY + 5);
  
  // Add page numbers and company info at the bottom
  if (opt.showFooter) {
    addFooter(doc);
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
  // Create a new PDF document
  const doc = new jsPDF();
  const opt = {
    showLogo: true,
    showFooter: true,
    title: 'DEVIS',
    subtitle: `Réf: DEV-${formatDate(sale.date, 'YYYYMMDD')}-${sale.id.substring(0, 4)}`,
    ...options,
  };
  
  // Add common header with logo and company info
  addHeaderWithLogo(doc, opt.title, opt.subtitle);
  
  // Add quotation info
  doc.setFontSize(10);
  doc.setTextColor(100);
  
  // Client info (left side)
  doc.text('Client:', 14, 55);
  doc.setFont('helvetica', 'bold');
  doc.text(client.name, 14, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(client.company, 14, 65);
  doc.text(client.address.split('\n').join(', '), 14, 70);
  
  // Sale details (right side)
  doc.text('Date:', 140, 55);
  doc.text(formatDate(sale.date), 165, 55);
  doc.text('Validité:', 140, 60);
  
  // Set validity to 30 days from sale date
  const validityDate = new Date(sale.date);
  validityDate.setDate(validityDate.getDate() + 30);
  doc.text(formatDate(validityDate), 165, 60);
  
  // Sale items table
  const tableColumn = ["Description", "Quantité", "Prix unitaire", "Total HT"];
  const tableRows: any[] = [];
  
  let totalHT = 0;
  
  // Add all items from the sale
  sale.items.forEach(item => {
    let description = item.description;
    if (item.coilRef) {
      description += `\nRéf: ${item.coilRef}`;
    }
    if (item.coilThickness && item.coilWidth) {
      description += `\n${item.coilThickness}mm x ${item.coilWidth}mm`;
    }
    if (item.topCoatRAL || item.backCoatRAL) {
      description += `\nRAL: ${item.topCoatRAL || '-'}/${item.backCoatRAL || '-'}`;
    }
    
    tableRows.push([
      description,
      `${item.quantity} tonnes`,
      formatCurrency(item.pricePerTon),
      formatCurrency(item.totalAmount),
    ]);
    
    totalHT += item.totalAmount;
  });
  
  // Add transportation fee if any
  if (sale.transportationFee && sale.transportationFee > 0) {
    tableRows.push([
      "Frais de transport",
      "1",
      formatCurrency(sale.transportationFee),
      formatCurrency(sale.transportationFee),
    ]);
    totalHT += sale.transportationFee;
  }
  
  // Generate the table
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 80,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    margin: { top: 80 },
    styles: { overflow: 'linebreak', cellWidth: 'wrap' },
    columnStyles: {
      0: { cellWidth: 80 },
      3: { halign: 'right' },
    },
  });
  
  // Calculate the final y position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Add summary section
  doc.setFontSize(10);
  
  // TVA calculation (assuming 19%)
  const tvaRate = 0.19;
  const tvaAmount = totalHT * tvaRate;
  const totalTTC = totalHT + tvaAmount;
  
  // Right-aligned summary table
  const summaryX = 120;
  const summaryData = [
    ['Total HT:', formatCurrency(totalHT)],
    [`TVA (${(tvaRate * 100).toFixed(0)}%):`, formatCurrency(tvaAmount)],
    ['Total TTC:', formatCurrency(totalTTC)],
  ];
  
  // Add summary data
  summaryData.forEach((row, index) => {
    const isTotal = index === 2;
    const y = finalY + (index * 6);
    
    if (isTotal) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    }
    
    doc.text(row[0], summaryX, y);
    doc.text(row[1], 195, y, { align: 'right' });
  });
  
  // Add terms
  const termsY = finalY + (summaryData.length * 6) + 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Conditions:', 14, termsY);
  doc.setFont('helvetica', 'normal');
  doc.text('• Devis valable 30 jours à compter de la date d\'émission.', 14, termsY + 6);
  doc.text('• Livraison: à convenir selon disponibilité.', 14, termsY + 12);
  doc.text('• Modalité de paiement: à convenir.', 14, termsY + 18);
  
  // Add notes if available
  if (sale.notes) {
    doc.text('Notes:', 14, termsY + 30);
    doc.text(sale.notes, 14, termsY + 36);
  }
  
  // Add page numbers and company info at the bottom
  if (opt.showFooter) {
    addFooter(doc);
  }
  
  return doc;
};

/**
 * Add a common header with logo and company information
 */
const addHeaderWithLogo = async (doc: jsPDF, title: string, subtitle = ''): Promise<void> => {
  // Add logo image
  try {
    const logo = companyInfo.logo;
    doc.addImage(logo, 'PNG', 14, 10, 40, 20);
  } catch (error) {
    console.error('Error adding logo:', error);
  }
  
  // Add company name and info
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(companyInfo.name, 60, 15);
  doc.text(companyInfo.address, 60, 20);
  doc.text(`Tel: ${companyInfo.phone}`, 60, 25);
  doc.text(`Email: ${companyInfo.email}`, 60, 30);
  
  // Add company identifiers
  doc.text(`NIF: ${companyInfo.nif}`, 140, 15);
  doc.text(`NIS: ${companyInfo.nis}`, 140, 20);
  doc.text(`RC: ${companyInfo.rc}`, 140, 25);
  doc.text(`AI: ${companyInfo.ai}`, 140, 30);
  
  // Add horizontal line
  doc.setLineWidth(0.5);
  doc.setDrawColor(200);
  doc.line(14, 38, 196, 38);
  
  // Add document title
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 105, 45, { align: 'center' });
  
  // Add subtitle if available
  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 105, 52, { align: 'center' });
  }
};

/**
 * Add footer to document with page numbers and company info
 */
const addFooter = (doc: jsPDF): void => {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    const pageHeight = doc.internal.pageSize.height;
    
    // Add page number
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} sur ${pageCount}`, 105, pageHeight - 10, { align: 'center' });
    
    // Add company info at the bottom
    doc.setFontSize(8);
    doc.text(companyInfo.name, 14, pageHeight - 15);
    doc.text(`NIF: ${companyInfo.nif} | NIS: ${companyInfo.nis}`, 14, pageHeight - 10);
  }
};

export default {
  generateInvoicePDF,
  generateSalePDF
};
