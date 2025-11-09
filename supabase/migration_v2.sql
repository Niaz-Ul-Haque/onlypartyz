-- Migration V2: Simplified Potluck Item Types with Capacities
-- Run this AFTER the initial schema.sql

-- Drop old potluck structure (if you haven't added data yet)
DROP TABLE IF EXISTS potluck_claims CASCADE;
DROP TABLE IF EXISTS potluck_items CASCADE;
DROP TABLE IF EXISTS potluck_categories CASCADE;

-- Create new simplified structure: item_types with capacities
CREATE TABLE potluck_item_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT capacity_positive CHECK (capacity > 0)
);

-- Guest selections (one per guest per party)
CREATE TABLE potluck_selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  item_type_id UUID NOT NULL REFERENCES potluck_item_types(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(party_id, guest_id)
);

-- Indexes
CREATE INDEX idx_potluck_item_types_party_id ON potluck_item_types(party_id);
CREATE INDEX idx_potluck_selections_party_id ON potluck_selections(party_id);
CREATE INDEX idx_potluck_selections_guest_id ON potluck_selections(guest_id);
CREATE INDEX idx_potluck_selections_item_type_id ON potluck_selections(item_type_id);

-- Trigger for updated_at
CREATE TRIGGER update_potluck_selections_updated_at BEFORE UPDATE ON potluck_selections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE potluck_item_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE potluck_selections ENABLE ROW LEVEL SECURITY;

-- Item Types policies
CREATE POLICY "Admins can manage item types for their parties"
  ON potluck_item_types FOR ALL
  USING (party_id IN (SELECT id FROM parties WHERE created_by = auth.uid()));

CREATE POLICY "Anyone can view item types for non-archived parties"
  ON potluck_item_types FOR SELECT
  USING (party_id IN (SELECT id FROM parties WHERE NOT is_archived));

-- Selections policies
CREATE POLICY "Admins can manage selections for their parties"
  ON potluck_selections FOR ALL
  USING (party_id IN (SELECT id FROM parties WHERE created_by = auth.uid()));

CREATE POLICY "Anyone can view selections for non-archived parties"
  ON potluck_selections FOR SELECT
  USING (party_id IN (SELECT id FROM parties WHERE NOT is_archived));

CREATE POLICY "Guests can create their own selection"
  ON potluck_selections FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Guests can update their own selection"
  ON potluck_selections FOR UPDATE
  USING (true);

CREATE POLICY "Guests can delete their own selection"
  ON potluck_selections FOR DELETE
  USING (true);

-- Function to check capacity before insert/update
CREATE OR REPLACE FUNCTION check_item_type_capacity()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_capacity INTEGER;
BEGIN
  -- Get current count for this item type (excluding this selection if update)
  SELECT COUNT(*) INTO current_count
  FROM potluck_selections
  WHERE item_type_id = NEW.item_type_id
    AND (TG_OP = 'INSERT' OR id != NEW.id);

  -- Get max capacity
  SELECT capacity INTO max_capacity
  FROM potluck_item_types
  WHERE id = NEW.item_type_id;

  -- Check if we're at capacity
  IF current_count >= max_capacity THEN
    RAISE EXCEPTION 'This item type is full. Please choose another option.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce capacity
CREATE TRIGGER enforce_item_type_capacity
  BEFORE INSERT OR UPDATE ON potluck_selections
  FOR EACH ROW
  EXECUTE FUNCTION check_item_type_capacity();

-- View to get capacity stats per item type
CREATE OR REPLACE VIEW potluck_capacity_stats AS
SELECT
  it.id AS item_type_id,
  it.party_id,
  it.name,
  it.capacity,
  it.sort_order,
  COUNT(s.id) AS selections_count,
  (it.capacity - COUNT(s.id)) AS remaining
FROM potluck_item_types it
LEFT JOIN potluck_selections s ON s.item_type_id = it.id
GROUP BY it.id, it.party_id, it.name, it.capacity, it.sort_order;
