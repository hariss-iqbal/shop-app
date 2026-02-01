/**
 * PhoneImage DTOs
 * Data Transfer Objects for PhoneImage entity
 */

export interface CreatePhoneImageDto {
  phoneId: string;
  imageUrl: string;
  storagePath?: string;
  publicId?: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

export interface UpdatePhoneImageDto {
  isPrimary?: boolean;
  displayOrder?: number;
}

export interface PhoneImageResponseDto {
  id: string;
  phoneId: string;
  imageUrl: string;
  storagePath: string | null;
  publicId?: string;
  isPrimary: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface PhoneImageListResponseDto {
  data: PhoneImageResponseDto[];
  total: number;
}

export interface ReorderPhoneImagesDto {
  imageIds: string[];
}
