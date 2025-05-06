
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
  invoiceNumber: z.string().min(1, { message: 'Invoice number is required' }),
  clientId: z.string().min(1, { message: 'Please select a client' }),
  date: z.string().min(1, { message: 'Date is required' }),
  dueDate: z.string().min(1, { message: 'Due date is required' }),
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

  const defaultValues: FormValues = {
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

  const onSubmit = (data: FormValues) => {
    if (selectedSales.length === 0) {
      toast.error('Please select at least one sale to include in the invoice');
      return;
    }

    const invoiceData = {
      ...data,
      date: parseDateInput(data.date),
      dueDate: parseDateInput(data.dueDate),
      salesIds: selectedSales,
      totalAmount: totalAmount,
    };

    if (invoice) {
      updateInvoice(invoice.id, invoiceData);
      toast.success('Invoice has been updated');
    } else {
      addInvoice(invoiceData);
      toast.success('Invoice has been created');
    }

    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                      <SelectValue placeholder="Select a client" />
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
                <FormLabel>Issue Date</FormLabel>
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
                <FormLabel>Due Date</FormLabel>
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
                <FormLabel>Mark as Paid</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Check this if the invoice has already been paid.
                </p>
              </div>
            </FormItem>
          )}
        />

        {/* Sales Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Select Sales to Include</h3>
          {selectedClientId ? (
            clientSales.length > 0 ? (
              <div className="max-h-64 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Quantity (tons)</TableHead>
                      <TableHead>Price/Ton</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedSales.includes(sale.id)}
                            onCheckedChange={() => handleSaleToggle(sale.id)}
                          />
                        </TableCell>
                        <TableCell>{formatDate(sale.date)}</TableCell>
                        <TableCell>{sale.quantity}</TableCell>
                        <TableCell>{formatCurrency(sale.pricePerTon)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(sale.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No uninvoiced sales available for this client.
              </p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Please select a client to see available sales.
            </p>
          )}
        </div>

        {/* Total Amount */}
        <div className="flex items-center justify-end space-x-2 border-t pt-4">
          <span className="text-muted-foreground">Total Amount:</span>
          <span className="text-xl font-bold">{formatCurrency(totalAmount)}</span>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" type="button" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={selectedSales.length === 0}>
            {invoice ? 'Update' : 'Create'} Invoice
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default InvoiceForm;
