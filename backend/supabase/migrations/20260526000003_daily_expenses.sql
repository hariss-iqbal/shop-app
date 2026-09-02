-- Migration: Daily Shop Expenses + Grand Profit
-- Feature: F-026 Daily Expenses Tracking
--
-- Adds a per-location expenses ledger. Each expense is a free-text line item
-- (amount + description) on a given day; the UI rolls them up into a daily total.
-- Includes:
--   * created_by attribution (auto-set, like sales)
--   * no-future-date enforcement (trigger; a CHECK can't use the current date)
--   * RLS: any authenticated user can VIEW, only admin/manager can write
--   * get_expenses()      - rows joined to creator email (auth.users isn't queryable via PostgREST)
--   * get_grand_profit()  - sales profit (sale_price - cost_price) minus expenses, per day/month, optionally by location
--   * a configurable `canAccessExpenses` permission seeded into role_permissions

-- ============================================================
-- 1. EXPENSES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES store_locations(id) ON DELETE RESTRICT,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  expense_date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT expenses_amount_positive CHECK (amount > 0),
  CONSTRAINT expenses_description_not_blank CHECK (length(btrim(description)) > 0),
  CONSTRAINT expenses_description_maxlength CHECK (char_length(description) <= 500)
);

CREATE INDEX IF NOT EXISTS idx_expenses_location_id ON expenses(location_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);

COMMENT ON TABLE expenses IS 'Daily shop expenses (free-text line items, rolled up by day in the UI) - Feature F-026';
COMMENT ON COLUMN expenses.location_id IS 'Branch/shop the expense belongs to';
COMMENT ON COLUMN expenses.expense_date IS 'Business date of the expense; must not be in the future';

-- ============================================================
-- 2. TRIGGERS
-- ============================================================

-- updated_at maintenance (reuses the shared helper)
DROP TRIGGER IF EXISTS trg_expenses_updated_at ON expenses;
CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Auto-populate created_by with the calling user (same pattern as sales)
CREATE OR REPLACE FUNCTION set_expenses_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_expenses_created_by ON expenses;
CREATE TRIGGER trg_set_expenses_created_by
  BEFORE INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION set_expenses_created_by();

-- Reject future-dated expenses. Compared against "today" in the shop's timezone
-- (Asia/Karachi) so a late-night UTC offset never wrongly rejects the local today.
CREATE OR REPLACE FUNCTION enforce_expense_not_future()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.expense_date > (now() AT TIME ZONE 'Asia/Karachi')::date THEN
    RAISE EXCEPTION 'Expense date cannot be in the future'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_expense_not_future ON expenses;
CREATE TRIGGER trg_enforce_expense_not_future
  BEFORE INSERT OR UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION enforce_expense_not_future();

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can view expenses (read-only for cashiers)
CREATE POLICY "expenses_auth_select" ON expenses
  FOR SELECT TO authenticated
  USING (true);

-- Only managers/admins can add, edit, or delete
CREATE POLICY "expenses_manager_insert" ON expenses
  FOR INSERT TO authenticated
  WITH CHECK (is_manager_or_admin());

CREATE POLICY "expenses_manager_update" ON expenses
  FOR UPDATE TO authenticated
  USING (is_manager_or_admin())
  WITH CHECK (is_manager_or_admin());

CREATE POLICY "expenses_manager_delete" ON expenses
  FOR DELETE TO authenticated
  USING (is_manager_or_admin());

-- Service role bypass (system operations)
CREATE POLICY "expenses_service_all" ON expenses
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 4. READ RPC (joins creator email; auth.users is not exposed via PostgREST)
-- ============================================================

CREATE OR REPLACE FUNCTION get_expenses(
  p_location_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  location_id UUID,
  location_name TEXT,
  amount NUMERIC,
  description TEXT,
  expense_date DATE,
  created_by UUID,
  created_by_email TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.location_id,
    sl.name::TEXT AS location_name,
    e.amount,
    e.description,
    e.expense_date,
    e.created_by,
    u.email::TEXT AS created_by_email,
    e.created_at,
    e.updated_at
  FROM expenses e
  LEFT JOIN store_locations sl ON sl.id = e.location_id
  LEFT JOIN auth.users u ON u.id = e.created_by
  WHERE (p_location_id IS NULL OR e.location_id = p_location_id)
    AND (p_start_date IS NULL OR e.expense_date >= p_start_date)
    AND (p_end_date IS NULL OR e.expense_date <= p_end_date)
  ORDER BY e.expense_date DESC, e.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_expenses(UUID, DATE, DATE) TO authenticated;
COMMENT ON FUNCTION get_expenses IS 'List expenses (with creator email) optionally filtered by location and date range - Feature F-026';

-- ============================================================
-- 5. GRAND PROFIT RPC (sales profit - expenses), per day or month
-- ============================================================

CREATE OR REPLACE FUNCTION get_grand_profit(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_location_id UUID DEFAULT NULL,
  p_group_by TEXT DEFAULT 'day'
)
RETURNS TABLE (
  period DATE,
  sales_count BIGINT,
  sales_revenue NUMERIC,
  sales_cost NUMERIC,
  sales_profit NUMERIC,
  expenses_total NUMERIC,
  grand_profit NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_unit TEXT := CASE WHEN lower(p_group_by) = 'month' THEN 'month' ELSE 'day' END;
  v_sd DATE := COALESCE(p_start_date, '-infinity'::date);
  v_ed DATE := COALESCE(p_end_date, 'infinity'::date);
BEGIN
  RETURN QUERY
  WITH sales_agg AS (
    SELECT
      date_trunc(v_unit, s.sale_date::timestamp)::date AS period,
      COUNT(*) AS cnt,
      COALESCE(SUM(s.sale_price), 0) AS revenue,
      COALESCE(SUM(s.cost_price), 0) AS cost
    FROM sales s
    WHERE s.sale_date BETWEEN v_sd AND v_ed
      AND (p_location_id IS NULL OR s.location_id = p_location_id)
    GROUP BY 1
  ),
  exp_agg AS (
    SELECT
      date_trunc(v_unit, e.expense_date::timestamp)::date AS period,
      COALESCE(SUM(e.amount), 0) AS total
    FROM expenses e
    WHERE e.expense_date BETWEEN v_sd AND v_ed
      AND (p_location_id IS NULL OR e.location_id = p_location_id)
    GROUP BY 1
  )
  SELECT
    COALESCE(sa.period, ea.period) AS period,
    COALESCE(sa.cnt, 0)::BIGINT AS sales_count,
    COALESCE(sa.revenue, 0) AS sales_revenue,
    COALESCE(sa.cost, 0) AS sales_cost,
    (COALESCE(sa.revenue, 0) - COALESCE(sa.cost, 0)) AS sales_profit,
    COALESCE(ea.total, 0) AS expenses_total,
    ((COALESCE(sa.revenue, 0) - COALESCE(sa.cost, 0)) - COALESCE(ea.total, 0)) AS grand_profit
  FROM sales_agg sa
  FULL OUTER JOIN exp_agg ea ON sa.period = ea.period
  ORDER BY 1 DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_grand_profit(DATE, DATE, UUID, TEXT) TO authenticated;
COMMENT ON FUNCTION get_grand_profit IS 'Sales profit (sale_price - cost_price) minus expenses, grouped by day/month, optionally by location - Feature F-026';

-- ============================================================
-- 6. PERMISSION: canAccessExpenses (configurable via the permissions UI)
-- ============================================================
-- View access defaults ON for all roles (cashiers can view; only admin/manager
-- can write, enforced by RLS). Admins can later toggle this per role in the UI.

INSERT INTO role_permissions (role, permission, enabled) VALUES
  ('admin',   'canAccessExpenses', true),
  ('manager', 'canAccessExpenses', true),
  ('cashier', 'canAccessExpenses', true)
ON CONFLICT (role, permission) DO NOTHING;
