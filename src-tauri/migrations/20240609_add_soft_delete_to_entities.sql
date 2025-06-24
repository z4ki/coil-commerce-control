ALTER TABLE invoices ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN deleted_at DATETIME NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_is_deleted ON invoices(is_deleted);

ALTER TABLE sales ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE sales ADD COLUMN deleted_at DATETIME NULL;
CREATE INDEX IF NOT EXISTS idx_sales_is_deleted ON sales(is_deleted);

ALTER TABLE payments ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN deleted_at DATETIME NULL;
CREATE INDEX IF NOT EXISTS idx_payments_is_deleted ON payments(is_deleted); 