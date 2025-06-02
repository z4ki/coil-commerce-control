-- Add product type and additional fields to sale_items table
ALTER TABLE sale_items
ADD COLUMN product_type VARCHAR(20) DEFAULT 'STANDARD' NOT NULL,
-- Steel Slitting specific fields
ADD COLUMN input_width NUMERIC(10,2),
ADD COLUMN output_width NUMERIC(10,2),
ADD COLUMN thickness NUMERIC(10,2),
ADD COLUMN weight NUMERIC(10,2),
ADD COLUMN strips_count INTEGER;

-- Add check constraint for product_type
ALTER TABLE sale_items
ADD CONSTRAINT product_type_check 
CHECK (product_type IN ('STANDARD', 'TN40', 'STEEL_SLITTING'));
