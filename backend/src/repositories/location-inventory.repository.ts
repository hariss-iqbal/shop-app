import { SupabaseClient } from '@supabase/supabase-js';
import {
  LocationInventory,
  LocationInventoryInsert,
  LocationInventoryUpdate,
  LocationInventoryWithRelations
} from '../entities/location-inventory.entity';

/**
 * Location Inventory Repository
 * Handles database operations for LocationInventory entity
 * Table: location_inventory
 * Feature: F-024 Multi-Location Inventory Support
 */
export class LocationInventoryRepository {
  private readonly tableName = 'location_inventory';

  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(options?: {
    locationId?: string;
    phoneId?: string;
    lowStockOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<LocationInventoryWithRelations[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        phone:phones(
          id, model, status, selling_price, cost_price, condition,
          brand:brands(id, name)
        ),
        location:store_locations(id, name, code)
      `);

    if (options?.locationId) {
      query = query.eq('location_id', options.locationId);
    }
    if (options?.phoneId) {
      query = query.eq('phone_id', options.phoneId);
    }
    if (options?.lowStockOnly) {
      query = query.lte('quantity', this.supabase.rpc('coalesce', { value: 'min_stock_level', default_value: 0 }));
    }

    query = query.gt('quantity', 0);
    query = query.order('created_at', { ascending: false });

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

  async findByLocationId(locationId: string): Promise<LocationInventoryWithRelations[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        phone:phones(
          id, model, status, selling_price, cost_price, condition,
          brand:brands(id, name)
        ),
        location:store_locations(id, name, code)
      `)
      .eq('location_id', locationId)
      .gt('quantity', 0)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByPhoneId(phoneId: string): Promise<LocationInventoryWithRelations[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        phone:phones(
          id, model, status, selling_price, cost_price, condition,
          brand:brands(id, name)
        ),
        location:store_locations(id, name, code)
      `)
      .eq('phone_id', phoneId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByPhoneAndLocation(phoneId: string, locationId: string): Promise<LocationInventory | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('phone_id', phoneId)
      .eq('location_id', locationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(inventory: LocationInventoryInsert): Promise<LocationInventory> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(inventory)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async upsert(inventory: LocationInventoryInsert): Promise<LocationInventory> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .upsert(inventory, { onConflict: 'phone_id,location_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, inventory: LocationInventoryUpdate): Promise<LocationInventory> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(inventory)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateQuantity(phoneId: string, locationId: string, quantityChange: number): Promise<LocationInventory> {
    const existing = await this.findByPhoneAndLocation(phoneId, locationId);

    if (!existing) {
      if (quantityChange > 0) {
        return this.create({
          phone_id: phoneId,
          location_id: locationId,
          quantity: quantityChange
        });
      }
      throw new Error('Cannot decrease quantity for non-existent inventory record');
    }

    const newQuantity = existing.quantity + quantityChange;
    if (newQuantity < 0) {
      throw new Error('Insufficient quantity at location');
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ quantity: newQuantity })
      .eq('id', existing.id)
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

  async getLocationStats(locationId: string): Promise<{
    totalProducts: number;
    totalUnits: number;
    totalValue: number;
    lowStockCount: number;
  }> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        quantity,
        min_stock_level,
        phone:phones(selling_price)
      `)
      .eq('location_id', locationId)
      .gt('quantity', 0);

    if (error) throw error;

    const items = data || [];
    const totalProducts = items.length;
    const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce((sum, item) => {
      const price = (item.phone as { selling_price: number })?.selling_price || 0;
      return sum + (item.quantity * price);
    }, 0);
    const lowStockCount = items.filter(item =>
      item.min_stock_level !== null && item.quantity <= item.min_stock_level
    ).length;

    return { totalProducts, totalUnits, totalValue, lowStockCount };
  }

  async count(locationId?: string): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .gt('quantity', 0);

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }
}
