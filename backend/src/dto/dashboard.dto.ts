/**
 * Dashboard DTOs
 * Data Transfer Objects for Dashboard KPI cards and charts
 * Module: M-09 Dashboard
 * Features: F-026 Admin Dashboard with KPI Cards, F-027 Dashboard Charts, F-048 Dashboard Date Range Selector
 */

export interface DateRangeFilterDto {
  startDate: string | null;
  endDate: string | null;
}

export interface DashboardKpiDto {
  stockCount: number;
  stockValue: number;
  potentialProfit: number;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface MonthlySalesDataDto {
  month: string;
  count: number;
  revenue: number;
}

export interface StockByBrandDto {
  brandId: string;
  brandName: string;
  count: number;
}

export interface RecentPhoneDto {
  id: string;
  brandName: string;
  model: string;
  condition: string;
  sellingPrice: number;
  createdAt: string;
}
