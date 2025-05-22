import React, { useState } from 'react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF, InvoicePDFProps } from './InvoicePDF';
import { Button } from '@/components/ui/button';

interface PDFRendererProps {
  invoiceData: InvoicePDFProps;
}

export const PDFRenderer: React.FC<PDFRendererProps> = ({ invoiceData }) => {
  const [isClient, setIsClient] = useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle server-side rendering
  if (!isClient) {
    return <div>Loading PDF viewer...</div>;
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4">
        <PDFDownloadLink 
          document={<InvoicePDF {...invoiceData} />} 
          fileName={`invoice-${invoiceData.invoiceNumber}.pdf`}
        >
          {({ loading }) => (
            <Button disabled={loading}>
              {loading ? 'Loading document...' : 'Download PDF'}
            </Button>
          )}
        </PDFDownloadLink>
      </div>
      
      <div className="border border-gray-300 w-full max-w-[800px] h-[842px]">
        <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
          <InvoicePDF {...invoiceData} />
        </PDFViewer>
      </div>
    </div>
  );
}; 