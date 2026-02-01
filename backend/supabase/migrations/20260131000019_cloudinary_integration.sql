-- Migration: Cloudinary Integration for Phone Images
-- Feature: Cloudinary Integration (Hybrid Approach)
--
-- This migration adds support for Cloudinary image storage while maintaining
-- backward compatibility with existing Supabase Storage images.
--
-- Migration Strategy: Option B - Migrate all existing images to Cloudinary
-- - Add public_id column to track Cloudinary images
-- - Keep storage_path for backward compatibility during migration
-- - After migration is complete, storage_path can be set to empty string

-- Add public_id column to store Cloudinary public ID
ALTER TABLE phone_images ADD COLUMN IF NOT EXISTS public_id TEXT;

-- Add index on public_id for faster lookups when deleting from Cloudinary
CREATE INDEX IF NOT EXISTS idx_phone_images_public_id ON phone_images(public_id);

-- Make storage_path nullable to support Cloudinary-only images
ALTER TABLE phone_images ALTER COLUMN storage_path DROP NOT NULL;

-- Add comment to document the migration
COMMENT ON COLUMN phone_images.public_id IS 'Cloudinary public ID for images stored in Cloudinary. NULL for legacy Supabase Storage images.';
COMMENT ON COLUMN phone_images.storage_path IS 'Supabase Storage path (legacy). Empty string for Cloudinary images, populated for backward compatibility.';

-- Note: After running the migration script to migrate images to Cloudinary,
-- you may optionally want to set storage_path to empty string for Cloudinary images:
-- UPDATE phone_images SET storage_path = '' WHERE public_id IS NOT NULL;
