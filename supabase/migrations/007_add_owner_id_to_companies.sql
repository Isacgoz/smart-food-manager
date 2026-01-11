-- Add owner_id column to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Update existing companies to have an owner_id (set to first user for now)
UPDATE companies SET owner_id = (SELECT id FROM auth.users LIMIT 1) WHERE owner_id IS NULL;
