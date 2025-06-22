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
import { calculateItemTotalHT, calculateItemTotalTTC, TAX_RATE } from '../../utils/calculations';

interface SaleItemFormProps {
  index: number;
  onRemove: () => void;
  isRemoveDisabled: boolean;
}

const SaleItemForm = ({ index, onRemove, isRemoveDisabled }: SaleItemFormProps) => {
  const { control, watch, setValue, trigger } = useFormContext();
  const { t } = useLanguage();
  
  // Initialize all input states with empty strings
  const [thicknessInput, setThicknessInput] = useState('');
  const [widthInput, setWidthInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('1');
  const [priceInput, setPriceInput] = useState('0');
  
  // Watch for changes in all relevant fields
  const quantity = watch(`items.${index}.quantity`);
  const pricePerTon = watch(`items.${index}.pricePerTon`);
  const thickness = watch(`items.${index}.coilThickness`);
  const width = watch(`items.${index}.coilWidth`);
  const weight = watch(`items.${index}.coilWeight`);
  const topRal = watch(`items.${index}.topCoatRAL`);
  const backRal = watch(`items.${index}.backCoatRAL`);
  const productType = watch(`items.${index}.productType`);
  
 

  // Calculate totals using utility functions
  const totalHT = productType === 'corrugated_sheet'
    ? calculateItemTotalHT(Number(quantity), Number(width), Number(pricePerTon), productType)
    : productType === 'coil'
      ? calculateItemTotalHT(1, Number(weight), Number(pricePerTon), productType)
      : calculateItemTotalHT(Number(quantity), Number(weight), Number(pricePerTon), productType);
  const totalTTC = calculateItemTotalTTC(Number(totalHT), TAX_RATE);

  // Update form values when totals change
  useEffect(() => {
    setValue(`items.${index}.totalAmountHT`, totalHT);
    setValue(`items.${index}.totalAmountTTC`, totalTTC);
    // Trigger full form validation to update summary
    trigger();
  }, [totalHT, totalTTC, index, setValue, trigger]);

  // Initialize input values
  useEffect(() => {
    if (thickness !== undefined) setThicknessInput(thickness.toString());
    if (width !== undefined) setWidthInput(width.toString());
    if (weight !== undefined) setWeightInput(weight.toString());
    if (quantity !== undefined) setQuantityInput(quantity.toString());
    if (pricePerTon !== undefined) setPriceInput(pricePerTon.toString());
  }, [thickness, width, weight, quantity, pricePerTon]);

  // Automatically generate description when relevant fields change
  useEffect(() => {
    if (thickness && width) {
      let description = t('form.sale.coilDescription')
        .replace('{0}', thickness.toString())
        .replace('{1}', width.toString());
      
      if (topRal || backRal) {
        description = t('form.sale.coilDescriptionWithRAL')
          .replace('{0}', thickness.toString())
          .replace('{1}', width.toString())
          .replace('{2}', topRal || 'X')
          .replace('{3}', backRal || 'Y');
      }
      
      if (weight) {
        description += ` - ${weight}kg`;
      }
      
      setValue(`items.${index}.description`, description);
    }
  }, [thickness, width, weight, topRal, backRal, index, setValue, t]);

  // Handle numeric input changes with immediate total updates
  const handleNumericInput = (value: string, setter: (value: string) => void, field: { onChange: (value: number) => void }) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setter(value);
      if (value === '') {
        field.onChange(0);
      } else {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          field.onChange(numValue);
          // Trigger immediate recalculation
          trigger([
            `items.${index}.totalAmountHT`,
            `items.${index}.totalAmountTTC`,
            'items'
          ]);
        }
      }
    }
  };

  const productTypes = [
    { value: 'coil', label: t('form.sale.productTypeCoil') || 'Coil' },
    { value: 'corrugated_sheet', label: t('form.sale.productTypeCorrugatedSheet') || 'Corrugated Sheet' },
    { value: 'steel_slitting', label: t('form.sale.productTypeSteelSlitting') || 'Steel Slitting' },
  ];

  const showCoilFields = productType === 'coil';
  const showCorrugatedSheetFields = productType === 'corrugated_sheet';
  const showSteelSlittingFields = productType === 'steel_slitting';

  // Debug log for calculation values
  // (Removed to avoid console spam)

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
                <Input placeholder="BOB-" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`items.${index}.productType`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.sale.productType') || 'Product Type'}</FormLabel>
              <FormControl>
                <select {...field} value={field.value || 'coil'} onChange={field.onChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                  {productTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Coil fields: show all original fields for coil */}
      {showCoilFields && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              name={`items.${index}.coilWeight`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.sale.coilWeight')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="text" 
                      inputMode="decimal"
                      placeholder="0.00" 
                      value={weightInput}
                      onChange={(e) => handleNumericInput(e.target.value, setWeightInput, field)}
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
                    <Input placeholder="9010" {...field} value={field.value || ''} />
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
                    <Input placeholder="9002" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </>
      )}

      {/* Corrugated Sheet fields */}
      {showCorrugatedSheetFields && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name={`items.${index}.coilThickness`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thickness (mm)</FormLabel>
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
            <FormField
              control={control}
              name={`items.${index}.coilWidth`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Length (m)</FormLabel>
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
          </div>
        </>
      )}

      {/* Steel Slitting fields */}
      {showSteelSlittingFields && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name={`items.${index}.coilWeight`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.sale.coilWeight')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="text" 
                      inputMode="decimal"
                      placeholder="0.00" 
                      value={weightInput}
                      onChange={(e) => handleNumericInput(e.target.value, setWeightInput, field)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </>
      )}

      {/* Common fields for all types */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Only show quantity for non-coil types */}
        {productType !== 'coil' && (
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
        )}
        <FormField
          control={control}
          name={`items.${index}.pricePerTon`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{showCorrugatedSheetFields ? 'Unit Price (per meter)' : t('form.sale.pricePerTon')}</FormLabel>
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
      <FormField
        control={control}
        name={`items.${index}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('form.sale.description') || 'Description'}</FormLabel>
            <FormControl>
              <Input {...field} type="text" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default SaleItemForm;
