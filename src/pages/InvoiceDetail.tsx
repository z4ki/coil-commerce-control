import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useLanguage } from '@/context/LanguageContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Download, Edit, Printer, Trash2, DollarSign, PenLine, Wallet, Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/format';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import { PaymentForm } from '@/components/invoices/PaymentForm';
import { toast } from 'sonner';
import { generateInvoicePDF } from '@/utils/pdfService.tsx';
import { Badge } from '@/components/ui/badge';

const InvoiceDetail = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  
  const {
    getInvoiceById,
    deleteInvoice,
    getClientById,
    getSaleById,
    updateInvoice,
    deletePayment,
    addPayment,
    getInvoicePaymentStatus,
    getSalePaymentStatus,
  } = useAppContext();

  const { settings } = useAppSettings();
  const { t } = useLanguage();

  const invoice = getInvoiceById(invoiceId || '');
  const client = invoice ? getClientById(invoice.clientId) : undefined;
  const isOverdue = invoice ? !invoice.isPaid && new Date() > invoice.dueDate : false;
  const paymentStatus = invoice ? getInvoicePaymentStatus(invoice.id) : null;
  const payments = paymentStatus?.payments || [];
  const totalPaid = paymentStatus?.totalPaid || 0;
  const remainingAmount = paymentStatus?.remainingAmount || 0;
  const sales = invoice ? invoice.salesIds.map(id => getSaleById(id)).filter(Boolean) : [];
  
  const handleDeleteInvoice = () => {
    if (!invoice) return;
    if (window.confirm(t('invoices.deleteConfirm'))) {
      deleteInvoice(invoice.id);
      toast.success(t('invoices.deleted'));
    }
  };

  const handleTogglePaid = async () => {
    if (!invoice) return;
    
    if (!invoice.isPaid) {
      // When marking as paid, create a payment record
      await addPayment(invoice.id, {
        date: new Date(),
        amount: invoice.totalAmountTTC,
        method: 'bank_transfer',
        notes: 'Payment marked as completed'
      });
    }
    
    updateInvoice(invoice.id, { 
      isPaid: !invoice.isPaid,
      paidAt: !invoice.isPaid ? new Date() : undefined
    });
    
    toast.success(invoice.isPaid 
      ? 'Invoice marked as unpaid' 
      : 'Invoice marked as paid'
    );
  };
  
  const handleDeletePayment = async (paymentId: string) => {
    if (window.confirm(t('payments.deleteConfirm'))) {
      await deletePayment(paymentId);
      toast.success(t('payments.deleted'));
    }
  };
  
  const handleEditPayment = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setShowPaymentDialog(true);
  };

  const handlePrintInvoice = async () => {
    if (!invoice || !client) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const pdfBlob = await generateInvoicePDF(invoice, client, sales, payments, settings.company);
      const url = URL.createObjectURL(pdfBlob);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 1000);
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('invoices.pdfError'));
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  const handleDownloadPDF = async () => {
    if (!invoice || !client) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const pdfBlob = await generateInvoicePDF(invoice, client, sales, payments, settings.company);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Facture_${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t('invoices.pdfGenerated'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('invoices.pdfError'));
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'bank_transfer': return 'Bank Transfer';
      case 'check': return 'Check';
      case 'credit_card': return 'Credit Card';
      default: return method;
    }
  };
  
  const handleCleanupDuplicates = async () => {
    if (invoice) {
      await cleanupDuplicatePayments(invoice.id);
      toast.success('Duplicate payments have been cleaned up');
    }
  };

  const handleAddPayment = (saleId: string) => {
    setSelectedSaleId(saleId);
    setShowPaymentDialog(true);
  };

  const handleGeneratePDF = async () => {
    if (!invoice || !client) return;
    setIsGeneratingPDF(true);
    try {
      await generateInvoicePDF(invoice, client);
      toast.success(t('invoices.pdfGenerated'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('invoices.pdfError'));
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  if (!invoice || !client) {
    return (
      <MainLayout title={t('invoices.notFound')}>
        <div className="text-center py-8">
          <p>{t('invoices.notFound')}</p>
        </div>
      </MainLayout>
    );
  }

  const taxAmount = invoice.totalAmountTTC - invoice.totalAmountHT;

  return (
    <MainLayout
      title={`${t('invoices.invoice')} ${invoice.invoiceNumber}`}
      headerAction={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Edit className="mr-2 h-4 w-4" />
            {t('common.edit')}
          </Button>
          <Button variant="destructive" onClick={handleDeleteInvoice}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('common.delete')}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('invoiceDetails.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold">{t('invoiceDetails.client')}</h3>
                <p>{client.name}</p>
                <p className="text-sm text-muted-foreground">{client.company}</p>
              </div>
              <div>
                <h3 className="font-semibold">{t('invoiceDetails.status')}</h3>
                <div className="flex items-center gap-2">
                  <StatusBadge status={invoice.isPaid ? 'paid' : isOverdue ? 'overdue' : 'unpaid'} />
                  {isOverdue && <p className="text-sm text-destructive">{t('invoices.overdue')}</p>}
                </div>
              </div>
              <div>
                <h3 className="font-semibold">{t('invoiceDetails.dates')}</h3>
                <p>{t('invoiceDetails.issuedOn')}: {formatDate(invoice.date)}</p>
                <p>{t('invoiceDetails.dueBy')}: {formatDate(invoice.dueDate)}</p>
              </div>
              <div>
                <h3 className="font-semibold">{t('invoiceDetails.amounts')}</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('invoiceDetails.subtotal')}:</span>
                    <span>{formatCurrency(invoice.totalAmountHT)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('invoiceDetails.tax')}:</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t">
                    <span className="font-medium">{t('invoiceDetails.total')}:</span>
                    <span className="font-bold">{formatCurrency(invoice.totalAmountTTC)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('invoiceDetails.amountPaid')}:</span>
                    <span>{formatCurrency(totalPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('invoiceDetails.remainingAmount')}:</span>
                    <span>{formatCurrency(remainingAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('invoiceDetails.sales')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('sales.date')}</TableHead>
                  <TableHead>{t('sales.items')}</TableHead>
                  <TableHead>{t('sales.totalAmount')}</TableHead>
                  <TableHead>{t('sales.amountPaid')}</TableHead>
                  <TableHead>{t('sales.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.salesIds.map(saleId => {
                  const sale = getSaleById(saleId);
                  if (!sale) return null;
                  const saleStatus = getSalePaymentStatus(saleId);
                  return (
                    <TableRow key={saleId}>
                      <TableCell>{formatDate(sale.date)}</TableCell>
                      <TableCell>{sale.items.length} {t('sales.items')}</TableCell>
                      <TableCell>{formatCurrency(sale.totalAmountTTC)}</TableCell>
                      <TableCell>
                        {formatCurrency(saleStatus?.totalPaid || 0)}
                        {saleStatus?.isFullyPaid && (
                          <Badge className="ml-2" variant="default">
                            {t('sales.paid')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddPayment(saleId)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {t('payments.add')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('invoiceDetails.payments')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('payments.date')}</TableHead>
                  <TableHead>{t('payments.amount')}</TableHead>
                  <TableHead>{t('payments.method')}</TableHead>
                  <TableHead>{t('payments.notes')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.date)}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{t(`payments.methods.${payment.method}`)}</TableCell>
                    <TableCell>{payment.notes}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePayment(payment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('invoices.edit')}</DialogTitle>
          </DialogHeader>
          <InvoiceForm 
            invoice={invoice} 
            onSuccess={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('payments.add')}</DialogTitle>
          </DialogHeader>
          {selectedSaleId && (
          <PaymentForm 
              saleId={selectedSaleId}
            onSuccess={() => {
              setShowPaymentDialog(false);
                setSelectedSaleId(null);
              }}
              onCancel={() => {
                setShowPaymentDialog(false);
                setSelectedSaleId(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default InvoiceDetail;
