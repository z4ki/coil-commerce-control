import { ProductType, TN40Properties, SteelSlittingProperties } from '@/types/index';

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
