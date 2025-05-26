-- Add credit balance to clients table
ALTER TABLE clients
ADD COLUMN credit_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- Create credit_transactions table to track all credit-related operations
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    source_type TEXT NOT NULL CHECK (source_type IN ('payment', 'refund', 'manual_adjustment', 'credit_use')),
    source_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for better query performance
CREATE INDEX credit_transactions_client_id_idx ON credit_transactions(client_id);
CREATE INDEX credit_transactions_created_at_idx ON credit_transactions(created_at);

-- Add credit-related fields to payments table
ALTER TABLE payments
ADD COLUMN generates_credit BOOLEAN DEFAULT false,
ADD COLUMN credit_amount DECIMAL(10,2) DEFAULT 0.00;

-- Create a function to update client credit balance
CREATE OR REPLACE FUNCTION update_client_credit_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'credit' THEN
            UPDATE clients 
            SET credit_balance = credit_balance + NEW.amount
            WHERE id = NEW.client_id;
        ELSE
            UPDATE clients 
            SET credit_balance = credit_balance - NEW.amount
            WHERE id = NEW.client_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.type = 'credit' THEN
            UPDATE clients 
            SET credit_balance = credit_balance - OLD.amount
            WHERE id = OLD.client_id;
        ELSE
            UPDATE clients 
            SET credit_balance = credit_balance + OLD.amount
            WHERE id = OLD.client_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update client credit balance
CREATE TRIGGER update_credit_balance
AFTER INSERT OR DELETE ON credit_transactions
FOR EACH ROW
EXECUTE FUNCTION update_client_credit_balance();

-- Add RLS policies for credit_transactions
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON credit_transactions
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON credit_transactions
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON credit_transactions
FOR UPDATE TO authenticated USING (true);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema'; 