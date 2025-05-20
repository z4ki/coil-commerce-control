-- Step 1: Add new columns to payments table
ALTER TABLE payments
ADD COLUMN sale_id UUID REFERENCES sales(id),
ADD COLUMN client_id UUID REFERENCES clients(id),
ADD COLUMN bulk_payment_id UUID;

-- Step 2: Copy data from invoice_id to sale_id using invoice_sales table
UPDATE payments p
SET sale_id = is.sale_id,
    client_id = s.client_id
FROM invoice_sales is
JOIN sales s ON s.id = is.sale_id
WHERE p.invoice_id = is.invoice_id;

-- Step 3: Make sale_id and client_id NOT NULL after data migration
ALTER TABLE payments
ALTER COLUMN sale_id SET NOT NULL,
ALTER COLUMN client_id SET NOT NULL;

-- Step 4: Drop invoice_id column
ALTER TABLE payments
DROP COLUMN invoice_id; 