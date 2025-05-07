
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
import { Trash2 } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

interface SaleItemFormProps {
  index: number;
  onRemove: () => void;
  isRemoveDisabled: boolean;
}

const SaleItemForm = ({ index, onRemove, isRemoveDisabled }: SaleItemFormProps) => {
  const { control, watch } = useFormContext();
  
  // Calculate total for this item
  const quantity = watch(`items.${index}.quantity`) || 0;
  const pricePerTon = watch(`items.${index}.pricePerTon`) || 0;
  const itemTotal = quantity * pricePerTon;
  
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
        <FormField
          control={control}
          name={`items.${index}.description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="PPGI Coil" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
              <FormLabel>Price per Ton (DZD) - HT</FormLabel>
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
          <span className="font-medium">Item Total (HT):</span> {itemTotal.toFixed(2)} DZD
        </div>
      </div>
    </div>
  );
};

export default SaleItemForm;
