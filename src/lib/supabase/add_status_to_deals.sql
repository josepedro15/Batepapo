-- Add status column to deals table
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open' 
CHECK (status IN ('open', 'won', 'lost'));

-- Add updated_at column to deals table
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing deals to have 'open' status
UPDATE deals SET status = 'open' WHERE status IS NULL;
