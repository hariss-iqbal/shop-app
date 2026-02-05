-- Phase 2 Part 1: Add 'open_box' to phone_condition enum
-- NOTE: ALTER TYPE ADD VALUE cannot be in the same transaction as statements using the new value
-- The data migration and new columns are in the next migration file (20260207000002)

-- Add 'open_box' to phone_condition enum
ALTER TYPE phone_condition ADD VALUE IF NOT EXISTS 'open_box';
