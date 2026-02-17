-- Migration: Dual-format phone search for Pakistani numbers
-- Searches both 0xxx and +92xxx formats in find_or_create_customer

CREATE OR REPLACE FUNCTION find_or_create_customer(
  p_phone VARCHAR(30),
  p_name VARCHAR(200) DEFAULT NULL,
  p_email VARCHAR(255) DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_customer_id UUID;
  v_customer RECORD;
  v_is_new BOOLEAN := false;
  v_alternate_phone VARCHAR(30);
BEGIN
  -- Clean phone number (remove non-digits except +)
  p_phone := regexp_replace(p_phone, '[^0-9+]', '', 'g');

  -- Build alternate format for Pakistani numbers
  IF p_phone LIKE '0%' THEN
    v_alternate_phone := '+92' || substring(p_phone FROM 2);
  ELSIF p_phone LIKE '+92%' THEN
    v_alternate_phone := '0' || substring(p_phone FROM 4);
  ELSIF p_phone LIKE '92%' THEN
    v_alternate_phone := '0' || substring(p_phone FROM 3);
  END IF;

  -- Try to find existing customer with either format
  IF v_alternate_phone IS NOT NULL THEN
    SELECT * INTO v_customer FROM customers
    WHERE phone = p_phone OR phone = v_alternate_phone
    LIMIT 1;
  ELSE
    SELECT * INTO v_customer FROM customers WHERE phone = p_phone;
  END IF;

  IF v_customer.id IS NULL THEN
    -- Create new customer if name is provided
    -- Always save with the original format (0xxx)
    IF p_name IS NOT NULL AND p_name != '' THEN
      INSERT INTO customers (phone, name, email, notes)
      VALUES (p_phone, p_name, p_email, p_notes)
      RETURNING * INTO v_customer;
      v_is_new := true;
    ELSE
      -- Return null if no name provided for new customer
      RETURN jsonb_build_object(
        'found', false,
        'customer', NULL,
        'isNew', false
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'customer', jsonb_build_object(
      'id', v_customer.id,
      'phone', v_customer.phone,
      'name', v_customer.name,
      'email', v_customer.email,
      'notes', v_customer.notes,
      'createdAt', v_customer.created_at,
      'updatedAt', v_customer.updated_at
    ),
    'isNew', v_is_new
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION find_or_create_customer(VARCHAR, VARCHAR, VARCHAR, TEXT) TO authenticated;
