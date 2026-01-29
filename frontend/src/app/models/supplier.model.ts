/**
 * Supplier Model
 * Represents a phone supplier/vendor
 */
export interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface UpdateSupplierRequest {
  name?: string;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface SupplierListResponse {
  data: Supplier[];
  total: number;
}
