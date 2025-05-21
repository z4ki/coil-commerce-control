import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
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
import { Plus, Search, Edit, Trash2, FileCheck, FileX, ChevronDown, ChevronRight, FileText, Download, MoreVertical, Trash, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/format';
import StatusBadge from '@/components/ui/StatusBadge';
import { Sale } from '@/types';
import { toast } from 'sonner';
import SaleForm from '@/components/sales/SaleForm';
import { PaymentForm } from '@/components/invoices/PaymentForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { generateSalePDF } from '@/utils/pdfService';

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

const Sales = () => {
  const { sales, clients, deleteSale, updateSale, getClientById, getSalePaymentStatus } = useAppContext();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState<string | null>(null);
  const [expandedSales, setExpandedSales] = useState<{[key: string]: boolean}>({});

  const handleDeleteSale = (sale: Sale) => {
    if (window.confirm(t('sales.deleteConfirm'))) {
      deleteSale(sale.id);
      toast.success(t('sales.deleted'));
    }
  };

  const toggleInvoiceStatus = (sale: Sale) => {
    if (sale.isInvoiced) {
      // Can only toggle if not already linked to an invoice
      if (sale.invoiceId) {
        toast.error(t('sales.cannotChangeStatus'));
        return;
      }
      updateSale(sale.id, { isInvoiced: false });
      toast.success(t('sales.markedAsNotInvoiced'));
    } else {
      updateSale(sale.id, { isInvoiced: true });
      toast.success(t('sales.markedAsInvoiced'));
    }
  };

  const toggleSaleExpansion = (saleId: string) => {
    setExpandedSales(prev => ({
      ...prev,
      [saleId]: !prev[saleId]
    }));
  };

  const handleAddPayment = (saleId: string) => {
    setSelectedSaleForPayment(saleId);
    setShowPaymentDialog(true);
  };

  const filteredSales = sales
    .filter((sale) => {
      const client = getClientById(sale.clientId);
      if (!client) return false;
      const clientNameMatches = client.name.toLowerCase().includes(searchTerm.toLowerCase());
      const clientCompanyMatches = client.company.toLowerCase().includes(searchTerm.toLowerCase());
      return clientNameMatches || clientCompanyMatches;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleExportInvoice = (sale: Sale) => {
    toast.info(t('sales.exportPending').replace('{0}', 'Invoice'));
  };

  const handleExportQuotation = (sale: Sale) => {
    toast.info(t('sales.exportPending').replace('{0}', 'Quotation'));
  };

  const handleExportPDF = async (sale: Sale) => {
    const client = getClientById(sale.clientId);
    if (!client) {
      toast.error(t('sales.clientNotFound'));
      return;
    }

    try {
      toast.info(t('sales.exportPending'));
      const doc = await generateSalePDF(sale, client);
      doc.save(`Devis_${formatDate(sale.date, 'YYYYMMDD')}_${sale.id.substring(0, 4)}.pdf`);
      toast.success(t('sales.pdfGenerated'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(error instanceof Error ? error.message : t('sales.pdfError'));
    }
  };

  return (
    <MainLayout title={t('sales.title')}>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 w-full sm:w-auto">
            <Input
              placeholder={t('general.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-[300px]"
            />
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('sales.add')}
          </Button>
        </div>

        {/* Sales Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-gray-100">
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
                  const client = getClientById(sale.clientId);
                  const isExpanded = expandedSales[sale.id] || false;
                  const paymentStatus = getSalePaymentStatus(sale.id);
                  return (
                    <React.Fragment key={sale.id}>
                      <TableRow>
                        <TableCell className="p-0 pl-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleSaleExpansion(sale.id)}
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
                              <Link to={`/clients/${client.id}`} className="text-primary hover:underline hover:text-primary/80">
                                {client.name}
                              </Link>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{client?.company}</div>
                        </TableCell>
                        <TableCell>{sale.items.length} {t('general.items')}</TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium">{formatCurrency(sale.totalAmountTTC)}</div>
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
                                className="text-primary hover:underline hover:text-primary/80"
                              >
                                {t('sales.viewInvoice')}
                              </Link>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExportPDF(sale)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              <span>{t('general.export')}</span>
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleAddPayment(sale.id)}>
                                <DollarSign className="mr-2 h-4 w-4" />
                                {t('payments.add')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedSale(sale);
                                setShowAddDialog(true);
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('general.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteSale(sale)}>
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
                                    {sale.items.map((item, index) => (
                                      <div key={item.id} className="bg-background rounded-md p-3">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <div className="font-medium">{item.description}</div>
                                            <div className="text-sm text-muted-foreground">
                                              {item.coilRef && `${t('form.sale.coilRef')}: ${item.coilRef}`}
                                              {item.coilThickness && ` • ${t('form.sale.coilThickness')}: ${item.coilThickness}`}
                                              {item.coilWidth && ` • ${t('form.sale.coilWidth')}: ${item.coilWidth}`}
                                            </div>
                                            {/* {(item.topCoatRAL || item.backCoatRAL) && (
                                              <div className="text-sm text-muted-foreground">
                                                {item.topCoatRAL && `${t('form.sale.topCoatRAL')}: ${item.topCoatRAL}`}
                                                {item.backCoatRAL && ` • ${t('form.sale.backCoatRAL')}: ${item.backCoatRAL}`}
                                              </div>
                                            )} */}
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
                                      <span>{formatCurrency(sale.totalAmountHT - (sale.transportationFee || 0))}</span>
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
                                      <span>{t('form.sale.tva')} (19%):</span>
                                      <span>{formatCurrency(sale.totalAmountTTC - sale.totalAmountHT)}</span>
                                    </div>
                                    <div className="flex justify-between font-medium pt-1 border-t">
                                      <span>{t('form.sale.totalTTC')}:</span>
                                      <span>{formatCurrency(sale.totalAmountTTC)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Notes if any */}
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
      {showAddDialog && (
        <SaleDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          sale={selectedSale || undefined}
        />
      )}
      
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
              onCancel={() => {
                setShowPaymentDialog(false);
                setSelectedSaleForPayment(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Sales;
