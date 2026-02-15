import { DashboardRepository } from '../repositories/dashboard.repository';
import { DateRangeFilterDto, DashboardKpiDto, MonthlySalesDataDto, RecentProductDto, StockByBrandDto } from '../dto/dashboard.dto';

/**
 * Dashboard Service
 * Business logic for dashboard KPI aggregation and chart data
 * Owner Module: M-09 Dashboard
 * Features: F-026 Admin Dashboard with KPI Cards, F-027 Dashboard Charts, F-048 Dashboard Date Range Selector
 */
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getKpis(dateRange?: DateRangeFilterDto): Promise<DashboardKpiDto> {
    const [stockCount, stockValue, potentialProfit, totalSales, totalRevenue, totalProfit] =
      await Promise.all([
        this.dashboardRepository.getAvailableStockCount(),
        this.dashboardRepository.getStockValue(),
        this.dashboardRepository.getPotentialProfit(),
        this.dashboardRepository.getTotalSalesCount(dateRange),
        this.dashboardRepository.getTotalRevenue(dateRange),
        this.dashboardRepository.getTotalProfit(dateRange),
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

  async getSalesByDateRange(dateRange?: DateRangeFilterDto): Promise<MonthlySalesDataDto[]> {
    return this.dashboardRepository.getSalesByDateRange(dateRange);
  }

  async getStockByBrand(): Promise<StockByBrandDto[]> {
    return this.dashboardRepository.getStockByBrand();
  }

  async getRecentlyAddedProducts(): Promise<RecentProductDto[]> {
    return this.dashboardRepository.getRecentlyAddedProducts(5);
  }
}
