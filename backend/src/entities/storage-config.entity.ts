/**
 * StorageConfig Entity
 * Represents Supabase Storage bucket configuration
 * Owner Module: M-13 Storage
 */
export interface StorageBucketConfig {
  id: string;
  name: string;
  public: boolean;
  fileSizeLimit: number;
  allowedMimeTypes: string[];
}

export interface StorageBucketPolicy {
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  role: 'anon' | 'authenticated';
  allowed: boolean;
}

export interface StorageBucketStatus {
  bucket: StorageBucketConfig;
  policies: StorageBucketPolicy[];
  fileCount: number;
  totalSizeBytes: number;
}
