import { SalesDashboardService } from '../services/sales-dashboard.service';
import {
  SalesDashboardFilterDto,
  SalesDashboardKpiDto,
  SalesDashboardResponseDto,
  MonthlySalesMetricDto,
  TopSellingProductDto,
  SalesByBrandDto,
  SalesByCashierDto,
  DailySalesSummaryDto,
  SalesTrendDto,
  ProductSalesReportResponseDto
} from '../dto/sales-dashboard.dto';

/**
 * Sales Dashboard Controller
 * HTTP request handling for sales analytics and reporting
 * Routes: /api/sales-dashboard
 * Feature: F-016 Sales Dashboard and Reporting
 */
export class SalesDashboardController {
  constructor(
    private readonly salesDashboardService: SalesDashboardService
  ) {}

  async getKpis(filter?: SalesDashboardFilterDto): Promise<SalesDashboardKpiDto> {
    this.validateDateRange(filter);
    return this.salesDashboardService.getKpis(filter);
  }

  async getMonthlySales(filter?: SalesDashboardFilterDto): Promise<MonthlySalesMetricDto[]> {
    this.validateDateRange(filter);
    return this.salesDashboardService.getMonthlySales(filter);
  }

  async getTopSellingProducts(filter?: SalesDashboardFilterDto, limit?: number): Promise<TopSellingProductDto[]> {
    this.validateDateRange(filter);
    const validLimit = this.validateLimit(limit);
    return this.salesDashboardService.getTopSellingProducts(filter, validLimit);
  }

  async getSalesByBrand(filter?: SalesDashboardFilterDto): Promise<SalesByBrandDto[]> {
    this.validateDateRange(filter);
    return this.salesDashboardService.getSalesByBrand(filter);
  }

  async getSalesByCashier(filter?: SalesDashboardFilterDto): Promise<SalesByCashierDto[]> {
    this.validateDateRange(filter);
    return this.salesDashboardService.getSalesByCashier(filter);
  }

  async getDailySummary(filter?: SalesDashboardFilterDto): Promise<DailySalesSummaryDto[]> {
    this.validateDateRange(filter);
    return this.salesDashboardService.getDailySummary(filter);
  }

  async getSalesTrend(filter?: SalesDashboardFilterDto): Promise<SalesTrendDto[]> {
    this.validateDateRange(filter);
    return this.salesDashboardService.getSalesTrend(filter);
  }

  async getDashboardData(filter?: SalesDashboardFilterDto): Promise<SalesDashboardResponseDto> {
    this.validateDateRange(filter);
    return this.salesDashboardService.getDashboardData(filter);
  }

  async getProductSalesReport(options?: {
    startDate?: string;
    endDate?: string;
    brandId?: string;
  }): Promise<ProductSalesReportResponseDto> {
    this.validateDateRange(options);
    return this.salesDashboardService.getProductSalesReport(options);
  }

  private validateDateRange(filter?: { startDate?: string; endDate?: string }): void {
    if (filter?.startDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(filter.startDate)) {
        throw new Error('Invalid start date format. Use YYYY-MM-DD');
      }
      const startDate = new Date(filter.startDate);
      if (isNaN(startDate.getTime())) {
        throw new Error('Invalid start date');
      }
    }

    if (filter?.endDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(filter.endDate)) {
        throw new Error('Invalid end date format. Use YYYY-MM-DD');
      }
      const endDate = new Date(filter.endDate);
      if (isNaN(endDate.getTime())) {
        throw new Error('Invalid end date');
      }
    }

    if (filter?.startDate && filter?.endDate) {
      const startDate = new Date(filter.startDate);
      const endDate = new Date(filter.endDate);
      if (startDate > endDate) {
        throw new Error('Start date must be before or equal to end date');
      }
    }
  }

  private validateLimit(limit?: number): number {
    if (limit === undefined || limit === null) {
      return 10;
    }
    if (typeof limit !== 'number' || limit < 1 || limit > 100) {
      throw new Error('Limit must be a number between 1 and 100');
    }
    return limit;
  }
}
