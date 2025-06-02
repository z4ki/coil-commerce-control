import React from 'react';
import { ProductType } from '@/services/productTypes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface ProductTypeSelectorProps {
  value: ProductType;
  onChange: (value: ProductType) => void;
}

export function ProductTypeSelector({ value, onChange }: ProductTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="productType">Type de produit</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="productType">
          <SelectValue placeholder="Sélectionnez un type de produit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ProductType.STANDARD}>Standard</SelectItem>
          <SelectItem value={ProductType.TN40}>TN40</SelectItem>
          <SelectItem value={ProductType.STEEL_SLITTING}>Refendage</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
