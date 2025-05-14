
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '../../context/AppContext';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateInput, parseDateInput } from '../../utils/format';
import { toast } from 'sonner';
import { Payment } from '../../types';

const formSchema = z.object({
  date: z.string().min(1, { message: 'Date is required' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive' }),
  method: z.enum(['cash', 'bank_transfer', 'check', 'credit_card'], {
    required_error: 'Payment method is required',
  }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PaymentFormProps {
  invoiceId: string;
  remainingAmount: number;
  onSuccess?: () => void;
  payment?: Payment;
}

const PaymentForm = ({ invoiceId, remainingAmount, onSuccess, payment }: PaymentFormProps) => {
  const { addPayment, updatePayment } = useAppContext();

  const defaultValues: FormValues = {
    date: formatDateInput(payment?.date || new Date()),
    amount: payment?.amount || remainingAmount,
    method: payment?.method || 'bank_transfer',
    notes: payment?.notes || '',
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = (data: FormValues) => {
    if (data.amount > remainingAmount && !payment) {
      form.setError('amount', { 
        type: 'manual', 
        message: `Amount cannot exceed remaining balance of ${remainingAmount}` 
      });
      return;
    }
    
    const paymentData = {
      date: parseDateInput(data.date),
      amount: data.amount,
      method: data.method,
      notes: data.notes || '',
    };
    
    if (payment) {
      updatePayment(payment.id, paymentData);
      toast.success('Payment has been updated');
    } else {
      addPayment(invoiceId, paymentData);
      toast.success('Payment has been recorded');
    }

    if (onSuccess) {
      onSuccess();
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
              <FormLabel>Payment Date</FormLabel>
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
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="Enter amount" 
                  {...field} 
                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
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
              <FormLabel>Payment Method</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
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
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any additional notes about this payment"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" type="button" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit">
            {payment ? 'Update' : 'Record'} Payment
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PaymentForm;
