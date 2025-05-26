import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Invoice, Sale, Client, CompanySettings, SaleItem } from '../types';

interface PDFTableRow {
  description: string;
  coilRef?: string;
  dimensions?: string;
  quantity: string;
  pricePerTon: string;
  totalHT: string;
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR').format(date);
};

export const generateInvoicePDF = async (
  invoice: Invoice,
  client: Client,
  sales: Sale[],
  companySettings: CompanySettings
): Promise<Buffer> => {
  const doc = new jsPDF();
  
  // Add company logo if exists
  // if (companySettings.logo) {
  //   doc.addImage(companySettings.logo, 'JPEG', 10, 10, 50, 30);
  // }

  // Company information
  doc.setFontSize(10);
  doc.text(companySettings.name, 10, 20);
  doc.text(companySettings.address, 10, 25);
  doc.text(`Tél: ${companySettings.phone}`, 10, 30);
  doc.text(`Email: ${companySettings.email}`, 10, 35);
  doc.text(`NIF: ${companySettings.nif}`, 10, 40);
  doc.text(`NIS: ${companySettings.nis}`, 10, 45);
  doc.text(`RC: ${companySettings.rc}`, 10, 50);
  doc.text(`AI: ${companySettings.ai}`, 10, 55);
  doc.text(`RIB: ${companySettings.rib}`, 10, 60);

  // Invoice details
  doc.setFontSize(16);
  doc.text('FACTURE', 100, 30);
  doc.setFontSize(10);
  doc.text(`N°: ${invoice.invoiceNumber}`, 100, 40);
  doc.text(`Date: ${formatDate(invoice.date)}`, 100, 45);
  doc.text(`Échéance: ${formatDate(invoice.dueDate)}`, 100, 50);

  // Client information
  doc.text('Client:', 140, 20);
  doc.text(client.name, 140, 25);
  if (client.company) doc.text(client.company, 140, 30);
  doc.text(client.address, 140, 35);
  doc.text(`Tél: ${client.phone}`, 140, 40);
  doc.text(`Email: ${client.email}`, 140, 45);
  if (client.nif) doc.text(`NIF: ${client.nif}`, 140, 50);
  if (client.nis) doc.text(`NIS: ${client.nis}`, 140, 55);
  if (client.rc) doc.text(`RC: ${client.rc}`, 140, 60);
  if (client.rib) doc.text(`RIB: ${client.rib}`, 140, 65);

  // Sale items table
  const tableRows: PDFTableRow[] = sales.flatMap(sale =>
    sale.items.map(item => ({
      description: item.description,
      coilRef: item.coilRef,
      dimensions: formatDimensions(item),
      quantity: formatNumber(item.quantity),
      pricePerTon: formatNumber(item.pricePerTon),
      totalHT: formatNumber(item.totalAmountHT)
    }))
  );

  (doc as any).autoTable({
    startY: 80,
    head: [[
      'Description',
      'Réf. Bobine',
      'Dimensions',
      'Quantité (T)',
      'Prix/T (DZD)',
      'Total HT (DZD)'
    ]],
    body: tableRows.map(row => [
      row.description,
      row.coilRef || '',
      row.dimensions || '',
      row.quantity,
      row.pricePerTon,
      row.totalHT
    ])
  });

  // Calculate final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  doc.text('Total HT:', 140, finalY);
  doc.text(formatNumber(invoice.totalAmountHT) + ' DZD', 170, finalY);

  if (invoice.transportationFee) {
    doc.text('Transport:', 140, finalY + 5);
    doc.text(formatNumber(invoice.transportationFee) + ' DZD', 170, finalY + 5);
  }

  doc.text('TVA (19%):', 140, finalY + 10);
  doc.text(formatNumber(invoice.totalAmountTTC - invoice.totalAmountHT) + ' DZD', 170, finalY + 10);

  doc.setFontSize(12);
  doc.text('Total TTC:', 140, finalY + 20);
  doc.text(formatNumber(invoice.totalAmountTTC) + ' DZD', 170, finalY + 20);

  // Payment information
  doc.setFontSize(10);
  doc.text('Mode de paiement:', 10, finalY + 30);
  if (invoice.paymentMethod) {
    doc.text(formatPaymentMethod(invoice.paymentMethod), 50, finalY + 30);
  }

  // Convert to Buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
};

const formatDimensions = (item: SaleItem): string => {
  if (!item.coilThickness && !item.coilWidth) return '';
  
  const thickness = item.coilThickness ? `${item.coilThickness}mm` : '';
  const width = item.coilWidth ? `${item.coilWidth}mm` : '';
  
  return [thickness, width].filter(Boolean).join(' x ');
};

const formatPaymentMethod = (method: string): string => {
  const methods: { [key: string]: string } = {
    cash: 'Espèces',
    bank_transfer: 'Virement bancaire',
    check: 'Chèque',
    term: 'À terme'
  };
  return methods[method] || method;
}; 