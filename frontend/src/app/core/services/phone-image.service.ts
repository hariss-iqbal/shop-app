import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  PhoneImage,
  PhoneImageListResponse,
  CreatePhoneImageRequest,
  UpdatePhoneImageRequest,
  ReorderPhoneImagesRequest,
  UploadProgress
} from '../../models/phone-image.model';

const STORAGE_BUCKET = 'phone-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhoneImageService {
  private supabase = inject(SupabaseService);

  validateFile(file: File): FileValidationResult {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type: ${file.type}. Allowed types: JPEG, PNG, WebP`
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `File size (${sizeMB}MB) exceeds maximum allowed (5MB)`
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

    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const storagePath = `${phoneId}/${uniqueFileName}`;

    onProgress?.({
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    });

    const { error: uploadError } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      onProgress?.({
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: uploadError.message
      });
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    onProgress?.({
      fileName: file.name,
      progress: 50,
      status: 'uploading'
    });

    const { data: publicUrlData } = this.supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    const imageUrl = publicUrlData.publicUrl;

    const imageRecord = await this.createImageRecord({
      phoneId,
      imageUrl,
      storagePath
    });

    onProgress?.({
      fileName: file.name,
      progress: 100,
      status: 'completed'
    });

    return imageRecord;
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
    const { data: _countData } = await this.supabase
      .from('phone_images')
      .select('id', { count: 'exact', head: true })
      .eq('phone_id', request.phoneId);

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

    const { data, error } = await this.supabase
      .from('phone_images')
      .insert({
        phone_id: request.phoneId,
        image_url: request.imageUrl,
        storage_path: request.storagePath,
        is_primary: request.isPrimary ?? isFirstImage,
        display_order: request.displayOrder ?? (maxOrder + 1)
      })
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

    const { error: storageError } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .remove([image.storagePath]);

    if (storageError) {
      console.warn('Failed to delete from storage:', storageError.message);
    }

    const { error: dbError } = await this.supabase
      .from('phone_images')
      .delete()
      .eq('id', id);

    if (dbError) {
      throw new Error(dbError.message);
    }

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
      const storagePaths = images.map(img => img.storagePath);
      await this.supabase.storage
        .from(STORAGE_BUCKET)
        .remove(storagePaths);

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
      storagePath: data['storage_path'] as string,
      isPrimary: data['is_primary'] as boolean,
      displayOrder: data['display_order'] as number,
      createdAt: data['created_at'] as string
    };
  }
}
