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
      calculateTotalAmount(updatedSelectedSales);
    }
  }, [form.watch('clientId')]);

  // Calculate total amount whenever selected sales change
  const calculateTotalAmount = (saleIds: string[]) => {
    const total = saleIds.reduce((sum, saleId) => {
      const sale = sales.find((s) => s.id === saleId);
      return sum + (sale ? sale.totalAmount : 0);
    }, 0);
    setTotalAmount(total);
  };

  // Handle sale selection
  const handleSaleToggle = (saleId: string) => {
    const newSelectedSales = selectedSales.includes(saleId)
      ? selectedSales.filter((id) => id !== saleId)
      : [...selectedSales, saleId];
    
    setSelectedSales(newSelectedSales);
    calculateTotalAmount(newSelectedSales);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      if (selectedSales.length === 0) {
        toast.error('Please select at least one sale to include in the invoice');
        return;
      }

      setIsSubmitting(true);

      // Ensure all required fields are provided
      const invoiceData = {
        invoiceNumber: data.invoiceNumber,
        clientId: data.clientId,
        date: parseDateInput(data.date),
        dueDate: parseDateInput(data.dueDate),
        salesIds: selectedSales,
        totalAmount: totalAmount,
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
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Articles</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientSales.length > 0 ? (
                    clientSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedSales.includes(sale.id)}
                            onCheckedChange={() => handleSaleToggle(sale.id)}
                          />
                        </TableCell>
                        <TableCell>{formatDate(sale.date)}</TableCell>
                        <TableCell>Vente de bobines PPGI</TableCell>
                        <TableCell>{sale.items.length} articles</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(sale.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Aucune vente non facturée trouvée pour ce client.
                      </TableCell>
                    </TableRow>
                  )}
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
