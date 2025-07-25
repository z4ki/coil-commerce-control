import React, { useEffect, useState, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '../../context/AppContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useInvoiceSettings } from '../../context/InvoiceSettingsContext';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Invoice, Sale, PaymentMethodType } from '@/types/index';
import { formatCurrency, formatDate, formatDateInput, generateInvoiceNumber } from '../../utils/format';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import Combobox from '@/components/ui/Combobox';

const paymentMethods = ['cash', 'bank_transfer', 'check', 'term'] as const;

const formSchema = z.object({
  prefix: z.string().min(1, { message: 'Le préfixe est requis' }),
  invoiceNumber: z.string().min(1, { message: 'Le numéro de facture est requis' }),
  clientId: z.string().min(1, { message: 'Veuillez sélectionner un client' }),
  date: z.string().min(1, { message: 'La date est requise' }),
  dueDate: z.string().min(1, { message: 'La date d\'échéance est requise' }),
  salesIds: z.array(z.string()).optional(),
  paymentMethod: z.enum(paymentMethods).optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface InvoiceFormProps {
  invoice: Invoice | null;
  onSuccess?: () => void;
}

const InvoiceForm = ({ invoice, onSuccess }: InvoiceFormProps) => {
  const {
    addInvoice,
    updateInvoice,
    clients,
    getSalesByClient,
    sales,
    getSalePaymentStatus
  } = useAppContext();
  const { settings: invoiceSettings, updateSettings: updateInvoiceSettings } = useInvoiceSettings();
  const { t } = useLanguage();

  const [clientSales, setClientSales] = useState<Sale[]>([]);
  const [selectedSales, setSelectedSales] = useState<string[]>(invoice?.salesIds || []);
  const [selectedClientId, setSelectedClientId] = useState<string>(invoice?.clientId || '');
  const [totalAmount, setTotalAmount] = useState<number>(invoice?.totalAmountTTC || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInitialPaymentMethod = useCallback(() => {
    if (invoice?.paymentMethod) return invoice.paymentMethod;
    if (selectedSales.length === 1) {
      const saleDetail = sales.find(s => s.id === selectedSales[0]);
      return saleDetail?.paymentMethod;
    }
    return undefined;
  }, [invoice, selectedSales, sales]);

  const defaultValues: FormValues = {
    prefix: invoice?.invoiceNumber?.split('-')[0] || invoiceSettings.defaultPrefix,
    invoiceNumber: invoice?.invoiceNumber || generateInvoiceNumber(invoiceSettings.defaultPrefix, invoiceSettings.nextNumber),
    clientId: invoice?.clientId || '',
    date: formatDateInput(invoice?.date || new Date()),
    dueDate: formatDateInput(invoice?.dueDate || new Date(new Date().setDate(new Date().getDate() + invoiceSettings.paymentTerms))),
    salesIds: invoice?.salesIds || [],
    paymentMethod: getInitialPaymentMethod() || undefined,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  });

  const [isInvoiceNumberManuallyEdited, setIsInvoiceNumberManuallyEdited] = useState(!!invoice);

  const calculateTotals = useCallback(() => {
    const selectedSalesData = selectedSales
      .map(id => sales.find(s => s.id === id))
      .filter((sale): sale is Sale => sale !== undefined);

    // --- START: DEBUGGING LOG ---
    // This is the most important step. It will show you the exact objects being used for the calculation.
    console.log("Sales objects being used for total calculation:", selectedSalesData);
    // --- END: DEBUGGING LOG ---

    let totalHT = 0;
    if (selectedSalesData.length > 0) {
      totalHT = selectedSalesData.reduce((sum, sale) => {
        const ht = sale.totalAmountHT ?? 0;
        return sum + (Number.isFinite(ht) ? ht : 0);
      }, 0);
    }

    totalHT = Math.round(totalHT * 100) / 100;
    const taxAmount = Math.round(totalHT * 0.19 * 100) / 100;
    const totalTTC = Math.round((totalHT + taxAmount) * 100) / 100;

    return { totalHT, totalTTC, taxAmount };
  }, [selectedSales, sales]);

  useEffect(() => {
    const prefix = form.watch('prefix');
    if (!invoice && !isInvoiceNumberManuallyEdited && invoiceSettings.autoInvoiceNumber) {
      const newInvoiceNumber = generateInvoiceNumber(prefix, invoiceSettings.nextNumber);
      form.setValue('invoiceNumber', newInvoiceNumber);
    }
  }, [form, invoice, isInvoiceNumberManuallyEdited, invoiceSettings.nextNumber, form.watch('prefix'), invoiceSettings.autoInvoiceNumber]);

  useEffect(() => {
    const clientId = form.watch('clientId');
    if (clientId) {
      const uninvoicedSales = getSalesByClient(clientId).filter(
        (sale) => !sale.isInvoiced || (invoice && invoice.salesIds.includes(sale.id))
      );
      setClientSales(uninvoicedSales);
      if (clientId !== selectedClientId) {
        setSelectedSales([]);
        form.setValue('paymentMethod', undefined, { shouldValidate: true });
      }
      setSelectedClientId(clientId);
    } else {
      setClientSales([]);
      setSelectedSales([]);
      form.setValue('paymentMethod', undefined, { shouldValidate: true });
    }
  }, [form.watch('clientId'), invoice, getSalesByClient, selectedClientId, form]);

  useEffect(() => {
    const { totalTTC } = calculateTotals();
    setTotalAmount(totalTTC);

    let newPaymentMethod: PaymentMethodType | undefined = undefined;
    if (selectedSales.length === 1) {
      const saleDetail = sales.find(s => s.id === selectedSales[0]);
      newPaymentMethod = saleDetail?.paymentMethod;
    } else if (selectedSales.length > 1) {
      const firstSaleMethod = sales.find(s => s.id === selectedSales[0])?.paymentMethod;
      const allSameMethod = selectedSales.every(id => sales.find(s => s.id === id)?.paymentMethod === firstSaleMethod);
      newPaymentMethod = allSameMethod ? firstSaleMethod : undefined;
    } else {
      newPaymentMethod = invoice?.paymentMethod || undefined;
    }

    if (form.getValues('paymentMethod') !== newPaymentMethod) {
      form.setValue('paymentMethod', newPaymentMethod, { shouldValidate: true });
    }
  }, [selectedSales, sales, calculateTotals, form, invoice?.paymentMethod]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      if (selectedSales.length === 0) {
        toast.error("Please select at least one sale to include in the invoice.");
        setIsSubmitting(false);
        return;
      }

      const { totalHT, totalTTC } = calculateTotals();

      if (!Number.isFinite(totalTTC) || totalTTC <= 0) {
        console.error("Calculation error: totalTTC is not a valid positive number.", { totalHT, totalTTC });
        toast.error("Error in calculation. Invoice total must be greater than zero.");
        setIsSubmitting(false);
        return;
      }

      const emissionDate = new Date(`${data.date}T00:00:00`);
      const expirationDate = new Date(`${data.dueDate}T00:00:00`);

      if (isNaN(emissionDate.getTime()) || isNaN(expirationDate.getTime())) {
        toast.error("Invalid date format. Please check the dates and try again.");
        setIsSubmitting(false);
        return;
      }

      const allSalesPaid = selectedSales.every(saleId => getSalePaymentStatus(saleId)?.isFullyPaid === true);

      const invoiceData = {
        invoiceNumber: data.invoiceNumber,
        clientId: data.clientId,
        date: emissionDate,
        dueDate: expirationDate,
        salesIds: selectedSales,
        totalAmountHT: totalHT,
        totalAmountTTC: totalTTC,
        taxRate: 0.19,
        isPaid: allSalesPaid,
        paidAt: allSalesPaid ? new Date() : undefined,
        paymentMethod: data.paymentMethod || undefined,
        isDeleted: false,
      };

      // SMART INCREMENT LOGIC
      const expectedAutoNumber = generateInvoiceNumber(invoiceSettings.defaultPrefix, invoiceSettings.nextNumber);
      const manualNumberMatch = data.invoiceNumber.match(/(\d+)$/);
      const manualNumber = manualNumberMatch ? parseInt(manualNumberMatch[1], 10) : null;
      if (invoiceSettings.autoInvoiceNumber && data.invoiceNumber === expectedAutoNumber) {
        // Auto mode: increment nextNumber
        updateInvoiceSettings({ nextNumber: invoiceSettings.nextNumber + 1 });
      } else if (!invoiceSettings.autoInvoiceNumber && manualNumber && manualNumber >= invoiceSettings.nextNumber) {
        // Manual mode: user entered a manual number higher than nextNumber, update nextNumber to manual+1
        updateInvoiceSettings({ nextNumber: manualNumber + 1 });
      }

      if (invoice) {
        await updateInvoice(invoice.id, invoiceData);
        toast.success('Invoice has been updated');
      } else {
        await addInvoice(invoiceData);
        toast.success('Invoice has been created');
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error submitting invoice from InvoiceForm:', error);
      toast.error('An error occurred while saving the invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Form fields... */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="prefix"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Préfixe</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (!invoice) setIsInvoiceNumberManuallyEdited(false);
                    }}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger aria-invalid={!!fieldState.error}>
                        <SelectValue placeholder="Sélectionner un préfixe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {invoiceSettings.prefixes.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Numéro de Facture</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setIsInvoiceNumberManuallyEdited(true);
                      }}
                      readOnly={!!invoiceSettings.autoInvoiceNumber && !invoice}
                      className={invoiceSettings.autoInvoiceNumber && !invoice ? 'bg-gray-100 cursor-not-allowed' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Combobox
                    value={field.value}
                    onChange={field.onChange}
                    options={clients.map((client) => ({
                      value: client.id,
                      label: `${client.name} - ${client.company}`,
                    }))}
                    placeholder="Sélectionner un client"
                    searchPlaceholder="Rechercher un client..."
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Mode de paiement</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                    defaultValue={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger aria-invalid={!!fieldState.error}>
                        <SelectValue placeholder="Sélectionner un mode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Espèces</SelectItem>
                      <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                      <SelectItem value="check">Chèque</SelectItem>
                      <SelectItem value="term">À Terme</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date d'émission</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date d'échéance</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {selectedClientId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Ventes à facturer</h3>
                <p className="text-sm text-muted-foreground">
                  Total: {formatCurrency(totalAmount)}
                </p>
              </div>
              <div className="rounded-md border max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] sticky top-0 bg-background z-10">
                        <Checkbox
                          checked={clientSales.length > 0 && selectedSales.length === clientSales.filter(s => !(s.isInvoiced && s.invoiceId !== invoice?.id)).length}
                          disabled={clientSales.filter(s => !(s.isInvoiced && s.invoiceId !== invoice?.id)).length === 0}
                          onCheckedChange={(checked) => {
                            const availableSalesIds = clientSales
                              .filter(s => !(s.isInvoiced && s.invoiceId !== invoice?.id))
                              .map(s => s.id);
                            setSelectedSales(checked ? availableSalesIds : []);
                          }}
                          aria-label="Select all available sales"
                        />
                      </TableHead>
                      <TableHead className="sticky top-0 bg-background z-10">Date</TableHead>
                      <TableHead className="sticky top-0 bg-background z-10">Description</TableHead>
                      <TableHead className="sticky top-0 bg-background z-10">Articles</TableHead>
                      <TableHead className="text-right sticky top-0 bg-background z-10">Total TTC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientSales.length > 0 &&
                      clientSales.map((sale) => (
                        <TableRow key={sale.id} data-state={selectedSales.includes(sale.id) ? "selected" : undefined}>
                          <TableCell>
                            <Checkbox
                              checked={selectedSales.includes(sale.id)}
                              onCheckedChange={(checked) => {
                                setSelectedSales(
                                  checked
                                    ? [...selectedSales, sale.id]
                                    : selectedSales.filter((id) => id !== sale.id)
                                );
                              }}
                              disabled={sale.isInvoiced && sale.invoiceId !== invoice?.id}
                              aria-labelledby={`sale-label-${sale.id}`}
                            />
                          </TableCell>
                          <TableCell id={`sale-label-${sale.id}`}>{formatDate(sale.date)}</TableCell>
                          <TableCell>Vente #{sale.id.slice(0, 8)} (Mode: {sale.paymentMethod || 'N/P'})</TableCell>
                          <TableCell>{sale.items.length} articles</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(sale.totalAmountTTC)}
                          </TableCell>
                        </TableRow>
                      ))}
                    {clientSales.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Aucune vente disponible pour ce client.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 sticky bottom-0 bg-background z-10 border-t mt-8 pb-4">
            <Button type="button" variant="outline" onClick={onSuccess}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : (invoice ? 'Mettre à jour la facture' : 'Créer la facture')}
            </Button>
          </div>
        </form>
      </Form>
    </FormProvider>
  );
};

export default InvoiceForm;
