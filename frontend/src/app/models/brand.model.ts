/**
 * Brand Model
 * Represents a phone manufacturer/brand
 */
export interface Brand {
  id: string;
  name: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateBrandRequest {
  name: string;
  logoUrl?: string | null;
}

export interface UpdateBrandRequest {
  name?: string;
  logoUrl?: string | null;
}

export interface BrandListResponse {
  data: Brand[];
  total: number;
}
