// import React from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';
// import { toast } from 'sonner';
// import { Button } from '@/components/ui/button';
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form';
// import { Input } from '@/components/ui/input';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { Textarea } from '@/components/ui/textarea';
// import { useAppContext } from '@/context/AppContext';
// import { Payment, PaymentMethodType } from '@/types'; // Import PaymentMethodType
// import { formatCurrency, formatDateInput } from '@/utils/format'; // Ensure formatDateInput is imported if used
// import { useLanguage } from '@/context/LanguageContext';

// // Use the shared PaymentMethodType or define specifically if PaymentForm allows different methods
// const paymentFormMethods = ['cash', 'bank_transfer', 'check', 'term', 'deferred'] as const;

// const formSchema = z.object({
//   date: z.string().min(1, { message: "Date is required" }), // Ensure date is treated as string from input
//   amount: z.coerce.number().positive({ message: "Amount must be positive" }),
//   method: z.enum(paymentFormMethods), // Use the defined methods for form validation
//   notes: z.string().optional(),
// });

// type FormValues = z.infer<typeof formSchema>;

// interface PaymentFormProps {
//   saleId: string;
//   payment?: Payment; // For editing existing payment
//   onSuccess?: () => void;
//   onCancel?: () => void;
// }

// export const PaymentForm = ({ saleId, payment, onSuccess, onCancel }: PaymentFormProps) => {
//   const { addPayment, updatePayment, getSaleById, getSalePaymentStatus, updateInvoice, getInvoiceById } = useAppContext();
//   const { t } = useLanguage();
//   const sale = getSaleById(saleId);
  
//   // Calculate remaining amount based on the specific sale this payment is for
//   const salePaymentStatus = getSalePaymentStatus(saleId);
//   const remainingAmountForSale = salePaymentStatus?.remainingAmount || sale?.totalAmountTTC || 0;

//   const form = useForm<FormValues>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       date: payment?.date ? formatDateInput(payment.date) : formatDateInput(new Date()),
//       amount: payment?.amount || Math.max(0, remainingAmountForSale), // Default to remaining or 0
//       method: payment?.method || 'cash', // Default to 'cash' or an existing payment's method
//       notes: payment?.notes || '',
//     },
//     mode: "onChange",
//   });

//   if (!sale) {
//     toast.error(t('sales.notFound'));
//     return <div>{t('sales.notFound')}</div>;
//   }

//   const onSubmit = async (data: FormValues) => {
//     try {
//       const paymentDataPayload = {
//         saleId,
//         clientId: sale.clientId,
//         date: new Date(data.date), // Convert string date from form to Date object
//         amount: data.amount,
//         method: data.method,
//         notes: data.notes || undefined, // Send undefined if empty, service will handle null
//         // bulkPaymentId is not relevant here as it's not part of this form's direct input for single payments
//       };

//       if (!payment && data.amount > remainingAmountForSale && remainingAmountForSale > 0) { // Only show warning for new payments if overpaying an existing debt
//         toast.warning(
//           t('payments.warning.exceedsRemaining')
//             .replace('{amount}', formatCurrency(data.amount))
//             .replace('{remaining}', formatCurrency(remainingAmountForSale))
//         );
//       }
      
//       if (payment?.id) { // If editing an existing payment
//         // await updatePayment(payment.id, paymentDataPayload); // Assuming updatePayment exists and takes similar payload
//         toast.success("Payment updated (mocked - updatePayment not fully implemented in AppContext for this flow yet)");
//       } else { // Adding a new payment
//         await addPayment(paymentDataPayload);
//         toast.success(t('payments.recorded'));
//       }


//       // If the sale is part of an invoice, check if all sales in the invoice are now paid
//       if (sale.invoiceId) {
//         const invoice = getInvoiceById(sale.invoiceId);
//         if (invoice) {
//           // Recalculate invoice payment status after adding new payment
//           const updatedInvoiceStatus = getSalePaymentStatus(saleId); // Re-check this sale
//           let allSalesInInvoicePaid = true;
//           for (const sId of invoice.salesIds) {
//             const status = getSalePaymentStatus(sId);
//             if (!status?.isFullyPaid) {
//               allSalesInInvoicePaid = false;
//               break;
//             }
//           }

