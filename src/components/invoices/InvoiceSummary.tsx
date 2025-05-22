import React from 'react';
import { formatCurrency } from '@/utils/format';

interface InvoiceSummaryProps {
  totalHT: number;
  tax: number;
  total: number;
  totalTTC: number;
}

export const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({
  totalHT,
  tax,
  total,
  totalTTC,
}) => {
  return (
    <div className="flex justify-end mb-6">
      <div className="w-64 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium text-[#4B5563]">Total HT:</span>
          <span className="text-sm font-semibold text-[#1A1C21]">{formatCurrency(totalHT)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-medium text-[#4B5563]">TVA (19%):</span>
          <span className="text-sm font-semibold text-[#1A1C21]">{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between border-t border-[#D7DAE0] pt-2">
          <span className="text-sm font-medium text-[#4B5563]">Total TTC:</span>
          <span className="text-sm font-semibold text-[#1A1C21]">{formatCurrency(totalTTC)}</span>
        </div>
      </div>
    </div>
  );
}; 