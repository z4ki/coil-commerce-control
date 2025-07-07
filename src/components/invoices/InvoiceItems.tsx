import React from 'react';
import { formatCurrency } from '@/utils/format';

interface InvoiceItem {
  description: string;
  code: string;
  weight: number;
  unitPrice: number;
  total: number;
}

interface InvoiceItemsProps {
  items: InvoiceItem[];
}

export const InvoiceItems: React.FC<InvoiceItemsProps> = ({ items }) => {
  return (
    <div className="mb-8">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#F9FAFB]">
            <th className="py-3 px-4 text-left text-sm font-semibold text-[#1A1C21] border-b border-[#D7DAE0]">Code</th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-[#1A1C21] border-b border-[#D7DAE0]">Description</th>
            <th className="py-3 px-4 text-right text-sm font-semibold text-[#1A1C21] border-b border-[#D7DAE0]">Poids (T)</th>
            <th className="py-3 px-4 text-right text-sm font-semibold text-[#1A1C21] border-b border-[#D7DAE0]">Prix U.</th>
            <th className="py-3 px-4 text-right text-sm font-semibold text-[#1A1C21] border-b border-[#D7DAE0]">Total HT</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-b border-[#D7DAE0] last:border-b-0">
              <td className="py-3 px-4 text-sm text-[#4B5563]">{item.code || '-'}</td>
              <td className="py-3 px-4 text-sm text-[#4B5563]">{item.description || '-'}</td>
              <td className="py-3 px-4 text-sm text-[#4B5563] text-right">
                {item.weight.toFixed(2)}
              </td>
              <td className="py-3 px-4 text-sm text-[#4B5563] text-right">
                {formatCurrency(item.unitPrice)}
              </td>
              <td className="py-3 px-4 text-sm text-[#4B5563] text-right">
                {formatCurrency(item.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}; 