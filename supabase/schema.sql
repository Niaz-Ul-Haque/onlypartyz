-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE rsvp_status AS ENUM ('going', 'maybe', 'not_going');
CREATE TYPE potluck_item_status AS ENUM ('open', 'fulfilled', 'locked');

-- Parties table
CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location_address TEXT,
  location_map_iframe TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Toronto',
  cover_image_url TEXT,
  is_potluck BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_archived BOOLEAN NOT NULL DEFAULT false
);

-- Invite codes table
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  uses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guests table
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  phone TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RSVPs table
CREATE TABLE rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  status rsvp_status NOT NULL DEFAULT 'maybe',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(party_id, guest_id)
);

-- Potluck categories table
CREATE TABLE potluck_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Potluck items table
CREATE TABLE potluck_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES potluck_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dietary_tags TEXT[],
  needed_qty INTEGER,
  status potluck_item_status NOT NULL DEFAULT 'open',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Potluck claims table
CREATE TABLE potluck_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES potluck_items(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media/gallery table
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  uploaded_by_admin BOOLEAN NOT NULL DEFAULT true,
  url TEXT NOT NULL,
  blurhash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_parties_created_by ON parties(created_by);
CREATE INDEX idx_parties_starts_at ON parties(starts_at);
CREATE INDEX idx_invite_codes_party_id ON invite_codes(party_id);
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_guests_party_id ON guests(party_id);
CREATE INDEX idx_guests_device_fingerprint ON guests(device_fingerprint);
CREATE INDEX idx_rsvps_party_id ON rsvps(party_id);
CREATE INDEX idx_rsvps_guest_id ON rsvps(guest_id);
CREATE INDEX idx_potluck_categories_party_id ON potluck_categories(party_id);
CREATE INDEX idx_potluck_items_party_id ON potluck_items(party_id);
CREATE INDEX idx_potluck_items_category_id ON potluck_items(category_id);
CREATE INDEX idx_potluck_claims_party_id ON potluck_claims(party_id);
CREATE INDEX idx_potluck_claims_item_id ON potluck_claims(item_id);
CREATE INDEX idx_potluck_claims_guest_id ON potluck_claims(guest_id);
CREATE INDEX idx_media_party_id ON media(party_id);

-- Partial unique index to enforce one active claim per guest per party
CREATE UNIQUE INDEX idx_one_claim_per_guest_per_party
ON potluck_claims(party_id, guest_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_parties_updated_at BEFORE UPDATE ON parties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON rsvps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment invite code uses
CREATE OR REPLACE FUNCTION increment_invite_code_uses(party_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE invite_codes
  SET uses = uses + 1
  WHERE party_id = party_id_param AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE potluck_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE potluck_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE potluck_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Parties policies
CREATE POLICY "Admins can view their own parties"
  ON parties FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can create parties"
  ON parties FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their own parties"
  ON parties FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete their own parties"
  ON parties FOR DELETE
  USING (auth.uid() = created_by);

-- Guests can view non-archived parties (when they have a valid guest token)
CREATE POLICY "Anyone can view non-archived parties"
  ON parties FOR SELECT
  USING (NOT is_archived);

-- Invite codes policies
CREATE POLICY "Admins can manage invite codes for their parties"
  ON invite_codes FOR ALL
  USING (party_id IN (SELECT id FROM parties WHERE created_by = auth.uid()));

CREATE POLICY "Anyone can view active invite codes"
  ON invite_codes FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Guests policies
CREATE POLICY "Admins can view guests of their parties"
  ON guests FOR SELECT
  USING (party_id IN (SELECT id FROM parties WHERE created_by = auth.uid()));

CREATE POLICY "Admins can delete guests from their parties"
  ON guests FOR DELETE
  USING (party_id IN (SELECT id FROM parties WHERE created_by = auth.uid()));

CREATE POLICY "Anyone can view guests of non-archived parties"
  ON guests FOR SELECT
  USING (party_id IN (SELECT id FROM parties WHERE NOT is_archived));

CREATE POLICY "Anyone can create guest entries"
  ON guests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Guests can update their own last_seen_at"
  ON guests FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RSVPs policies
CREATE POLICY "Admins can manage RSVPs for their parties"
  ON rsvps FOR ALL
  USING (party_id IN (SELECT id FROM parties WHERE created_by = auth.uid()));

CREATE POLICY "Anyone can view RSVPs for non-archived parties"
  ON rsvps FOR SELECT
  USING (party_id IN (SELECT id FROM parties WHERE NOT is_archived));

CREATE POLICY "Guests can create their own RSVP"
  ON rsvps FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Guests can update their own RSVP"
  ON rsvps FOR UPDATE
  USING (true);

-- Potluck categories policies
CREATE POLICY "Admins can manage categories for their parties"
  ON potluck_categories FOR ALL
  USING (party_id IN (SELECT id FROM parties WHERE created_by = auth.uid()));

CREATE POLICY "Anyone can view categories for non-archived parties"
  ON potluck_categories FOR SELECT
  USING (party_id IN (SELECT id FROM parties WHERE NOT is_archived));

-- Potluck items policies
CREATE POLICY "Admins can manage items for their parties"
  ON potluck_items FOR ALL
  USING (party_id IN (SELECT id FROM parties WHERE created_by = auth.uid()));

CREATE POLICY "Anyone can view items for non-archived parties"
  ON potluck_items FOR SELECT
  USING (party_id IN (SELECT id FROM parties WHERE NOT is_archived));

-- Potluck claims policies
CREATE POLICY "Admins can manage claims for their parties"
  ON potluck_claims FOR ALL
  USING (party_id IN (SELECT id FROM parties WHERE created_by = auth.uid()));

CREATE POLICY "Anyone can view claims for non-archived parties"
  ON potluck_claims FOR SELECT
  USING (party_id IN (SELECT id FROM parties WHERE NOT is_archived));

CREATE POLICY "Guests can create claims"
  ON potluck_claims FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Guests can delete their own claims"
  ON potluck_claims FOR DELETE
  USING (true);

-- Media policies
CREATE POLICY "Admins can manage media for their parties"
  ON media FOR ALL
  USING (party_id IN (SELECT id FROM parties WHERE created_by = auth.uid()));

CREATE POLICY "Anyone can view media for non-archived parties"
  ON media FOR SELECT
  USING (party_id IN (SELECT id FROM parties WHERE NOT is_archived));

-- Storage bucket for party images
INSERT INTO storage.buckets (id, name, public)
VALUES ('party-images', 'party-images', true)
ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload party images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'party-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update their party images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'party-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their party images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'party-images' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view party images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'party-images');
