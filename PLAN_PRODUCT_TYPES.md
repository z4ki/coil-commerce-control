# Product Types Implementation Plan

## Overview
This document outlines the plan to extend the system to support additional product types beyond coils, specifically corrugated sheets and steel slitting products.

## Product Types & Fields

### 1. Corrugated Sheets
- **Fields**:
  - Length (meters)
  - Thickness (mm)
  - RAL color code
  - Unit price per meter
  - Quantity

### 2. Steel Slitting (Strips & Sheets)
- **Fields**:
  - Thickness (mm)
  - Width (mm)
  - Length (meters)
  - Weight (kg)
  - Price per ton
  - Quantity

## Technical Implementation

### 1. Data Model Updates
- Add `productType` enum to SaleItem
- Update database schema with new columns
- Create TypeScript discriminated unions for each product type

### 2. UI Components
- Create new form components:
  - `CorrugatedSheetItemForm.tsx`
  - `SlittingItemForm.tsx`
- Update `SaleItemForm` to handle dynamic form selection
- Add product type selector

### 3. Business Logic
- Implement calculation utilities for each product type
- Update validation schemas
- Modify PDF/Excel export logic

### 4. Testing
- Unit tests for calculations
- Integration tests for form submission
- End-to-end tests for complete flow

## Migration Strategy
1. Database migration
2. Backend API updates
3. Frontend implementation
4. Testing and validation
5. Deployment

## Dependencies
- Update TypeScript types
- Database migration scripts
- UI component library updates

## Timeline
1. Phase 1: Data Model & API (2 weeks)
2. Phase 2: UI Implementation (2 weeks)
3. Phase 3: Testing & Refinement (1 week)
4. Phase 4: Deployment (1 week)

## Open Questions
- How should we handle existing coil products during migration?
- Are there any additional product types we should plan for?
- Do we need to update any reporting or analytics?
