export enum ProductType {
  TN40 = 'TN40',
  STEEL_SLITTING = 'STEEL_SLITTING',
  STANDARD = 'STANDARD'
}

export interface TN40Properties {
  coilRef?: string;
  coilThickness?: number;
  coilWidth?: number;
  topCoatRAL?: string;
  backCoatRAL?: string;
  coilWeight?: number;
}

export interface SteelSlittingProperties {
  coilRef?: string;
  inputWidth?: number;
  outputWidth?: number;
  thickness?: number;
  weight?: number;
  stripsCount?: number;
}

// Helper function to validate properties based on product type
export function validateProductTypeProperties(
  type: ProductType,
  properties: TN40Properties | SteelSlittingProperties
): boolean {
  switch (type) {
    case ProductType.TN40:
      const tn40Props = properties as TN40Properties;
      return !!(
        tn40Props.coilThickness &&
        tn40Props.coilWidth &&
        tn40Props.coilWeight
      );
    case ProductType.STEEL_SLITTING:
      const slittingProps = properties as SteelSlittingProperties;
      return !!(
        slittingProps.inputWidth &&
        slittingProps.outputWidth &&
        slittingProps.thickness &&
        slittingProps.weight &&
        slittingProps.stripsCount
      );
    case ProductType.STANDARD:
      return true;
    default:
      return false;
  }
}
