-- Receipt Number Generation and Sequencing Feature (F-011)
-- Generate unique, sequential receipt numbers for all transactions
-- with support for multiple registers/locations

-- Create receipt_sequences table for tracking sequences per register/location
CREATE TABLE receipt_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  register_id VARCHAR(50) NOT NULL UNIQUE,
  register_name VARCHAR(100) NOT NULL,
  prefix VARCHAR(20) NOT NULL DEFAULT '',
  current_sequence BIGINT NOT NULL DEFAULT 0,
  sequence_padding INTEGER NOT NULL DEFAULT 4,
  format_pattern VARCHAR(100) NOT NULL DEFAULT '{PREFIX}{SEQ}',
  include_date BOOLEAN NOT NULL DEFAULT false,
  date_format VARCHAR(20) NOT NULL DEFAULT 'YY-MM',
  separator VARCHAR(5) NOT NULL DEFAULT '-',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT receipt_sequences_sequence_padding_check CHECK (sequence_padding >= 1 AND sequence_padding <= 10),
  CONSTRAINT receipt_sequences_prefix_maxlength CHECK (char_length(prefix) <= 20),
  CONSTRAINT receipt_sequences_format_pattern_maxlength CHECK (char_length(format_pattern) <= 100),
  CONSTRAINT receipt_sequences_register_id_maxlength CHECK (char_length(register_id) <= 50),
  CONSTRAINT receipt_sequences_register_name_maxlength CHECK (char_length(register_name) <= 100),
  CONSTRAINT receipt_sequences_date_format_maxlength CHECK (char_length(date_format) <= 20),
  CONSTRAINT receipt_sequences_separator_maxlength CHECK (char_length(separator) <= 5)
);

-- Create receipt_number_log table for audit trail
CREATE TABLE receipt_number_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES receipt_sequences(id) ON DELETE RESTRICT,
  receipt_number VARCHAR(50) NOT NULL,
  sequence_value BIGINT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
  CONSTRAINT receipt_number_logs_receipt_number_maxlength CHECK (char_length(receipt_number) <= 50)
);

-- Performance indexes
CREATE INDEX idx_receipt_sequences_register_id ON receipt_sequences(register_id);
CREATE INDEX idx_receipt_sequences_is_active ON receipt_sequences(is_active) WHERE is_active = true;
CREATE INDEX idx_receipt_number_logs_sequence_id ON receipt_number_logs(sequence_id);
CREATE INDEX idx_receipt_number_logs_receipt_number ON receipt_number_logs(receipt_number);
CREATE INDEX idx_receipt_number_logs_generated_at ON receipt_number_logs(generated_at DESC);

-- Updated_at trigger for receipt_sequences
CREATE TRIGGER trg_receipt_sequences_updated_at
  BEFORE UPDATE ON receipt_sequences
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Function to format date according to pattern
CREATE OR REPLACE FUNCTION format_receipt_date(p_date_format VARCHAR, p_date TIMESTAMPTZ DEFAULT now())
RETURNS VARCHAR
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_result VARCHAR;
BEGIN
  CASE p_date_format
    WHEN 'YY-MM' THEN
      v_result := to_char(p_date, 'YY') || '-' || to_char(p_date, 'MM');
    WHEN 'YYYY-MM' THEN
      v_result := to_char(p_date, 'YYYY') || '-' || to_char(p_date, 'MM');
    WHEN 'YY-MM-DD' THEN
      v_result := to_char(p_date, 'YY') || '-' || to_char(p_date, 'MM') || '-' || to_char(p_date, 'DD');
    WHEN 'YYYYMMDD' THEN
      v_result := to_char(p_date, 'YYYYMMDD');
    WHEN 'YYMM' THEN
      v_result := to_char(p_date, 'YYMM');
    WHEN 'MMYY' THEN
      v_result := to_char(p_date, 'MMYY');
    ELSE
      v_result := to_char(p_date, 'YY') || '-' || to_char(p_date, 'MM');
  END CASE;

  RETURN v_result;
END;
$$;

