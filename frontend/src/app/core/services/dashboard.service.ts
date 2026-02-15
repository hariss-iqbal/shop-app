import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DashboardKPIs, DateRangeFilter, MonthlySalesData, RecentProduct, StockByBrand } from '../../models/dashboard.model';
import { ProductStatus } from '../../enums';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private supabase: SupabaseService) { }

  async getKpis(dateRange?: DateRangeFilter): Promise<DashboardKPIs> {
    const [stockCount, stockValue, potentialProfit, totalSales, totalRevenue, totalProfit] =
      await Promise.all([
        this.getAvailableStockCount(),
        this.getStockValue(),
        this.getPotentialProfit(),
        this.getTotalSalesCount(dateRange),
        this.getTotalRevenue(dateRange),
        this.getTotalProfit(dateRange),
      ]);

    return {
      stockCount,
      stockValue,
      potentialProfit,
      totalSales,
      totalRevenue,
      totalProfit,
    };
  }

  async getSalesByDateRange(dateRange?: DateRangeFilter): Promise<MonthlySalesData[]> {
    let query = this.supabase
      .from('sales')
      .select('sale_date, sale_price');

    if (dateRange?.startDate) {
      query = query.gte('sale_date', dateRange.startDate);
    }
    if (dateRange?.endDate) {
      query = query.lte('sale_date', dateRange.endDate);
    }

    const { data, error } = await query.order('sale_date', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

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

  async getStockByBrand(): Promise<StockByBrand[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('brand_id, brand:brands(id, name)')
      .eq('status', ProductStatus.AVAILABLE);

    if (error) {
      throw new Error(error.message);
    }

    const brandMap = new Map<string, { brandName: string; count: number }>();

    (data || []).forEach(product => {
      const brand = product.brand as unknown as { id: string; name: string } | null;
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

  async getRecentlyAddedProducts(): Promise<RecentProduct[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('id, model, condition, selling_price, created_at, brand:brands(name)')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(product => {
      const brand = product.brand as unknown as { name: string } | null;
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

  private async getAvailableStockCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', ProductStatus.AVAILABLE);

    if (error) {
      throw new Error(error.message);
    }
    return count || 0;
  }

  private async getStockValue(): Promise<number> {
    const { data, error } = await this.supabase
      .from('products')
      .select('cost_price')
      .eq('status', ProductStatus.AVAILABLE);

    if (error) {
      throw new Error(error.message);
    }
    return data?.reduce((sum, p) => sum + (p.cost_price || 0), 0) || 0;
  }

  private async getPotentialProfit(): Promise<number> {
    const { data, error } = await this.supabase
      .from('products')
      .select('selling_price, cost_price')
      .eq('status', ProductStatus.AVAILABLE);

    if (error) {
      throw new Error(error.message);
    }
    return data?.reduce(
      (sum, p) => sum + ((p.selling_price || 0) - (p.cost_price || 0)),
      0
    ) || 0;
  }

  private async getTotalSalesCount(dateRange?: DateRangeFilter): Promise<number> {
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
    if (error) {
      throw new Error(error.message);
    }
    return count || 0;
  }

  private async getTotalRevenue(dateRange?: DateRangeFilter): Promise<number> {
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
    if (error) {
      throw new Error(error.message);
    }
    return data?.reduce((sum, s) => sum + (s.sale_price || 0), 0) || 0;
  }

  private async getTotalProfit(dateRange?: DateRangeFilter): Promise<number> {
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
    if (error) {
      throw new Error(error.message);
    }
    return data?.reduce(
      (sum, s) => sum + ((s.sale_price || 0) - (s.cost_price || 0)),
      0
    ) || 0;
  }
}
