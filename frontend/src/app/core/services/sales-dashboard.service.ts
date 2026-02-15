import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  SalesDashboardFilter,
  SalesDashboardKpi,
  SalesDashboardData,
  MonthlySalesMetric,
  TopSellingProduct,
  SalesByBrand,
  SalesByCashier,
  DailySalesSummary,
  ProductSalesReportResponse
} from '../../models/sales-dashboard.model';

interface SaleRecord {
  id: string;
  product_id: string;
  sale_date: string;
  sale_price: number;
  cost_price: number;
  buyer_name: string | null;
  created_by: string | null;
}

/**
 * Sales Dashboard Service
 * Handles sales analytics and reporting data
 * Feature: F-016 Sales Dashboard and Reporting
 */
@Injectable({
  providedIn: 'root'
})
export class SalesDashboardService {
  constructor(private supabase: SupabaseService) { }

  async getKpis(filter?: SalesDashboardFilter): Promise<SalesDashboardKpi> {
    const [totalRevenue, totalProfit, transactionCount] = await Promise.all([
      this.getTotalRevenue(filter),
      this.getTotalProfit(filter),
      this.getTransactionCount(filter)
    ]);

    const averageOrderValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalSales: transactionCount,
      totalRevenue,
      averageOrderValue,
      totalProfit,
      profitMargin,
      transactionCount
    };
  }

  async getMonthlySales(filter?: SalesDashboardFilter): Promise<MonthlySalesMetric[]> {
    const sales = await this.getSalesData(filter);

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
        const [yearStr] = monthKey.split('-');
        return {
          month: monthKey,
          year: parseInt(yearStr),
          revenue: data.revenue,
          count: data.count,
          profit: data.profit,
          averageOrderValue: data.count > 0 ? data.revenue / data.count : 0
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  async getTopSellingProducts(filter?: SalesDashboardFilter, limit: number = 10): Promise<TopSellingProduct[]> {
    const sales = await this.getSalesWithProductData(filter);

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
      const brandName = sale.brandName;
      const model = sale.model;
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
      .slice(0, limit);
  }

  async getSalesByBrand(filter?: SalesDashboardFilter): Promise<SalesByBrand[]> {
    const sales = await this.getSalesWithProductData(filter);

    const totalRevenue = sales.reduce((sum, s) => sum + (s.sale_price || 0), 0);

    const brandMap = new Map<string, {
      brandId: string;
      brandName: string;
      unitsSold: number;
      totalRevenue: number;
      totalProfit: number;
    }>();

    sales.forEach(sale => {
      const brandId = sale.brandId || 'unknown';
      const brandName = sale.brandName;
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

  async getSalesByCashier(filter?: SalesDashboardFilter): Promise<SalesByCashier[]> {
    const sales = await this.getSalesData(filter);

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
          users.forEach((user: Record<string, unknown>) => {
            const userId = user['user_id'] as string;
            const entry = cashierMap.get(userId);
            if (entry) {
              entry.cashierEmail = user['email'] as string;
              entry.cashierName = user['full_name'] as string | null;
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

  async getDailySummary(filter?: SalesDashboardFilter): Promise<DailySalesSummary[]> {
    const sales = await this.getSalesData(filter);

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

  async getDashboardData(filter?: SalesDashboardFilter): Promise<SalesDashboardData> {
    const [kpis, monthlySales, topProducts, salesByBrand, salesByCashier, dailySummary] =
      await Promise.all([
        this.getKpis(filter),
        this.getMonthlySales(filter),
        this.getTopSellingProducts(filter, 10),
        this.getSalesByBrand(filter),
        this.getSalesByCashier(filter),
        this.getDailySummary(filter)
      ]);

    return {
      kpis,
      monthlySales,
      topProducts,
      salesByBrand,
      salesByCashier,
      dailySummary
    };
  }

  async getProductSalesReport(options?: {
    startDate?: string;
    endDate?: string;
    brandId?: string;
  }): Promise<ProductSalesReportResponse> {
    let sales = await this.getSalesWithProductData({
      startDate: options?.startDate,
      endDate: options?.endDate
    });

    if (options?.brandId) {
      sales = sales.filter(s => s.brandId === options.brandId);
    }

    const reportData = sales.map(sale => ({
      productId: sale.product_id,
      brandName: sale.brandName,
      model: sale.model,
      condition: sale.condition,
      saleDate: sale.sale_date,
      salePrice: sale.sale_price,
      costPrice: sale.cost_price,
      profit: (sale.sale_price || 0) - (sale.cost_price || 0),
      buyerName: sale.buyer_name
    }));

    const totalUnits = reportData.length;
    const totalRevenue = reportData.reduce((sum, s) => sum + s.salePrice, 0);
    const totalProfit = reportData.reduce((sum, s) => sum + s.profit, 0);
    const averagePrice = totalUnits > 0 ? totalRevenue / totalUnits : 0;

    return {
      data: reportData,
      total: totalUnits,
      summary: {
        totalUnits,
        totalRevenue,
        totalProfit,
        averagePrice
      }
    };
  }

  private async getSalesData(filter?: SalesDashboardFilter): Promise<SaleRecord[]> {
    let query = this.supabase
      .from('sales')
      .select('id, product_id, sale_date, sale_price, cost_price, buyer_name, created_by');

    if (filter?.startDate) {
      query = query.gte('sale_date', filter.startDate);
    }
    if (filter?.endDate) {
      query = query.lte('sale_date', filter.endDate);
    }

    const { data, error } = await query.order('sale_date', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return data || [];
  }

  private async getSalesWithProductData(filter?: SalesDashboardFilter): Promise<Array<{
    product_id: string;
    sale_date: string;
    sale_price: number;
    cost_price: number;
    buyer_name: string | null;
    brandId: string;
    brandName: string;
    model: string;
    condition: string;
  }>> {
    let query = this.supabase
      .from('sales')
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

    if (filter?.startDate) {
      query = query.gte('sale_date', filter.startDate);
    }
    if (filter?.endDate) {
      query = query.lte('sale_date', filter.endDate);
    }

    const { data, error } = await query.order('sale_date', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((sale: Record<string, unknown>) => {
      const productData = sale['product'] as Record<string, unknown> | null;
      const brandData = productData?.['brand'] as Record<string, unknown> | null;

      return {
        product_id: sale['product_id'] as string,
        sale_date: sale['sale_date'] as string,
        sale_price: sale['sale_price'] as number,
        cost_price: sale['cost_price'] as number,
        buyer_name: sale['buyer_name'] as string | null,
        brandId: brandData?.['id'] as string || 'unknown',
        brandName: brandData?.['name'] as string || 'Unknown',
        model: productData?.['model'] as string || 'Unknown',
        condition: productData?.['condition'] as string || 'Unknown'
      };
    });
  }

  private async getTotalRevenue(filter?: SalesDashboardFilter): Promise<number> {
    let query = this.supabase
      .from('sales')
      .select('sale_price');

    if (filter?.startDate) {
      query = query.gte('sale_date', filter.startDate);
    }
    if (filter?.endDate) {
      query = query.lte('sale_date', filter.endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }
    return data?.reduce((sum, s) => sum + (s.sale_price || 0), 0) || 0;
  }

  private async getTotalProfit(filter?: SalesDashboardFilter): Promise<number> {
    let query = this.supabase
      .from('sales')
      .select('sale_price, cost_price');

    if (filter?.startDate) {
      query = query.gte('sale_date', filter.startDate);
    }
    if (filter?.endDate) {
      query = query.lte('sale_date', filter.endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }
    return data?.reduce((sum, s) => sum + ((s.sale_price || 0) - (s.cost_price || 0)), 0) || 0;
  }

  private async getTransactionCount(filter?: SalesDashboardFilter): Promise<number> {
    let query = this.supabase
      .from('sales')
      .select('*', { count: 'exact', head: true });

    if (filter?.startDate) {
      query = query.gte('sale_date', filter.startDate);
    }
    if (filter?.endDate) {
      query = query.lte('sale_date', filter.endDate);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(error.message);
    }
    return count || 0;
  }
}
