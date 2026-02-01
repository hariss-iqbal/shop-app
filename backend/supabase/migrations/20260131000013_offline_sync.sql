-- Migration: Offline Sync Support
-- Feature: F-020 Offline Mode and Sync
-- Description: Creates tables and functions for offline operation synchronization

-- Create sync operation type enum
CREATE TYPE sync_operation_type AS ENUM (
  'CREATE_SALE',
  'UPDATE_SALE',
  'DELETE_SALE',
  'SEND_WHATSAPP',
  'CREATE_RECEIPT',
  'CREATE_CUSTOMER'
);

-- Create sync status enum
CREATE TYPE sync_status AS ENUM (
  'pending',
  'syncing',
  'synced',
  'conflict',
  'failed'
);

-- Create sync conflict type enum
CREATE TYPE sync_conflict_type AS ENUM (
  'RECEIPT_NUMBER_EXISTS',
  'PHONE_ALREADY_SOLD',
  'PHONE_NOT_AVAILABLE',
  'DATA_MODIFIED',
  'ENTITY_DELETED'
);

-- Create offline sync logs table
CREATE TABLE IF NOT EXISTS offline_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  operation_type sync_operation_type NOT NULL,
  local_id VARCHAR(100) NOT NULL,
  server_id VARCHAR(100),
  status sync_status NOT NULL DEFAULT 'pending',
  conflict_type sync_conflict_type,
  conflict_details TEXT,
  payload JSONB NOT NULL,
  created_offline_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ,
  device_id VARCHAR(100),
  client_ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Add comment describing the table
COMMENT ON TABLE offline_sync_logs IS 'Audit trail for offline operations that have been synchronized. Feature: F-020 Offline Mode and Sync';

-- Create indexes for common queries
CREATE INDEX idx_offline_sync_logs_user_id ON offline_sync_logs(user_id);
CREATE INDEX idx_offline_sync_logs_status ON offline_sync_logs(status);
CREATE INDEX idx_offline_sync_logs_operation_type ON offline_sync_logs(operation_type);
CREATE INDEX idx_offline_sync_logs_local_id ON offline_sync_logs(local_id);
CREATE INDEX idx_offline_sync_logs_created_at ON offline_sync_logs(created_at DESC);
CREATE INDEX idx_offline_sync_logs_synced_at ON offline_sync_logs(synced_at DESC) WHERE synced_at IS NOT NULL;

-- Create trigger for updated_at
CREATE TRIGGER trg_offline_sync_logs_updated_at
  BEFORE UPDATE ON offline_sync_logs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Enable RLS
ALTER TABLE offline_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only authenticated users can access their own sync logs
CREATE POLICY "Users can view their own sync logs"
  ON offline_sync_logs
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own sync logs"
  ON offline_sync_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own sync logs"
  ON offline_sync_logs
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Admin policy: Admins can view all sync logs
CREATE POLICY "Admins can view all sync logs"
  ON offline_sync_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role = 'admin'
    )
  );

-- Create function to clean up old sync logs
CREATE OR REPLACE FUNCTION cleanup_old_sync_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM offline_sync_logs
    WHERE status = 'synced'
    AND synced_at < now() - (days_to_keep || ' days')::INTERVAL
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$;

-- Create function to get sync statistics for a user
CREATE OR REPLACE FUNCTION get_sync_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_synced BIGINT,
  total_failed BIGINT,
  total_conflicts BIGINT,
  total_pending BIGINT,
  last_sync_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'synced') AS total_synced,
    COUNT(*) FILTER (WHERE status = 'failed') AS total_failed,
    COUNT(*) FILTER (WHERE status = 'conflict') AS total_conflicts,
    COUNT(*) FILTER (WHERE status = 'pending') AS total_pending,
    MAX(synced_at) AS last_sync_at
  FROM offline_sync_logs
  WHERE (p_user_id IS NULL OR user_id = p_user_id);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_old_sync_logs(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sync_stats(UUID) TO authenticated;
