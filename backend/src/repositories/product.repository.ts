import { SupabaseClient } from '@supabase/supabase-js';
import { Product, ProductInsert, ProductUpdate, ProductWithRelations } from '../entities/product.entity';
import { ProductStatus } from '../enums';

/**
 * Product Repository
 * Handles database operations for Product entity
 * Table: products
 */
export class ProductRepository {
  private readonly tableName = 'products';

  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(options?: {
    status?: ProductStatus;
    brandId?: string;
    productType?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }): Promise<ProductWithRelations[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        brand:brands(id, name, logo_url),
        supplier:suppliers(id, name),
        images:product_images(id, image_url, is_primary, display_order)
      `);

    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.brandId) {
      query = query.eq('brand_id', options.brandId);
    }
    if (options?.productType) {
      query = query.eq('product_type', options.productType);
    }

    const orderBy = options?.orderBy || 'created_at';
    const orderDirection = options?.orderDirection || 'desc';
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

  async findById(id: string): Promise<ProductWithRelations | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        brand:brands(id, name, logo_url),
        supplier:suppliers(id, name),
        images:product_images(id, image_url, is_primary, display_order)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByImei(imei: string): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('imei', imei)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(product: ProductInsert): Promise<Product> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createMany(products: ProductInsert[]): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(products)
      .select();

    if (error) throw error;
    return data || [];
  }

  async update(id: string, product: ProductUpdate): Promise<Product> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(product)
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

  async count(status?: ProductStatus): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  async countByBrand(brandId: string, status?: ProductStatus): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId);

    if (status) {
      query = query.eq('status', status);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  async getStockValue(status?: ProductStatus): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('selling_price');

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.reduce((sum, p) => sum + (p.selling_price || 0), 0) || 0;
  }

  async getRecentProducts(limit: number = 5): Promise<ProductWithRelations[]> {
    return this.findAll({
      status: ProductStatus.AVAILABLE,
      limit,
      orderBy: 'created_at',
      orderDirection: 'desc'
    });
  }

  async findAllForExport(options?: {
    status?: ProductStatus;
    brandId?: string;
    search?: string;
  }): Promise<ProductWithRelations[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        brand:brands(id, name, logo_url),
        supplier:suppliers(id, name),
        images:product_images(id, image_url, is_primary, display_order)
      `);

    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.brandId) {
      query = query.eq('brand_id', options.brandId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    let results = data || [];

    if (options?.search) {
      const searchTerm = options.search.toLowerCase();
      results = results.filter((product: ProductWithRelations) =>
        product.model.toLowerCase().includes(searchTerm) ||
        (product.brand?.name || '').toLowerCase().includes(searchTerm)
      );
    }

    return results;
  }
}
