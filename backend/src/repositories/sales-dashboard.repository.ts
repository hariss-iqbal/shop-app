import { SupabaseClient } from '@supabase/supabase-js';
import {
  MonthlySalesMetricDto,
  TopSellingProductDto,
  SalesByBrandDto,
  SalesByCashierDto,
  DailySalesSummaryDto,
  ProductSalesReportDto
} from '../dto/sales-dashboard.dto';

interface SaleRecord {
  id: string;
  product_id: string;
  sale_date: string;
  sale_price: number;
  cost_price: number;
  buyer_name: string | null;
  created_by: string | null;
}

interface SaleWithProduct {
  id: string;
  product_id: string;
  sale_date: string;
  sale_price: number;
  cost_price: number;
  buyer_name: string | null;
  created_by: string | null;
  product: {
    id: string;
    model: string;
    condition: string;
    brand: {
      id: string;
      name: string;
    } | null;
  } | null;
}

interface UserProfile {
  id: string;
  email: string;
  raw_user_meta_data?: {
    full_name?: string;
  };
}

/**
 * Sales Dashboard Repository
 * Handles database operations for sales analytics and reporting
 * Feature: F-016 Sales Dashboard and Reporting
 */
export class SalesDashboardRepository {
  private readonly tableName = 'sales';

  constructor(private readonly supabase: SupabaseClient) {}

