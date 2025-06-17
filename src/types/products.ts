import { z } from 'zod';

// Base product type
export type ProductType = 'coil' | 'sheet' | 'slitting' | 'custom';

// Base product interface
export interface BaseProduct {
  id: string;
  saleId: string;
  description: string;
  quantity: number;
  pricePerTon: number;
  totalAmount: number;
  productType: ProductType;
  itemOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Coil product interface
export interface CoilProduct extends BaseProduct {
  productType: 'coil';
  thickness: number;
  width: number;
  weight: number;
  topCoatRal?: string;
  backCoatRal?: string;
}

// Sheet product interface
export interface SheetProduct extends BaseProduct {
  productType: 'sheet';
  length: number;
  width: number;
  thickness: number;
  ralColor?: string;
  sheetCount: number;
}

// Slitting product interface
export interface SlittingProduct extends BaseProduct {
  productType: 'slitting';
  originalWidth: number;
  targetWidth: number;
  thickness: number;
  metersLength: number;
  stripsCount: number;
  wastePercentage: number;
}

// Custom product interface
export interface CustomProduct extends BaseProduct {
  productType: 'custom';
  customAttributes: Record<string, any>;
  unitType: string;
}

// Union type for all products
export type Product = CoilProduct | SheetProduct | SlittingProduct | CustomProduct;

// Zod schemas for validation
export const baseProductSchema = z.object({
  id: z.string(),
  saleId: z.string(),
  description: z.string(),
  quantity: z.number().positive(),
  pricePerTon: z.number().positive(),
  totalAmount: z.number().positive(),
  productType: z.enum(['coil', 'sheet', 'slitting', 'custom']),
  itemOrder: z.number().int().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const coilProductSchema = baseProductSchema.extend({
  productType: z.literal('coil'),
  thickness: z.number().positive(),
  width: z.number().positive(),
  weight: z.number().positive(),
  topCoatRal: z.string().optional(),
  backCoatRal: z.string().optional(),
});

export const sheetProductSchema = baseProductSchema.extend({
  productType: z.literal('sheet'),
  length: z.number().positive(),
  width: z.number().positive(),
  thickness: z.number().positive(),
  ralColor: z.string().optional(),
  sheetCount: z.number().int().positive(),
});

export const slittingProductSchema = baseProductSchema.extend({
  productType: z.literal('slitting'),
  originalWidth: z.number().positive(),
  targetWidth: z.number().positive(),
  thickness: z.number().positive(),
  metersLength: z.number().positive(),
  stripsCount: z.number().int().positive(),
  wastePercentage: z.number().min(0).max(100),
});

export const customProductSchema = baseProductSchema.extend({
  productType: z.literal('custom'),
  customAttributes: z.record(z.any()),
  unitType: z.string(),
});

// Product template interfaces
export interface ProductTemplate {
  id: string;
  name: string;
  productType: ProductType;
  descriptionTemplate: string;
  defaultPrice: number;
  templateData: {
    [key: string]: any;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: string;
  tags: string[];
  isFavorite: boolean;
}

export const productTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Template name is required'),
  productType: z.enum(['coil', 'sheet', 'slitting', 'custom']),
  descriptionTemplate: z.string().min(1, 'Description template is required'),
  defaultPrice: z.number().min(0, 'Price must be positive'),
  templateData: z.record(z.any()),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
}); 