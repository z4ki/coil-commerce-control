-- Migration: Add product_type column to sale_items

ALTER TABLE sale_items ADD COLUMN product_type TEXT NOT NULL DEFAULT 'coil'; 