-- Main function to generate next receipt number with atomic sequencing
-- SECURITY DEFINER ensures consistent execution context
CREATE OR REPLACE FUNCTION generate_next_receipt_number(
  p_register_id VARCHAR DEFAULT 'DEFAULT'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sequence RECORD;
  v_next_sequence BIGINT;
  v_receipt_number VARCHAR(50);
  v_padded_sequence VARCHAR;
  v_date_part VARCHAR;
  v_log_id UUID;
BEGIN
  -- Lock the sequence row for atomic update (prevent race conditions)
  SELECT * INTO v_sequence
  FROM receipt_sequences
  WHERE register_id = p_register_id AND is_active = true
  FOR UPDATE;

  IF v_sequence IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('No active sequence found for register: %s', p_register_id),
      'receiptNumber', NULL
    );
  END IF;

  -- Increment sequence
  v_next_sequence := v_sequence.current_sequence + 1;

  -- Update the sequence
  UPDATE receipt_sequences
  SET
    current_sequence = v_next_sequence,
    last_generated_at = now()
  WHERE id = v_sequence.id;

  -- Build the receipt number based on format pattern
  v_padded_sequence := lpad(v_next_sequence::TEXT, v_sequence.sequence_padding, '0');

  -- Start with format pattern
  v_receipt_number := v_sequence.format_pattern;

  -- Replace placeholders
  v_receipt_number := replace(v_receipt_number, '{PREFIX}', v_sequence.prefix);
  v_receipt_number := replace(v_receipt_number, '{SEQ}', v_padded_sequence);
  v_receipt_number := replace(v_receipt_number, '{REGISTER}', v_sequence.register_id);
  v_receipt_number := replace(v_receipt_number, '{SEP}', v_sequence.separator);

  -- Handle date if included
  IF v_sequence.include_date THEN
    v_date_part := format_receipt_date(v_sequence.date_format);
    v_receipt_number := replace(v_receipt_number, '{DATE}', v_date_part);
  ELSE
    -- Remove date placeholder if not used
    v_receipt_number := replace(v_receipt_number, '{DATE}', '');
    v_receipt_number := replace(v_receipt_number, v_sequence.separator || v_sequence.separator, v_sequence.separator);
  END IF;

  -- Clean up any double separators
  v_receipt_number := regexp_replace(v_receipt_number, v_sequence.separator || '+', v_sequence.separator, 'g');
  -- Remove trailing separator
  v_receipt_number := rtrim(v_receipt_number, v_sequence.separator);
  -- Remove leading separator
  v_receipt_number := ltrim(v_receipt_number, v_sequence.separator);

  -- Log the generation
  INSERT INTO receipt_number_logs (sequence_id, receipt_number, sequence_value)
  VALUES (v_sequence.id, v_receipt_number, v_next_sequence)
  RETURNING id INTO v_log_id;

  RETURN jsonb_build_object(
    'success', true,
    'receiptNumber', v_receipt_number,
    'sequenceValue', v_next_sequence,
    'registerId', v_sequence.register_id,
    'logId', v_log_id
  );
END;
$$;

-- Function to preview receipt number format without incrementing
CREATE OR REPLACE FUNCTION preview_receipt_number_format(
  p_prefix VARCHAR DEFAULT '',
  p_sequence_padding INTEGER DEFAULT 4,
  p_format_pattern VARCHAR DEFAULT '{PREFIX}{SEQ}',
  p_include_date BOOLEAN DEFAULT false,
  p_date_format VARCHAR DEFAULT 'YY-MM',
  p_separator VARCHAR DEFAULT '-',
  p_sample_sequence BIGINT DEFAULT 1
)
RETURNS VARCHAR
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_receipt_number VARCHAR(50);
  v_padded_sequence VARCHAR;
  v_date_part VARCHAR;
BEGIN
  v_padded_sequence := lpad(p_sample_sequence::TEXT, p_sequence_padding, '0');

  v_receipt_number := p_format_pattern;
  v_receipt_number := replace(v_receipt_number, '{PREFIX}', p_prefix);
  v_receipt_number := replace(v_receipt_number, '{SEQ}', v_padded_sequence);
  v_receipt_number := replace(v_receipt_number, '{REGISTER}', 'REG');
  v_receipt_number := replace(v_receipt_number, '{SEP}', p_separator);

  IF p_include_date THEN
    v_date_part := format_receipt_date(p_date_format);
    v_receipt_number := replace(v_receipt_number, '{DATE}', v_date_part);
  ELSE
    v_receipt_number := replace(v_receipt_number, '{DATE}', '');
    v_receipt_number := replace(v_receipt_number, p_separator || p_separator, p_separator);
  END IF;

  v_receipt_number := regexp_replace(v_receipt_number, p_separator || '+', p_separator, 'g');
  v_receipt_number := rtrim(v_receipt_number, p_separator);
  v_receipt_number := ltrim(v_receipt_number, p_separator);

  RETURN v_receipt_number;
