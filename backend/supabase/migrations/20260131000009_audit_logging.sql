-- Migration: Audit Logging and Transaction Tracking
-- Feature: F-014 - Comprehensive audit logging for compliance, security, and operational visibility
-- Creates audit_logs table with immutable records of all critical system activities

-- ============================================================
-- 1. AUDIT EVENT TYPE ENUM
-- ============================================================

-- Defines the types of events that can be logged
CREATE TYPE audit_event_type AS ENUM (
  -- Sales events
  'sale_created',
  'sale_updated',
  'sale_deleted',
  'batch_sale_completed',

  -- Refund events
  'refund_initiated',
  'refund_completed',
  'refund_cancelled',
  'partial_refund_completed',

  -- Inventory events
  'inventory_deducted',
  'inventory_restored',
  'phone_status_changed',
  'phone_created',
  'phone_updated',
  'phone_deleted',

  -- User/Permission events
  'user_role_assigned',
  'user_role_changed',
  'user_role_revoked',
  'user_logged_in',
  'user_logged_out',

  -- Receipt events
  'receipt_created',
  'receipt_sent',
  'receipt_resent',

  -- System events
  'settings_changed',
  'stock_alert_triggered',
  'system_config_changed'
);

-- ============================================================
-- 2. AUDIT LOGS TABLE
-- ============================================================

-- Main audit log table - stores all audit events
-- Note: No UPDATE or DELETE policies to ensure immutability
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event identification
  event_type audit_event_type NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- User information (captured at time of event)
  user_id UUID,
  user_email VARCHAR(255),
  user_role VARCHAR(50),

  -- Client information
  client_ip INET,
  user_agent TEXT,

  -- Entity reference (what was affected)
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,

  -- Transaction/Reference identifiers
  transaction_id UUID,
  reference_number VARCHAR(100),
  original_reference_number VARCHAR(100),

  -- Financial data (captured at time of event)
  amount DECIMAL(12, 2),
  previous_amount DECIMAL(12, 2),

  -- Detailed change tracking
  previous_state JSONB,
  new_state JSONB,
  changes JSONB,

  -- Additional context
  reason TEXT,
  notes TEXT,
  metadata JSONB,

  -- Timestamps (only created_at, no updated_at since records are immutable)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT audit_logs_notes_maxlength CHECK (char_length(notes) <= 2000),
  CONSTRAINT audit_logs_reason_maxlength CHECK (char_length(reason) <= 500)
);

-- ============================================================
-- 3. INDEXES FOR EFFICIENT QUERYING
-- ============================================================

-- Primary query patterns for audit log viewer
CREATE INDEX idx_audit_logs_event_timestamp ON audit_logs(event_timestamp DESC);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_transaction_id ON audit_logs(transaction_id);

-- Composite indexes for common filter combinations
CREATE INDEX idx_audit_logs_date_type ON audit_logs(event_timestamp DESC, event_type);
CREATE INDEX idx_audit_logs_user_date ON audit_logs(user_id, event_timestamp DESC);
CREATE INDEX idx_audit_logs_entity_date ON audit_logs(entity_type, entity_id, event_timestamp DESC);

-- ============================================================
-- 4. ROW LEVEL SECURITY (Read-Only for Authenticated Users)
-- ============================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read audit logs (admin check in application layer)
CREATE POLICY "audit_logs_authenticated_select" ON audit_logs
  FOR SELECT TO authenticated
  USING (true);

-- Only allow INSERT via database functions (not direct user inserts)
-- This ensures all audit entries go through proper validation
CREATE POLICY "audit_logs_service_insert" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- CRITICAL: No UPDATE or DELETE policies - audit logs are immutable
-- This is intentional: audit logs cannot be modified or deleted by anyone

-- ============================================================
-- 5. AUDIT LOG CREATION FUNCTIONS
-- ============================================================

-- Generic function to create an audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
  p_event_type audit_event_type,
  p_entity_type VARCHAR(100),
  p_entity_id UUID DEFAULT NULL,
  p_transaction_id UUID DEFAULT NULL,
  p_reference_number VARCHAR(100) DEFAULT NULL,
  p_original_reference_number VARCHAR(100) DEFAULT NULL,
  p_amount DECIMAL DEFAULT NULL,
  p_previous_amount DECIMAL DEFAULT NULL,
  p_previous_state JSONB DEFAULT NULL,
  p_new_state JSONB DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_client_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_user_id UUID;
  v_user_email VARCHAR(255);
  v_user_role VARCHAR(50);
