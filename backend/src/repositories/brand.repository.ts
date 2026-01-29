import { SupabaseClient } from '@supabase/supabase-js';
import { Brand, BrandInsert, BrandUpdate } from '../entities/brand.entity';

/**
 * Brand Repository
 * Handles database operations for Brand entity
 * Table: brands
 */
export class BrandRepository {
  private readonly tableName = 'brands';

  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(): Promise<Brand[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async findById(id: string): Promise<Brand | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByName(name: string): Promise<Brand | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('name', name)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(brand: BrandInsert): Promise<Brand> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(brand)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, brand: BrandUpdate): Promise<Brand> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(brand)
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

  async count(): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }
}
