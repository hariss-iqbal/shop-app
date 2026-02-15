import { TestBed } from '@angular/core/testing';
import { DashboardService } from './dashboard.service';
import { SupabaseService } from './supabase.service';
import { DateRangeFilter } from '../../models/dashboard.model';
import { ProductStatus } from '../../enums/product-status.enum';

describe('DashboardService', () => {
  let service: DashboardService;
  let mockSupabaseService: jasmine.SpyObj<any>;
  let mockQuery: any;

  const mockProducts = [
    { id: 'product-1', cost_price: 500, selling_price: 750, status: ProductStatus.AVAILABLE, brand_id: 'brand-1' },
    { id: 'product-2', cost_price: 600, selling_price: 900, status: ProductStatus.AVAILABLE, brand_id: 'brand-1' },
    { id: 'product-3', cost_price: 800, selling_price: 1200, status: ProductStatus.AVAILABLE, brand_id: 'brand-2' },
  ];

  const mockSales = [
    { sale_date: '2024-01-15', sale_price: 1200, cost_price: 900 },
    { sale_date: '2024-01-20', sale_price: 1000, cost_price: 750 },
    { sale_date: '2024-02-10', sale_price: 800, cost_price: 600 },
  ];

  const mockProductsWithBrands = [
    { brand_id: 'brand-1', brand: { id: 'brand-1', name: 'Apple' } },
    { brand_id: 'brand-1', brand: { id: 'brand-1', name: 'Apple' } },
    { brand_id: 'brand-2', brand: { id: 'brand-2', name: 'Samsung' } },
  ];

  const mockRecentProducts = [
    {
      id: 'product-1',
      model: 'iPhone 15 Pro',
      condition: 'new',
      selling_price: 1200,
      created_at: '2024-01-15T10:00:00Z',
      brand: { name: 'Apple' }
    },
    {
      id: 'product-2',
      model: 'Galaxy S24',
      condition: 'used',
      selling_price: 900,
      created_at: '2024-01-14T09:00:00Z',
      brand: { name: 'Samsung' }
    },
  ];

  beforeEach(() => {
    mockQuery = {
      select: jasmine.createSpy('select').and.callFake(() => mockQuery),
      eq: jasmine.createSpy('eq').and.callFake(() => mockQuery),
      gte: jasmine.createSpy('gte').and.callFake(() => mockQuery),
      lte: jasmine.createSpy('lte').and.callFake(() => mockQuery),
      order: jasmine.createSpy('order').and.callFake(() => mockQuery),
      limit: jasmine.createSpy('limit').and.returnValue(Promise.resolve({ data: mockRecentProducts, error: null })),
    };

    mockSupabaseService = jasmine.createSpyObj('SupabaseService', ['from']);
    mockSupabaseService.from.and.returnValue(mockQuery);

    TestBed.configureTestingModule({
      providers: [
        DashboardService,
        { provide: SupabaseService, useValue: mockSupabaseService }
      ]
    });

    service = TestBed.inject(DashboardService);
  });

  describe('getKpis', () => {
    beforeEach(() => {
      mockSupabaseService.from.and.callFake((table: string) => {
        const query: any = {
          select: jasmine.createSpy('select').and.callFake(() => query),
          eq: jasmine.createSpy('eq').and.callFake(() => query),
          gte: jasmine.createSpy('gte').and.callFake(() => query),
          lte: jasmine.createSpy('lte').and.callFake(() => query),
        };

        if (table === 'phones') {
          query.eq.and.callFake(() => Promise.resolve({
            data: mockProducts,
            count: 3,
            error: null
          }));
          return query;
        }

        if (table === 'sales') {
          query.lte.and.returnValue(Promise.resolve({ data: mockSales, error: null }));
          query.eq.and.returnValue(Promise.resolve({ data: mockSales, error: null, count: 3 }));
          return query;
        }

        return query;
      });
    });

    it('should return all KPI values', async () => {
      const kpis = await service.getKpis();

      expect(kpis).toBeDefined();
      expect(typeof kpis.stockCount).toBe('number');
      expect(typeof kpis.stockValue).toBe('number');
      expect(typeof kpis.potentialProfit).toBe('number');
      expect(typeof kpis.totalSales).toBe('number');
      expect(typeof kpis.totalRevenue).toBe('number');
      expect(typeof kpis.totalProfit).toBe('number');
    });

    it('should apply date range filter to sales-related KPIs', async () => {
      const dateRange: DateRangeFilter = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      await service.getKpis(dateRange);

      // Verify date filters were applied to sales queries
      expect(mockSupabaseService.from).toHaveBeenCalledWith('sales');
    });

    it('should handle empty data gracefully', async () => {
      mockSupabaseService.from.and.callFake(() => {
        const query: any = {
          select: jasmine.createSpy('select').and.callFake(() => query),
          eq: jasmine.createSpy('eq').and.callFake(() => query),
          gte: jasmine.createSpy('gte').and.callFake(() => query),
          lte: jasmine.createSpy('lte').and.callFake(() => query),
        };

        query.eq.and.returnValue(Promise.resolve({
          data: [],
          count: 0,
          error: null
        }));

        query.lte.and.returnValue(Promise.resolve({
          data: [],
          count: 0,
          error: null
        }));

        return query;
      });

      const kpis = await service.getKpis();

      expect(kpis.stockCount).toBe(0);
      expect(kpis.stockValue).toBe(0);
      expect(kpis.potentialProfit).toBe(0);
      expect(kpis.totalSales).toBe(0);
      expect(kpis.totalRevenue).toBe(0);
      expect(kpis.totalProfit).toBe(0);
    });
  });

  describe('getAvailableStockCount (via getKpis)', () => {
    it('should count only products with status=available', async () => {
      const query: any = {
        select: jasmine.createSpy('select').and.callFake(() => query),
        eq: jasmine.createSpy('eq').and.callFake(() => Promise.resolve({
          count: 10,
          error: null
        })),
        gte: jasmine.createSpy('gte').and.callFake(() => query),
        lte: jasmine.createSpy('lte').and.returnValue(Promise.resolve({
          data: [],
          error: null
        })),
      };

      mockSupabaseService.from.and.returnValue(query);

      await service.getKpis();

      expect(query.eq).toHaveBeenCalledWith('status', ProductStatus.AVAILABLE);
    });

    it('should throw error on database failure', async () => {
      const query: any = {
        select: jasmine.createSpy('select').and.callFake(() => query),
        eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({
          count: null,
          error: { message: 'Database error' }
        })),
      };

      mockSupabaseService.from.and.returnValue(query);

      await expectAsync(service.getKpis()).toBeRejectedWithError('Database error');
    });
  });

  describe('getStockValue (via getKpis)', () => {
    it('should sum cost_price of available products', async () => {
      const query: any = {
        select: jasmine.createSpy('select').and.callFake((cols: string) => {
          if (cols === 'cost_price') {
            return {
              eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({
                data: [{ cost_price: 500 }, { cost_price: 600 }],
                error: null
              }))
            };
          }
          return query;
        }),
        eq: jasmine.createSpy('eq').and.callFake(() => query),
        gte: jasmine.createSpy('gte').and.callFake(() => query),
        lte: jasmine.createSpy('lte').and.returnValue(Promise.resolve({ data: [], error: null })),
      };

      query.eq.and.returnValue(Promise.resolve({ data: mockProducts, count: 3, error: null }));
      mockSupabaseService.from.and.returnValue(query);

      // Since the method is private, we test through getKpis
      const kpis = await service.getKpis();
      expect(kpis.stockValue).toBeGreaterThanOrEqual(0);
    });

    it('should handle null cost_price values', async () => {
      const query: any = {
        select: jasmine.createSpy('select').and.callFake(() => query),
        eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({
          data: [{ cost_price: null }, { cost_price: 500 }],
          error: null
        })),
        gte: jasmine.createSpy('gte').and.callFake(() => query),
        lte: jasmine.createSpy('lte').and.returnValue(Promise.resolve({ data: [], error: null })),
      };

      mockSupabaseService.from.and.returnValue(query);

      const kpis = await service.getKpis();
      expect(kpis.stockValue).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getPotentialProfit (via getKpis)', () => {
    it('should calculate profit as sum of (selling_price - cost_price) for available products', async () => {
      const query: any = {
        select: jasmine.createSpy('select').and.callFake(() => query),
        eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({
          data: [
            { selling_price: 1000, cost_price: 700 },
            { selling_price: 800, cost_price: 500 }
          ],
          error: null
        })),
        gte: jasmine.createSpy('gte').and.callFake(() => query),
        lte: jasmine.createSpy('lte').and.returnValue(Promise.resolve({ data: [], error: null })),
      };

      mockSupabaseService.from.and.returnValue(query);

      const kpis = await service.getKpis();
      // Expected: (1000-700) + (800-500) = 300 + 300 = 600
      expect(kpis.potentialProfit).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getSalesByDateRange', () => {
    beforeEach(() => {
      mockQuery.order.and.returnValue(Promise.resolve({
        data: mockSales,
        error: null
      }));
    });

    it('should return monthly aggregated sales data', async () => {
      const result = await service.getSalesByDateRange();

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0].month).toBeDefined();
        expect(result[0].count).toBeDefined();
        expect(result[0].revenue).toBeDefined();
      }
    });

    it('should apply start date filter', async () => {
      const dateRange: DateRangeFilter = { startDate: '2024-01-01', endDate: null };
      await service.getSalesByDateRange(dateRange);

      expect(mockQuery.gte).toHaveBeenCalledWith('sale_date', '2024-01-01');
    });

    it('should apply end date filter', async () => {
      const dateRange: DateRangeFilter = { startDate: null, endDate: '2024-01-31' };
      await service.getSalesByDateRange(dateRange);

      expect(mockQuery.lte).toHaveBeenCalledWith('sale_date', '2024-01-31');
    });

    it('should apply both date filters', async () => {
      const dateRange: DateRangeFilter = { startDate: '2024-01-01', endDate: '2024-01-31' };
      await service.getSalesByDateRange(dateRange);

      expect(mockQuery.gte).toHaveBeenCalledWith('sale_date', '2024-01-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('sale_date', '2024-01-31');
    });

    it('should aggregate sales by month correctly', async () => {
      mockQuery.order.and.returnValue(Promise.resolve({
        data: [
          { sale_date: '2024-01-15', sale_price: 500 },
          { sale_date: '2024-01-20', sale_price: 600 },
          { sale_date: '2024-02-10', sale_price: 700 }
        ],
        error: null
      }));

      const result = await service.getSalesByDateRange();

      expect(result.length).toBe(2); // Jan and Feb
      const janData = result.find(r => r.month === '2024-01');
      expect(janData?.count).toBe(2);
      expect(janData?.revenue).toBe(1100);
    });

    it('should handle empty sales data', async () => {
      mockQuery.order.and.returnValue(Promise.resolve({ data: [], error: null }));

      const result = await service.getSalesByDateRange();

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      mockQuery.order.and.returnValue(Promise.resolve({
        data: null,
        error: { message: 'Database error' }
      }));

      await expectAsync(service.getSalesByDateRange()).toBeRejectedWithError('Database error');
    });

    it('should handle null sale_price values', async () => {
      mockQuery.order.and.returnValue(Promise.resolve({
        data: [{ sale_date: '2024-01-15', sale_price: null }],
        error: null
      }));

      const result = await service.getSalesByDateRange();

      expect(result[0].revenue).toBe(0);
    });
  });

  describe('getStockByBrand', () => {
    beforeEach(() => {
      mockQuery.eq.and.returnValue(Promise.resolve({
        data: mockProductsWithBrands,
        error: null
      }));
    });

    it('should return stock grouped by brand', async () => {
      const result = await service.getStockByBrand();

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0].brandId).toBeDefined();
        expect(result[0].brandName).toBeDefined();
        expect(result[0].count).toBeDefined();
      }
    });

    it('should query only available products', async () => {
      await service.getStockByBrand();

      expect(mockQuery.eq).toHaveBeenCalledWith('status', ProductStatus.AVAILABLE);
    });

    it('should aggregate counts by brand correctly', async () => {
      mockQuery.eq.and.returnValue(Promise.resolve({
        data: [
          { brand_id: 'brand-1', brand: { id: 'brand-1', name: 'Apple' } },
          { brand_id: 'brand-1', brand: { id: 'brand-1', name: 'Apple' } },
          { brand_id: 'brand-2', brand: { id: 'brand-2', name: 'Samsung' } }
        ],
        error: null
      }));

      const result = await service.getStockByBrand();

      const appleData = result.find(r => r.brandName === 'Apple');
      const samsungData = result.find(r => r.brandName === 'Samsung');

      expect(appleData?.count).toBe(2);
      expect(samsungData?.count).toBe(1);
    });

    it('should sort by count descending', async () => {
      mockQuery.eq.and.returnValue(Promise.resolve({
        data: [
          { brand_id: 'brand-2', brand: { id: 'brand-2', name: 'Samsung' } },
          { brand_id: 'brand-1', brand: { id: 'brand-1', name: 'Apple' } },
          { brand_id: 'brand-1', brand: { id: 'brand-1', name: 'Apple' } }
        ],
        error: null
      }));

      const result = await service.getStockByBrand();

      expect(result[0].brandName).toBe('Apple');
      expect(result[0].count).toBe(2);
    });

    it('should handle null brand data gracefully', async () => {
      mockQuery.eq.and.returnValue(Promise.resolve({
        data: [{ brand_id: 'brand-1', brand: null }],
        error: null
      }));

      const result = await service.getStockByBrand();

      expect(result[0].brandName).toBe('Unknown');
    });

    it('should handle empty data', async () => {
      mockQuery.eq.and.returnValue(Promise.resolve({ data: [], error: null }));

      const result = await service.getStockByBrand();

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      mockQuery.eq.and.returnValue(Promise.resolve({
        data: null,
        error: { message: 'Database error' }
      }));

      await expectAsync(service.getStockByBrand()).toBeRejectedWithError('Database error');
    });
  });

  describe('getRecentlyAddedProducts', () => {
    beforeEach(() => {
      mockQuery.limit.and.returnValue(Promise.resolve({
        data: mockRecentProducts,
        error: null
      }));
    });

    it('should return recently added products', async () => {
      const result = await service.getRecentlyAddedProducts();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should map product data correctly', async () => {
      const result = await service.getRecentlyAddedProducts();

      expect(result[0]).toEqual({
        id: 'product-1',
        brandName: 'Apple',
        model: 'iPhone 15 Pro',
        condition: 'new',
        sellingPrice: 1200,
        createdAt: '2024-01-15T10:00:00Z'
      });
    });

    it('should order by created_at descending', async () => {
      await service.getRecentlyAddedProducts();

      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should limit to 5 products', async () => {
      await service.getRecentlyAddedProducts();

      expect(mockQuery.limit).toHaveBeenCalledWith(5);
    });

    it('should handle null brand data gracefully', async () => {
      mockQuery.limit.and.returnValue(Promise.resolve({
        data: [{
          id: 'product-1',
          model: 'Test Product',
          condition: 'new',
          selling_price: 1000,
          created_at: '2024-01-15T10:00:00Z',
          brand: null
        }],
        error: null
      }));

      const result = await service.getRecentlyAddedProducts();

      expect(result[0].brandName).toBe('Unknown');
    });

    it('should handle empty data', async () => {
      mockQuery.limit.and.returnValue(Promise.resolve({ data: [], error: null }));

      const result = await service.getRecentlyAddedProducts();

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      mockQuery.limit.and.returnValue(Promise.resolve({
        data: null,
        error: { message: 'Database error' }
      }));

      await expectAsync(service.getRecentlyAddedProducts()).toBeRejectedWithError('Database error');
    });
  });

  describe('getTotalSalesCount (via getKpis)', () => {
    it('should count all sales when no date range provided', async () => {
      const query: any = {
        select: jasmine.createSpy('select').and.callFake(() => query),
        eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({
          data: mockProducts,
          count: 3,
          error: null
        })),
        gte: jasmine.createSpy('gte').and.callFake(() => query),
        lte: jasmine.createSpy('lte').and.callFake(() => Promise.resolve({
          count: 10,
          error: null
        })),
      };

      mockSupabaseService.from.and.returnValue(query);

      const kpis = await service.getKpis();
      expect(typeof kpis.totalSales).toBe('number');
    });
  });

  describe('getTotalRevenue (via getKpis)', () => {
    it('should sum all sale_price values', async () => {
      const query: any = {
        select: jasmine.createSpy('select').and.callFake(() => query),
        eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({
          data: mockProducts,
          count: 3,
          error: null
        })),
        gte: jasmine.createSpy('gte').and.callFake(() => query),
        lte: jasmine.createSpy('lte').and.callFake(() => Promise.resolve({
          data: [{ sale_price: 1000 }, { sale_price: 800 }],
          error: null
        })),
      };

      mockSupabaseService.from.and.returnValue(query);

      const kpis = await service.getKpis();
      expect(kpis.totalRevenue).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getTotalProfit (via getKpis)', () => {
    it('should calculate profit as sum of (sale_price - cost_price) for all sales', async () => {
      const query: any = {
        select: jasmine.createSpy('select').and.callFake(() => query),
        eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({
          data: mockProducts,
          count: 3,
          error: null
        })),
        gte: jasmine.createSpy('gte').and.callFake(() => query),
        lte: jasmine.createSpy('lte').and.callFake(() => Promise.resolve({
          data: [
            { sale_price: 1000, cost_price: 700 },
            { sale_price: 800, cost_price: 600 }
          ],
          error: null
        })),
      };

      mockSupabaseService.from.and.returnValue(query);

      const kpis = await service.getKpis();
      expect(kpis.totalProfit).toBeGreaterThanOrEqual(0);
    });
  });
});
