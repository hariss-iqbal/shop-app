import { SupabaseClient } from '@supabase/supabase-js';
import { Sale, SaleInsert, SaleUpdate, SaleWithRelations } from '../entities/sale.entity';

/**
 * Sale Repository
 * Handles database operations for Sale entity
 * Table: sales
 */
export class SaleRepository {
  private readonly tableName = 'sales';

  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(options?: {
    startDate?: string;
    endDate?: string;
    brandId?: string;
    limit?: number;
    offset?: number;
  }): Promise<SaleWithRelations[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        phone:phones(
          id,
          model,
          brand:brands(id, name)
        )
      `);

    if (options?.startDate) {
      query = query.gte('sale_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('sale_date', options.endDate);
    }

    query = query.order('sale_date', { ascending: false });

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

  async findById(id: string): Promise<SaleWithRelations | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        phone:phones(
          id,
          model,
          brand:brands(id, name)
        )
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByPhoneId(phoneId: string): Promise<Sale | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('phone_id', phoneId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(sale: SaleInsert): Promise<Sale> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(sale)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, sale: SaleUpdate): Promise<Sale> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(sale)
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

  async count(options?: { startDate?: string; endDate?: string }): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (options?.startDate) {
      query = query.gte('sale_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('sale_date', options.endDate);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  async getTotalRevenue(options?: { startDate?: string; endDate?: string }): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('sale_price');

    if (options?.startDate) {
      query = query.gte('sale_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('sale_date', options.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.reduce((sum, s) => sum + (s.sale_price || 0), 0) || 0;
  }

  async getTotalProfit(options?: { startDate?: string; endDate?: string }): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('sale_price, cost_price');

    if (options?.startDate) {
      query = query.gte('sale_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('sale_date', options.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.reduce((sum, s) => sum + ((s.sale_price || 0) - (s.cost_price || 0)), 0) || 0;
  }

  async getSalesByMonth(year: number): Promise<{ month: number; count: number; revenue: number }[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('sale_date, sale_price')
      .gte('sale_date', `${year}-01-01`)
      .lte('sale_date', `${year}-12-31`);

    if (error) throw error;

    const monthlyData: { [key: number]: { count: number; revenue: number } } = {};
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = { count: 0, revenue: 0 };
    }

    (data || []).forEach(sale => {
      const month = new Date(sale.sale_date).getMonth() + 1;
      monthlyData[month].count++;
      monthlyData[month].revenue += sale.sale_price || 0;
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month: parseInt(month),
      count: data.count,
      revenue: data.revenue
    }));
  }
}
