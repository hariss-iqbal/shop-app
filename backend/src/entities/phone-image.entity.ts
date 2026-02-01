/**
 * PhoneImage Entity
 * Stores metadata for phone images uploaded to Cloudinary or Supabase Storage
 * Database table: phone_images
 * Owner Module: M-04 Inventory
 */
export interface PhoneImage {
  id: string;
  phone_id: string;
  image_url: string;
  storage_path: string | null;
  public_id?: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface PhoneImageInsert {
  id?: string;
  phone_id: string;
  image_url: string;
  storage_path?: string | null;
  public_id?: string;
  is_primary?: boolean;
  display_order?: number;
  created_at?: string;
}

export interface PhoneImageUpdate {
  id?: string;
  phone_id?: string;
  image_url?: string;
  storage_path?: string | null;
  public_id?: string;
  is_primary?: boolean;
  display_order?: number;
}
