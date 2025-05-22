import React from 'react';

interface CompanyInfoProps {
  name: string;
  rc: string;
  ai: string;
  nif: string;
  nis: string;
  address: string;
}

export const CompanyInfo: React.FC<CompanyInfoProps> = ({
  name,
  rc,
  ai,
  nif,
  nis,
  address,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-base font-semibold text-[#1A1C21]">{name}</h3>
      <div className="text-sm text-[#4B5563] space-y-1">
        <p>RC: {rc}</p>
        <p>AI: {ai}</p>
        <p>NIF: {nif}</p>
        <p>NIS: {nis}</p>
        <p className="whitespace-pre-wrap">{address}</p>
      </div>
    </div>
  );
}; 