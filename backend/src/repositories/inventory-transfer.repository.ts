import { SupabaseClient } from '@supabase/supabase-js';
import {
  InventoryTransfer,
  InventoryTransferInsert,
  InventoryTransferUpdate,
  InventoryTransferWithRelations,
  InventoryTransferItem,
  InventoryTransferItemInsert,
  InventoryTransferItemWithPhone
} from '../entities/inventory-transfer.entity';
import { InventoryTransferStatus } from '../enums';

/**
 * Inventory Transfer Repository
 * Handles database operations for InventoryTransfer entity
 * Table: inventory_transfers
 * Feature: F-024 Multi-Location Inventory Support
 */
export class InventoryTransferRepository {
  private readonly tableName = 'inventory_transfers';
  private readonly itemsTableName = 'inventory_transfer_items';

  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(options?: {
    sourceLocationId?: string;
    destinationLocationId?: string;
    status?: InventoryTransferStatus;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }): Promise<InventoryTransferWithRelations[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        source_location:store_locations!source_location_id(id, name, code),
        destination_location:store_locations!destination_location_id(id, name, code),
        items:inventory_transfer_items(
          id, transfer_id, phone_id, quantity, notes, created_at,
          phone:phones(id, model, condition, brand:brands(id, name))
        )
      `);

    if (options?.sourceLocationId) {
      query = query.eq('source_location_id', options.sourceLocationId);
    }
    if (options?.destinationLocationId) {
      query = query.eq('destination_location_id', options.destinationLocationId);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.dateFrom) {
      query = query.gte('initiated_at', options.dateFrom);
    }
    if (options?.dateTo) {
      query = query.lte('initiated_at', options.dateTo);
    }

    const orderBy = options?.orderBy || 'initiated_at';
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

  async findById(id: string): Promise<InventoryTransferWithRelations | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        source_location:store_locations!source_location_id(id, name, code),
        destination_location:store_locations!destination_location_id(id, name, code),
        items:inventory_transfer_items(
          id, transfer_id, phone_id, quantity, notes, created_at,
          phone:phones(id, model, condition, brand:brands(id, name))
        )
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByTransferNumber(transferNumber: string): Promise<InventoryTransferWithRelations | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        source_location:store_locations!source_location_id(id, name, code),
        destination_location:store_locations!destination_location_id(id, name, code),
        items:inventory_transfer_items(
          id, transfer_id, phone_id, quantity, notes, created_at,
          phone:phones(id, model, condition, brand:brands(id, name))
        )
      `)
      .eq('transfer_number', transferNumber)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(transfer: InventoryTransferInsert): Promise<InventoryTransfer> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(transfer)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, transfer: InventoryTransferUpdate): Promise<InventoryTransfer> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(transfer)
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

  async createItem(item: InventoryTransferItemInsert): Promise<InventoryTransferItem> {
    const { data, error } = await this.supabase
      .from(this.itemsTableName)
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createItems(items: InventoryTransferItemInsert[]): Promise<InventoryTransferItem[]> {
    const { data, error } = await this.supabase
      .from(this.itemsTableName)
      .insert(items)
      .select();

    if (error) throw error;
    return data || [];
  }

  async getItemsByTransferId(transferId: string): Promise<InventoryTransferItemWithPhone[]> {
    const { data, error } = await this.supabase
      .from(this.itemsTableName)
      .select(`
        *,
        phone:phones(id, model, condition, brand:brands(id, name))
      `)
      .eq('transfer_id', transferId);

    if (error) throw error;
    return data || [];
  }

  async count(options?: {
    status?: InventoryTransferStatus;
    sourceLocationId?: string;
    destinationLocationId?: string;
  }): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.sourceLocationId) {
      query = query.eq('source_location_id', options.sourceLocationId);
    }
    if (options?.destinationLocationId) {
      query = query.eq('destination_location_id', options.destinationLocationId);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  async generateTransferNumber(): Promise<string> {
    const { data, error } = await this.supabase.rpc('generate_transfer_number');

    if (error) throw error;
    return data as string;
  }
}
