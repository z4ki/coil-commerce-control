// In src/components/sales/SaleForm.tsx

import React, { useState, useEffect, useCallback } from 'react';
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
import { Plus, FileText } from 'lucide-react';
import SaleItemForm from './SaleItemForm';
import { saveSalePDF } from '../../utils/pdfService.tsx'; //
import { useLanguage } from '../../context/LanguageContext';

const TAX_RATE = 0.19;

// Define the valid payment methods
const paymentMethods = ['cash', 'bank_transfer', 'check','term'] as const;
type PaymentMethod = typeof paymentMethods[number];

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
    sale_id?: string;
    productType?: string;
  }[];
  transportationFee: number;
  notes?: string;
  paymentMethod?: PaymentMethod; // Use the defined type
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
  productType?: string;
}

interface SummaryTotals {
  itemsTotalHT: number;
  transportationFee: number;
  totalHT: number;
  tva: number;
  totalTTC: number;
}

const SaleForm = ({ sale, onSuccess }: SaleFormProps) => {
  const { addSale, updateSale, clients, getClientById } = useAppContext();
  const { t } = useLanguage();
  
  const [itemsState, setItemsState] = useState<SaleItemFormData[]>(
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
      totalAmountTTC: item.totalAmountTTC,
      productType: item.productType || '',
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
      totalAmountTTC: 0,
      productType: 'coil',
    }]
  );
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const defaultValues: FormValues = {
    clientId: sale?.clientId || '',
    date: formatDateInput(sale?.date || new Date()),
    items: itemsState,
    transportationFee: sale?.transportationFee || 0,
    notes: sale?.notes || '',
    paymentMethod: sale?.paymentMethod as PaymentMethod | undefined || undefined, // Initialize as undefined
  };

  const itemSchema = z.object({
    id: z.string(),
    description: z.string().min(1, { message: t('form.required') }),
    coilRef: z.string().optional(),
    coilThickness: z.coerce.number().min(0).optional(),
    coilWidth: z.coerce.number().min(0).optional(),
    topCoatRAL: z.string().optional(),
    backCoatRAL: z.string().optional(),
    coilWeight: z.coerce.number().min(0).optional(),
    quantity: z.coerce.number().min(0, { message: t('form.sale.quantityPositive') }),
    pricePerTon: z.coerce.number().min(0, { message: t('form.sale.pricePositive') }),
    totalAmountHT: z.number(),
    totalAmountTTC: z.number(),
    sale_id: z.string().optional(),
    productType: z.string().optional(),
  }).superRefine((item, ctx) => {
    if (item.productType === 'corrugated_sheet') {
      if (!item.quantity || item.quantity <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('form.sale.quantityPositive'),
          path: ['quantity'],
        });
      }
      if (!item.coilWidth || item.coilWidth <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('form.required'),
          path: ['coilWidth'],
        });
      }
      if (!item.pricePerTon || item.pricePerTon <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('form.sale.pricePositive'),
          path: ['pricePerTon'],
        });
      }
    }
  });

  const formSchema = z.object({
    clientId: z.string().min(1, { message: t('form.required') }),
    date: z.string().min(1, { message: t('form.required') }),
    items: z.array(itemSchema).min(1, { message: t('form.sale.itemRequired') }),
    transportationFee: z.coerce.number().min(0).default(0),
    notes: z.string().optional(),
    paymentMethod: z.enum(paymentMethods).optional().nullable() // Allow optional and nullable
        .refine(val => val === null || val === undefined || paymentMethods.includes(val), { // Ensure if it's provided, it's one of the enum values
            message: "Invalid payment method",
        }),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange", // Validate on change to see errors quickly
  });

  const calculateItemTotal = useCallback((item: SaleItemFormData) => {
    const quantity = Number(item.quantity || 0);
    const pricePerTon = Number(item.pricePerTon || 0);
    const totalHT = quantity * pricePerTon;
    return {
      totalHT,
      totalTTC: totalHT * (1 + TAX_RATE)
    };
  }, []);
  
  const calculateFinalTotal = useCallback((): SummaryTotals => {
    const currentFormItems = form.getValues('items') || [];
    const itemsTotalHT = currentFormItems.reduce((sum, item) => sum + (item.totalAmountHT || 0), 0);

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
  }, [form]);

  const [displayTotals, setDisplayTotals] = useState<SummaryTotals>(() => calculateFinalTotal());

  const formValuesSubscription = form.watch();

  useEffect(() => {
    setDisplayTotals(calculateFinalTotal());
  }, [formValuesSubscription, calculateFinalTotal]);


  useEffect(() => {
    if (sale && form.getValues('items').length !== sale.items.length) {
        form.setValue('items', itemsState, { shouldValidate: true, shouldDirty: true });
    }
  }, [sale, itemsState, form]);


  const addItem = () => {
    const newItem: SaleItemFormData = {
      id: uuidv4(), description: '', coilRef: '', coilThickness: 0,
      coilWidth: 0, topCoatRAL: '', backCoatRAL: '', coilWeight: 0,
      quantity: 1, pricePerTon: 0, totalAmountHT: 0, totalAmountTTC: 0,
      productType: '',
    };
    const currentItems = form.getValues('items') || [];
    const newItems = [...currentItems, newItem];
    setItemsState(newItems); 
    form.setValue('items', newItems, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };

  const removeItem = (id: string) => {
    const currentItems = form.getValues('items') || [];
    if (currentItems.length === 1) {
      toast.error(t('form.sale.itemRequired'));
      return;
    }
    const newItems = currentItems.filter(item => item.id !== id);
    setItemsState(newItems); 
    form.setValue('items', newItems, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };
  
  const onSubmit = async (data: FormValues) => {
    // Ensure pricePerTon is always included and a number
    const items = data.items.map((item, i) => ({
      ...item,
      pricePerTon: Number(item.pricePerTon),
      totalAmountHT: Number(item.totalAmountHT),
      totalAmountTTC: Number(item.totalAmountTTC),
    }));
    // Calculate totals
    const itemsTotalHT = items.reduce((sum, item) => sum + (item.totalAmountHT || 0), 0);
    const transportationFee = Number(data.transportationFee || 0);
    const totalAmountHT = itemsTotalHT + transportationFee;
    const totalAmountTTC = totalAmountHT * (1 + TAX_RATE);
    console.log('Submitting sale:', { ...data, items, totalAmountHT, totalAmountTTC });
    items.forEach((item, i) => console.log(`Submit item ${i}:`, item));
    try {
      if (sale) {
        await updateSale(sale.id, { ...sale, ...data, items, totalAmountHT, totalAmountTTC });
        toast.success(t('sales.updated'));
      } else {
        await addSale({ ...data, items, totalAmountHT, totalAmountTTC });
        toast.success(t('sales.added'));
      }
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(t('sales.saveError') + ': ' + (error?.message || error?.toString()));
      console.error('Error saving sale:', error);
    }
  };

  const handleExportPDF = async () => {
    const formData = form.getValues();
    if (!formData.clientId) {
      toast.error(t('form.error')); return;
    }
    const client = getClientById(formData.clientId);
    if (!client) {
      toast.error(t('sales.clientNotFound')); return;
    }
    setIsGeneratingPDF(true);

    const sanitizedItems = formData.items.map(item => {
      const qty = Number(item.quantity);
      const price = Number(item.pricePerTon);
      const thick = Number(item.coilThickness);
      const wid = Number(item.coilWidth);
      const cWeight = Number(item.coilWeight);
      const itemTotalHT = (isNaN(qty) ? 0 : qty) * (isNaN(price) ? 0 : price);
      return {
        id: item.id,
        description: item.description || '',
        coilRef: item.coilRef || '',
        coilThickness: isNaN(thick) ? 0 : thick,
        coilWidth: isNaN(wid) ? 0 : wid,
        topCoatRAL: item.topCoatRAL || '',
        backCoatRAL: item.backCoatRAL || '',
        coilWeight: isNaN(cWeight) ? 0 : cWeight,
        quantity: isNaN(qty) ? 0 : qty,
        pricePerTon: isNaN(price) ? 0 : price,
        totalAmountHT: itemTotalHT,
        totalAmountTTC: itemTotalHT * (1 + TAX_RATE),
      };
    });
    const itemsTotalHT_sanitized = sanitizedItems.reduce((sum, item) => sum + item.totalAmountHT, 0);
    const transportationFee_sanitized = Number(formData.transportationFee || 0);
    const totalHT_sanitized = itemsTotalHT_sanitized + transportationFee_sanitized;
    let totalTTC_sanitized = totalHT_sanitized * (1 + TAX_RATE);
    if (isNaN(totalTTC_sanitized)) totalTTC_sanitized = 0;


    const tempSale: Sale = {
      id: sale?.id || uuidv4(),
      clientId: formData.clientId,
      date: parseDateInput(formData.date),
      items: sanitizedItems,
      totalAmountHT: isNaN(totalHT_sanitized) ? 0 : totalHT_sanitized,
      totalAmountTTC: totalTTC_sanitized,
      isInvoiced: sale?.isInvoiced || false,
      invoiceId: sale?.invoiceId,
      notes: formData.notes || '',
      transportationFee: transportationFee_sanitized,
      taxRate: TAX_RATE,
      createdAt: sale?.createdAt || new Date(),
      updatedAt: new Date(),
      paymentMethod: formData.paymentMethod ? formData.paymentMethod : undefined,
    };
    
    try {
      await saveSalePDF(tempSale, client); //
      toast.success(t('sales.pdfGenerated'));
    } catch (error) {
      console.error('Error generating PDF in SaleForm:', error);
      toast.error(t('sales.pdfError'));
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-6 h-full">
        <div className="flex-1 space-y-6 overflow-y-auto pr-2 md:max-h-[calc(100vh-200px)]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control} name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.sale.client')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder={t('form.sale.selectClient')} /></SelectTrigger></FormControl>
                    <SelectContent>{clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name} - {c.company}</SelectItem>))}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control} name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.sale.date')}</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{t('form.sale.items')}</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-1" /> {t('form.sale.addItem')}</Button>
            </div>
            <div className="space-y-4">
              {itemsState.map((item, index) => (
                <SaleItemForm key={item.id} index={index} onRemove={() => removeItem(item.id)} isRemoveDisabled={itemsState.length === 1} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control} name="transportationFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.sale.transportationFee')}</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.sale.paymentMethod')}</FormLabel>
                <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""} // Ensure value is not undefined for Select
                    defaultValue={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('payments.selectMethod')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cash">{t('payments.methods.cash')}</SelectItem>
                    <SelectItem value="bank_transfer">{t('payments.methods.bank_transfer')}</SelectItem>
                    <SelectItem value="check">{t('payments.methods.check')}</SelectItem>
                    <SelectItem value="term">{t('payments.methods.term')}</SelectItem>

                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control} name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('saleForm.notes')}</FormLabel>
                <FormControl><Textarea {...field} value={field.value || ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
        </div>
        <div className="w-full md:w-72 space-y-6 mt-6 md:mt-0 md:sticky md:top-6 md:max-h-[calc(100vh-48px)]">
          <div className="space-y-4 rounded-md border p-4 bg-muted/50">
            <h3 className="font-medium">{t('form.sale.summary')}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span>{t('form.sale.subtotalHT')}:</span><span>{formatCurrency(displayTotals.itemsTotalHT)}</span></div>
              {displayTotals.transportationFee > 0 && (<div className="flex justify-between text-sm"><span>{t('form.sale.transportationFee')}:</span><span>{formatCurrency(displayTotals.transportationFee)}</span></div>)}
              <div className="flex justify-between text-sm pt-2 border-t"><span>{t('form.sale.totalHT')}:</span><span>{formatCurrency(displayTotals.totalHT)}</span></div>
              <div className="flex justify-between text-sm"><span>{t('form.sale.tva')} ({(TAX_RATE * 100).toFixed(0)}%):</span><span>{formatCurrency(displayTotals.tva)}</span></div>
              <div className="flex justify-between font-medium pt-2 border-t"><span>{t('form.sale.totalTTC')}:</span><span>{formatCurrency(displayTotals.totalTTC)}</span></div>
            </div>
          </div>
          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={isGeneratingPDF}>{sale ? t('general.edit') : t('sales.add')}</Button>
            <Button type="button" variant="outline" className="w-full" onClick={handleExportPDF} disabled={isGeneratingPDF}><FileText className="h-4 w-4 mr-1" /> {t('general.export')}</Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default SaleForm;