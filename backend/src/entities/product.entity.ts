import { ProductCondition, ProductStatus, ProductType } from '../enums';

/**
 * Product Entity
 * Core entity representing a product in inventory
 * Database table: products
 * Owner Module: M-04 Inventory
 * Referenced by: M-04, M-05, M-06, M-07, M-09, M-12
 */
export interface Product {
  id: string;
  brand_id: string;
  model: string;
  description: string | null;
  storage_gb: number | null;
  ram_gb: number | null;
  color: string | null;
  condition: ProductCondition;
  battery_health: number | null;
  imei: string | null;
  cost_price: number;
  selling_price: number;
  status: ProductStatus;
  purchase_date: string | null;
  supplier_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  /** Tax rate percentage (0-100). E.g., 10 for 10% tax rate */
  tax_rate: number;
  /** When true, selling_price includes tax. When false, tax is added on top */
  is_tax_inclusive: boolean;
  /** When true, item is tax exempt (0% tax) and clearly marked on receipts */
  is_tax_exempt: boolean;
  condition_rating: number | null;
  pta_status: string | null;
  product_type: ProductType;
  accessory_category: string | null;
  compatible_models: string[] | null;
  material: string | null;
  warranty_months: number | null;
  weight_grams: number | null;
  dimensions: string | null;
}

export interface ProductInsert {
  id?: string;
  brand_id: string;
  model: string;
  description?: string | null;
  storage_gb?: number | null;
  ram_gb?: number | null;
  color?: string | null;
  condition: ProductCondition;
  battery_health?: number | null;
  imei?: string | null;
  cost_price: number;
  selling_price: number;
  status?: ProductStatus;
  purchase_date?: string | null;
  supplier_id?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string | null;
  tax_rate?: number;
  is_tax_inclusive?: boolean;
  is_tax_exempt?: boolean;
  condition_rating?: number | null;
  pta_status?: string | null;
  product_type?: ProductType;
  accessory_category?: string | null;
  compatible_models?: string[] | null;
  material?: string | null;
  warranty_months?: number | null;
  weight_grams?: number | null;
  dimensions?: string | null;
}

export interface ProductUpdate {
  id?: string;
  brand_id?: string;
  model?: string;
  description?: string | null;
  storage_gb?: number | null;
  ram_gb?: number | null;
  color?: string | null;
  condition?: ProductCondition;
  battery_health?: number | null;
  imei?: string | null;
  cost_price?: number;
  selling_price?: number;
  status?: ProductStatus;
  purchase_date?: string | null;
  supplier_id?: string | null;
  notes?: string | null;
  updated_at?: string | null;
  tax_rate?: number;
  is_tax_inclusive?: boolean;
  is_tax_exempt?: boolean;
  condition_rating?: number | null;
  pta_status?: string | null;
  product_type?: ProductType;
  accessory_category?: string | null;
  compatible_models?: string[] | null;
  material?: string | null;
  warranty_months?: number | null;
  weight_grams?: number | null;
  dimensions?: string | null;
}

export interface ProductWithRelations extends Product {
  brand?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  supplier?: {
    id: string;
    name: string;
  } | null;
  images?: {
    id: string;
    image_url: string;
    is_primary: boolean;
    display_order: number;
  }[];
}
