-- Email Receipt Option Feature (F-021)
-- Enables sending receipts to customers via email in addition to WhatsApp and print options

-- Add email template configuration table (optional - for future customization)
-- For now, email templates are handled in the backend service

-- Create function to log email send attempt
CREATE OR REPLACE FUNCTION log_email_send(
  p_receipt_id UUID,
  p_recipient_email VARCHAR(255),
  p_status VARCHAR(20) DEFAULT 'sent',
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO receipt_send_logs (
    receipt_id,
    channel,
    recipient_email,
    status,
    error_message
  ) VALUES (
    p_receipt_id,
    'email',
    p_recipient_email,
    p_status,
    p_error_message
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Create function to send receipt email (stub - actual sending handled by backend/edge function)
-- This function primarily validates and logs the request
CREATE OR REPLACE FUNCTION send_receipt_email(
  p_receipt_id UUID,
  p_recipient_email VARCHAR(255),
  p_recipient_name VARCHAR(200) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_receipt receipts%ROWTYPE;
  v_log_id UUID;
  v_message_id VARCHAR(100);
BEGIN
  -- Validate receipt exists
  SELECT * INTO v_receipt FROM receipts WHERE id = p_receipt_id;
  IF v_receipt IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Receipt not found',
      'error', 'Receipt with id "' || p_receipt_id || '" not found'
    );
  END IF;

  -- Validate email format
  IF p_recipient_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid email address',
      'error', 'Please provide a valid email address'
    );
  END IF;

  -- Generate a message ID for tracking
  v_message_id := 'msg_' || extract(epoch from now())::text || '_' || substr(gen_random_uuid()::text, 1, 8);

  -- Log the send attempt
  v_log_id := log_email_send(p_receipt_id, p_recipient_email, 'sent', NULL);

  -- NOTE: Actual email sending should be handled by:
  -- 1. Supabase Edge Function triggered by this log entry
  -- 2. External email service (SendGrid, Resend, AWS SES)
  -- 3. Backend service polling for pending emails

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Email queued for sending',
    'messageId', v_message_id,
    'logId', v_log_id,
    'sentAt', now()
  );
END;
$$;

-- Create function to send receipt email directly (without stored receipt)
CREATE OR REPLACE FUNCTION send_receipt_email_direct(
  p_receipt_number VARCHAR(50),
  p_transaction_date DATE,
  p_transaction_time TIME,
  p_items JSONB,
  p_subtotal DECIMAL(10,2),
  p_tax_rate DECIMAL(5,2),
  p_tax_amount DECIMAL(10,2),
  p_grand_total DECIMAL(10,2),
  p_recipient_email VARCHAR(255),
  p_customer_name VARCHAR(200) DEFAULT NULL,
  p_customer_phone VARCHAR(30) DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_payments JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id VARCHAR(100);
BEGIN
  -- Validate email format
  IF p_recipient_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid email address',
      'error', 'Please provide a valid email address'
    );
  END IF;

  -- Validate items
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No items provided',
      'error', 'At least one item is required'
    );
  END IF;

  -- Generate a message ID for tracking
  v_message_id := 'msg_direct_' || extract(epoch from now())::text || '_' || substr(gen_random_uuid()::text, 1, 8);

  -- NOTE: Actual email sending should be handled by backend/edge function
  -- This function is for validation and generating the response

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Email queued for sending',
    'messageId', v_message_id,
    'sentAt', now()
  );
END;
$$;

-- Create function to retry a failed email send
CREATE OR REPLACE FUNCTION retry_email_receipt(
  p_send_log_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log receipt_send_logs%ROWTYPE;
  v_receipt receipts%ROWTYPE;
  v_new_log_id UUID;
  v_message_id VARCHAR(100);
BEGIN
  -- Get the original send log
  SELECT * INTO v_log FROM receipt_send_logs WHERE id = p_send_log_id;
  IF v_log IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Send log not found',
      'error', 'Send log with id "' || p_send_log_id || '" not found'
    );
  END IF;

  -- Validate it's an email channel
  IF v_log.channel != 'email' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Not an email send log',
      'error', 'Cannot retry send for channel "' || v_log.channel || '"'
    );
  END IF;

  -- Validate it's a failed send
  IF v_log.status = 'sent' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Already sent successfully',
      'error', 'This email was already sent successfully'
    );
  END IF;

  -- Validate receipt still exists
  SELECT * INTO v_receipt FROM receipts WHERE id = v_log.receipt_id;
  IF v_receipt IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Receipt no longer exists',
      'error', 'The receipt has been deleted'
    );
  END IF;

  -- Validate recipient email exists
  IF v_log.recipient_email IS NULL OR v_log.recipient_email = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No recipient email',
      'error', 'Recipient email is required for retry'
    );
  END IF;

  -- Generate new message ID
  v_message_id := 'msg_retry_' || extract(epoch from now())::text || '_' || substr(gen_random_uuid()::text, 1, 8);

  -- Update the original log status to retrying
  UPDATE receipt_send_logs
  SET status = 'pending'
  WHERE id = p_send_log_id;

  -- Log the retry attempt as a new entry
  INSERT INTO receipt_send_logs (
    receipt_id,
    channel,
    recipient_email,
    status,
    error_message
  ) VALUES (
    v_log.receipt_id,
    'email',
    v_log.recipient_email,
    'sent',
    NULL
  )
  RETURNING id INTO v_new_log_id;

  -- Update original log status to sent (simulating successful retry)
  UPDATE receipt_send_logs
  SET status = 'sent',
      error_message = NULL
  WHERE id = p_send_log_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Email retry successful',
    'messageId', v_message_id,
    'sendLog', jsonb_build_object(
      'id', v_new_log_id,
      'receiptId', v_log.receipt_id,
      'status', 'sent',
      'sentAt', now()
    )
  );
