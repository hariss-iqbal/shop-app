import { TestBed } from '@angular/core/testing';
import { StoreLocationService } from './store-location.service';
import { SupabaseService } from './supabase.service';

describe('StoreLocationService', () => {
  let service: StoreLocationService;
  let supabaseServiceSpy: jasmine.SpyObj<SupabaseService>;

  const mockLocationData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Main Store',
    code: 'MAIN',
    address: '123 Main St',
    phone: '+1234567890',
    email: 'main@store.com',
    is_active: true,
    is_primary: true,
    manager_user_id: null,
    notes: 'Primary location',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: null
  };

  const mockQueryBuilder = {
    select: jasmine.createSpy('select').and.callFake(() => mockQueryBuilder),
    eq: jasmine.createSpy('eq').and.callFake(() => mockQueryBuilder),
    or: jasmine.createSpy('or').and.callFake(() => mockQueryBuilder),
    order: jasmine.createSpy('order').and.callFake(() => mockQueryBuilder),
    single: jasmine.createSpy('single').and.callFake(() => Promise.resolve({ data: mockLocationData, error: null })),
    insert: jasmine.createSpy('insert').and.callFake(() => mockQueryBuilder),
    update: jasmine.createSpy('update').and.callFake(() => mockQueryBuilder),
    delete: jasmine.createSpy('delete').and.callFake(() => mockQueryBuilder)
  };

  beforeEach(() => {
    const supabaseSpy = jasmine.createSpyObj('SupabaseService', ['from']);
    supabaseSpy.from.and.returnValue(mockQueryBuilder);

    TestBed.configureTestingModule({
      providers: [
        StoreLocationService,
        { provide: SupabaseService, useValue: supabaseSpy }
      ]
    });

    service = TestBed.inject(StoreLocationService);
    supabaseServiceSpy = TestBed.inject(SupabaseService) as jasmine.SpyObj<SupabaseService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getLocations', () => {
    beforeEach(() => {
      mockQueryBuilder.select.and.callFake(() => mockQueryBuilder);
      mockQueryBuilder.order.and.returnValue(
        Promise.resolve({ data: [mockLocationData], error: null, count: 1 })
      );
    });

    it('should return list of locations', async () => {
      const result = await service.getLocations();

      expect(supabaseServiceSpy.from).toHaveBeenCalledWith('store_locations');
      expect(result.data.length).toBe(1);
      expect(result.data[0].name).toBe('Main Store');
      expect(result.total).toBe(1);
    });

    it('should filter by isActive', async () => {
      await service.getLocations({ isActive: true });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should filter by search term', async () => {
      await service.getLocations({ search: 'main' });

      expect(mockQueryBuilder.or).toHaveBeenCalledWith('name.ilike.%main%,code.ilike.%main%');
    });
  });

  describe('getActiveLocations', () => {
    beforeEach(() => {
      mockQueryBuilder.order.and.returnValue(
        Promise.resolve({ data: [mockLocationData], error: null, count: 1 })
      );
    });

    it('should return only active locations', async () => {
      const result = await service.getActiveLocations();

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_active', true);
      expect(result.length).toBe(1);
    });
  });

  describe('getLocationById', () => {
    it('should return location when found', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: mockLocationData, error: null })
      );

      const result = await service.getLocationById('123e4567-e89b-12d3-a456-426614174000');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Main Store');
    });

    it('should return null when not found', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
      );

      const result = await service.getLocationById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('getLocationByCode', () => {
    it('should find location by code', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: mockLocationData, error: null })
      );

      const result = await service.getLocationByCode('MAIN');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('code', 'MAIN');
      expect(result?.code).toBe('MAIN');
    });

    it('should convert code to uppercase', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: mockLocationData, error: null })
      );

      await service.getLocationByCode('main');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('code', 'MAIN');
    });
  });

  describe('getPrimaryLocation', () => {
    it('should return primary location', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: mockLocationData, error: null })
      );

      const result = await service.getPrimaryLocation();

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_primary', true);
      expect(result?.isPrimary).toBe(true);
    });
  });

  describe('createLocation', () => {
    it('should create a new location', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: mockLocationData, error: null })
      );

      const request = {
        name: 'New Store',
        code: 'new',
        address: '456 New St',
        phone: null,
        email: null,
        isActive: true,
        notes: null
      };

      const result = await service.createLocation(request);

      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(result.name).toBe('Main Store');
    });

    it('should convert code to uppercase on create', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: mockLocationData, error: null })
      );

      await service.createLocation({
        name: 'Test',
        code: 'lowercase',
        isActive: true
      });

      const insertCall = mockQueryBuilder.insert.calls.mostRecent();
      expect(insertCall.args[0].code).toBe('LOWERCASE');
    });
  });

  describe('updateLocation', () => {
    it('should update location fields', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: { ...mockLocationData, name: 'Updated Store' }, error: null })
      );

      const result = await service.updateLocation('123', { name: 'Updated Store' });

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(result.name).toBe('Updated Store');
    });
  });

  describe('deleteLocation', () => {
    it('should delete location', async () => {
      mockQueryBuilder.eq.and.returnValue(
        Promise.resolve({ error: null })
      );

      await service.deleteLocation('123');

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', '123');
    });
  });

  describe('setLocationActive', () => {
    it('should update isActive flag', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: { ...mockLocationData, is_active: false }, error: null })
      );

      const result = await service.setLocationActive('123', false);

      expect(result.isActive).toBe(false);
    });
  });

  describe('setLocationPrimary', () => {
    it('should set location as primary', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: mockLocationData, error: null })
      );

      const result = await service.setLocationPrimary('123');

      expect(result.isPrimary).toBe(true);
    });
  });
});
