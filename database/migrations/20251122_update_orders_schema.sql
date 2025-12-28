-- Add new columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS total_amount decimal(10,2) DEFAULT 0;

-- Update RLS policies if needed (usually SELECT * covers new columns)
