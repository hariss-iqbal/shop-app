/**
 * Brand Entity
 * Represents a phone manufacturer/brand
 * Database table: brands
 * Owner Module: M-04 Inventory
 */
export interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface BrandInsert {
  id?: string;
  name: string;
  logo_url?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface BrandUpdate {
  id?: string;
  name?: string;
  logo_url?: string | null;
  updated_at?: string | null;
}
