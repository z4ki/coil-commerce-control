
import React from 'react';
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

interface SaleItemFormProps {
  index: number;
  onRemove: () => void;
  isRemoveDisabled: boolean;
}

const SaleItemForm = ({ index, onRemove, isRemoveDisabled }: SaleItemFormProps) => {
  const { control, watch, setValue } = useFormContext();
  
  // Calculate total for this item
  const quantity = watch(`items.${index}.quantity`) || 0;
  const pricePerTon = watch(`items.${index}.pricePerTon`) || 0;
  const itemTotal = quantity * pricePerTon;
  
  // Generate a description based on the provided values
  const generateDescription = () => {
    const thickness = watch(`items.${index}.coilThickness`);
    const width = watch(`items.${index}.coilWidth`);
    const topRal = watch(`items.${index}.topCoatRAL`);
    const backRal = watch(`items.${index}.backCoatRAL`);
    
    if (thickness && width) {
      let description = `BOBINES D'ACIER PRELAQUE ${thickness}*${width}`;
      
      if (topRal || backRal) {
        description += ` RAL ${topRal || 'X'}/${backRal || 'Y'}`;
      }
      
      setValue(`items.${index}.description`, description);
    } else {
      // Not enough information to generate description
      setValue(`items.${index}.description`, "BOBINES D'ACIER PRELAQUE");
    }
  };
  
  return (
    <div className="p-4 border rounded-md mb-4 bg-muted/30">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-semibold">Item {index + 1}</h4>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={onRemove} 
          disabled={isRemoveDisabled}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2 items-end mb-4">
        <div className="flex-1">
          <FormField
            control={control}
            name={`items.${index}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="BOBINES D'ACIER PRELAQUE" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={generateDescription}
            className="mb-0.5"
            title="Auto-generate description"
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Auto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
        <FormField
          control={control}
          name={`items.${index}.coilRef`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Coil Reference</FormLabel>
              <FormControl>
                <Input placeholder="Coil ID/Reference" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Coil properties */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
        <FormField
          control={control}
          name={`items.${index}.coilThickness`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thickness (mm)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.5" 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e.target.valueAsNumber || undefined);
                  }}
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
              <FormLabel>Width (mm)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="1" 
                  placeholder="1000" 
                   {...field} 
                   onChange={(e) => {
                     field.onChange(e.target.valueAsNumber || undefined);
                   }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* RAL Colors */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
        <FormField
          control={control}
          name={`items.${index}.topCoatRAL`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Top Coat RAL</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 9010" {...field} />
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
              <FormLabel>Back Coat RAL</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 9002" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
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
                    field.onChange(e.target.valueAsNumber || 0);
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
              <FormLabel>Price per Ton (DZD)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
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
      
      <div className="mt-3 flex justify-between">
        <div className="text-sm">
          <span className="font-medium">Item Total:</span> {itemTotal.toFixed(2)} DZD
        </div>
      </div>
    </div>
  );
};

export default SaleItemForm;
