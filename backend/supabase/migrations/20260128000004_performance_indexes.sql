-- Migration: Performance Indexes
-- Feature: F-057 - Supabase Database Indexes for Performance
--
-- This migration adds composite and supplementary indexes to optimize
-- frequently executed queries. The initial schema (20260128000001) created
-- basic single-column indexes per the acceptance criteria. This migration
-- adds composite indexes derived from actual query patterns.
--
-- ==========================================================================
-- ACCEPTANCE CRITERIA MAPPING
-- ==========================================================================
--
-- AC1: phones table indexes on status, brand_id, selling_price, created_at
--      -> Covered by initial schema: idx_phones_status, idx_phones_brand_id,
--         idx_phones_selling_price, idx_phones_created_at
--      -> Enhanced here: idx_phones_status_brand_id, idx_phones_status_created_at
--
-- AC2: phone_images table index on phone_id
--      -> Covered by initial schema: idx_phone_images_phone_id
--      -> Enhanced here: idx_phone_images_phone_id_is_primary,
--         idx_phone_images_phone_id_display_order
--
-- AC3: sales table index on sale_date
--      -> Covered by initial schema: idx_sales_sale_date
--      -> Enhanced here: idx_sales_phone_id (FK optimization)
--
-- AC4: contact_messages table index on is_read
--      -> Covered by initial schema: idx_contact_messages_is_read
--      -> Enhanced here: idx_contact_messages_is_read_created_at
--
-- AC5: RLS policy auth.uid() columns have indexes
--      -> N/A: This app uses role-based RLS (TO clause) not per-user filtering
--
-- AC6: Catalog queries use index scans (validated by query patterns below)
--
-- ==========================================================================

-- ============================================================
-- 1. COMPOSITE INDEXES — phones table
-- ============================================================

-- Catalog and dashboard queries filter by status + brand together
-- e.g. available phones for a specific brand, stock-by-brand counts
CREATE INDEX idx_phones_status_brand_id ON phones(status, brand_id);

-- Dashboard "recently added available phones" and catalog default sort
-- filter by status then order by created_at DESC
CREATE INDEX idx_phones_status_created_at ON phones(status, created_at DESC);

-- ============================================================
-- 2. COMPOSITE INDEXES — phone_images table
-- ============================================================

-- Primary image lookup: WHERE phone_id = ? AND is_primary = true
-- Used by catalog cards, SEO og:image, detail page hero image
CREATE INDEX idx_phone_images_phone_id_is_primary ON phone_images(phone_id, is_primary);

-- Ordered image retrieval: WHERE phone_id = ? ORDER BY display_order ASC
-- Used by detail page gallery, image management
CREATE INDEX idx_phone_images_phone_id_display_order ON phone_images(phone_id, display_order);

-- ============================================================
-- 3. COMPOSITE INDEXES — sales table
-- ============================================================

-- FK index for joins: Sale -> Phone (phone brand+model resolution in sales list)
CREATE INDEX idx_sales_phone_id ON sales(phone_id);

-- ============================================================
-- 4. COMPOSITE INDEXES — contact_messages table
-- ============================================================

-- Unread messages sorted by newest first:
-- WHERE is_read = false ORDER BY created_at DESC
-- Used by admin message list and unread count badge
CREATE INDEX idx_contact_messages_is_read_created_at ON contact_messages(is_read, created_at DESC);

-- ============================================================
-- 5. SUPPLEMENTARY INDEXES — purchase_orders table
-- ============================================================

-- FK index for supplier lookups (purchase history, supplier detail)
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);

-- Status filtering with default sort order
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);

-- ============================================================
-- 6. SUPPLEMENTARY INDEXES — purchase_order_items table
-- ============================================================

-- FK index for line item retrieval by purchase order
CREATE INDEX idx_purchase_order_items_purchase_order_id ON purchase_order_items(purchase_order_id);