//           if (allSalesInInvoicePaid && !invoice.isPaid) {
//             await updateInvoice(sale.invoiceId, {
//               isPaid: true,
//               paidAt: new Date()
//             });
//             toast.info(`Invoice ${invoice.invoiceNumber} marked as paid.`);
//           } else if (!allSalesInInvoicePaid && invoice.isPaid) {
//             // If invoice was paid, but now a sale is not fully paid (e.g. payment deleted elsewhere)
//             await updateInvoice(sale.invoiceId, {
//               isPaid: false,
//               paidAt: undefined
//             });
//             toast.info(`Invoice ${invoice.invoiceNumber} marked as unpaid.`);
//           }
//         }
//       }
      
//       if (onSuccess) {
//         onSuccess();
//       }
//     } catch (error: any) { // Catch error as 'any' or 'unknown'
//       console.error('Error recording/updating payment in PaymentForm:', error);
//       const errorMessage = error?.message || t('payments.error'); // Use Supabase error message if available
//       toast.error(`Error: ${errorMessage}`);
//     }
//   };

//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//         <FormField
//           control={form.control}
//           name="date"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>{t('payments.date')}</FormLabel>
//               <FormControl>
//                 <Input type="date" {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         <FormField
//           control={form.control}
//           name="amount"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>{t('payments.amount')} (Restant: {formatCurrency(remainingAmountForSale)})</FormLabel>
//               <FormControl>
//                 <Input
//                   type="number"
//                   step="0.01"
//                   min="0"
//                   {...field}
//                 />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         <FormField
//           control={form.control}
//           name="method"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>{t('payments.method')}</FormLabel>
//               <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""}>
//                 <FormControl>
//                   <SelectTrigger>
//                     <SelectValue placeholder={t('payments.selectMethod')} />
//                   </SelectTrigger>
//                 </FormControl>
//                 <SelectContent>
//                   <SelectItem value="cash">{t('payments.methods.cash')}</SelectItem>
//                   <SelectItem value="bank_transfer">{t('payments.methods.bank_transfer')}</SelectItem>
//                   <SelectItem value="check">{t('payments.methods.check')}</SelectItem>
//                   <SelectItem value="term">À Terme</SelectItem> 
//                   <SelectItem value="deferred">Différé</SelectItem>
//                 </SelectContent>
//               </Select>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         <FormField
//           control={form.control}
//           name="notes"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>{t('payments.notes')}</FormLabel>
//               <FormControl>
//                 <Textarea {...field} value={field.value || ''} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         <div className="flex justify-end gap-2">
//           {onCancel && (
//             <Button type="button" variant="outline" onClick={onCancel}>
//               {t('common.cancel')}
//             </Button>
//           )}
//           <Button type="submit">
//             {payment ? t('payments.edit') : t('payments.add')} 
//           </Button>
//         </div>
//       </form>
//     </Form>
//   );
// };
import React from 'react';
import { useForm } from 'react-hook-form';
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
import { useApp } from '@/context/AppContext';
import { Payment, PaymentMethodType } from '@/types'; // Import PaymentMethodType
import { formatCurrency, formatDateInput } from '@/utils/format'; // Ensure formatDateInput is imported if used
import { useLanguage } from '@/context/LanguageContext';

// Use the shared PaymentMethodType or define specifically if PaymentForm allows different methods
const paymentFormMethods = ['cash', 'bank_transfer', 'check', 'term', 'deferred'] as const;

