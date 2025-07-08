# Project Architecture (2024-07, Audit Log Enhanced)

## Database (Local SQLite)
- **Core Tables:**
  - `clients`, `sales`, `invoices`, `payments`, `settings`, `sync_operations`, `product_templates`
  - **Sale Items:**
    - `sale_items` (base, with `product_type` column)
    - Specialized: `coil_sale_items`, `corrugated_sheet_items`, `steel_slitting_strip_items`, `steel_slitting_sheet_items`, `sheet_sale_items`, `slitting_sale_items`, `custom_sale_items`
  - **Soft Delete:** All entities have `is_deleted` and `deleted_at` columns
  - **Audit Log:**  
    - `audit_log` table records all critical actions (create, update, delete, soft delete, restore) for core entities.
    - Each entry includes: `action`, `entity_type`, `entity_id`, `user_id`, `timestamp`, and `details`.
    - Used for compliance, debugging, and accountability.
  - **Sync:** `sync_operations` table for offline/online logging
  - **Indexes:** For performance on key columns (e.g., `sync_status`, `product_type`)
  - **Product Templates:** For quick-add and default values
  - **Settings:** Invoice, sync, and product settings tables
- **Triggers:**
  - Automatic update of `invoices.is_paid` and `invoices.paid_at` based on non-deleted payments
- **Migrations:**
  - All schema changes tracked and applied via sqlx migrations
  - Audit log table added in 2024-07 migration

## Audit Log Table Schema

| Column      | Type     | Description                                      |
|-------------|----------|--------------------------------------------------|
| id          | INTEGER  | Primary key (autoincrement)                      |
| action      | TEXT     | Action performed (e.g., 'soft_delete', 'update') |
| entity_type | TEXT     | Entity type (e.g., 'invoice', 'payment')         |
| entity_id   | TEXT     | ID of the affected entity                        |
| user_id     | TEXT     | User who performed the action (nullable)         |
| timestamp   | DATETIME | When the action occurred                         |
| details     | TEXT     | Additional context/details (nullable)            |

## Analytics & Reporting (Sold Products Analytics)
- **Sold Products Analytics Page:**
  - Advanced filtering: date range, product type, client (search bar), multi-select chips for thickness/width (dynamically fetched from DB), unit price min/max, payment status (All/Paid/Unpaid)
  - Filter chips for thickness and width are dynamically generated from unique values in the sales data (not hardcoded)
  - Summary cards: total weight, revenue, quantity, unique clients, etc., always match filtered data
  - Export to Excel: exports filtered table and summary rows, always in French
  - Conditional summary display (e.g., meters for corrugated sheet)
  - Full i18n support: all UI strings use translation keys, easy to extend
  - Modern, responsive UI with visual indicators for payment status
  - Data flow: frontend sends filters to backend, backend joins sale_items, sales, clients, invoices, applies filters, and returns analytics/summary
  - Error handling, loading states, and accessibility

## Rust Backend (Tauri)
- **Command Structure:**
  - All CRUD for clients, sales, invoices, payments, sale items, product templates
  - Soft delete, restore, and get-deleted for all core entities
  - **Analytics/Reporting:**
    - Tauri commands for analytics: get_sold_products_analytics, get_sold_products_summary, get_unique_thickness_width
    - get_unique_thickness_width returns all unique thickness and width values from sale_items for dynamic filter chips
    - Analytics queries join sale_items, sales, clients, invoices, and apply all filters from frontend
    - Export and summary logic matches frontend table and summary cards
  - **Audit Logging:**
    - All critical actions call a utility to insert an audit log entry.
    - Audit log is written atomically with the main action for consistency.
    - Audit log can be queried and exported for admin/audit purposes.
  - Bulk and atomic operations (e.g., mark/unmark sales as invoiced)
  - Product-specific validation and calculation (via Rust enums and traits)
  - PDF/Excel export for invoices and sales
  - Settings management (invoice, sync, product)
  - Sync logging and offline-first support
  - Backup/restore commands for local database
  - Error handling and logging throughout
- **Product Types:**
  - Enum-based model for sale items: `Coil`, `CorrugatedSheet`, `SteelSlittingStrip`, `SteelSlittingSheet`, `Sheet`, `Slitting`, `Custom`
  - Validation and calculation logic per product type
  - All product types support user-editable description fields
