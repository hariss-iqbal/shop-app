-- Fix: get_all_role_permissions() threw
--   "column \"role_permissions.role\" must appear in the GROUP BY clause..."
-- Cause: the trailing `ORDER BY role, permission` sat at the top level of an
-- aggregate query (jsonb_agg with no GROUP BY), which Postgres rejects.
-- Fix: move the ordering INSIDE jsonb_agg() and COALESCE empty results to [].

CREATE OR REPLACE FUNCTION get_all_role_permissions()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Access denied: Admin role required'
    );
  END IF;

  SELECT jsonb_build_object(
    'success', true,
    'permissions', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'role', role,
          'permission', permission,
          'enabled', enabled,
          'updatedAt', updated_at
        )
        ORDER BY role, permission
      ),
      '[]'::jsonb
    )
  )
  INTO v_result
  FROM role_permissions;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_all_role_permissions() TO authenticated;
