/**
 * Store Location Entity
 * Represents a physical store location for multi-location inventory
 * Database table: store_locations
 * Feature: F-024 Multi-Location Inventory Support
 */
export interface StoreLocation {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  is_primary: boolean;
  manager_user_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface StoreLocationInsert {
  id?: string;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
  is_primary?: boolean;
  manager_user_id?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface StoreLocationUpdate {
  id?: string;
  name?: string;
  code?: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
  is_primary?: boolean;
  manager_user_id?: string | null;
  notes?: string | null;
  updated_at?: string | null;
}
