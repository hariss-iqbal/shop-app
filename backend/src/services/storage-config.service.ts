import { StorageConfigRepository } from '../repositories/storage-config.repository';
import {
  StorageBucketConfigDto,
  StorageBucketPolicyDto,
  StorageBucketStatusDto
} from '../dto/storage-config.dto';

const PHONE_IMAGES_BUCKET = 'phone-images';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PATH_STRUCTURE = 'phone-images/{phone_id}/{filename}';

/**
 * StorageConfig Service
 * Business logic for Supabase Storage bucket configuration
 * Owner Module: M-13 Storage
 */
export class StorageConfigService {
  constructor(private readonly storageConfigRepository: StorageConfigRepository) {}

  async getPhoneImagesBucketStatus(): Promise<StorageBucketStatusDto> {
    const bucket = await this.storageConfigRepository.getBucketById(PHONE_IMAGES_BUCKET);

    const bucketConfig: StorageBucketConfigDto = {
      id: bucket.id,
      name: bucket.name,
      isPublic: bucket.public,
      fileSizeLimitMB: MAX_FILE_SIZE_BYTES / (1024 * 1024),
      fileSizeLimitBytes: MAX_FILE_SIZE_BYTES,
      allowedMimeTypes: ALLOWED_MIME_TYPES
    };

    const policies: StorageBucketPolicyDto[] = [
      { operation: 'SELECT', role: 'anon', allowed: true },
      { operation: 'SELECT', role: 'authenticated', allowed: true },
      { operation: 'INSERT', role: 'anon', allowed: false },
      { operation: 'INSERT', role: 'authenticated', allowed: true },
      { operation: 'UPDATE', role: 'anon', allowed: false },
      { operation: 'UPDATE', role: 'authenticated', allowed: true },
      { operation: 'DELETE', role: 'anon', allowed: false },
      { operation: 'DELETE', role: 'authenticated', allowed: true }
    ];

    let fileCount = 0;
    let totalSizeBytes = 0;
    try {
      const files = await this.storageConfigRepository.listFiles(PHONE_IMAGES_BUCKET);
      fileCount = files.length;
    } catch {
      // Non-critical: if file listing fails, return 0
    }

    return {
      bucket: bucketConfig,
      policies,
      fileCount,
      totalSizeBytes,
      totalSizeMB: (totalSizeBytes / (1024 * 1024)).toFixed(2),
      pathStructure: PATH_STRUCTURE
    };
  }

  getBucketName(): string {
    return PHONE_IMAGES_BUCKET;
  }

  getMaxFileSizeBytes(): number {
    return MAX_FILE_SIZE_BYTES;
  }

  getAllowedMimeTypes(): string[] {
    return [...ALLOWED_MIME_TYPES];
  }

  validateFileType(mimeType: string): boolean {
    return ALLOWED_MIME_TYPES.includes(mimeType);
  }

  validateFileSize(sizeBytes: number): boolean {
    return sizeBytes <= MAX_FILE_SIZE_BYTES;
  }
}
