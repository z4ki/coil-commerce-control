import React from 'react';
import { Product } from '../../types/products';
import { useProductStore } from '../../stores/product-store';

export function ProductList() {
  const { products, filters } = useProductStore();

  const filteredProducts = products.filter((product) => {
    // Filter by search query
    if (filters.searchQuery && !product.description.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
      return false;
    }

    // Filter by product type
    if (filters.selectedTypes.length > 0 && !filters.selectedTypes.includes(product.productType)) {
      return false;
    }

    // Filter by date range
    if (filters.dateRange.from && new Date(product.createdAt) < new Date(filters.dateRange.from)) {
      return false;
    }
    if (filters.dateRange.to && new Date(product.createdAt) > new Date(filters.dateRange.to)) {
      return false;
    }

    // Filter by price range
    if (filters.priceRange.min && product.pricePerTon < Number(filters.priceRange.min)) {
      return false;
    }
    if (filters.priceRange.max && product.pricePerTon > Number(filters.priceRange.max)) {
      return false;
    }

    return true;
  });

  return (
    <div className="mt-4">
      <h2 className="text-lg font-semibold mb-2">Products</h2>
      {filteredProducts.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <ul className="space-y-2">
          {filteredProducts.map((product) => (
            <li key={product.id} className="p-2 border rounded">
              <div className="font-medium">{product.description}</div>
              <div className="text-sm text-gray-500">
                Type: {product.productType} | Price: ${product.pricePerTon}/ton
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 