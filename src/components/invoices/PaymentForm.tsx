import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/context/AppContext';
import { Payment } from '@/types';
import { formatCurrency } from '@/utils/format';
import { useLanguage } from '@/context/LanguageContext';

type PaymentMethod = 'cash' | 'bank_transfer' | 'check';

type FormValues = {
  date: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
};

const formSchema = z.object({
  date: z.string(),
  amount: z.number().min(0),
  method: z.enum(['cash', 'bank_transfer', 'check']),
  notes: z.string().optional(),
}) satisfies z.ZodType<FormValues>;

interface PaymentFormProps {
  saleId: string;
  payment?: Payment;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PaymentForm = ({ saleId, payment, onSuccess, onCancel }: PaymentFormProps) => {
  const { addPayment, getSalePaymentStatus, getSaleById, updateInvoice, getInvoiceById } = useAppContext();
  const { t } = useLanguage();
  const sale = getSaleById(saleId);
  const remainingAmount = getSalePaymentStatus(saleId)?.remainingAmount || 0;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: payment?.date.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      amount: payment?.amount || remainingAmount,
      method: (payment?.method as PaymentMethod) || 'cash',
      notes: payment?.notes || '',
    },
  });

  if (!sale) {
    return <div>{t('sales.notFound')}</div>;
  }

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      const paymentData = {
        saleId,
        clientId: sale.clientId,
        date: new Date(data.date),
        amount: data.amount,
        method: data.method,
        notes: data.notes || '',
      };

      if (data.amount > remainingAmount) {
        toast.warning(t('payments.warning.exceedsRemaining')
          .replace('{amount}', formatCurrency(data.amount))
          .replace('{remaining}', formatCurrency(remainingAmount)));
      }

      await addPayment(paymentData);
      toast.success(t('payments.recorded'));

      // If the sale is part of an invoice, check if all sales in the invoice are now paid
      if (sale.invoiceId) {
        const invoice = getInvoiceById(sale.invoiceId);
        if (invoice) {
          const allSalesPaid = invoice.salesIds.every(id => {
            const status = getSalePaymentStatus(id);
            return status?.isFullyPaid;
          });

          if (allSalesPaid) {
            await updateInvoice(sale.invoiceId, {
              isPaid: true,
              paidAt: new Date()
            });
          }
        }
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error(t('payments.error'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('payments.date')}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('payments.amount')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={field.value || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('payments.method')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('payments.selectMethod')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cash">{t('payments.methods.cash')}</SelectItem>
                  <SelectItem value="bank_transfer">{t('payments.methods.bank_transfer')}</SelectItem>
                  <SelectItem value="check">{t('payments.methods.check')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('payments.notes')}</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          )}
          <Button type="submit">
            {payment ? t('payments.update') : t('payments.add')}
          </Button>
        </div>
      </form>
    </Form>
  );
};
