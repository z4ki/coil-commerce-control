
import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { Sale, SaleItem } from '../../types';
import { formatDateInput, parseDateInput } from '../../utils/format';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import SaleItemForm from './SaleItemForm';

const saleItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, { message: 'Description is required' }),
  quantity: z.coerce
    .number()
    .positive({ message: 'Quantity must be positive' }),
  pricePerTon: z.coerce
    .number()
    .positive({ message: 'Price per ton must be positive' }),
  totalAmount: z.number().optional(),
});

// Update the schema to use array instead of tuple
const formSchema = z.object({
  clientId: z.string().min(1, { message: 'Please select a client' }),
  date: z.string().min(1, { message: 'Date is required' }),
  items: z.array(saleItemSchema).nonempty({
    message: 'At least one item is required',
  }),
  notes: z.string().optional(),
  isInvoiced: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface SaleFormProps {
  sale: Sale | null;
  onSuccess?: () => void;
}

const SaleForm = ({ sale, onSuccess }: SaleFormProps) => {
  const { addSale, updateSale, clients } = useAppContext();

  // Convert sale items to form values format
  const getInitialItems = () => {
    if (sale?.items?.length) {
      return sale.items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        pricePerTon: item.pricePerTon,
      }));
    }
    // Default empty item
    return [{ 
      id: uuidv4(),
      description: 'PPGI Coil', 
      quantity: 0, 
      pricePerTon: 0 
    }];
  };

  const defaultValues: FormValues = {
    clientId: sale?.clientId || '',
    date: formatDateInput(sale?.date || new Date()),
    items: getInitialItems(),
    notes: sale?.notes || '',
    isInvoiced: sale?.isInvoiced || false,
  };

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { watch, setValue } = methods;
  const items = watch('items');
  
  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => {
    return sum + (item.quantity * item.pricePerTon);
  }, 0);

  const onSubmit = (data: FormValues) => {
    // Create sale items with generated IDs and calculated totals
    const saleItems: SaleItem[] = data.items.map(item => ({
      id: item.id || uuidv4(),
      description: item.description,
      quantity: item.quantity,
      pricePerTon: item.pricePerTon,
      totalAmount: item.quantity * item.pricePerTon
    }));

    // Create a complete sale object with all required fields
    const saleData = {
      clientId: data.clientId,
      date: parseDateInput(data.date),
      items: saleItems,
      notes: data.notes,
      isInvoiced: data.isInvoiced,
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

  const addItem = () => {
    const newItems = [...items, { 
      id: uuidv4(),
      description: 'PPGI Coil', 
      quantity: 0, 
      pricePerTon: 0 
    }];
    setValue('items', newItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(index, 1);
      setValue('items', newItems);
    }
  };

  return (
    <FormProvider {...methods}>
      <Form {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={methods.control}
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
            control={methods.control}
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

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Items</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addItem}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>
            
            {items.map((item, index) => (
              <SaleItemForm
                key={item.id || index}
                index={index}
                onRemove={() => removeItem(index)}
                isRemoveDisabled={items.length <= 1}
              />
            ))}
            
            <div className="flex justify-end text-md font-medium pt-2">
              <span>Total: ${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <FormField
            control={methods.control}
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

          <FormField
            control={methods.control}
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
    </FormProvider>
  );
};

export default SaleForm;
