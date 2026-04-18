-- Product-level visitor tracking
-- Captures which products anonymous visitors open on the public site.
-- Generic page/session metadata is covered by Vercel Analytics; this table
-- exists only to join views back to the products catalog for the admin
-- "Most Viewed Products" widget.

CREATE TABLE product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_views_product_id ON product_views(product_id);
CREATE INDEX idx_product_views_viewed_at ON product_views(viewed_at DESC);
CREATE INDEX idx_product_views_product_viewed ON product_views(product_id, viewed_at DESC);

ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

-- Anonymous and authenticated visitors may insert a view row.
-- No SELECT grant — readable only by admins (next policy).
CREATE POLICY "product_views_anon_insert" ON product_views
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "product_views_auth_insert" ON product_views
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Admins only — relies on is_admin() from 20260131000008_role_based_access_control.sql
CREATE POLICY "product_views_admin_select" ON product_views
  FOR SELECT TO authenticated
  USING (is_admin());
