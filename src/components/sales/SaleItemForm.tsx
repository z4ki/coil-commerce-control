import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { calculateItemTotalHT, calculateItemTotalTTC } from '@/utils/calculations';
import { ProductType } from '@/types/index';
import { ProductTypeSelector } from './ProductTypeSelector';
import { TN40Fields } from './TN40Fields';
import { SteelSlittingFields } from './SteelSlittingFields';

const TAX_RATE = 0.19;

interface SaleItemFormProps {
  index: number;
  onRemove: () => void;
  isRemoveDisabled: boolean;
}

const SaleItemForm = ({ index, onRemove, isRemoveDisabled }: SaleItemFormProps) => {
  const { control, watch, setValue, trigger } = useFormContext();
  const { t } = useLanguage();
  
  const [productType, setProductType] = useState<ProductType>(ProductType.STANDARD);
  // Watch for changes in all relevant fields
  const values = watch(`items.${index}`);
  const { quantity, pricePerTon, productType: currentProductType } = values || { 
    quantity: 0, 
    pricePerTon: 0, 
    productType: ProductType.STANDARD 
  };
  
  // Calculate totals using utility functions
  const weight = currentProductType === ProductType.STEEL_SLITTING ? values?.weight : values?.coilWeight;
  const weightInTons = Number(weight || 0) / 1000; // Convert kg to tons
  const totalHT = calculateItemTotalHT(Number(quantity), weightInTons, Number(pricePerTon));
  const totalTTC = calculateItemTotalTTC(Number(totalHT), TAX_RATE);

  // Update form values when totals change
  useEffect(() => {
    setValue(`items.${index}.totalAmountHT`, totalHT);
    setValue(`items.${index}.totalAmountTTC`, totalTTC);
    trigger();
  }, [totalHT, totalTTC, index, setValue, trigger]);
  const handleProductTypeChange = (type: ProductType) => {
    setProductType(type);
    setValue(`items.${index}.productType`, type);
    
    // Clear type-specific fields
    const fieldsToReset = {
      coilRef: '',
      coilThickness: 0,
      coilWidth: 0,
      topCoatRAL: '',
      backCoatRAL: '',
      coilWeight: 0,
      inputWidth: 0,
      outputWidth: 0,
      thickness: 0,
      weight: 0,
      stripsCount: 0,
    };

    Object.entries(fieldsToReset).forEach(([field, value]) => {
      setValue(`items.${index}.${field}`, value);
    });
    trigger();
  };

  const handleFieldChange = (field: string, value: any) => {
    setValue(`items.${index}.${field}`, value);
    trigger();
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-4">
          <FormField
            control={control}
            name={`items.${index}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <ProductTypeSelector
            value={productType}
            onChange={handleProductTypeChange}
          />

          {productType === ProductType.TN40 && (
            <TN40Fields
              values={values}
              onChange={handleFieldChange}
            />
          )}

          {productType === ProductType.STEEL_SLITTING && (
            <SteelSlittingFields
              values={values}
              onChange={handleFieldChange}
            />
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name={`items.${index}.quantity`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantité</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        field.onChange(e);
                        handleFieldChange('quantity', value);
                      }} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`items.${index}.pricePerTon`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prix par tonne</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        field.onChange(e);
                        handleFieldChange('pricePerTon', value);
                      }} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`items.${index}.totalAmountHT`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total HT</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`items.${index}.totalAmountTTC`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total TTC</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={isRemoveDisabled}
          className="text-destructive hover:text-destructive/90"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default SaleItemForm;
