import React from 'react';
import { Product } from '../../types/products';

interface ProductHistoryProps {
  product: Product;
  history: Array<{
    timestamp: Date;
    changes: {
      field: string;
      oldValue: any;
      newValue: any;
    }[];
    user: string;
  }>;
}

export function ProductHistory({ product, history }: ProductHistoryProps) {
  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') return value.toLocaleString();
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
  };

  const formatFieldName = (field: string) => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/([a-z])([A-Z])/g, '$1 $2');
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Product History</h2>
      
      <div className="space-y-4">
        {history.map((entry, index) => (
          <div key={index} className="border-l-4 border-indigo-500 pl-4 py-2">
            <div className="flex justify-between items-start">
              <div className="text-sm text-gray-500">
                {entry.timestamp.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                by {entry.user}
              </div>
            </div>
            
            <div className="mt-2 space-y-2">
              {entry.changes.map((change, changeIndex) => (
                <div key={changeIndex} className="text-sm">
                  <span className="font-medium">{formatFieldName(change.field)}</span>
                  <span className="mx-2">changed from</span>
                  <span className="text-gray-600">{formatValue(change.oldValue)}</span>
                  <span className="mx-2">to</span>
                  <span className="text-gray-600">{formatValue(change.newValue)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {history.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          No history available for this product
        </div>
      )}
    </div>
  );
} 