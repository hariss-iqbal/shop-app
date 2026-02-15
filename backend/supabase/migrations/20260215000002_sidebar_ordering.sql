-- Migration: Add sidebar ordering and default landing route to shop_details
-- Allows admin to configure the sidebar item order and default page for all users.

ALTER TABLE shop_details
  ADD COLUMN IF NOT EXISTS sidebar_item_order JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS default_landing_route TEXT DEFAULT '/admin/dashboard';
