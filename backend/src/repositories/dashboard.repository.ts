import { SupabaseClient } from '@supabase/supabase-js';
import { ProductStatus } from '../enums';
import { DateRangeFilterDto, RecentProductDto } from '../dto/dashboard.dto';

/**
 * Dashboard Repository
 * Handles aggregate database queries for dashboard KPI cards and charts
 * Module: M-09 Dashboard
 * Features: F-026 Admin Dashboard with KPI Cards, F-027 Dashboard Charts, F-048 Dashboard Date Range Selector
 */
export class DashboardRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getAvailableStockCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', ProductStatus.AVAILABLE);

    if (error) throw error;
    return count || 0;
  }

  async getStockValue(): Promise<number> {
    const { data, error } = await this.supabase
      .from('products')
      .select('cost_price')
      .eq('status', ProductStatus.AVAILABLE);

    if (error) throw error;
    return data?.reduce((sum, p) => sum + (p.cost_price || 0), 0) || 0;
  }

  async getPotentialProfit(): Promise<number> {
    const { data, error } = await this.supabase
      .from('products')
      .select('selling_price, cost_price')
      .eq('status', ProductStatus.AVAILABLE);

    if (error) throw error;
    return data?.reduce(
      (sum, p) => sum + ((p.selling_price || 0) - (p.cost_price || 0)),
      0
    ) || 0;
  }

  async getTotalSalesCount(dateRange?: DateRangeFilterDto): Promise<number> {
    let query = this.supabase
      .from('sales')
      .select('*', { count: 'exact', head: true });

    if (dateRange?.startDate) {
      query = query.gte('sale_date', dateRange.startDate);
    }
    if (dateRange?.endDate) {
      query = query.lte('sale_date', dateRange.endDate);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }

  async getTotalRevenue(dateRange?: DateRangeFilterDto): Promise<number> {
    let query = this.supabase
      .from('sales')
      .select('sale_price');

    if (dateRange?.startDate) {
      query = query.gte('sale_date', dateRange.startDate);
    }
    if (dateRange?.endDate) {
      query = query.lte('sale_date', dateRange.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data?.reduce((sum, s) => sum + (s.sale_price || 0), 0) || 0;
  }

  async getTotalProfit(dateRange?: DateRangeFilterDto): Promise<number> {
    let query = this.supabase
      .from('sales')
      .select('sale_price, cost_price');

    if (dateRange?.startDate) {
      query = query.gte('sale_date', dateRange.startDate);
    }
    if (dateRange?.endDate) {
      query = query.lte('sale_date', dateRange.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data?.reduce(
      (sum, s) => sum + ((s.sale_price || 0) - (s.cost_price || 0)),
      0
    ) || 0;
  }

  async getSalesByDateRange(dateRange?: DateRangeFilterDto): Promise<{ month: string; count: number; revenue: number }[]> {
    let query = this.supabase
      .from('sales')
      .select('sale_date, sale_price');

    if (dateRange?.startDate) {
      query = query.gte('sale_date', dateRange.startDate);
    }
    if (dateRange?.endDate) {
      query = query.lte('sale_date', dateRange.endDate);
    }

    query = query.order('sale_date', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    const monthlyData = new Map<string, { count: number; revenue: number }>();

    (data || []).forEach(sale => {
      const date = new Date(sale.sale_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (monthlyData.has(key)) {
        const entry = monthlyData.get(key)!;
        entry.count++;
        entry.revenue += sale.sale_price || 0;
      } else {
        monthlyData.set(key, { count: 1, revenue: sale.sale_price || 0 });
      }
    });

    return Array.from(monthlyData.entries()).map(([month, d]) => ({
      month,
      count: d.count,
      revenue: d.revenue,
    }));
  }

  async getStockByBrand(): Promise<{ brandId: string; brandName: string; count: number }[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('brand_id, brand:brands(id, name)')
      .eq('status', ProductStatus.AVAILABLE);

    if (error) throw error;

    const brandMap = new Map<string, { brandName: string; count: number }>();

    (data || []).forEach(product => {
      const brand = product.brand as { id: string; name: string } | null;
      const brandId = product.brand_id as string;
      const brandName = brand?.name || 'Unknown';

      if (brandMap.has(brandId)) {
        brandMap.get(brandId)!.count++;
      } else {
        brandMap.set(brandId, { brandName, count: 1 });
      }
    });

    return Array.from(brandMap.entries())
      .map(([brandId, { brandName, count }]) => ({ brandId, brandName, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getRecentlyAddedProducts(limit: number = 5): Promise<RecentProductDto[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('id, model, condition, selling_price, created_at, brand:brands(name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(product => {
      const brand = product.brand as { name: string } | null;
      return {
        id: product.id as string,
        brandName: brand?.name || 'Unknown',
        model: product.model as string,
        condition: product.condition as string,
        sellingPrice: product.selling_price as number,
        createdAt: product.created_at as string,
      };
    });
  }
}
