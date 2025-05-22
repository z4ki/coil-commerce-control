import React from 'react';

interface InvoiceHeaderProps {
  invoiceNumber: string;
  logo?: string;
}

export const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({ invoiceNumber, logo }) => {
  return (
    <div className="flex justify-between items-start mb-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1C21] mb-2">FACTURE</h1>
        <p className="text-sm text-[#4B5563]">N° {invoiceNumber}</p>
      </div>
      {logo && (
        <div className="w-24 h-24">
          <img src={logo} alt="Company Logo" className="w-full h-full object-contain" />
        </div>
      )}
    </div>
  );
}; 