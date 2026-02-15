import { Component, OnInit, signal, computed } from '@angular/core';
import { DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { SalesDashboardService } from '../../../core/services/sales-dashboard.service';
import { StockAlertService } from '../../../core/services/stock-alert.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ThemeService } from '../../../shared/services/theme.service';
import {
  SalesDashboardKpi,
  MonthlySalesMetric,
  TopSellingProduct,
  SalesByBrand,
  SalesByCashier,
  DailySalesSummary,
  SalesDashboardFilter,
  ProductSalesReport
} from '../../../models/sales-dashboard.model';
import { StockAlert, StockAlertConfig } from '../../../models/stock-alert-config.model';
import { DateRangeOption } from '../../../models/dashboard.model';
import { DashboardDateRange, DashboardDateRangeLabels } from '../../../enums';
import { StockAlertsPanelComponent } from '../dashboard/stock-alerts-panel/stock-alerts-panel.component';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { CurrencyService } from '../../../core/services/currency.service';

const MONTH_NAMES: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
};

const CHART_COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
  '#84CC16', '#A855F7', '#0EA5E9', '#E11D48', '#D97706',
];

/**
 * Sales Dashboard Component
 * Visual dashboard showing sales metrics, daily summaries, and performance analytics
 * Feature: F-016 Sales Dashboard and Reporting
 */
@Component({
  selector: 'app-sales-dashboard',
  imports: [
    DatePipe, DecimalPipe, TitleCasePipe, FormsModule,
    CardModule, SkeletonModule, ButtonModule, ChartModule,
    TableModule, TagModule, SelectModule, DatePickerModule,
    TooltipModule, DialogModule,
    StockAlertsPanelComponent,
    AppCurrencyPipe
  ],
  templateUrl: './sales-dashboard.component.html',
  styleUrls: ['./sales-dashboard.component.scss']
})
export class SalesDashboardComponent implements OnInit {
  constructor(
    private salesDashboardService: SalesDashboardService,
    private stockAlertService: StockAlertService,
    private toastService: ToastService,
    private themeService: ThemeService,
    private router: Router,
    private currencyService: CurrencyService
  ) { }

  loading = signal(false);
  chartsLoading = signal(false);
  alertsLoading = signal(false);
  productReportLoading = signal(false);

  stockAlerts = signal<StockAlert[]>([]);
  stockAlertConfig = signal<StockAlertConfig | null>(null);

  kpis = signal<SalesDashboardKpi>({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    totalProfit: 0,
    profitMargin: 0,
    transactionCount: 0
  });

  monthlySales = signal<MonthlySalesMetric[]>([]);
  topProducts = signal<TopSellingProduct[]>([]);
  salesByBrand = signal<SalesByBrand[]>([]);
  salesByCashier = signal<SalesByCashier[]>([]);
  dailySummary = signal<DailySalesSummary[]>([]);
  productReport = signal<ProductSalesReport[]>([]);
  productReportSummary = signal<{
    totalUnits: number;
    totalRevenue: number;
    totalProfit: number;
    averagePrice: number;
  }>({ totalUnits: 0, totalRevenue: 0, totalProfit: 0, averagePrice: 0 });

  showProductReport = false;
  skeletonRows = Array(5);
  today = new Date();

  readonly customRangeValue = DashboardDateRange.CUSTOM;

  dateRangeOptions: DateRangeOption[] = Object.values(DashboardDateRange).map(value => ({
    label: DashboardDateRangeLabels[value],
    value,
  }));

  selectedDateRange: string = DashboardDateRange.THIS_MONTH;
  customStartDate: Date | null = null;
  customEndDate: Date | null = null;

  private currentDateRange = signal<SalesDashboardFilter>({ startDate: undefined, endDate: undefined });

  activeDateRangeLabel = computed(() => {
    const range = this.currentDateRange();
    if (!range.startDate && !range.endDate) {
      return '';
    }
    const start = range.startDate || 'Beginning';
    const end = range.endDate || 'Now';
    return `${start} - ${end}`;
  });

  hasSalesData = computed(() =>
    this.monthlySales().some(m => m.revenue > 0)
  );

  hasBrandData = computed(() =>
    this.salesByBrand().length > 0
  );

  salesTrendChartData = computed(() => {
    const data = this.monthlySales();
    return {
      labels: data.map(m => this.formatMonthLabel(m.month)),
      datasets: [
        {
          label: `Revenue (${this.currencyService.symbol})`,
          data: data.map(m => m.revenue),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: `Profit (${this.currencyService.symbol})`,
          data: data.map(m => m.profit),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
        }
      ]
    };
  });

