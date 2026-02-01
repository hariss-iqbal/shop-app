import { TestBed } from '@angular/core/testing';
import { UserLocationAssignmentService } from './user-location-assignment.service';
import { SupabaseService } from './supabase.service';

describe('UserLocationAssignmentService', () => {
  let service: UserLocationAssignmentService;
  let supabaseServiceSpy: jasmine.SpyObj<SupabaseService>;

  const mockAssignmentData = {
    id: 'assign-123',
    user_id: 'user-456',
    location_id: 'loc-789',
    is_default: true,
    can_view_all_locations: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: null,
    location: {
      id: 'loc-789',
      name: 'Main Store',
      code: 'MAIN',
      is_active: true,
      is_primary: true
    }
  };

  const mockUserLocationsResponse = {
    success: true,
    canViewAllLocations: false,
    locations: [
      {
        id: 'loc-789',
        name: 'Main Store',
        code: 'MAIN',
        address: '123 Main St',
        phone: '+1234567890',
        email: 'main@store.com',
        isActive: true,
        isPrimary: true,
        isDefault: true,
        isAssigned: true
      }
    ]
  };

  const mockQueryBuilder = {
    select: jasmine.createSpy('select').and.callFake(() => mockQueryBuilder),
    eq: jasmine.createSpy('eq').and.callFake(() => mockQueryBuilder),
    order: jasmine.createSpy('order').and.callFake(() => mockQueryBuilder),
    single: jasmine.createSpy('single').and.callFake(() => Promise.resolve({ data: mockAssignmentData, error: null })),
    insert: jasmine.createSpy('insert').and.callFake(() => mockQueryBuilder),
    update: jasmine.createSpy('update').and.callFake(() => mockQueryBuilder),
    delete: jasmine.createSpy('delete').and.callFake(() => mockQueryBuilder),
    limit: jasmine.createSpy('limit').and.callFake(() => Promise.resolve({ data: [], error: null }))
  };

  beforeEach(() => {
    const supabaseSpy = jasmine.createSpyObj('SupabaseService', ['from', 'rpc']);
    supabaseSpy.from.and.returnValue(mockQueryBuilder);
    supabaseSpy.rpc.and.returnValue(Promise.resolve({ data: mockUserLocationsResponse, error: null }) as any);

    TestBed.configureTestingModule({
      providers: [
        UserLocationAssignmentService,
        { provide: SupabaseService, useValue: supabaseSpy }
      ]
    });

    service = TestBed.inject(UserLocationAssignmentService);
    supabaseServiceSpy = TestBed.inject(SupabaseService) as jasmine.SpyObj<SupabaseService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadUserLocations', () => {
    it('should load user locations via RPC', async () => {
      (supabaseServiceSpy.rpc as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: mockUserLocationsResponse, error: null }) as any
      );

      const result = await service.loadUserLocations();

      expect(supabaseServiceSpy.rpc).toHaveBeenCalledWith('get_user_locations', { p_user_id: null });
      expect(result.success).toBe(true);
      expect(result.locations.length).toBe(1);
    });

    it('should set current location to default', async () => {
      (supabaseServiceSpy.rpc as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: mockUserLocationsResponse, error: null }) as any
      );

      await service.loadUserLocations();

      expect(service.currentLocationId()).toBe('loc-789');
    });

    it('should respect canViewAllLocations flag', async () => {
      const responseWithViewAll = {
        ...mockUserLocationsResponse,
        canViewAllLocations: true
      };
      (supabaseServiceSpy.rpc as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: responseWithViewAll, error: null }) as any
      );

      await service.loadUserLocations();

      expect(service.canViewAllLocations()).toBe(true);
    });

    it('should load locations for specific user', async () => {
      (supabaseServiceSpy.rpc as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: mockUserLocationsResponse, error: null }) as any
      );

      await service.loadUserLocations('user-123');

      expect(supabaseServiceSpy.rpc).toHaveBeenCalledWith('get_user_locations', { p_user_id: 'user-123' });
    });
  });

  describe('setCurrentLocation', () => {
    beforeEach(async () => {
      (supabaseServiceSpy.rpc as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: mockUserLocationsResponse, error: null }) as any
      );
      await service.loadUserLocations();
    });

    it('should set current location when valid', () => {
      service.setCurrentLocation('loc-789');

      expect(service.currentLocationId()).toBe('loc-789');
    });

    it('should not set current location when invalid', () => {
      service.setCurrentLocation('invalid-location');

      expect(service.currentLocationId()).toBe('loc-789');
    });
  });

  describe('currentLocation computed', () => {
    beforeEach(async () => {
      (supabaseServiceSpy.rpc as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: mockUserLocationsResponse, error: null }) as any
      );
      await service.loadUserLocations();
    });

    it('should return current location details', () => {
      const currentLocation = service.currentLocation();

      expect(currentLocation).not.toBeNull();
      expect(currentLocation?.name).toBe('Main Store');
    });
  });

  describe('defaultLocation computed', () => {
    beforeEach(async () => {
      (supabaseServiceSpy.rpc as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: mockUserLocationsResponse, error: null }) as any
      );
      await service.loadUserLocations();
    });

    it('should return default location', () => {
      const defaultLocation = service.defaultLocation();

      expect(defaultLocation).not.toBeNull();
      expect(defaultLocation?.isDefault).toBe(true);
    });
  });

  describe('getAssignmentsForUser', () => {
    beforeEach(() => {
      mockQueryBuilder.order.and.returnValue(
        Promise.resolve({ data: [mockAssignmentData], error: null })
      );
    });

    it('should return user assignments', async () => {
      const result = await service.getAssignmentsForUser('user-456');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-456');
      expect(result.length).toBe(1);
      expect(result[0].isDefault).toBe(true);
    });
  });

  describe('getDefaultLocation', () => {
    it('should return default location for user', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: mockAssignmentData, error: null })
      );

      const result = await service.getDefaultLocation('user-456');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_default', true);
      expect(result?.isDefault).toBe(true);
    });

    it('should return null when no default', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
      );

      const result = await service.getDefaultLocation('user-456');

      expect(result).toBeNull();
    });
  });

  describe('assignUserToLocation', () => {
    it('should create user location assignment', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: mockAssignmentData, error: null })
      );

      const request = {
        userId: 'user-456',
        locationId: 'loc-789',
        isDefault: true,
        canViewAllLocations: false
      };

      const result = await service.assignUserToLocation(request);

      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(result.userId).toBe('user-456');
    });
  });

  describe('updateAssignment', () => {
    it('should update assignment fields', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: { ...mockAssignmentData, can_view_all_locations: true }, error: null })
      );

      await service.updateAssignment('user-456', 'loc-789', {
        canViewAllLocations: true
      });

      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ can_view_all_locations: true });
    });
  });

  describe('setDefaultLocation', () => {
    it('should set location as default', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: mockAssignmentData, error: null })
      );

      spyOn(service, 'updateAssignment').and.returnValue(Promise.resolve(mockAssignmentData as any));

      await service.setDefaultLocation('user-456', 'loc-789');

      expect(service.updateAssignment).toHaveBeenCalledWith('user-456', 'loc-789', { isDefault: true });
    });
  });

  describe('removeAssignment', () => {
    it('should delete assignment', async () => {
      mockQueryBuilder.eq.and.returnValue(Promise.resolve({ error: null }));

      await service.removeAssignment('user-456', 'loc-789');

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
    });
  });

  describe('canUserAccessLocation', () => {
    it('should return true for user with can_view_all_locations', async () => {
      mockQueryBuilder.limit.and.returnValue(
        Promise.resolve({ data: [{ can_view_all_locations: true }], error: null })
      );

      const result = await service.canUserAccessLocation('user-456', 'loc-any');

      expect(result).toBe(true);
    });

    it('should check specific location assignment when not viewing all', async () => {
      mockQueryBuilder.limit.and.returnValue(
        Promise.resolve({ data: [], error: null })
      );
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: { id: 'assign-123' }, error: null })
      );

      const result = await service.canUserAccessLocation('user-456', 'loc-789');

      expect(result).toBe(true);
    });

    it('should return false when user has no access', async () => {
      mockQueryBuilder.limit.and.returnValue(
        Promise.resolve({ data: [], error: null })
      );
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({ data: null, error: null })
      );

      const result = await service.canUserAccessLocation('user-456', 'loc-other');

      expect(result).toBe(false);
    });
  });

  describe('AC5: Location visibility for cashiers', () => {
    it('should only show assigned locations when canViewAllLocations is false', async () => {
      const limitedLocationsResponse = {
        success: true,
        canViewAllLocations: false,
        locations: [
          { id: 'loc-A', name: 'Location A', code: 'LOC-A', isActive: true, isPrimary: false, isDefault: true, isAssigned: true }
        ]
      };
      (supabaseServiceSpy.rpc as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: limitedLocationsResponse, error: null }) as any
      );

      await service.loadUserLocations();

      expect(service.userLocations().length).toBe(1);
      expect(service.userLocations()[0].name).toBe('Location A');
      expect(service.canViewAllLocations()).toBe(false);
    });

    it('should show all locations when canViewAllLocations is true', async () => {
      const allLocationsResponse = {
        success: true,
        canViewAllLocations: true,
        locations: [
          { id: 'loc-A', name: 'Location A', code: 'LOC-A', isActive: true, isPrimary: false, isDefault: true, isAssigned: true },
          { id: 'loc-B', name: 'Location B', code: 'LOC-B', isActive: true, isPrimary: false, isDefault: false, isAssigned: false },
          { id: 'loc-C', name: 'Location C', code: 'LOC-C', isActive: true, isPrimary: true, isDefault: false, isAssigned: false }
        ]
      };
      (supabaseServiceSpy.rpc as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: allLocationsResponse, error: null }) as any
      );

      await service.loadUserLocations();

      expect(service.userLocations().length).toBe(3);
      expect(service.canViewAllLocations()).toBe(true);
    });
  });
});
