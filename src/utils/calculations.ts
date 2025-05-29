import { SaleItem } from '../types';

// Constants
export const TAX_RATE = 0.19; // 19%

/**
 * Calculate total amount before tax (HT) for a list of sale items
 */
export const calculateTotalHT = (items: SaleItem[]): number => {
  return items.reduce((total, item) => total + item.totalAmountHT, 0);
};

/**
 * Calculate total amount including tax (TTC) for a list of sale items
 */
export const calculateTotalTTC = (items: SaleItem[], taxRate: number = TAX_RATE): number => {
  const totalHT = calculateTotalHT(items);
  return totalHT * (1 + taxRate);
};

/**
 * Calculate item total before tax
 * @param quantity - The quantity of items
 * @param weightInTons - The weight in tons
 * @param pricePerTon - The price per ton
 */
export const calculateItemTotalHT = (quantity: number, weightInTons: number, pricePerTon: number): number => {
  return (quantity || 0) * ((weightInTons || 0) * (pricePerTon || 0));
};

/**
 * Calculate item total including tax
 * @param totalHT - The total before tax
 * @param taxRate - The tax rate (default 19%)
 */
export const calculateItemTotalTTC = (totalHT: number, taxRate: number = TAX_RATE): number => {
  return totalHT * (1 + taxRate);
};

/**
 * Calculate sale summary with all totals
 */
export const calculateSaleSummary = (items: SaleItem[], transportationFee: number = 0, taxRate: number = TAX_RATE) => {
  const itemsTotalHT = calculateTotalHT(items);
  const totalHT = itemsTotalHT + transportationFee;
  const taxAmount = totalHT * taxRate;
  const totalTTC = totalHT + taxAmount;

  return {
    itemsTotalHT,
    transportationFee,
    totalHT,
    taxAmount,
    totalTTC
  };
};

/**
 * Calculate tax amount for a given amount and tax rate
 */
export const calculateTax = (amount: number, taxRate: number): number => {
  return amount * taxRate;
}; 