const formSchema = z.object({
  date: z.string().min(1, { message: "Date is required" }), // Ensure date is treated as string from input
  amount: z.coerce.number().positive({ message: "Amount must be positive" }),
  method: z.enum(paymentFormMethods), // Use the defined methods for form validation
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PaymentFormProps {
  saleId: string;
  payment?: Payment; // For editing existing payment
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PaymentForm = ({ saleId, payment, onSuccess, onCancel }: PaymentFormProps) => {
  const { addPayment, updatePayment, getSaleById, getSalePaymentStatus, updateInvoice, getInvoiceById } = useApp();
  const { t } = useLanguage();
  const sale = getSaleById(saleId);
  
  // Calculate remaining amount based on the specific sale this payment is for
  const salePaymentStatus = getSalePaymentStatus(saleId);
  const remainingAmountForSale = salePaymentStatus?.remainingAmount || sale?.totalAmountTTC || 0;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: payment?.date ? formatDateInput(payment.date) : formatDateInput(new Date()),
      amount: payment?.amount || Math.max(0, remainingAmountForSale), // Default to remaining or 0
      method: payment?.method || 'cash', // Default to 'cash' or an existing payment's method
      notes: payment?.notes || '',
    },
    mode: "onChange",
  });

  if (!sale) {
    toast.error(t('sales.notFound'));
    return <div>{t('sales.notFound')}</div>;
  }

  const onSubmit = async (data: FormValues) => {
    try {
      const paymentDataPayload = {
        saleId,
        clientId: sale.clientId,
        date: new Date(data.date), // Convert string date from form to Date object
        amount: data.amount,
        method: data.method,
        notes: data.notes || undefined, // Send undefined if empty, service will handle null
        // bulkPaymentId is not relevant here as it's not part of this form's direct input for single payments
      };

      if (!payment && data.amount > remainingAmountForSale && remainingAmountForSale > 0) { // Only show warning for new payments if overpaying an existing debt
        toast.warning(
          t('payments.warning.exceedsRemaining')
            .replace('{amount}', formatCurrency(data.amount))
            .replace('{remaining}', formatCurrency(remainingAmountForSale))
        );
      }
      
      if (payment?.id) { // If editing an existing payment
        // await updatePayment(payment.id, paymentDataPayload); // Assuming updatePayment exists and takes similar payload
        toast.success("Payment updated (mocked - updatePayment not fully implemented in AppContext for this flow yet)");
      } else { // Adding a new payment
        await addPayment(paymentDataPayload);
        toast.success(t('payments.recorded'));
      }


      // If the sale is part of an invoice, check if all sales in the invoice are now paid
      if (sale.invoiceId) {
        const invoice = getInvoiceById(sale.invoiceId);
        if (invoice) {
          // Recalculate invoice payment status after adding new payment
          const updatedInvoiceStatus = getSalePaymentStatus(saleId); // Re-check this sale
          let allSalesInInvoicePaid = true;
          for (const sId of invoice.salesIds) {
            const status = getSalePaymentStatus(sId);
            if (!status?.isFullyPaid) {
              allSalesInInvoicePaid = false;
              break;
            }
          }

          if (allSalesInInvoicePaid && !invoice.isPaid) {
            await updateInvoice(sale.invoiceId, {
              isPaid: true,
              paidAt: new Date()
            });
            toast.info(`Invoice ${invoice.invoiceNumber} marked as paid.`);
          } else if (!allSalesInInvoicePaid && invoice.isPaid) {
            // If invoice was paid, but now a sale is not fully paid (e.g. payment deleted elsewhere)
            await updateInvoice(sale.invoiceId, {
              isPaid: false,
              paidAt: undefined
            });
            toast.info(`Invoice ${invoice.invoiceNumber} marked as unpaid.`);
          }
        }
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) { // Catch error as 'any' or 'unknown'
      console.error('Error recording/updating payment in PaymentForm:', error);
      const errorMessage = error?.message || t('payments.error'); // Use Supabase error message if available
      toast.error(`Error: ${errorMessage}`);
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
              <FormLabel>{t('payments.amount')} (Restant: {formatCurrency(remainingAmountForSale)})</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...field}
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
              <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('payments.selectMethod')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cash">{t('payments.methods.cash')}</SelectItem>
                  <SelectItem value="bank_transfer">{t('payments.methods.bank_transfer')}</SelectItem>
                  <SelectItem value="check">{t('payments.methods.check')}</SelectItem>
                  {/* <SelectItem value="term">À Terme</SelectItem> 
                  <SelectItem value="deferred">Différé</SelectItem> */}
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
                <Textarea {...field} value={field.value || ''} />
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
            {payment ? t('payments.edit') : t('payments.add')} 
          </Button>
        </div>
      </form>
    </Form>
  );
};
