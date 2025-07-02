import React, { useState, useEffect } from 'react';
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
import type { Sale } from '@/types/index';
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
import { saveSalePDF } from '@/utils/pdfService.tsx';
import { getDeletedSales, restoreSale } from '@/services/saleService';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

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
  const [showArchive, setShowArchive] = useState(false);
  const [deletedSales, setDeletedSales] = useState<Sale[]>([]);
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [invoicedFilter, setInvoicedFilter] = useState<string>('all');

  // Debug log to check what sales are loaded
  React.useEffect(() => {
    console.log('Loaded sales from context:', sales);
  }, [sales]);

  useEffect(() => {
    if (showArchive) {
      getDeletedSales().then(setDeletedSales);
      { console.log("xxSale items: ", sales)}
    }
  }, [showArchive]);

  const handleDeleteSale = async (sale: Sale) => {
    if (window.confirm(t('sales.deleteConfirm'))) {
      try {
        await deleteSale(sale.id);
        toast.success(t('sales.deleted'));
      } catch (error: any) {
        // Show a warning if deletion is blocked (e.g., due to a paid invoice)
        let message = error?.message || error?.toString() || t('sales.deleteBlocked') || 'Deletion blocked.';
        // Try to extract invoice ID(s) from the error message
        const match = message.match(/invoice ([^ ]+)/i);
        if (match && match[1]) {
          message += `\n${t('sales.blockedByInvoice') || 'Blocked by invoice'}: ${match[1]}`;
        }
        toast.error(message);
      }
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

  // Only filter by search, product type, payment status, and invoiced status
  const filteredSales = sales
    .filter((sale) => {
      const client = getClientById(sale.clientId);
      if (!client) return false;
      const clientNameMatches = client.name.toLowerCase().includes(searchTerm.toLowerCase());
      const clientCompanyMatches = client.company?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      if (!(clientNameMatches || clientCompanyMatches)) return false;

      // Product Type filter
      if (productTypeFilter !== 'all') {
        // At least one item in the sale must match the product type (fuzzy match)
        const normalizedFilter = productTypeFilter.replace(/_/g, '').toLowerCase();
        if (!sale.items.some(item =>
          (item.productType || '').replace(/_/g, '').toLowerCase().includes(normalizedFilter)
        )) return false;
      }

      // Payment Status filter
      if (paymentStatusFilter !== 'all') {
        const paymentStatus = getSalePaymentStatus(sale.id);
        if (paymentStatusFilter === 'paid' && !paymentStatus?.isFullyPaid) return false;
        if (paymentStatusFilter === 'unpaid' && paymentStatus?.isFullyPaid) return false;
      }

      // Invoiced filter
      if (invoicedFilter !== 'all') {
        if (invoicedFilter === 'invoiced' && !sale.isInvoiced) return false;
        if (invoicedFilter === 'notInvoiced' && sale.isInvoiced) return false;
      }

      return true;
    });

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
      await saveSalePDF(sale, client);
      toast.success(t('sales.pdfGenerated'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('sales.pdfError'));
    }
  };

  const handleRestoreSale = async (id: string) => {
    await restoreSale(id);
    toast.success(t('sales.restored') || 'Sale restored');
    setDeletedSales(prev => prev.filter(sale => sale.id !== id));
  };

  return (
    <MainLayout title={t('sales.title')}>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="flex flex-col gap-1">
              <label htmlFor="search" className="text-xs font-medium text-muted-foreground">{t('general.search')}</label>
              <Input
                id="search"
                placeholder={t('general.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-[200px]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="product-type-filter">{t('form.sale.productType')}</label>
              <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                <SelectTrigger id="product-type-filter" className="w-[140px]">
                  <SelectValue placeholder={t('form.sale.productType') || "Product Type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('general.all') || "All Types"}</SelectItem>
                  <SelectItem value="coil">{t('productTypes.coil')}</SelectItem>
                  <SelectItem value="steel_slitting">{t('productTypes.steelSlitting')}</SelectItem>
                  <SelectItem value="corrugated_sheet">{t('productTypes.corrugatedSheet')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="payment-status-filter">{t('sales.paymentStatus') || t('sales.status')}</label>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger id="payment-status-filter" className="w-[120px]">
                  <SelectValue placeholder={t('sales.status') || "Status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('general.all') || "All"}</SelectItem>
                  <SelectItem value="paid">{t('sales.paid') || "Paid"}</SelectItem>
                  <SelectItem value="unpaid">{t('sales.unpaid') || "Unpaid"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="invoiced-status-filter">{t('sales.invoicedFilter')}</label>
              <Select value={invoicedFilter} onValueChange={setInvoicedFilter}>
                <SelectTrigger id="invoiced-status-filter" className="w-[140px]">
                  <SelectValue placeholder={t('sales.invoiced') + ' / ' + t('sales.notInvoiced')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('general.all')}</SelectItem>
                  <SelectItem value="invoiced">{t('sales.invoiced')}</SelectItem>
                  <SelectItem value="notInvoiced">{t('sales.notInvoiced')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                        <TableCell>
                          <Link to={`/sales/${sale.id}`} className="text-primary hover:underline">
                            {formatDate(sale.date)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {client && (
                              <Link to={`/clients/${client.id}`} className="text-primary hover:underline hover:text-primary/80">
                                {client.name}
                              </Link>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{client?.company || ''}</div>
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
                                className="text-xs text-primary hover:underline hover:text-primary/80"
                              >
                                {t('sales.viewInvoice')}
                              </Link>
                            )}
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
                                              {/* Add more attributes if needed */}
                                            </div>
                                          </div>
                                          <div className="text-right text-red-600">
                                            <div className="text-sm text-muted-foreground">
                                          
                                              {item.productType === 'coil' && (
                                                <>
                                                  
                                                  {item.coilWeight} {"TONS"} × {formatCurrency(item.pricePerTon)} {"P.U"}
                                                </>
                                              )}
                                              {item.productType === 'steel_slitting' && (
                                                <>
                                                  {item.coilWeight} {"TONS"} × {formatCurrency(item.pricePerTon)} {"P.U"}
                                                </>
                                              )}
                                              {item.productType === 'corrugated_sheet' && (
                                                <>
                                                  {item.quantity} (u) × {formatCurrency(item.pricePerTon)} {"P.U"}
                                                </>
                                              )}
                                              {/* Fallback for unknown type */}
                                              {!item.productType && (
                                                <>
                                                  {item.quantity} U × {formatCurrency(item.pricePerTon)} {"P.U"}
                                                </>
                                              )}
                                            </div>
                                            <div className='text-sm font-medium'>
                                              {formatCurrency(
                                                item.productType === 'coil'
                                                  ? (item.coilWeight ?? 0) * (item.pricePerTon ?? 0)
                                                  : item.productType === 'steel_slitting'
                                                    ? (item.coilWeight ?? 0) * (item.pricePerTon ?? 0)
                                                    : item.productType === 'corrugated_sheet'
                                                      ? (item.quantity ?? 0) * (item.pricePerTon ?? 0)
                                                      : (item.quantity ?? 0) * (item.pricePerTon ?? 0)
                                              )}
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
                                      <span>{formatCurrency(sale.totalAmountHT ?? 0 - (sale.transportationFee ?? 0))}</span>
                                    </div>
                                    {(sale.transportationFee ?? 0) > 0 && (
                                      <div className="flex justify-between text-sm">
                                        <span>{t('form.sale.transportationFee')}:</span>
                                        <span>{formatCurrency(sale.transportationFee ?? 0)}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between text-sm pt-1 border-t">
                                      <span>{t('form.sale.totalHT')}:</span>
                                      <span>{formatCurrency(sale.totalAmountHT ?? 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span>{t('form.sale.tva')} (19%):</span>
                                      <span>{formatCurrency((sale.totalAmountTTC ?? 0) - (sale.totalAmountHT ?? 0))}</span>
                                    </div>
                                    <div className="flex justify-between font-medium pt-1 border-t">
                                      <span>{t('form.sale.totalTTC')}:</span>
                                      <span>{formatCurrency(sale.totalAmountTTC ?? 0)}</span>
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
