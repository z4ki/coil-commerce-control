import React from 'react';
import { PDFRenderer } from './PDFRenderer';
import type { InvoicePDFProps } from './InvoicePDF';

const sampleInvoiceData: InvoicePDFProps = {
  invoiceNumber: 'INV-2024-001',
  date: '2024-03-20',
  paymentMethod: 'Bank Transfer',
  paymentTerms: '30 days',
  companyInfo: {
    name: 'Your Company Name',
    rc: 'RC123456',
    ai: 'AI789012',
    nif: 'NIF345678',
    nis: 'NIS901234',
    address: '123 Business Street, City, Country',
  },
  clientInfo: {
    name: 'Client Company Name',
    rc: 'RC987654',
    ai: 'AI654321',
    nif: 'NIF321098',
    nis: 'NIS765432',
    address: '456 Client Avenue, City, Country',
  },
  items: [
    {
      description: 'Product A',
      code: 'PROD-A',
      weight: 10,
      unitPrice: 100,
      total: 1000,
    },
    {
      description: 'Product B',
      code: 'PROD-B',
      weight: 5,
      unitPrice: 200,
      total: 1000,
    },
  ],
  totalHT: 2000,
  tax: 19,
  total: 2000,
  totalTTC: 2380,
  totalInWords: 'Two Thousand Three Hundred Eighty Dollars',
  contactInfo: {
    phone: '+1 234 567 890',
    email: 'contact@yourcompany.com',
    companyName: 'Your Company Name',
  },
  slogan: 'Colors that lasts,Quality that endures',
};

export const InvoiceExample: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Invoice Preview</h1>
      <PDFRenderer invoiceData={sampleInvoiceData} />
    </div>
  );
}; 