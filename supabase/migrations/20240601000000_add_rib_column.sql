-- Add RIB column to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS rib TEXT;

-- Update any existing rows to set a default empty value for rib
UPDATE settings SET rib = '' WHERE rib IS NULL;
