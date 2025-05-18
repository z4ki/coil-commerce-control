import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAppSettings } from '../context/AppSettingsContext';
import MainLayout from '../components/layout/MainLayout';
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
import { ArrowLeft, Download, Edit, Printer, Trash2, DollarSign, PenLine, Wallet } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';
import StatusBadge from '../components/ui/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import InvoiceForm from '../components/invoices/InvoiceForm';
import PaymentForm from '../components/invoices/PaymentForm';
import { toast } from 'sonner';
import { generateInvoicePDF } from '../utils/pdfService';

const InvoiceDetail = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const {
    getInvoiceById,
    deleteInvoice,
    getClientById,
    getSaleById,
    updateInvoice,
    getPaymentsByInvoice,
    getInvoiceRemainingAmount,
    deletePayment,
  } = useAppContext();

  const { settings } = useAppSettings();

  const invoice = getInvoiceById(invoiceId || '');
  const client = invoice ? getClientById(invoice.clientId) : undefined;
  const isOverdue = invoice ? !invoice.isPaid && new Date() > invoice.dueDate : false;
  const payments = invoice ? getPaymentsByInvoice(invoice.id) : [];
  const remainingAmount = invoice ? getInvoiceRemainingAmount(invoice.id) : 0;
  const totalPaid = invoice ? invoice.totalAmount - remainingAmount : 0;
  const sales = invoice ? invoice.salesIds.map(id => getSaleById(id)).filter(Boolean) : [];
  
  const handleDeleteInvoice = () => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoice(invoiceId || '');
      toast.success('Invoice has been deleted');
      navigate('/invoices');
    }
  };

  const handleTogglePaid = () => {
    if (!invoice) return;
    
    updateInvoice(invoice.id, { 
      isPaid: !invoice.isPaid,
      paidAt: !invoice.isPaid ? new Date() : undefined
    });
    
    toast.success(invoice.isPaid 
      ? 'Invoice marked as unpaid' 
      : 'Invoice marked as paid'
    );
  };
  
  const handleDeletePayment = (paymentId: string) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      deletePayment(paymentId);
      toast.success('Payment has been deleted');
    }
  };
  
  const handleEditPayment = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setShowPaymentDialog(true);
  };

  const handlePrintInvoice = () => {
    if (!invoice || !client) return;
    
    setIsGeneratingPDF(true);
    
    setTimeout(async () => {
      try {
        const doc = await generateInvoicePDF(invoice, client, sales, payments, settings.company);
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Error generating PDF. Please try again.');
      } finally {
        setIsGeneratingPDF(false);
      }
    }, 100);
  };
  
  const handleDownloadPDF = () => {
    if (!invoice || !client) return;
    
    setIsGeneratingPDF(true);
    
    setTimeout(async () => {
      try {
        const doc = await generateInvoicePDF(invoice, client, sales, payments, settings.company);
        doc.save(`Facture_${invoice.invoiceNumber}.pdf`);
        toast.success('Invoice PDF downloaded successfully');
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Error generating PDF. Please try again.');
      } finally {
        setIsGeneratingPDF(false);
      }
    }, 100);
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
  
  if (!invoice || !client) {
    return (
      <MainLayout title="Invoice Not Found">
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <h2 className="text-2xl font-semibold">Invoice not found</h2>
          <p className="text-muted-foreground">The invoice you're looking for doesn't exist or has been deleted.</p>
          <Link to="/invoices">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Invoices
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Invoice Details">
      <div className="space-y-6">
        {/* Back button and actions */}
        <div className="flex justify-between items-center">
          <Link to="/invoices">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Invoices
            </Button>
          </Link>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowPaymentDialog(true)}>
              <Wallet className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
            <Button variant="outline" onClick={handleTogglePaid}>
              Mark as {invoice?.isPaid ? 'Unpaid' : 'Paid'}
            </Button>
            <Button variant="outline" onClick={() => setShowEditDialog(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDeleteInvoice}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Invoice Card */}
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-xl">Invoice #{invoice?.invoiceNumber}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Status: <StatusBadge 
                  status={invoice?.isPaid ? 'paid' : isOverdue ? 'overdue' : 'unpaid'} 
                  className="ml-1"
                />
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Issue Date</p>
              <p className="font-medium">{invoice && formatDate(invoice.date)}</p>
              <p className="text-sm text-muted-foreground mt-2">Due Date</p>
              <p className={`font-medium ${isOverdue ? 'text-destructive' : ''}`}>
                {invoice && formatDate(invoice.dueDate)}
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Client and Company Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Billed To:</h3>
                <p className="font-medium">{client?.name}</p>
                <p>{client?.company}</p>
                <p className="text-sm text-muted-foreground mt-1">{client?.email}</p>
                <p className="text-sm text-muted-foreground">{client?.phone}</p>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{client?.address}</p>
                {client?.nif && <p className="text-sm text-muted-foreground">NIF: {client.nif}</p>}
                {client?.nis && <p className="text-sm text-muted-foreground">NIS: {client.nis}</p>}
                {client?.rc && <p className="text-sm text-muted-foreground">RC: {client.rc}</p>}
                {client?.ai && <p className="text-sm text-muted-foreground">AI: {client.ai}</p>}
              </div>
              
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">From:</h3>
                <p className="font-medium">{settings.company.name}</p>
                <p>{settings.company.address}</p>
                <p className="text-sm text-muted-foreground mt-1">{settings.company.email}</p>
                <p className="text-sm text-muted-foreground">{settings.company.phone}</p>
                <p className="text-sm text-muted-foreground mt-1">NIF: {settings.company.taxId}</p>
                <p className="text-sm text-muted-foreground">NIS: {settings.company.nis}</p>
                <p className="text-sm text-muted-foreground">RC: {settings.company.rc}</p>
                <p className="text-sm text-muted-foreground">AI: {settings.company.ai}</p>
              </div>
            </div>
            
            {/* Sales Table */}
            <div>
              <h3 className="font-medium mb-3">Invoice Items</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{formatDate(sale.date)}</TableCell>
                        <TableCell>PPGI Coil Sale</TableCell>
                        <TableCell>{sale.items.length} items</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(sale.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {/* Payments Table */}
            <div>
              <h3 className="font-medium mb-3">Payment History</h3>
              {payments.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.date)}</TableCell>
                          <TableCell>{getPaymentMethodLabel(payment.method)}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {payment.notes || '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditPayment(payment.id)}
                              >
                                <PenLine className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePayment(payment.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No payments recorded yet.
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="flex flex-col items-end space-y-2 border-t pt-4">
              <div className="flex justify-between w-full max-w-xs">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(invoice?.totalAmount || 0)}</span>
              </div>
              <div className="flex justify-between w-full max-w-xs">
                <span className="text-muted-foreground">Tax (19%):</span>
                <span className="font-medium">{formatCurrency((invoice?.totalAmount || 0) * 0.19)}</span>
              </div>
              <div className="flex justify-between w-full max-w-xs pt-2 border-t">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-lg">{formatCurrency((invoice?.totalAmount || 0) * 1.19)}</span>
              </div>
              
              <div className="flex justify-between w-full max-w-xs mt-4">
                <span className="text-green-600">Paid:</span>
                <span className="font-medium text-green-600">{formatCurrency(totalPaid)}</span>
              </div>
              
              {remainingAmount > 0 && (
                <div className="flex justify-between w-full max-w-xs">
                  <span className={isOverdue ? 'text-red-600' : ''}>
                    Remaining:
                  </span>
                  <span className={`font-bold ${isOverdue ? 'text-red-600' : ''}`}>
                    {formatCurrency(remainingAmount)}
                  </span>
                </div>
              )}
              
              {invoice?.isPaid && (
                <div className="flex justify-between w-full max-w-xs text-green-600 mt-2 pt-3 border-t">
                  <span>Payment Completed:</span>
                  <span>{invoice.paidAt ? formatDate(invoice.paidAt) : 'Paid'}</span>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between bg-muted/50 rounded-b-lg">
            <p className="text-sm text-muted-foreground">
              Thank you for your business!
            </p>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handlePrintInvoice}
                disabled={isGeneratingPDF}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Edit Invoice Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>
          <InvoiceForm 
            invoice={invoice} 
            onSuccess={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Add/Edit Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedPaymentId ? 'Edit Payment' : 'Record Payment'}
            </DialogTitle>
          </DialogHeader>
          <PaymentForm 
            invoiceId={invoice?.id || ''}
            remainingAmount={remainingAmount}
            payment={selectedPaymentId ? 
              payments.find(p => p.id === selectedPaymentId) : 
              undefined}
            onSuccess={() => {
              setShowPaymentDialog(false);
              setSelectedPaymentId(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default InvoiceDetail;
