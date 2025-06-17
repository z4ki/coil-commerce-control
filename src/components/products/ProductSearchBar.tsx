import React from 'react';
import { ProductType } from '../../types/products';
import { useProductStore } from '../../stores/product-store';

export interface ProductSearchFilters {
  searchQuery: string;
  selectedTypes: ProductType[];
  dateRange: { from: string; to: string };
  priceRange: { min: string; max: string };
}

interface ProductSearchBarProps {
  filters: ProductSearchFilters;
  onChange: (filters: ProductSearchFilters) => void;
}

const PRODUCT_TYPE_OPTIONS: { label: string; value: ProductType }[] = [
  { label: 'Coil', value: 'coil' },
  { label: 'Sheet', value: 'sheet' },
  { label: 'Slitting', value: 'slitting' },
  { label: 'Custom', value: 'custom' },
];

export function ProductSearchBar({ filters, onChange }: ProductSearchBarProps) {
  const { products } = useProductStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, [e.target.name]: e.target.value });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value as ProductType);
    onChange({ ...filters, selectedTypes: selected });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...filters,
      dateRange: { ...filters.dateRange, [e.target.name]: e.target.value },
    });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...filters,
      priceRange: { ...filters.priceRange, [e.target.name]: e.target.value },
    });
  };

  const handleTestFilter = () => {
    const filteredProducts = products.filter((product) => {
      if (filters.searchQuery && !product.description.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
        return false;
      }
      if (filters.selectedTypes.length > 0 && !filters.selectedTypes.includes(product.productType)) {
        return false;
      }
      if (filters.dateRange.from && new Date(product.createdAt) < new Date(filters.dateRange.from)) {
        return false;
      }
      if (filters.dateRange.to && new Date(product.createdAt) > new Date(filters.dateRange.to)) {
        return false;
      }
      if (filters.priceRange.min && product.pricePerTon < Number(filters.priceRange.min)) {
        return false;
      }
      if (filters.priceRange.max && product.pricePerTon > Number(filters.priceRange.max)) {
        return false;
      }
      return true;
    });
    console.log('Filtered Products:', filteredProducts);
  };

  return (
    <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-lg shadow mb-4">
      {/* Search Input */}
      <div>
        <label className="block text-xs font-medium text-gray-700">Search</label>
        <input
          type="text"
          name="searchQuery"
          value={filters.searchQuery}
          onChange={handleInputChange}
          placeholder="Search products..."
          className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      {/* Product Type Multi-Select */}
      <div>
        <label className="block text-xs font-medium text-gray-700" htmlFor="product-type-select">Product Type</label>
        <select
          id="product-type-select"
          name="selectedTypes"
          multiple
          value={filters.selectedTypes}
          onChange={handleTypeChange}
          className="mt-1 block w-40 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          title="Filter by product type"
        >
          {PRODUCT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range */}
      <div>
        <label className="block text-xs font-medium text-gray-700" htmlFor="date-from">Date From</label>
        <input
          type="date"
          id="date-from"
          name="from"
          value={filters.dateRange.from}
          onChange={handleDateChange}
          className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          title="Filter from date"
          placeholder="From"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700" htmlFor="date-to">Date To</label>
        <input
          type="date"
          id="date-to"
          name="to"
          value={filters.dateRange.to}
          onChange={handleDateChange}
          className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          title="Filter to date"
          placeholder="To"
        />
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-medium text-gray-700">Min Price</label>
        <input
          type="number"
          name="min"
          value={filters.priceRange.min}
          onChange={handlePriceChange}
          placeholder="Min"
          className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700">Max Price</label>
        <input
          type="number"
          name="max"
          value={filters.priceRange.max}
          onChange={handlePriceChange}
          placeholder="Max"
          className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      {/* Test Filter Button */}
      <button
        onClick={handleTestFilter}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Filter
      </button>
    </div>
  );
} 