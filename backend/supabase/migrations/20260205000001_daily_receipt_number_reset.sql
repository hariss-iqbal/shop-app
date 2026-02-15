-- Daily Receipt Number Reset
-- Changes receipt number format to DDMMYYYY-NN where NN resets daily
-- e.g., 05022026-03 = 3rd sale on Feb 5, 2026

-- Add column to track the last date a sequence was generated
ALTER TABLE receipt_sequences ADD COLUMN last_sequence_date DATE;

-- Add DDMMYYYY date format to format_receipt_date function
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
    WHEN 'DDMMYYYY' THEN
      v_result := to_char(p_date, 'DDMMYYYY');
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

-- Update generate_next_receipt_number to reset sequence daily
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
  v_today DATE;
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

  v_today := CURRENT_DATE;

  -- Reset sequence if the date has changed (new day)
  IF v_sequence.last_sequence_date IS NULL OR v_sequence.last_sequence_date < v_today THEN
    v_next_sequence := 1;
    UPDATE receipt_sequences
    SET
      current_sequence = v_next_sequence,
      last_sequence_date = v_today,
      last_generated_at = now()
    WHERE id = v_sequence.id;
  ELSE
    -- Same day, increment as usual
    v_next_sequence := v_sequence.current_sequence + 1;
    UPDATE receipt_sequences
    SET
      current_sequence = v_next_sequence,
      last_generated_at = now()
    WHERE id = v_sequence.id;
  END IF;

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

-- Update preview function to also support DDMMYYYY
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

-- Update the DEFAULT sequence to use DDMMYYYY-NN format with daily reset
UPDATE receipt_sequences
SET
  prefix = '',
  format_pattern = '{DATE}{SEP}{SEQ}',
  include_date = true,
  date_format = 'DDMMYYYY',
  separator = '-',
  sequence_padding = 2,
  current_sequence = 0,
  last_sequence_date = NULL
WHERE register_id = 'DEFAULT';
