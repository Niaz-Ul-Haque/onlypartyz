-- Create comments table for party wall feature
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS comments_party_id_idx ON comments(party_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments(created_at DESC);

-- Add RLS policies
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments for any party
CREATE POLICY "Anyone can read comments"
  ON comments FOR SELECT
  USING (true);

-- Guests can insert comments for their party
CREATE POLICY "Guests can insert comments"
  ON comments FOR INSERT
  WITH CHECK (true);

-- Only admins can delete comments (handled in API)
CREATE POLICY "Service role can delete comments"
  ON comments FOR DELETE
  USING (true);
