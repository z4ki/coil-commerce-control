-- Add TTC-related columns to invoices table
ALTER TABLE invoices
RENAME COLUMN total_amount TO total_amount_ht;

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS total_amount_ttc DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0.19;

-- Migrate existing data
UPDATE invoices
SET total_amount_ttc = total_amount_ht * 1.19
WHERE total_amount_ttc IS NULL;

-- Make the new columns required after migration
ALTER TABLE invoices
ALTER COLUMN total_amount_ttc SET NOT NULL,
ALTER COLUMN tax_rate SET NOT NULL; 