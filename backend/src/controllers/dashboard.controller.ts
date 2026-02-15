import { DashboardService } from '../services/dashboard.service';
import { DateRangeFilterDto, DashboardKpiDto, MonthlySalesDataDto, RecentProductDto, StockByBrandDto } from '../dto/dashboard.dto';

/**
 * Dashboard Controller
 * HTTP request handling for dashboard KPI data and chart data
 * Routes: /api/dashboard
 * Module: M-09 Dashboard
 * Features: F-026 Admin Dashboard with KPI Cards, F-027 Dashboard Charts, F-048 Dashboard Date Range Selector
 */
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  async getKpis(dateRange?: DateRangeFilterDto): Promise<DashboardKpiDto> {
    if (dateRange) {
      this.validateDateRange(dateRange);
    }
    return this.dashboardService.getKpis(dateRange);
  }

  async getSalesByDateRange(dateRange?: DateRangeFilterDto): Promise<MonthlySalesDataDto[]> {
    if (dateRange) {
      this.validateDateRange(dateRange);
    }
    return this.dashboardService.getSalesByDateRange(dateRange);
  }

  async getStockByBrand(): Promise<StockByBrandDto[]> {
    return this.dashboardService.getStockByBrand();
  }

  async getRecentlyAddedProducts(): Promise<RecentProductDto[]> {
    return this.dashboardService.getRecentlyAddedProducts();
  }

  private validateDateRange(dateRange: DateRangeFilterDto): void {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRange.startDate && !dateRegex.test(dateRange.startDate)) {
      throw new Error('Invalid startDate format. Expected YYYY-MM-DD');
    }
    if (dateRange.endDate && !dateRegex.test(dateRange.endDate)) {
      throw new Error('Invalid endDate format. Expected YYYY-MM-DD');
    }
    if (dateRange.startDate && dateRange.endDate && dateRange.startDate > dateRange.endDate) {
      throw new Error('startDate must not be after endDate');
    }
  }
}
