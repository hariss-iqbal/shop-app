-- Migration: Admin Approval Flow for New Users
-- Every new user starts as "not approved" and can only access the app after an admin approves them.

-- ============================================================
-- 1. ADD is_approved COLUMN TO user_roles
-- ============================================================

ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false;

-- Approve all existing users (they were active before this feature)
UPDATE user_roles SET is_approved = true;

-- ============================================================
-- 2. UPDATE handle_new_user_role() TRIGGER
-- ============================================================
-- First user → admin + approved, subsequent users → cashier + not approved

CREATE OR REPLACE FUNCTION handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the first user (make them admin + auto-approved)
  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.user_roles (user_id, role, is_approved)
    VALUES (NEW.id, 'admin', true);
  ELSE
    -- Otherwise, assign default role (cashier) with pending approval
    INSERT INTO public.user_roles (user_id, role, is_approved)
    VALUES (NEW.id, 'cashier', false);
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Role already exists for this user, skip silently
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log warning but NEVER block user creation
    RAISE WARNING 'handle_new_user_role failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

ALTER FUNCTION handle_new_user_role() OWNER TO postgres;

-- ============================================================
-- 3. UPDATE get_my_permissions() — include isApproved
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_permissions()
RETURNS JSONB AS $$
DECLARE
  v_role user_role;
  v_is_approved BOOLEAN;
  v_permissions JSONB;
BEGIN
  -- Get current user's role and approval status
  SELECT role, is_approved INTO v_role, v_is_approved
  FROM user_roles
  WHERE user_id = auth.uid();

  IF v_role IS NULL THEN
    v_role := 'cashier';
    v_is_approved := false;
  END IF;

  -- Get permissions for that role
  SELECT jsonb_object_agg(permission, enabled)
  INTO v_permissions
  FROM role_permissions
  WHERE role = v_role;

  RETURN jsonb_build_object(
    'role', v_role,
    'permissions', COALESCE(v_permissions, '{}'::jsonb),
    'isApproved', COALESCE(v_is_approved, false)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. UPDATE get_all_user_roles_with_email() — include is_approved, sort pending first
-- ============================================================

-- Must drop first because return type is changing (adding is_approved column)
DROP FUNCTION IF EXISTS get_all_user_roles_with_email();

CREATE OR REPLACE FUNCTION get_all_user_roles_with_email()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  role user_role,
  is_approved BOOLEAN,
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
    ur.is_approved,
    ur.created_at,
    ur.updated_at,
    au.last_sign_in_at
  FROM user_roles ur
  JOIN auth.users au ON ur.user_id = au.id
  ORDER BY ur.is_approved ASC, ur.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. CREATE approve_user() RPC — admin-only
-- ============================================================

CREATE OR REPLACE FUNCTION approve_user(target_user_id UUID, approved BOOLEAN)
RETURNS JSONB AS $$
BEGIN
  -- Only admins can approve/revoke users
  IF NOT is_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Access denied: Admin role required'
    );
  END IF;

  -- Prevent admin from revoking their own approval
  IF target_user_id = auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot change your own approval status'
    );
  END IF;

  UPDATE user_roles
  SET is_approved = approved
  WHERE user_id = target_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'userId', target_user_id,
    'isApproved', approved
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION approve_user(UUID, BOOLEAN) TO authenticated;
