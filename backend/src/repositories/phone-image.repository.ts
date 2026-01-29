import { SupabaseClient } from '@supabase/supabase-js';
import { PhoneImage, PhoneImageInsert, PhoneImageUpdate } from '../entities/phone-image.entity';

/**
 * PhoneImage Repository
 * Handles database operations for PhoneImage entity
 * Table: phone_images
 */
export class PhoneImageRepository {
  private readonly tableName = 'phone_images';

  constructor(private readonly supabase: SupabaseClient) {}

  async findByPhoneId(phoneId: string): Promise<PhoneImage[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('phone_id', phoneId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async findById(id: string): Promise<PhoneImage | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findPrimaryByPhoneId(phoneId: string): Promise<PhoneImage | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('phone_id', phoneId)
      .eq('is_primary', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(image: PhoneImageInsert): Promise<PhoneImage> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(image)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, image: PhoneImageUpdate): Promise<PhoneImage> {
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

  async deleteByPhoneId(phoneId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('phone_id', phoneId);

    if (error) throw error;
  }

  async clearPrimaryByPhoneId(phoneId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({ is_primary: false })
      .eq('phone_id', phoneId)
      .eq('is_primary', true);

    if (error) throw error;
  }

  async countByPhoneId(phoneId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('phone_id', phoneId);

    if (error) throw error;
    return count || 0;
  }

  async getMaxDisplayOrder(phoneId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('display_order')
      .eq('phone_id', phoneId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.display_order || 0;
  }
}
