import { SaleItem } from '../types';

/**
 * Calculate total amount before tax (HT) for a list of sale items
 */
export const calculateTotalHT = (items: SaleItem[]): number => {
  return items.reduce((total, item) => total + item.totalAmountHT, 0);
};

/**
 * Calculate total amount including tax (TTC) for a list of sale items
 */
export const calculateTotalTTC = (items: SaleItem[], taxRate: number): number => {
  const totalHT = calculateTotalHT(items);
  return totalHT * (1 + taxRate);
};

/**
 * Calculate tax amount for a given amount and tax rate
 */
export const calculateTax = (amount: number, taxRate: number): number => {
  return amount * taxRate;
}; 