- **Testing:**
  - Unit tests for database, business logic, and sync
  - Integration tests for command flows
  - Migration and backup/restore tests

## Frontend (React + Tauri API)
- **API Layer:**
  - TypeScript wrappers for all Tauri commands
  - Type-safe interfaces matching Rust structs
  - Error handling, loading states, and offline queuing
  - **Analytics/Reporting:**
    - Sold Products Analytics page with advanced filtering, summary cards, and export
    - Dynamic filter chips for thickness/width (fetched from backend, not hardcoded)
    - Client filter uses a search bar with autocomplete
    - All UI strings use translation keys (i18n)
    - Modern, responsive, and accessible UI
    - Robust state management for filters, loading, and errors
  - **Audit Log Integration:**
    - Service functions expect audit logging for all critical actions.
- **UI Components:**
  - Dynamic forms for all product types (coil, corrugated sheet, slitting, custom, etc.)
  - Product type selector and template manager
  - Editable description for all sale items
  - Robust state management (React context, Zustand for offline/sync)
  - Soft delete/restore UI for all entities
  - PDF/Excel export triggers
  - Backup/restore UI
  - Offline indicator, sync manager, and conflict resolver
  - Product analytics and reporting
- **Testing:**
  - Unit, integration, and E2E tests for all flows
  - Product-specific and calculation accuracy tests
  - Migration and sync scenario tests
  - **Audit Log Tests:**  
    - Ensure audit log entries are created for all critical actions.

## Key Features & Decisions
- **Offline-First:**
  - All CRUD and product management works offline, with sync logging for future cloud backup
- **Product Extensibility:**
  - New product types can be added with minimal schema and UI changes
- **Soft Delete & Audit Log:**
  - All core entities support soft delete and audit logging, with UI and backend support
- **Validation & Calculation:**
  - Backend and frontend validation for all product types, with shared calculation logic
- **Backup/Restore:**
  - Full local database export/import, with UI and backend support
- **Testing:**
  - Comprehensive test coverage for all business logic, UI, and data flows

## Internationalization (i18n) & Translations
- The app uses a centralized translation system defined in `LanguageContext.tsx`.
- Supports English and French out of the box; easily extensible to more languages.
- All user-facing UI text, including archive/restore/payment toggles and dialogs, is referenced by translation keys (e.g., `invoices.showArchive`, `payments.showActive`, `general.restore`).
- The translation system is used throughout the React frontend via the `useLanguage` hook and `t(key)` function.
- To add new translation keys, update the `translations` object in `LanguageContext.tsx` for each language.
- To add a new language, add a new language code and translation object to the same file.
- This ensures a fully translatable and user-friendly experience for all supported languages.

---

**This architecture ensures robust data integrity, accountability, and compliance for all financial and business-critical actions in the app.**

## Settings Table Schema

The `settings` table stores global application configuration, company info, and user preferences. It is created in the initial migration and always present in the database.

| Column           | Type     | Description                                 |
|------------------|----------|---------------------------------------------|
| id               | TEXT     | Primary key (UUID, auto-generated)          |
| company_name     | TEXT     | Company name (required)                     |
| company_address  | TEXT     | Company address (required)                  |
| company_phone    | TEXT     | Company phone (required)                    |
| company_email    | TEXT     | Company email (optional)                    |
| company_logo     | TEXT     | Path or URL to company logo (optional)      |
| tax_rate         | REAL     | Default tax rate (default: 0.19)            |
| currency         | TEXT     | Currency code (default: 'DZD')              |
| nif              | TEXT     | NIF (optional)                              |
| nis              | TEXT     | NIS (optional)                              |
| rc               | TEXT     | RC (optional)                               |
| ai               | TEXT     | AI (optional)                               |
| rib              | TEXT     | RIB (optional)                              |
| language         | TEXT     | Language code (default: 'en')               |
| theme            | TEXT     | Theme (default: 'light')                    |
| notifications    | BOOLEAN  | Enable notifications (default: true)        |
| dark_mode        | BOOLEAN  | Enable dark mode (default: false)           |
| user_id          | TEXT     | User ID (optional)                          |
| created_at       | DATETIME | Row creation timestamp                      |
| updated_at       | DATETIME | Row last update timestamp                   |

This table is used by the backend to ensure a single row always exists for application-wide settings, and is managed via the `get_settings` and `update_settings` Tauri commands.
