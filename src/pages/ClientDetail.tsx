import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ArrowLeft, Edit, Trash2, Mail, Phone } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/format';
import StatusBadge from '@/components/ui/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ClientForm from '@/components/clients/ClientForm';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { Invoice, Sale } from '@/types';

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = React.useState(false);
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

  // Only fetch related data if we have a client
  const clientSales = client ? getSalesByClient(client.id).sort((a, b) => b.date.getTime() - a.date.getTime()) : [];
  const clientInvoices = client ? getInvoicesByClient(client.id).sort((a, b) => b.date.getTime() - a.date.getTime()) : [];
  const creditBalance = client ? getClientCreditBalance(client.id) : 0;
  
  // Loading state for financial data
  const isLoading = loadingClients || loadingSales || loadingPayments;

  console.log('Debug state:', { 
    loadingClients, 
    loadingSales, 
    loadingPayments, 
    id,
    hasClient: !!client,
    salesCount: clientSales.length
  });

  // Get all payments for all client sales
  const clientPayments = useMemo(() => {
    return clientSales.flatMap(sale => 
      getPaymentsBySale(sale.id).map(payment => ({
        ...payment,
        sale
      }))
    ).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [clientSales, getPaymentsBySale]);

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
    // Sum up all payments
    const paymentsSum = clientPayments.reduce((total, payment) => total + payment.amount, 0);
    // Apply credit balance if any (don't include it in total paid amount)
    return paymentsSum;
  }, [clientPayments]);

  const clientDebt = useMemo(() => {
    // Calculate total debt from unpaid invoices
    const unpaidTotal = clientInvoices
      .filter(invoice => !invoice.isPaid)
      .reduce((total, invoice) => total + invoice.totalAmountTTC, 0);
    
    // Add uninvoiced amount to debt
    const totalDebt = unpaidTotal + totalUninvoicedAmount;
    
    // Subtract credit balance if any
    const finalDebt = Math.max(0, totalDebt - creditBalance);
    
    return finalDebt;
  }, [clientInvoices, totalUninvoicedAmount, creditBalance]);

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

  console.log('ClientDetail debug:', {
    loadingClients,
    client,
    clientSales,
    isLoading,
  });

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
              <CardHeader>
                <CardTitle>{t('payments.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('payments.date')}</TableHead>
                        <TableHead>{t('sales.title')}</TableHead>
                        <TableHead>{t('payments.method')}</TableHead>
                        <TableHead className="text-right">{t('payments.amount')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientPayments.length > 0 ? (
                        clientPayments.map((payment) => {
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
                                      {sale.items.length} {t('general.items')} - {formatCurrency(sale.totalAmountTTC)}
                                    </div>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>{t(`payments.methods.${payment.method}`)}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(payment.amount)}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            {t('general.noData')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
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