BEGIN
  -- Get current user information
  v_user_id := (SELECT auth.uid());

  -- Get user email from auth.users
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  -- Get user role from user_roles
  SELECT role::VARCHAR INTO v_user_role
  FROM user_roles
  WHERE user_id = v_user_id;

  -- Insert audit log entry
  INSERT INTO audit_logs (
    event_type,
    user_id,
    user_email,
    user_role,
    client_ip,
    user_agent,
    entity_type,
    entity_id,
    transaction_id,
    reference_number,
    original_reference_number,
    amount,
    previous_amount,
    previous_state,
    new_state,
    changes,
    reason,
    notes,
    metadata
  ) VALUES (
    p_event_type,
    v_user_id,
    v_user_email,
    COALESCE(v_user_role, 'unknown'),
    p_client_ip,
    p_user_agent,
    p_entity_type,
    p_entity_id,
    p_transaction_id,
    p_reference_number,
    p_original_reference_number,
    p_amount,
    p_previous_amount,
    p_previous_state,
    p_new_state,
    p_changes,
    p_reason,
    p_notes,
    p_metadata
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. SPECIALIZED AUDIT LOG FUNCTIONS
-- ============================================================

-- Function to log a sale transaction
CREATE OR REPLACE FUNCTION log_sale_audit(
  p_event_type audit_event_type,
  p_sale_id UUID,
  p_phone_id UUID,
  p_amount DECIMAL,
  p_buyer_name VARCHAR DEFAULT NULL,
  p_buyer_phone VARCHAR DEFAULT NULL,
  p_items_sold INTEGER DEFAULT 1,
  p_client_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
  RETURN create_audit_log(
    p_event_type := p_event_type,
    p_entity_type := 'sale',
    p_entity_id := p_sale_id,
    p_amount := p_amount,
    p_metadata := jsonb_build_object(
      'phoneId', p_phone_id,
      'buyerName', p_buyer_name,
      'buyerPhone', p_buyer_phone,
      'itemsSold', p_items_sold
    ),
    p_client_ip := p_client_ip,
    p_user_agent := p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log a refund transaction
CREATE OR REPLACE FUNCTION log_refund_audit(
  p_event_type audit_event_type,
  p_refund_id UUID,
  p_original_receipt_id UUID,
  p_refund_number VARCHAR,
  p_original_receipt_number VARCHAR,
  p_refund_amount DECIMAL,
  p_refund_reason TEXT,
  p_approving_user_id UUID DEFAULT NULL,
  p_is_partial BOOLEAN DEFAULT FALSE,
  p_client_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_approving_user_email VARCHAR(255);
BEGIN
  -- Get approving user email if provided
  IF p_approving_user_id IS NOT NULL THEN
    SELECT email INTO v_approving_user_email
    FROM auth.users
    WHERE id = p_approving_user_id;
  END IF;

  RETURN create_audit_log(
    p_event_type := p_event_type,
    p_entity_type := 'refund',
    p_entity_id := p_refund_id,
    p_reference_number := p_refund_number,
    p_original_reference_number := p_original_receipt_number,
    p_amount := p_refund_amount,
    p_reason := p_refund_reason,
    p_metadata := jsonb_build_object(
      'originalReceiptId', p_original_receipt_id,
      'approvingUserId', p_approving_user_id,
      'approvingUserEmail', v_approving_user_email,
      'isPartialRefund', p_is_partial
    ),
    p_client_ip := p_client_ip,
    p_user_agent := p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log user permission changes
CREATE OR REPLACE FUNCTION log_permission_change_audit(
  p_target_user_id UUID,
  p_previous_role VARCHAR,
  p_new_role VARCHAR,
  p_admin_user_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_client_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_admin_email VARCHAR(255);
  v_target_email VARCHAR(255);
BEGIN
  -- Get admin email
  SELECT email INTO v_admin_email
  FROM auth.users
  WHERE id = p_admin_user_id;

  -- Get target user email
  SELECT email INTO v_target_email
  FROM auth.users
  WHERE id = p_target_user_id;

  RETURN create_audit_log(
    p_event_type := 'user_role_changed',
    p_entity_type := 'user_role',
    p_entity_id := p_target_user_id,
    p_previous_state := jsonb_build_object('role', p_previous_role),
    p_new_state := jsonb_build_object('role', p_new_role),
    p_changes := jsonb_build_object(
      'role', jsonb_build_object(
        'from', p_previous_role,
        'to', p_new_role
      )
    ),
    p_reason := p_reason,
    p_metadata := jsonb_build_object(
      'targetUserId', p_target_user_id,
      'targetUserEmail', v_target_email,
      'adminUserId', p_admin_user_id,
      'adminUserEmail', v_admin_email
    ),
    p_client_ip := p_client_ip,
    p_user_agent := p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log inventory changes
CREATE OR REPLACE FUNCTION log_inventory_audit(
  p_event_type audit_event_type,
  p_phone_id UUID,
  p_previous_status VARCHAR,
  p_new_status VARCHAR,
  p_sale_id UUID DEFAULT NULL,
  p_refund_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_client_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
  RETURN create_audit_log(
    p_event_type := p_event_type,
    p_entity_type := 'phone',
    p_entity_id := p_phone_id,
    p_transaction_id := COALESCE(p_sale_id, p_refund_id),
    p_previous_state := jsonb_build_object('status', p_previous_status),
    p_new_state := jsonb_build_object('status', p_new_status),
    p_changes := jsonb_build_object(
      'status', jsonb_build_object(
        'from', p_previous_status,
        'to', p_new_status
      )
    ),
    p_notes := p_notes,
    p_metadata := jsonb_build_object(
      'saleId', p_sale_id,
      'refundId', p_refund_id
    ),
    p_client_ip := p_client_ip,
    p_user_agent := p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. TRIGGERS FOR AUTOMATIC AUDIT LOGGING
-- ============================================================

-- Trigger function for user role changes
CREATE OR REPLACE FUNCTION trg_audit_user_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_audit_log(
      p_event_type := 'user_role_assigned',
      p_entity_type := 'user_role',
      p_entity_id := NEW.user_id,
      p_new_state := jsonb_build_object('role', NEW.role::text),
      p_metadata := jsonb_build_object(
        'userRoleId', NEW.id,
        'assignedBy', NEW.created_by
      )
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM log_permission_change_audit(
      p_target_user_id := NEW.user_id,
      p_previous_role := OLD.role::text,
      p_new_role := NEW.role::text,
      p_admin_user_id := (SELECT auth.uid())
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM create_audit_log(
      p_event_type := 'user_role_revoked',
      p_entity_type := 'user_role',
      p_entity_id := OLD.user_id,
      p_previous_state := jsonb_build_object('role', OLD.role::text)
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_user_roles_audit
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION trg_audit_user_role_change();

-- ============================================================
-- 8. VIEW FOR EASIER QUERYING
-- ============================================================

-- Comprehensive audit log view with formatted data
CREATE OR REPLACE VIEW audit_logs_view AS
SELECT
  al.id,
  al.event_type,
  al.event_timestamp,
  al.user_id,
  al.user_email,
  al.user_role,
  al.client_ip,
  al.entity_type,
  al.entity_id,
  al.transaction_id,
  al.reference_number,
  al.original_reference_number,
  al.amount,
  al.previous_amount,
  al.previous_state,
  al.new_state,
  al.changes,
  al.reason,
  al.notes,
  al.metadata,
  al.created_at,
  -- Formatted event description
  CASE
    WHEN al.event_type = 'sale_created' THEN
      'Sale created for ' || COALESCE(al.amount::text, '0') || ' by ' || COALESCE(al.user_email, 'unknown')
    WHEN al.event_type = 'refund_completed' THEN
      'Refund processed for ' || COALESCE(al.amount::text, '0') || ' - ' || COALESCE(al.reason, 'No reason provided')
    WHEN al.event_type = 'user_role_changed' THEN
      'User role changed from ' || COALESCE(al.previous_state->>'role', 'unknown') || ' to ' || COALESCE(al.new_state->>'role', 'unknown')
    ELSE
      al.event_type::text || ' on ' || al.entity_type
  END AS event_description
FROM audit_logs al
ORDER BY al.event_timestamp DESC;

-- ============================================================
-- 9. FUNCTION TO QUERY AUDIT LOGS WITH FILTERS
-- ============================================================

CREATE OR REPLACE FUNCTION get_audit_logs(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_event_types audit_event_type[] DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_entity_type VARCHAR DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_search_text TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  event_type audit_event_type,
  event_timestamp TIMESTAMPTZ,
  user_id UUID,
  user_email VARCHAR,
  user_role VARCHAR,
  client_ip INET,
  entity_type VARCHAR,
  entity_id UUID,
  transaction_id UUID,
  reference_number VARCHAR,
  original_reference_number VARCHAR,
  amount DECIMAL,
  previous_amount DECIMAL,
  previous_state JSONB,
  new_state JSONB,
  changes JSONB,
  reason TEXT,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  total_count BIGINT
) AS $$
DECLARE
  v_total BIGINT;
BEGIN
  -- Get total count first
  SELECT COUNT(*) INTO v_total
  FROM audit_logs al
  WHERE (p_start_date IS NULL OR al.event_timestamp >= p_start_date)
    AND (p_end_date IS NULL OR al.event_timestamp <= p_end_date)
    AND (p_event_types IS NULL OR al.event_type = ANY(p_event_types))
    AND (p_user_id IS NULL OR al.user_id = p_user_id)
    AND (p_entity_type IS NULL OR al.entity_type = p_entity_type)
    AND (p_entity_id IS NULL OR al.entity_id = p_entity_id)
    AND (p_search_text IS NULL OR (
      al.user_email ILIKE '%' || p_search_text || '%'
      OR al.reference_number ILIKE '%' || p_search_text || '%'
      OR al.reason ILIKE '%' || p_search_text || '%'
      OR al.notes ILIKE '%' || p_search_text || '%'
    ));

  RETURN QUERY
  SELECT
    al.id,
    al.event_type,
    al.event_timestamp,
    al.user_id,
    al.user_email,
    al.user_role,
    al.client_ip,
    al.entity_type,
    al.entity_id,
    al.transaction_id,
    al.reference_number,
    al.original_reference_number,
    al.amount,
    al.previous_amount,
    al.previous_state,
    al.new_state,
    al.changes,
    al.reason,
    al.notes,
    al.metadata,
    al.created_at,
    v_total AS total_count
  FROM audit_logs al
  WHERE (p_start_date IS NULL OR al.event_timestamp >= p_start_date)
    AND (p_end_date IS NULL OR al.event_timestamp <= p_end_date)
    AND (p_event_types IS NULL OR al.event_type = ANY(p_event_types))
    AND (p_user_id IS NULL OR al.user_id = p_user_id)
    AND (p_entity_type IS NULL OR al.entity_type = p_entity_type)
    AND (p_entity_id IS NULL OR al.entity_id = p_entity_id)
    AND (p_search_text IS NULL OR (
      al.user_email ILIKE '%' || p_search_text || '%'
      OR al.reference_number ILIKE '%' || p_search_text || '%'
      OR al.reason ILIKE '%' || p_search_text || '%'
      OR al.notes ILIKE '%' || p_search_text || '%'
    ))
  ORDER BY al.event_timestamp DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 10. COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all critical system activities - compliance and security tracking';
COMMENT ON COLUMN audit_logs.event_type IS 'Type of audit event from audit_event_type enum';
COMMENT ON COLUMN audit_logs.event_timestamp IS 'When the event occurred';
COMMENT ON COLUMN audit_logs.user_id IS 'ID of user who triggered the event (captured at time of event)';
COMMENT ON COLUMN audit_logs.user_email IS 'Email of user who triggered the event (captured at time of event)';
COMMENT ON COLUMN audit_logs.user_role IS 'Role of user who triggered the event (captured at time of event)';
COMMENT ON COLUMN audit_logs.client_ip IS 'IP address of the client that triggered the event';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity affected (e.g., sale, refund, phone, user_role)';
COMMENT ON COLUMN audit_logs.entity_id IS 'ID of the entity affected';
COMMENT ON COLUMN audit_logs.transaction_id IS 'Related transaction ID for linking events';
COMMENT ON COLUMN audit_logs.amount IS 'Financial amount involved in the event';
COMMENT ON COLUMN audit_logs.previous_state IS 'State before the change (JSON)';
COMMENT ON COLUMN audit_logs.new_state IS 'State after the change (JSON)';
COMMENT ON COLUMN audit_logs.changes IS 'Specific field changes (JSON with from/to values)';
COMMENT ON COLUMN audit_logs.reason IS 'Reason for the action (e.g., refund reason)';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional contextual data (JSON)';

COMMENT ON FUNCTION create_audit_log IS 'Creates a new audit log entry with user context automatically populated';
COMMENT ON FUNCTION log_sale_audit IS 'Specialized function for logging sale transactions';
COMMENT ON FUNCTION log_refund_audit IS 'Specialized function for logging refund transactions with approval tracking';
COMMENT ON FUNCTION log_permission_change_audit IS 'Specialized function for logging user permission changes';
COMMENT ON FUNCTION log_inventory_audit IS 'Specialized function for logging inventory status changes';
COMMENT ON FUNCTION get_audit_logs IS 'Query audit logs with comprehensive filtering options';
