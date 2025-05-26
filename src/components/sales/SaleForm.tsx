import React, { useState, useEffect } from 'react';
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form';
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
import { generateSalePDF, saveSalePDF } from '../../utils/pdfService.tsx';
import { useLanguage } from '../../context/LanguageContext';

// Tax rate constant
const TAX_RATE = 0.19; // 19%

type PaymentMethod = 'cash' | 'bank_transfer' | 'check';

type FormValues = {
  clientId: string;
  date: string;
  items: {
    id: string;
    description: string;
    coilRef?: string;
    coilThickness?: number;
    coilWidth?: number;
    topCoatRAL?: string;
    backCoatRAL?: string;
    coilWeight?: number;
    quantity: number;
    pricePerTon: number;
    totalAmountHT: number;
    totalAmountTTC: number;
  }[];
  transportationFee: number;
  notes?: string;
  paymentMethod: PaymentMethod;
};

interface SaleFormProps {
  sale?: Sale;
  onSuccess?: () => void;
}

interface SaleItemFormData {
  id: string;
  description: string;
  coilRef?: string;
  coilThickness?: number;
  coilWidth?: number;
  topCoatRAL?: string;
  backCoatRAL?: string;
  coilWeight?: number;
  quantity: number;
  pricePerTon: number;
  totalAmountHT: number;
  totalAmountTTC: number;
  sale_id?: string;
}

