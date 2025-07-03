# Sold Products Analytics Page - Development Specification

## Overview
Create a comprehensive sold products analytics page that allows filtering and analysis of all sold products with advanced filtering capabilities and weight calculations.

## Page Requirements

### 1. Page Structure & Design
- **Reuse existing app layout and design patterns**
- Follow the same styling, components, and UI patterns as the current invoices page
- Use consistent navigation, header, and sidebar structure
- Implement the same color scheme, typography, and spacing
- Page title: "Sold Products Analytics"
- URL route: `/analytics/sold-products`

### 2. Core Features

#### A. Advanced Filtering System
Create a comprehensive filter panel with the following filters:

**Date Range Filter:**
- Start Date picker
- End Date picker
- Quick preset buttons: "Last 7 days", "Last 30 days", "Last 3 months", "Last 6 months", "This year", "All time"

**Product Filters:**
- Product dropdown/search (with autocomplete)
- Category filter (if products have categories)
- Product type filter

**Client Filters:**
- Client dropdown/search (with autocomplete)
- Client type filter (if applicable)

**Thickness Filter:**
- Thickness range slider or input fields (min/max)
- Common thickness preset buttons (e.g., "1mm", "2mm", "3mm", etc.)

**Additional Filters:**
- Payment status (paid/unpaid)
- Invoice status
- Quantity range filter
- Price range filter

#### B. Results Display
**Summary Cards (Top of page):**
- Total Weight Sold (kg/tons)
- Total Revenue
- Total Quantity Sold
- Number of Unique Products
- Number of Unique Clients
- Average Order Value

**Data Table:**
Display filtered results in a sortable table with columns:
- Product Name
- Client Name
- Thickness (mm)
- Quantity Sold
- Weight (kg)
- Unit Price
- Total Price
- Invoice Number
- Sale Date
- Payment Status

**Export Options:**
- Export to CSV
- Export to Excel
- Print view

#### C. Visualization (Optional Enhancement)
- Weight distribution chart by product
- Sales timeline chart
- Top clients by weight chart
- Thickness distribution chart

### 3. Backend Implementation

#### A. Database Schema Considerations
Ensure the following tables/relationships exist:
- `sales` table with product_id, invoice_id, quantity, price, etc.
- `products` table with name, thickness, weight_per_unit, category, etc.
- `invoices` table with client_id, date, is_paid, etc.
- `clients` table with name, type, etc.

#### B. New Tauri Command
Create a new command: `get_sold_products_analytics`

**Input Parameters:**
```rust
#[derive(Debug, Deserialize)]
pub struct SoldProductsFilter {
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub product_ids: Option<Vec<i64>>,
    pub client_ids: Option<Vec<i64>>,
    pub thickness_min: Option<f64>,
    pub thickness_max: Option<f64>,
    pub is_paid: Option<bool>,
    pub category: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}
```

**SQL Query Structure:**
```sql
SELECT 
    s.id as sale_id,
    s.quantity,
    s.price as unit_price,
    s.total_price,
    p.name as product_name,
    p.thickness,
    p.weight_per_unit,
    p.category,
    (s.quantity * p.weight_per_unit) as total_weight,
    c.name as client_name,
    c.type as client_type,
    i.invoice_number,
    i.date as sale_date,
    i.is_paid,
    i.paid_at
FROM sales s
JOIN products p ON s.product_id = p.id
JOIN invoices i ON s.invoice_id = i.id
JOIN clients c ON i.client_id = c.id
WHERE i.is_deleted = 0
    AND (? IS NULL OR i.date >= ?)
    AND (? IS NULL OR i.date <= ?)
    AND (? IS NULL OR s.product_id IN (?))
    AND (? IS NULL OR i.client_id IN (?))
    AND (? IS NULL OR p.thickness >= ?)
    AND (? IS NULL OR p.thickness <= ?)
    AND (? IS NULL OR i.is_paid = ?)
    AND (? IS NULL OR p.category = ?)
ORDER BY i.date DESC
LIMIT ? OFFSET ?
```

