# Product Types Implementation Plan

## Overview
This document outlines the plan to extend the system to support additional product types beyond coils, specifically corrugated sheets and steel slitting products.

## Product Types & Fields

### 1. Corrugated Sheets
- **Fields & Mapping:**
  - Length (meters) → stored in `coil_width`
  - Quantity (number of sheets) → stored in `quantity`
  - Unit price per meter → stored in `price_per_ton`
  - Total amount → stored in `total_amount`
  - **Note:** Unused fields (e.g., `coil_thickness`, `coil_weight`) are left NULL.

### 2. Steel Slitting (Strips & Sheets)
- **Fields & Mapping:**
  - Thickness (mm) → stored in `coil_thickness`
  - Width (mm) → stored in `coil_width`
  - Weight (kg) → stored in `coil_weight`
  - Price per ton → stored in `price_per_ton`
  - Quantity → stored in `quantity`
  - Total amount → stored in `total_amount`
  - **Note:** Unused fields are left NULL.

### 3. Coils (Existing)
- **Fields:**
  - All original fields as currently used.

## Technical Implementation

### 1. Data Model Updates
- **Add `product_type` column** (e.g., `'COIL'`, `'CORRUGATED_SHEET'`, `'STEEL_SLITTING'`) to `sale_items` table.  
  _Completed: Migration added and applied (2024-06-09)_
- **Document** which columns are used for each product type; leave others NULL.
- Create TypeScript discriminated unions for each product type.
- **All product types must have a user-editable description input field in the UI. Auto-generation logic should provide only a default value that can be overridden by the user.**

### 2. Backend Implementation
- **Update backend models** to include `product_type` in SaleItem and CreateSaleItemRequest.  
  _Completed: Rust structs updated (2024-06-09)_
- **Add backend validation** for product_type-specific requirements.  
  _Completed: Validation logic added (2024-06-09)_
- **Implement backend calculation** for total_amount per product_type.  
  _Completed: Calculation logic added (2024-06-09)_

### 3. UI Components
- Create new form components:
  - `CorrugatedSheetItemForm.tsx`
  - `SlittingItemForm.tsx`
- Update `SaleItemForm` to handle dynamic form selection based on `product_type`.
- Add product type selector.
- **Ensure the description field is always present and editable for all product types.**

### 4. Business Logic
- Implement calculation utilities for each product type:
  - Corrugated Sheet: `total = unit price × quantity × length`
  - Steel Slitting: `total = price per ton × weight`
- Update validation schemas.
- Modify PDF/Excel export logic.

### 5. Testing
- Unit tests for calculations.
- Integration tests for form submission.
- End-to-end tests for complete flow.

## Migration Strategy
1. Database migration: add `product_type` column.  
   _Completed (2024-06-09)_
2. Backend API updates to support new product types and column usage.  
   _Completed (2024-06-09)_
3. Frontend implementation for new forms and logic.
4. Testing and validation.
5. Deployment.

## Dependencies
- Update TypeScript types.
- Database migration scripts.
- UI component library updates.

## Timeline
1. Phase 1: Data Model & API 
2. Phase 2: UI Implementation 
3. Phase 3: Testing & Refinement 
4. Phase 4: Deployment

## Open Questions
- How should we handle existing coil products during migration?
- Are there any additional product types we should plan for?
- Do we need to update any reporting or analytics?
