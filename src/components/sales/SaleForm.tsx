import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDateInput, parseDateInput, formatCurrency, formatDate } from '../../utils/format';
import { toast } from 'sonner';
import { Sale, SaleItem } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, FileText, Download } from 'lucide-react';
import SaleItemForm from './SaleItemForm';
import { generateSalePDF } from '../../utils/pdfService';

// Tax rate constant
const TAX_RATE = 0.19; // 19%

const formSchema = z.object({
  clientId: z.string().min(1, { message: 'Please select a client' }),
  date: z.string().min(1, { message: 'Date is required' }),
  items: z.array(z.object({
    id: z.string(),
    description: z.string().min(1, { message: 'Description is required' }),
    coilRef: z.string().optional(),
    coilThickness: z.number().optional(),
    coilWidth: z.number().optional(),
    topCoatRAL: z.string().optional(),
    backCoatRAL: z.string().optional(),
    coilWeight: z.number().optional(),
    quantity: z.coerce.number().positive({ message: 'Quantity must be positive' }),
    pricePerTon: z.coerce.number().positive({ message: 'Price must be positive' }),
  })).min(1, { message: 'At least one item is required' }),
  transportationFee: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  paymentMethod: z.string().min(1, { message: 'Please select a payment method' }),
});

type FormValues = z.infer<typeof formSchema>;

interface SaleFormProps {
  sale: Sale | null;
  onSuccess?: () => void;
}

interface SaleItemFormData {
  id: string;
  description: string;
  coilRef: string;
  coilThickness?: number;
  coilWidth?: number;
  topCoatRAL: string;
  backCoatRAL: string;
  coilWeight?: number;
  quantity: number;
  pricePerTon: number;
}

