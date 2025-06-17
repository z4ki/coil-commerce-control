import { Product, ProductType } from '../types/products';

// Constants
const STEEL_DENSITY = 7.85; // g/cm³

/**
 * Calculate the weight of a coil in tons
 */
export function calculateCoilWeight(
  thickness: number, // mm
  width: number, // mm
  length: number // meters
): number {
  // Convert measurements to meters
  const thicknessM = thickness / 1000;
  const widthM = width / 1000;
  const lengthM = length / 1000;

  // Calculate volume in cubic meters
  const volume = thicknessM * widthM * lengthM;

  // Calculate weight in tons (convert from kg)
  return (volume * STEEL_DENSITY * 1000) / 1000;
}

/**
 * Calculate the weight of a sheet in tons
 */
export function calculateSheetWeight(
  length: number, // mm
  width: number, // mm
  thickness: number, // mm
  count: number
): number {
  // Convert measurements to meters
  const lengthM = length / 1000;
  const widthM = width / 1000;
  const thicknessM = thickness / 1000;

  // Calculate volume in cubic meters
  const volume = lengthM * widthM * thicknessM * count;

  // Calculate weight in tons (convert from kg)
  return (volume * STEEL_DENSITY * 1000) / 1000;
}

/**
 * Calculate slitting yield and strips count
 */
export function calculateSlittingYield(
  originalWidth: number, // mm
  targetWidth: number, // mm
  wastePercentage: number // %
): {
  stripsCount: number;
  yieldPercentage: number;
  wasteAmount: number;
} {
  const stripsCount = Math.floor(originalWidth / targetWidth);
  const totalWidth = stripsCount * targetWidth;
  const wasteAmount = originalWidth - totalWidth;
  const yieldPercentage = ((totalWidth / originalWidth) * 100) - wastePercentage;

  return {
    stripsCount,
    yieldPercentage: Math.max(0, yieldPercentage),
    wasteAmount,
  };
}

/**
 * Calculate total amount for any product
 */
export function calculateTotalAmount(
  quantity: number,
  pricePerTon: number
): number {
  return quantity * pricePerTon;
}

/**
 * Calculate product-specific values
 */
export function calculateProductValues(product: Product): {
  weight?: number;
  stripsCount?: number;
  yieldPercentage?: number;
  wasteAmount?: number;
  totalAmount: number;
  area?: number;
  volume?: number;
} {
  const result: any = {
    totalAmount: calculateTotalAmount(product.quantity, product.pricePerTon),
  };

  switch (product.productType) {
    case 'coil':
      result.weight = product.weight;
      result.volume = (product.thickness * product.width * product.weight) / 1000000000; // m³
      break;

    case 'sheet':
      result.weight = calculateSheetWeight(product.length, product.width, product.thickness, product.sheetCount);
      result.area = (product.length * product.width * product.sheetCount) / 1000000; // m²
      result.volume = (product.length * product.width * product.thickness * product.sheetCount) / 1000000000; // m³
      break;

    case 'slitting':
      const slittingResult = calculateSlittingYield(
        product.originalWidth,
        product.targetWidth,
        product.wastePercentage
      );
      result.stripsCount = slittingResult.stripsCount;
      result.yieldPercentage = slittingResult.yieldPercentage;
      result.wasteAmount = slittingResult.wasteAmount;
      result.weight = calculateCoilWeight(
        product.thickness,
        product.originalWidth,
        product.metersLength * 1000
      );
      break;
  }

  return result;
}

export function calculateMaterialCost(product: Product, materialCostPerTon: number): number {
  const values = calculateProductValues(product);
  return (values.weight || 0) * materialCostPerTon;
}

export function calculateTotalCost(product: Product, materialCostPerTon: number): {
  materialCost: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
} {
  const materialCost = calculateMaterialCost(product, materialCostPerTon);
  const totalAmount = calculateTotalAmount(product.quantity, product.pricePerTon);
  const profit = totalAmount - materialCost;
  const profitMargin = (profit / totalAmount) * 100;

  return {
    materialCost,
    totalCost: materialCost,
    profit,
    profitMargin,
  };
}

export function calculateOptimalCutting(product: Product): {
  stripsCount: number;
  wastePercentage: number;
  optimalWidth: number;
} {
  if (product.productType !== 'slitting') {
    throw new Error('Optimal cutting calculation is only available for slitting products');
  }

  const { originalWidth, targetWidth } = product;
  const stripsCount = Math.floor(originalWidth / targetWidth);
  const totalWidth = stripsCount * targetWidth;
  const wastePercentage = ((originalWidth - totalWidth) / originalWidth) * 100;
  const optimalWidth = originalWidth / stripsCount;

  return {
    stripsCount,
    wastePercentage,
    optimalWidth,
  };
} 