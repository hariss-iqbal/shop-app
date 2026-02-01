import { SupabaseClient } from '@supabase/supabase-js';
import { StoreLocation, StoreLocationInsert, StoreLocationUpdate } from '../entities/store-location.entity';

/**
 * Store Location Repository
 * Handles database operations for StoreLocation entity
 * Table: store_locations
 * Feature: F-024 Multi-Location Inventory Support
 */
export class StoreLocationRepository {
  private readonly tableName = 'store_locations';

  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(options?: {
    isActive?: boolean;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }): Promise<StoreLocation[]> {
    let query = this.supabase.from(this.tableName).select('*');

    if (options?.isActive !== undefined) {
      query = query.eq('is_active', options.isActive);
    }

    const orderBy = options?.orderBy || 'name';
    const orderDirection = options?.orderDirection || 'asc';
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async findById(id: string): Promise<StoreLocation | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByCode(code: string): Promise<StoreLocation | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('code', code)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findPrimary(): Promise<StoreLocation | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('is_primary', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(location: StoreLocationInsert): Promise<StoreLocation> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(location)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, location: StoreLocationUpdate): Promise<StoreLocation> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(location)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async count(isActive?: boolean): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  async search(searchTerm: string, isActive?: boolean): Promise<StoreLocation[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    query = query.order('name', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }
}
