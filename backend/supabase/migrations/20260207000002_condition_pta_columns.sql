-- Phase 2 Part 2: Migrate refurbished data, add condition_rating and PTA status

-- Migrate existing 'refurbished' rows to 'open_box'
UPDATE phones SET condition = 'open_box' WHERE condition = 'refurbished';

-- Add condition_rating column (1-10 scale)
ALTER TABLE phones ADD COLUMN IF NOT EXISTS condition_rating INTEGER;
ALTER TABLE phones ADD CONSTRAINT phones_condition_rating_range
  CHECK (condition_rating IS NULL OR (condition_rating >= 1 AND condition_rating <= 10));

-- Create PTA status enum
DO $$ BEGIN
  CREATE TYPE pta_status AS ENUM ('pta_approved', 'non_pta');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add pta_status column (nullable - for existing phones)
ALTER TABLE phones ADD COLUMN IF NOT EXISTS pta_status pta_status;
