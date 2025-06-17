import { Product, ProductType } from '../types/products';

interface ValidationError {
  field: string;
  message: string;
}

export function validateProduct(product: Product): ValidationError[] {
  const errors: ValidationError[] = [];

  // Common validations
  if (!product.description?.trim()) {
    errors.push({ field: 'description', message: 'Description is required' });
  }

  if (product.quantity <= 0) {
    errors.push({ field: 'quantity', message: 'Quantity must be greater than 0' });
  }

  if (product.pricePerTon < 0) {
    errors.push({ field: 'pricePerTon', message: 'Price cannot be negative' });
  }

  // Product type specific validations
  switch (product.productType) {
    case 'coil':
      if (product.thickness <= 0) {
        errors.push({ field: 'thickness', message: 'Thickness must be greater than 0' });
      }
      if (product.width <= 0) {
        errors.push({ field: 'width', message: 'Width must be greater than 0' });
      }
      if (product.weight <= 0) {
        errors.push({ field: 'weight', message: 'Weight must be greater than 0' });
      }
      break;

    case 'sheet':
      if (product.length <= 0) {
        errors.push({ field: 'length', message: 'Length must be greater than 0' });
      }
      if (product.width <= 0) {
        errors.push({ field: 'width', message: 'Width must be greater than 0' });
      }
      if (product.thickness <= 0) {
        errors.push({ field: 'thickness', message: 'Thickness must be greater than 0' });
      }
      if (product.sheetCount < 1) {
        errors.push({ field: 'sheetCount', message: 'Sheet count must be at least 1' });
      }
      break;

    case 'slitting':
      if (product.originalWidth <= 0) {
        errors.push({ field: 'originalWidth', message: 'Original width must be greater than 0' });
      }
      if (product.targetWidth <= 0) {
        errors.push({ field: 'targetWidth', message: 'Target width must be greater than 0' });
      }
      if (product.targetWidth >= product.originalWidth) {
        errors.push({ field: 'targetWidth', message: 'Target width must be less than original width' });
      }
      if (product.thickness <= 0) {
        errors.push({ field: 'thickness', message: 'Thickness must be greater than 0' });
      }
      if (product.metersLength <= 0) {
        errors.push({ field: 'metersLength', message: 'Length must be greater than 0' });
      }
      if (product.wastePercentage < 0 || product.wastePercentage > 100) {
        errors.push({ field: 'wastePercentage', message: 'Waste percentage must be between 0 and 100' });
      }
      break;

    case 'custom':
      if (!product.unitType) {
        errors.push({ field: 'unitType', message: 'Unit type is required' });
      }
      if (!product.customAttributes || Object.keys(product.customAttributes).length === 0) {
        errors.push({ field: 'customAttributes', message: 'At least one custom attribute is required' });
      }
      break;
  }

  return errors;
}

export function validateTemplateData(productType: ProductType, templateData: any): ValidationError[] {
  const errors: ValidationError[] = [];

  switch (productType) {
    case 'coil':
      if (templateData.thickness <= 0) {
        errors.push({ field: 'thickness', message: 'Default thickness must be greater than 0' });
      }
      if (templateData.width <= 0) {
        errors.push({ field: 'width', message: 'Default width must be greater than 0' });
      }
      break;

    case 'sheet':
      if (templateData.length <= 0) {
        errors.push({ field: 'length', message: 'Default length must be greater than 0' });
      }
      if (templateData.width <= 0) {
        errors.push({ field: 'width', message: 'Default width must be greater than 0' });
      }
      if (templateData.thickness <= 0) {
        errors.push({ field: 'thickness', message: 'Default thickness must be greater than 0' });
      }
      break;

    case 'slitting':
      if (templateData.originalWidth <= 0) {
        errors.push({ field: 'originalWidth', message: 'Default original width must be greater than 0' });
      }
      if (templateData.targetWidth <= 0) {
        errors.push({ field: 'targetWidth', message: 'Default target width must be greater than 0' });
      }
      if (templateData.wastePercentage < 0 || templateData.wastePercentage > 100) {
        errors.push({ field: 'wastePercentage', message: 'Default waste percentage must be between 0 and 100' });
      }
      break;
  }

  return errors;
} 