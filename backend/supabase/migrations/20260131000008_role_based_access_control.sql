-- Migration: Role-Based Access Control (RBAC)
-- Feature: F-013 - Role-Based Access Control
-- Creates user_role enum, user_roles table, and assigns roles to auth users

-- ============================================================
-- 1. USER ROLE ENUM
-- ============================================================

-- User roles for POS access control
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'cashier');

-- ============================================================
-- 2. USER ROLES TABLE
-- ============================================================

-- Links auth.users to application roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'cashier',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  created_by UUID,
  CONSTRAINT fk_user_roles_user_id
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- Index for quick role lookups
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- ============================================================
-- 3. UPDATED_AT TRIGGER
-- ============================================================

CREATE TRIGGER trg_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read their own role
CREATE POLICY "user_roles_read_own" ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Only admins can read all roles (for user management)
-- This requires a function to check admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admins can read all user roles
CREATE POLICY "user_roles_admin_read_all" ON user_roles
  FOR SELECT TO authenticated
  USING (is_admin());

-- Only admins can insert new user roles
CREATE POLICY "user_roles_admin_insert" ON user_roles
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- Only admins can update user roles
CREATE POLICY "user_roles_admin_update" ON user_roles
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Only admins can delete user roles
CREATE POLICY "user_roles_admin_delete" ON user_roles
  FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================================
-- 5. HELPER FUNCTIONS FOR ROLE CHECKING
-- ============================================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role
  FROM user_roles
  WHERE user_id = (SELECT auth.uid());

  -- Return 'cashier' as default if no role is assigned
  RETURN COALESCE(v_role, 'cashier');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is a manager or admin
CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (SELECT auth.uid())
    AND role IN ('admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can process refunds (manager or admin)
CREATE OR REPLACE FUNCTION can_process_refund()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_manager_or_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access user management (admin only)
CREATE OR REPLACE FUNCTION can_manage_users()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access system settings (admin only)
CREATE OR REPLACE FUNCTION can_access_settings()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. AUTO-ASSIGN ROLE ON USER CREATION
-- ============================================================

-- Trigger function to auto-assign default role to new users
CREATE OR REPLACE FUNCTION handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first user (make them admin)
  IF NOT EXISTS (SELECT 1 FROM user_roles) THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Otherwise, assign default role (cashier)
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'cashier');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users to auto-assign role
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_role();

-- ============================================================
-- 7. SEED ADMIN ROLE FOR EXISTING USERS
-- ============================================================

-- Assign admin role to all existing users (they were created before RBAC)
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::user_role
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT (user_id) DO NOTHING;
