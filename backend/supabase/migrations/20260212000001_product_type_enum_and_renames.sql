-- Migration: Rename Phone Enums to Product Enums + Create Product Type Enum
-- Feature: Rename Phones to Products with Product Type Support
-- Step 1 of 3: Enum changes (must be separate transaction from ALTER TYPE ADD VALUE)

-- ============================================================
-- 1. CREATE PRODUCT_TYPE ENUM
-- ============================================================

CREATE TYPE product_type AS ENUM ('phone', 'accessory', 'tablet', 'laptop');

-- ============================================================
-- 2. RENAME EXISTING ENUMS
-- ============================================================

-- Rename phone_condition -> product_condition
ALTER TYPE phone_condition RENAME TO product_condition;

-- Rename phone_status -> product_status
ALTER TYPE phone_status RENAME TO product_status;
