import React, { useState, useEffect, memo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, Edit, Trash2, FileText, MoreVertical, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/format';
import StatusBadge from '@/components/ui/StatusBadge';
import { Invoice, Client } from '@/types/index';
import { toast } from 'sonner';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import { Link } from 'react-router-dom';
import { getDeletedInvoices, restoreInvoice } from '@/services/invoiceService';
import { useInfiniteInvoices } from '@/hooks/useInfiniteInvoices';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Sale } from '@/types/index';
import Spinner from '@/components/ui/Spinner';

type InvoiceTableRowProps = {
  invoice: Invoice;
  client: Client | undefined;
  paymentStatus: any;
  isOverdue: boolean;
  t: (key: string) => string;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onView: (invoice: Invoice) => void;
  onExport: (invoice: Invoice) => void;
};

const InvoiceTableRow = memo(({
  invoice,
  client,
  paymentStatus,
  isOverdue,
  t,
  onEdit,
  onDelete,
  onView,
  onExport
}: InvoiceTableRowProps) => (
  <TableRow key={invoice.id}>
    <TableCell className="font-medium">
      <Link 
        to={`/invoices/${invoice.id}`}
        className="text-primary hover:underline"
      >
        {invoice.invoiceNumber}
      </Link>
    </TableCell>
    <TableCell>
      <div>
        {client && (
          <Link 
            to={`/clients/${client.id}`}
            className="text-primary hover:underline hover:text-primary/80"
          >
            {client.name}
          </Link>
        )}
      </div>
      <div className="text-xs text-muted-foreground">{client?.company}</div>
    </TableCell>
    <TableCell>{formatDate(invoice.date)}</TableCell>
    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
    <TableCell className="text-right font-medium">
      {formatCurrency(invoice.totalAmountTTC)}
    </TableCell>
    <TableCell>
      <StatusBadge 
        status={invoice.isPaid ? 'paid' : isOverdue ? 'overdue' : 'unpaid'} 
      />
    </TableCell>
    <TableCell>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">{t('invoices.actions')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t('invoices.actions')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onEdit(invoice)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>{t('invoices.edit')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(invoice)}>
            <Trash2 className="mr-2 h-4 w-4" />
            <span>{t('invoices.delete')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={`/invoices/${invoice.id}`}>
              <FileText className="mr-2 h-4 w-4" />
              <span>{t('invoices.viewDetails')}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport(invoice)}>
            <Download className="mr-2 h-4 w-4" />
            <span>{t('general.export')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  </TableRow>
));

const Invoices = () => {
  const { deleteInvoice, getClientById, getSaleById, getInvoicePaymentStatus, ensureClientsLoaded } = useAppContext();
  const { settings } = useAppSettings();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [deletedInvoices, setDeletedInvoices] = useState<Invoice[]>([]);

  // Infinite scroll
  const {
    rows: invoices,
    loading,
    error,
    hasMore,
    loadMore,
    reload,
  } = useInfiniteInvoices();
  const sentinelRef = useIntersectionObserver(() => {
    if (hasMore && !loading) loadMore();
  });

  // Ensure all clients for loaded invoices are present
  useEffect(() => {
    const clientIds = Array.from(new Set(invoices.map(inv => inv.clientId)));
    ensureClientsLoaded(clientIds);
  }, [invoices, ensureClientsLoaded]);

  // Reset on search
  useEffect(() => {
    reload();
  }, [searchTerm, reload]);

  useEffect(() => {
    if (showArchive) {
      getDeletedInvoices().then(setDeletedInvoices);
    }
  }, [showArchive]);

  const handleDeleteInvoice = (invoice: Invoice) => {
    if (window.confirm(t('invoices.deleteConfirm'))) {
      deleteInvoice(invoice.id);
      toast.success(t('invoices.deleted'));
    }
  };

  const handleExportPDF = async (invoice: Invoice) => {
    const client = getClientById(invoice.clientId);
    if (!client) {
      toast.error(t('invoices.clientNotFound'));
      return;
    }
    const sales = invoice.salesIds.map(id => getSaleById(id)).filter((s): s is Sale => Boolean(s));
    const paymentStatus = getInvoicePaymentStatus(invoice.id);
    const payments = paymentStatus?.payments || [];
    try {
      const pdfService = await import('@/utils/pdfService.tsx');
      await pdfService.saveInvoicePDF(invoice, client, sales, payments);
      toast.success(t('invoices.pdfGenerated'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('invoices.pdfError'));
    }
  };

  const handleRestoreInvoice = async (id: string) => {
    await restoreInvoice(id);
    toast.success(t('invoices.restored') || 'Invoice restored');
    setDeletedInvoices(prev => prev.filter(inv => inv.id !== id));
  };

  const filteredInvoices = invoices
    .filter((invoice) => {
      const client = getClientById(invoice.clientId);
      if (!client) return false;
      const searchString = `${invoice.invoiceNumber} ${client.name} ${client.company}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <MainLayout title={t('invoices.title')}>
      <div className="space-y-6">
        {/* Header with search and add button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder={t('invoices.searchPlaceholder')}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 ml-auto">
            <Button onClick={() => setShowArchive(a => !a)} variant="outline">
              {showArchive ? t('invoices.showActive') || 'Show Active' : t('invoices.showArchive') || 'Show Archive'}
            </Button>
            <Button onClick={() => {
              setSelectedInvoice(null);
              setShowAddDialog(true);
            }}>
              <Plus className="mr-1 h-4 w-4" /> {t('invoices.create')}
            </Button>
          </div>
        </div>

        {showArchive ? (
          <div>
            <h2 className="text-lg font-semibold mb-2">{t('invoices.archive') || 'Deleted Invoices'}</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('invoices.number')}</TableHead>
                  <TableHead>{t('invoices.client')}</TableHead>
                  <TableHead>{t('invoices.date')}</TableHead>
                  {/* <TableHead>{t('invoices.deletedAt') || 'Deleted At'}</TableHead> */}
                  <TableHead>{t('invoices.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletedInvoices.map(invoice => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>{getClientById(invoice.clientId)?.name || ''}</TableCell>
                    <TableCell>{formatDate(invoice.date)}</TableCell>
                    {/* <TableCell>{invoice.deletedAt ? formatDate(invoice.deletedAt) : ''}</TableCell> */}
                    <TableCell>
                      <Button size="sm" onClick={() => handleRestoreInvoice(invoice.id)}>
                        {t('invoices.restore') || 'Restore'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <>
            {/* Invoices Table */}
            <Card>
              <CardHeader>
                <CardTitle>{t('invoices.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-gray-100">
                      <TableRow>
                        <TableHead>{t('invoices.invoiceNumber')}</TableHead>
                        <TableHead>{t('invoices.client')}</TableHead>
                        <TableHead>{t('invoices.date')}</TableHead>
                        <TableHead>{t('invoices.dueDate')}</TableHead>
                        <TableHead className="text-right">{t('invoices.amount')}</TableHead>
                        <TableHead>{t('invoices.status')}</TableHead>
                        <TableHead className="w-[80px]">{t('invoices.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.length > 0 ? (
                        filteredInvoices.map((invoice) => (
                          <InvoiceTableRow
                            key={invoice.id}
                            invoice={invoice}
                            client={getClientById(invoice.clientId)}
                            paymentStatus={getInvoicePaymentStatus(invoice.id)}
                            isOverdue={!invoice.isPaid && new Date(invoice.dueDate) < new Date()}
                            t={t}
                            onEdit={() => { setSelectedInvoice(invoice); setShowAddDialog(true); }}
                            onDelete={() => handleDeleteInvoice(invoice)}
                            onView={() => setSelectedInvoice(invoice)}
                            onExport={handleExportPDF}
                          />
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            {searchTerm
                              ? t('invoices.noMatch')
                              : t('invoices.noInvoices')}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow ref={sentinelRef as any}>
                        <TableCell colSpan={7} className="text-center py-2">
                          {loading && hasMore && (
                            <div className="flex justify-center items-center py-2">
                              <Spinner size={24} />
                              <span className="ml-2">{t('general.loading')}</span>
                            </div>
                          )}
                          {!hasMore && !loading && filteredInvoices.length > 0 && (
                            <span className="text-muted-foreground text-xs">{t('general.endOfList') || 'No more invoices'}</span>
                          )}
                          {error && <span className="text-destructive text-xs">{error}</span>}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Add/Edit Invoice Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 z-50 bg-background pb-4 mb-4">
            <DialogTitle>
              {selectedInvoice ? t('invoices.editTitle') : t('invoices.createTitle')}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedInvoice 
                ? t('invoices.editDesc')
                : t('invoices.createDesc')}
            </p>
          </DialogHeader>
          <div className="overflow-y-auto">
            <InvoiceForm 
              invoice={selectedInvoice} 
              onSuccess={() => setShowAddDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Invoices;
