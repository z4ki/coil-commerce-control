-- Migration: Add check_number column to payments table
ALTER TABLE payments ADD COLUMN check_number TEXT; 