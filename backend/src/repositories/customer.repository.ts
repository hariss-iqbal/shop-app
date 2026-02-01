import { SupabaseClient } from '@supabase/supabase-js';
import {
  Customer,
  CustomerInsert,
  CustomerUpdate,
  CustomerWithStats,
  CustomerPurchaseHistory,
  FindOrCreateCustomerResult
} from '../entities/customer.entity';

/**
 * Customer Repository
 * Handles database operations for Customer entity
 * Table: customers
 * Feature: F-019 Customer Contact Management
 */
export class CustomerRepository {
  private readonly tableName = 'customers';

  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(options?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<CustomerWithStats[]> {
    // First get customers
    let query = this.supabase
      .from(this.tableName)
      .select('*');

    if (options?.search) {
      query = query.or(`phone.ilike.%${options.search}%,name.ilike.%${options.search}%`);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data: customers, error } = await query;

    if (error) throw error;

    // Get stats for each customer
    const customersWithStats: CustomerWithStats[] = [];
    for (const customer of customers || []) {
      const { data: statsData } = await this.supabase
        .from('sales')
        .select('sale_price, sale_date')
        .eq('customer_id', customer.id);

      const sales = statsData || [];
      const totalTransactions = sales.length;
      const totalSpent = sales.reduce((sum, s) => sum + (s.sale_price || 0), 0);
      const lastPurchaseDate = sales.length > 0
        ? sales.sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())[0].sale_date
        : null;

      customersWithStats.push({
        ...customer,
        totalTransactions,
        totalSpent,
        lastPurchaseDate
      });
    }

    return customersWithStats;
  }

  async findById(id: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    // Clean phone number for search
    const cleanedPhone = phone.replace(/[^\d+]/g, '');

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .ilike('phone', `%${cleanedPhone}%`)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(customer: CustomerInsert): Promise<Customer> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(customer)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, customer: CustomerUpdate): Promise<Customer> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(customer)
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

  async count(options?: { search?: string }): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (options?.search) {
      query = query.or(`phone.ilike.%${options.search}%,name.ilike.%${options.search}%`);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  /**
   * Find or create a customer by phone number
   * Uses the database RPC function for atomicity
   */
  async findOrCreate(
    phone: string,
    name?: string | null,
    email?: string | null,
    notes?: string | null
  ): Promise<FindOrCreateCustomerResult> {
    const { data, error } = await this.supabase.rpc('find_or_create_customer', {
      p_phone: phone,
      p_name: name || null,
      p_email: email || null,
      p_notes: notes || null
    });

    if (error) throw error;

    return {
      found: data.found,
      customer: data.customer,
      isNew: data.isNew
    };
  }

  /**
   * Get customer purchase history including all sales
   */
  async getCustomerPurchaseHistory(customerId: string): Promise<CustomerPurchaseHistory> {
    const { data, error } = await this.supabase.rpc('get_customer_purchase_history', {
      p_customer_id: customerId
    });

    if (error) throw error;

    return {
      found: data.found,
      customer: data.customer,
      sales: data.sales || [],
      stats: data.stats || {
        totalTransactions: 0,
        totalSpent: 0,
        lastPurchaseDate: null
      }
    };
  }

  /**
   * Link existing sales to a customer by matching phone number
   * Returns the number of sales linked
   */
  async linkSalesToCustomer(customerId: string, phone: string): Promise<number> {
    const { data, error } = await this.supabase.rpc('link_sales_to_customer', {
      p_customer_id: customerId,
      p_phone: phone
    });

    if (error) throw error;
    return data || 0;
  }

  /**
   * Check if a phone number exists in the customers table
   */
  async phoneExists(phone: string, excludeId?: string): Promise<boolean> {
    const cleanedPhone = phone.replace(/[^\d+]/g, '');

    let query = this.supabase
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('phone', cleanedPhone);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { count, error } = await query;

    if (error) throw error;
    return (count || 0) > 0;
  }
}
