import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SteelSlittingFieldsProps {
  values: {
    coilRef?: string;
    inputWidth?: number;
    outputWidth?: number;
    thickness?: number;
    weight?: number;
    stripsCount?: number;
  };
  onChange: (field: string, value: any) => void;
}

export function SteelSlittingFields({ values, onChange }: SteelSlittingFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="coilRef">Référence bobine</Label>
        <Input
          id="coilRef"
          value={values.coilRef || ''}
          onChange={(e) => onChange('coilRef', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inputWidth">Largeur d'entrée (mm)</Label>
        <Input
          id="inputWidth"
          type="number"
          value={values.inputWidth || ''}
          onChange={(e) => onChange('inputWidth', parseFloat(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="outputWidth">Largeur de sortie (mm)</Label>
        <Input
          id="outputWidth"
          type="number"
          value={values.outputWidth || ''}
          onChange={(e) => onChange('outputWidth', parseFloat(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="thickness">Épaisseur (mm)</Label>
        <Input
          id="thickness"
          type="number"
          value={values.thickness || ''}
          onChange={(e) => onChange('thickness', parseFloat(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="weight">Poids (kg)</Label>
        <Input
          id="weight"
          type="number"
          value={values.weight || ''}
          onChange={(e) => onChange('weight', parseFloat(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="stripsCount">Nombre de bandes</Label>
        <Input
          id="stripsCount"
          type="number"
          value={values.stripsCount || ''}
          onChange={(e) => onChange('stripsCount', parseInt(e.target.value))}
        />
      </div>
    </div>
  );
}
