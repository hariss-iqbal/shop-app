-- Migration: Dynamic Permission Management
-- Feature: F-013 Enhancement - Configurable Role Permissions
-- Allows admins to customize permissions for each role through UI

-- ============================================================
-- 1. ROLE PERMISSIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission VARCHAR(50) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(role, permission)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission);

-- Add updated_at trigger
CREATE TRIGGER trg_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 2. SEED DEFAULT PERMISSIONS
-- ============================================================

-- Admin permissions (all enabled)
INSERT INTO role_permissions (role, permission, enabled) VALUES
  ('admin', 'canAccessDashboard', true),
  ('admin', 'canAccessInventory', true),
  ('admin', 'canAccessBrands', true),
  ('admin', 'canAccessPurchaseOrders', true),
  ('admin', 'canAccessSuppliers', true),
  ('admin', 'canAccessSales', true),
  ('admin', 'canProcessRefunds', true),
  ('admin', 'canAccessReports', true),
  ('admin', 'canAccessMessages', true),
  ('admin', 'canAccessStorage', true),
  ('admin', 'canAccessReceiptSequences', true),
  ('admin', 'canManageUsers', true),
  ('admin', 'canAccessSystemSettings', true),
  ('admin', 'canAccessAuditLogs', true)
ON CONFLICT (role, permission) DO NOTHING;

-- Manager permissions
INSERT INTO role_permissions (role, permission, enabled) VALUES
  ('manager', 'canAccessDashboard', true),
  ('manager', 'canAccessInventory', true),
  ('manager', 'canAccessBrands', true),
  ('manager', 'canAccessPurchaseOrders', true),
  ('manager', 'canAccessSuppliers', true),
  ('manager', 'canAccessSales', true),
  ('manager', 'canProcessRefunds', true),
  ('manager', 'canAccessReports', true),
  ('manager', 'canAccessMessages', true),
  ('manager', 'canAccessStorage', false),
  ('manager', 'canAccessReceiptSequences', false),
  ('manager', 'canManageUsers', false),
  ('manager', 'canAccessSystemSettings', false),
  ('manager', 'canAccessAuditLogs', false)
ON CONFLICT (role, permission) DO NOTHING;

-- Cashier permissions (minimal)
INSERT INTO role_permissions (role, permission, enabled) VALUES
  ('cashier', 'canAccessDashboard', false),
  ('cashier', 'canAccessInventory', false),
  ('cashier', 'canAccessBrands', false),
  ('cashier', 'canAccessPurchaseOrders', false),
  ('cashier', 'canAccessSuppliers', false),
  ('cashier', 'canAccessSales', true),
  ('cashier', 'canProcessRefunds', false),
  ('cashier', 'canAccessReports', false),
  ('cashier', 'canAccessMessages', false),
  ('cashier', 'canAccessStorage', false),
  ('cashier', 'canAccessReceiptSequences', false),
  ('cashier', 'canManageUsers', false),
  ('cashier', 'canAccessSystemSettings', false),
  ('cashier', 'canAccessAuditLogs', false)
ON CONFLICT (role, permission) DO NOTHING;

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Everyone can read permissions (needed for permission checks)
CREATE POLICY "role_permissions_read_all" ON role_permissions
  FOR SELECT TO authenticated
  USING (true);

-- Only admins can modify permissions
CREATE POLICY "role_permissions_admin_insert" ON role_permissions
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "role_permissions_admin_update" ON role_permissions
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "role_permissions_admin_delete" ON role_permissions
  FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================================
-- 4. HELPER FUNCTIONS
-- ============================================================

-- Function to get all permissions for a specific role
CREATE OR REPLACE FUNCTION get_role_permissions(p_role user_role)
RETURNS JSONB AS $$
DECLARE
  v_permissions JSONB;
BEGIN
  SELECT jsonb_object_agg(permission, enabled)
  INTO v_permissions
  FROM role_permissions
  WHERE role = p_role;

  RETURN COALESCE(v_permissions, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's permissions from database
CREATE OR REPLACE FUNCTION get_my_permissions()
RETURNS JSONB AS $$
DECLARE
  v_role user_role;
  v_permissions JSONB;
BEGIN
  -- Get current user's role
  SELECT role INTO v_role
  FROM user_roles
  WHERE user_id = auth.uid();

  IF v_role IS NULL THEN
    -- Default to cashier if no role assigned
    v_role := 'cashier';
  END IF;

  -- Get permissions for that role
  SELECT jsonb_object_agg(permission, enabled)
  INTO v_permissions
  FROM role_permissions
  WHERE role = v_role;

  RETURN jsonb_build_object(
    'role', v_role,
    'permissions', COALESCE(v_permissions, '{}'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update a single permission (admin only)
CREATE OR REPLACE FUNCTION update_role_permission(
  p_role user_role,
  p_permission VARCHAR(50),
  p_enabled BOOLEAN
)
RETURNS JSONB AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Access denied: Admin role required'
    );
  END IF;

  -- Prevent removing critical admin permissions
  IF p_role = 'admin' AND p_permission IN ('canManageUsers', 'canAccessSystemSettings') AND NOT p_enabled THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot disable critical admin permissions'
    );
  END IF;

  -- Update or insert the permission
  INSERT INTO role_permissions (role, permission, enabled, updated_by)
  VALUES (p_role, p_permission, p_enabled, auth.uid())
  ON CONFLICT (role, permission)
  DO UPDATE SET
    enabled = p_enabled,
    updated_by = auth.uid();

  RETURN jsonb_build_object(
    'success', true,
    'role', p_role,
    'permission', p_permission,
    'enabled', p_enabled
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all permissions matrix (admin only)
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
    'permissions', jsonb_agg(
      jsonb_build_object(
        'id', id,
        'role', role,
        'permission', permission,
        'enabled', enabled,
        'updatedAt', updated_at
      )
    )
  )
  INTO v_result
  FROM role_permissions
  ORDER BY role, permission;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_role_permissions(user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_permissions() TO authenticated;
GRANT EXECUTE ON FUNCTION update_role_permission(user_role, VARCHAR, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_role_permissions() TO authenticated;

-- ============================================================
-- 5. COMMENTS
-- ============================================================

COMMENT ON TABLE role_permissions IS 'Dynamic role-based permissions configuration - Feature F-013';
COMMENT ON COLUMN role_permissions.role IS 'The role this permission applies to';
COMMENT ON COLUMN role_permissions.permission IS 'The permission identifier (e.g., canAccessDashboard)';
COMMENT ON COLUMN role_permissions.enabled IS 'Whether this permission is enabled for this role';
