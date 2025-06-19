-- Keep it simple first - match your current Supabase structure
CREATE TABLE clients (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    nif TEXT,
    nis TEXT,
    rc TEXT,
    ai TEXT,
    rib TEXT,
    credit_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    client_id TEXT NOT NULL,
    date DATE NOT NULL,
    total_amount REAL NOT NULL,
    total_amount_ttc REAL NOT NULL,
    is_invoiced BOOLEAN DEFAULT FALSE,
    invoice_id TEXT,
    notes TEXT,
    payment_method TEXT,
    transportation_fee REAL,
    tax_rate REAL DEFAULT 0.19,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE sale_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    sale_id TEXT NOT NULL,
    description TEXT NOT NULL,
    coil_ref TEXT,
    coil_thickness REAL,
    coil_width REAL,
    top_coat_ral TEXT,
    back_coat_ral TEXT,
    coil_weight REAL,
    quantity REAL NOT NULL,
    price_per_ton REAL NOT NULL,
    total_amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

CREATE TABLE invoices (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    invoice_number TEXT NOT NULL UNIQUE,
    client_id TEXT NOT NULL,
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount_ht REAL NOT NULL,
    total_amount_ttc REAL NOT NULL,
    tax_rate REAL DEFAULT 0.19,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at DATETIME,
    payment_method TEXT,
    transportation_fee REAL,
    transportation_fee_ttc REAL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE invoice_sales (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    invoice_id TEXT NOT NULL,
    sale_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

CREATE TABLE payments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    client_id TEXT NOT NULL,
    sale_id TEXT NOT NULL,
    bulk_payment_id TEXT,
    amount REAL NOT NULL,
    date DATE NOT NULL,
    method TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (sale_id) REFERENCES sales(id)
);

CREATE TABLE bulk_payments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    client_id TEXT NOT NULL,
    total_amount REAL NOT NULL,
    date DATE NOT NULL,
    method TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE credit_transactions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    client_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    source_type TEXT NOT NULL CHECK (source_type IN ('payment', 'refund', 'manual_adjustment', 'credit_use')),
    source_id TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE settings (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    company_name TEXT NOT NULL,
    company_address TEXT NOT NULL,
    company_phone TEXT NOT NULL,
    company_email TEXT NOT NULL,
    company_logo TEXT,
    tax_rate REAL DEFAULT 0.19,
    currency TEXT DEFAULT 'DZD',
    nif TEXT,
    nis TEXT,
    rc TEXT,
    ai TEXT,
    rib TEXT,
    language TEXT DEFAULT 'en',
    theme TEXT DEFAULT 'light',
    notifications BOOLEAN DEFAULT true,
    dark_mode BOOLEAN DEFAULT false,
    user_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_sales_client_id ON sales(client_id);
CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_date ON invoices(date);
CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_payments_sale_id ON payments(sale_id);
CREATE INDEX idx_credit_transactions_client_id ON credit_transactions(client_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at); 