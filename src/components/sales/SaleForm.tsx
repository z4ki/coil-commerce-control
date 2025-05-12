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
import { formatDateInput, parseDateInput, formatCurrency } from '../../utils/format';
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
});

type FormValues = z.infer<typeof formSchema>;

interface SaleFormProps {
  sale: Sale | null;
  onSuccess?: () => void;
}

const SaleForm = ({ sale, onSuccess }: SaleFormProps) => {
  const { addSale, updateSale, clients, getClientById } = useAppContext();
  const [items, setItems] = useState<any[]>(
    sale?.items.map(item => ({
      id: item.id,
      description: item.description,
      coilRef: item.coilRef || '',
      coilThickness: item.coilThickness,
      coilWidth: item.coilWidth,
      topCoatRAL: item.topCoatRAL || '',
      backCoatRAL: item.backCoatRAL || '',
      coilWeight: item.coilWeight,
      quantity: item.quantity,
      pricePerTon: item.pricePerTon,
    })) || [{ 
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
    }]
  );
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const defaultValues: FormValues = {
    clientId: sale?.clientId || '',
    date: formatDateInput(sale?.date || new Date()),
    items: items,
    transportationFee: sale?.transportationFee || 0,
    notes: sale?.notes || '',
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
    const newItems = [
      ...items,
      { id: uuidv4(), description: '', coilRef: '', coilThickness: undefined, coilWidth: undefined, topCoatRAL: '', backCoatRAL: '', coilWeight: undefined, quantity: 1, pricePerTon: 0 },
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

  const onSubmit = (data: FormValues) => {
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
        coilThickness: item.coilThickness,
        coilWidth: item.coilWidth,
        topCoatRAL: item.topCoatRAL,
        backCoatRAL: item.backCoatRAL,
        coilWeight: item.coilWeight,
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
        transportationFee: data.transportationFee,
        taxRate: TAX_RATE,
      };
      
      console.log("Sale data being saved:", saleData);

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
    } catch (error) {
      console.error("Error saving sale:", error);
      toast.error('Failed to save sale. Please check your inputs and try again.');
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
        doc.save(`Facture_Proforma_${formatDate(new Date(), 'YYYYMMDD')}.pdf`);
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
        doc.save(`Devis_${formatDate(new Date(), 'YYYYMMDD')}.pdf`);
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
            <SaleItemForm
              key={item.id}
              index={index}
              onRemove={() => removeItem(item.id)}
              isRemoveDisabled={items.length === 1}
            />
          ))}
        </div>

        <FormField
          control={form.control}
          name="transportationFee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transportation Fee (DZD)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
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

        <div className="flex flex-col items-end space-y-2 border-t pt-4">
          <div className="flex justify-between w-full max-w-xs">
            <span className="text-muted-foreground">Subtotal (HT):</span>
            <span className="font-medium">
              {formatCurrency(calculateSubtotal())}
            </span>
          </div>
          <div className="flex justify-between w-full max-w-xs">
            <span className="text-muted-foreground">TVA ({TAX_RATE * 100}%):</span>
            <span className="font-medium">
              {formatCurrency(calculateTax())}
            </span>
          </div>
          <div className="flex justify-between w-full max-w-xs">
            <span className="text-muted-foreground">Total (TTC):</span>
            <span className="font-medium">
              {formatCurrency(calculateTotalWithTax())}
            </span>
          </div>
          <div className="flex justify-between w-full max-w-xs">
            <span className="text-muted-foreground">Transportation Fee:</span>
            <span className="font-medium">
              {formatCurrency(parseFloat(form.watch('transportationFee')?.toString() || '0'))}
            </span>
          </div>
          <div className="flex justify-between w-full max-w-xs pt-2 border-t">
            <span className="font-bold">Final Total:</span>
            <span className="text-xl font-bold">
              {formatCurrency(calculateFinalTotal())}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleExportQuotation}
              disabled={isGeneratingPDF}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export Quotation
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleExportInvoice}
              disabled={isGeneratingPDF}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Invoice
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={onSuccess}>
              Cancel
            </Button>
            <Button type="submit">{sale ? 'Update' : 'Create'} Sale</Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default SaleForm;