END;
$$;

-- Function to link a generated receipt number to a receipt
CREATE OR REPLACE FUNCTION link_receipt_number_to_receipt(
  p_log_id UUID,
  p_receipt_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE receipt_number_logs
  SET receipt_id = p_receipt_id
  WHERE id = p_log_id;

  RETURN FOUND;
END;
$$;

-- Function to get next sequence value without generating (for preview)
CREATE OR REPLACE FUNCTION get_next_sequence_preview(
  p_register_id VARCHAR DEFAULT 'DEFAULT'
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_sequence RECORD;
  v_preview_number VARCHAR(50);
BEGIN
  SELECT * INTO v_sequence
  FROM receipt_sequences
  WHERE register_id = p_register_id AND is_active = true;

  IF v_sequence IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('No active sequence found for register: %s', p_register_id),
      'nextSequence', NULL
    );
  END IF;

  v_preview_number := preview_receipt_number_format(
    v_sequence.prefix,
    v_sequence.sequence_padding,
    v_sequence.format_pattern,
    v_sequence.include_date,
    v_sequence.date_format,
    v_sequence.separator,
    v_sequence.current_sequence + 1
  );

  RETURN jsonb_build_object(
    'success', true,
    'nextSequence', v_sequence.current_sequence + 1,
    'previewNumber', v_preview_number,
    'registerId', v_sequence.register_id,
    'registerName', v_sequence.register_name
  );
END;
$$;

-- RLS Policies for receipt_sequences table
ALTER TABLE receipt_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receipt_sequences_authenticated_select" ON receipt_sequences
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "receipt_sequences_authenticated_insert" ON receipt_sequences
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "receipt_sequences_authenticated_update" ON receipt_sequences
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "receipt_sequences_authenticated_delete" ON receipt_sequences
  FOR DELETE TO authenticated USING (true);

-- RLS Policies for receipt_number_logs table
ALTER TABLE receipt_number_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receipt_number_logs_authenticated_select" ON receipt_number_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "receipt_number_logs_authenticated_insert" ON receipt_number_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Logs are generally read-only after creation, but allow updates for linking
CREATE POLICY "receipt_number_logs_authenticated_update" ON receipt_number_logs
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Seed default sequence configuration
-- This creates a default register with sequential numbering starting at 1000
INSERT INTO receipt_sequences (
  register_id,
  register_name,
  prefix,
  current_sequence,
  sequence_padding,
  format_pattern,
  include_date,
  date_format,
  separator,
  is_active
) VALUES (
  'DEFAULT',
  'Main Register',
  'RCP',
  999,
  4,
  '{PREFIX}{SEP}{DATE}{SEP}{SEQ}',
  true,
  'YY-MM',
  '-',
  true
);

-- Add comments for documentation
COMMENT ON TABLE receipt_sequences IS 'Configuration for receipt number sequences per register/location. Supports multiple formats and atomic sequence generation.';
COMMENT ON TABLE receipt_number_logs IS 'Audit log of all generated receipt numbers, linked to their receipts.';
COMMENT ON COLUMN receipt_sequences.register_id IS 'Unique identifier for the register/location (e.g., DEFAULT, STORE-A, POS-1)';
COMMENT ON COLUMN receipt_sequences.format_pattern IS 'Pattern for receipt number format. Placeholders: {PREFIX}, {SEQ}, {DATE}, {REGISTER}, {SEP}';
COMMENT ON COLUMN receipt_sequences.sequence_padding IS 'Number of digits for zero-padded sequence (e.g., 4 = 0001, 6 = 000001)';
COMMENT ON COLUMN receipt_sequences.include_date IS 'Whether to include date in receipt number';
COMMENT ON COLUMN receipt_sequences.date_format IS 'Date format for receipt number: YY-MM, YYYY-MM, YY-MM-DD, YYYYMMDD, YYMM, MMYY';
COMMENT ON FUNCTION generate_next_receipt_number IS 'Atomically generates the next receipt number for a register. Uses row-level locking to prevent duplicates.';
COMMENT ON FUNCTION preview_receipt_number_format IS 'Preview how a receipt number will look without incrementing the sequence.';
COMMENT ON FUNCTION get_next_sequence_preview IS 'Get preview of next receipt number for a register without incrementing.';
