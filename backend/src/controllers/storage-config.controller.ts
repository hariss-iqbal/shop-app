import { StorageConfigService } from '../services/storage-config.service';
import { StorageBucketStatusDto } from '../dto/storage-config.dto';

/**
 * StorageConfig Controller
 * HTTP request handling for Storage bucket configuration
 * Routes: /api/storage/config
 * Owner Module: M-13 Storage
 */
export class StorageConfigController {
  constructor(private readonly storageConfigService: StorageConfigService) {}

  async getPhoneImagesBucketStatus(): Promise<StorageBucketStatusDto> {
    return this.storageConfigService.getPhoneImagesBucketStatus();
  }

  async getStorageConstants(): Promise<{
    bucketName: string;
    maxFileSizeBytes: number;
    maxFileSizeMB: number;
    allowedMimeTypes: string[];
    pathStructure: string;
  }> {
    return {
      bucketName: this.storageConfigService.getBucketName(),
      maxFileSizeBytes: this.storageConfigService.getMaxFileSizeBytes(),
      maxFileSizeMB: this.storageConfigService.getMaxFileSizeBytes() / (1024 * 1024),
      allowedMimeTypes: this.storageConfigService.getAllowedMimeTypes(),
      pathStructure: 'phone-images/{phone_id}/{filename}'
    };
  }
}
