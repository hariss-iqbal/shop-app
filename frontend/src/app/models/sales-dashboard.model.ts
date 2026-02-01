/**
 * Sales Dashboard Models
 * Models for sales analytics and reporting dashboard
 * Feature: F-016 Sales Dashboard and Reporting
 */

export interface SalesDashboardFilter {
  startDate?: string;
  endDate?: string;
}

export interface SalesDashboardKpi {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalProfit: number;
  profitMargin: number;
  transactionCount: number;
}

export interface MonthlySalesMetric {
  month: string;
  year: number;
  revenue: number;
  count: number;
  profit: number;
  averageOrderValue: number;
}

export interface TopSellingProduct {
  phoneId: string;
  brandName: string;
  model: string;
  unitsSold: number;
  totalRevenue: number;
  totalProfit: number;
  averagePrice: number;
}

export interface SalesByBrand {
  brandId: string;
  brandName: string;
  unitsSold: number;
  totalRevenue: number;
  totalProfit: number;
  percentageOfSales: number;
}

export interface SalesByCashier {
  cashierId: string | null;
  cashierEmail: string | null;
  cashierName: string | null;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  averageOrderValue: number;
}

export interface DailySalesSummary {
  date: string;
  revenue: number;
  count: number;
  profit: number;
}

export interface SalesTrend {
  period: string;
  revenue: number;
  revenueChange: number;
  revenueChangePercent: number;
  count: number;
  countChange: number;
  countChangePercent: number;
}

export interface SalesDashboardData {
  kpis: SalesDashboardKpi;
  monthlySales: MonthlySalesMetric[];
  topProducts: TopSellingProduct[];
  salesByBrand: SalesByBrand[];
  salesByCashier: SalesByCashier[];
  dailySummary: DailySalesSummary[];
}

export interface ProductSalesReport {
  phoneId: string;
  brandName: string;
  model: string;
  condition: string;
  saleDate: string;
  salePrice: number;
  costPrice: number;
  profit: number;
  buyerName: string | null;
}

export interface ProductSalesReportResponse {
  data: ProductSalesReport[];
  total: number;
  summary: {
    totalUnits: number;
    totalRevenue: number;
    totalProfit: number;
    averagePrice: number;
  };
}
