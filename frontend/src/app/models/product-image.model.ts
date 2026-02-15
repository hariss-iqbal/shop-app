/**
 * ProductImage Model
 * Stores metadata for product images
 */
export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  storagePath: string;
  publicId?: string;
  isPrimary: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface CreateProductImageRequest {
  productId: string;
  imageUrl: string;
  storagePath?: string;
  publicId?: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

export interface UpdateProductImageRequest {
  isPrimary?: boolean;
  displayOrder?: number;
}

export interface ProductImageListResponse {
  data: ProductImage[];
  total: number;
}

export interface ReorderProductImagesRequest {
  imageIds: string[];
}

export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'error';

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: UploadStatus;
  error?: string;
}

export interface ImageUploadState {
  file: File;
  previewUrl: string;
  progress: UploadProgress;
  image?: ProductImage;
}
