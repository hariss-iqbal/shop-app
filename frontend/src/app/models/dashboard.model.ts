/**
 * Dashboard Models
 * Models for dashboard KPIs, charts, and date range filtering
 * Features: F-026, F-027, F-048
 */
export interface DashboardKPIs {
  stockCount: number;
  stockValue: number;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  potentialProfit: number;
}

export interface DateRangeFilter {
  startDate: string | null;
  endDate: string | null;
}

export interface DateRangeOption {
  label: string;
  value: string;
}

export interface StockByBrand {
  brandId: string;
  brandName: string;
  count: number;
}

export interface MonthlySalesData {
  month: string;
  count: number;
  revenue: number;
}

export interface RecentProduct {
  id: string;
  brandName: string;
  model: string;
  condition: string;
  sellingPrice: number;
  createdAt: string;
}
