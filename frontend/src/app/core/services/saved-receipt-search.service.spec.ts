import { TestBed } from '@angular/core/testing';
import { SavedReceiptSearchService } from './saved-receipt-search.service';
import { SupabaseService } from './supabase.service';
import { CreateSavedSearchRequest } from '../../models/sale.model';

describe('SavedReceiptSearchService', () => {
  let service: SavedReceiptSearchService;
  let supabaseMock: jasmine.SpyObj<SupabaseService>;
  let mockQueryBuilder: any;

  const mockDbRecord = {
    id: 'search-1',
    name: "Today's Sales",
    filters: {
      startDate: '2026-01-31',
      endDate: '2026-01-31',
      sortField: 'transactionDate',
      sortOrder: 'desc'
    },
    is_default: true,
    created_at: '2026-01-31T10:00:00Z',
    updated_at: '2026-01-31T10:00:00Z'
  };

  beforeEach(() => {
    mockQueryBuilder = {
      select: jasmine.createSpy('select').and.returnValue({
        order: jasmine.createSpy('order').and.returnValue(
          Promise.resolve({ data: [mockDbRecord], error: null, count: 1 })
        ),
        eq: jasmine.createSpy('eq').and.returnValue({
          single: jasmine.createSpy('single').and.returnValue(
            Promise.resolve({ data: mockDbRecord, error: null })
          )
        }),
        single: jasmine.createSpy('single').and.returnValue(
          Promise.resolve({ data: mockDbRecord, error: null })
        )
      }),
      insert: jasmine.createSpy('insert').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          single: jasmine.createSpy('single').and.returnValue(
            Promise.resolve({ data: mockDbRecord, error: null })
          )
        })
      }),
      update: jasmine.createSpy('update').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: mockDbRecord, error: null })
            )
          })
        })
      }),
      delete: jasmine.createSpy('delete').and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(
          Promise.resolve({ error: null })
        )
      })
    };

    supabaseMock = jasmine.createSpyObj('SupabaseService', ['from']);
    supabaseMock.from.and.returnValue(mockQueryBuilder);

    TestBed.configureTestingModule({
      providers: [
        SavedReceiptSearchService,
        { provide: SupabaseService, useValue: supabaseMock }
      ]
    });
    service = TestBed.inject(SavedReceiptSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSavedSearches', () => {
    it('should return all saved searches ordered by name', async () => {
      const result = await service.getSavedSearches();

      expect(supabaseMock.from).toHaveBeenCalledWith('saved_receipt_searches');
      expect(result.data.length).toBe(1);
      expect(result.data[0].name).toBe("Today's Sales");
      expect(result.total).toBe(1);
    });

    it('should map database fields to camelCase', async () => {
      const result = await service.getSavedSearches();

      expect(result.data[0].isDefault).toBe(true);
      expect(result.data[0].createdAt).toBe('2026-01-31T10:00:00Z');
    });

    it('should handle empty result', async () => {
      mockQueryBuilder.select.and.returnValue({
        order: jasmine.createSpy('order').and.returnValue(
          Promise.resolve({ data: [], error: null, count: 0 })
        )
      });

      const result = await service.getSavedSearches();

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should throw error on database failure', async () => {
      mockQueryBuilder.select.and.returnValue({
        order: jasmine.createSpy('order').and.returnValue(
          Promise.resolve({ data: null, error: { message: 'Database error' }, count: null })
        )
      });

      await expectAsync(service.getSavedSearches()).toBeRejectedWithError('Database error');
    });
  });

  describe('getSavedSearchById', () => {
    it('should return saved search by id', async () => {
      const result = await service.getSavedSearchById('search-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('search-1');
      expect(result!.name).toBe("Today's Sales");
    });

    it('should return null when not found', async () => {
      mockQueryBuilder.select.and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue({
          single: jasmine.createSpy('single').and.returnValue(
            Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
          )
        })
      });

      const result = await service.getSavedSearchById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getDefaultSavedSearch', () => {
    it('should return the default saved search', async () => {
      mockQueryBuilder.select.and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue({
          single: jasmine.createSpy('single').and.returnValue(
            Promise.resolve({ data: mockDbRecord, error: null })
          )
        })
      });

      const result = await service.getDefaultSavedSearch();

      expect(result).not.toBeNull();
      expect(result!.isDefault).toBe(true);
    });

    it('should return null when no default exists', async () => {
      mockQueryBuilder.select.and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue({
          single: jasmine.createSpy('single').and.returnValue(
            Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
          )
        })
      });

      const result = await service.getDefaultSavedSearch();

      expect(result).toBeNull();
    });
  });

  describe('createSavedSearch', () => {
    it('should create a new saved search', async () => {
      const request: CreateSavedSearchRequest = {
        name: 'New Search',
        filters: { receiptNumber: 'RCP100' },
        isDefault: false
      };

      const result = await service.createSavedSearch(request);

      expect(result.name).toBe("Today's Sales"); // Mock returns the same record
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
    });

    it('should clear existing default when setting new default', async () => {
      const request: CreateSavedSearchRequest = {
        name: 'New Default',
        filters: {},
        isDefault: true
      };

      // Mock clear default
      mockQueryBuilder.update.and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(
          Promise.resolve({ error: null })
        )
      });

      await service.createSavedSearch(request);

      expect(mockQueryBuilder.update).toHaveBeenCalled();
    });

    it('should trim the search name', async () => {
      const request: CreateSavedSearchRequest = {
        name: '  Trimmed Name  ',
        filters: {},
        isDefault: false
      };

      await service.createSavedSearch(request);

      const insertCall = mockQueryBuilder.insert.calls.mostRecent();
      expect(insertCall.args[0].name).toBe('Trimmed Name');
    });
  });

  describe('updateSavedSearch', () => {
    it('should update an existing saved search', async () => {
      mockQueryBuilder.update.and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: mockDbRecord, error: null })
            )
          })
        })
      });

      const result = await service.updateSavedSearch('search-1', {
        name: 'Updated Name'
      });

      expect(result.id).toBe('search-1');
    });
  });

  describe('deleteSavedSearch', () => {
    it('should delete a saved search', async () => {
      await service.deleteSavedSearch('search-1');

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
    });

    it('should throw error on delete failure', async () => {
      mockQueryBuilder.delete.and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue(
          Promise.resolve({ error: { message: 'Delete failed' } })
        )
      });

      await expectAsync(service.deleteSavedSearch('search-1')).toBeRejectedWithError('Delete failed');
    });
  });

  describe('filter mapping', () => {
    it('should correctly map all filter fields', async () => {
      const fullFiltersRecord = {
        ...mockDbRecord,
        filters: {
          receiptNumber: 'RCP100',
          customerPhone: '1234567890',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          minAmount: 50,
          maxAmount: 200,
          sortField: 'grandTotal',
          sortOrder: 'asc'
        }
      };

      mockQueryBuilder.select.and.returnValue({
        eq: jasmine.createSpy('eq').and.returnValue({
          single: jasmine.createSpy('single').and.returnValue(
            Promise.resolve({ data: fullFiltersRecord, error: null })
          )
        })
      });

      const result = await service.getSavedSearchById('search-1');

      expect(result).not.toBeNull();
      expect(result!.filters.receiptNumber).toBe('RCP100');
      expect(result!.filters.customerPhone).toBe('1234567890');
      expect(result!.filters.customerName).toBe('John Doe');
      expect(result!.filters.customerEmail).toBe('john@example.com');
      expect(result!.filters.startDate).toBe('2026-01-01');
      expect(result!.filters.endDate).toBe('2026-01-31');
      expect(result!.filters.minAmount).toBe(50);
      expect(result!.filters.maxAmount).toBe(200);
      expect(result!.filters.sortField).toBe('grandTotal');
      expect(result!.filters.sortOrder).toBe('asc');
    });
  });
});
