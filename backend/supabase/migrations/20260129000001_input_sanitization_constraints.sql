-- Migration: Input Sanitization and XSS Prevention
-- Feature: F-058 - Input Sanitization and XSS Prevention
-- Adds database-level sanitization trigger to strip HTML tags from text fields.
-- This is a defense-in-depth measure; application-level sanitization is the primary layer.

-- ============================================================
-- 1. SANITIZATION FUNCTION
-- ============================================================

-- Function to strip HTML tags from a text value.
-- Preserves plain text content while removing any HTML markup.
CREATE OR REPLACE FUNCTION strip_html_tags(input TEXT)
RETURNS TEXT AS $$
BEGIN
  IF input IS NULL THEN
    RETURN NULL;
  END IF;
  -- Remove script tags and their content first
  input := regexp_replace(input, '<script[^>]*>.*?</script>', '', 'gis');
  -- Remove all remaining HTML tags
  input := regexp_replace(input, '<[^>]+>', '', 'g');
  -- Trim whitespace
  input := trim(input);
  RETURN input;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- 2. SANITIZATION TRIGGERS
-- ============================================================

-- Contact messages: sanitize name, subject, message on insert
-- (Email and phone are not sanitized as they have specific format requirements)
CREATE OR REPLACE FUNCTION sanitize_contact_message()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name := strip_html_tags(NEW.name);
  NEW.subject := strip_html_tags(NEW.subject);
  NEW.message := strip_html_tags(NEW.message);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_contact_messages_sanitize
  BEFORE INSERT OR UPDATE ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_contact_message();

-- Phones: sanitize model, description, color, notes on insert/update
CREATE OR REPLACE FUNCTION sanitize_phone()
RETURNS TRIGGER AS $$
BEGIN
  NEW.model := strip_html_tags(NEW.model);
  NEW.description := strip_html_tags(NEW.description);
  NEW.color := strip_html_tags(NEW.color);
  NEW.notes := strip_html_tags(NEW.notes);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_phones_sanitize
  BEFORE INSERT OR UPDATE ON phones
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_phone();

-- Brands: sanitize name on insert/update
CREATE OR REPLACE FUNCTION sanitize_brand()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name := strip_html_tags(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_brands_sanitize
  BEFORE INSERT OR UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_brand();

-- Suppliers: sanitize text fields on insert/update
CREATE OR REPLACE FUNCTION sanitize_supplier()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name := strip_html_tags(NEW.name);
  NEW.contact_person := strip_html_tags(NEW.contact_person);
  NEW.address := strip_html_tags(NEW.address);
  NEW.notes := strip_html_tags(NEW.notes);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_suppliers_sanitize
  BEFORE INSERT OR UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_supplier();

-- Purchase orders: sanitize notes on insert/update
CREATE OR REPLACE FUNCTION sanitize_purchase_order()
RETURNS TRIGGER AS $$
BEGIN
  NEW.notes := strip_html_tags(NEW.notes);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_purchase_orders_sanitize
  BEFORE INSERT OR UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_purchase_order();

-- Purchase order items: sanitize brand and model on insert/update
CREATE OR REPLACE FUNCTION sanitize_purchase_order_item()
RETURNS TRIGGER AS $$
BEGIN
  NEW.brand := strip_html_tags(NEW.brand);
  NEW.model := strip_html_tags(NEW.model);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_purchase_order_items_sanitize
  BEFORE INSERT OR UPDATE ON purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_purchase_order_item();

-- Sales: sanitize buyer_name and notes on insert/update
CREATE OR REPLACE FUNCTION sanitize_sale()
RETURNS TRIGGER AS $$
BEGIN
  NEW.buyer_name := strip_html_tags(NEW.buyer_name);
  NEW.notes := strip_html_tags(NEW.notes);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sales_sanitize
  BEFORE INSERT OR UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_sale();
