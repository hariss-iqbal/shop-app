/**
 * Supplier Entity
 * Represents a phone supplier/vendor
 * Database table: suppliers
 * Owner Module: M-06 Procurement
 */
export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface SupplierInsert {
  id?: string;
  name: string;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface SupplierUpdate {
  id?: string;
  name?: string;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  notes?: string | null;
  updated_at?: string | null;
}
