/**
 * StorageConfig DTOs
 * Data Transfer Objects for Storage bucket configuration
 * Owner Module: M-13 Storage
 */

export interface StorageBucketConfigDto {
  id: string;
  name: string;
  isPublic: boolean;
  fileSizeLimitMB: number;
  fileSizeLimitBytes: number;
  allowedMimeTypes: string[];
}

export interface StorageBucketPolicyDto {
  operation: string;
  role: string;
  allowed: boolean;
}

export interface StorageBucketStatusDto {
  bucket: StorageBucketConfigDto;
  policies: StorageBucketPolicyDto[];
  fileCount: number;
  totalSizeBytes: number;
  totalSizeMB: string;
  pathStructure: string;
}
