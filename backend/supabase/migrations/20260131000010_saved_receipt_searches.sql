-- Migration: saved_receipt_searches
-- Feature: F-015 Multi-Criteria Receipt Search and Filtering
-- Description: Creates the saved_receipt_searches table for storing frequently used search filter combinations

-- Create saved_receipt_searches table
CREATE TABLE IF NOT EXISTS saved_receipt_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Create unique constraint on name to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_receipt_searches_name ON saved_receipt_searches(name);

-- Create index on is_default for quick default lookup
CREATE INDEX IF NOT EXISTS idx_saved_receipt_searches_is_default ON saved_receipt_searches(is_default) WHERE is_default = true;

-- Create updated_at trigger
CREATE TRIGGER trg_saved_receipt_searches_updated_at
  BEFORE UPDATE ON saved_receipt_searches
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Enable RLS
ALTER TABLE saved_receipt_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only authenticated users can access saved searches
CREATE POLICY "Authenticated users can view saved searches"
  ON saved_receipt_searches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create saved searches"
  ON saved_receipt_searches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update saved searches"
  ON saved_receipt_searches FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete saved searches"
  ON saved_receipt_searches FOR DELETE
  TO authenticated
  USING (true);

-- Comments
COMMENT ON TABLE saved_receipt_searches IS 'Stores frequently used receipt search filter combinations for quick access';
COMMENT ON COLUMN saved_receipt_searches.name IS 'User-friendly name for the saved search';
COMMENT ON COLUMN saved_receipt_searches.filters IS 'JSON object containing filter criteria';
COMMENT ON COLUMN saved_receipt_searches.is_default IS 'When true, this search is applied by default on page load';
