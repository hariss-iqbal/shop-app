import { SupabaseClient } from '@supabase/supabase-js';

/**
 * StorageConfig Repository
 * Handles Supabase Storage bucket queries
 * Owner Module: M-13 Storage
 */
export class StorageConfigRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getBucketById(bucketId: string) {
    const { data, error } = await this.supabase.storage.getBucket(bucketId);
    if (error) throw error;
    return data;
  }

  async listFiles(bucketId: string, path?: string): Promise<{ name: string; metadata: Record<string, unknown> }[]> {
    const { data, error } = await this.supabase.storage
      .from(bucketId)
      .list(path || '', { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) throw error;
    return data || [];
  }
}
