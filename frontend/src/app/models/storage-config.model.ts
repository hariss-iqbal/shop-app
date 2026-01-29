/**
 * Storage Configuration Model
 * Represents Supabase Storage bucket configuration for phone images
 * Owner Module: M-13 Storage
 */

export interface StorageBucketConfig {
  id: string;
  name: string;
  isPublic: boolean;
  fileSizeLimitMB: number;
  fileSizeLimitBytes: number;
  allowedMimeTypes: string[];
}

export interface StorageBucketPolicy {
  operation: string;
  role: string;
  allowed: boolean;
}

export interface StorageBucketStatus {
  bucket: StorageBucketConfig;
  policies: StorageBucketPolicy[];
  fileCount: number;
  totalSizeBytes: number;
  totalSizeMB: string;
  pathStructure: string;
}

export interface StorageConstants {
  bucketName: string;
  maxFileSizeBytes: number;
  maxFileSizeMB: number;
  allowedMimeTypes: string[];
  pathStructure: string;
}
