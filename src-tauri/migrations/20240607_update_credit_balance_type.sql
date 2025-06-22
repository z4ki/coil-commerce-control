ALTER TABLE clients ADD COLUMN credit_balance_tmp REAL NOT NULL DEFAULT 0.00;
UPDATE clients SET credit_balance_tmp = credit_balance;
ALTER TABLE clients DROP COLUMN credit_balance;
ALTER TABLE clients RENAME COLUMN credit_balance_tmp TO credit_balance;