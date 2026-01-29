import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
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
    CurrencyPipe, DatePipe, TitleCasePipe, FormsModule,
    CardModule, SkeletonModule, ButtonModule, ChartModule,
    TableModule, TagModule, SelectModule, DatePickerModule,
    StockAlertsPanelComponent, StockAlertConfigDialogComponent
  ],
  template: `
    <div class="grid" role="main" aria-label="Dashboard">
      <!-- Header with Date Range Selector -->
      <div class="col-12 flex flex-column gap-3 mb-4">
        <div class="flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between gap-3">
          <h1 class="text-3xl font-bold m-0">Dashboard</h1>
          <p-button
            icon="pi pi-refresh"
            label="Refresh"
            [outlined]="true"
            severity="secondary"
            (onClick)="loadAll()"
            [loading]="loading()"
            styleClass="w-full sm:w-auto"
            ariaLabel="Refresh dashboard data"
          />
        </div>
        <div class="flex flex-column sm:flex-row align-items-start sm:align-items-center gap-3" role="group" aria-label="Date range filter">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-calendar text-color-secondary" aria-hidden="true"></i>
            <span class="text-color-secondary font-medium" id="period-label">Period:</span>
          </div>
          <p-select
            [options]="dateRangeOptions"
            [(ngModel)]="selectedDateRange"
            optionLabel="label"
            optionValue="value"
            (onChange)="onDateRangeChange()"
            styleClass="w-full sm:w-14rem"
            ariaLabelledBy="period-label"
          />
          @if (selectedDateRange === customRangeValue) {
            <p-datepicker
              [(ngModel)]="customStartDate"
              [showIcon]="true"
              [maxDate]="customEndDate || today"
              dateFormat="yy-mm-dd"
              placeholder="Start date"
              (onSelect)="onCustomDateChange()"
              styleClass="w-full sm:w-auto"
              inputStyleClass="w-full sm:w-10rem"
              ariaLabel="Custom start date"
            />
            <span class="text-color-secondary font-medium" aria-hidden="true">to</span>
            <p-datepicker
              [(ngModel)]="customEndDate"
              [showIcon]="true"
              [minDate]="customStartDate!"
              [maxDate]="today"
              dateFormat="yy-mm-dd"
              placeholder="End date"
              (onSelect)="onCustomDateChange()"
              styleClass="w-full sm:w-auto"
              inputStyleClass="w-full sm:w-10rem"
              ariaLabel="Custom end date"
            />
          }
          @if (activeDateRangeLabel()) {
            <span class="text-sm text-color-secondary" aria-live="polite">{{ activeDateRangeLabel() }}</span>
          }
        </div>
      </div>

      <!-- Stock Alerts (above KPI cards) -->
      <div class="col-12">
        <app-stock-alerts-panel
          [alerts]="stockAlerts()"
          [config]="stockAlertConfig()"
          [loading]="alertsLoading()"
          (configureClicked)="showAlertConfig = true"
        />
      </div>

      <!-- Stock Alert Config Dialog -->
      <app-stock-alert-config-dialog
        [visible]="showAlertConfig"
        [config]="stockAlertConfig()"
        (visibleChange)="showAlertConfig = $event"
        (configSaved)="onAlertConfigSaved()"
      />

      <!-- KPI Cards Section -->
      <section class="col-12" aria-label="Key Performance Indicators">
        <div class="grid">
          <!-- Total Stock -->
          <div class="col-12 md:col-6 xl:col-3">
            <p-card styleClass="h-full">
              @if (loading()) {
                <div class="flex align-items-center gap-3" aria-busy="true" aria-label="Loading total stock">
                  <p-skeleton shape="circle" size="3rem" />
                  <div class="flex-1">
                    <p-skeleton width="60%" styleClass="mb-2" />
                    <p-skeleton width="40%" height="1.75rem" />
                  </div>
                </div>
              } @else {
                <div class="flex align-items-center gap-3" role="article" aria-label="Total Stock: {{ kpis().stockCount }} phones available">
                  <div class="w-3rem h-3rem border-round bg-blue-100 flex align-items-center justify-content-center flex-shrink-0">
                    <i class="pi pi-mobile text-blue-500 text-2xl" aria-hidden="true"></i>
                  </div>
                  <div>
                    <span class="text-color-secondary text-sm block mb-1">Total Stock</span>
                    <span class="text-2xl font-bold text-color">{{ kpis().stockCount }}</span>
                  </div>
                </div>
              }
            </p-card>
          </div>

          <!-- Stock Value -->
          <div class="col-12 md:col-6 xl:col-3">
            <p-card styleClass="h-full">
              @if (loading()) {
                <div class="flex align-items-center gap-3" aria-busy="true" aria-label="Loading stock value">
                  <p-skeleton shape="circle" size="3rem" />
                  <div class="flex-1">
                    <p-skeleton width="60%" styleClass="mb-2" />
                    <p-skeleton width="40%" height="1.75rem" />
                  </div>
                </div>
              } @else {
                <div class="flex align-items-center gap-3" role="article" aria-label="Stock Value: {{ kpis().stockValue | currency:'USD':'symbol':'1.0-0' }}">
                  <div class="w-3rem h-3rem border-round bg-green-100 flex align-items-center justify-content-center flex-shrink-0">
                    <i class="pi pi-dollar text-green-500 text-2xl" aria-hidden="true"></i>
                  </div>
                  <div>
                    <span class="text-color-secondary text-sm block mb-1">Stock Value</span>
                    <span class="text-2xl font-bold text-color">{{ kpis().stockValue | currency:'USD':'symbol':'1.0-0' }}</span>
                  </div>
                </div>
              }
            </p-card>
          </div>

          <!-- Potential Profit -->
          <div class="col-12 md:col-6 xl:col-3">
            <p-card styleClass="h-full">
              @if (loading()) {
                <div class="flex align-items-center gap-3" aria-busy="true" aria-label="Loading potential profit">
                  <p-skeleton shape="circle" size="3rem" />
                  <div class="flex-1">
                    <p-skeleton width="60%" styleClass="mb-2" />
                    <p-skeleton width="40%" height="1.75rem" />
                  </div>
                </div>
              } @else {
                <div class="flex align-items-center gap-3" role="article" aria-label="Potential Profit: {{ kpis().potentialProfit | currency:'USD':'symbol':'1.0-0' }}">
                  <div class="w-3rem h-3rem border-round bg-purple-100 flex align-items-center justify-content-center flex-shrink-0">
                    <i class="pi pi-trending-up text-purple-500 text-2xl" aria-hidden="true"></i>
                  </div>
                  <div>
                    <span class="text-color-secondary text-sm block mb-1">Potential Profit</span>
                    <span class="text-2xl font-bold text-color">{{ kpis().potentialProfit | currency:'USD':'symbol':'1.0-0' }}</span>
                  </div>
                </div>
              }
            </p-card>
          </div>

          <!-- Total Sales -->
          <div class="col-12 md:col-6 xl:col-3">
            <p-card styleClass="h-full">
              @if (loading()) {
                <div class="flex align-items-center gap-3" aria-busy="true" aria-label="Loading total sales">
                  <p-skeleton shape="circle" size="3rem" />
                  <div class="flex-1">
                    <p-skeleton width="60%" styleClass="mb-2" />
                    <p-skeleton width="40%" height="1.75rem" />
                  </div>
                </div>
              } @else {
                <div class="flex align-items-center gap-3" role="article" aria-label="Total Sales: {{ kpis().totalSales }} sales completed">
                  <div class="w-3rem h-3rem border-round bg-orange-100 flex align-items-center justify-content-center flex-shrink-0">
                    <i class="pi pi-shopping-cart text-orange-500 text-2xl" aria-hidden="true"></i>
                  </div>
                  <div>
                    <span class="text-color-secondary text-sm block mb-1">Total Sales</span>
                    <span class="text-2xl font-bold text-color">{{ kpis().totalSales }}</span>
                  </div>
                </div>
              }
            </p-card>
          </div>
        </div>
      </section>

      <!-- Charts Section -->
      <section class="col-12" aria-label="Charts and Analytics">
        <div class="grid">
          <!-- Sales Revenue Bar Chart -->
          <div class="col-12 lg:col-7">
            <p-card>
              <ng-template #header>
                <div class="flex align-items-center justify-content-between px-3 pt-3">
                  <h2 class="text-xl font-semibold text-color m-0">Sales Revenue</h2>
                  <i class="pi pi-chart-bar text-color-secondary text-xl" aria-hidden="true"></i>
                </div>
              </ng-template>
              @if (chartsLoading()) {
                <div class="flex align-items-center justify-content-center" style="height: 300px" aria-busy="true" aria-label="Loading sales chart">
                  <p-skeleton width="100%" height="300px" />
                </div>
              } @else if (hasSalesData()) {
                <div role="img" aria-label="Bar chart showing monthly sales revenue">
                  <p-chart
                    type="bar"
                    [data]="salesChartData()"
                    [options]="salesChartOptions()"
                    [responsive]="true"
                    height="300px"
                  />
                </div>
              } @else {
                <div class="flex flex-column align-items-center justify-content-center text-color-secondary" style="height: 300px" role="status">
                  <i class="pi pi-chart-bar text-4xl mb-3" aria-hidden="true"></i>
                  <span class="text-lg">No sales data available for the selected period</span>
                  <span class="text-sm mt-1">Sales will appear here once transactions are recorded</span>
                </div>
              }
            </p-card>
          </div>

          <!-- Stock by Brand Doughnut Chart -->
          <div class="col-12 lg:col-5">
            <p-card>
              <ng-template #header>
                <div class="flex align-items-center justify-content-between px-3 pt-3">
                  <h2 class="text-xl font-semibold text-color m-0">Stock by Brand</h2>
                  <i class="pi pi-chart-pie text-color-secondary text-xl" aria-hidden="true"></i>
                </div>
              </ng-template>
              @if (chartsLoading()) {
                <div class="flex align-items-center justify-content-center" style="height: 300px" aria-busy="true" aria-label="Loading stock chart">
                  <p-skeleton width="100%" height="300px" />
                </div>
              } @else if (hasStockData()) {
                <div role="img" aria-label="Doughnut chart showing stock distribution by brand">
                  <p-chart
                    type="doughnut"
                    [data]="stockChartData()"
                    [options]="stockChartOptions()"
                    [responsive]="true"
                    height="300px"
                  />
                </div>
              } @else {
                <div class="flex flex-column align-items-center justify-content-center text-color-secondary" style="height: 300px" role="status">
                  <i class="pi pi-chart-pie text-4xl mb-3" aria-hidden="true"></i>
                  <span class="text-lg">No stock data available</span>
                  <span class="text-sm mt-1">Inventory will appear here once phones are added</span>
                </div>
              }
            </p-card>
          </div>
        </div>
      </section>

      <!-- Recently Added Phones Section -->
      <section class="col-12" aria-label="Recently added phones">
        <p-card>
          <ng-template #header>
            <div class="flex align-items-center justify-content-between px-3 pt-3">
              <h2 class="text-xl font-semibold text-color m-0">Recently Added</h2>
              <p-button
                icon="pi pi-list"
                label="View All"
                [text]="true"
                severity="secondary"
                size="small"
                (onClick)="navigateToInventory()"
                ariaLabel="View all inventory"
              />
            </div>
          </ng-template>
          @if (loading()) {
            <div class="flex flex-column gap-3" aria-busy="true" aria-label="Loading recently added phones">
              @for (_ of skeletonRows; track $index) {
                <div class="flex align-items-center gap-3">
                  <p-skeleton width="15%" />
                  <p-skeleton width="20%" />
                  <p-skeleton width="15%" />
                  <p-skeleton width="15%" />
                  <p-skeleton width="20%" />
                </div>
              }
            </div>
          } @else if (recentPhones().length > 0) {
            <p-table
              [value]="recentPhones()"
              [rowHover]="true"
              (onRowSelect)="onRecentPhoneClick($any($event).data)"
              selectionMode="single"
              dataKey="id"
              [scrollable]="true"
              scrollDirection="horizontal"
              [tableStyle]="{ 'min-width': '40rem' }"
              ariaLabel="Recently added phones table"
            >
              <ng-template #header>
                <tr>
                  <th scope="col">Brand</th>
                  <th scope="col">Model</th>
                  <th scope="col">Condition</th>
                  <th scope="col">Selling Price</th>
                  <th scope="col">Date Added</th>
                  <th scope="col" class="w-3rem"></th>
                </tr>
              </ng-template>
              <ng-template #body let-phone>
                <tr [pSelectableRow]="phone" class="cursor-pointer" role="button" tabindex="0" [attr.aria-label]="'Edit ' + phone.brandName + ' ' + phone.model">
                  <td>{{ phone.brandName }}</td>
                  <td class="font-medium">{{ phone.model }}</td>
                  <td>
                    <p-tag
                      [value]="phone.condition | titlecase"
                      [severity]="getConditionSeverity(phone.condition)"
                    />
                  </td>
                  <td>{{ phone.sellingPrice | currency:'USD':'symbol':'1.2-2' }}</td>
                  <td>{{ phone.createdAt | date:'mediumDate' }}</td>
                  <td class="text-right">
                    <i class="pi pi-pencil text-color-secondary text-sm" aria-hidden="true"></i>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          } @else {
            <div class="flex flex-column align-items-center justify-content-center text-color-secondary py-5" role="status">
              <i class="pi pi-inbox text-4xl mb-3" aria-hidden="true"></i>
              <span class="text-lg">No phones added yet</span>
              <span class="text-sm mt-1 mb-3">Recently added phones will appear here</span>
              <p-button
                icon="pi pi-plus"
                label="Add Phone"
                [outlined]="true"
                (onClick)="navigateToAddPhone()"
                ariaLabel="Add new phone to inventory"
              />
            </div>
          }
        </p-card>
      </section>
    </div>
  `,
  styles: []
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
