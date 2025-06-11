import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatDate, formatCurrency } from '@/utils/format';
import { Plus, Edit, FileText, ChevronDown, ChevronRight, MoreVertical, DollarSign, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import StatusBadge from '@/components/ui/StatusBadge';
import MainLayout from '@/components/layout/MainLayout';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { saveSalePDF } from '@/utils/pdfService';
import type { Sale, SaleItem } from '@/types/index';
import type { PaymentStatus } from '@/services/paymentService';
import { PaymentForm } from '@/components/invoices/PaymentForm';
import SaleForm from '@/components/sales/SaleForm';

interface SaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale?: Sale;
}

const SaleDialog = ({ open, onOpenChange, sale }: SaleDialogProps) => {
  const { t } = useLanguage();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="sticky top-0 z-50 bg-background px-6 py-4 border-b">
          <DialogTitle>
            {sale ? t('sales.edit') : t('sales.add')}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <SaleForm 
            sale={sale}
            onSuccess={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function Sales() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const { t } = useLanguage();
  const { sales, clients, payments, deleteSale } = useApp();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredSales = sales
    .filter((sale) => {
      const client = clients.find(c => c.id === sale.clientId);
      if (!client) return false;
      const searchLower = searchTerm.toLowerCase();
      return (
        client.name.toLowerCase().includes(searchLower) ||
        (client.company || '').toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getPaymentStatus = (saleId: string): PaymentStatus => {
    const salePaidAmount = payments
      .filter(p => p.saleId === saleId)
      .reduce((total, payment) => total + payment.amount, 0);

    const sale = sales.find(s => s.id === saleId);
    if (!sale) return { totalPaid: 0, remainingAmount: 0, isFullyPaid: false };

    return {
      totalPaid: salePaidAmount,
      remainingAmount: sale.totalAmountTTC - salePaidAmount,
      isFullyPaid: salePaidAmount >= sale.totalAmountTTC
    };
  };

  const toggleExpanded = (saleId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [saleId]: !prev[saleId]
    }));
  };

  const handleAddPayment = (saleId: string) => {
    setSelectedSaleForPayment(saleId);
    setShowPaymentDialog(true);
  };

  const handleExportPDF = async (sale: Sale) => {
    const client = clients.find(c => c.id === sale.clientId);
    if (!client) {
      toast.error(t('sales.clientNotFound'));
      return;
    }

    try {
      await saveSalePDF(sale, client);
      toast.success(t('sales.pdfGenerated'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('sales.pdfError'));
    }
  };

  const handleDelete = async (sale: Sale) => {
    if (!window.confirm(t('sales.deleteConfirm'))) return;
    
    try {
      await deleteSale(sale.id);
      toast.success(t('sales.deleted'));
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast.error(t('general.error'));
    }
  };

  return (
    <MainLayout title={t('sales.title')}>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center gap-4">
          <Input
            placeholder={t('general.search')}
            value={searchTerm}
            onChange={handleSearchChange}
            className="max-w-sm"
          />
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('sales.add')}
          </Button>
        </div>

        {/* Sales Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>{t('sales.date')}</TableHead>
                <TableHead>{t('sales.client')}</TableHead>
                <TableHead>{t('sales.items')}</TableHead>
                <TableHead className="text-right">{t('sales.total')}</TableHead>
                <TableHead>{t('sales.status')}</TableHead>
                <TableHead className="text-right">{t('general.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => {
                  const client = clients.find(c => c.id === sale.clientId);
                  const isExpanded = expandedRows[sale.id] || false;
                  const paymentStatus = getPaymentStatus(sale.id);

                  return (
                    <React.Fragment key={sale.id}>
                      <TableRow>
                        <TableCell className="p-0 pl-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleExpanded(sale.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>{formatDate(sale.date)}</TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {client && (
                              <Link 
                                to={`/clients/${client.id}`}
                                className="text-primary hover:underline hover:text-primary/80"
                              >
                                {client.name}
                              </Link>
                            )}
                          </div>
                          {client?.company && (
                            <div className="text-xs text-muted-foreground">
                              {client.company}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{sale.items?.length || 0} {t('general.items')}</TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium">
                            {formatCurrency(sale.totalAmountTTC)}
                          </div>
                          {paymentStatus && (
                            <div className="text-xs text-muted-foreground">
                              {t('sales.paid')}: {formatCurrency(paymentStatus.totalPaid)}
                              {paymentStatus.remainingAmount > 0 && (
                                <div>
                                  {t('sales.remaining')}: {formatCurrency(paymentStatus.remainingAmount)}
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusBadge 
                              status={sale.isInvoiced ? 'invoiced' : 'notInvoiced'} 
                            />
                            {paymentStatus && (
                              <StatusBadge 
                                status={
                                  paymentStatus.isFullyPaid ? 'paid' :
                                  paymentStatus.totalPaid > 0 ? 'partial' : 'unpaid'
                                } 
                              />
                            )}
                            {sale.isInvoiced && sale.invoiceId && (
                              <Link 
                                to={`/invoices/${sale.invoiceId}`}
                                className="text-xs text-primary hover:underline hover:text-primary/80"
                              >
                                {t('sales.viewInvoice')}
                              </Link>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleExportPDF(sale)}>
                                <FileText className="mr-2 h-4 w-4" />
                                {t('general.export')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddPayment(sale.id)}>
                                <DollarSign className="mr-2 h-4 w-4" />
                                {t('payments.add')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setSelectedSale(sale);
                                setShowAddDialog(true);
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('general.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(sale)}>
                                <Trash className="mr-2 h-4 w-4" />
                                {t('general.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Sale Details */}
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="p-0">
                            <div className="bg-muted/50 p-4">
                              <div className="space-y-4">
                                {/* Items List */}
                                <div>
                                  <h4 className="font-medium mb-2">{t('sales.items')}</h4>
                                  <div className="space-y-2">
                                    {sale.items?.map((item: SaleItem) => (
                                      <div key={item.id} className="bg-background rounded-md p-3">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <div className="font-medium">{item.description}</div>
                                            <div className="text-sm text-muted-foreground">
                                              {item.coilRef && `${t('form.sale.coilRef')}: ${item.coilRef}`}
                                              {item.coilThickness && ` • ${t('form.sale.coilThickness')}: ${item.coilThickness}`}
                                              {item.coilWidth && ` • ${t('form.sale.coilWidth')}: ${item.coilWidth}`}
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div>{formatCurrency(item.totalAmountTTC)}</div>
                                            <div className="text-sm text-muted-foreground">
                                              {item.quantity} {t('form.sale.quantity')} × {formatCurrency(item.pricePerTon)}/{t('form.sale.quantity')}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Summary */}
                                <div className="flex justify-end">
                                  <div className="w-72 space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span>{t('form.sale.subtotalHT')}:</span>
                                      <span>{formatCurrency(sale.totalAmountHT)}</span>
                                    </div>
                                    {sale.transportationFee > 0 && (
                                      <div className="flex justify-between text-sm">
                                        <span>{t('form.sale.transportationFee')}:</span>
                                        <span>{formatCurrency(sale.transportationFee)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between text-sm pt-1 border-t">
                                      <span>{t('form.sale.totalHT')}:</span>
                                      <span>{formatCurrency(sale.totalAmountHT)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span>{t('form.sale.tva')} ({(sale.taxRate * 100).toFixed(0)}%):</span>
                                      <span>{formatCurrency(sale.totalAmountTTC - sale.totalAmountHT)}</span>
                                    </div>
                                    <div className="flex justify-between font-medium pt-1 border-t">
                                      <span>{t('form.sale.totalTTC')}:</span>
                                      <span>{formatCurrency(sale.totalAmountTTC)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Notes */}
                                {sale.notes && (
                                  <div>
                                    <h4 className="font-medium mb-2">{t('form.sale.notes')}</h4>
                                    <p className="text-sm text-muted-foreground">{sale.notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {searchTerm ? t('sales.noSales') : t('general.noData')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Sale Dialog */}
      <SaleDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        sale={selectedSale || undefined}
      />

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('payments.add')}</DialogTitle>
          </DialogHeader>
          {selectedSaleForPayment && (
            <PaymentForm
              saleId={selectedSaleForPayment}
              onSuccess={() => {
                setShowPaymentDialog(false);
                setSelectedSaleForPayment(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