const SaleForm = ({ sale, onSuccess }: SaleFormProps) => {
  const { addSale, updateSale, clients, getClientById } = useAppContext();
  const [items, setItems] = useState<SaleItemFormData[]>(
    sale?.items.map(item => ({
      id: item.id,
      description: item.description,
      coilRef: item.coilRef || '',
      coilThickness: item.coilThickness || 0,
      coilWidth: item.coilWidth || 0,
      topCoatRAL: item.topCoatRAL || '',
      backCoatRAL: item.backCoatRAL || '',
      coilWeight: item.coilWeight || 0,
      quantity: item.quantity,
      pricePerTon: item.pricePerTon,
    })) || [{ 
      id: uuidv4(), 
      description: '', 
      coilRef: '', 
      coilThickness: 0,
      coilWidth: 0,
      topCoatRAL: '',
      backCoatRAL: '',
      coilWeight: 0,
      quantity: 1, 
      pricePerTon: 0 
    }]
  );
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const defaultValues: FormValues = {
    clientId: sale?.clientId || '',
    date: formatDateInput(sale?.date || new Date()),
    items: items,
    transportationFee: sale?.transportationFee || 0,
    notes: sale?.notes || '',
    paymentMethod: sale?.paymentMethod || '',
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Debug logging for form state
  useEffect(() => {
    const subscription = form.watch((value) => {
      console.log("Form values:", value);
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const addItem = () => {
    const newItem: SaleItemFormData = {
      id: uuidv4(),
      description: '',
      coilRef: '',
      coilThickness: undefined,
      coilWidth: undefined,
      topCoatRAL: '',
      backCoatRAL: '',
      coilWeight: undefined,
      quantity: 1,
      pricePerTon: 0
    };

    const currentItems = (form.getValues('items') || []).map(item => ({
      ...item,
      id: item.id || uuidv4(),
      description: item.description || '',
      coilRef: item.coilRef || '',
      topCoatRAL: item.topCoatRAL || '',
      backCoatRAL: item.backCoatRAL || '',
      quantity: item.quantity || 1,
      pricePerTon: item.pricePerTon || 0
    })) as SaleItemFormData[];

    const newItems = [...currentItems, newItem];
    
    setItems(newItems);
    form.setValue('items', newItems, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  const removeItem = (id: string) => {
    if (items.length === 1) {
      toast.error('You must have at least one item');
      return;
    }
    
    const currentItems = (form.getValues('items') || []).map(item => ({
      ...item,
      id: item.id || uuidv4(),
      description: item.description || '',
      coilRef: item.coilRef || '',
      topCoatRAL: item.topCoatRAL || '',
      backCoatRAL: item.backCoatRAL || '',
      quantity: item.quantity || 1,
      pricePerTon: item.pricePerTon || 0
    })) as SaleItemFormData[];

    const newItems = currentItems.filter(item => item.id !== id);
    
    setItems(newItems);
    form.setValue('items', newItems, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  // Calculate subtotal (HT) - sum of all items before tax
  const calculateSubtotal = () => {
    return form.watch('items')?.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity?.toString() || '0');
      const price = parseFloat(item.pricePerTon?.toString() || '0');
      return sum + (quantity * price);
    }, 0) || 0;
  };

  // Calculate tax amount
  const calculateTax = () => {
    return calculateSubtotal() * TAX_RATE;
  };

  // Calculate total with tax (TTC)
  const calculateTotalWithTax = () => {
    return calculateSubtotal() + calculateTax();
  };

  // Calculate final total with transportation fee
  const calculateFinalTotal = () => {
    const transportationFee = parseFloat(form.watch('transportationFee')?.toString() || '0');
    return calculateTotalWithTax() + transportationFee;
  };

  const onSubmit = async (data: FormValues) => {
    console.log("Submitting form with data:", data);
    
    if (!data.clientId) {
      toast.error('Please select a client');
      return;
    }
    
    if (!data.items || data.items.length === 0) {
      toast.error('At least one item is required');
      return;
    }
    
    try {
      // Ensure all required properties are set for each SaleItem
      const itemsWithTotal: SaleItem[] = data.items.map(item => ({
        id: item.id,
        description: item.description,
        coilRef: item.coilRef || '',
        coilThickness: item.coilThickness || 0,
        coilWidth: item.coilWidth || 0,
        topCoatRAL: item.topCoatRAL || '',
        backCoatRAL: item.backCoatRAL || '',
        coilWeight: item.coilWeight || 0,
        quantity: item.quantity,
        pricePerTon: item.pricePerTon,
        totalAmount: item.quantity * item.pricePerTon,
      }));
      
      const saleData = {
        clientId: data.clientId,
        date: parseDateInput(data.date),
        items: itemsWithTotal,
        notes: data.notes || '',
        isInvoiced: sale?.isInvoiced || false,
        invoiceId: sale?.invoiceId,
        transportationFee: data.transportationFee || 0,
        taxRate: TAX_RATE,
        totalAmount: calculateFinalTotal(),
        paymentMethod: data.paymentMethod,
      };
      
      console.log("Sale data being saved:", saleData);

      if (sale) {
        await updateSale(sale.id, saleData);
        toast.success('Sale has been updated');
      } else {
        await addSale(saleData);
        toast.success('Sale has been recorded');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving sale:", error);
      if (error instanceof Error) {
        toast.error(`Failed to save sale: ${error.message}`);
      } else {
        toast.error('Failed to save sale. Please check your inputs and try again.');
      }
    }
  };

  const handleExportInvoice = () => {
    const formData = form.getValues();
    if (!formData.clientId) {
      toast.error('Please select a client first');
      return;
    }

    const client = getClientById(formData.clientId);
    if (!client) {
      toast.error('Selected client not found');
      return;
    }

    setIsGeneratingPDF(true);
    
    // Create a temporary sale object for PDF generation
    const tempSale: Sale = {
      id: sale?.id || uuidv4(),
      clientId: formData.clientId,
      date: parseDateInput(formData.date),
      items: formData.items.map(item => ({
        id: item.id,
        description: item.description,
        coilRef: item.coilRef,
        coilThickness: item.coilThickness,
        coilWidth: item.coilWidth,
        topCoatRAL: item.topCoatRAL,
        backCoatRAL: item.backCoatRAL,
        coilWeight: item.coilWeight,
        quantity: item.quantity,
        pricePerTon: item.pricePerTon,
        totalAmount: item.quantity * item.pricePerTon,
      })),
      totalAmount: calculateSubtotal(),
      isInvoiced: sale?.isInvoiced || false,
      notes: formData.notes,
      transportationFee: formData.transportationFee,
      taxRate: TAX_RATE,
      createdAt: sale?.createdAt || new Date(),
    };

    setTimeout(async () => {
      try {
        const doc = await generateSalePDF(tempSale, client, { title: 'FACTURE PROFORMA' });
        doc.save(`Facture_Proforma_${formatDate(new Date())}.pdf`);
        toast.success('Invoice PDF downloaded successfully');
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Error generating PDF. Please try again.');
      } finally {
        setIsGeneratingPDF(false);
      }
    }, 100);
  };

  const handleExportQuotation = () => {
    const formData = form.getValues();
    if (!formData.clientId) {
      toast.error('Please select a client first');
      return;
    }

    const client = getClientById(formData.clientId);
    if (!client) {
      toast.error('Selected client not found');
      return;
    }

    setIsGeneratingPDF(true);
    
    // Create a temporary sale object for PDF generation
    const tempSale: Sale = {
      id: sale?.id || uuidv4(),
      clientId: formData.clientId,
      date: parseDateInput(formData.date),
      items: formData.items.map(item => ({
        id: item.id,
        description: item.description,
        coilRef: item.coilRef,
        coilThickness: item.coilThickness,
        coilWidth: item.coilWidth,
        topCoatRAL: item.topCoatRAL,
        backCoatRAL: item.backCoatRAL,
        coilWeight: item.coilWeight,
        quantity: item.quantity,
        pricePerTon: item.pricePerTon,
        totalAmount: item.quantity * item.pricePerTon,
      })),
      totalAmount: calculateSubtotal(),
      isInvoiced: sale?.isInvoiced || false,
      notes: formData.notes,
      transportationFee: formData.transportationFee,
      taxRate: TAX_RATE,
      createdAt: sale?.createdAt || new Date(),
    };

    setTimeout(async () => {
      try {
        const doc = await generateSalePDF(tempSale, client);
        doc.save(`Devis_${formatDate(new Date())}.pdf`);
        toast.success('Quotation PDF downloaded successfully');
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Error generating PDF. Please try again.');
      } finally {
        setIsGeneratingPDF(false);
      }
    }, 100);
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <SelectContent className="max-h-[200px]">
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

          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Sale Items</h3>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </div>

          <div className="space-y-4 max-h-[40vh] overflow-y-auto rounded-md border p-4">
            {items.map((item, index) => (
              <SaleItemForm
                key={item.id}
                index={index}
                onRemove={() => removeItem(item.id)}
                isRemoveDisabled={items.length === 1}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="transportationFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transportation Fee</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e.target.valueAsNumber || 0);
                    }}
                  />
                </FormControl>
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
                  <Textarea placeholder="Add any additional notes here..." {...field} className="resize-none" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="bg-muted/30 p-4 rounded-md space-y-2">
          <div className="flex justify-between">
            <span>Subtotal (HT):</span>
            <span>{formatCurrency(calculateSubtotal())}</span>
          </div>
          <div className="flex justify-between">
            <span>TVA ({(TAX_RATE * 100).toFixed(0)}%):</span>
            <span>{formatCurrency(calculateTax())}</span>
          </div>
          <div className="flex justify-between">
            <span>Total (TTC):</span>
            <span>{formatCurrency(calculateTotalWithTax())}</span>
          </div>
          {form.watch('transportationFee') > 0 && (
            <div className="flex justify-between">
              <span>Transportation Fee:</span>
              <span>{formatCurrency(form.watch('transportationFee'))}</span>
            </div>
          )}
          <div className="flex justify-between font-bold pt-2 border-t">
            <span>Final Total:</span>
            <span>{formatCurrency(calculateFinalTotal())}</span>
          </div>
        </div>

        <div className="flex justify-between pt-4 sticky bottom-0 bg-background z-50 border-t">
          <div className="flex gap-2">
            <Button type="submit" disabled={isGeneratingPDF}>
              {sale ? 'Update Sale' : 'Create Sale'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExportQuotation}
              disabled={isGeneratingPDF}
            >
              <FileText className="h-4 w-4 mr-1" /> Export Quotation
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExportInvoice}
              disabled={isGeneratingPDF}
            >
              <Download className="h-4 w-4 mr-1" /> Export Invoice
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default SaleForm;
