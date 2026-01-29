/**
 * Supplier DTOs
 * Data Transfer Objects for Supplier entity
 */

export interface CreateSupplierDto {
  name: string;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface UpdateSupplierDto {
  name?: string;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface SupplierResponseDto {
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

export interface SupplierListResponseDto {
  data: SupplierResponseDto[];
  total: number;
}