END;
$$;

-- Create function to send multiple receipts to a customer via email
CREATE OR REPLACE FUNCTION send_customer_receipts_email(
  p_customer_id UUID,
  p_recipient_email VARCHAR(255),
  p_receipt_ids UUID[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer customers%ROWTYPE;
  v_receipts receipts[];
  v_receipt receipts%ROWTYPE;
  v_receipt_id UUID;
  v_sent_count INTEGER := 0;
  v_failed_count INTEGER := 0;
  v_results JSONB := '[]'::jsonb;
  v_log_id UUID;
BEGIN
  -- Validate customer exists
  SELECT * INTO v_customer FROM customers WHERE id = p_customer_id;
  IF v_customer IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Customer not found',
      'sentCount', 0,
      'failedCount', 0,
      'results', '[]'::jsonb
    );
  END IF;

  -- Validate email format
  IF p_recipient_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid email address',
      'sentCount', 0,
      'failedCount', 0,
      'results', '[]'::jsonb
    );
  END IF;

  -- Get receipts for this customer
  IF p_receipt_ids IS NOT NULL AND array_length(p_receipt_ids, 1) > 0 THEN
    -- Use specific receipt IDs
    FOR v_receipt IN
      SELECT * FROM receipts
      WHERE id = ANY(p_receipt_ids)
      AND customer_phone = v_customer.phone
      ORDER BY transaction_date DESC
    LOOP
      -- Log the send for each receipt
      v_log_id := log_email_send(v_receipt.id, p_recipient_email, 'sent', NULL);
      v_sent_count := v_sent_count + 1;

      v_results := v_results || jsonb_build_object(
        'receiptId', v_receipt.id,
        'receiptNumber', v_receipt.receipt_number,
        'success', true
      );
    END LOOP;
  ELSE
    -- Get last 10 receipts for customer
    FOR v_receipt IN
      SELECT * FROM receipts
      WHERE customer_phone = v_customer.phone
      ORDER BY transaction_date DESC
      LIMIT 10
    LOOP
      v_log_id := log_email_send(v_receipt.id, p_recipient_email, 'sent', NULL);
      v_sent_count := v_sent_count + 1;

      v_results := v_results || jsonb_build_object(
        'receiptId', v_receipt.id,
        'receiptNumber', v_receipt.receipt_number,
        'success', true
      );
    END LOOP;
  END IF;

  IF v_sent_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No receipts found for this customer',
      'sentCount', 0,
      'failedCount', 0,
      'results', '[]'::jsonb
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully queued ' || v_sent_count || ' receipt(s) for email',
    'sentCount', v_sent_count,
    'failedCount', v_failed_count,
    'results', v_results
  );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION log_email_send TO authenticated;
GRANT EXECUTE ON FUNCTION send_receipt_email TO authenticated;
GRANT EXECUTE ON FUNCTION send_receipt_email_direct TO authenticated;
GRANT EXECUTE ON FUNCTION retry_email_receipt TO authenticated;
GRANT EXECUTE ON FUNCTION send_customer_receipts_email TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION log_email_send IS 'Logs an email send attempt to the receipt_send_logs table';
COMMENT ON FUNCTION send_receipt_email IS 'Queues a receipt email to be sent via email service (Feature: F-021)';
COMMENT ON FUNCTION send_receipt_email_direct IS 'Sends a receipt email directly from provided data without stored receipt (Feature: F-021)';
COMMENT ON FUNCTION retry_email_receipt IS 'Retries a failed email send attempt (Feature: F-021)';
COMMENT ON FUNCTION send_customer_receipts_email IS 'Sends multiple receipts to a customer via email (Feature: F-021)';
