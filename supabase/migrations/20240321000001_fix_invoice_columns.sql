-- Rename columns back to match Supabase client types
ALTER TABLE invoices
RENAME COLUMN total_amount_ht_ht TO total_amount_ht;

-- Drop the new columns since we'll use the old structure
ALTER TABLE invoices
DROP COLUMN total_amount_ht_ttc,
DROP COLUMN tax_rate;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema'; 