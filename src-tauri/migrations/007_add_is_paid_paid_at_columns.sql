-- 20240713_add_is_paid_paid_at_columns.sql
-- Ensure is_paid and paid_at columns exist for both invoices and sales tables

-- Add to sales table if missing
ALTER TABLE sales ADD COLUMN is_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE sales ADD COLUMN paid_at DATETIME; 