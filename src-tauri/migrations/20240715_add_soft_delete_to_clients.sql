ALTER TABLE clients ADD COLUMN is_deleted BOOLEAN DEFAULT 0;
ALTER TABLE clients ADD COLUMN deleted_at DATETIME NULL;
CREATE INDEX IF NOT EXISTS idx_clients_is_deleted ON clients(is_deleted); 