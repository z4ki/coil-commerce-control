
import React, { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDateInput, parseDateInput } from '../../utils/format';
import { toast } from 'sonner';
import { Sale, SaleItem } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, Plus } from 'lucide-react';

const formSchema = z.object({
  clientId: z.string().min(1, { message: 'Please select a client' }),
  date: z.string().min(1, { message: 'Date is required' }),
  items: z.array(z.object({
    id: z.string(),
    description: z.string().min(1, { message: 'Description is required' }),
    quantity: z.coerce.number().positive({ message: 'Quantity must be positive' }),
    pricePerTon: z.coerce.number().positive({ message: 'Price must be positive' }),
  })),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SaleFormProps {
  sale: Sale | null;
  onSuccess?: () => void;
}

const SaleForm = ({ sale, onSuccess }: SaleFormProps) => {
  const { addSale, updateSale, clients } = useAppContext();
  const [items, setItems] = useState(
    sale?.items.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      pricePerTon: item.pricePerTon,
    })) || [{ id: uuidv4(), description: '', quantity: 1, pricePerTon: 0 }]
  );

  const defaultValues: FormValues = {
    clientId: sale?.clientId || '',
    date: formatDateInput(sale?.date || new Date()),
    items: items,
    notes: sale?.notes || '',
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const addItem = () => {
    const newItems = [
      ...items,
      { id: uuidv4(), description: '', quantity: 1, pricePerTon: 0 },
    ];
    setItems(newItems);
    form.setValue('items', newItems);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) {
      toast.error('You must have at least one item');
      return;
    }
    
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    form.setValue('items', newItems);
  };

  const updateItem = (id: string, field: string, value: string | number) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    
    setItems(newItems);
    form.setValue('items', newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity.toString()) || 0;
      const price = parseFloat(item.pricePerTon.toString()) || 0;
      return sum + (quantity * price);
    }, 0);
  };

  const onSubmit = (data: FormValues) => {
    // Ensure all required properties are set for each SaleItem
    const itemsWithTotal: SaleItem[] = data.items.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      pricePerTon: item.pricePerTon,
      totalAmount: item.quantity * item.pricePerTon,
    }));
    
    const saleData = {
      clientId: data.clientId,
      date: parseDateInput(data.date),
      items: itemsWithTotal,
      notes: data.notes,
      isInvoiced: sale?.isInvoiced || false,
      invoiceId: sale?.invoiceId,
    };

    if (sale) {
      updateSale(sale.id, saleData);
      toast.success('Sale has been updated');
    } else {
      addSale(saleData);
      toast.success('Sale has been recorded');
    }

    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <Select
                  onValueChange={field.onChange}
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

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sale Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          {items.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-1 gap-4 p-4 border rounded-md sm:grid-cols-12"
            >
              <div className="sm:col-span-5">
                <FormField
                  control={form.control}
                  name={`items.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            updateItem(item.id, 'description', e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="sm:col-span-2">
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity (tons)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            updateItem(
                              item.id,
                              'quantity',
                              e.target.valueAsNumber || 0
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="sm:col-span-3">
                <FormField
                  control={form.control}
                  name={`items.${index}.pricePerTon`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Ton</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            updateItem(
                              item.id,
                              'pricePerTon',
                              e.target.valueAsNumber || 0
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-end justify-between sm:col-span-2">
                <div className="text-sm">
                  <span className="block text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    ${(item.quantity * item.pricePerTon).toFixed(2)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional notes about this sale"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end space-x-2 border-t pt-4">
          <span className="text-muted-foreground">Total:</span>
          <span className="text-xl font-bold">
            ${calculateTotal().toFixed(2)}
          </span>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit">{sale ? 'Update' : 'Create'} Sale</Button>
        </div>
      </form>
    </Form>
  );
};

export default SaleForm;
