import { SupabaseClient } from '@supabase/supabase-js';
import { ProductImage, ProductImageInsert, ProductImageUpdate } from '../entities/product-image.entity';

/**
 * ProductImage Repository
 * Handles database operations for ProductImage entity
 * Table: product_images
 */
export class ProductImageRepository {
  private readonly tableName = 'product_images';

  constructor(private readonly supabase: SupabaseClient) {}

  async findByProductId(productId: string): Promise<ProductImage[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async findById(id: string): Promise<ProductImage | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findPrimaryByProductId(productId: string): Promise<ProductImage | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('product_id', productId)
      .eq('is_primary', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(image: ProductImageInsert): Promise<ProductImage> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(image)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, image: ProductImageUpdate): Promise<ProductImage> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(image)
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

  async deleteByProductId(productId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('product_id', productId);

    if (error) throw error;
  }

  async clearPrimaryByProductId(productId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({ is_primary: false })
      .eq('product_id', productId)
      .eq('is_primary', true);

    if (error) throw error;
  }

  async countByProductId(productId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId);

    if (error) throw error;
    return count || 0;
  }

  async getMaxDisplayOrder(productId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('display_order')
      .eq('product_id', productId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.display_order || 0;
  }
}
