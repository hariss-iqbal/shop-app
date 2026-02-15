/**
 * Sales Dashboard DTOs
 * Data Transfer Objects for Sales Dashboard and Reporting
 * Feature: F-016 Sales Dashboard and Reporting
 */

export interface SalesDashboardFilterDto {
  startDate?: string;
  endDate?: string;
}

export interface SalesDashboardKpiDto {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalProfit: number;
  profitMargin: number;
  transactionCount: number;
}

export interface MonthlySalesMetricDto {
  month: string;
  year: number;
  revenue: number;
  count: number;
  profit: number;
  averageOrderValue: number;
}

export interface TopSellingProductDto {
  productId: string;
  brandName: string;
  model: string;
  unitsSold: number;
  totalRevenue: number;
  totalProfit: number;
  averagePrice: number;
}

export interface SalesByBrandDto {
  brandId: string;
  brandName: string;
  unitsSold: number;
  totalRevenue: number;
  totalProfit: number;
  percentageOfSales: number;
}

export interface SalesByCashierDto {
  cashierId: string | null;
  cashierEmail: string | null;
  cashierName: string | null;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  averageOrderValue: number;
}

export interface DailySalesSummaryDto {
  date: string;
  revenue: number;
  count: number;
  profit: number;
}

export interface SalesTrendDto {
  period: string;
  revenue: number;
  revenueChange: number;
  revenueChangePercent: number;
  count: number;
  countChange: number;
  countChangePercent: number;
}

export interface SalesDashboardResponseDto {
  kpis: SalesDashboardKpiDto;
  monthlySales: MonthlySalesMetricDto[];
  topProducts: TopSellingProductDto[];
  salesByBrand: SalesByBrandDto[];
  salesByCashier: SalesByCashierDto[];
  dailySummary: DailySalesSummaryDto[];
}

export interface ProductSalesReportDto {
  productId: string;
  brandName: string;
  model: string;
  condition: string;
  saleDate: string;
  salePrice: number;
  costPrice: number;
  profit: number;
  buyerName: string | null;
}

export interface ProductSalesReportResponseDto {
  data: ProductSalesReportDto[];
  total: number;
  summary: {
    totalUnits: number;
    totalRevenue: number;
    totalProfit: number;
    averagePrice: number;
  };
}
