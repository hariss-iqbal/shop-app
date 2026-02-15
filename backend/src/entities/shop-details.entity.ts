/**
 * Shop Details Entity
 * Stores configurable business information
 * Database table: shop_details
 */

export interface OpeningHoursEntry {
  day: string;
  hours: string;
  closed: boolean;
}

export interface ShopDetails {
  id: string;
  shop_name: string;
  tagline: string | null;
  description: string | null;
  address: string | null;
  phone_display: string | null;
  phone_link: string | null;
  email: string | null;
  whatsapp_number: string | null;
  weekday_hours: string | null;
  weekend_hours: string | null;
  opening_hours: OpeningHoursEntry[];
  map_embed_url: string | null;
  map_search_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  currency_code: string;
  currency_locale: string;
  currency_symbol: string;
  currency_decimals: number;
  logo_url: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ShopDetailsInsert {
  id?: string;
  shop_name: string;
  tagline?: string | null;
  description?: string | null;
  address?: string | null;
  phone_display?: string | null;
  phone_link?: string | null;
  email?: string | null;
  whatsapp_number?: string | null;
  weekday_hours?: string | null;
  weekend_hours?: string | null;
  opening_hours?: OpeningHoursEntry[];
  map_embed_url?: string | null;
  map_search_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  website_url?: string | null;
  currency_code?: string;
  currency_locale?: string;
  currency_symbol?: string;
  currency_decimals?: number;
  logo_url?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface ShopDetailsUpdate {
  id?: string;
  shop_name?: string;
  tagline?: string | null;
  description?: string | null;
  address?: string | null;
  phone_display?: string | null;
  phone_link?: string | null;
  email?: string | null;
  whatsapp_number?: string | null;
  weekday_hours?: string | null;
  weekend_hours?: string | null;
  opening_hours?: OpeningHoursEntry[];
  map_embed_url?: string | null;
  map_search_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  website_url?: string | null;
  currency_code?: string;
  currency_locale?: string;
  currency_symbol?: string;
  currency_decimals?: number;
  logo_url?: string | null;
  updated_at?: string | null;
}
