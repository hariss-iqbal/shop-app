/**
 * ProductImage DTOs
 * Data Transfer Objects for ProductImage entity
 */

export interface CreateProductImageDto {
  productId: string;
  imageUrl: string;
  storagePath?: string;
  publicId?: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

export interface UpdateProductImageDto {
  isPrimary?: boolean;
  displayOrder?: number;
}

export interface ProductImageResponseDto {
  id: string;
  productId: string;
  imageUrl: string;
  storagePath: string | null;
  publicId?: string;
  isPrimary: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface ProductImageListResponseDto {
  data: ProductImageResponseDto[];
  total: number;
}

export interface ReorderProductImagesDto {
  imageIds: string[];
}
