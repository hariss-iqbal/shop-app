import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CloudinaryService } from './cloudinary.service';
import { environment } from '@env/environment';
import {
  PhoneImage,
  PhoneImageListResponse,
  CreatePhoneImageRequest,
  UpdatePhoneImageRequest,
  ReorderPhoneImagesRequest,
  UploadProgress
} from '../../models/phone-image.model';

const CLOUDINARY_FOLDER = 'phone-images';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhoneImageService {
  private supabase = inject(SupabaseService);
  private cloudinary = inject(CloudinaryService);

  validateFile(file: File): FileValidationResult {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type: ${file.type}. Allowed types: JPEG, PNG, WebP, GIF`
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `File size (${sizeMB}MB) exceeds maximum allowed (10MB)`
      };
    }

    return { valid: true };
  }

  async uploadImage(
    phoneId: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<PhoneImage> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    onProgress?.({
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    });

    try {
      // Upload to Cloudinary with environment-specific folder
      const envFolder = environment.production ? 'prod' : 'dev';
      const cloudinaryResult = await this.cloudinary.uploadImage(
        file,
        `${CLOUDINARY_FOLDER}/${envFolder}/${phoneId}`,
        (cloudinaryProgress) => {
          onProgress?.({
            fileName: file.name,
            progress: cloudinaryProgress.percentage / 2, // First half of progress
            status: 'uploading'
          });
        }
      );

      onProgress?.({
        fileName: file.name,
        progress: 50,
        status: 'uploading'
      });

      // Create database record with Cloudinary data
      const imageRecord = await this.createImageRecord({
        phoneId,
        imageUrl: cloudinaryResult.secureUrl,
        storagePath: '', // Empty for Cloudinary images (kept for backward compatibility)
        publicId: cloudinaryResult.publicId
      });

      onProgress?.({
        fileName: file.name,
        progress: 100,
        status: 'completed'
      });

      return imageRecord;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onProgress?.({
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: errorMessage
      });
      throw error;
    }
  }

  async uploadMultipleImages(
    phoneId: string,
    files: File[],
    onProgress?: (fileName: string, progress: UploadProgress) => void
  ): Promise<PhoneImage[]> {
    const uploadPromises = files.map(async (file) => {
      try {
        const image = await this.uploadImage(phoneId, file, (progress) => {
          onProgress?.(file.name, progress);
        });
        return { success: true, image, fileName: file.name };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        onProgress?.(file.name, {
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: errorMessage
        });
        return { success: false, error: errorMessage, fileName: file.name };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(r => r.success).map(r => r.image!);

    return successfulUploads;
  }

  async getImagesByPhoneId(phoneId: string): Promise<PhoneImageListResponse> {
    const { data, error, count } = await this.supabase
      .from('phone_images')
      .select('*', { count: 'exact' })
      .eq('phone_id', phoneId)
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: (data || []).map(this.mapToPhoneImage),
      total: count || 0
    };
  }

  async getImageById(id: string): Promise<PhoneImage | null> {
    const { data, error } = await this.supabase
      .from('phone_images')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return this.mapToPhoneImage(data);
  }

  private async createImageRecord(request: CreatePhoneImageRequest): Promise<PhoneImage> {
    const { data: maxOrderData } = await this.supabase
      .from('phone_images')
      .select('display_order')
      .eq('phone_id', request.phoneId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const maxOrder = maxOrderData?.display_order ?? -1;

    const { data: existingImages } = await this.supabase
      .from('phone_images')
      .select('id')
      .eq('phone_id', request.phoneId)
      .limit(1);

    const isFirstImage = !existingImages || existingImages.length === 0;

    const insertData: Record<string, unknown> = {
      phone_id: request.phoneId,
      image_url: request.imageUrl,
      is_primary: request.isPrimary ?? isFirstImage,
      display_order: request.displayOrder ?? (maxOrder + 1)
    };

    // Include storage_path for backward compatibility (can be empty for Cloudinary)
    if (request.storagePath !== undefined) {
      insertData['storage_path'] = request.storagePath;
    } else {
      insertData['storage_path'] = '';
    }

    // Include public_id if provided (Cloudinary images)
    if (request.publicId) {
      insertData['public_id'] = request.publicId;
    }

    const { data, error } = await this.supabase
      .from('phone_images')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapToPhoneImage(data);
  }

  async updateImage(id: string, request: UpdatePhoneImageRequest): Promise<PhoneImage> {
    const updateData: Record<string, unknown> = {};

    if (request.isPrimary !== undefined) updateData['is_primary'] = request.isPrimary;
    if (request.displayOrder !== undefined) updateData['display_order'] = request.displayOrder;

    const { data, error } = await this.supabase
      .from('phone_images')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapToPhoneImage(data);
  }

  async setPrimary(id: string): Promise<PhoneImage> {
    const image = await this.getImageById(id);
    if (!image) {
      throw new Error('Image not found');
    }

    await this.supabase
      .from('phone_images')
      .update({ is_primary: false })
      .eq('phone_id', image.phoneId)
      .eq('is_primary', true);

    const { data, error } = await this.supabase
      .from('phone_images')
      .update({ is_primary: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapToPhoneImage(data);
  }

  async reorderImages(phoneId: string, request: ReorderPhoneImagesRequest): Promise<PhoneImage[]> {
    const updatePromises = request.imageIds.map((imageId, index) =>
      this.supabase
        .from('phone_images')
        .update({ display_order: index })
        .eq('id', imageId)
    );

    await Promise.all(updatePromises);

    const { data: images } = await this.getImagesByPhoneId(phoneId);
    return images;
  }

  async deleteImage(id: string): Promise<void> {
    const image = await this.getImageById(id);
    if (!image) {
      throw new Error('Image not found');
    }

    // Delete from Cloudinary if public_id exists
    if (image.publicId) {
      try {
        // Note: Cloudinary deletion requires backend API with secret
        // For now, we'll delete from DB only. In production, call backend endpoint
        // await this.cloudinary.deleteImage(image.publicId);
        console.warn('Cloudinary image deletion should be done via backend API:', image.publicId);
      } catch (error) {
        console.warn('Failed to delete from Cloudinary:', error);
      }
    } else if (image.storagePath) {
      // Delete from Supabase storage if storage_path exists (legacy)
      try {
        const { error: storageError } = await this.supabase.storage
          .from('phone-images')
          .remove([image.storagePath]);

        if (storageError) {
          console.warn('Failed to delete from Supabase storage:', storageError.message);
        }
      } catch (error) {
        console.warn('Failed to delete from Supabase storage:', error);
      }
    }

    // Delete database record
    const { error: dbError } = await this.supabase
      .from('phone_images')
      .delete()
      .eq('id', id);

    if (dbError) {
      throw new Error(dbError.message);
    }

    // Set new primary image if deleted was primary
    if (image.isPrimary) {
      const { data: remainingImages } = await this.supabase
        .from('phone_images')
        .select('id')
        .eq('phone_id', image.phoneId)
        .order('display_order', { ascending: true })
        .limit(1);

      if (remainingImages && remainingImages.length > 0) {
        await this.supabase
          .from('phone_images')
          .update({ is_primary: true })
          .eq('id', remainingImages[0].id);
      }
    }
  }

  async deleteImagesByPhoneId(phoneId: string): Promise<void> {
    const { data: images } = await this.getImagesByPhoneId(phoneId);

    if (images.length > 0) {
      // Delete images from Cloudinary/Supabase
      for (const image of images) {
        if (image.publicId) {
          try {
            // Note: Cloudinary deletion requires backend API
            console.warn('Cloudinary image deletion should be done via backend API:', image.publicId);
          } catch (error) {
            console.warn('Failed to delete from Cloudinary:', error);
          }
        } else if (image.storagePath) {
          try {
            await this.supabase.storage
              .from('phone-images')
              .remove([image.storagePath]);
          } catch (error) {
            console.warn('Failed to delete from Supabase storage:', error);
          }
        }
      }

      // Delete all database records
      await this.supabase
        .from('phone_images')
        .delete()
        .eq('phone_id', phoneId);
    }
  }

  private mapToPhoneImage(data: Record<string, unknown>): PhoneImage {
    return {
      id: data['id'] as string,
      phoneId: data['phone_id'] as string,
      imageUrl: data['image_url'] as string,
      storagePath: data['storage_path'] as string || '',
      publicId: data['public_id'] as string | undefined,
      isPrimary: data['is_primary'] as boolean,
      displayOrder: data['display_order'] as number,
      createdAt: data['created_at'] as string
    };
  }

  /**
   * Check if an image is stored in Cloudinary
   */
  isCloudinaryImage(image: PhoneImage): boolean {
    return !!image.publicId || this.cloudinary.isCloudinaryUrl(image.imageUrl);
  }

  /**
   * Get the public ID from a phone image
   */
  getImagePublicId(image: PhoneImage): string | null {
    if (image.publicId) {
      return image.publicId;
    }
    return this.cloudinary.getPublicIdFromUrl(image.imageUrl);
  }
}
