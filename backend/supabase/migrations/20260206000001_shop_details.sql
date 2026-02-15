-- Shop Details Table
-- Stores configurable business information that replaces hardcoded values

CREATE TABLE IF NOT EXISTS shop_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL DEFAULT 'Sprint Mobiles',
  tagline TEXT,
  description TEXT,
  address TEXT,
  phone_display TEXT,
  phone_link TEXT,
  email TEXT,
  whatsapp_number TEXT,
  weekday_hours TEXT,
  weekend_hours TEXT,
  opening_hours JSONB DEFAULT '[]'::jsonb,
  map_embed_url TEXT,
  map_search_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  currency_code TEXT DEFAULT 'PKR',
  currency_locale TEXT DEFAULT 'en-PK',
  currency_symbol TEXT DEFAULT 'Rs.',
  currency_decimals INTEGER DEFAULT 0,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE shop_details ENABLE ROW LEVEL SECURITY;

-- Anyone can read shop details
CREATE POLICY "shop_details_select_anon" ON shop_details
  FOR SELECT USING (true);

-- Authenticated users can insert
CREATE POLICY "shop_details_insert_auth" ON shop_details
  FOR INSERT TO authenticated WITH CHECK (true);

-- Authenticated users can update
CREATE POLICY "shop_details_update_auth" ON shop_details
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Authenticated users can delete
CREATE POLICY "shop_details_delete_auth" ON shop_details
  FOR DELETE TO authenticated USING (true);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION set_shop_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shop_details_updated_at
  BEFORE UPDATE ON shop_details
  FOR EACH ROW
  EXECUTE FUNCTION set_shop_details_updated_at();

-- Seed with correct shop data (Sprint Mobiles)
INSERT INTO shop_details (
  shop_name,
  tagline,
  description,
  address,
  phone_display,
  phone_link,
  email,
  whatsapp_number,
  weekday_hours,
  weekend_hours,
  opening_hours,
  map_embed_url,
  map_search_url,
  facebook_url,
  instagram_url,
  twitter_url,
  currency_code,
  currency_locale,
  currency_symbol,
  currency_decimals
) VALUES (
  'Sprint Mobiles',
  'Your Trusted Phone Shop',
  'Your trusted destination for quality mobile phones. We offer new, used, and refurbished devices at competitive prices with a 30-day quality guarantee.',
  'Shop G7, Fazal Trade Center, Lahore',
  '+923214495590',
  '+923214495590',
  NULL,
  '+923214495590',
  'Mon - Sat: 11:00 AM - 10:00 PM',
  'Sun: Closed',
  '[
    {"day": "Monday", "hours": "11:00 AM - 10:00 PM", "closed": false},
    {"day": "Tuesday", "hours": "11:00 AM - 10:00 PM", "closed": false},
    {"day": "Wednesday", "hours": "11:00 AM - 10:00 PM", "closed": false},
    {"day": "Thursday", "hours": "11:00 AM - 10:00 PM", "closed": false},
    {"day": "Friday", "hours": "11:00 AM - 10:00 PM", "closed": false},
    {"day": "Saturday", "hours": "11:00 AM - 10:00 PM", "closed": false},
    {"day": "Sunday", "hours": "", "closed": true}
  ]'::jsonb,
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3400.0!2d74.3587!3d31.5204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sFazal%20Trade%20Center%2C%20Lahore!5e0!3m2!1sen!2spk!4v1700000000000',
  'https://www.google.com/maps/search/?api=1&query=Fazal+Trade+Center+Lahore',
  NULL,
  NULL,
  NULL,
  'PKR',
  'en-PK',
  'Rs.',
  0
);
