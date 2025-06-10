-- Initial schema for local SQLite database
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    nif TEXT,
    nis TEXT,
    rc TEXT,
    ai TEXT,
    rib TEXT,
    notes TEXT,
    credit_balance REAL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    total_amount REAL NOT NULL,
    is_paid BOOLEAN DEFAULT false,
    paid_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    invoice_id TEXT,
    date TEXT NOT NULL,
    total_amount REAL NOT NULL,
    tax_rate REAL NOT NULL DEFAULT 0,
    transportation_fee REAL,
    is_invoiced BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    method TEXT CHECK (method IN ('cash', 'bank_transfer', 'check', 'term')),
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    generates_credit BOOLEAN DEFAULT false,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS credit_transactions (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT CHECK (type IN ('credit', 'debit')),
    source_type TEXT CHECK (source_type IN ('payment', 'refund', 'manual_adjustment', 'credit_use')),
    source_id TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    table_name TEXT NOT NULL,
    data TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'error')),
    error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_client ON sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
CREATE INDEX IF NOT EXISTS idx_credit_client ON credit_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_credit_date ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_timestamp ON sync_queue(timestamp);