import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Trash2, RefreshCw } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useLanguage } from '../../context/LanguageContext';

interface SaleItemFormProps {
  index: number;
  onRemove: () => void;
  isRemoveDisabled: boolean;
}

const SaleItemForm = ({ index, onRemove, isRemoveDisabled }: SaleItemFormProps) => {
  const { control, watch, setValue, trigger } = useFormContext();
  const { t } = useLanguage();
  
  // Track all numeric inputs as strings
  const [thicknessInput, setThicknessInput] = useState('');
  const [widthInput, setWidthInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  
  // Watch for changes in all relevant fields
  const quantity = watch(`items.${index}.quantity`);
  const pricePerTon = watch(`items.${index}.pricePerTon`);
  const thickness = watch(`items.${index}.coilThickness`);
  const width = watch(`items.${index}.coilWidth`);
  const topRal = watch(`items.${index}.topCoatRAL`);
  const backRal = watch(`items.${index}.backCoatRAL`);
  
  // Calculate totals
  const totalHT = (Number(quantity) || 0) * (Number(pricePerTon) || 0);
  const tva = totalHT * 0.19; // 19% TVA
  const totalTTC = totalHT + tva;

  // Initialize input values
  React.useEffect(() => {
    if (thickness !== undefined && thicknessInput === '') {
      setThicknessInput(thickness.toString());
    }
    if (width !== undefined && widthInput === '') {
      setWidthInput(width.toString());
    }
    if (quantity !== undefined && quantityInput === '') {
      setQuantityInput(quantity.toString());
    }
    if (pricePerTon !== undefined && priceInput === '') {
      setPriceInput(pricePerTon.toString());
    }
  }, [thickness, width, quantity, pricePerTon]);

  // Automatically generate description when relevant fields change
  React.useEffect(() => {
    if (thickness && width) {
      let description = t('form.sale.coilDescription').replace('{0}', thickness.toString()).replace('{1}', width.toString());
      if (topRal || backRal) {
        description = t('form.sale.coilDescriptionWithRAL')
          .replace('{0}', thickness.toString())
          .replace('{1}', width.toString())
          .replace('{2}', topRal || 'X')
          .replace('{3}', backRal || 'Y');
      }
      setValue(`items.${index}.description`, description);
    }
  }, [thickness, width, topRal, backRal, index, setValue, t]);

  // Update the total amounts in the form whenever quantity or price changes
  React.useEffect(() => {
    setValue(`items.${index}.totalAmountHT`, totalHT);
    setValue(`items.${index}.totalAmountTTC`, totalTTC);
    trigger();
  }, [quantity, pricePerTon, index, setValue, trigger]);

  // Handle numeric input changes
  const handleNumericInput = (value: string, setter: (value: string) => void, field: { onChange: (value: number) => void }) => {
    // Allow empty input, numbers, one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setter(value);
      // Only update the form value if it's a valid number
      if (value === '') {
        field.onChange(0);
      } else {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          field.onChange(numValue);
        }
      }
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-md relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2"
        onClick={onRemove}
        disabled={isRemoveDisabled}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name={`items.${index}.coilRef`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.sale.coilRef')}</FormLabel>
              <FormControl>
                <Input placeholder="BOB-" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`items.${index}.coilThickness`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.sale.coilThickness')}</FormLabel>
              <FormControl>
                <Input 
                  type="text" 
                  inputMode="decimal"
                  placeholder="0.00" 
                  value={thicknessInput}
                  onChange={(e) => handleNumericInput(e.target.value, setThicknessInput, field)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name={`items.${index}.coilWidth`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.sale.coilWidth')}</FormLabel>
              <FormControl>
                <Input 
                  type="text" 
                  inputMode="decimal"
                  placeholder="0.00" 
                  value={widthInput}
                  onChange={(e) => handleNumericInput(e.target.value, setWidthInput, field)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`items.${index}.quantity`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.sale.quantity')}</FormLabel>
              <FormControl>
                <Input 
                  type="text" 
                  inputMode="decimal"
                  placeholder="0.00" 
                  value={quantityInput}
                  onChange={(e) => handleNumericInput(e.target.value, setQuantityInput, field)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name={`items.${index}.topCoatRAL`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.sale.topCoatRAL')}</FormLabel>
              <FormControl>
                <Input placeholder="9010" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`items.${index}.backCoatRAL`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.sale.backCoatRAL')}</FormLabel>
              <FormControl>
                <Input placeholder="9002" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name={`items.${index}.pricePerTon`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.sale.pricePerTon')}</FormLabel>
              <FormControl>
                <Input 
                  type="text" 
                  inputMode="decimal"
                  placeholder="0.00" 
                  value={priceInput}
                  onChange={(e) => handleNumericInput(e.target.value, setPriceInput, field)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default SaleItemForm;
