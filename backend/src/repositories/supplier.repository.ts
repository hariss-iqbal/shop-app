import { SupabaseClient } from '@supabase/supabase-js';
import { Supplier, SupplierInsert, SupplierUpdate } from '../entities/supplier.entity';

/**
 * Supplier Repository
 * Handles database operations for Supplier entity
 * Table: suppliers
 */
export class SupplierRepository {
  private readonly tableName = 'suppliers';

  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(): Promise<Supplier[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async findById(id: string): Promise<Supplier | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByName(name: string): Promise<Supplier | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('name', name)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(supplier: SupplierInsert): Promise<Supplier> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(supplier)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, supplier: SupplierUpdate): Promise<Supplier> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(supplier)
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

  async hasPurchaseOrders(id: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', id);

    if (error) throw error;
    return (count || 0) > 0;
  }
}
