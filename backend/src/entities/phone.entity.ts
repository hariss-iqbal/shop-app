import { PhoneCondition, PhoneStatus } from '../enums';

/**
 * Phone Entity
 * Core entity representing a phone in inventory
 * Database table: phones
 * Owner Module: M-04 Inventory
 * Referenced by: M-04, M-05, M-06, M-07, M-09, M-12
 */
export interface Phone {
  id: string;
  brand_id: string;
  model: string;
  description: string | null;
  storage_gb: number | null;
  ram_gb: number | null;
  color: string | null;
  condition: PhoneCondition;
  battery_health: number | null;
  imei: string | null;
  cost_price: number;
  selling_price: number;
  status: PhoneStatus;
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
}

export interface PhoneInsert {
  id?: string;
  brand_id: string;
  model: string;
  description?: string | null;
  storage_gb?: number | null;
  ram_gb?: number | null;
  color?: string | null;
  condition: PhoneCondition;
  battery_health?: number | null;
  imei?: string | null;
  cost_price: number;
  selling_price: number;
  status?: PhoneStatus;
  purchase_date?: string | null;
  supplier_id?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string | null;
  tax_rate?: number;
  is_tax_inclusive?: boolean;
  is_tax_exempt?: boolean;
}

export interface PhoneUpdate {
  id?: string;
  brand_id?: string;
  model?: string;
  description?: string | null;
  storage_gb?: number | null;
  ram_gb?: number | null;
  color?: string | null;
  condition?: PhoneCondition;
  battery_health?: number | null;
  imei?: string | null;
  cost_price?: number;
  selling_price?: number;
  status?: PhoneStatus;
  purchase_date?: string | null;
  supplier_id?: string | null;
  notes?: string | null;
  updated_at?: string | null;
  tax_rate?: number;
  is_tax_inclusive?: boolean;
  is_tax_exempt?: boolean;
}

export interface PhoneWithRelations extends Phone {
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
