/**
 * ProductImage Entity
 * Stores metadata for product images uploaded to Cloudinary or Supabase Storage
 * Database table: product_images
 * Owner Module: M-04 Inventory
 */
export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  storage_path: string | null;
  public_id?: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface ProductImageInsert {
  id?: string;
  product_id: string;
  image_url: string;
  storage_path?: string | null;
  public_id?: string;
  is_primary?: boolean;
  display_order?: number;
  created_at?: string;
}

export interface ProductImageUpdate {
  id?: string;
  product_id?: string;
  image_url?: string;
  storage_path?: string | null;
  public_id?: string;
  is_primary?: boolean;
  display_order?: number;
}
