import React from 'react';
import { useProductStore } from '../../stores/product-store';

export function ProductAnalytics() {
  const { products } = useProductStore();

  // Usage Statistics
  const totalProducts = products.length;
  const productTypes = products.reduce((acc, product) => {
    acc[product.productType] = (acc[product.productType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Cost Analysis
  const totalCost = products.reduce((sum, product) => sum + product.totalAmount, 0);
  const averageCost = totalProducts > 0 ? totalCost / totalProducts : 0;

  // Performance Metrics
  const totalSales = products.reduce((sum, product) => sum + product.quantity, 0);
  const averageSaleValue = totalProducts > 0 ? totalSales / totalProducts : 0;

  // Trend Analysis (simplified: just counts by month)
  const monthlyTrend = products.reduce((acc, product) => {
    const month = new Date(product.createdAt).toLocaleString('default', { month: 'long' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Product Analytics</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold">Usage Statistics</h3>
          <p>Total Products: {totalProducts}</p>
          <p>Product Types:</p>
          <ul>
            {Object.entries(productTypes).map(([type, count]) => (
              <li key={type}>{type}: {count}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold">Cost Analysis</h3>
          <p>Total Cost: ${totalCost.toFixed(2)}</p>
          <p>Average Cost: ${averageCost.toFixed(2)}</p>
        </div>

        <div>
          <h3 className="font-semibold">Performance Metrics</h3>
          <p>Total Sales: {totalSales}</p>
          <p>Average Sale Value: {averageSaleValue.toFixed(2)}</p>
        </div>

        <div>
          <h3 className="font-semibold">Trend Analysis</h3>
          <p>Monthly Trends:</p>
          <ul>
            {Object.entries(monthlyTrend).map(([month, count]) => (
              <li key={month}>{month}: {count}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 