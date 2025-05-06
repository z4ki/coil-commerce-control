
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sale } from '../../types';
import { formatDateInput, parseDateInput } from '../../utils/format';
import { toast } from 'sonner';

const formSchema = z.object({
  clientId: z.string().min(1, { message: 'Please select a client' }),
  date: z.string().min(1, { message: 'Date is required' }),
  quantity: z.coerce
    .number()
    .positive({ message: 'Quantity must be positive' }),
  pricePerTon: z.coerce
    .number()
    .positive({ message: 'Price per ton must be positive' }),
  isInvoiced: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface SaleFormProps {
  sale: Sale | null;
  onSuccess?: () => void;
}

const SaleForm = ({ sale, onSuccess }: SaleFormProps) => {
  const { addSale, updateSale, clients } = useAppContext();

  const defaultValues: FormValues = {
    clientId: sale?.clientId || '',
    date: formatDateInput(sale?.date || new Date()),
    quantity: sale?.quantity || 0,
    pricePerTon: sale?.pricePerTon || 0,
    isInvoiced: sale?.isInvoiced || false,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = (data: FormValues) => {
    const saleData = {
      ...data,
      date: parseDateInput(data.date),
    };

    if (sale) {
      updateSale(sale.id, saleData);
      toast.success('Sale has been updated');
    } else {
      addSale(saleData);
      toast.success('Sale has been added');
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
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
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

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity (tons)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pricePerTon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price per Ton</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isInvoiced"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Mark as Invoiced</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Check this if an invoice has already been created for this sale.
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" type="button" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit">
            {sale ? 'Update' : 'Add'} Sale
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default SaleForm;
