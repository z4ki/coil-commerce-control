-- Migration: Add product tables for Phase 4

CREATE TABLE corrugated_sheet_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    sale_id TEXT NOT NULL,
    description TEXT NOT NULL,
    thickness REAL,
    width REAL,
    length REAL,
    color TEXT,
    quantity INTEGER NOT NULL,
    price_per_unit REAL NOT NULL,
    total_amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

CREATE TABLE steel_slitting_strip_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    sale_id TEXT NOT NULL,
    description TEXT NOT NULL,
    thickness REAL,
    width REAL,
    coil_weight REAL,
    quantity INTEGER NOT NULL,
    price_per_unit REAL NOT NULL,
    total_amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- Add more product tables as needed for your business logic 