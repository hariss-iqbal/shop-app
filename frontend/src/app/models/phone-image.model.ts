/**
 * PhoneImage Model
 * Stores metadata for phone images
 */
export interface PhoneImage {
  id: string;
  phoneId: string;
  imageUrl: string;
  storagePath: string;
  publicId?: string;
  isPrimary: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface CreatePhoneImageRequest {
  phoneId: string;
  imageUrl: string;
  storagePath?: string;
  publicId?: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

export interface UpdatePhoneImageRequest {
  isPrimary?: boolean;
  displayOrder?: number;
}

export interface PhoneImageListResponse {
  data: PhoneImage[];
  total: number;
}

export interface ReorderPhoneImagesRequest {
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
  image?: PhoneImage;
}
