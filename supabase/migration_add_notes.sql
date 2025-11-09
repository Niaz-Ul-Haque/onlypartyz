-- Add notes field to parties table for admin notes
ALTER TABLE parties ADD COLUMN IF NOT EXISTS notes TEXT;
