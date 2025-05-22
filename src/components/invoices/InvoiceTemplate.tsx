import React from 'react';
import { Client, Invoice, Sale, Payment, CompanySettings } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { numberToWords } from '@/utils/numberToWords';
import { InvoiceHeader } from './InvoiceHeader';
import { InvoiceDate } from './InvoiceDate';
import { CompanyInfo } from './CompanyInfo';
import { InvoiceItems } from './InvoiceItems';
import { InvoiceSummary } from './InvoiceSummary';
import { InvoiceFooter } from './InvoiceFooter';

interface InvoiceTemplateProps {
  invoice: Invoice;
  client: Client;
  sales: Sale[];
  payments: Payment[];
  companySettings?: CompanySettings;
  isPdfMode?: boolean;
}

const defaultCompanySettings: CompanySettings = {
  name: '',
  address: '',
  phone: '',
  email: '',
  nif: '',
  nis: '',
  rc: '',
  ai: ''
};

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  invoice,
  client,
  sales,
  payments = [],
  companySettings = defaultCompanySettings,
  isPdfMode = false
}) => {
  if (!invoice || !client || !sales || !Array.isArray(sales)) {
    console.error('Required props missing in InvoiceTemplate:', { invoice, client, sales });
    return null;
  }

  const totalHT = sales.reduce((sum, sale) => sum + (sale?.totalAmountHT || 0), 0);
  const taxAmount = totalHT * 0.19;
  const totalTTC = totalHT + taxAmount;
  const totalPaid = payments?.reduce((sum, payment) => sum + (payment?.amount || 0), 0) ?? 0;
  const remainingAmount = totalTTC - totalPaid;

  const items = sales.flatMap(sale =>
    (sale?.items || []).map(item => ({
      code: item?.coilRef || '-',
      description: item ? `BOBINES D'ACIER PRELAQUE ${item.coilThickness || ''}*${item.coilWidth || ''} RAL ${item.topCoatRAL || ''}` : '-',
      weight: item?.quantity || 0,
      unitPrice: item?.pricePerTon || 0,
      total: item?.totalAmountHT || 0
    }))
  );

  if (invoice.transportationFee && invoice.transportationFee > 0) {
    items.push({
      code: '-',
      description: 'Transport',
      weight: 1,
      unitPrice: invoice.transportationFee,
      total: invoice.transportationFee
    });
  }

  const safeCompanySettings = {
    ...defaultCompanySettings,
    ...companySettings
  };

  const safeClient = {
    name: client.name || '',
    rc: client.rc || '-',
    ai: client.ai || '-',
    nif: client.nif || '-',
    nis: client.nis || '-',
    address: client.address || ''
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div className={`w-[595px] min-h-[842px] border relative bg-white px-10 py-8 rounded-sm border-solid border-[rgba(0,0,0,0.10)] ${isPdfMode ? '' : 'max-md:w-full max-md:p-5 max-sm:p-[15px]'}`}>
        <InvoiceHeader 
          invoiceNumber={invoice.invoiceNumber || ''}
          logo={safeCompanySettings.logo}
        />
        
        <InvoiceDate 
          date={formatDate(invoice.date)}
          paymentMethod={invoice.paymentMethod || '-'}
          paymentTerms={formatDate(invoice.dueDate)}
        />
        
        <div className="flex justify-between mb-10 px-0 py-5 border-y-[0.5px] border-y-[#D7DAE0] border-solid max-md:flex-col max-md:gap-5">
          <div className="w-[45%] max-md:w-full">
            <CompanyInfo 
              name={safeCompanySettings.name}
              rc={safeCompanySettings.rc}
              ai={safeCompanySettings.ai}
              nif={safeCompanySettings.nif}
              nis={safeCompanySettings.nis}
              address={safeCompanySettings.address}
            />
          </div>
          <div className="w-[45%] max-md:w-full">
            <CompanyInfo 
              name={safeClient.name}
              rc={safeClient.rc}
              ai={safeClient.ai}
              nif={safeClient.nif}
              nis={safeClient.nis}
              address={safeClient.address}
            />
          </div>
        </div>
        
        <InvoiceItems items={items} />
        
        <InvoiceSummary 
          totalHT={totalHT}
          tax={taxAmount}
          total={totalTTC}
          totalTTC={totalTTC}
        />
        
        <div className="text-[#1A1C21] text-[10px] font-normal leading-[14px] mb-5 px-0 py-2.5 border-b-[0.5px] border-b-[#D7DAE0] border-solid">
          Arrêtée la présente facture à la somme de : {numberToWords(totalTTC)} Dinars Algériens
        </div>
        
        <InvoiceFooter 
          companyName={safeCompanySettings.name}
          phone={safeCompanySettings.phone}
          email={safeCompanySettings.email}
          slogan="Merci pour votre confiance"
        />
      </div>
    </>
  );
};

