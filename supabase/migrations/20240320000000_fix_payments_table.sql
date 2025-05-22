-- Drop the existing payments table if it exists
DROP TABLE IF EXISTS payments;

-- Create the payments table with the correct structure
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    bulk_payment_id UUID REFERENCES bulk_payments(id) ON DELETE SET NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('cash', 'bank_transfer', 'check')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX payments_sale_id_idx ON payments(sale_id);
CREATE INDEX payments_client_id_idx ON payments(client_id);
CREATE INDEX payments_bulk_payment_id_idx ON payments(bulk_payment_id);
CREATE INDEX payments_date_idx ON payments(date);

-- Add payment_method column to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'check'));

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema'; 