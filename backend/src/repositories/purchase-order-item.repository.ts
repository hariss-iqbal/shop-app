import { SupabaseClient } from '@supabase/supabase-js';
import { PurchaseOrderItem, PurchaseOrderItemInsert, PurchaseOrderItemUpdate } from '../entities/purchase-order-item.entity';

/**
 * PurchaseOrderItem Repository
 * Handles database operations for PurchaseOrderItem entity
 * Table: purchase_order_items
 */
export class PurchaseOrderItemRepository {
  private readonly tableName = 'purchase_order_items';

  constructor(private readonly supabase: SupabaseClient) {}

  async findByPurchaseOrderId(purchaseOrderId: string): Promise<PurchaseOrderItem[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async findById(id: string): Promise<PurchaseOrderItem | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(item: PurchaseOrderItemInsert): Promise<PurchaseOrderItem> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createMany(items: PurchaseOrderItemInsert[]): Promise<PurchaseOrderItem[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(items)
      .select();

    if (error) throw error;
    return data || [];
  }

  async update(id: string, item: PurchaseOrderItemUpdate): Promise<PurchaseOrderItem> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(item)
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

  async deleteByPurchaseOrderId(purchaseOrderId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('purchase_order_id', purchaseOrderId);

    if (error) throw error;
  }

  async countByPurchaseOrderId(purchaseOrderId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('purchase_order_id', purchaseOrderId);

    if (error) throw error;
    return count || 0;
  }

  async getTotalQuantityByPurchaseOrderId(purchaseOrderId: string): Promise<number> {
    const items = await this.findByPurchaseOrderId(purchaseOrderId);
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
