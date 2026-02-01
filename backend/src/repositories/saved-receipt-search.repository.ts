import { SupabaseClient } from '@supabase/supabase-js';
import {
  SavedReceiptSearch,
  SavedReceiptSearchInsert,
  SavedReceiptSearchUpdate
} from '../entities/saved-receipt-search.entity';

/**
 * Saved Receipt Search Repository
 * Handles database operations for SavedReceiptSearch entity
 * Table: saved_receipt_searches
 * Feature: F-015 Multi-Criteria Receipt Search and Filtering
 */
export class SavedReceiptSearchRepository {
  private readonly tableName = 'saved_receipt_searches';

  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(): Promise<SavedReceiptSearch[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async findById(id: string): Promise<SavedReceiptSearch | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByName(name: string): Promise<SavedReceiptSearch | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('name', name)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findDefault(): Promise<SavedReceiptSearch | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(savedSearch: SavedReceiptSearchInsert): Promise<SavedReceiptSearch> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        ...savedSearch,
        filters: savedSearch.filters
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, savedSearch: SavedReceiptSearchUpdate): Promise<SavedReceiptSearch> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        ...savedSearch,
        updated_at: new Date().toISOString()
      })
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

  async clearDefault(): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq('is_default', true);

    if (error) throw error;
  }

  async count(): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }
}
