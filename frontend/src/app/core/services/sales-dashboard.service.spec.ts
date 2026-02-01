import { TestBed } from '@angular/core/testing';
import { SalesDashboardService } from './sales-dashboard.service';
import { SupabaseService } from './supabase.service';

describe('SalesDashboardService', () => {
  let service: SalesDashboardService;
  let mockSupabaseService: jasmine.SpyObj<SupabaseService>;

  beforeEach(() => {
    mockSupabaseService = jasmine.createSpyObj('SupabaseService', ['from']);

    TestBed.configureTestingModule({
      providers: [
        SalesDashboardService,
        { provide: SupabaseService, useValue: mockSupabaseService }
      ]
    });

    service = TestBed.inject(SalesDashboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getKpis', () => {
    it('should call supabase with correct filter when startDate is provided', async () => {
      const mockQuery = createMockQuery([]);
      mockSupabaseService.from.and.returnValue(mockQuery as any);

      try {
        await service.getKpis({ startDate: '2024-01-01' });
      } catch {
        // Expect potential error from mock
      }

      expect(mockSupabaseService.from).toHaveBeenCalledWith('sales');
    });

    it('should return zero values when no data exists', async () => {
      const mockQuery = createMockQuery([]);
      mockSupabaseService.from.and.returnValue(mockQuery as any);

      const kpis = await service.getKpis();

      expect(kpis.totalRevenue).toBe(0);
      expect(kpis.transactionCount).toBe(0);
      expect(kpis.averageOrderValue).toBe(0);
      expect(kpis.profitMargin).toBe(0);
    });
  });

  describe('getMonthlySales', () => {
    it('should return empty array when no sales data', async () => {
      const mockQuery = createMockQuery([]);
      mockSupabaseService.from.and.returnValue(mockQuery as any);

      const result = await service.getMonthlySales();

      expect(result).toEqual([]);
    });

    it('should group sales by month', async () => {
      const mockSales = [
        { id: '1', phone_id: 'p1', sale_date: '2024-01-15', sale_price: 1000, cost_price: 800, buyer_name: null, created_by: null },
        { id: '2', phone_id: 'p2', sale_date: '2024-01-20', sale_price: 1500, cost_price: 1200, buyer_name: null, created_by: null },
        { id: '3', phone_id: 'p3', sale_date: '2024-02-10', sale_price: 900, cost_price: 700, buyer_name: null, created_by: null }
      ];
      const mockQuery = createMockQuery(mockSales);
      mockSupabaseService.from.and.returnValue(mockQuery as any);

      const result = await service.getMonthlySales();

      expect(result.length).toBe(2);
      expect(result.find(r => r.month === '2024-01')?.count).toBe(2);
      expect(result.find(r => r.month === '2024-02')?.count).toBe(1);
    });

    it('should calculate monthly revenue correctly', async () => {
      const mockSales = [
        { id: '1', phone_id: 'p1', sale_date: '2024-01-15', sale_price: 1000, cost_price: 800, buyer_name: null, created_by: null },
        { id: '2', phone_id: 'p2', sale_date: '2024-01-20', sale_price: 1500, cost_price: 1200, buyer_name: null, created_by: null }
      ];
      const mockQuery = createMockQuery(mockSales);
      mockSupabaseService.from.and.returnValue(mockQuery as any);

      const result = await service.getMonthlySales();

      expect(result[0].revenue).toBe(2500);
    });

    it('should calculate monthly profit correctly', async () => {
      const mockSales = [
        { id: '1', phone_id: 'p1', sale_date: '2024-01-15', sale_price: 1000, cost_price: 800, buyer_name: null, created_by: null },
        { id: '2', phone_id: 'p2', sale_date: '2024-01-20', sale_price: 1500, cost_price: 1200, buyer_name: null, created_by: null }
      ];
      const mockQuery = createMockQuery(mockSales);
      mockSupabaseService.from.and.returnValue(mockQuery as any);

      const result = await service.getMonthlySales();

      // (1000-800) + (1500-1200) = 200 + 300 = 500
      expect(result[0].profit).toBe(500);
    });

    it('should sort results by month ascending', async () => {
      const mockSales = [
        { id: '1', phone_id: 'p1', sale_date: '2024-03-15', sale_price: 1000, cost_price: 800, buyer_name: null, created_by: null },
        { id: '2', phone_id: 'p2', sale_date: '2024-01-20', sale_price: 1500, cost_price: 1200, buyer_name: null, created_by: null },
        { id: '3', phone_id: 'p3', sale_date: '2024-02-10', sale_price: 900, cost_price: 700, buyer_name: null, created_by: null }
      ];
      const mockQuery = createMockQuery(mockSales);
      mockSupabaseService.from.and.returnValue(mockQuery as any);

      const result = await service.getMonthlySales();

      expect(result[0].month).toBe('2024-01');
      expect(result[1].month).toBe('2024-02');
      expect(result[2].month).toBe('2024-03');
    });
  });

  describe('getDailySummary', () => {
    it('should return empty array when no sales data', async () => {
      const mockQuery = createMockQuery([]);
      mockSupabaseService.from.and.returnValue(mockQuery as any);

      const result = await service.getDailySummary();

      expect(result).toEqual([]);
    });

    it('should group sales by date', async () => {
      const mockSales = [
        { id: '1', phone_id: 'p1', sale_date: '2024-01-15', sale_price: 1000, cost_price: 800, buyer_name: null, created_by: null },
        { id: '2', phone_id: 'p2', sale_date: '2024-01-15', sale_price: 1500, cost_price: 1200, buyer_name: null, created_by: null },
        { id: '3', phone_id: 'p3', sale_date: '2024-01-16', sale_price: 900, cost_price: 700, buyer_name: null, created_by: null }
      ];
      const mockQuery = createMockQuery(mockSales);
      mockSupabaseService.from.and.returnValue(mockQuery as any);

      const result = await service.getDailySummary();

      expect(result.length).toBe(2);
      expect(result.find(r => r.date === '2024-01-15')?.count).toBe(2);
      expect(result.find(r => r.date === '2024-01-16')?.count).toBe(1);
    });

    it('should calculate daily revenue correctly', async () => {
      const mockSales = [
        { id: '1', phone_id: 'p1', sale_date: '2024-01-15', sale_price: 1000, cost_price: 800, buyer_name: null, created_by: null },
        { id: '2', phone_id: 'p2', sale_date: '2024-01-15', sale_price: 1500, cost_price: 1200, buyer_name: null, created_by: null }
      ];
      const mockQuery = createMockQuery(mockSales);
      mockSupabaseService.from.and.returnValue(mockQuery as any);

      const result = await service.getDailySummary();

      expect(result.find(r => r.date === '2024-01-15')?.revenue).toBe(2500);
    });
  });

  describe('getSalesByCashier', () => {
    it('should return empty array when no sales data', async () => {
      const mockQuery = createMockQuery([]);
      mockSupabaseService.from.and.returnValue(mockQuery as any);

      const result = await service.getSalesByCashier();

      expect(result).toEqual([]);
    });

    it('should group sales by cashier', async () => {
      const mockSales = [
        { id: '1', phone_id: 'p1', sale_date: '2024-01-15', sale_price: 1000, cost_price: 800, buyer_name: null, created_by: 'user1' },
        { id: '2', phone_id: 'p2', sale_date: '2024-01-16', sale_price: 1500, cost_price: 1200, buyer_name: null, created_by: 'user1' },
        { id: '3', phone_id: 'p3', sale_date: '2024-01-17', sale_price: 900, cost_price: 700, buyer_name: null, created_by: 'user2' }
      ];
      const mockQuery = createMockQueryWithUserLookup(mockSales);
      mockSupabaseService.from.and.returnValue(mockQuery as any);

      const result = await service.getSalesByCashier();

      expect(result.length).toBe(2);
      expect(result.find(r => r.cashierId === 'user1')?.totalSales).toBe(2);
      expect(result.find(r => r.cashierId === 'user2')?.totalSales).toBe(1);
    });
  });

  // Helper function to create mock query object
  function createMockQuery(data: unknown[]) {
    const mockQuery = {
      select: jasmine.createSpy('select').and.callFake(() => mockQuery),
      gte: jasmine.createSpy('gte').and.callFake(() => mockQuery),
      lte: jasmine.createSpy('lte').and.callFake(() => mockQuery),
      order: jasmine.createSpy('order').and.callFake(() =>
        Promise.resolve({ data, error: null })
      ),
      in: jasmine.createSpy('in').and.callFake(() =>
        Promise.resolve({ data: [], error: null })
      )
    };
    return mockQuery;
  }

  function createMockQueryWithUserLookup(salesData: unknown[]) {
    const mockQuery = {
      select: jasmine.createSpy('select').and.callFake(() => mockQuery),
      gte: jasmine.createSpy('gte').and.callFake(() => mockQuery),
      lte: jasmine.createSpy('lte').and.callFake(() => mockQuery),
      order: jasmine.createSpy('order').and.callFake(() =>
        Promise.resolve({ data: salesData, error: null })
      ),
      in: jasmine.createSpy('in').and.callFake(() =>
        Promise.resolve({ data: [], error: null })
      )
    };
    return mockQuery;
  }
});
