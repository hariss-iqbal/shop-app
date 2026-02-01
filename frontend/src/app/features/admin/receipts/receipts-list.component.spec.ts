import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ReceiptsListComponent } from './receipts-list.component';
import { ReceiptStorageService } from '../../../core/services/receipt-storage.service';
import { RefundService } from '../../../core/services/refund.service';
import { ReceiptService } from '../../../shared/services/receipt.service';
import { WhatsAppService } from '../../../shared/services/whatsapp.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SavedReceiptSearchService } from '../../../core/services/saved-receipt-search.service';
import { SupabaseAuthService } from '../../../core/services/supabase-auth.service';
import { StoredReceipt, SavedReceiptSearch } from '../../../models/sale.model';
import { ConfirmationService } from 'primeng/api';

describe('ReceiptsListComponent', () => {
  let component: ReceiptsListComponent;
  let fixture: ComponentFixture<ReceiptsListComponent>;
  let receiptStorageServiceMock: jasmine.SpyObj<ReceiptStorageService>;
  let refundServiceMock: jasmine.SpyObj<RefundService>;
  let receiptServiceMock: jasmine.SpyObj<ReceiptService>;
  let whatsAppServiceMock: jasmine.SpyObj<WhatsAppService>;
  let toastServiceMock: jasmine.SpyObj<ToastService>;
  let savedSearchServiceMock: jasmine.SpyObj<SavedReceiptSearchService>;
  let authServiceMock: jasmine.SpyObj<SupabaseAuthService>;
  let confirmationServiceMock: jasmine.SpyObj<ConfirmationService>;

  const mockReceipt: StoredReceipt = {
    id: 'receipt-1',
    receiptNumber: 'RCP100001',
    transactionDate: '2026-01-31',
    transactionTime: '14:30:00',
    subtotal: 100,
    taxRate: 10,
    taxAmount: 10,
    grandTotal: 110,
    customerName: 'John Doe',
    customerPhone: '1234567890',
    customerEmail: 'john@example.com',
    notes: null,
    items: [],
    createdAt: '2026-01-31T14:30:00Z',
    updatedAt: null
  };

  const mockSavedSearch: SavedReceiptSearch = {
    id: 'search-1',
    name: "Today's Sales",
    filters: {
      startDate: '2026-01-31',
      endDate: '2026-01-31',
      sortField: 'transactionDate',
      sortOrder: 'desc'
    },
    isDefault: false,
    createdAt: '2026-01-31T10:00:00Z'
  };

  const mockDefaultSearch: SavedReceiptSearch = {
    id: 'search-default',
    name: 'Default Search',
    filters: {
      minAmount: 50,
      maxAmount: 500
    },
    isDefault: true,
    createdAt: '2026-01-30T10:00:00Z'
  };

  beforeEach(async () => {
    receiptStorageServiceMock = jasmine.createSpyObj('ReceiptStorageService', [
      'getReceipts',
      'getReceiptById',
      'convertToReceiptData',
      'exportReceipts'
    ]);
    receiptStorageServiceMock.getReceipts.and.returnValue(
      Promise.resolve({ data: [mockReceipt], total: 1 })
    );

    refundServiceMock = jasmine.createSpyObj('RefundService', [
      'getRefundByReceipt',
      'findPartialRefundsByReceiptId'
    ]);
    refundServiceMock.getRefundByReceipt.and.returnValue(
      Promise.resolve({ found: false, receiptId: 'receipt-1', refund: undefined })
    );
    refundServiceMock.findPartialRefundsByReceiptId.and.returnValue(
      Promise.resolve({ data: [], total: 0, page: 1, limit: 10 })
    );

    receiptServiceMock = jasmine.createSpyObj('ReceiptService', ['generatePdf', 'getStoreConfig']);
    receiptServiceMock.getStoreConfig.and.returnValue({
      name: 'Test Store',
      address: '123 Main St',
      phone: '555-1234',
      email: 'test@example.com'
    });
    whatsAppServiceMock = jasmine.createSpyObj('WhatsAppService', [
      'canSendWhatsApp',
      'formatPhoneDisplay'
    ]);
    toastServiceMock = jasmine.createSpyObj('ToastService', ['success', 'error']);

    savedSearchServiceMock = jasmine.createSpyObj('SavedReceiptSearchService', [
      'getSavedSearches',
      'getDefaultSavedSearch',
      'createSavedSearch',
      'deleteSavedSearch'
    ]);
    savedSearchServiceMock.getSavedSearches.and.returnValue(
      Promise.resolve({ data: [mockSavedSearch], total: 1 })
    );
    savedSearchServiceMock.getDefaultSavedSearch.and.returnValue(
      Promise.resolve(null)
    );

    authServiceMock = jasmine.createSpyObj('SupabaseAuthService', ['canProcessRefunds']);
    authServiceMock.canProcessRefunds.and.returnValue(true);

    confirmationServiceMock = jasmine.createSpyObj('ConfirmationService', ['confirm']);

    await TestBed.configureTestingModule({
      imports: [ReceiptsListComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ReceiptStorageService, useValue: receiptStorageServiceMock },
        { provide: RefundService, useValue: refundServiceMock },
        { provide: ReceiptService, useValue: receiptServiceMock },
        { provide: WhatsAppService, useValue: whatsAppServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: SavedReceiptSearchService, useValue: savedSearchServiceMock },
        { provide: SupabaseAuthService, useValue: authServiceMock },
        { provide: ConfirmationService, useValue: confirmationServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReceiptsListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should load saved searches on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(savedSearchServiceMock.getSavedSearches).toHaveBeenCalled();
      expect(component.savedSearches().length).toBe(1);
    }));

    it('should load receipts on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(receiptStorageServiceMock.getReceipts).toHaveBeenCalled();
      expect(component.receipts().length).toBe(1);
    }));

    it('should apply default saved search on init when one exists', fakeAsync(() => {
      savedSearchServiceMock.getDefaultSavedSearch.and.returnValue(
        Promise.resolve(mockDefaultSearch)
      );

      fixture.detectChanges();
      tick();

      expect(savedSearchServiceMock.getDefaultSavedSearch).toHaveBeenCalled();
      expect(component.minAmount).toBe(50);
      expect(component.maxAmount).toBe(500);
      expect(component.activeSearchId()).toBe('search-default');
    }));
  });

  describe('search and filtering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should debounce search changes', fakeAsync(() => {
      const initialCallCount = receiptStorageServiceMock.getReceipts.calls.count();

      component.receiptNumberSearch = 'RCP100';
      component.onSearchChange();
      tick(100);

      // Still just initial call since debounce hasn't completed
      expect(receiptStorageServiceMock.getReceipts).toHaveBeenCalledTimes(initialCallCount);

      tick(200);
      // Now debounce completed and new call was made
      expect(receiptStorageServiceMock.getReceipts).toHaveBeenCalledTimes(initialCallCount + 1);
    }));

    it('should reset page to 1 on search change', fakeAsync(() => {
      component.receiptNumberSearch = 'RCP100';
      component.onSearchChange();
      tick(300);

      const lastCall = receiptStorageServiceMock.getReceipts.calls.mostRecent();
      expect(lastCall.args[0]?.page).toBe(1);
    }));

    it('should clear active search when filters change', fakeAsync(() => {
      component.activeSearchId.set('search-1');
      component.receiptNumberSearch = 'RCP100';
      component.onSearchChange();
      tick(300);

      expect(component.activeSearchId()).toBeNull();
    }));

    it('should apply date range filter', fakeAsync(() => {
      component.startDate = new Date('2026-01-01');
      component.endDate = new Date('2026-01-31');
      component.onDateFilterChange();
      tick();

      const lastCall = receiptStorageServiceMock.getReceipts.calls.mostRecent();
      expect(lastCall.args[0]?.startDate).toBe('2026-01-01');
      expect(lastCall.args[0]?.endDate).toBe('2026-01-31');
    }));

    it('should apply amount range filter', fakeAsync(() => {
      component.minAmount = 50;
      component.maxAmount = 200;
      component.onAmountFilterChange();
      tick();

      const lastCall = receiptStorageServiceMock.getReceipts.calls.mostRecent();
      expect(lastCall.args[0]?.minAmount).toBe(50);
      expect(lastCall.args[0]?.maxAmount).toBe(200);
    }));

    it('should correctly identify active filters', () => {
      expect(component.hasActiveFilters()).toBeFalse();

      component.receiptNumberSearch = 'RCP100';
      expect(component.hasActiveFilters()).toBeTrue();

      component.receiptNumberSearch = '';
      component.minAmount = 50;
      expect(component.hasActiveFilters()).toBeTrue();
    });

    it('should clear all filters', fakeAsync(() => {
      component.receiptNumberSearch = 'RCP100';
      component.customerPhoneSearch = '1234567890';
      component.startDate = new Date();
      component.minAmount = 50;
      component.activeSearchId.set('search-1');

      component.clearFilters();
      tick();

      expect(component.receiptNumberSearch).toBe('');
      expect(component.customerPhoneSearch).toBe('');
      expect(component.startDate).toBeNull();
      expect(component.minAmount).toBeNull();
      expect(component.activeSearchId()).toBeNull();
    }));
  });

  describe('saved searches', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should apply saved search filters', fakeAsync(() => {
      component.onApplySavedSearch(mockSavedSearch);
      tick();

      expect(component.startDate).toEqual(new Date('2026-01-31'));
      expect(component.endDate).toEqual(new Date('2026-01-31'));
      expect(component.sortField).toBe('transactionDate');
      expect(component.sortOrder).toBe('desc');
      expect(component.activeSearchId()).toBe('search-1');
    }));

    it('should apply all filter types from saved search', fakeAsync(() => {
      const fullSearch: SavedReceiptSearch = {
        id: 'search-full',
        name: 'Full Search',
        filters: {
          receiptNumber: 'RCP100',
          customerPhone: '1234567890',
          customerName: 'John',
          customerEmail: 'john@example.com',
          startDate: '2026-01-01',
          endDate: '2026-01-31',
          minAmount: 50,
          maxAmount: 200,
          sortField: 'grandTotal',
          sortOrder: 'asc'
        },
        isDefault: false,
        createdAt: '2026-01-31T10:00:00Z'
      };

      component.onApplySavedSearch(fullSearch);
      tick();

      expect(component.receiptNumberSearch).toBe('RCP100');
      expect(component.customerPhoneSearch).toBe('1234567890');
      expect(component.customerNameSearch).toBe('John');
      expect(component.customerEmailSearch).toBe('john@example.com');
      expect(component.minAmount).toBe(50);
      expect(component.maxAmount).toBe(200);
    }));

    it('should save current filters as new search', fakeAsync(() => {
      component.receiptNumberSearch = 'RCP100';
      component.minAmount = 50;
      component.newSearchName = 'My Search';
      component.newSearchIsDefault = true;

      savedSearchServiceMock.createSavedSearch.and.returnValue(
        Promise.resolve({
          id: 'new-search',
          name: 'My Search',
          filters: { receiptNumber: 'RCP100', minAmount: 50 },
          isDefault: true,
          createdAt: '2026-01-31T15:00:00Z'
        })
      );

      component.onSaveSearch();
      tick();

      expect(savedSearchServiceMock.createSavedSearch).toHaveBeenCalled();
      expect(toastServiceMock.success).toHaveBeenCalled();
      expect(component.showSaveSearchDialog).toBeFalse();
    }));

    it('should not save search without name', fakeAsync(() => {
      component.newSearchName = '';
      component.onSaveSearch();
      tick();

      expect(savedSearchServiceMock.createSavedSearch).not.toHaveBeenCalled();
      expect(toastServiceMock.error).toHaveBeenCalled();
    }));

    it('should confirm before deleting saved search', fakeAsync(() => {
      // Get the actual confirmation service from the component's injector
      const confirmService = fixture.debugElement.injector.get(ConfirmationService);
      spyOn(confirmService, 'confirm');

      component.onDeleteSavedSearch(mockSavedSearch);
      tick();

      expect(confirmService.confirm).toHaveBeenCalled();
    }));
  });

  describe('export functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should export with current filters', fakeAsync(() => {
      component.receiptNumberSearch = 'RCP100';
      component.minAmount = 50;

      receiptStorageServiceMock.exportReceipts.and.returnValue(Promise.resolve());

      component.onExportCsv();
      tick();

      const exportCall = receiptStorageServiceMock.exportReceipts.calls.mostRecent();
      expect(exportCall.args[0].format).toBe('csv');
      expect(exportCall.args[0].includeItems).toBe(true);
      expect(exportCall.args[0].filters?.receiptNumber).toBe('RCP100');
      expect(exportCall.args[0].filters?.minAmount).toBe(50);
    }));

    it('should show success message after export', fakeAsync(() => {
      receiptStorageServiceMock.exportReceipts.and.returnValue(Promise.resolve());

      component.onExportCsv();
      tick();

      expect(toastServiceMock.success).toHaveBeenCalledWith(
        'Export Complete',
        'Receipts exported to CSV'
      );
    }));
  });

  describe('refund status', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should check refund status for each receipt', fakeAsync(() => {
      expect(refundServiceMock.getRefundByReceipt).toHaveBeenCalledWith('receipt-1');
    }));

    it('should mark receipt as fully refunded when full refund exists', fakeAsync(() => {
      refundServiceMock.getRefundByReceipt.and.returnValue(
        Promise.resolve({
          found: true,
          receiptId: 'receipt-1',
          refund: { isPartialRefund: false } as any
        })
      );

      component['loadData']();
      tick();

      expect(component.receiptRefundStatus().get('receipt-1')).toBe('full');
    }));

    it('should mark receipt as partially refunded when partial refund exists', fakeAsync(() => {
      refundServiceMock.getRefundByReceipt.and.returnValue(
        Promise.resolve({ found: false, receiptId: 'receipt-1', refund: undefined })
      );
      refundServiceMock.findPartialRefundsByReceiptId.and.returnValue(
        Promise.resolve({ data: [{ id: 'partial-1' }] as any, total: 1, page: 1, limit: 10 })
      );

      component['loadData']();
      tick();

      expect(component.receiptRefundStatus().get('receipt-1')).toBe('partial');
    }));
  });

  describe('time formatting', () => {
    it('should format time correctly for AM', () => {
      expect(component.formatTime('09:30:00')).toBe('9:30 AM');
    });

    it('should format time correctly for PM', () => {
      expect(component.formatTime('14:30:00')).toBe('2:30 PM');
    });

    it('should format noon correctly', () => {
      expect(component.formatTime('12:00:00')).toBe('12:00 PM');
    });

    it('should format midnight correctly', () => {
      expect(component.formatTime('00:00:00')).toBe('12:00 AM');
    });

    it('should return dash for empty time', () => {
      expect(component.formatTime('')).toBe('-');
    });
  });

  describe('pagination', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should handle lazy load event', fakeAsync(() => {
      component.onLazyLoad({ first: 20, rows: 20 });
      tick();

      const lastCall = receiptStorageServiceMock.getReceipts.calls.mostRecent();
      expect(lastCall.args[0]?.page).toBe(2);
      expect(lastCall.args[0]?.limit).toBe(20);
    }));
  });
});
