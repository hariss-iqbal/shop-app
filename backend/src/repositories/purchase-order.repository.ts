import { SupabaseClient } from '@supabase/supabase-js';
import { PurchaseOrder, PurchaseOrderInsert, PurchaseOrderUpdate, PurchaseOrderWithRelations } from '../entities/purchase-order.entity';
import { PurchaseOrderStatus } from '../enums';

/**
 * PurchaseOrder Repository
 * Handles database operations for PurchaseOrder entity
 * Table: purchase_orders
 */
export class PurchaseOrderRepository {
  private readonly tableName = 'purchase_orders';

  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(options?: {
    supplierId?: string;
    status?: PurchaseOrderStatus;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<PurchaseOrderWithRelations[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        supplier:suppliers(id, name),
        items:purchase_order_items(id, brand, model, quantity, unit_cost, created_at)
      `);

    if (options?.supplierId) {
      query = query.eq('supplier_id', options.supplierId);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.startDate) {
      query = query.gte('order_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('order_date', options.endDate);
    }

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

  async findById(id: string): Promise<PurchaseOrderWithRelations | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        supplier:suppliers(id, name),
        items:purchase_order_items(id, brand, model, quantity, unit_cost, created_at)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByPoNumber(poNumber: string): Promise<PurchaseOrder | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('po_number', poNumber)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(purchaseOrder: PurchaseOrderInsert): Promise<PurchaseOrder> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(purchaseOrder)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, purchaseOrder: PurchaseOrderUpdate): Promise<PurchaseOrder> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(purchaseOrder)
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

  async count(status?: PurchaseOrderStatus): Promise<number> {
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

  async getNextPoNumber(): Promise<string> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('po_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return 'PO-0001';
    }

    const lastNumber = parseInt(data.po_number.replace('PO-', ''), 10);
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
    return `PO-${nextNumber}`;
  }
}
