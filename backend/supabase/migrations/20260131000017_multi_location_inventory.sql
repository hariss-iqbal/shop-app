-- Migration: Multi-Location Inventory Support
-- Feature: F-024
-- Description: Manage inventory across multiple store locations with location-specific stock tracking

-- Acceptance Criteria:
-- AC1: Given system has 3 store locations configured, when inventory is viewed, then stock levels are displayed for each location separately
-- AC2: Given sale is processed at Location A, when transaction is completed, then stock is deducted only from Location A inventory
-- AC3: Given admin wants to transfer stock, when transfer is initiated, then admin selects source location, destination location, and quantity
-- AC4: Given stock transfer is completed, when transfer is saved, then source location quantity decreases and destination increases
-- AC5: Given cashier is logged into Location A, when inventory is viewed, then only Location A stock levels are visible

-- =====================================================
-- 1. CREATE STORE LOCATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS store_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  address TEXT,
  phone VARCHAR(30),
  email VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  manager_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT store_locations_name_maxlength CHECK (char_length(name) <= 100),
  CONSTRAINT store_locations_code_maxlength CHECK (char_length(code) <= 20),
  CONSTRAINT store_locations_address_maxlength CHECK (char_length(address) <= 1000),
  CONSTRAINT store_locations_phone_maxlength CHECK (char_length(phone) <= 30),
  CONSTRAINT store_locations_email_maxlength CHECK (char_length(email) <= 255),
  CONSTRAINT store_locations_notes_maxlength CHECK (char_length(notes) <= 2000)
);

-- Create indexes for store_locations
CREATE INDEX IF NOT EXISTS idx_store_locations_code ON store_locations(code);
CREATE INDEX IF NOT EXISTS idx_store_locations_is_active ON store_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_store_locations_manager ON store_locations(manager_user_id);

-- Create updated_at trigger for store_locations
CREATE OR REPLACE TRIGGER trg_store_locations_updated_at
  BEFORE UPDATE ON store_locations
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Ensure only one primary location
CREATE OR REPLACE FUNCTION enforce_single_primary_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE store_locations SET is_primary = false WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_store_locations_primary
  BEFORE INSERT OR UPDATE ON store_locations
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION enforce_single_primary_location();

-- =====================================================
-- 2. CREATE LOCATION INVENTORY TABLE
-- =====================================================
-- This table tracks which phones are at which location

