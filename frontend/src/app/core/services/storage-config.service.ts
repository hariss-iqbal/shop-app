import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  StorageBucketConfig,
  StorageBucketPolicy,
  StorageBucketStatus,
  StorageConstants
} from '../../models/storage-config.model';

const PHONE_IMAGES_BUCKET = 'phone-images';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_MIME_TYPES: string[] = ['image/jpeg', 'image/png', 'image/webp'];
const PATH_STRUCTURE = 'phone-images/{phone_id}/{filename}';

/**
 * Storage Configuration Service
 * Manages Supabase Storage bucket configuration for phone images
 * Owner Module: M-13 Storage
 */
@Injectable({
  providedIn: 'root'
})
export class StorageConfigService {
  constructor(private supabase: SupabaseService) { }

  getStorageConstants(): StorageConstants {
    return {
      bucketName: PHONE_IMAGES_BUCKET,
      maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
      maxFileSizeMB: MAX_FILE_SIZE_MB,
      allowedMimeTypes: [...ALLOWED_MIME_TYPES],
      pathStructure: PATH_STRUCTURE
    };
  }

  async getBucketStatus(): Promise<StorageBucketStatus> {
    const bucket = await this.fetchBucketConfig();

    const policies = this.getConfiguredPolicies();

    let fileCount = 0;
    let totalSizeBytes = 0;
    try {
      const topLevelFolders = await this.listBucketFiles('');
      const folders = topLevelFolders.filter(f => !f.metadata || Object.keys(f.metadata).length === 0);

      let totalFiles = 0;
      for (const folder of folders) {
        const files = await this.listBucketFiles(folder.name);
        const imageFiles = files.filter(f => f.metadata && Object.keys(f.metadata).length > 0);
        totalFiles += imageFiles.length;
        for (const file of imageFiles) {
          const metadata = file.metadata as Record<string, unknown> | undefined;
          if (metadata && typeof metadata['size'] === 'number') {
            totalSizeBytes += metadata['size'];
          }
        }
      }
      fileCount = totalFiles;
    } catch {
      // Non-critical: bucket may be empty or listing may fail
    }

    return {
      bucket,
      policies,
      fileCount,
      totalSizeBytes,
      totalSizeMB: (totalSizeBytes / (1024 * 1024)).toFixed(2),
      pathStructure: PATH_STRUCTURE
    };
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type: ${file.type}. Allowed types: JPEG, PNG, WebP`
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `File size (${sizeMB}MB) exceeds maximum allowed (${MAX_FILE_SIZE_MB}MB)`
      };
    }

    return { valid: true };
  }

  generateStoragePath(phoneId: string, fileName: string): string {
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    return `${phoneId}/${uniqueFileName}`;
  }

  getPublicUrl(storagePath: string): string {
    const { data } = this.supabase.storage
      .from(PHONE_IMAGES_BUCKET)
      .getPublicUrl(storagePath);
    return data.publicUrl;
  }

  private async fetchBucketConfig(): Promise<StorageBucketConfig> {
    const { data, error } = await this.supabase.storage.getBucket(PHONE_IMAGES_BUCKET);

    if (error) {
      throw new Error(`Failed to fetch bucket config: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      isPublic: data.public,
      fileSizeLimitMB: MAX_FILE_SIZE_MB,
      fileSizeLimitBytes: MAX_FILE_SIZE_BYTES,
      allowedMimeTypes: [...ALLOWED_MIME_TYPES]
    };
  }

  private getConfiguredPolicies(): StorageBucketPolicy[] {
    return [
      { operation: 'SELECT', role: 'anon', allowed: true },
      { operation: 'SELECT', role: 'authenticated', allowed: true },
      { operation: 'INSERT', role: 'anon', allowed: false },
      { operation: 'INSERT', role: 'authenticated', allowed: true },
      { operation: 'UPDATE', role: 'anon', allowed: false },
      { operation: 'UPDATE', role: 'authenticated', allowed: true },
      { operation: 'DELETE', role: 'anon', allowed: false },
      { operation: 'DELETE', role: 'authenticated', allowed: true }
    ];
  }

  private async listBucketFiles(path: string): Promise<{ name: string; metadata: Record<string, unknown> | null }[]> {
    const { data, error } = await this.supabase.storage
      .from(PHONE_IMAGES_BUCKET)
      .list(path, { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(item => ({
      name: item.name,
      metadata: item.metadata as Record<string, unknown> | null
    }));
  }
}
