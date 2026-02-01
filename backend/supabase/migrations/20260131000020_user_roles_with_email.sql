-- Migration: Add function to get user roles with email addresses
-- Feature: F-013 - Role-Based Access Control (Enhancement)
-- Allows admins to see user emails in the user management screen

-- ============================================================
-- 1. FUNCTION TO GET ALL USER ROLES WITH EMAIL (ADMIN ONLY)
-- ============================================================

CREATE OR REPLACE FUNCTION get_all_user_roles_with_email()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  role user_role,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Only admins can execute this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    ur.id,
    ur.user_id,
    au.email::TEXT,
    ur.role,
    ur.created_at,
    ur.updated_at,
    au.last_sign_in_at
  FROM user_roles ur
  JOIN auth.users au ON ur.user_id = au.id
  ORDER BY ur.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_user_roles_with_email() TO authenticated;

-- ============================================================
-- 2. FUNCTION TO GET SINGLE USER ROLE WITH EMAIL (ADMIN ONLY)
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role_with_email(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  role user_role,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Only admins can execute this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    ur.id,
    ur.user_id,
    au.email::TEXT,
    ur.role,
    ur.created_at,
    ur.updated_at,
    au.last_sign_in_at
  FROM user_roles ur
  JOIN auth.users au ON ur.user_id = au.id
  WHERE ur.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_role_with_email(UUID) TO authenticated;
