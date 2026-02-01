-- Receipt Resend Capability Feature (F-007)
-- Tracks all receipt send/resend operations for audit and history

-- Create receipt_send_logs table
CREATE TABLE receipt_send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL, -- 'whatsapp', 'email', 'sms'
  recipient_phone VARCHAR(30),
  recipient_email VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'pending'
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT receipt_send_logs_channel_check CHECK (channel IN ('whatsapp', 'email', 'sms')),
  CONSTRAINT receipt_send_logs_status_check CHECK (status IN ('sent', 'failed', 'pending')),
  CONSTRAINT receipt_send_logs_error_maxlength CHECK (char_length(error_message) <= 1000)
);

-- Performance indexes
CREATE INDEX idx_receipt_send_logs_receipt_id ON receipt_send_logs(receipt_id);
CREATE INDEX idx_receipt_send_logs_sent_at ON receipt_send_logs(sent_at DESC);
CREATE INDEX idx_receipt_send_logs_channel ON receipt_send_logs(channel);

-- RLS Policies for receipt_send_logs table
ALTER TABLE receipt_send_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users have full access to receipt_send_logs
CREATE POLICY "receipt_send_logs_authenticated_select" ON receipt_send_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "receipt_send_logs_authenticated_insert" ON receipt_send_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "receipt_send_logs_authenticated_update" ON receipt_send_logs
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "receipt_send_logs_authenticated_delete" ON receipt_send_logs
  FOR DELETE TO authenticated USING (true);

-- Add comments for documentation
COMMENT ON TABLE receipt_send_logs IS 'Audit log for all receipt send/resend operations via WhatsApp, email, or SMS';
COMMENT ON COLUMN receipt_send_logs.channel IS 'Communication channel used: whatsapp, email, or sms';
COMMENT ON COLUMN receipt_send_logs.status IS 'Send operation status: sent (success), failed (error), pending (in progress)';
COMMENT ON COLUMN receipt_send_logs.error_message IS 'Error details if send operation failed';