export default InvoiceTemplate; 



// import React from "react";
// import { InvoiceHeader } from "./InvoiceHeader";
// import { InvoiceDate } from "./InvoiceDate";
// import { CompanyInfo } from "./CompanyInfo";
// import { InvoiceItems } from "./InvoiceItems";
// import { InvoiceSummary } from "./InvoiceSummary";
// import { InvoiceFooter } from "./InvoiceFooter";

// export interface InvoiceTemplateProps {
//   invoiceNumber: string;
//   date: string;
//   paymentMethod: string;
//   paymentTerms: string;
//   companyInfo: {
//     name: string;
//     rc: string;
//     ai: string;
//     nif: string;
//     nis: string;
//     address: string;
//   };
//   clientInfo: {
//     name: string;
//     rc: string;
//     ai: string;
//     nif: string;
//     nis: string;
//     address: string;
//   };
//   items: Array<{
//     description: string;
//     code: string;
//     weight: number;
//     unitPrice: number;
//     total: number;
//   }>;
//   totalHT: number;
//   tax: number;
//   total: number;
//   totalTTC: number;
//   totalInWords: string;
//   contactInfo: {
//     phone: string;
//     email: string;
//     companyName: string;
//   };
//   slogan: string;
// }

// export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
//   invoiceNumber,
//   date,
//   paymentMethod,
//   paymentTerms,
//   companyInfo,
//   clientInfo,
//   items,
//   totalHT,
//   tax,
//   total,
//   totalTTC,
//   totalInWords,
//   contactInfo,
//   slogan,
// }) => {
//   return (
//     <>
//       <link
//         href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
//         rel="stylesheet"
//       />
//       <div className="w-[595px] min-h-[842px] border relative bg-white px-10 py-8 rounded-sm border-solid border-[rgba(0,0,0,0.10)] max-md:w-full max-md:p-5 max-sm:p-[15px]">
//         <InvoiceHeader invoiceNumber={invoiceNumber} />
        
//         <InvoiceDate 
//           date={date} 
//           paymentMethod={paymentMethod} 
//           paymentTerms={paymentTerms} 
//         />
        
//         <div className="flex justify-between mb-10 px-0 py-5 border-y-[0.5px] border-y-[#D7DAE0] border-solid max-md:flex-col max-md:gap-5">
//           <div className="w-[45%] max-md:w-full">
//             <CompanyInfo 
//               name={companyInfo.name}
//               rc={companyInfo.rc}
//               ai={companyInfo.ai}
//               nif={companyInfo.nif}
//               nis={companyInfo.nis}
//               address={companyInfo.address}
//             />
//           </div>
//           <div className="w-[45%] max-md:w-full">
//             <CompanyInfo 
//               name={clientInfo.name}
//               rc={clientInfo.rc}
//               ai={clientInfo.ai}
//               nif={clientInfo.nif}
//               nis={clientInfo.nis}
//               address={clientInfo.address}
//             />
//           </div>
//         </div>
        
//         <InvoiceItems items={items} />
        
//         <InvoiceSummary 
//           totalHT={totalHT}
//           tax={tax}
//           total={total}
//           totalTTC={totalTTC}
//         />
        
//         <div className="text-[#1A1C21] text-[10px] font-normal leading-[14px] mb-5 px-0 py-2.5 border-b-[0.5px] border-b-[#D7DAE0] border-solid">
//           {totalInWords}
//         </div>
        
//         <InvoiceFooter 
//           companyName={contactInfo.companyName}
//           phone={contactInfo.phone}
//           email={contactInfo.email}
//           slogan={slogan}
//         />
//       </div>
//     </>
//   );
// };
