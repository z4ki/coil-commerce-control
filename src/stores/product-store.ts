import { create, StateCreator } from 'zustand';
import { Product, ProductType } from '../types/products';
import { ProductSearchFilters } from '../components/products/ProductSearchBar';

interface ProductState {
  products: Product[];
  filters: ProductSearchFilters;
  setProducts: (products: Product[]) => void;
  setFilters: (filters: ProductSearchFilters) => void;
}

export const useProductStore = create<ProductState>((set: StateCreator<ProductState>['setState']) => ({
  products: [],
  filters: {
    searchQuery: '',
    selectedTypes: [],
    dateRange: { from: '', to: '' },
    priceRange: { min: '', max: '' },
  },
  setProducts: (products: Product[]) => set({ products }),
  setFilters: (filters: ProductSearchFilters) => set({ filters }),
})); 