import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TN40Properties } from '@/types/index';

interface TN40FieldsProps {
  values: Partial<TN40Properties>;
  onChange: (field: string, value: any) => void;
}

export function TN40Fields({ values, onChange }: TN40FieldsProps) {
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
        <Label htmlFor="coilThickness">Épaisseur (mm)</Label>
        <Input
          id="coilThickness"
          type="number"
          value={values.coilThickness || ''}
          onChange={(e) => onChange('coilThickness', parseFloat(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="coilWidth">Largeur (mm)</Label>
        <Input
          id="coilWidth"
          type="number"
          value={values.coilWidth || ''}
          onChange={(e) => onChange('coilWidth', parseFloat(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="topCoatRAL">RAL Face Supérieure</Label>
        <Input
          id="topCoatRAL"
          value={values.topCoatRAL || ''}
          onChange={(e) => onChange('topCoatRAL', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="backCoatRAL">RAL Face Inférieure</Label>
        <Input
          id="backCoatRAL"
          value={values.backCoatRAL || ''}
          onChange={(e) => onChange('backCoatRAL', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="coilWeight">Poids (kg)</Label>
        <Input
          id="coilWeight"
          type="number"
          value={values.coilWeight || ''}
          onChange={(e) => onChange('coilWeight', parseFloat(e.target.value))}
        />
      </div>
    </div>
  );
}