  lineChartOptions = computed(() => {
    const isDark = this.themeService.isDark();
    const textColor = isDark ? '#E2E8F0' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          labels: {
            color: textColor,
            usePointStyle: true,
          }
        },
        tooltip: {
          callbacks: {
            label: (context: { dataset: { label: string }; parsed: { y: number } }) => {
              const value = context.parsed.y;
              return `${context.dataset.label}: ${this.currencyService.format(value, { minDecimals: 0, maxDecimals: 0 })}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor,
            callback: (value: number) => this.currencyService.format(value, { minDecimals: 0, maxDecimals: 0 }),
          },
          grid: {
            color: gridColor,
          }
        },
        x: {
          ticks: {
            color: textColor,
          },
          grid: {
            display: false,
          }
        }
      }
    };
  });

  brandChartData = computed(() => {
    const data = this.salesByBrand();
    const isDark = this.themeService.isDark();
    const borderColor = isDark ? '#1E293B' : '#ffffff';

    return {
      labels: data.map(s => `${s.brandName} (${s.percentageOfSales.toFixed(1)}%)`),
      datasets: [
        {
          data: data.map(s => s.totalRevenue),
          backgroundColor: data.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
          borderWidth: 2,
          borderColor: borderColor,
        }
      ]
    };
  });

  doughnutChartOptions = computed(() => {
    const isDark = this.themeService.isDark();
    const textColor = isDark ? '#E2E8F0' : '#475569';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            usePointStyle: true,
            padding: 12,
            boxWidth: 12,
            color: textColor,
          }
        },
        tooltip: {
          callbacks: {
            label: (context: { label: string; parsed: number }) => {
              return `${context.label}: ${this.currencyService.format(context.parsed, { minDecimals: 0, maxDecimals: 0 })}`;
            }
          }
        }
      },
      cutout: '60%',
    };
  });

  ngOnInit(): void {
    this.updateDateRange();
    this.loadAll();
  }

  onDateRangeChange(): void {
    if (this.selectedDateRange === DashboardDateRange.CUSTOM) {
      this.customStartDate = null;
      this.customEndDate = null;
      return;
    }
    this.updateDateRange();
    this.loadAll();
  }

  onCustomDateChange(): void {
    if (this.customStartDate && this.customEndDate) {
      this.updateDateRange();
      this.loadAll();
    }
  }

  async loadAll(): Promise<void> {
    this.loading.set(true);
    this.chartsLoading.set(true);
    this.alertsLoading.set(true);

    const dateRange = this.currentDateRange();

    try {
      const [kpis, monthlySales, topProducts, salesByBrand, salesByCashier, dailySummary, alertsData] =
        await Promise.all([
          this.salesDashboardService.getKpis(dateRange),
          this.salesDashboardService.getMonthlySales(dateRange),
          this.salesDashboardService.getTopSellingProducts(dateRange, 10),
          this.salesDashboardService.getSalesByBrand(dateRange),
          this.salesDashboardService.getSalesByCashier(dateRange),
          this.salesDashboardService.getDailySummary(dateRange),
          this.stockAlertService.getAlerts(),
        ]);

      this.kpis.set(kpis);
      this.monthlySales.set(monthlySales);
      this.topProducts.set(topProducts);
      this.salesByBrand.set(salesByBrand);
      this.salesByCashier.set(salesByCashier);
      this.dailySummary.set(dailySummary);
      this.stockAlerts.set(alertsData.alerts);
      this.stockAlertConfig.set(alertsData.config);

      await this.loadProductReport();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load dashboard data';
      this.toastService.error('Dashboard Error', message);
    } finally {
      this.loading.set(false);
      this.chartsLoading.set(false);
      this.alertsLoading.set(false);
    }
  }

  async loadProductReport(): Promise<void> {
    this.productReportLoading.set(true);
    try {
      const dateRange = this.currentDateRange();
      const response = await this.salesDashboardService.getProductSalesReport({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      this.productReport.set(response.data);
      this.productReportSummary.set(response.summary);
    } catch (error) {
      console.error('Failed to load product report:', error);
    } finally {
      this.productReportLoading.set(false);
    }
  }

  onProductClick(_product: TopSellingProduct): void {
    this.showProductReport = true;
  }

  navigateToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  getConditionSeverity(condition: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (condition) {
      case 'new': return 'success';
      case 'used': return 'warn';
      case 'open_box': return 'info';
      default: return 'secondary';
    }
  }

  private updateDateRange(): void {
    const now = new Date();
    let startDate: string | undefined = undefined;
    let endDate: string | undefined = undefined;

    switch (this.selectedDateRange) {
      case DashboardDateRange.TODAY: {
        const today = this.formatDate(now);
        startDate = today;
        endDate = today;
        break;
      }
      case DashboardDateRange.LAST_7_DAYS: {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        startDate = this.formatDate(sevenDaysAgo);
        endDate = this.formatDate(now);
        break;
      }
      case DashboardDateRange.THIS_MONTH: {
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        startDate = `${year}-${month}-01`;
        endDate = this.formatDate(now);
        break;
      }
      case DashboardDateRange.LAST_30_DAYS: {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        startDate = this.formatDate(thirtyDaysAgo);
        endDate = this.formatDate(now);
        break;
      }
      case DashboardDateRange.THIS_QUARTER: {
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        const quarterStart = new Date(now.getFullYear(), quarterMonth, 1);
        startDate = this.formatDate(quarterStart);
        endDate = this.formatDate(now);
        break;
      }
      case DashboardDateRange.THIS_YEAR: {
        startDate = `${now.getFullYear()}-01-01`;
        endDate = this.formatDate(now);
        break;
      }
      case DashboardDateRange.ALL_TIME: {
        startDate = undefined;
        endDate = undefined;
        break;
      }
      case DashboardDateRange.CUSTOM: {
        startDate = this.customStartDate ? this.formatDate(this.customStartDate) : undefined;
        endDate = this.customEndDate ? this.formatDate(this.customEndDate) : undefined;
        break;
      }
    }

    this.currentDateRange.set({ startDate, endDate });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatMonthLabel(monthKey: string): string {
    const parts = monthKey.split('-');
    if (parts.length === 2) {
      const monthName = MONTH_NAMES[parts[1]] || parts[1];
      return `${monthName} ${parts[0]}`;
    }
    return monthKey;
  }
}
