-- Add party_size field to guests table for tracking number of people in the party
ALTER TABLE guests ADD COLUMN IF NOT EXISTS party_size INTEGER DEFAULT 1 NOT NULL;

-- Add check constraint to ensure party_size is at least 1
ALTER TABLE guests ADD CONSTRAINT party_size_positive CHECK (party_size >= 1);

-- Update existing records to have party_size of 1 if NULL
UPDATE guests SET party_size = 1 WHERE party_size IS NULL;