  async getSalesData(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<SaleRecord[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('id, product_id, sale_date, sale_price, cost_price, buyer_name, created_by');

    if (options?.startDate) {
      query = query.gte('sale_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('sale_date', options.endDate);
    }

    const { data, error } = await query.order('sale_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getSalesWithProductData(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<SaleWithProduct[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        id,
        product_id,
        sale_date,
        sale_price,
        cost_price,
        buyer_name,
        created_by,
        product:products(
          id,
          model,
          condition,
          brand:brands(id, name)
        )
      `);

    if (options?.startDate) {
      query = query.gte('sale_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('sale_date', options.endDate);
    }

    const { data, error } = await query.order('sale_date', { ascending: false });

    if (error) throw error;
    return (data || []) as SaleWithProduct[];
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

  async getTransactionCount(options?: { startDate?: string; endDate?: string }): Promise<number> {
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

  async getMonthlySalesMetrics(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<MonthlySalesMetricDto[]> {
    const sales = await this.getSalesData(options);

    const monthlyData = new Map<string, { revenue: number; count: number; profit: number }>();

    sales.forEach(sale => {
      const date = new Date(sale.sale_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const profit = (sale.sale_price || 0) - (sale.cost_price || 0);

      if (monthlyData.has(key)) {
        const entry = monthlyData.get(key)!;
        entry.revenue += sale.sale_price || 0;
        entry.count++;
        entry.profit += profit;
      } else {
        monthlyData.set(key, {
          revenue: sale.sale_price || 0,
          count: 1,
          profit
        });
      }
    });

    return Array.from(monthlyData.entries())
      .map(([monthKey, data]) => {
        const [year, month] = monthKey.split('-');
        return {
          month: monthKey,
          year: parseInt(year),
          revenue: data.revenue,
          count: data.count,
          profit: data.profit,
          averageOrderValue: data.count > 0 ? data.revenue / data.count : 0
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  async getTopSellingProducts(options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<TopSellingProductDto[]> {
    const sales = await this.getSalesWithProductData(options);

    const productMap = new Map<string, {
      productId: string;
      brandName: string;
      model: string;
      unitsSold: number;
      totalRevenue: number;
      totalProfit: number;
    }>();

    sales.forEach(sale => {
      const productId = sale.product_id;
      const product = sale.product;
      const brandName = product?.brand?.name || 'Unknown';
      const model = product?.model || 'Unknown';
      const profit = (sale.sale_price || 0) - (sale.cost_price || 0);

      const key = `${brandName}-${model}`;

      if (productMap.has(key)) {
        const entry = productMap.get(key)!;
        entry.unitsSold++;
        entry.totalRevenue += sale.sale_price || 0;
        entry.totalProfit += profit;
      } else {
        productMap.set(key, {
          productId,
          brandName,
          model,
          unitsSold: 1,
          totalRevenue: sale.sale_price || 0,
          totalProfit: profit
        });
      }
    });

    return Array.from(productMap.values())
      .map(p => ({
        ...p,
        averagePrice: p.unitsSold > 0 ? p.totalRevenue / p.unitsSold : 0
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, options?.limit || 10);
  }

  async getSalesByBrand(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<SalesByBrandDto[]> {
    const sales = await this.getSalesWithProductData(options);

    const totalRevenue = sales.reduce((sum, s) => sum + (s.sale_price || 0), 0);

    const brandMap = new Map<string, {
      brandId: string;
      brandName: string;
      unitsSold: number;
      totalRevenue: number;
      totalProfit: number;
    }>();

    sales.forEach(sale => {
      const product = sale.product;
      const brandId = product?.brand?.id || 'unknown';
      const brandName = product?.brand?.name || 'Unknown';
      const profit = (sale.sale_price || 0) - (sale.cost_price || 0);

      if (brandMap.has(brandId)) {
        const entry = brandMap.get(brandId)!;
        entry.unitsSold++;
        entry.totalRevenue += sale.sale_price || 0;
        entry.totalProfit += profit;
      } else {
        brandMap.set(brandId, {
          brandId,
          brandName,
          unitsSold: 1,
          totalRevenue: sale.sale_price || 0,
          totalProfit: profit
        });
      }
    });

    return Array.from(brandMap.values())
      .map(b => ({
        ...b,
        percentageOfSales: totalRevenue > 0 ? (b.totalRevenue / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  async getSalesByCashier(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<SalesByCashierDto[]> {
    const sales = await this.getSalesData(options);

    const cashierMap = new Map<string, {
      cashierId: string | null;
      cashierEmail: string | null;
      cashierName: string | null;
      totalSales: number;
      totalRevenue: number;
      totalProfit: number;
    }>();

    sales.forEach(sale => {
      const cashierId = sale.created_by || 'unknown';
      const profit = (sale.sale_price || 0) - (sale.cost_price || 0);

      if (cashierMap.has(cashierId)) {
        const entry = cashierMap.get(cashierId)!;
        entry.totalSales++;
        entry.totalRevenue += sale.sale_price || 0;
        entry.totalProfit += profit;
      } else {
        cashierMap.set(cashierId, {
          cashierId: sale.created_by,
          cashierEmail: null,
          cashierName: null,
          totalSales: 1,
          totalRevenue: sale.sale_price || 0,
          totalProfit: profit
        });
      }
    });

    const cashierIds = Array.from(cashierMap.keys()).filter(id => id !== 'unknown');

    if (cashierIds.length > 0) {
      try {
        const { data: users } = await this.supabase
          .from('user_roles')
          .select('user_id, email, full_name')
          .in('user_id', cashierIds);

        if (users) {
          users.forEach((user: { user_id: string; email: string; full_name: string | null }) => {
            const entry = cashierMap.get(user.user_id);
            if (entry) {
              entry.cashierEmail = user.email;
              entry.cashierName = user.full_name;
            }
          });
        }
      } catch {
        // If user_roles table doesn't exist, continue without cashier names
      }
    }

    return Array.from(cashierMap.values())
      .map(c => ({
        ...c,
        averageOrderValue: c.totalSales > 0 ? c.totalRevenue / c.totalSales : 0
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  async getDailySalesSummary(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<DailySalesSummaryDto[]> {
    const sales = await this.getSalesData(options);

    const dailyMap = new Map<string, { revenue: number; count: number; profit: number }>();

    sales.forEach(sale => {
      const date = sale.sale_date;
      const profit = (sale.sale_price || 0) - (sale.cost_price || 0);

      if (dailyMap.has(date)) {
        const entry = dailyMap.get(date)!;
        entry.revenue += sale.sale_price || 0;
        entry.count++;
        entry.profit += profit;
      } else {
        dailyMap.set(date, {
          revenue: sale.sale_price || 0,
          count: 1,
          profit
        });
      }
    });

    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        count: data.count,
        profit: data.profit
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getProductSalesReport(options?: {
    startDate?: string;
    endDate?: string;
    brandId?: string;
  }): Promise<ProductSalesReportDto[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        id,
        product_id,
        sale_date,
        sale_price,
        cost_price,
        buyer_name,
        product:products(
          id,
          model,
          condition,
          brand_id,
          brand:brands(id, name)
        )
      `);

    if (options?.startDate) {
      query = query.gte('sale_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('sale_date', options.endDate);
    }

    const { data, error } = await query.order('sale_date', { ascending: false });

    if (error) throw error;

    let sales = (data || []) as SaleWithProduct[];

    if (options?.brandId) {
      sales = sales.filter(s => s.product?.brand?.id === options.brandId);
    }

    return sales.map(sale => ({
      productId: sale.product_id,
      brandName: sale.product?.brand?.name || 'Unknown',
      model: sale.product?.model || 'Unknown',
      condition: sale.product?.condition || 'Unknown',
      saleDate: sale.sale_date,
      salePrice: sale.sale_price,
      costPrice: sale.cost_price,
      profit: (sale.sale_price || 0) - (sale.cost_price || 0),
      buyerName: sale.buyer_name
    }));
  }
}
