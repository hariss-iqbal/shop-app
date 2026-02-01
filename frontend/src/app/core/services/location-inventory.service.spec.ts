import { TestBed } from '@angular/core/testing';
import { LocationInventoryService } from './location-inventory.service';
import { SupabaseService } from './supabase.service';

describe('LocationInventoryService', () => {
  let service: LocationInventoryService;
  let supabaseServiceSpy: jasmine.SpyObj<SupabaseService>;

  const mockInventoryData = {
    id: 'inv-123',
    phone_id: 'phone-456',
    location_id: 'loc-789',
    quantity: 10,
    min_stock_level: 5,
    max_stock_level: 50,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: null,
    phone: {
      id: 'phone-456',
      model: 'iPhone 15',
      status: 'available',
      selling_price: 999.99,
      cost_price: 750.00,
      condition: 'new',
      brand: {
        id: 'brand-123',
        name: 'Apple'
      }
    },
    location: {
      id: 'loc-789',
      name: 'Main Store',
      code: 'MAIN'
    }
  };

  const mockQueryBuilder = {
    select: jasmine.createSpy('select').and.callFake(() => mockQueryBuilder),
    eq: jasmine.createSpy('eq').and.callFake(() => mockQueryBuilder),
    gt: jasmine.createSpy('gt').and.callFake(() => mockQueryBuilder),
    lte: jasmine.createSpy('lte').and.callFake(() => mockQueryBuilder),
    order: jasmine.createSpy('order').and.callFake(() => mockQueryBuilder),
    single: jasmine.createSpy('single').and.callFake(() => Promise.resolve({ data: mockInventoryData, error: null })),
    update: jasmine.createSpy('update').and.callFake(() => mockQueryBuilder),
    rpc: jasmine.createSpy('rpc')
  };

  beforeEach(() => {
    const supabaseSpy = jasmine.createSpyObj('SupabaseService', ['from', 'rpc']);
    supabaseSpy.from.and.returnValue(mockQueryBuilder);
    supabaseSpy.rpc.and.returnValue(Promise.resolve({ data: { success: true }, error: null }) as any);

    TestBed.configureTestingModule({
      providers: [
        LocationInventoryService,
        { provide: SupabaseService, useValue: supabaseSpy }
      ]
    });

    service = TestBed.inject(LocationInventoryService);
    supabaseServiceSpy = TestBed.inject(SupabaseService) as jasmine.SpyObj<SupabaseService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getInventoryByLocation', () => {
    beforeEach(() => {
      mockQueryBuilder.order.and.returnValue(
        Promise.resolve({ data: [mockInventoryData], error: null, count: 1 })
      );
    });

    it('should return inventory for a location', async () => {
      const result = await service.getInventoryByLocation('loc-789');

      expect(supabaseServiceSpy.from).toHaveBeenCalledWith('location_inventory');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('location_id', 'loc-789');
      expect(result.data.length).toBe(1);
      expect(result.data[0].quantity).toBe(10);
    });

    it('should filter by quantity greater than 0', async () => {
      await service.getInventoryByLocation('loc-789');

      expect(mockQueryBuilder.gt).toHaveBeenCalledWith('quantity', 0);
    });

    it('should include stats in response', async () => {
      const result = await service.getInventoryByLocation('loc-789');

      expect(result.stats).toBeDefined();
    });
  });

  describe('getInventoryByPhone', () => {
    beforeEach(() => {
      mockQueryBuilder.eq.and.returnValue(
        Promise.resolve({ data: [mockInventoryData], error: null })
      );
    });

    it('should return inventory for a phone across locations', async () => {
      const result = await service.getInventoryByPhone('phone-456');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('phone_id', 'phone-456');
      expect(result.length).toBe(1);
    });
  });

  describe('getQuantityAtLocation', () => {
    it('should return quantity at specific location', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: { quantity: 10 }, error: null })
      );

      const result = await service.getQuantityAtLocation('phone-456', 'loc-789');

      expect(result).toBe(10);
    });

    it('should return 0 when not found', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
      );

      const result = await service.getQuantityAtLocation('nonexistent', 'loc-789');

      expect(result).toBe(0);
    });
  });

  describe('assignPhoneToLocation', () => {
    it('should assign phone to location via RPC', async () => {
      (supabaseServiceSpy.rpc as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: { success: true }, error: null }) as any
      );
      mockQueryBuilder.eq.and.returnValue(
        Promise.resolve({ data: [mockInventoryData], error: null })
      );

      const request = {
        phoneId: 'phone-456',
        locationId: 'loc-789',
        quantity: 5
      };

      await service.assignPhoneToLocation(request);

      expect(supabaseServiceSpy.rpc).toHaveBeenCalledWith('assign_phone_to_location', {
        p_phone_id: 'phone-456',
        p_location_id: 'loc-789',
        p_quantity: 5
      });
    });

    it('should use default quantity of 1', async () => {
      (supabaseServiceSpy.rpc as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: { success: true }, error: null }) as any
      );
      mockQueryBuilder.eq.and.returnValue(
        Promise.resolve({ data: [mockInventoryData], error: null })
      );

      await service.assignPhoneToLocation({
        phoneId: 'phone-456',
        locationId: 'loc-789'
      });

      expect(supabaseServiceSpy.rpc).toHaveBeenCalledWith('assign_phone_to_location', {
        p_phone_id: 'phone-456',
        p_location_id: 'loc-789',
        p_quantity: 1
      });
    });
  });

  describe('updateInventory', () => {
    it('should update inventory fields', async () => {
      mockQueryBuilder.eq.and.callFake(() => mockQueryBuilder);
      mockQueryBuilder.update.and.callFake(() => mockQueryBuilder);
      // Mock the final query result
      (mockQueryBuilder.eq as jasmine.Spy).and.returnValue(
        Promise.resolve({ error: null })
      );

      await service.updateInventory('phone-456', 'loc-789', {
        quantity: 15,
        minStockLevel: 3
      });

      expect(mockQueryBuilder.update).toHaveBeenCalled();
    });
  });

  describe('adjustQuantity', () => {
    beforeEach(() => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: { quantity: 10 }, error: null })
      );
    });

    it('should increase quantity', async () => {
      spyOn(service, 'updateInventory').and.returnValue(Promise.resolve(mockInventoryData as any));

      await service.adjustQuantity('phone-456', 'loc-789', 5);

      expect(service.updateInventory).toHaveBeenCalledWith('phone-456', 'loc-789', { quantity: 15 });
    });

    it('should decrease quantity', async () => {
      spyOn(service, 'updateInventory').and.returnValue(Promise.resolve(mockInventoryData as any));

      await service.adjustQuantity('phone-456', 'loc-789', -3);

      expect(service.updateInventory).toHaveBeenCalledWith('phone-456', 'loc-789', { quantity: 7 });
    });

    it('should throw error for insufficient stock', async () => {
      await expectAsync(
        service.adjustQuantity('phone-456', 'loc-789', -15)
      ).toBeRejectedWithError('Insufficient stock at location');
    });
  });

  describe('deductStock', () => {
    it('should deduct stock quantity', async () => {
      spyOn(service, 'adjustQuantity').and.returnValue(Promise.resolve(mockInventoryData as any));

      await service.deductStock('phone-456', 'loc-789', 2);

      expect(service.adjustQuantity).toHaveBeenCalledWith('phone-456', 'loc-789', -2);
    });

    it('should throw error for non-positive quantity', async () => {
      await expectAsync(
        service.deductStock('phone-456', 'loc-789', 0)
      ).toBeRejectedWithError('Quantity must be positive');
    });

    it('should throw error for negative quantity', async () => {
      await expectAsync(
        service.deductStock('phone-456', 'loc-789', -1)
      ).toBeRejectedWithError('Quantity must be positive');
    });
  });

  describe('getLocationStats', () => {
    beforeEach(() => {
      mockQueryBuilder.gt.and.returnValue(
        Promise.resolve({
          data: [
            { quantity: 10, min_stock_level: 5, phone: { selling_price: 100 } },
            { quantity: 3, min_stock_level: 5, phone: { selling_price: 200 } }
          ],
          error: null
        })
      );
    });

    it('should calculate stats correctly', async () => {
      const stats = await service.getLocationStats('loc-789');

      expect(stats.totalProducts).toBe(2);
      expect(stats.totalUnits).toBe(13);
      expect(stats.totalValue).toBe(1600); // 10*100 + 3*200
      expect(stats.lowStockCount).toBe(1); // Only 3 <= 5
    });
  });

  describe('getLowStockItems', () => {
    beforeEach(() => {
      mockQueryBuilder.gt.and.returnValue(
        Promise.resolve({
          data: [
            { ...mockInventoryData, quantity: 3, min_stock_level: 5 }
          ],
          error: null
        })
      );
    });

    it('should return items below min stock level', async () => {
      const result = await service.getLowStockItems('loc-789');

      expect(result.length).toBe(1);
    });

    it('should filter by location if provided', async () => {
      await service.getLowStockItems('loc-789');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('location_id', 'loc-789');
    });
  });
});