const SaleForm = ({ sale, onSuccess }: SaleFormProps) => {
  const { addSale, updateSale, clients, getClientById } = useAppContext();
  const { t } = useLanguage();

  const formSchema = z.object({
    clientId: z.string().min(1, { message: t('form.required') }),
    date: z.string().min(1, { message: t('form.required') }),
    items: z.array(z.object({
      id: z.string(),
      description: z.string().min(1, { message: t('form.required') }),
      coilRef: z.string().optional(),
      coilThickness: z.coerce.number().min(0).optional(),
      coilWidth: z.coerce.number().min(0).optional(),
      topCoatRAL: z.string().optional(),
      backCoatRAL: z.string().optional(),
      coilWeight: z.coerce.number().min(0).optional(),
      quantity: z.coerce.number().positive({ message: t('form.sale.quantityPositive') }),
      pricePerTon: z.coerce.number().positive({ message: t('form.sale.pricePositive') }),
      totalAmountHT: z.number(),
      totalAmountTTC: z.number(),
    })).min(1, { message: t('form.sale.itemRequired') }),
    transportationFee: z.coerce.number().min(0),
    notes: z.string().optional(),
    paymentMethod: z.enum(['cash', 'bank_transfer', 'check'])
  }) as z.ZodType<FormValues>;

  const [items, setItems] = useState<SaleItemFormData[]>(
    sale?.items.map(item => ({
      id: item.id,
      description: item.description,
      coilRef: item.coilRef || '',
      coilThickness: Number(item.coilThickness) || 0,
      coilWidth: Number(item.coilWidth) || 0,
      topCoatRAL: item.topCoatRAL || '',
      backCoatRAL: item.backCoatRAL || '',
      coilWeight: Number(item.coilWeight) || 0,
      quantity: item.quantity,
      pricePerTon: Number(item.pricePerTon) || 0,
      totalAmountHT: item.totalAmountHT,
      totalAmountTTC: item.totalAmountTTC
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
      pricePerTon: 0,
      totalAmountHT: 0,
      totalAmountTTC: 0
    }]
  );
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: sale?.clientId || '',
      date: formatDateInput(sale?.date || new Date()),
      items: sale?.items.map(item => ({
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
        totalAmountHT: item.totalAmountHT,
        totalAmountTTC: item.totalAmountTTC
      })) || [],
      transportationFee: sale?.transportationFee || 0,
      notes: sale?.notes || '',
      paymentMethod: sale?.paymentMethod || 'cash'
    }
  });

  // Debug logging for form state
  useEffect(() => {
    const subscription = form.watch((value) => {
      // console.log("Form values:", value);
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const addItem = () => {
    const newItem: SaleItemFormData = {
      id: uuidv4(),
      description: '',
      coilRef: '',
      coilThickness: 0,
      coilWidth: 0,
      topCoatRAL: '',
      backCoatRAL: '',
      coilWeight: 0,
      quantity: 1,
      pricePerTon: 0,
      totalAmountHT: 0,
      totalAmountTTC: 0
    };

    const currentItems = (form.getValues('items') || []).map(item => {
      const { totalHT, totalTTC } = calculateItemTotal({
        id: item.id || uuidv4(),
        description: item.description || '',
        coilRef: item.coilRef || '',
        topCoatRAL: item.topCoatRAL || '',
        backCoatRAL: item.backCoatRAL || '',
        quantity: Number(item.quantity || 1),
        pricePerTon: Number(item.pricePerTon || 0),
        totalAmountHT: Number(item.totalAmountHT || 0),
        totalAmountTTC: Number(item.totalAmountTTC || 0)
      } as SaleItemFormData);

      return {
        id: item.id || uuidv4(),
        description: item.description || '',
        coilRef: item.coilRef || '',
        coilThickness: Number(item.coilThickness) || 0,
        coilWidth: Number(item.coilWidth) || 0,
        topCoatRAL: item.topCoatRAL || '',
        backCoatRAL: item.backCoatRAL || '',
        coilWeight: Number(item.coilWeight) || 0,
        quantity: Number(item.quantity || 1),
        pricePerTon: Number(item.pricePerTon || 0),
        totalAmountHT: totalHT,
        totalAmountTTC: totalTTC
      };
    });

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
      toast.error(t('form.sale.itemRequired'));
      return;
    }
    
    const currentItems = (form.getValues('items') || []).map(item => {
      const { totalHT, totalTTC } = calculateItemTotal({
        id: item.id || uuidv4(),
        description: item.description || '',
        coilRef: item.coilRef || '',
        topCoatRAL: item.topCoatRAL || '',
        backCoatRAL: item.backCoatRAL || '',
        quantity: Number(item.quantity || 1),
        pricePerTon: Number(item.pricePerTon || 0),
        totalAmountHT: Number(item.totalAmountHT || 0),
        totalAmountTTC: Number(item.totalAmountTTC || 0)
      } as SaleItemFormData);

      return {
        id: item.id || uuidv4(),
        description: item.description || '',
        coilRef: item.coilRef || '',
        coilThickness: Number(item.coilThickness) || 0,
        coilWidth: Number(item.coilWidth) || 0,
        topCoatRAL: item.topCoatRAL || '',
        backCoatRAL: item.backCoatRAL || '',
        coilWeight: Number(item.coilWeight) || 0,
        quantity: Number(item.quantity || 1),
        pricePerTon: Number(item.pricePerTon || 0),
        totalAmountHT: totalHT,
        totalAmountTTC: totalTTC
      };
    });

    const newItems = currentItems.filter(item => item.id !== id);
    
    setItems(newItems);
    form.setValue('items', newItems, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  // Calculate totals for this item
  const calculateItemTotal = (item: SaleItemFormData) => {
    const quantity = Number(item.quantity || 0);
    const pricePerTon = Number(item.pricePerTon || 0);
    const totalHT = quantity * pricePerTon;
    return {
      totalHT,
      totalTTC: totalHT * (1 + TAX_RATE)
    };
  };

  const calculateFinalTotal = () => {
    const itemsTotalHT = items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const pricePerTon = Number(item.pricePerTon || 0);
      return sum + (quantity * pricePerTon);
    }, 0);

    const transportationFee = Number(form.getValues('transportationFee') || 0);
    const totalHT = itemsTotalHT + transportationFee;
    const tva = totalHT * TAX_RATE;
    const totalTTC = totalHT + tva;
    
    return {
      itemsTotalHT,
      transportationFee,
      totalHT,
      tva,
      totalTTC
    };
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      // Calculate final totals first
      const finalTotals = calculateFinalTotal();
      
      // Calculate totals for each item
      const itemsWithTotal: SaleItem[] = data.items.map(item => {
        const quantity = Number(item.quantity || 0);
        const pricePerTon = Number(item.pricePerTon || 0);
        const totalHT = quantity * pricePerTon;
        const totalTTC = totalHT * (1 + TAX_RATE);

        return {
          id: item.id,
          description: item.description,
          coilRef: item.coilRef || '',
          coilThickness: Number(item.coilThickness || 0),
          coilWidth: Number(item.coilWidth || 0),
          topCoatRAL: item.topCoatRAL || '',
          backCoatRAL: item.backCoatRAL || '',
          coilWeight: Number(item.coilWeight || 0),
          quantity: quantity,
          pricePerTon: pricePerTon,
          totalAmountHT: totalHT,
          totalAmountTTC: totalTTC
        };
      });
      
      const saleData = {
        clientId: data.clientId,
        date: parseDateInput(data.date),
        items: itemsWithTotal,
        notes: data.notes || '',
        isInvoiced: sale?.isInvoiced || false,
        invoiceId: sale?.invoiceId,
        transportationFee: Number(data.transportationFee || 0),
        taxRate: TAX_RATE,
        totalAmountHT: finalTotals.totalHT,
        totalAmountTTC: finalTotals.totalTTC,
        paymentMethod: data.paymentMethod
      };

      if (sale) {
        await updateSale(sale.id, saleData);
        toast.success(t('form.success'));
      } else {
        await addSale(saleData);
        toast.success(t('form.success'));
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving sale:', error);
      toast.error(t('form.error'));
    }
  };

  const handleExportPDF = async () => {
    const formData = form.getValues();
    if (!formData.clientId) {
      toast.error(t('form.error'));
      return;
    }

    const client = getClientById(formData.clientId);
    if (!client) {
      toast.error(t('sales.clientNotFound'));
      return;
    }

    setIsGeneratingPDF(true);
    
    // Create a temporary sale object for PDF generation
    const tempSale: Sale = {
      id: sale?.id || uuidv4(),
      clientId: formData.clientId,
      date: parseDateInput(formData.date),
      items: formData.items.map(item => {
        const quantity = Number(item.quantity || 0);
        const pricePerTon = Number(item.pricePerTon || 0);
        const totalHT = quantity * pricePerTon;
        const totalTTC = totalHT * (1 + TAX_RATE);
        
        return {
          id: item.id,
          description: item.description,
          coilRef: item.coilRef,
          coilThickness: item.coilThickness,
          coilWidth: item.coilWidth,
          topCoatRAL: item.topCoatRAL,
          backCoatRAL: item.backCoatRAL,
          coilWeight: item.coilWeight,
          quantity: quantity,
          pricePerTon: pricePerTon,
          totalAmountHT: totalHT,
          totalAmountTTC: totalTTC
        };
      }),
      totalAmountHT: calculateFinalTotal().totalHT,
      totalAmountTTC: calculateFinalTotal().totalTTC,
      isInvoiced: sale?.isInvoiced || false,
      notes: formData.notes,
      transportationFee: formData.transportationFee,
      taxRate: TAX_RATE,
      createdAt: sale?.createdAt || new Date(),
      updatedAt: new Date(),
      paymentMethod: formData.paymentMethod,
    };

    try {
      await saveSalePDF(tempSale, client);
      toast.success(t('sales.pdfGenerated'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('sales.pdfError'));
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-6">
        {/* Main content area */}
        <div className="flex-1 space-y-6">
          {/* Client and Date Selection */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.sale.client')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('form.sale.selectClient')} />
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
                  <FormLabel>{t('form.sale.date')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{t('form.sale.items')}</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" /> {t('form.sale.addItem')}
              </Button>
            </div>

            <div className="space-y-4">
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

          {/* Additional Information */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="transportationFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.sale.transportationFee')}</FormLabel>
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
          </div>

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('saleForm.notes')}</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Payment Method */}
          <FormField
            control={form.control as any}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('sales.paymentMethod')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('sales.selectPaymentMethod')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cash">{t('payments.methods.cash')}</SelectItem>
                    <SelectItem value="bank_transfer">{t('payments.methods.bank_transfer')}</SelectItem>
                    <SelectItem value="check">{t('payments.methods.check')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Sidebar with totals and actions */}
        <div className="w-72 space-y-6">
          <div className="space-y-4 rounded-md border p-4 bg-muted/50">
            <h3 className="font-medium">{t('form.sale.summary')}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('form.sale.subtotalHT')}:</span>
                <span>{formatCurrency(calculateFinalTotal().itemsTotalHT)}</span>
              </div>
              {form.watch('transportationFee') > 0 && (
                <div className="flex justify-between text-sm">
                  <span>{t('form.sale.transportationFee')}:</span>
                  <span>{formatCurrency(form.watch('transportationFee'))}</span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-2 border-t">
                <span>{t('form.sale.totalHT')}:</span>
                <span>{formatCurrency(calculateFinalTotal().totalHT)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t('form.sale.tva')} ({(TAX_RATE * 100).toFixed(0)}%):</span>
                <span>{formatCurrency(calculateFinalTotal().tva)}</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>{t('form.sale.totalTTC')}:</span>
                <span>{formatCurrency(calculateFinalTotal().totalTTC)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={isGeneratingPDF}>
              {sale ? t('general.edit') : t('sales.add')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleExportPDF}
              disabled={isGeneratingPDF}
            >
              <FileText className="h-4 w-4 mr-1" /> {t('general.export')}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default SaleForm;
