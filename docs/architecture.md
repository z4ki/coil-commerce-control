# Project Architecture

## Database

- Local SQLite
- Tables:
  - `sale_items` (base)
  - `coil_sale_items`, `sheet_sale_items`, `slitting_sale_items` (specialized)
  - Foreign key: `sale_items.id -> coil_sale_items.sale_item_id`
- Sync logging in `sync_operations` table
- Soft delete via `deleted_at` column

## Rust Backend

- All commands in `src-tauri/src/commands/`
- Sale items handled via Rust enum:

```rust
#[serde(tag = "product_type")]
pub enum SaleItem {
  Coil { ... },
  Sheet { ... },
  Slitting { ... }
}
