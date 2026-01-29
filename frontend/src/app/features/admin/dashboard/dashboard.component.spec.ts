import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from '../../../core/services/dashboard.service';
import { StockAlertService } from '../../../core/services/stock-alert.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { DashboardKPIs, MonthlySalesData, RecentPhone, StockByBrand } from '../../../models/dashboard.model';
import { StockAlertsResponse } from '../../../models/stock-alert-config.model';
import { DashboardDateRange, ThemeMode } from '../../../enums';
import { signal } from '@angular/core';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockDashboardService: jasmine.SpyObj<DashboardService>;
  let mockStockAlertService: jasmine.SpyObj<StockAlertService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockThemeService: jasmine.SpyObj<ThemeService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockKpis: DashboardKPIs = {
    stockCount: 25,
    stockValue: 15000,
    potentialProfit: 5000,
    totalSales: 10,
    totalRevenue: 12000,
    totalProfit: 3000
  };

  const mockMonthlySales: MonthlySalesData[] = [
    { month: '2024-01', count: 5, revenue: 6000 },
    { month: '2024-02', count: 5, revenue: 6000 }
  ];

  const mockStockByBrand: StockByBrand[] = [
    { brandId: 'brand-1', brandName: 'Apple', count: 15 },
    { brandId: 'brand-2', brandName: 'Samsung', count: 10 }
  ];

  const mockRecentPhones: RecentPhone[] = [
    {
      id: 'phone-1',
      brandName: 'Apple',
      model: 'iPhone 15 Pro',
      condition: 'new',
      sellingPrice: 1200,
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'phone-2',
      brandName: 'Samsung',
      model: 'Galaxy S24',
      condition: 'used',
      sellingPrice: 900,
      createdAt: '2024-01-14T09:00:00Z'
    }
  ];

  const mockAlertsResponse: StockAlertsResponse = {
    alerts: [],
    config: {
      id: 'config-1',
      lowStockThreshold: 5,
      enableBrandZeroAlert: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: null
    }
  };

  beforeEach(async () => {
    mockDashboardService = jasmine.createSpyObj('DashboardService', [
      'getKpis',
      'getSalesByDateRange',
      'getStockByBrand',
      'getRecentlyAddedPhones'
    ]);

    mockStockAlertService = jasmine.createSpyObj('StockAlertService', ['getAlerts']);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error']);
    mockThemeService = jasmine.createSpyObj('ThemeService', ['isDark', 'toggleTheme'], {
      currentTheme: signal(ThemeMode.LIGHT)
    });
    mockThemeService.isDark.and.returnValue(false);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockDashboardService.getKpis.and.returnValue(Promise.resolve(mockKpis));
    mockDashboardService.getSalesByDateRange.and.returnValue(Promise.resolve(mockMonthlySales));
    mockDashboardService.getStockByBrand.and.returnValue(Promise.resolve(mockStockByBrand));
    mockDashboardService.getRecentlyAddedPhones.and.returnValue(Promise.resolve(mockRecentPhones));
    mockStockAlertService.getAlerts.and.returnValue(Promise.resolve(mockAlertsResponse));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, NoopAnimationsModule],
      providers: [
        { provide: DashboardService, useValue: mockDashboardService },
        { provide: StockAlertService, useValue: mockStockAlertService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should load all dashboard data on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockDashboardService.getKpis).toHaveBeenCalled();
      expect(mockDashboardService.getSalesByDateRange).toHaveBeenCalled();
      expect(mockDashboardService.getStockByBrand).toHaveBeenCalled();
      expect(mockDashboardService.getRecentlyAddedPhones).toHaveBeenCalled();
      expect(mockStockAlertService.getAlerts).toHaveBeenCalled();
    }));

    it('should set default date range to THIS_MONTH', () => {
      expect(component.selectedDateRange).toBe(DashboardDateRange.THIS_MONTH);
    });

    it('should populate KPIs after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const kpis = component.kpis();
      expect(kpis.stockCount).toBe(25);
      expect(kpis.stockValue).toBe(15000);
      expect(kpis.potentialProfit).toBe(5000);
      expect(kpis.totalSales).toBe(10);
    }));

    it('should populate recent phones after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.recentPhones().length).toBe(2);
      expect(component.recentPhones()[0].model).toBe('iPhone 15 Pro');
    }));

    it('should populate stock by brand after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.stockByBrand().length).toBe(2);
    }));
  });

  describe('KPI cards rendering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should display Total Sales KPI card', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Total Sales');
      expect(compiled.textContent).toContain('10');
    });

    it('should display Stock Value KPI card formatted as currency', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Stock Value');
      expect(compiled.textContent).toContain('$15,000');
    });

    it('should display Total Stock KPI card', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Total Stock');
      expect(compiled.textContent).toContain('25');
    });

    it('should display Potential Profit KPI card formatted as currency', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Potential Profit');
      expect(compiled.textContent).toContain('$5,000');
    });

    it('should display 4 KPI cards as per acceptance criteria', () => {
      const cards = fixture.nativeElement.querySelectorAll('p-card');
      // 4 KPI cards + 2 chart cards + 1 recent phones card = 7 total cards
      expect(cards.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('date range filtering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should have all date range options', () => {
      expect(component.dateRangeOptions.length).toBe(6);

      const values = component.dateRangeOptions.map(o => o.value);
      expect(values).toContain(DashboardDateRange.THIS_MONTH);
      expect(values).toContain(DashboardDateRange.LAST_30_DAYS);
      expect(values).toContain(DashboardDateRange.THIS_QUARTER);
      expect(values).toContain(DashboardDateRange.THIS_YEAR);
      expect(values).toContain(DashboardDateRange.ALL_TIME);
      expect(values).toContain(DashboardDateRange.CUSTOM);
    });

    it('should reload data when date range changes', fakeAsync(() => {
      mockDashboardService.getKpis.calls.reset();

      component.selectedDateRange = DashboardDateRange.LAST_30_DAYS;
      component.onDateRangeChange();
      tick();

      expect(mockDashboardService.getKpis).toHaveBeenCalled();
    }));

    it('should not reload immediately when switching to custom range', fakeAsync(() => {
      mockDashboardService.getKpis.calls.reset();

      component.selectedDateRange = DashboardDateRange.CUSTOM;
      component.onDateRangeChange();
      tick();

      // Should not reload until custom dates are selected
      expect(mockDashboardService.getKpis).not.toHaveBeenCalled();
    }));

    it('should reload data when both custom dates are selected', fakeAsync(() => {
      component.selectedDateRange = DashboardDateRange.CUSTOM;
      component.customStartDate = new Date('2024-01-01');
      component.customEndDate = new Date('2024-01-31');

      mockDashboardService.getKpis.calls.reset();
      component.onCustomDateChange();
      tick();

      expect(mockDashboardService.getKpis).toHaveBeenCalled();
    }));

    it('should not reload when only one custom date is selected', fakeAsync(() => {
      component.selectedDateRange = DashboardDateRange.CUSTOM;
      component.customStartDate = new Date('2024-01-01');
      component.customEndDate = null;

      mockDashboardService.getKpis.calls.reset();
      component.onCustomDateChange();
      tick();

      expect(mockDashboardService.getKpis).not.toHaveBeenCalled();
    }));
  });

  describe('refresh functionality', () => {
    it('should reload all data when refresh button is clicked', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      mockDashboardService.getKpis.calls.reset();
      mockDashboardService.getSalesByDateRange.calls.reset();
      mockDashboardService.getStockByBrand.calls.reset();
      mockDashboardService.getRecentlyAddedPhones.calls.reset();
      mockStockAlertService.getAlerts.calls.reset();

      component.loadAll();
      tick();

      expect(mockDashboardService.getKpis).toHaveBeenCalledTimes(1);
      expect(mockDashboardService.getSalesByDateRange).toHaveBeenCalledTimes(1);
      expect(mockDashboardService.getStockByBrand).toHaveBeenCalledTimes(1);
      expect(mockDashboardService.getRecentlyAddedPhones).toHaveBeenCalledTimes(1);
      expect(mockStockAlertService.getAlerts).toHaveBeenCalledTimes(1);
    }));

    it('should show loading state during refresh', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.loading()).toBe(false);

      mockDashboardService.getKpis.and.returnValue(
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
      mockDashboardService.getKpis.and.returnValue(Promise.reject(new Error('Network error')));

      fixture.detectChanges();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Dashboard Error', 'Network error');
    }));

    it('should handle non-Error exceptions', fakeAsync(() => {
      mockDashboardService.getKpis.and.returnValue(Promise.reject('Unknown error'));

      fixture.detectChanges();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Dashboard Error', 'Failed to load dashboard data');
    }));

    it('should stop loading even on error', fakeAsync(() => {
      mockDashboardService.getKpis.and.returnValue(Promise.reject(new Error('Error')));

      fixture.detectChanges();
      tick();

      expect(component.loading()).toBe(false);
      expect(component.chartsLoading()).toBe(false);
    }));
  });

  describe('recently added phones table', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should display recently added phones', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('iPhone 15 Pro');
      expect(compiled.textContent).toContain('Apple');
    });

    it('should navigate to phone edit on row click', fakeAsync(() => {
      const phone = mockRecentPhones[0];
      component.onRecentPhoneClick(phone);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/inventory', 'phone-1', 'edit']);
    }));

    it('should show empty state when no phones exist', fakeAsync(() => {
      mockDashboardService.getRecentlyAddedPhones.and.returnValue(Promise.resolve([]));

      component.loadAll();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('No phones added yet');
    }));

    it('should display fewer than 5 phones without error when fewer exist', fakeAsync(() => {
      const threePhones: RecentPhone[] = [
        { id: 'phone-1', brandName: 'Apple', model: 'iPhone 15', condition: 'new', sellingPrice: 1200, createdAt: '2024-01-15T10:00:00Z' },
        { id: 'phone-2', brandName: 'Samsung', model: 'Galaxy S24', condition: 'used', sellingPrice: 900, createdAt: '2024-01-14T10:00:00Z' },
        { id: 'phone-3', brandName: 'Google', model: 'Pixel 8', condition: 'refurbished', sellingPrice: 700, createdAt: '2024-01-13T10:00:00Z' }
      ];
      mockDashboardService.getRecentlyAddedPhones.and.returnValue(Promise.resolve(threePhones));

      component.loadAll();
      tick();
      fixture.detectChanges();

      expect(component.recentPhones().length).toBe(3);
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('iPhone 15');
      expect(compiled.textContent).toContain('Galaxy S24');
      expect(compiled.textContent).toContain('Pixel 8');
      expect(compiled.textContent).not.toContain('No phones added yet');
    }));

    it('should display all required columns: brand, model, condition, selling_price, date added', fakeAsync(() => {
      const compiled = fixture.nativeElement;

      // Check table headers
      const headers = compiled.querySelectorAll('th');
      const headerTexts = Array.from(headers).map((h: any) => h.textContent.trim());

      expect(headerTexts).toContain('Brand');
      expect(headerTexts).toContain('Model');
      expect(headerTexts).toContain('Condition');
      expect(headerTexts).toContain('Selling Price');
      expect(headerTexts).toContain('Date Added');
    }));

    it('should display condition with proper tag and color coding', fakeAsync(() => {
      const compiled = fixture.nativeElement;
      const tags = compiled.querySelectorAll('p-tag');

      expect(tags.length).toBeGreaterThan(0);
      // Verify at least one tag exists for conditions
      expect(compiled.textContent).toContain('New');
    }));

    it('should display selling price in currency format', fakeAsync(() => {
      const compiled = fixture.nativeElement;
      // Price should be formatted with currency symbol
      expect(compiled.textContent).toContain('$1,200.00');
    }));

    it('should have table with proper accessibility attributes', fakeAsync(() => {
      const table = fixture.nativeElement.querySelector('p-table');
      expect(table).toBeTruthy();
      expect(table.getAttribute('ariaLabel')).toBe('Recently added phones table');
    }));

    it('should display View All button in header', fakeAsync(() => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('View All');
    }));

    it('should navigate to inventory on View All click', fakeAsync(() => {
      component.navigateToInventory();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/inventory']);
    }));

    it('should display Add Phone button in empty state', fakeAsync(() => {
      mockDashboardService.getRecentlyAddedPhones.and.returnValue(Promise.resolve([]));
      component.loadAll();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Add Phone');
    }));

    it('should navigate to add phone on button click', fakeAsync(() => {
      component.navigateToAddPhone();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/inventory/new']);
    }));

    it('should display edit icon in each row', fakeAsync(() => {
      const icons = fixture.nativeElement.querySelectorAll('.pi-pencil');
      expect(icons.length).toBe(2); // 2 phones in mock data
    }));
  });

  describe('charts', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should compute hasSalesData correctly', () => {
      expect(component.hasSalesData()).toBe(true);
    });

    it('should compute hasStockData correctly', () => {
      expect(component.hasStockData()).toBe(true);
    });

    it('should return false for hasSalesData when no revenue', fakeAsync(() => {
      mockDashboardService.getSalesByDateRange.and.returnValue(
        Promise.resolve([{ month: '2024-01', count: 0, revenue: 0 }])
      );

      component.loadAll();
      tick();

      expect(component.hasSalesData()).toBe(false);
    }));

    it('should return false for hasStockData when no stock by brand', fakeAsync(() => {
      mockDashboardService.getStockByBrand.and.returnValue(Promise.resolve([]));

      component.loadAll();
      tick();

      expect(component.hasStockData()).toBe(false);
    }));

    it('should generate correct sales chart data', () => {
      const chartData = component.salesChartData();

      expect(chartData.labels).toEqual(['Jan 2024', 'Feb 2024']);
      expect(chartData.datasets[0].data).toEqual([6000, 6000]);
    });

    it('should generate correct stock chart data', () => {
      const chartData = component.stockChartData();

      expect(chartData.labels).toContain('Apple (15)');
      expect(chartData.labels).toContain('Samsung (10)');
      expect(chartData.datasets[0].data).toEqual([15, 10]);
    });

    it('should show empty state for sales chart when no data', fakeAsync(() => {
      mockDashboardService.getSalesByDateRange.and.returnValue(Promise.resolve([]));

      component.loadAll();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('No sales data available');
    }));

    it('should show empty state for stock chart when no data', fakeAsync(() => {
      mockDashboardService.getStockByBrand.and.returnValue(Promise.resolve([]));

      component.loadAll();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('No stock data available');
    }));

    it('should generate theme-aware sales chart options', () => {
      const options = component.salesChartOptions();

      expect(options.responsive).toBe(true);
      expect(options.maintainAspectRatio).toBe(false);
      expect(options.plugins.legend.display).toBe(false);
      expect(options.scales.y.beginAtZero).toBe(true);
      // Light theme colors
      expect(options.scales.y.ticks.color).toBe('#475569');
      expect(options.scales.y.grid.color).toBe('rgba(0, 0, 0, 0.05)');
    });

    it('should generate theme-aware stock chart options', () => {
      const options = component.stockChartOptions();

      expect(options.responsive).toBe(true);
      expect(options.maintainAspectRatio).toBe(false);
      expect(options.cutout).toBe('60%');
      expect(options.plugins.legend.position).toBe('bottom');
      // Light theme colors
      expect(options.plugins.legend.labels.color).toBe('#475569');
    });

    it('should include theme-aware properties in chart options', () => {
      // Verify that chart options include theme-related properties
      const salesOptions = component.salesChartOptions();
      expect(salesOptions.scales.y.ticks).toBeDefined();
      expect(salesOptions.scales.y.ticks.color).toBeDefined();
      expect(salesOptions.scales.y.grid.color).toBeDefined();
      expect(salesOptions.scales.x.ticks.color).toBeDefined();

      const stockOptions = component.stockChartOptions();
      expect(stockOptions.plugins.legend.labels).toBeDefined();
      expect(stockOptions.plugins.legend.labels.color).toBeDefined();

      const stockChartData = component.stockChartData();
      expect(stockChartData.datasets[0].borderColor).toBeDefined();
    });

  });

  describe('charts with dark theme', () => {
    beforeEach(async () => {
      mockThemeService.isDark.and.returnValue(true);

      await TestBed.resetTestingModule().configureTestingModule({
        imports: [DashboardComponent, NoopAnimationsModule],
        providers: [
          { provide: DashboardService, useValue: mockDashboardService },
          { provide: StockAlertService, useValue: mockStockAlertService },
          { provide: ToastService, useValue: mockToastService },
          { provide: ThemeService, useValue: mockThemeService },
          { provide: Router, useValue: mockRouter }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
    });

    it('should generate dark theme sales chart options', () => {
      const options = component.salesChartOptions();

      expect(options.scales.y.ticks.color).toBe('#E2E8F0');
      expect(options.scales.y.grid.color).toBe('rgba(255, 255, 255, 0.1)');
      expect(options.scales.x.ticks.color).toBe('#E2E8F0');
    });

    it('should generate dark theme stock chart options', () => {
      const options = component.stockChartOptions();

      expect(options.plugins.legend.labels.color).toBe('#E2E8F0');
    });

    it('should generate dark theme border color for stock chart', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const chartData = component.stockChartData();
      expect(chartData.datasets[0].borderColor).toBe('#1E293B');
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

  describe('stock alerts', () => {
    it('should load stock alerts on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockStockAlertService.getAlerts).toHaveBeenCalled();
    }));

    it('should store stock alert config', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.stockAlertConfig()).toBeTruthy();
      expect(component.stockAlertConfig()?.lowStockThreshold).toBe(5);
    }));

    it('should reload alerts when config is saved', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      mockStockAlertService.getAlerts.calls.reset();

      component.onAlertConfigSaved();
      tick();

      expect(mockStockAlertService.getAlerts).toHaveBeenCalled();
    }));

    it('should show error toast when alert reload fails', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      mockStockAlertService.getAlerts.and.returnValue(Promise.reject(new Error('Alert error')));

      component.onAlertConfigSaved();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Alert Error', 'Alert error');
    }));
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

  describe('date range label computation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show formatted date range label when dates are set', () => {
      component.selectedDateRange = DashboardDateRange.LAST_30_DAYS;
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
});
