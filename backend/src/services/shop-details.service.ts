import { SupabaseClient } from '@supabase/supabase-js';
import { ShopDetails, ShopDetailsInsert, ShopDetailsUpdate } from '../entities/shop-details.entity';

export class ShopDetailsService {
  constructor(private supabase: SupabaseClient) {}

  async getShopDetails(): Promise<ShopDetails | null> {
    const { data, error } = await this.supabase
      .from('shop_details')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return data as ShopDetails;
  }

  async upsertShopDetails(details: ShopDetailsInsert | ShopDetailsUpdate): Promise<ShopDetails> {
    // Check if a row already exists
    const existing = await this.getShopDetails();

    if (existing) {
      const { data, error } = await this.supabase
        .from('shop_details')
        .update(details as ShopDetailsUpdate)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as ShopDetails;
    } else {
      const { data, error } = await this.supabase
        .from('shop_details')
        .insert(details as ShopDetailsInsert)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data as ShopDetails;
    }
  }
}
