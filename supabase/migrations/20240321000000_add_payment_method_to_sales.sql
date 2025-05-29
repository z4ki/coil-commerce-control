-- Add payment_method column to sales table if it doesn't exist
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'check', 'term'));

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema'; 