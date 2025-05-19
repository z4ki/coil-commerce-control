import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import MainLayout from '../components/layout/MainLayout';
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
import { formatCurrency, formatDate } from '../utils/format';
import StatusBadge from '../components/ui/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ClientForm from '../components/clients/ClientForm';
import { toast } from 'sonner';
import { Invoice, Sale } from '../types';

const ClientDetail = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  
  const {
    getClientById,
    deleteClient,
    getSalesByClient,
    getInvoicesByClient,
    getClientDebt,
    getPaymentsByInvoice,
    getClientCreditBalance,
  } = useAppContext();

  const client = getClientById(clientId || '');
  const clientSales = getSalesByClient(clientId || '');
  const clientInvoices = getInvoicesByClient(clientId || '');
  const creditBalance = getClientCreditBalance(clientId || '');

  // Get all payments for all client invoices
  const clientPayments = useMemo(() => {
    return clientInvoices.flatMap(invoice => 
      getPaymentsByInvoice(invoice.id).map(payment => ({
        ...payment,
        invoice
      }))
    ).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [clientInvoices, getPaymentsByInvoice]);

  const totalSalesAmount = useMemo(() => 
    clientSales.reduce((total, sale) => total + sale.totalAmountTTC, 0),
    [clientSales]
  );

  const totalInvoicedAmount = useMemo(() => 
    clientSales.filter(sale => sale.isInvoiced)
      .reduce((total, sale) => total + sale.totalAmountTTC, 0),
    [clientSales]
  );

  const totalUninvoicedAmount = useMemo(() => 
    clientSales.filter(sale => !sale.isInvoiced)
      .reduce((total, sale) => total + sale.totalAmountTTC, 0),
    [clientSales]
  );

  const totalPaidAmount = useMemo(() => 
    clientPayments.reduce((total, payment) => total + payment.amount, 0),
    [clientPayments]
  );

  const clientDebt = useMemo(() => 
    Math.max(0, totalSalesAmount - totalPaidAmount),
    [totalSalesAmount, totalPaidAmount]
  );

  const getInvoiceStatus = (invoice: Invoice): 'paid' | 'unpaid' | 'overdue' | 'invoiced' | 'notInvoiced' => {
    if (invoice.isPaid) return 'paid';
    if (new Date(invoice.dueDate) < new Date()) return 'overdue';
    return 'unpaid';
  };

  const getSaleStatus = (sale: Sale): 'invoiced' | 'notInvoiced' => {
    return sale.isInvoiced ? 'invoiced' : 'notInvoiced';
  };

  const handleDeleteClient = () => {
    if (window.confirm(`Are you sure you want to delete ${client?.name}?`)) {
      deleteClient(clientId || '');
      toast.success(`${client?.name} has been deleted`);
      navigate('/clients');
    }
  };

  if (!client) {
    return (
      <MainLayout title="Client Not Found">
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <h2 className="text-2xl font-semibold">Client not found</h2>
          <p className="text-muted-foreground">The client you're looking for doesn't exist or has been deleted.</p>
          <Link to="/clients">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Clients
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={client.name}
      headerAction={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/clients')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDeleteClient}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Client Info */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Sales:</span>
                  <span className="font-medium">{formatCurrency(totalSalesAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Invoiced Sales:</span>
                  <span className="font-medium">{formatCurrency(totalInvoicedAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Uninvoiced Sales:</span>
                  <span className="font-medium">{formatCurrency(totalUninvoicedAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Paid:</span>
                  <span className="font-medium text-green-600">{formatCurrency(totalPaidAmount)}</span>
                </div>
                {creditBalance > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-600">Credit Balance:</span>
                    <span className="font-medium text-blue-600">{formatCurrency(creditBalance)}</span>
                  </div>
                )}
                <div className="pt-2 mt-2 border-t flex justify-between items-center">
                  <span className="text-sm font-medium">Outstanding Debt:</span>
                  <span className={`font-bold ${clientDebt > 0 ? 'text-destructive' : ''}`}>
                    {formatCurrency(clientDebt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Sales, Invoices, and Payments */}
        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <CardTitle>Sales History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientSales.length > 0 ? (
                        clientSales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell>{formatDate(sale.date)}</TableCell>
                            <TableCell>{sale.items.length} items</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(sale.totalAmountTTC)}
                            </TableCell>
                            <TableCell>
                              <StatusBadge 
                                status={getSaleStatus(sale)} 
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            No sales recorded for this client.
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
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientPayments.length > 0 ? (
                        clientPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{formatDate(payment.date)}</TableCell>
                            <TableCell>
                              <Link 
                                to={`/invoices/${payment.invoice.id}`}
                                className="text-primary hover:underline"
                              >
                                {payment.invoice.invoiceNumber}
                              </Link>
                            </TableCell>
                            <TableCell>{payment.method}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            No payments recorded for this client.
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