import React, { useEffect, useState } from 'react';
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
import { Invoice, Sale } from '../../types';
import { formatCurrency, formatDate, formatDateInput, generateInvoiceNumber, parseDateInput } from '../../utils/format';
import { toast } from 'sonner';

const formSchema = z.object({
  prefix: z.string().min(1, { message: 'Le préfixe est requis' }),
  invoiceNumber: z.string().min(1, { message: 'Le numéro de facture est requis' }),
  clientId: z.string().min(1, { message: 'Veuillez sélectionner un client' }),
  date: z.string().min(1, { message: 'La date est requise' }),
  dueDate: z.string().min(1, { message: 'La date d\'échéance est requise' }),
  isPaid: z.boolean().default(false),
  salesIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InvoiceFormProps {
  invoice: Invoice | null;
  onSuccess?: () => void;
}

const InvoiceForm = ({ invoice, onSuccess }: InvoiceFormProps) => {
  const { addInvoice, updateInvoice, clients, getSalesByClient, sales, getClientById } = useAppContext();
  const [clientSales, setClientSales] = useState<Sale[]>([]);
  const [selectedSales, setSelectedSales] = useState<string[]>(invoice?.salesIds || []);
  const [selectedClientId, setSelectedClientId] = useState<string>(invoice?.clientId || '');
  const [totalAmount, setTotalAmount] = useState<number>(invoice?.totalAmount || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues: FormValues = {
    prefix: invoice?.invoiceNumber?.split('-')[0] || 'FAC',
    invoiceNumber: invoice?.invoiceNumber || generateInvoiceNumber(),
    clientId: invoice?.clientId || '',
    date: formatDateInput(invoice?.date || new Date()),
    dueDate: formatDateInput(invoice?.dueDate || new Date(new Date().setDate(new Date().getDate() + 30))),
    isPaid: invoice?.isPaid || false,
    salesIds: invoice?.salesIds || [],
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Update invoice number when prefix changes
  useEffect(() => {
    const prefix = form.watch('prefix');
    if (!invoice) { // Only auto-generate for new invoices
      const newInvoiceNumber = generateInvoiceNumber(prefix);
      form.setValue('invoiceNumber', newInvoiceNumber);
    }
  }, [form.watch('prefix')]);

  // When client is changed, update available sales
  useEffect(() => {
    const clientId = form.getValues('clientId');
    if (clientId) {
      const uninvoicedSales = getSalesByClient(clientId).filter(
        (sale) => !sale.isInvoiced || (invoice && invoice.salesIds.includes(sale.id))
      );
      setClientSales(uninvoicedSales);
      setSelectedClientId(clientId);
      
      // Update selected sales based on client change
      const validSaleIds = uninvoicedSales.map((sale) => sale.id);
      const updatedSelectedSales = selectedSales.filter((saleId) =>
        validSaleIds.includes(saleId)
      );
      setSelectedSales(updatedSelectedSales);
      
      // Update total amount
      calculateTotals();
    }
  }, [form.watch('clientId')]);

  // Calculate totals
  const calculateTotals = () => {
    const selectedSalesData = selectedSales.map(id => sales.find(s => s.id === id)).filter(Boolean);
    const totalHT = selectedSalesData.reduce((sum, sale) => sum + (sale?.totalAmountHT || 0), 0);
    const totalTTC = selectedSalesData.reduce((sum, sale) => sum + (sale?.totalAmountTTC || 0), 0);
    return { totalHT, totalTTC };
  };

  useEffect(() => {
    const { totalHT, totalTTC } = calculateTotals();
    setTotalAmount(totalTTC); // Use TTC as the main amount
  }, [selectedSales, sales]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (selectedSales.length === 0) {
        toast.error('Please select at least one sale to include in the invoice');
        return;
      }

      setIsSubmitting(true);

      const { totalHT, totalTTC } = calculateTotals();

      // Ensure all required fields are provided
      const invoiceData = {
        invoiceNumber: data.invoiceNumber,
        clientId: data.clientId,
        date: parseDateInput(data.date),
        dueDate: parseDateInput(data.dueDate),
        salesIds: selectedSales,
        totalAmountHT: totalHT,
        totalAmountTTC: totalTTC,
        taxRate: 0.19,
        isPaid: data.isPaid,
      };

      if (invoice) {
        await updateInvoice(invoice.id, invoiceData);
        toast.success('Invoice has been updated');
      } else {
        await addInvoice(invoiceData);
        toast.success('Invoice has been created');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="prefix"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Préfixe</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un préfixe" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FAC">FAC</SelectItem>
                    <SelectItem value="PRO">PRO</SelectItem>
                    <SelectItem value="DEV">DEV</SelectItem>
                    <SelectItem value="BL">BL</SelectItem>
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
                  <Input {...field} />
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
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedClientId(value);
                  }}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.company}
                      </SelectItem>
                    ))}
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

        <FormField
          control={form.control}
          name="isPaid"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Marquer comme payée</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Cochez cette case si la facture a déjà été payée.
                </p>
              </div>
            </FormItem>
          )}
        />

        {selectedClientId && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Ventes à facturer</h3>
              <p className="text-sm text-muted-foreground">
                Total: {formatCurrency(totalAmount)}
              </p>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Select</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total TTC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedSales.includes(sale.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSales([...selectedSales, sale.id]);
                            } else {
                              setSelectedSales(selectedSales.filter(id => id !== sale.id));
                            }
                          }}
                          disabled={sale.isInvoiced && sale.invoiceId !== invoice?.id}
                        />
                      </TableCell>
                      <TableCell>{formatDate(sale.date)}</TableCell>
                      <TableCell>Sale #{sale.id.slice(0, 8)}</TableCell>
                      <TableCell>{sale.items.length} items</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(sale.totalAmountTTC)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {invoice ? 'Mettre à jour' : 'Créer la facture'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default InvoiceForm;