CREATE TABLE IF NOT EXISTS location_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_id UUID NOT NULL REFERENCES phones(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES store_locations(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT location_inventory_unique UNIQUE (phone_id, location_id),
  CONSTRAINT location_inventory_quantity_positive CHECK (quantity >= 0),
  CONSTRAINT location_inventory_min_stock_positive CHECK (min_stock_level >= 0),
  CONSTRAINT location_inventory_max_stock_valid CHECK (max_stock_level IS NULL OR max_stock_level >= min_stock_level)
);

-- Create indexes for location_inventory
CREATE INDEX IF NOT EXISTS idx_location_inventory_phone ON location_inventory(phone_id);
CREATE INDEX IF NOT EXISTS idx_location_inventory_location ON location_inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_location_inventory_quantity ON location_inventory(quantity);

-- Create updated_at trigger for location_inventory
CREATE OR REPLACE TRIGGER trg_location_inventory_updated_at
  BEFORE UPDATE ON location_inventory
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- 3. CREATE INVENTORY TRANSFERS TABLE
-- =====================================================

-- Transfer status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_transfer_status') THEN
    CREATE TYPE inventory_transfer_status AS ENUM ('pending', 'in_transit', 'completed', 'cancelled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS inventory_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number VARCHAR(50) NOT NULL UNIQUE,
  source_location_id UUID NOT NULL REFERENCES store_locations(id) ON DELETE RESTRICT,
  destination_location_id UUID NOT NULL REFERENCES store_locations(id) ON DELETE RESTRICT,
  status inventory_transfer_status NOT NULL DEFAULT 'pending',
  initiated_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT inventory_transfers_different_locations CHECK (source_location_id != destination_location_id),
  CONSTRAINT inventory_transfers_notes_maxlength CHECK (char_length(notes) <= 2000)
);

-- Create indexes for inventory_transfers
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_source ON inventory_transfers(source_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_destination ON inventory_transfers(destination_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_status ON inventory_transfers(status);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_initiated_at ON inventory_transfers(initiated_at);

-- Create updated_at trigger for inventory_transfers
CREATE OR REPLACE TRIGGER trg_inventory_transfers_updated_at
  BEFORE UPDATE ON inventory_transfers
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- 4. CREATE TRANSFER ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS inventory_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES inventory_transfers(id) ON DELETE CASCADE,
  phone_id UUID NOT NULL REFERENCES phones(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT inventory_transfer_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT inventory_transfer_items_notes_maxlength CHECK (char_length(notes) <= 500)
);

-- Create indexes for inventory_transfer_items
CREATE INDEX IF NOT EXISTS idx_inventory_transfer_items_transfer ON inventory_transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfer_items_phone ON inventory_transfer_items(phone_id);

-- =====================================================
-- 5. CREATE USER LOCATION ASSIGNMENTS TABLE
-- =====================================================
-- Links users (cashiers/staff) to their assigned locations

CREATE TABLE IF NOT EXISTS user_location_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES store_locations(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  can_view_all_locations BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT user_location_assignments_unique UNIQUE (user_id, location_id)
);

-- Create indexes for user_location_assignments
CREATE INDEX IF NOT EXISTS idx_user_location_assignments_user ON user_location_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_location_assignments_location ON user_location_assignments(location_id);

-- Create updated_at trigger for user_location_assignments
CREATE OR REPLACE TRIGGER trg_user_location_assignments_updated_at
  BEFORE UPDATE ON user_location_assignments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Ensure only one default location per user
CREATE OR REPLACE FUNCTION enforce_single_default_location_per_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE user_location_assignments SET is_default = false WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_location_default
  BEFORE INSERT OR UPDATE ON user_location_assignments
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION enforce_single_default_location_per_user();

-- =====================================================
-- 6. ADD LOCATION REFERENCE TO SALES TABLE
-- =====================================================

ALTER TABLE sales ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES store_locations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sales_location_id ON sales(location_id);

-- =====================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE store_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_location_assignments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. CREATE RLS POLICIES FOR store_locations
-- =====================================================

-- Anonymous users can read active locations (for display purposes)
CREATE POLICY store_locations_anon_select ON store_locations
  FOR SELECT TO anon
  USING (is_active = true);

-- Authenticated users have full CRUD access
CREATE POLICY store_locations_auth_select ON store_locations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY store_locations_auth_insert ON store_locations
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY store_locations_auth_update ON store_locations
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY store_locations_auth_delete ON store_locations
  FOR DELETE TO authenticated
  USING (true);

-- =====================================================
-- 9. CREATE RLS POLICIES FOR location_inventory
-- =====================================================

-- Anonymous users cannot access inventory data
CREATE POLICY location_inventory_anon_select ON location_inventory
  FOR SELECT TO anon
  USING (false);

-- Authenticated users have full CRUD access
CREATE POLICY location_inventory_auth_select ON location_inventory
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY location_inventory_auth_insert ON location_inventory
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY location_inventory_auth_update ON location_inventory
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY location_inventory_auth_delete ON location_inventory
  FOR DELETE TO authenticated
  USING (true);

-- =====================================================
-- 10. CREATE RLS POLICIES FOR inventory_transfers
-- =====================================================

CREATE POLICY inventory_transfers_anon_select ON inventory_transfers
  FOR SELECT TO anon
  USING (false);

CREATE POLICY inventory_transfers_auth_select ON inventory_transfers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY inventory_transfers_auth_insert ON inventory_transfers
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY inventory_transfers_auth_update ON inventory_transfers
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY inventory_transfers_auth_delete ON inventory_transfers
  FOR DELETE TO authenticated
  USING (true);

-- =====================================================
-- 11. CREATE RLS POLICIES FOR inventory_transfer_items
-- =====================================================

CREATE POLICY inventory_transfer_items_anon_select ON inventory_transfer_items
  FOR SELECT TO anon
  USING (false);

CREATE POLICY inventory_transfer_items_auth_select ON inventory_transfer_items
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY inventory_transfer_items_auth_insert ON inventory_transfer_items
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY inventory_transfer_items_auth_update ON inventory_transfer_items
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY inventory_transfer_items_auth_delete ON inventory_transfer_items
  FOR DELETE TO authenticated
  USING (true);

-- =====================================================
-- 12. CREATE RLS POLICIES FOR user_location_assignments
-- =====================================================

CREATE POLICY user_location_assignments_anon_select ON user_location_assignments
  FOR SELECT TO anon
  USING (false);

CREATE POLICY user_location_assignments_auth_select ON user_location_assignments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY user_location_assignments_auth_insert ON user_location_assignments
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY user_location_assignments_auth_update ON user_location_assignments
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY user_location_assignments_auth_delete ON user_location_assignments
  FOR DELETE TO authenticated
  USING (true);

-- =====================================================
-- 13. CREATE HELPER FUNCTIONS
-- =====================================================

-- Generate transfer number
CREATE OR REPLACE FUNCTION generate_transfer_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  v_date_part VARCHAR(8);
  v_seq_num INTEGER;
  v_transfer_number VARCHAR(50);
BEGIN
  v_date_part := to_char(now(), 'YYYYMMDD');

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(transfer_number FROM 'TR-' || v_date_part || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO v_seq_num
  FROM inventory_transfers
  WHERE transfer_number LIKE 'TR-' || v_date_part || '-%';

  v_transfer_number := 'TR-' || v_date_part || '-' || LPAD(v_seq_num::TEXT, 4, '0');

  RETURN v_transfer_number;
END;
$$ LANGUAGE plpgsql;

-- Function to initiate a stock transfer
CREATE OR REPLACE FUNCTION initiate_inventory_transfer(
  p_source_location_id UUID,
  p_destination_location_id UUID,
  p_items JSONB, -- Array of {phone_id, quantity}
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_transfer_id UUID;
  v_transfer_number VARCHAR(50);
  v_item JSONB;
  v_phone_id UUID;
  v_quantity INTEGER;
  v_current_quantity INTEGER;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Validate locations
  IF p_source_location_id = p_destination_location_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Source and destination locations must be different');
  END IF;

  -- Check locations exist and are active
  IF NOT EXISTS (SELECT 1 FROM store_locations WHERE id = p_source_location_id AND is_active = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Source location not found or inactive');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM store_locations WHERE id = p_destination_location_id AND is_active = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Destination location not found or inactive');
  END IF;

  -- Validate each item has sufficient quantity at source
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_phone_id := (v_item->>'phone_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;

    SELECT COALESCE(quantity, 0) INTO v_current_quantity
    FROM location_inventory
    WHERE phone_id = v_phone_id AND location_id = p_source_location_id;

    IF v_current_quantity < v_quantity THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Insufficient quantity for phone ' || v_phone_id || '. Available: ' || v_current_quantity || ', Requested: ' || v_quantity
      );
    END IF;
  END LOOP;

  -- Generate transfer number
  v_transfer_number := generate_transfer_number();

  -- Create transfer record
  INSERT INTO inventory_transfers (
    transfer_number,
    source_location_id,
    destination_location_id,
    status,
    initiated_by_user_id,
    notes
  ) VALUES (
    v_transfer_number,
    p_source_location_id,
    p_destination_location_id,
    'pending',
    v_user_id,
    p_notes
  ) RETURNING id INTO v_transfer_id;

  -- Create transfer items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_phone_id := (v_item->>'phone_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;

    INSERT INTO inventory_transfer_items (
      transfer_id,
      phone_id,
      quantity,
      notes
    ) VALUES (
      v_transfer_id,
      v_phone_id,
      v_quantity,
      v_item->>'notes'
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'transferId', v_transfer_id,
    'transferNumber', v_transfer_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a stock transfer
CREATE OR REPLACE FUNCTION complete_inventory_transfer(
  p_transfer_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_transfer RECORD;
  v_item RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  -- Get transfer record
  SELECT * INTO v_transfer FROM inventory_transfers WHERE id = p_transfer_id;

  IF v_transfer.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transfer not found');
  END IF;

  IF v_transfer.status != 'pending' AND v_transfer.status != 'in_transit' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transfer cannot be completed. Current status: ' || v_transfer.status);
  END IF;

  -- Process each item
  FOR v_item IN SELECT * FROM inventory_transfer_items WHERE transfer_id = p_transfer_id
  LOOP
    -- Decrease quantity at source location
    UPDATE location_inventory
    SET quantity = quantity - v_item.quantity
    WHERE phone_id = v_item.phone_id AND location_id = v_transfer.source_location_id;

    -- Increase quantity at destination location (or create record)
    INSERT INTO location_inventory (phone_id, location_id, quantity)
    VALUES (v_item.phone_id, v_transfer.destination_location_id, v_item.quantity)
    ON CONFLICT (phone_id, location_id)
    DO UPDATE SET quantity = location_inventory.quantity + EXCLUDED.quantity;
  END LOOP;

  -- Update transfer status
  UPDATE inventory_transfers
  SET
    status = 'completed',
    completed_by_user_id = v_user_id,
    completed_at = now()
  WHERE id = p_transfer_id;

  RETURN jsonb_build_object(
    'success', true,
    'transferId', p_transfer_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel a stock transfer
CREATE OR REPLACE FUNCTION cancel_inventory_transfer(
  p_transfer_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_transfer RECORD;
BEGIN
  -- Get transfer record
  SELECT * INTO v_transfer FROM inventory_transfers WHERE id = p_transfer_id;

  IF v_transfer.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transfer not found');
  END IF;

  IF v_transfer.status != 'pending' AND v_transfer.status != 'in_transit' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transfer cannot be cancelled. Current status: ' || v_transfer.status);
  END IF;

  -- Update transfer status
  UPDATE inventory_transfers
  SET status = 'cancelled'
  WHERE id = p_transfer_id;

  RETURN jsonb_build_object(
    'success', true,
    'transferId', p_transfer_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get inventory by location
CREATE OR REPLACE FUNCTION get_location_inventory(
  p_location_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_location RECORD;
  v_inventory JSONB;
  v_stats RECORD;
BEGIN
  -- Get location info
  SELECT * INTO v_location FROM store_locations WHERE id = p_location_id;

  IF v_location.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Location not found');
  END IF;

  -- Get inventory items with phone details
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', li.id,
      'phoneId', li.phone_id,
      'quantity', li.quantity,
      'minStockLevel', li.min_stock_level,
      'maxStockLevel', li.max_stock_level,
      'phone', jsonb_build_object(
        'id', p.id,
        'model', p.model,
        'status', p.status,
        'sellingPrice', p.selling_price,
        'costPrice', p.cost_price,
        'condition', p.condition,
        'brandName', b.name,
        'brandId', b.id
      )
    )
  ) INTO v_inventory
  FROM location_inventory li
  JOIN phones p ON li.phone_id = p.id
  LEFT JOIN brands b ON p.brand_id = b.id
  WHERE li.location_id = p_location_id AND li.quantity > 0;

  -- Get summary stats
  SELECT
    COUNT(DISTINCT li.phone_id) as total_products,
    COALESCE(SUM(li.quantity), 0) as total_units,
    COALESCE(SUM(li.quantity * p.selling_price), 0) as total_value,
    COUNT(DISTINCT CASE WHEN li.quantity <= li.min_stock_level THEN li.phone_id END) as low_stock_count
  INTO v_stats
  FROM location_inventory li
  JOIN phones p ON li.phone_id = p.id
  WHERE li.location_id = p_location_id AND li.quantity > 0;

  RETURN jsonb_build_object(
    'success', true,
    'location', jsonb_build_object(
      'id', v_location.id,
      'name', v_location.name,
      'code', v_location.code,
      'address', v_location.address
    ),
    'inventory', COALESCE(v_inventory, '[]'::jsonb),
    'stats', jsonb_build_object(
      'totalProducts', v_stats.total_products,
      'totalUnits', v_stats.total_units,
      'totalValue', v_stats.total_value,
      'lowStockCount', v_stats.low_stock_count
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's assigned locations
CREATE OR REPLACE FUNCTION get_user_locations(
  p_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_locations JSONB;
  v_can_view_all BOOLEAN;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  -- Check if user can view all locations
  SELECT EXISTS(
    SELECT 1 FROM user_location_assignments
    WHERE user_id = v_user_id AND can_view_all_locations = true
  ) INTO v_can_view_all;

  IF v_can_view_all THEN
    -- Return all active locations
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', sl.id,
        'name', sl.name,
        'code', sl.code,
        'address', sl.address,
        'phone', sl.phone,
        'email', sl.email,
        'isActive', sl.is_active,
        'isPrimary', sl.is_primary,
        'isDefault', COALESCE(ula.is_default, false),
        'isAssigned', ula.id IS NOT NULL
      ) ORDER BY sl.name
    ) INTO v_locations
    FROM store_locations sl
    LEFT JOIN user_location_assignments ula ON sl.id = ula.location_id AND ula.user_id = v_user_id
    WHERE sl.is_active = true;
  ELSE
    -- Return only assigned locations
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', sl.id,
        'name', sl.name,
        'code', sl.code,
        'address', sl.address,
        'phone', sl.phone,
        'email', sl.email,
        'isActive', sl.is_active,
        'isPrimary', sl.is_primary,
        'isDefault', ula.is_default,
        'isAssigned', true
      ) ORDER BY ula.is_default DESC, sl.name
    ) INTO v_locations
    FROM user_location_assignments ula
    JOIN store_locations sl ON ula.location_id = sl.id
    WHERE ula.user_id = v_user_id AND sl.is_active = true;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'canViewAllLocations', v_can_view_all,
    'locations', COALESCE(v_locations, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign location inventory when phone is created
CREATE OR REPLACE FUNCTION assign_phone_to_location(
  p_phone_id UUID,
  p_location_id UUID,
  p_quantity INTEGER DEFAULT 1
) RETURNS JSONB AS $$
BEGIN
  -- Validate location exists
  IF NOT EXISTS (SELECT 1 FROM store_locations WHERE id = p_location_id AND is_active = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Location not found or inactive');
  END IF;

  -- Insert or update location inventory
  INSERT INTO location_inventory (phone_id, location_id, quantity)
  VALUES (p_phone_id, p_location_id, p_quantity)
  ON CONFLICT (phone_id, location_id)
  DO UPDATE SET quantity = location_inventory.quantity + EXCLUDED.quantity;

  RETURN jsonb_build_object('success', true, 'phoneId', p_phone_id, 'locationId', p_location_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 14. SEED DEFAULT LOCATION
-- =====================================================

-- Insert a default main store location
INSERT INTO store_locations (name, code, is_active, is_primary, notes)
VALUES ('Main Store', 'MAIN', true, true, 'Primary store location')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 15. COMMENTS
-- =====================================================

COMMENT ON TABLE store_locations IS 'Store locations for multi-location inventory management - Feature F-024';
COMMENT ON COLUMN store_locations.code IS 'Unique short code for location (e.g., MAIN, BRANCH1)';
COMMENT ON COLUMN store_locations.is_primary IS 'Primary/headquarters location flag (only one can be true)';
COMMENT ON COLUMN store_locations.manager_user_id IS 'Optional reference to the user managing this location';

COMMENT ON TABLE location_inventory IS 'Tracks phone inventory quantities per location - Feature F-024';
COMMENT ON COLUMN location_inventory.quantity IS 'Current quantity of this phone at this location';
COMMENT ON COLUMN location_inventory.min_stock_level IS 'Minimum stock level for reorder alerts';
COMMENT ON COLUMN location_inventory.max_stock_level IS 'Maximum stock level for overstocking alerts';

COMMENT ON TABLE inventory_transfers IS 'Stock transfer records between locations - Feature F-024';
COMMENT ON COLUMN inventory_transfers.transfer_number IS 'Human-readable transfer reference (e.g., TR-20260131-0001)';
COMMENT ON COLUMN inventory_transfers.status IS 'Transfer status: pending, in_transit, completed, cancelled';

COMMENT ON TABLE inventory_transfer_items IS 'Line items for inventory transfers - Feature F-024';
COMMENT ON COLUMN inventory_transfer_items.quantity IS 'Number of units to transfer';

COMMENT ON TABLE user_location_assignments IS 'Links users to their assigned store locations - Feature F-024';
COMMENT ON COLUMN user_location_assignments.is_default IS 'Default location for this user (only one per user)';
COMMENT ON COLUMN user_location_assignments.can_view_all_locations IS 'When true, user can view inventory at all locations';
