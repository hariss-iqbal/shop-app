-- The admin Storage Config page called supabase.storage.getBucket() from the
-- browser, which requires the service_role key. With a normal authenticated
-- user JWT the Storage API replies "Bucket not found", so the page always failed.
--
-- Expose bucket metadata via a SECURITY DEFINER RPC that reads storage.buckets
-- directly (admin-gated). This returns the real public flag / limits and works
-- from the browser with the user's JWT.

CREATE OR REPLACE FUNCTION get_storage_bucket_info(p_bucket_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_bucket RECORD;
BEGIN
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied: Admin role required');
  END IF;

  SELECT id, name, public, file_size_limit, allowed_mime_types
  INTO v_bucket
  FROM storage.buckets
  WHERE id = p_bucket_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bucket not found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_bucket.id,
    'name', v_bucket.name,
    'public', v_bucket.public,
    'fileSizeLimit', v_bucket.file_size_limit,
    'allowedMimeTypes', v_bucket.allowed_mime_types
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_storage_bucket_info(TEXT) TO authenticated;
