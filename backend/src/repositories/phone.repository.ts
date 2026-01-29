import { SupabaseClient } from '@supabase/supabase-js';
import { Phone, PhoneInsert, PhoneUpdate, PhoneWithRelations } from '../entities/phone.entity';
import { PhoneStatus } from '../enums';

/**
 * Phone Repository
 * Handles database operations for Phone entity
 * Table: phones
 */
export class PhoneRepository {
  private readonly tableName = 'phones';

  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(options?: {
    status?: PhoneStatus;
    brandId?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }): Promise<PhoneWithRelations[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        brand:brands(id, name, logo_url),
        supplier:suppliers(id, name),
        images:phone_images(id, image_url, is_primary, display_order)
      `);

    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.brandId) {
      query = query.eq('brand_id', options.brandId);
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

  async findById(id: string): Promise<PhoneWithRelations | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        brand:brands(id, name, logo_url),
        supplier:suppliers(id, name),
        images:phone_images(id, image_url, is_primary, display_order)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByImei(imei: string): Promise<Phone | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('imei', imei)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(phone: PhoneInsert): Promise<Phone> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(phone)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createMany(phones: PhoneInsert[]): Promise<Phone[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(phones)
      .select();

    if (error) throw error;
    return data || [];
  }

  async update(id: string, phone: PhoneUpdate): Promise<Phone> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(phone)
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

  async count(status?: PhoneStatus): Promise<number> {
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

  async countByBrand(brandId: string, status?: PhoneStatus): Promise<number> {
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

  async getStockValue(status?: PhoneStatus): Promise<number> {
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

  async getRecentPhones(limit: number = 5): Promise<PhoneWithRelations[]> {
    return this.findAll({
      status: PhoneStatus.AVAILABLE,
      limit,
      orderBy: 'created_at',
      orderDirection: 'desc'
    });
  }

  async findAllForExport(options?: {
    status?: PhoneStatus;
    brandId?: string;
    search?: string;
  }): Promise<PhoneWithRelations[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        brand:brands(id, name, logo_url),
        supplier:suppliers(id, name),
        images:phone_images(id, image_url, is_primary, display_order)
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
      results = results.filter((phone: PhoneWithRelations) =>
        phone.model.toLowerCase().includes(searchTerm) ||
        (phone.brand?.name || '').toLowerCase().includes(searchTerm)
      );
    }

    return results;
  }
}