#### C. Summary Statistics Command
Create: `get_sold_products_summary`

Returns aggregated data:
```rust
pub struct SoldProductsSummary {
    pub total_weight: f64,
    pub total_revenue: f64,
    pub total_quantity: i64,
    pub unique_products: i64,
    pub unique_clients: i64,
    pub average_order_value: f64,
}
```

### 4. Frontend Implementation

#### A. State Management
```typescript
interface SoldProductsState {
  filters: SoldProductsFilter;
  products: SoldProduct[];
  summary: SoldProductsSummary;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

#### B. API Service
Create `soldProductsService.ts`:
```typescript
export const getSoldProductsAnalytics = async (filters: SoldProductsFilter): Promise<SoldProduct[]> => {
  // Implementation
};

export const getSoldProductsSummary = async (filters: SoldProductsFilter): Promise<SoldProductsSummary> => {
  // Implementation
};
```

#### C. Component Structure
```
SoldProductsAnalytics.tsx
├── FilterPanel.tsx
│   ├── DateRangeFilter.tsx
│   ├── ProductFilter.tsx
│   ├── ClientFilter.tsx
│   ├── ThicknessFilter.tsx
│   └── QuickFilters.tsx
├── SummaryCards.tsx
├── ProductsTable.tsx
├── ExportButtons.tsx
└── LoadingSpinner.tsx
```

### 5. Technical Requirements

#### A. Performance Considerations
- Implement pagination for large datasets
- Add loading states and skeleton screens
- Debounce filter inputs to avoid excessive API calls
- Cache filter options (products, clients) for better UX

#### B. Responsive Design
- Mobile-first approach
- Collapsible filter panel on mobile
- Horizontal scrolling for table on small screens
- Touch-friendly filter controls

#### C. Error Handling
- Graceful error messages for failed API calls
- Input validation for filter values
- Fallback states for empty results

### 6. Implementation Steps

1. **Backend First:**
   - Create database migrations if needed
   - Implement Tauri commands
   - Test SQL queries with sample data

2. **Frontend Core:**
   - Create page route and basic layout
   - Implement filter components
   - Create data fetching logic

3. **UI Polish:**
   - Add loading states
   - Implement responsive design
   - Add export functionality

4. **Testing:**
   - Test with various filter combinations
   - Verify calculations are correct
   - Test edge cases (empty results, large datasets)

### 7. Code Reuse Guidelines

**From existing codebase, reuse:**
- Layout components and styling
- Filter UI patterns from invoices page
- Table components and sorting logic
- API service patterns
- Error handling patterns
- Loading states and spinners
- Modal and popup components
- Form components and validation

**Tauri API Bridge Pattern:**
```typescript
export const tauriApi = {
  // ... existing methods
  analytics: {
    getSoldProducts: (filters: SoldProductsFilter) => 
      core.invoke('get_sold_products_analytics', { filters }),
    getSoldProductsSummary: (filters: SoldProductsFilter) => 
      core.invoke('get_sold_products_summary', { filters }),
  },
};
```

### 8. Sample Data Structure

**Expected Product Data:**
```typescript
interface SoldProduct {
  sale_id: number;
  product_name: string;
  client_name: string;
  thickness: number;
  quantity: number;
  weight_per_unit: number;
  total_weight: number;
  unit_price: number;
  total_price: number;
  invoice_number: string;
  sale_date: string;
  is_paid: boolean;
  category?: string;
}
```

### 9. Success Criteria

- [ ] Page loads and displays sold products data
- [ ] All filters work correctly and update results
- [ ] Weight calculations are accurate
- [ ] Summary statistics are correct
- [ ] Export functionality works
- [ ] Page is responsive and matches app design
- [ ] Performance is good with large datasets
- [ ] Error handling works properly

This specification provides a complete blueprint for implementing a comprehensive sold products analytics page that integrates seamlessly with your existing application architecture.