import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
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
import { DashboardService } from '../../../core/services/dashboard.service';
import { StockAlertService } from '../../../core/services/stock-alert.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { DashboardKPIs, DateRangeFilter, DateRangeOption, MonthlySalesData, RecentPhone, StockByBrand } from '../../../models/dashboard.model';
import { StockAlert, StockAlertConfig } from '../../../models/stock-alert-config.model';
import { DashboardDateRange, DashboardDateRangeLabels } from '../../../enums';
import { StockAlertsPanelComponent } from './stock-alerts-panel/stock-alerts-panel.component';
import { StockAlertConfigDialogComponent } from './stock-alert-config-dialog/stock-alert-config-dialog.component';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';

const MONTH_NAMES: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
};

const DOUGHNUT_COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
  '#84CC16', '#A855F7', '#0EA5E9', '#E11D48', '#D97706',
];

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe, TitleCasePipe, FormsModule,
    CardModule, SkeletonModule, ButtonModule, ChartModule,
    TableModule, TagModule, SelectModule, DatePickerModule,
    StockAlertsPanelComponent, StockAlertConfigDialogComponent,
    AppCurrencyPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private stockAlertService = inject(StockAlertService);
  private toastService = inject(ToastService);
  private themeService = inject(ThemeService);
  private router = inject(Router);

  loading = signal(false);
  chartsLoading = signal(false);
  alertsLoading = signal(false);

  stockAlerts = signal<StockAlert[]>([]);
  stockAlertConfig = signal<StockAlertConfig | null>(null);
  showAlertConfig = false;

  kpis = signal<DashboardKPIs>({
    stockCount: 0,
    stockValue: 0,
    potentialProfit: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0,
  });

  monthlySales = signal<MonthlySalesData[]>([]);
  stockByBrand = signal<StockByBrand[]>([]);
  recentPhones = signal<RecentPhone[]>([]);

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

  activeDateRangeLabel = computed(() => {
    const range = this.currentDateRange();
    if (!range.startDate && !range.endDate) {
      return '';
    }
    const start = range.startDate || 'Beginning';
    const end = range.endDate || 'Now';
    return `${start} - ${end}`;
  });

  private currentDateRange = signal<DateRangeFilter>({ startDate: null, endDate: null });

  hasSalesData = computed(() =>
    this.monthlySales().some(m => m.revenue > 0)
  );

  hasStockData = computed(() =>
    this.stockByBrand().length > 0
  );

  salesChartData = computed(() => {
    const data = this.monthlySales();
    return {
      labels: data.map(m => this.formatMonthLabel(m.month)),
      datasets: [
        {
          label: 'Revenue ($)',
          data: data.map(m => m.revenue),
          backgroundColor: '#3B82F6',
          borderColor: '#2563EB',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.7,
        }
      ]
    };
  });

  salesChartOptions = computed(() => {
    const isDark = this.themeService.isDark();
    const textColor = isDark ? '#E2E8F0' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context: { parsed: { y: number } }) => {
              const value = context.parsed.y;
              return `Revenue: $${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor,
            callback: (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
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

  stockChartData = computed(() => {
    const data = this.stockByBrand();
    const isDark = this.themeService.isDark();
    const borderColor = isDark ? '#1E293B' : '#ffffff';

    return {
      labels: data.map(s => `${s.brandName} (${s.count})`),
      datasets: [
        {
          data: data.map(s => s.count),
          backgroundColor: data.map((_, i) => DOUGHNUT_COLORS[i % DOUGHNUT_COLORS.length]),
          borderWidth: 2,
          borderColor: borderColor,
        }
      ]
    };
  });

  stockChartOptions = computed(() => {
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
            label: (context: { label: string; parsed: number; dataset: { data: number[] } }) => {
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0';
              return `${context.label}: ${percentage}%`;
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
      const [kpis, salesData, stockData, recentData, alertsData] = await Promise.all([
        this.dashboardService.getKpis(dateRange),
        this.dashboardService.getSalesByDateRange(dateRange),
        this.dashboardService.getStockByBrand(),
        this.dashboardService.getRecentlyAddedPhones(),
        this.stockAlertService.getAlerts(),
      ]);

      this.kpis.set(kpis);
      this.monthlySales.set(salesData);
      this.stockByBrand.set(stockData);
      this.recentPhones.set(recentData);
      this.stockAlerts.set(alertsData.alerts);
      this.stockAlertConfig.set(alertsData.config);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load dashboard data';
      this.toastService.error('Dashboard Error', message);
    } finally {
      this.loading.set(false);
      this.chartsLoading.set(false);
      this.alertsLoading.set(false);
    }
  }

  onRecentPhoneClick(phone: RecentPhone): void {
    this.router.navigate(['/admin/inventory', phone.id, 'edit']);
  }

  navigateToInventory(): void {
    this.router.navigate(['/admin/inventory']);
  }

  navigateToAddPhone(): void {
    this.router.navigate(['/admin/inventory/new']);
  }

  async onAlertConfigSaved(): Promise<void> {
    this.alertsLoading.set(true);
    try {
      const alertsData = await this.stockAlertService.getAlerts();
      this.stockAlerts.set(alertsData.alerts);
      this.stockAlertConfig.set(alertsData.config);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reload stock alerts';
      this.toastService.error('Alert Error', message);
    } finally {
      this.alertsLoading.set(false);
    }
  }

  getConditionSeverity(condition: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (condition) {
      case 'new': return 'success';
      case 'used': return 'warn';
      case 'refurbished': return 'info';
      default: return 'secondary';
    }
  }

  private updateDateRange(): void {
    const now = new Date();
    let startDate: string | null = null;
    let endDate: string | null = null;

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
        startDate = null;
        endDate = null;
        break;
      }
      case DashboardDateRange.CUSTOM: {
        startDate = this.customStartDate ? this.formatDate(this.customStartDate) : null;
        endDate = this.customEndDate ? this.formatDate(this.customEndDate) : null;
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
