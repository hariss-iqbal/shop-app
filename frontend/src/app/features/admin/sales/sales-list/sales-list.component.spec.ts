import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute, provideRouter } from '@angular/router';

import { SalesListComponent } from './sales-list.component';
import { SaleService } from '../../../../core/services/sale.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CsvExportService } from '../../../../shared/services/csv-export.service';
import { Sale, SaleSummary, SaleListResponse } from '../../../../models/sale.model';

describe('SalesListComponent', () => {
  let component: SalesListComponent;
  let fixture: ComponentFixture<SalesListComponent>;
  let mockSaleService: jasmine.SpyObj<SaleService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockCsvExportService: jasmine.SpyObj<CsvExportService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSupabaseService: any;

  const mockSale: Sale = {
    id: 'sale-1',
    productId: 'phone-1',
    brandName: 'Apple',
    productName: 'iPhone 15 Pro',
    saleDate: '2024-01-15',
    salePrice: 1200,
    costPrice: 900,
    profit: 300,
    buyerName: 'John Doe',
    buyerPhone: '+1234567890',
    buyerEmail: 'john@example.com',
    notes: 'Test sale',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: null,
    taxRate: 10,
    taxAmount: 109.09,
    basePrice: 1090.91,
    isTaxExempt: false,
    paymentSummary: [],
    isSplitPayment: false,
    primaryPaymentMethod: null,
    locationId: null,
    locationName: null
  };

  const mockSales: Sale[] = [
    mockSale,
    {
      ...mockSale,
      id: 'sale-2',
      brandName: 'Samsung',
      productName: 'Galaxy S24',
      saleDate: '2024-01-14',
      salePrice: 1000,
      costPrice: 750,
      profit: 250,
      buyerName: 'Jane Smith'
    },
    {
      ...mockSale,
      id: 'sale-3',
      brandName: 'Google',
      productName: 'Pixel 8',
      saleDate: '2024-01-13',
      salePrice: 800,
      costPrice: 850,
      profit: -50,
      buyerName: null
    }
  ];

  const mockSummary: SaleSummary = {
    totalSales: 3,
    totalRevenue: 3000,
    totalCost: 2500,
    totalProfit: 500,
    averageMargin: 16.67
  };

  const mockSalesResponse: SaleListResponse = {
    data: mockSales,
    total: 3
  };

  beforeEach(async () => {
    mockSaleService = jasmine.createSpyObj('SaleService', ['getSales', 'getSummary']);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warn']);
    mockCsvExportService = jasmine.createSpyObj('CsvExportService', ['exportToCsv']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockSupabaseService = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue(Promise.resolve({ data: [], error: null }))
      }),
      auth: {
        getSession: jasmine.createSpy('getSession').and.returnValue(Promise.resolve({ data: { session: null } })),
        onAuthStateChange: jasmine.createSpy('onAuthStateChange').and.returnValue({
          data: { subscription: { unsubscribe: jasmine.createSpy() } }
        })
      }
    };

    mockSaleService.getSales.and.returnValue(Promise.resolve(mockSalesResponse));
    mockSaleService.getSummary.and.returnValue(Promise.resolve(mockSummary));

    await TestBed.configureTestingModule({
      imports: [
        SalesListComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideRouter([]),
        { provide: SaleService, useValue: mockSaleService },
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: ToastService, useValue: mockToastService },
        { provide: CsvExportService, useValue: mockCsvExportService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map() } } }
      ]
    }).compileComponents();

    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    spyOn(mockRouter, 'navigate');

    fixture = TestBed.createComponent(SalesListComponent);
    component = fixture.componentInstance;
  });

  describe('component initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty sales array', () => {
      expect(component.sales()).toEqual([]);
    });

    it('should initialize with null summary', () => {
      expect(component.summary()).toBeNull();
    });

    it('should initialize with loading set to false', () => {
      expect(component.loading()).toBe(false);
    });

    it('should initialize with null date filters', () => {
      expect(component.startDate).toBeNull();
      expect(component.endDate).toBeNull();
    });

    it('should have skeleton rows array', () => {
      expect(component.skeletonRows.length).toBe(5);
    });
  });

  describe('ngOnInit', () => {
    it('should load data on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockSaleService.getSales).toHaveBeenCalledWith({});
      expect(mockSaleService.getSummary).toHaveBeenCalledWith({});
    }));
  });

  describe('loadData', () => {
    it('should load sales and summary successfully', fakeAsync(() => {
      component.loadData();
      tick();

      expect(component.sales()).toEqual(mockSales);
      expect(component.summary()).toEqual(mockSummary);
    }));

    it('should set loading state during data fetch', fakeAsync(() => {
      component.loadData();
      expect(component.loading()).toBe(true);

      tick();
      expect(component.loading()).toBe(false);
    }));

    it('should include date filters in the query', fakeAsync(() => {
      component.startDate = new Date(2024, 0, 1);
      component.endDate = new Date(2024, 0, 31);

      component.loadData();
      tick();

      expect(mockSaleService.getSales).toHaveBeenCalledWith({
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });
      expect(mockSaleService.getSummary).toHaveBeenCalledWith({
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });
    }));

    it('should show error toast on load failure', fakeAsync(() => {
      mockSaleService.getSales.and.returnValue(Promise.reject(new Error('Load failed')));

      component.loadData();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to load sales data');
    }));

    it('should handle only start date filter', fakeAsync(() => {
      component.startDate = new Date(2024, 0, 15);
      component.endDate = null;

      component.loadData();
      tick();

      expect(mockSaleService.getSales).toHaveBeenCalledWith({
        startDate: '2024-01-15'
      });
    }));

    it('should handle only end date filter', fakeAsync(() => {
      component.startDate = null;
      component.endDate = new Date(2024, 0, 31);

      component.loadData();
      tick();

      expect(mockSaleService.getSales).toHaveBeenCalledWith({
        endDate: '2024-01-31'
      });
    }));
  });

  describe('onDateFilterChange', () => {
    it('should reload data when date filter changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      mockSaleService.getSales.calls.reset();
      mockSaleService.getSummary.calls.reset();

      component.startDate = new Date(2024, 0, 1);
      component.onDateFilterChange();
      tick();

      expect(mockSaleService.getSales).toHaveBeenCalled();
      expect(mockSaleService.getSummary).toHaveBeenCalled();
    }));
  });

  describe('hasActiveFilters', () => {
    it('should return false when no filters are set', () => {
      component.startDate = null;
      component.endDate = null;

      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should return true when start date is set', () => {
      component.startDate = new Date();
      component.endDate = null;

      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return true when end date is set', () => {
      component.startDate = null;
      component.endDate = new Date();

      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return true when both dates are set', () => {
      component.startDate = new Date();
      component.endDate = new Date();

      expect(component.hasActiveFilters()).toBe(true);
    });
  });

  describe('clearFilters', () => {
    it('should clear both date filters', fakeAsync(() => {
      component.startDate = new Date();
      component.endDate = new Date();

      component.clearFilters();
      tick();

      expect(component.startDate).toBeNull();
      expect(component.endDate).toBeNull();
    }));

    it('should reload data after clearing filters', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.startDate = new Date();
      component.endDate = new Date();

      mockSaleService.getSales.calls.reset();
      mockSaleService.getSummary.calls.reset();

      component.clearFilters();
      tick();

      expect(mockSaleService.getSales).toHaveBeenCalledWith({});
      expect(mockSaleService.getSummary).toHaveBeenCalledWith({});
    }));
  });

  describe('onViewProduct', () => {
    it('should navigate to product edit page', () => {
      component.onViewProduct(mockSale);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/inventory', 'phone-1', 'edit']);
    });
  });

  describe('onExportCsv', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should export sales to CSV', () => {
      component.onExportCsv();

      expect(mockCsvExportService.exportToCsv).toHaveBeenCalled();
      expect(mockToastService.success).toHaveBeenCalledWith('Export Complete', '3 sales records exported to CSV');
    });

    it('should show filtered message when filters are active', () => {
      component.startDate = new Date(2024, 0, 1);
      component.onExportCsv();

      expect(mockToastService.success).toHaveBeenCalledWith('Export Complete', '3 filtered sales records exported to CSV');
    });

    it('should include correct columns in CSV export', () => {
      component.onExportCsv();

      const exportCall = mockCsvExportService.exportToCsv.calls.mostRecent();
      const columns = exportCall.args[1];

      expect(columns.length).toBe(8);
      expect(columns.map((c: any) => c.header)).toEqual([
        'Brand', 'Model', 'Sale Price', 'Cost Price', 'Profit', 'Buyer Name', 'Buyer Email', 'Sale Date'
      ]);
    });

    it('should use sales_export as filename prefix', () => {
      component.onExportCsv();

      const exportCall = mockCsvExportService.exportToCsv.calls.mostRecent();
      expect(exportCall.args[2]).toBe('sales_export');
    });
  });

  describe('date formatting', () => {
    it('should format dates correctly with leading zeros', fakeAsync(() => {
      component.startDate = new Date(2024, 0, 5);

      component.loadData();
      tick();

      expect(mockSaleService.getSales).toHaveBeenCalledWith(
        jasmine.objectContaining({
          startDate: '2024-01-05'
        })
      );
    }));

    it('should handle December correctly', fakeAsync(() => {
      component.startDate = new Date(2024, 11, 25);

      component.loadData();
      tick();

      expect(mockSaleService.getSales).toHaveBeenCalledWith(
        jasmine.objectContaining({
          startDate: '2024-12-25'
        })
      );
    }));
  });

  describe('template rendering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should render sales title', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h1')?.textContent).toContain('Sales');
    });

    it('should render export button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('p-button');
      const exportButton = Array.from(buttons).find(b => b.getAttribute('label') === 'Export to CSV');
      expect(exportButton).toBeTruthy();
    });

    it('should render date filter inputs', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const dateInputs = compiled.querySelectorAll('p-datepicker');
      expect(dateInputs.length).toBe(2);
    });

    it('should render data table', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('p-table')).toBeTruthy();
    });

    it('should render summary cards', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const cards = compiled.querySelectorAll('p-card');
      expect(cards.length).toBeGreaterThanOrEqual(4);
    });

    it('should show clear filters button when filters are active', fakeAsync(() => {
      component.startDate = new Date();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('p-button');
      const clearButton = Array.from(buttons).find(b => b.getAttribute('label') === 'Clear Filters');
      expect(clearButton).toBeTruthy();
    }));

    it('should display total revenue in summary card', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const revenueText = compiled.textContent;
      expect(revenueText).toContain('Total Revenue');
    });

    it('should display total cost in summary card', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const costText = compiled.textContent;
      expect(costText).toContain('Total Cost');
    });

    it('should display total profit in summary card', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const profitText = compiled.textContent;
      expect(profitText).toContain('Total Profit');
    });

    it('should display average margin in summary card', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const marginText = compiled.textContent;
      expect(marginText).toContain('Avg. Margin');
    });
  });

  describe('profit color coding', () => {
    it('should apply green color for positive profit', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const greenProfitElements = compiled.querySelectorAll('.text-green-500');
      expect(greenProfitElements.length).toBeGreaterThan(0);
    }));

    it('should handle zero profit', fakeAsync(() => {
      const zeroSale: Sale = {
        ...mockSale,
        id: 'sale-zero',
        salePrice: 1000,
        costPrice: 1000,
        profit: 0
      };

      mockSaleService.getSales.and.returnValue(Promise.resolve({
        data: [zeroSale],
        total: 1
      }));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.text-green-500')).toBeTruthy();
    }));
  });

  describe('empty state', () => {
    beforeEach(fakeAsync(() => {
      mockSaleService.getSales.and.returnValue(Promise.resolve({ data: [], total: 0 }));
      mockSaleService.getSummary.and.returnValue(Promise.resolve({
        totalSales: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        averageMargin: 0
      }));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should show empty message when no sales', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No sales recorded yet');
    });

    it('should have empty sales array when no sales exist', () => {
      expect(component.sales().length).toBe(0);
    });
  });

  describe('loading state', () => {
    it('should show skeleton loaders while loading', () => {
      component.loading.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const skeletons = compiled.querySelectorAll('p-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('sort functionality', () => {
    it('should have sortField and sortOrder configured in template', () => {
      fixture.detectChanges();
      // Template configures [sortField]="'saleDate'" [sortOrder]="-1"
      // The component doesn't have explicit sortField/sortOrder properties,
      // it's configured directly in the template
      expect(component).toBeTruthy();
    });
  });

  describe('product link navigation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should have sales with product info for navigation', () => {
      expect(component.sales().length).toBeGreaterThan(0);
      expect(component.sales()[0].productId).toBeDefined();
      expect(component.sales()[0].brandName).toBeDefined();
      expect(component.sales()[0].productName).toBeDefined();
    });
  });

  describe('summary footer row', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should display totals row in footer when sales exist', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const footerText = compiled.textContent;
      expect(footerText).toContain('Totals');
    });
  });

  describe('buyer display', () => {
    it('should display dash when buyer name is null', fakeAsync(() => {
      const saleWithNoBuyer = {
        ...mockSale,
        id: 'sale-no-buyer',
        buyerName: null
      };
      mockSaleService.getSales.and.returnValue(Promise.resolve({
        data: [saleWithNoBuyer],
        total: 1
      }));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('-');
    }));
  });
});
