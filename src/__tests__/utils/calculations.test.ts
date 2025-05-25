import { calculateTotalHT, calculateTotalTTC, calculateTax } from '../../utils/calculations';
import { SaleItem } from '../../types';

describe('Financial Calculations', () => {
  describe('calculateTotalHT', () => {
    it('should calculate total HT for empty items array', () => {
      expect(calculateTotalHT([])).toBe(0);
    });

    it('should calculate total HT for single item', () => {
      const items: SaleItem[] = [{
        id: '1',
        description: 'Test Item',
        quantity: 10,
        pricePerTon: 1000,
        totalAmountHT: 10000,
        totalAmountTTC: 11900
      }];
      expect(calculateTotalHT(items)).toBe(10000);
    });

    it('should calculate total HT for multiple items', () => {
      const items: SaleItem[] = [
        {
          id: '1',
          description: 'Item 1',
          quantity: 10,
          pricePerTon: 1000,
          totalAmountHT: 10000,
          totalAmountTTC: 11900
        },
        {
          id: '2',
          description: 'Item 2',
          quantity: 5,
          pricePerTon: 2000,
          totalAmountHT: 10000,
          totalAmountTTC: 11900
        }
      ];
      expect(calculateTotalHT(items)).toBe(20000);
    });

    it('should handle very large numbers', () => {
      const items: SaleItem[] = [{
        id: '1',
        description: 'Large Item',
        quantity: 1000000,
        pricePerTon: 1000000,
        totalAmountHT: 1000000000000,
        totalAmountTTC: 1190000000000
      }];
      expect(calculateTotalHT(items)).toBe(1000000000000);
    });

    it('should handle very small numbers', () => {
      const items: SaleItem[] = [{
        id: '1',
        description: 'Small Item',
        quantity: 0.0001,
        pricePerTon: 0.0001,
        totalAmountHT: 0.00000001,
        totalAmountTTC: 0.0000000119
      }];
      expect(calculateTotalHT(items)).toBe(0.00000001);
    });
  });

  describe('calculateTotalTTC', () => {
    const TAX_RATE = 0.19; // 19% VAT

    it('should calculate total TTC for empty items array', () => {
      expect(calculateTotalTTC([], TAX_RATE)).toBe(0);
    });

    it('should calculate total TTC for single item', () => {
      const items: SaleItem[] = [{
        id: '1',
        description: 'Test Item',
        quantity: 10,
        pricePerTon: 1000,
        totalAmountHT: 10000,
        totalAmountTTC: 11900
      }];
      expect(calculateTotalTTC(items, TAX_RATE)).toBe(11900);
    });

    it('should calculate total TTC for multiple items', () => {
      const items: SaleItem[] = [
        {
          id: '1',
          description: 'Item 1',
          quantity: 10,
          pricePerTon: 1000,
          totalAmountHT: 10000,
          totalAmountTTC: 11900
        },
        {
          id: '2',
          description: 'Item 2',
          quantity: 5,
          pricePerTon: 2000,
          totalAmountHT: 10000,
          totalAmountTTC: 11900
        }
      ];
      expect(calculateTotalTTC(items, TAX_RATE)).toBe(23800);
    });

    it('should handle very large numbers', () => {
      const items: SaleItem[] = [{
        id: '1',
        description: 'Large Item',
        quantity: 1000000,
        pricePerTon: 1000000,
        totalAmountHT: 1000000000000,
        totalAmountTTC: 1190000000000
      }];
      expect(calculateTotalTTC(items, TAX_RATE)).toBe(1190000000000);
    });

    it('should handle very small numbers', () => {
      const items: SaleItem[] = [{
        id: '1',
        description: 'Small Item',
        quantity: 0.0001,
        pricePerTon: 0.0001,
        totalAmountHT: 0.00000001,
        totalAmountTTC: 0.0000000119
      }];
      expect(Number(calculateTotalTTC(items, TAX_RATE).toFixed(10))).toBe(0.0000000119);
    });

    it('should handle zero tax rate', () => {
      const items: SaleItem[] = [{
        id: '1',
        description: 'Test Item',
        quantity: 10,
        pricePerTon: 1000,
        totalAmountHT: 10000,
        totalAmountTTC: 10000
      }];
      expect(calculateTotalTTC(items, 0)).toBe(10000);
    });
  });

  describe('calculateTax', () => {
    const TAX_RATE = 0.19; // 19% VAT

    it('should calculate tax for zero amount', () => {
      expect(calculateTax(0, TAX_RATE)).toBe(0);
    });

    it('should calculate tax for positive amount', () => {
      expect(calculateTax(1000, TAX_RATE)).toBe(190);
    });

    it('should calculate tax for very large amount', () => {
      expect(calculateTax(1000000000000, TAX_RATE)).toBe(190000000000);
    });

    it('should calculate tax for very small amount', () => {
      expect(Number(calculateTax(0.00000001, TAX_RATE).toFixed(10))).toBe(0.0000000019);
    });

    it('should handle zero tax rate', () => {
      expect(calculateTax(1000, 0)).toBe(0);
    });

    it('should handle 100% tax rate', () => {
      expect(calculateTax(1000, 1)).toBe(1000);
    });
  });
}); 