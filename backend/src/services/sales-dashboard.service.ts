import { SalesDashboardRepository } from '../repositories/sales-dashboard.repository';
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
 * Sales Dashboard Service
 * Business logic for sales analytics and reporting
 * Feature: F-016 Sales Dashboard and Reporting
 */
export class SalesDashboardService {
  constructor(
    private readonly salesDashboardRepository: SalesDashboardRepository
  ) {}

  async getKpis(filter?: SalesDashboardFilterDto): Promise<SalesDashboardKpiDto> {
    const [totalRevenue, totalProfit, transactionCount] = await Promise.all([
      this.salesDashboardRepository.getTotalRevenue({
        startDate: filter?.startDate,
        endDate: filter?.endDate
      }),
      this.salesDashboardRepository.getTotalProfit({
        startDate: filter?.startDate,
        endDate: filter?.endDate
      }),
      this.salesDashboardRepository.getTransactionCount({
        startDate: filter?.startDate,
        endDate: filter?.endDate
      })
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

  async getMonthlySales(filter?: SalesDashboardFilterDto): Promise<MonthlySalesMetricDto[]> {
    return this.salesDashboardRepository.getMonthlySalesMetrics({
      startDate: filter?.startDate,
      endDate: filter?.endDate
    });
  }

  async getTopSellingProducts(filter?: SalesDashboardFilterDto, limit?: number): Promise<TopSellingProductDto[]> {
    return this.salesDashboardRepository.getTopSellingProducts({
      startDate: filter?.startDate,
      endDate: filter?.endDate,
      limit: limit || 10
    });
  }

  async getSalesByBrand(filter?: SalesDashboardFilterDto): Promise<SalesByBrandDto[]> {
    return this.salesDashboardRepository.getSalesByBrand({
      startDate: filter?.startDate,
      endDate: filter?.endDate
    });
  }

  async getSalesByCashier(filter?: SalesDashboardFilterDto): Promise<SalesByCashierDto[]> {
    return this.salesDashboardRepository.getSalesByCashier({
      startDate: filter?.startDate,
      endDate: filter?.endDate
    });
  }

  async getDailySummary(filter?: SalesDashboardFilterDto): Promise<DailySalesSummaryDto[]> {
    return this.salesDashboardRepository.getDailySalesSummary({
      startDate: filter?.startDate,
      endDate: filter?.endDate
    });
  }

  async getSalesTrend(filter?: SalesDashboardFilterDto): Promise<SalesTrendDto[]> {
    const monthlySales = await this.getMonthlySales(filter);

    return monthlySales.map((current, index) => {
      const previous = index > 0 ? monthlySales[index - 1] : null;

      const revenueChange = previous ? current.revenue - previous.revenue : 0;
      const revenueChangePercent = previous && previous.revenue > 0
        ? ((current.revenue - previous.revenue) / previous.revenue) * 100
        : 0;

      const countChange = previous ? current.count - previous.count : 0;
      const countChangePercent = previous && previous.count > 0
        ? ((current.count - previous.count) / previous.count) * 100
        : 0;

      return {
        period: current.month,
        revenue: current.revenue,
        revenueChange,
        revenueChangePercent,
        count: current.count,
        countChange,
        countChangePercent
      };
    });
  }

  async getDashboardData(filter?: SalesDashboardFilterDto): Promise<SalesDashboardResponseDto> {
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
  }): Promise<ProductSalesReportResponseDto> {
    const data = await this.salesDashboardRepository.getProductSalesReport(options);

    const totalUnits = data.length;
    const totalRevenue = data.reduce((sum, s) => sum + s.salePrice, 0);
    const totalProfit = data.reduce((sum, s) => sum + s.profit, 0);
    const averagePrice = totalUnits > 0 ? totalRevenue / totalUnits : 0;

    return {
      data,
      total: totalUnits,
      summary: {
        totalUnits,
        totalRevenue,
        totalProfit,
        averagePrice
      }
    };
  }
}
