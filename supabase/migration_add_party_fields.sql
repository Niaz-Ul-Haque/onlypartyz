-- Add new useful fields to parties table

ALTER TABLE parties
ADD COLUMN IF NOT EXISTS rsvp_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS max_capacity INTEGER,
ADD COLUMN IF NOT EXISTS dress_code TEXT,
ADD COLUMN IF NOT EXISTS party_type TEXT,
ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Add comments
COMMENT ON COLUMN parties.rsvp_deadline IS 'Deadline for guests to RSVP';
COMMENT ON COLUMN parties.max_capacity IS 'Maximum number of guests allowed';
COMMENT ON COLUMN parties.dress_code IS 'Dress code for the party (e.g., Casual, Formal, Costume)';
COMMENT ON COLUMN parties.party_type IS 'Type of party (e.g., Birthday, Wedding, BBQ)';
COMMENT ON COLUMN parties.special_instructions IS 'Additional instructions for guests (parking, what to bring, etc.)';
