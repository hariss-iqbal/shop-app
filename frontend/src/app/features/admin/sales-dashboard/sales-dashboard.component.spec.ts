import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { SalesDashboardComponent } from './sales-dashboard.component';
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
  ProductSalesReportResponse
} from '../../../models/sales-dashboard.model';
import { StockAlertsResponse } from '../../../models/stock-alert-config.model';
import { DashboardDateRange, ThemeMode } from '../../../enums';

describe('SalesDashboardComponent', () => {
  let component: SalesDashboardComponent;
  let fixture: ComponentFixture<SalesDashboardComponent>;
  let mockSalesDashboardService: jasmine.SpyObj<SalesDashboardService>;
  let mockStockAlertService: jasmine.SpyObj<StockAlertService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockThemeService: jasmine.SpyObj<ThemeService>;
  let router: Router;

  const mockKpis: SalesDashboardKpi = {
    totalSales: 50,
    totalRevenue: 45000,
    averageOrderValue: 900,
    totalProfit: 12000,
    profitMargin: 26.67,
    transactionCount: 50
  };

  const mockMonthlySales: MonthlySalesMetric[] = [
    { month: '2024-01', year: 2024, revenue: 15000, count: 15, profit: 4000, averageOrderValue: 1000 },
    { month: '2024-02', year: 2024, revenue: 18000, count: 20, profit: 5000, averageOrderValue: 900 },
    { month: '2024-03', year: 2024, revenue: 12000, count: 15, profit: 3000, averageOrderValue: 800 }
  ];

  const mockTopProducts: TopSellingProduct[] = [
    { phoneId: 'phone-1', brandName: 'Apple', model: 'iPhone 15 Pro', unitsSold: 10, totalRevenue: 12000, totalProfit: 3000, averagePrice: 1200 },
    { phoneId: 'phone-2', brandName: 'Samsung', model: 'Galaxy S24 Ultra', unitsSold: 8, totalRevenue: 9600, totalProfit: 2400, averagePrice: 1200 },
    { phoneId: 'phone-3', brandName: 'Google', model: 'Pixel 8 Pro', unitsSold: 5, totalRevenue: 4500, totalProfit: 1000, averagePrice: 900 }
  ];

  const mockSalesByBrand: SalesByBrand[] = [
    { brandId: 'brand-1', brandName: 'Apple', unitsSold: 25, totalRevenue: 25000, totalProfit: 6000, percentageOfSales: 55.56 },
    { brandId: 'brand-2', brandName: 'Samsung', unitsSold: 15, totalRevenue: 12000, totalProfit: 3500, percentageOfSales: 26.67 },
    { brandId: 'brand-3', brandName: 'Google', unitsSold: 10, totalRevenue: 8000, totalProfit: 2500, percentageOfSales: 17.78 }
  ];

  const mockSalesByCashier: SalesByCashier[] = [
    { cashierId: 'user-1', cashierEmail: 'john@example.com', cashierName: 'John Doe', totalSales: 30, totalRevenue: 27000, totalProfit: 7000, averageOrderValue: 900 },
    { cashierId: 'user-2', cashierEmail: 'jane@example.com', cashierName: 'Jane Smith', totalSales: 20, totalRevenue: 18000, totalProfit: 5000, averageOrderValue: 900 }
  ];

  const mockDailySummary: DailySalesSummary[] = [
    { date: '2024-03-01', revenue: 3000, count: 3, profit: 800 },
    { date: '2024-03-02', revenue: 4500, count: 5, profit: 1200 },
    { date: '2024-03-03', revenue: 2000, count: 2, profit: 500 }
  ];

  const mockProductReport: ProductSalesReportResponse = {
    data: [
      { phoneId: 'phone-1', brandName: 'Apple', model: 'iPhone 15 Pro', condition: 'new', saleDate: '2024-03-01', salePrice: 1200, costPrice: 900, profit: 300, buyerName: 'Customer 1' }
    ],
    total: 1,
    summary: { totalUnits: 1, totalRevenue: 1200, totalProfit: 300, averagePrice: 1200 }
  };

  const mockAlertsResponse: StockAlertsResponse = {
    alerts: [
      { type: 'low_stock', brandId: 'brand-1', brandName: 'Apple', currentStock: 2, threshold: 5, message: 'Apple has low stock (2 units)' }
    ],
    config: {
      id: 'config-1',
      lowStockThreshold: 5,
      enableBrandZeroAlert: true,
      allowOversell: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: null
    }
  };

  beforeEach(async () => {
    mockSalesDashboardService = jasmine.createSpyObj('SalesDashboardService', [
      'getKpis',
      'getMonthlySales',
      'getTopSellingProducts',
      'getSalesByBrand',
      'getSalesByCashier',
      'getDailySummary',
      'getProductSalesReport'
    ]);

    mockStockAlertService = jasmine.createSpyObj('StockAlertService', ['getAlerts']);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error']);
    mockThemeService = jasmine.createSpyObj('ThemeService', ['isDark', 'toggleTheme'], {
      currentTheme: signal(ThemeMode.LIGHT)
    });
    mockThemeService.isDark.and.returnValue(false);

    mockSalesDashboardService.getKpis.and.returnValue(Promise.resolve(mockKpis));
    mockSalesDashboardService.getMonthlySales.and.returnValue(Promise.resolve(mockMonthlySales));
    mockSalesDashboardService.getTopSellingProducts.and.returnValue(Promise.resolve(mockTopProducts));
    mockSalesDashboardService.getSalesByBrand.and.returnValue(Promise.resolve(mockSalesByBrand));
    mockSalesDashboardService.getSalesByCashier.and.returnValue(Promise.resolve(mockSalesByCashier));
    mockSalesDashboardService.getDailySummary.and.returnValue(Promise.resolve(mockDailySummary));
    mockSalesDashboardService.getProductSalesReport.and.returnValue(Promise.resolve(mockProductReport));
    mockStockAlertService.getAlerts.and.returnValue(Promise.resolve(mockAlertsResponse));

    await TestBed.configureTestingModule({
      imports: [SalesDashboardComponent, NoopAnimationsModule, RouterTestingModule],
      providers: [
        { provide: SalesDashboardService, useValue: mockSalesDashboardService },
        { provide: StockAlertService, useValue: mockStockAlertService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ThemeService, useValue: mockThemeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SalesDashboardComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should load all dashboard data on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockSalesDashboardService.getKpis).toHaveBeenCalled();
      expect(mockSalesDashboardService.getMonthlySales).toHaveBeenCalled();
      expect(mockSalesDashboardService.getTopSellingProducts).toHaveBeenCalled();
      expect(mockSalesDashboardService.getSalesByBrand).toHaveBeenCalled();
      expect(mockSalesDashboardService.getSalesByCashier).toHaveBeenCalled();
      expect(mockSalesDashboardService.getDailySummary).toHaveBeenCalled();
      expect(mockStockAlertService.getAlerts).toHaveBeenCalled();
    }));

    it('should set default date range to THIS_MONTH', () => {
      expect(component.selectedDateRange).toBe(DashboardDateRange.THIS_MONTH);
    });

    it('should populate KPIs after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const kpis = component.kpis();
      expect(kpis.totalRevenue).toBe(45000);
      expect(kpis.transactionCount).toBe(50);
      expect(kpis.averageOrderValue).toBe(900);
      expect(kpis.totalProfit).toBe(12000);
      expect(kpis.profitMargin).toBe(26.67);
    }));

    it('should populate monthly sales after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.monthlySales().length).toBe(3);
    }));

    it('should populate top products after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.topProducts().length).toBe(3);
      expect(component.topProducts()[0].brandName).toBe('Apple');
    }));

    it('should populate sales by brand after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.salesByBrand().length).toBe(3);
    }));

    it('should populate sales by cashier after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.salesByCashier().length).toBe(2);
      expect(component.salesByCashier()[0].cashierName).toBe('John Doe');
    }));

    it('should populate daily summary after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.dailySummary().length).toBe(3);
    }));
  });

  describe('KPI cards rendering - Acceptance Criteria #1', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should display Total Revenue KPI card formatted as currency', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Total Revenue');
      expect(compiled.textContent).toContain('$45,000');
    });

    it('should display Transaction Count KPI card', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Transaction Count');
      expect(compiled.textContent).toContain('50');
    });

    it('should display Average Order Value KPI card', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Avg. Order Value');
      expect(compiled.textContent).toContain('$900.00');
    });

    it('should display Total Profit KPI card', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Total Profit');
      expect(compiled.textContent).toContain('$12,000');
    });

    it('should display Profit Margin KPI card', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Profit Margin');
      expect(compiled.textContent).toContain('26.7%');
    });

    it('should display Units Sold KPI card', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Units Sold');
    });

    it('should display 6 KPI cards', () => {
      // Should have 6 KPI cards in the first section
      const kpiSection = fixture.nativeElement.querySelector('[aria-label="Key Performance Indicators"]');
      expect(kpiSection).toBeTruthy();
      const kpiCards = kpiSection.querySelectorAll('p-card');
      expect(kpiCards.length).toBe(6);
    });
  });

  describe('charts section - Acceptance Criteria #2', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should display Sales Trend chart', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Sales Trend');
    });

    it('should display Sales by Brand chart', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Sales by Brand');
    });

    it('should compute hasSalesData correctly', () => {
      expect(component.hasSalesData()).toBe(true);
    });

    it('should compute hasBrandData correctly', () => {
      expect(component.hasBrandData()).toBe(true);
    });

    it('should return false for hasSalesData when no revenue', fakeAsync(() => {
      mockSalesDashboardService.getMonthlySales.and.returnValue(
        Promise.resolve([{ month: '2024-01', year: 2024, revenue: 0, count: 0, profit: 0, averageOrderValue: 0 }])
      );

      component.loadAll();
      tick();

      expect(component.hasSalesData()).toBe(false);
    }));

    it('should generate correct sales trend chart data', () => {
      const chartData = component.salesTrendChartData();

      expect(chartData.labels.length).toBe(3);
      expect(chartData.datasets.length).toBe(2);
      expect(chartData.datasets[0].label).toBe('Revenue ($)');
      expect(chartData.datasets[1].label).toBe('Profit ($)');
    });

    it('should generate correct brand chart data with percentages', () => {
      const chartData = component.brandChartData();

      expect(chartData.labels.length).toBe(3);
      expect(chartData.labels[0]).toContain('Apple');
      expect(chartData.labels[0]).toContain('55.6%');
    });

    it('should show empty state for sales chart when no data', fakeAsync(() => {
      mockSalesDashboardService.getMonthlySales.and.returnValue(Promise.resolve([]));

      component.loadAll();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('No sales data available');
    }));

    it('should show empty state for brand chart when no data', fakeAsync(() => {
      mockSalesDashboardService.getSalesByBrand.and.returnValue(Promise.resolve([]));

      component.loadAll();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('No brand data available');
    }));
  });

  describe('top products section - Acceptance Criteria #3', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should display Top Products section', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Top Products');
    });

    it('should display top selling products with brand and model', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Apple');
      expect(compiled.textContent).toContain('iPhone 15 Pro');
      expect(compiled.textContent).toContain('Samsung');
      expect(compiled.textContent).toContain('Galaxy S24 Ultra');
    });

    it('should display units sold for each product', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('10');
      expect(compiled.textContent).toContain('8');
    });

    it('should open product report dialog when product row is clicked', fakeAsync(() => {
      const product = mockTopProducts[0];
      component.onProductClick(product);
      fixture.detectChanges();

      expect(component.showProductReport).toBe(true);
    }));

    it('should display detailed product report button', () => {
      const compiled = fixture.nativeElement;
      const button = compiled.querySelector('p-button[ariaLabel="View detailed product report"]');
      expect(button).toBeTruthy();
    });

    it('should show empty state when no products sold', fakeAsync(() => {
      mockSalesDashboardService.getTopSellingProducts.and.returnValue(Promise.resolve([]));

      component.loadAll();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('No products sold yet');
    }));
  });

  describe('date range filtering - Acceptance Criteria #4', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should have all date range options including Last 7 Days', () => {
      expect(component.dateRangeOptions.length).toBe(8);

      const values = component.dateRangeOptions.map(o => o.value);
      expect(values).toContain(DashboardDateRange.TODAY);
      expect(values).toContain(DashboardDateRange.LAST_7_DAYS);
      expect(values).toContain(DashboardDateRange.THIS_MONTH);
      expect(values).toContain(DashboardDateRange.LAST_30_DAYS);
      expect(values).toContain(DashboardDateRange.THIS_QUARTER);
      expect(values).toContain(DashboardDateRange.THIS_YEAR);
      expect(values).toContain(DashboardDateRange.ALL_TIME);
      expect(values).toContain(DashboardDateRange.CUSTOM);
    });

    it('should reload data when date range changes to Last 7 Days', fakeAsync(() => {
      mockSalesDashboardService.getKpis.calls.reset();

      component.selectedDateRange = DashboardDateRange.LAST_7_DAYS;
      component.onDateRangeChange();
      tick();

      expect(mockSalesDashboardService.getKpis).toHaveBeenCalled();
    }));

    it('should compute correct date range for Last 7 Days', () => {
      component.selectedDateRange = DashboardDateRange.LAST_7_DAYS;
      component['updateDateRange']();

      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const expectedEndDate = component['formatDate'](now);
      const expectedStartDate = component['formatDate'](sevenDaysAgo);

      const currentRange = component['currentDateRange']();
      expect(currentRange.startDate).toBe(expectedStartDate);
      expect(currentRange.endDate).toBe(expectedEndDate);
    });

    it('should compute correct date range for Today', () => {
      component.selectedDateRange = DashboardDateRange.TODAY;
      component['updateDateRange']();

      const today = component['formatDate'](new Date());

      const currentRange = component['currentDateRange']();
      expect(currentRange.startDate).toBe(today);
      expect(currentRange.endDate).toBe(today);
    });

    it('should not reload immediately when switching to custom range', fakeAsync(() => {
      mockSalesDashboardService.getKpis.calls.reset();

      component.selectedDateRange = DashboardDateRange.CUSTOM;
      component.onDateRangeChange();
      tick();

      expect(mockSalesDashboardService.getKpis).not.toHaveBeenCalled();
    }));

    it('should reload data when both custom dates are selected', fakeAsync(() => {
      component.selectedDateRange = DashboardDateRange.CUSTOM;
      component.customStartDate = new Date('2024-01-01');
      component.customEndDate = new Date('2024-01-31');

      mockSalesDashboardService.getKpis.calls.reset();
      component.onCustomDateChange();
      tick();

      expect(mockSalesDashboardService.getKpis).toHaveBeenCalled();
    }));

    it('should show date range label when dates are set', () => {
      component.selectedDateRange = DashboardDateRange.LAST_7_DAYS;
      component.onDateRangeChange();

      const label = component.activeDateRangeLabel();
      expect(label).toContain(' - ');
    });

    it('should show empty label for all time', fakeAsync(() => {
      component.selectedDateRange = DashboardDateRange.ALL_TIME;
      component.onDateRangeChange();
      tick();

      expect(component.activeDateRangeLabel()).toBe('');
    }));
  });

  describe('sales by cashier section - Acceptance Criteria #5', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should display Sales by Cashier section', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Sales by Cashier');
    });

    it('should display cashier name and email', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('John Doe');
      expect(compiled.textContent).toContain('john@example.com');
      expect(compiled.textContent).toContain('Jane Smith');
    });

    it('should display total sales for each cashier', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('30');
      expect(compiled.textContent).toContain('20');
    });

    it('should display revenue for each cashier', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('$27,000');
      expect(compiled.textContent).toContain('$18,000');
    });

    it('should show empty state when no cashier data', fakeAsync(() => {
      mockSalesDashboardService.getSalesByCashier.and.returnValue(Promise.resolve([]));

      component.loadAll();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('No cashier data available');
    }));
  });

  describe('stock alerts - Acceptance Criteria #6', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should load stock alerts on init', fakeAsync(() => {
      expect(mockStockAlertService.getAlerts).toHaveBeenCalled();
    }));

    it('should store stock alerts', fakeAsync(() => {
      expect(component.stockAlerts().length).toBe(1);
      expect(component.stockAlerts()[0].brandName).toBe('Apple');
    }));

    it('should store stock alert config', fakeAsync(() => {
      expect(component.stockAlertConfig()).toBeTruthy();
      expect(component.stockAlertConfig()?.lowStockThreshold).toBe(5);
    }));

    it('should navigate to dashboard on configure clicked', () => {
      component.navigateToDashboard();
      expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    });
  });

  describe('daily sales summary', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should display Daily Summary section', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Daily Summary');
    });

    it('should display daily data with date, transactions, revenue, and profit', () => {
      const compiled = fixture.nativeElement;
      // Check for the presence of data values
      expect(compiled.textContent).toContain('3');
      expect(compiled.textContent).toContain('$3,000');
    });

    it('should show empty state when no daily data', fakeAsync(() => {
      mockSalesDashboardService.getDailySummary.and.returnValue(Promise.resolve([]));

      component.loadAll();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('No daily data available');
    }));
  });

  describe('product sales report dialog', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should load product report data', fakeAsync(() => {
      expect(mockSalesDashboardService.getProductSalesReport).toHaveBeenCalled();
    }));

    it('should compute product report summary', fakeAsync(() => {
      const summary = component.productReportSummary();
      expect(summary.totalUnits).toBe(1);
      expect(summary.totalRevenue).toBe(1200);
      expect(summary.totalProfit).toBe(300);
    }));

    it('should display report dialog when showProductReport is true', fakeAsync(() => {
      component.showProductReport = true;
      fixture.detectChanges();

      const dialog = fixture.nativeElement.querySelector('p-dialog');
      expect(dialog).toBeTruthy();
    }));
  });

  describe('refresh functionality', () => {
    it('should reload all data when refresh button is clicked', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      mockSalesDashboardService.getKpis.calls.reset();
      mockSalesDashboardService.getMonthlySales.calls.reset();
      mockSalesDashboardService.getTopSellingProducts.calls.reset();
      mockSalesDashboardService.getSalesByBrand.calls.reset();
      mockSalesDashboardService.getSalesByCashier.calls.reset();
      mockSalesDashboardService.getDailySummary.calls.reset();
      mockStockAlertService.getAlerts.calls.reset();

      component.loadAll();
      tick();

      expect(mockSalesDashboardService.getKpis).toHaveBeenCalledTimes(1);
      expect(mockSalesDashboardService.getMonthlySales).toHaveBeenCalledTimes(1);
      expect(mockSalesDashboardService.getTopSellingProducts).toHaveBeenCalledTimes(1);
      expect(mockSalesDashboardService.getSalesByBrand).toHaveBeenCalledTimes(1);
      expect(mockSalesDashboardService.getSalesByCashier).toHaveBeenCalledTimes(1);
      expect(mockSalesDashboardService.getDailySummary).toHaveBeenCalledTimes(1);
      expect(mockStockAlertService.getAlerts).toHaveBeenCalledTimes(1);
    }));

    it('should show loading state during refresh', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.loading()).toBe(false);

      mockSalesDashboardService.getKpis.and.returnValue(
        new Promise(resolve => setTimeout(() => resolve(mockKpis), 100))
      );

      component.loadAll();
      expect(component.loading()).toBe(true);

      tick(100);
      expect(component.loading()).toBe(false);
    }));
  });

  describe('error handling', () => {
    it('should display error toast when dashboard load fails', fakeAsync(() => {
      mockSalesDashboardService.getKpis.and.returnValue(Promise.reject(new Error('Network error')));

      fixture.detectChanges();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Dashboard Error', 'Network error');
    }));

    it('should handle non-Error exceptions', fakeAsync(() => {
      mockSalesDashboardService.getKpis.and.returnValue(Promise.reject('Unknown error'));

      fixture.detectChanges();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Dashboard Error', 'Failed to load dashboard data');
    }));

    it('should stop loading even on error', fakeAsync(() => {
      mockSalesDashboardService.getKpis.and.returnValue(Promise.reject(new Error('Error')));

      fixture.detectChanges();
      tick();

      expect(component.loading()).toBe(false);
      expect(component.chartsLoading()).toBe(false);
    }));
  });

  describe('condition severity mapping', () => {
    it('should return success for new condition', () => {
      expect(component.getConditionSeverity('new')).toBe('success');
    });

    it('should return warn for used condition', () => {
      expect(component.getConditionSeverity('used')).toBe('warn');
    });

    it('should return info for refurbished condition', () => {
      expect(component.getConditionSeverity('refurbished')).toBe('info');
    });

    it('should return secondary for unknown condition', () => {
      expect(component.getConditionSeverity('unknown')).toBe('secondary');
    });
  });

  describe('loading states', () => {
    it('should show loading skeleton for KPI cards when loading', () => {
      component.loading.set(true);
      fixture.detectChanges();

      const skeletons = fixture.nativeElement.querySelectorAll('p-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show chart loading skeleton when chartsLoading', () => {
      component.chartsLoading.set(true);
      fixture.detectChanges();

      const skeletons = fixture.nativeElement.querySelectorAll('p-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('theme-aware charts', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should generate light theme line chart options', () => {
      const options = component.lineChartOptions();

      expect(options.responsive).toBe(true);
      expect(options.maintainAspectRatio).toBe(false);
      expect(options.scales.y.ticks.color).toBe('#475569');
      expect(options.scales.y.grid.color).toBe('rgba(0, 0, 0, 0.05)');
    });

    it('should generate light theme doughnut chart options', () => {
      const options = component.doughnutChartOptions();

      expect(options.responsive).toBe(true);
      expect(options.maintainAspectRatio).toBe(false);
      expect(options.cutout).toBe('60%');
      expect(options.plugins.legend.labels.color).toBe('#475569');
    });
  });

  describe('charts with dark theme', () => {
    beforeEach(async () => {
      mockThemeService.isDark.and.returnValue(true);

      await TestBed.resetTestingModule().configureTestingModule({
        imports: [SalesDashboardComponent, NoopAnimationsModule, RouterTestingModule],
        providers: [
          { provide: SalesDashboardService, useValue: mockSalesDashboardService },
          { provide: StockAlertService, useValue: mockStockAlertService },
          { provide: ToastService, useValue: mockToastService },
          { provide: ThemeService, useValue: mockThemeService }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(SalesDashboardComponent);
      component = fixture.componentInstance;
    });

    it('should generate dark theme line chart options', () => {
      const options = component.lineChartOptions();

      expect(options.scales.y.ticks.color).toBe('#E2E8F0');
      expect(options.scales.y.grid.color).toBe('rgba(255, 255, 255, 0.1)');
    });

    it('should generate dark theme doughnut chart options', () => {
      const options = component.doughnutChartOptions();

      expect(options.plugins.legend.labels.color).toBe('#E2E8F0');
    });

    it('should generate dark theme border color for brand chart', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const chartData = component.brandChartData();
      expect(chartData.datasets[0].borderColor).toBe('#1E293B');
    }));
  });

  describe('accessibility', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should have main role on dashboard container', () => {
      const main = fixture.nativeElement.querySelector('[role="main"]');
      expect(main).toBeTruthy();
      expect(main.getAttribute('aria-label')).toBe('Sales Dashboard');
    });

    it('should have proper aria labels on sections', () => {
      const kpiSection = fixture.nativeElement.querySelector('[aria-label="Key Performance Indicators"]');
      const chartsSection = fixture.nativeElement.querySelector('[aria-label="Sales Charts"]');

      expect(kpiSection).toBeTruthy();
      expect(chartsSection).toBeTruthy();
    });

    it('should have aria labels on tables', () => {
      const tables = fixture.nativeElement.querySelectorAll('p-table');
      tables.forEach((table: Element) => {
        expect(table.getAttribute('ariaLabel')).toBeTruthy();
      });
    });

    it('should have aria labels on refresh button', () => {
      const refreshButton = fixture.nativeElement.querySelector('p-button[ariaLabel="Refresh dashboard data"]');
      expect(refreshButton).toBeTruthy();
    });
  });
});
