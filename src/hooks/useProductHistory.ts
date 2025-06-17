import { useState, useEffect } from 'react';
import { Product, CoilProduct, SheetProduct, SlittingProduct } from '../types/products';

interface HistoryEntry {
  timestamp: Date;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  user: string;
}

export function useProductHistory(productId: string) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        const response = await fetch(`/api/products/${productId}/history`);
        if (!response.ok) {
          throw new Error('Failed to fetch product history');
        }
        const data = await response.json();
        setHistory(data.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        })));
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchHistory();
    }
  }, [productId]);

  const addHistoryEntry = async (
    changes: { field: string; oldValue: any; newValue: any }[],
    user: string
  ) => {
    try {
      const newEntry: HistoryEntry = {
        timestamp: new Date(),
        changes,
        user,
      };

      // TODO: Replace with actual API call
      const response = await fetch(`/api/products/${productId}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEntry),
      });

      if (!response.ok) {
        throw new Error('Failed to add history entry');
      }

      setHistory((prev) => [newEntry, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    }
  };

  const getChanges = (oldProduct: Product, newProduct: Product) => {
    const changes: { field: string; oldValue: any; newValue: any }[] = [];

    // Compare common fields
    const commonFields = [
      'description',
      'quantity',
      'pricePerTon',
      'totalAmount',
    ] as const;

    for (const field of commonFields) {
      if (oldProduct[field] !== newProduct[field]) {
        changes.push({
          field,
          oldValue: oldProduct[field],
          newValue: newProduct[field],
        });
      }
    }

    // Compare product type specific fields
    if (oldProduct.productType === newProduct.productType) {
      switch (oldProduct.productType) {
        case 'coil': {
          const oldCoil = oldProduct as CoilProduct;
          const newCoil = newProduct as CoilProduct;
          if (oldCoil.thickness !== newCoil.thickness) {
            changes.push({
              field: 'thickness',
              oldValue: oldCoil.thickness,
              newValue: newCoil.thickness,
            });
          }
          if (oldCoil.width !== newCoil.width) {
            changes.push({
              field: 'width',
              oldValue: oldCoil.width,
              newValue: newCoil.width,
            });
          }
          if (oldCoil.weight !== newCoil.weight) {
            changes.push({
              field: 'weight',
              oldValue: oldCoil.weight,
              newValue: newCoil.weight,
            });
          }
          break;
        }

        case 'sheet': {
          const oldSheet = oldProduct as SheetProduct;
          const newSheet = newProduct as SheetProduct;
          if (oldSheet.length !== newSheet.length) {
            changes.push({
              field: 'length',
              oldValue: oldSheet.length,
              newValue: newSheet.length,
            });
          }
          if (oldSheet.width !== newSheet.width) {
            changes.push({
              field: 'width',
              oldValue: oldSheet.width,
              newValue: newSheet.width,
            });
          }
          if (oldSheet.thickness !== newSheet.thickness) {
            changes.push({
              field: 'thickness',
              oldValue: oldSheet.thickness,
              newValue: newSheet.thickness,
            });
          }
          if (oldSheet.sheetCount !== newSheet.sheetCount) {
            changes.push({
              field: 'sheetCount',
              oldValue: oldSheet.sheetCount,
              newValue: newSheet.sheetCount,
            });
          }
          break;
        }

        case 'slitting': {
          const oldSlitting = oldProduct as SlittingProduct;
          const newSlitting = newProduct as SlittingProduct;
          if (oldSlitting.originalWidth !== newSlitting.originalWidth) {
            changes.push({
              field: 'originalWidth',
              oldValue: oldSlitting.originalWidth,
              newValue: newSlitting.originalWidth,
            });
          }
          if (oldSlitting.targetWidth !== newSlitting.targetWidth) {
            changes.push({
              field: 'targetWidth',
              oldValue: oldSlitting.targetWidth,
              newValue: newSlitting.targetWidth,
            });
          }
          if (oldSlitting.thickness !== newSlitting.thickness) {
            changes.push({
              field: 'thickness',
              oldValue: oldSlitting.thickness,
              newValue: newSlitting.thickness,
            });
          }
          if (oldSlitting.metersLength !== newSlitting.metersLength) {
            changes.push({
              field: 'metersLength',
              oldValue: oldSlitting.metersLength,
              newValue: newSlitting.metersLength,
            });
          }
          if (oldSlitting.wastePercentage !== newSlitting.wastePercentage) {
            changes.push({
              field: 'wastePercentage',
              oldValue: oldSlitting.wastePercentage,
              newValue: newSlitting.wastePercentage,
            });
          }
          break;
        }
      }
    }

    return changes;
  };

  return {
    history,
    isLoading,
    error,
    addHistoryEntry,
    getChanges,
  };
} 