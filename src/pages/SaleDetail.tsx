import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import MainLayout from '@/components/layout/MainLayout';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SaleForm from '@/components/sales/SaleForm';
import { formatCurrency, formatDate } from '@/utils/format';

const SaleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { getSaleById, getClientById, getSalePaymentStatus, updateSale } = useAppContext();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const sale = id ? getSaleById(id) : undefined;
  const client = sale ? getClientById(sale.clientId) : undefined;
  const paymentStatus = sale ? getSalePaymentStatus(sale.id) : null;

  if (!sale) {
    return (
      <MainLayout title={t('general.error')}>
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <h2 className="text-2xl font-semibold">{t('general.error')}</h2>
          <p className="text-muted-foreground">{t('sales.notFound') || 'Sale not found.'}</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('general.back')}
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title={`${t('sales.title')} #${sale.id.substring(0, 8)}`}
      headerAction={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('general.back')}
          </Button>
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Edit className="mr-2 h-4 w-4" />
            {t('general.edit')}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('sales.title')} #{sale.id.substring(0, 8)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground">{t('sales.date')}:</span>
                  <span className="ml-2 font-medium">{formatDate(sale.date)}</span>
                </div>
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground">{t('sales.client')}:</span>
                  {client ? (
                    <Link to={`/clients/${client.id}`} className="ml-2 text-primary hover:underline">
                      {client.name}
                    </Link>
                  ) : (
                    <span className="ml-2">—</span>
                  )}
                </div>
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground">{t('sales.status')}:</span>
                  <span className="ml-2 font-medium">{sale.isInvoiced ? t('status.invoiced') : t('status.notInvoiced')}</span>
                </div>
                {sale.invoiceId && (
                  <div className="mb-2">
                    <span className="text-sm text-muted-foreground">{t('sales.invoice')}:</span>
                    <Link to={`/invoices/${sale.invoiceId}`} className="ml-2 text-primary hover:underline">
                      {t('sales.viewInvoice')}
                    </Link>
                  </div>
                )}
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground">{t('sales.paymentMethod')}:</span>
                  <span className="ml-2">{sale.paymentMethod ? t(`payments.methods.${sale.paymentMethod}`) : '—'}</span>
                </div>
                {sale.notes && (
                  <div className="mb-2">
                    <span className="text-sm text-muted-foreground">{t('sales.notes')}:</span>
                    <span className="ml-2">{sale.notes}</span>
                  </div>
                )}
              </div>
              <div>
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground">{t('sales.totalAmount')} HT:</span>
                  <span className="ml-2 font-medium">{formatCurrency(sale.totalAmountHT)}</span>
                </div>
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground">{t('sales.totalAmount')} TTC:</span>
                  <span className="ml-2 font-medium">{formatCurrency(sale.totalAmountTTC)}</span>
                </div>
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground">{t('sales.taxRate')}:</span>
                  <span className="ml-2">{(sale.taxRate * 100).toFixed(2)}%</span>
                </div>
                {sale.transportationFee !== undefined && sale.transportationFee > 0 && (
                  <div className="mb-2">
                    <span className="text-sm text-muted-foreground">{t('sales.transportationFee') || 'Transportation Fee'}:</span>
                    <span className="ml-2">{formatCurrency(sale.transportationFee)}</span>
                  </div>
                )}
                {paymentStatus && (
                  <div className="mb-2 pt-2 border-t">
                    <span className="text-sm font-medium text-destructive">
                      {t('sales.remaining') || 'Rest to be paid'}:
                    </span>
                    <span className="ml-2 font-bold text-destructive">
                      {formatCurrency(paymentStatus.remainingAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('sales.items')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>{t('sales.quantity')}</TableHead>
                    <TableHead>P.U</TableHead>
                    <TableHead>{t('sales.totalAmount')} HT</TableHead>
                    
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        {item.productType === 'coil' || item.productType === 'steel_slitting'
                          ? (item.coilWeight ?? '—')
                          : item.productType === 'corrugated_sheet'
                            ? item.quantity
                            : item.quantity}
                      </TableCell>
                      <TableCell>{formatCurrency(Number(item.pricePerTon) || 0)}</TableCell>
                      <TableCell>{formatCurrency(item.totalAmountHT)}</TableCell>
                     
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Sale Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0">
            <DialogHeader className="sticky top-0 z-50 bg-background px-6 py-4 border-b">
              <DialogTitle>{t('sales.edit')}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <SaleForm sale={sale} onSuccess={() => setShowEditDialog(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default SaleDetail; 