/**
 * Brand DTOs
 * Data Transfer Objects for Brand entity
 */

export interface CreateBrandDto {
  name: string;
  logo_url?: string | null;
}

export interface UpdateBrandDto {
  name?: string;
  logo_url?: string | null;
}

export interface BrandResponseDto {
  id: string;
  name: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface BrandListResponseDto {
  data: BrandResponseDto[];
  total: number;
}
