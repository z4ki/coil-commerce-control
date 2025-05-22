import React from 'react';

interface InvoiceFooterProps {
  companyName: string;
  phone: string;
  email: string;
  slogan: string;
}

export const InvoiceFooter: React.FC<InvoiceFooterProps> = ({
  companyName,
  phone,
  email,
  slogan,
}) => {
  return (
    <div className="text-center space-y-2 text-[#4B5563] text-sm">
      <p className="font-semibold">{companyName}</p>
      <div className="flex justify-center gap-4">
        <p>Tel: {phone}</p>
        <p>Email: {email}</p>
      </div>
      <p className="text-xs italic">{slogan}</p>
    </div>
  );
}; 