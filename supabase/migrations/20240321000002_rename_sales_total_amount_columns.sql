-- Rename total_amount_ht to total_amount in sales table
ALTER TABLE sales
RENAME COLUMN total_amount_ht TO total_amount;

-- Rename total_amount_ht to total_amount in sale_items table
ALTER TABLE sale_items
RENAME COLUMN total_amount_ht TO total_amount;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
