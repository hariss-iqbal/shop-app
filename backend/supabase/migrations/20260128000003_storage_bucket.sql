-- Migration: Create phone-images storage bucket
-- Feature: F-002 - Supabase Database Schema and Migrations
-- Feature: F-003 - Row Level Security (RLS) Policies (storage policies)
-- Feature: F-040 - Supabase Storage Bucket Configuration (M-13 Storage)
--
-- Storage Access Control:
-- -----------------------
-- - Public read access for phone images (anyone can view)
-- - Authenticated-only write access (upload, update, delete)
-- - Bucket constraints: 5MB max file size, JPEG/PNG/WebP only

-- Create the phone-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'phone-images',
  'phone-images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- ============================================================
-- Storage RLS Policies for phone-images bucket
-- ============================================================

-- Allow public read access (anyone can view images)
CREATE POLICY "phone_images_bucket_public_select"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'phone-images');

-- Allow authenticated users to upload images
CREATE POLICY "phone_images_bucket_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'phone-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "phone_images_bucket_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'phone-images')
WITH CHECK (bucket_id = 'phone-images');

-- Allow authenticated users to delete images
CREATE POLICY "phone_images_bucket_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'phone-images');
