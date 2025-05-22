import React from 'react';

interface InvoiceDateProps {
  date: string;
  paymentMethod: string;
  paymentTerms: string;
}

export const InvoiceDate: React.FC<InvoiceDateProps> = ({ date, paymentMethod, paymentTerms }) => {
  return (
    <div className="flex flex-col gap-2 mb-6">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[#4B5563]">Date:</span>
        <span className="text-sm text-[#1A1C21]">{date}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[#4B5563]">Mode de paiement:</span>
        <span className="text-sm text-[#1A1C21]">{paymentMethod}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[#4B5563]">Conditions de paiement:</span>
        <span className="text-sm text-[#1A1C21]">{paymentTerms}</span>
      </div>
    </div>
  );
}; 