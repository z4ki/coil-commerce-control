-- Create product history table
CREATE TABLE product_history (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    product_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT NOT NULL,
    changes JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES sale_items(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create index for faster history lookups
CREATE INDEX idx_product_history_product_id ON product_history(product_id);
CREATE INDEX idx_product_history_timestamp ON product_history(timestamp);

-- Add trigger to update updated_at
CREATE TRIGGER update_product_history_updated_at
AFTER UPDATE ON product_history
FOR EACH ROW
BEGIN
    UPDATE product_history SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END; 