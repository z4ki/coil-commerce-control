import React, { useMemo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import MainLayout from '@/components/layout/MainLayout';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusBadge from '@/components/ui/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ClientForm from '@/components/clients/ClientForm';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Invoice, Sale } from '@/types/index';
import { getDeletedPayments, restorePayment } from '@/services/paymentService';

const ClientDetail = () => {
  // ========== ALL HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL LOGIC ==========
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPaymentsArchive, setShowPaymentsArchive] = useState(false);
  const [deletedPayments, setDeletedPayments] = useState<any[]>([]);
  const { t } = useLanguage();
  const {
    getClientById,
    deleteClient,
    getSalesByClient,
    getInvoicesByClient,
    getClientDebt,
    getPaymentsBySale,
    getClientCreditBalance,
    getSaleById,
    loading: { clients: loadingClients, sales: loadingSales, payments: loadingPayments }
  } = useAppContext();

  // Get client data
  const client = id ? getClientById(id) : undefined;

  // Only fetch related data if we have a client
  const clientSales = client ? getSalesByClient(client.id).sort((a, b) => b.date.getTime() - a.date.getTime()) : [];
  const clientInvoices = client ? getInvoicesByClient(client.id).sort((a, b) => b.date.getTime() - a.date.getTime()) : [];
  const creditBalance = client ? getClientCreditBalance(client.id) : 0;
  
  // Loading state for financial data
  const isLoading = loadingClients || loadingSales || loadingPayments;

  // ALL useMemo hooks
  const clientPayments = useMemo(() => {
    if (!client) return [];
    
    const allPayments: any[] = [];
    for (const sale of clientSales) {
      const payments = getPaymentsBySale(sale.id);
      allPayments.push(...payments.map((payment: any) => ({ ...payment, sale })));
    }
    return allPayments.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [client, clientSales]); // Removed getPaymentsBySale from deps

  const totalSalesAmount = useMemo(() => 
    clientSales.reduce((total, sale) => total + sale.totalAmountTTC, 0),
    [clientSales]
  );

  const totalInvoicedAmount = useMemo(() => 
    clientInvoices.reduce((total, invoice) => total + invoice.totalAmountTTC, 0),
    [clientInvoices]
  );

  const totalUninvoicedAmount = useMemo(() => 
    totalSalesAmount - totalInvoicedAmount,
    [totalSalesAmount, totalInvoicedAmount]
  );

  const totalPaidAmount = useMemo(() => {
    const paymentsSum = clientPayments.reduce((total, payment) => total + payment.amount, 0);
    return paymentsSum;
  }, [clientPayments]);

  const clientDebt = useMemo(() => {
    console.log(`[ClientDetail] Calculating clientDebt: totalSalesAmount = ${totalSalesAmount}, totalPaidAmount = ${totalPaidAmount}`);
    const debt = Math.max(0, totalSalesAmount - totalPaidAmount);
    console.log(`[ClientDetail] Calculated clientDebt = ${debt}`);
    return debt;
  }, [totalSalesAmount, totalPaidAmount]);

  // ALL useEffect hooks
  useEffect(() => {
    if (showPaymentsArchive && client) {
      getDeletedPayments().then((all: any[]) => {
        setDeletedPayments(all.filter((p: any) => p.clientId === client.id));
      });
    }
  }, [showPaymentsArchive, client]);

  // ========== CONDITIONAL LOGIC AND EARLY RETURNS - AFTER ALL HOOKS ==========
  
  // Debug logging
  console.log('Debug state:', { 
    loadingClients, 
    loadingSales, 
    loadingPayments, 
    id,
    hasClient: !!client,
    clientIdType: typeof id,
    clientObj: client
  });

  console.log('Debug state:', { 
    loadingClients, 
    loadingSales, 
    loadingPayments, 
    id,
    hasClient: !!client,
    salesCount: clientSales.length
  });

  console.log('ClientDetail debug:', {
    loadingClients,
    client,
    clientSales,
    isLoading,
  });

  // ========== HELPER FUNCTIONS ==========
  const getInvoiceStatus = (invoice: Invoice): 'paid' | 'unpaid' | 'overdue' | 'invoiced' | 'notInvoiced' => {
    if (invoice.isPaid) return 'paid';
    if (new Date(invoice.dueDate) < new Date()) return 'overdue';
    return 'unpaid';
  };

  const getSaleStatus = (sale: Sale): 'invoiced' | 'notInvoiced' => {
    return sale.isInvoiced ? 'invoiced' : 'notInvoiced';
  };

  const handleDeleteClient = () => {
    if (window.confirm(t('clients.deleteConfirm').replace('{0}', client?.name || ''))) {
      deleteClient(id || '');
      toast.success(t('clients.deleted').replace('{0}', client?.name || ''));
      navigate('/clients');
    }
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  // ========== RENDER LOGIC WITH CONDITIONAL RETURNS ==========
  // Show loading state for the entire view if client data is loading
  if (loadingClients) {
    console.log('ClientDetail: stuck in loading state');
    return (
      <MainLayout title={t('general.loading')}>
        <LoadingSpinner />
      </MainLayout>
    );
  }

  // Show not found state if client doesn't exist
  if (!client) {
    console.log('ClientDetail: client not found');
    return (
      <MainLayout title={t('general.error')}>
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <h2 className="text-2xl font-semibold">{t('general.error')}</h2>
          <p className="text-muted-foreground">{t('clients.notFound')}</p>
          <Link to="/clients">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('general.back')}
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  // ========== MAIN RENDER ==========
  return (
    <MainLayout
      title={client.name}
      headerAction={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/clients')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('general.back')}
          </Button>
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Edit className="mr-2 h-4 w-4" />
            {t('general.edit')}
          </Button>
          <Button variant="destructive" onClick={handleDeleteClient}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('general.delete')}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Client Info */}
        <div className="grid gap-4 grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>{t('clientDetails.financialSummary')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('clientDetails.salesTotal')}:</span>
                    <span className="font-medium">{formatCurrency(totalSalesAmount)}</span>
                  </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('clientDetails.invoicedAmount')}:</span>
                  <span className="font-medium">{formatCurrency(totalInvoicedAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('clientDetails.uninvoicedAmount')}:</span>
                  <span className="font-medium">{formatCurrency(totalUninvoicedAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('clientDetails.paidAmount')}:</span>
                  <span className="font-medium text-green-600">{formatCurrency(totalPaidAmount)}</span>
                </div>
                {creditBalance > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-600">{t('clientDetails.creditBalance')}:</span>
                    <span className="font-medium text-blue-600">{formatCurrency(creditBalance)}</span>
                  </div>
                )}
                <div className="pt-2 mt-2 border-t flex justify-between items-center">
                  <span className="text-sm font-medium">{t('clientDetails.outstandingDebt')}:</span>
                  <span className={`font-bold ${clientDebt > 0 ? 'text-destructive' : ''}`}>
                    {formatCurrency(clientDebt)}
                  </span>
                </div>
              </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Sales, Invoices, and Payments */}
        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sales">{t('sales.title')}</TabsTrigger>
            <TabsTrigger value="invoices">{t('invoices.title')}</TabsTrigger>
            <TabsTrigger value="payments">{t('form.payment.title')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <CardTitle>{t('sales.history')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('sales.date')}</TableHead>
                        <TableHead>{t('sales.items')}</TableHead>
                        <TableHead className="text-right">{t('sales.total')}</TableHead>
                        <TableHead>{t('sales.status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientSales.length > 0 ? (
                        clientSales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell>{formatDate(sale.date)}</TableCell>
                            <TableCell>{sale.items.length} {t('general.items')}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(sale.totalAmountTTC)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <StatusBadge status={getSaleStatus(sale)} />
                                {sale.isInvoiced && sale.invoiceId && (
                                  <Link 
                                    to={`/invoices/${sale.invoiceId}`}
                                    className="text-primary hover:underline hover:text-primary/80"
                                  >
                                    {t('sales.viewInvoice')}
                                  </Link>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            {t('sales.noSales')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Invoice History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientInvoices.length > 0 ? (
                        clientInvoices.map((invoice) => {
                          const isOverdue = !invoice.isPaid && new Date() > invoice.dueDate;
                          return (
                            <TableRow key={invoice.id}>
                              <TableCell>
                                <Link 
                                  to={`/invoices/${invoice.id}`}
                                  className="text-primary hover:underline"
                                >
                                  {invoice.invoiceNumber}
                                </Link>
                              </TableCell>
                              <TableCell>{formatDate(invoice.date)}</TableCell>
                              <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(invoice.totalAmountTTC)}
                              </TableCell>
                              <TableCell>
                                <StatusBadge 
                                  status={getInvoiceStatus(invoice)} 
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No invoices for this client.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('payments.title')}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setShowPaymentsArchive((v) => !v)}>
                  {showPaymentsArchive ? t('payments.showActive') || 'Show Active Payments' : t('payments.showDeleted') || 'Show Deleted Payments'}
                </Button>
              </CardHeader>
              <CardContent>
                {showPaymentsArchive ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('payments.date')}</TableHead>
                          <TableHead>{t('sales.title')}</TableHead>
                          <TableHead>{t('payments.method')}</TableHead>
                          <TableHead>{t('payments.notes')}</TableHead>
                          <TableHead>{t('payments.checkNumber') || 'Check Number'}</TableHead>
                          <TableHead className="text-right">{t('payments.amount')}</TableHead>
                          <TableHead>{t('general.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deletedPayments.length > 0 ? (
                          deletedPayments.map((payment) => {
                            const sale = payment.sale;
                            return (
                              <TableRow key={payment.id}>
                                <TableCell>{formatDate(payment.date)}</TableCell>
                                <TableCell>
                                  {sale && (
                                    <div>
                                      <div className="font-medium">
                                        {formatDate(sale.date)}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {sale.items.length} {t('general.items')} - {formatCurrency(sale.totalAmountTTC) }
                                      </div>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>{t(`payments.methods.${payment.method}`)}</TableCell>
                                <TableCell>{payment.notes}</TableCell>
                                <TableCell>
                                  {payment.method === 'check' ? payment.checkNumber : 'N/A'}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(payment.amount)}
                                </TableCell>
                                <TableCell>
                                  <Button size="sm" onClick={async () => {
                                    await restorePayment(payment.id);
                                    toast.success(t('payments.restored') || 'Payment restored');
                                    setDeletedPayments((prev) => prev.filter((p) => p.id !== payment.id));
                                  }}>{t('general.restore') || 'Restore'}</Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                              {t('general.noData')}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('payments.date')}</TableHead>
                          <TableHead>{t('sales.title')}</TableHead>
                          <TableHead>{t('payments.method')}</TableHead>
                          <TableHead>{t('payments.notes')}</TableHead>
                          <TableHead>{t('payments.checkNumber') || 'Check Number'}</TableHead>
                          <TableHead className="text-right">{t('payments.amount')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientPayments.length > 0 ? (
                          clientPayments.map((payment: any) => (
                            <TableRow key={payment.id}>
                              <TableCell>{formatDate(payment.date)}</TableCell>
                              <TableCell>
                                <Link to={`/sales/${payment.saleId}`} className="text-primary hover:underline">
                                  {payment.sale?.id?.substring(0, 8) || payment.saleId?.substring(0, 8)}...
                                </Link>
                              </TableCell>
                              <TableCell>{t(`payments.methods.${payment.method}`) || payment.method}</TableCell>
                              <TableCell>{payment.notes || '—'}</TableCell>
                              <TableCell>{payment.method === 'check' && payment.checkNumber ? payment.checkNumber : '—'}</TableCell>
                              <TableCell className="text-right font-bold">
                                {formatCurrency(payment.amount)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              {t('general.noData')}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Client Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <ClientForm 
            client={client} 
            onSuccess={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ClientDetail;