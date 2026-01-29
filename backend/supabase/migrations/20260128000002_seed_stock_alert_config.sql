-- Migration: Seed stock_alert_configs singleton row
-- Feature: F-002 - Supabase Database Schema and Migrations

-- Insert default stock alert configuration (singleton row)
INSERT INTO stock_alert_configs (low_stock_threshold, enable_brand_zero_alert)
VALUES (5, true);
