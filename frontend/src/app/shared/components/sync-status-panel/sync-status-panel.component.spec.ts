import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
// By is available but not used in these tests
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmationService } from 'primeng/api';
import { SyncStatusPanelComponent } from './sync-status-panel.component';
import { SyncQueueService } from '../../../core/services/sync-queue.service';
import { SyncSchedulerService } from '../../../core/services/sync-scheduler.service';
import { ConflictResolutionService } from '../../../core/services/conflict-resolution.service';
import { NetworkStatusService } from '../../../core/services/network-status.service';
import { ToastService } from '../../services/toast.service';
import {
  SyncQueueItem,
  OfflineSalePayload,
  OfflineTransaction,
  SyncBatchResult
} from '../../../models/offline-sync.model';

/**
 * Unit tests for SyncStatusPanelComponent
 * Feature: F-020 Offline Mode and Sync
 */
describe('SyncStatusPanelComponent', () => {
  let component: SyncStatusPanelComponent;
  let fixture: ComponentFixture<SyncStatusPanelComponent>;
  let mockSyncQueue: jasmine.SpyObj<SyncQueueService>;
  let mockSyncScheduler: jasmine.SpyObj<SyncSchedulerService>;
  let mockConflictResolution: jasmine.SpyObj<ConflictResolutionService>;
  let mockNetworkStatus: jasmine.SpyObj<NetworkStatusService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationService>;

  // Mutable signals
  let isOnlineSignal: ReturnType<typeof signal<boolean>>;
  let isSyncingSignal: ReturnType<typeof signal<boolean>>;
  let syncProgressSignal: ReturnType<typeof signal<number>>;
  let pendingCountSignal: ReturnType<typeof signal<number>>;
  let conflictCountSignal: ReturnType<typeof signal<number>>;
  let lastSyncAtSignal: ReturnType<typeof signal<string | null>>;

  const mockSalePayload: OfflineSalePayload = {
    phoneId: 'phone-1',
    saleDate: '2024-01-15',
    salePrice: 500,
    costPrice: 400,
    buyerName: 'Test Buyer',
    buyerPhone: '1234567890',
    buyerEmail: 'test@example.com',
    notes: null,
    phoneDetails: {
      brandName: 'Apple',
      model: 'iPhone 13',
      storageGb: 128,
      color: 'Black',
      condition: 'excellent',
      imei: '123456789012345'
    },
    localReceiptNumber: 'OFF-20240115-ABC1',
    taxRate: 10,
    taxAmount: 50,
    basePrice: 450,
    isTaxExempt: false
  };

  const mockTransaction: OfflineTransaction = {
    id: 'tx-1',
    type: 'sale',
    displayName: 'Apple iPhone 13',
    amount: 500,
    status: 'pending',
    createdAt: '2024-01-15T10:00:00Z',
    customerName: 'Test Buyer',
    receiptNumber: 'OFF-20240115-ABC1',
    retryCount: 0,
    lastError: null
  };

  const mockConflictItem: SyncQueueItem = {
    id: 'conflict-1',
    operationType: 'CREATE_SALE',
    payload: mockSalePayload,
    status: 'conflict',
    priority: 'high',
    retryCount: 1,
    maxRetries: 3,
    createdAt: '2024-01-15T10:00:00Z',
    lastAttemptAt: '2024-01-15T10:05:00Z',
    lastError: null,
    localTempId: 'conflict-1',
    entityType: 'sale',
    conflictData: {
      conflictType: 'PHONE_ALREADY_SOLD',
      description: 'Phone was sold',
      localData: mockSalePayload,
      serverData: null,
      detectedAt: '2024-01-15T10:05:00Z',
      resolutionOptions: []
    }
  };

  beforeEach(async () => {
    // Create mutable signals
    isOnlineSignal = signal(true);
    isSyncingSignal = signal(false);
    syncProgressSignal = signal(0);
    pendingCountSignal = signal(1);
    conflictCountSignal = signal(0);
    lastSyncAtSignal = signal<string | null>(null);

    mockSyncQueue = jasmine.createSpyObj('SyncQueueService', [
      'getOfflineTransactions',
      'getConflictItems',
      'removeItem'
    ], {
      isOnline: isOnlineSignal.asReadonly(),
      isSyncing: isSyncingSignal.asReadonly(),
      syncProgress: syncProgressSignal.asReadonly(),
      pendingCount: pendingCountSignal.asReadonly(),
      conflictCount: conflictCountSignal.asReadonly(),
      lastSyncAt: lastSyncAtSignal.asReadonly()
    });

    mockSyncScheduler = jasmine.createSpyObj('SyncSchedulerService', ['triggerSync', 'retryItem']);

    mockConflictResolution = jasmine.createSpyObj('ConflictResolutionService', [
      'getConflictDisplayInfo',
      'resolveConflict'
    ]);

    mockNetworkStatus = jasmine.createSpyObj('NetworkStatusService', [], {
      isOnline: isOnlineSignal.asReadonly()
    });

    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warn', 'info']);
    mockConfirmationService = jasmine.createSpyObj('ConfirmationService', ['confirm']);

    // Setup default return values
    mockSyncQueue.getOfflineTransactions.and.returnValue(Promise.resolve([mockTransaction]));
    mockSyncQueue.getConflictItems.and.returnValue(Promise.resolve([]));
    mockSyncQueue.removeItem.and.returnValue(Promise.resolve());

    mockSyncScheduler.triggerSync.and.returnValue(Promise.resolve({
      success: true,
      totalItems: 1,
      syncedItems: 1,
      failedItems: 0,
      conflictItems: 0,
      errors: [],
      conflicts: [],
      syncedAt: new Date().toISOString()
    } as SyncBatchResult));

    mockSyncScheduler.retryItem.and.returnValue(Promise.resolve({
      success: true,
      isConflict: false
    }));

    mockConflictResolution.getConflictDisplayInfo.and.returnValue({
      title: 'Phone Already Sold',
      description: 'This phone was sold by another user',
      localSummary: 'Apple iPhone 13 - $500',
      serverSummary: null,
      options: [{ label: 'Discard', action: 'DISCARD', recommended: true }]
    });

    mockConflictResolution.resolveConflict.and.returnValue(Promise.resolve({
      success: true,
      message: 'Conflict resolved'
    }));

    await TestBed.configureTestingModule({
      imports: [
        SyncStatusPanelComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: SyncQueueService, useValue: mockSyncQueue },
        { provide: SyncSchedulerService, useValue: mockSyncScheduler },
        { provide: ConflictResolutionService, useValue: mockConflictResolution },
        { provide: NetworkStatusService, useValue: mockNetworkStatus },
        { provide: ToastService, useValue: mockToastService },
        { provide: ConfirmationService, useValue: mockConfirmationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SyncStatusPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load transactions on init', fakeAsync(() => {
      tick();
      expect(mockSyncQueue.getOfflineTransactions).toHaveBeenCalled();
    }));

    it('should load conflicts on init', fakeAsync(() => {
      tick();
      expect(mockSyncQueue.getConflictItems).toHaveBeenCalled();
    }));
  });

  describe('status display', () => {
    it('should show online status when online', () => {
      isOnlineSignal.set(true);
      fixture.detectChanges();

      expect(component.isOnline()).toBe(true);
    });

    it('should show offline status when offline', () => {
      isOnlineSignal.set(false);
      fixture.detectChanges();

      expect(component.isOnline()).toBe(false);
    });

    it('should show pending count', () => {
      pendingCountSignal.set(5);
      fixture.detectChanges();

      expect(component.pendingCount()).toBe(5);
    });

    it('should show conflict count', () => {
      conflictCountSignal.set(2);
      fixture.detectChanges();

      expect(component.conflictCount()).toBe(2);
    });
  });

  describe('lastSyncDisplay computed', () => {
    it('should show "Never" when no last sync', () => {
      lastSyncAtSignal.set(null);
      fixture.detectChanges();

      expect(component.lastSyncDisplay()).toBe('Never');
    });

    it('should show "Just now" for recent sync', () => {
      lastSyncAtSignal.set(new Date().toISOString());
      fixture.detectChanges();

      expect(component.lastSyncDisplay()).toBe('Just now');
    });

    it('should show minutes ago for sync within hour', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      lastSyncAtSignal.set(fiveMinutesAgo.toISOString());
      fixture.detectChanges();

      expect(component.lastSyncDisplay()).toContain('min ago');
    });

    it('should show hours ago for sync within day', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      lastSyncAtSignal.set(twoHoursAgo.toISOString());
      fixture.detectChanges();

      expect(component.lastSyncDisplay()).toContain('hours ago');
    });
  });

  describe('sync progress', () => {
    it('should show progress bar when syncing', () => {
      isSyncingSignal.set(true);
      syncProgressSignal.set(50);
      fixture.detectChanges();

      expect(component.isSyncing()).toBe(true);
      expect(component.syncProgress()).toBe(50);
    });
  });

  describe('syncNow', () => {
    it('should trigger sync and refresh data', fakeAsync(() => {
      component.syncNow();
      tick();

      expect(mockSyncScheduler.triggerSync).toHaveBeenCalled();
    }));

    it('should show success toast on successful sync', fakeAsync(() => {
      component.syncNow();
      tick();

      expect(mockToastService.success).toHaveBeenCalled();
    }));

    it('should show warning toast when sync has conflicts', fakeAsync(() => {
      mockSyncScheduler.triggerSync.and.returnValue(Promise.resolve({
        success: false,
        totalItems: 1,
        syncedItems: 0,
        failedItems: 0,
        conflictItems: 1,
        errors: [],
        conflicts: [mockConflictItem],
        syncedAt: new Date().toISOString()
      } as SyncBatchResult));

      component.syncNow();
      tick();

      expect(mockToastService.warn).toHaveBeenCalled();
    }));

    it('should show warning toast when sync has failures', fakeAsync(() => {
      mockSyncScheduler.triggerSync.and.returnValue(Promise.resolve({
        success: false,
        totalItems: 1,
        syncedItems: 0,
        failedItems: 1,
        conflictItems: 0,
        errors: [{ itemId: 'x', operationType: 'CREATE_SALE', errorCode: 'ERR', errorMessage: 'Error', canRetry: true }],
        conflicts: [],
        syncedAt: new Date().toISOString()
      } as SyncBatchResult));

      component.syncNow();
      tick();

      expect(mockToastService.warn).toHaveBeenCalled();
    }));
  });

  describe('retryItem', () => {
    it('should retry item and show success toast', fakeAsync(() => {
      const transaction: OfflineTransaction = {
        ...mockTransaction,
        status: 'failed'
      };

      component.retryItem(transaction);
      tick();

      expect(mockSyncScheduler.retryItem).toHaveBeenCalledWith(transaction.id);
      expect(mockToastService.success).toHaveBeenCalled();
    }));

    it('should show warning toast on conflict', fakeAsync(() => {
      mockSyncScheduler.retryItem.and.returnValue(Promise.resolve({
        success: false,
        isConflict: true
      }));

      component.retryItem(mockTransaction);
      tick();

      expect(mockToastService.warn).toHaveBeenCalled();
    }));

    it('should show error toast on failure', fakeAsync(() => {
      mockSyncScheduler.retryItem.and.returnValue(Promise.resolve({
        success: false,
        isConflict: false,
        error: {
          itemId: 'test-id',
          operationType: 'CREATE_RECEIPT',
          errorCode: 'NETWORK_ERROR',
          errorMessage: 'Network error',
          canRetry: true
        }
      }));

      component.retryItem(mockTransaction);
      tick();

      expect(mockToastService.error).toHaveBeenCalled();
    }));
  });

  describe('discardItem', () => {
    it('should show confirmation dialog', () => {
      component.discardItem(mockTransaction);

      expect(mockConfirmationService.confirm).toHaveBeenCalled();
    });
  });

  describe('refreshData', () => {
    it('should reload transactions and conflicts', fakeAsync(() => {
      component.refreshData();
      tick();

      expect(mockSyncQueue.getOfflineTransactions).toHaveBeenCalled();
      expect(mockSyncQueue.getConflictItems).toHaveBeenCalled();
    }));
  });

  describe('conflict dialog', () => {
    beforeEach(fakeAsync(() => {
      conflictCountSignal.set(1);
      mockSyncQueue.getConflictItems.and.returnValue(Promise.resolve([mockConflictItem]));
      component.refreshData();
      tick();
      fixture.detectChanges();
    }));

    it('should open conflict dialog', () => {
      component.showConflictDialog();

      expect(component.conflictDialogVisible).toBe(true);
    });

    it('should select first conflict when opening dialog', () => {
      component.showConflictDialog();

      expect(component.selectedConflict()).toEqual(mockConflictItem);
    });

    it('should allow selecting a different conflict', () => {
      const anotherConflict: SyncQueueItem = {
        ...mockConflictItem,
        id: 'conflict-2'
      };

      component.selectConflict(anotherConflict);

      expect(component.selectedConflict()).toEqual(anotherConflict);
    });
  });

  describe('resolveConflict', () => {
    beforeEach(fakeAsync(() => {
      conflictCountSignal.set(1);
      mockSyncQueue.getConflictItems.and.returnValue(Promise.resolve([mockConflictItem]));
      component.refreshData();
      tick();
      component.selectConflict(mockConflictItem);
      fixture.detectChanges();
    }));

    it('should resolve conflict with selected action', fakeAsync(() => {
      component.resolveConflict('DISCARD');
      tick();

      expect(mockConflictResolution.resolveConflict).toHaveBeenCalledWith({
        queueItemId: mockConflictItem.id,
        resolution: 'DISCARD'
      });
    }));

    it('should show success toast on resolution', fakeAsync(() => {
      component.resolveConflict('DISCARD');
      tick();

      expect(mockToastService.success).toHaveBeenCalled();
    }));

    it('should show error toast on resolution failure', fakeAsync(() => {
      mockConflictResolution.resolveConflict.and.returnValue(Promise.resolve({
        success: false,
        message: 'Failed',
        error: 'Error message'
      }));

      component.resolveConflict('DISCARD');
      tick();

      expect(mockToastService.error).toHaveBeenCalled();
    }));

    it('should close dialog when no more conflicts', fakeAsync(() => {
      mockSyncQueue.getConflictItems.and.returnValue(Promise.resolve([]));
      component.showConflictDialog();

      component.resolveConflict('DISCARD');
      tick();

      expect(component.conflictDialogVisible).toBe(false);
    }));

    it('should select next conflict when one is resolved', fakeAsync(() => {
      const secondConflict: SyncQueueItem = {
        ...mockConflictItem,
        id: 'conflict-2'
      };
      mockSyncQueue.getConflictItems.and.returnValue(Promise.resolve([secondConflict]));

      component.resolveConflict('DISCARD');
      tick();

      expect(component.selectedConflict()).toEqual(secondConflict);
    }));
  });

  describe('getConflictDisplayName', () => {
    it('should return phone details for sales', () => {
      const name = component.getConflictDisplayName(mockConflictItem);

      expect(name).toBe('Apple iPhone 13');
    });

    it('should return local ID for non-sales', () => {
      const whatsappConflict: SyncQueueItem = {
        ...mockConflictItem,
        operationType: 'SEND_WHATSAPP'
      };

      const name = component.getConflictDisplayName(whatsappConflict);

      expect(name).toBe(whatsappConflict.localTempId);
    });
  });

  describe('type labels and severities', () => {
    it('should return correct type labels', () => {
      expect(component.getTypeLabel('sale')).toBe('Sale');
      expect(component.getTypeLabel('receipt')).toBe('Receipt');
      expect(component.getTypeLabel('whatsapp')).toBe('WhatsApp');
      expect(component.getTypeLabel('unknown')).toBe('unknown');
    });

    it('should return correct type severities', () => {
      expect(component.getTypeSeverity('sale')).toBe('success');
      expect(component.getTypeSeverity('receipt')).toBe('info');
      expect(component.getTypeSeverity('whatsapp')).toBe('contrast');
      expect(component.getTypeSeverity('unknown')).toBe('secondary');
    });

    it('should return correct status labels', () => {
      expect(component.getStatusLabel('pending')).toBe('Pending');
      expect(component.getStatusLabel('syncing')).toBe('Syncing');
      expect(component.getStatusLabel('synced')).toBe('Synced');
      expect(component.getStatusLabel('conflict')).toBe('Conflict');
      expect(component.getStatusLabel('failed')).toBe('Failed');
    });

    it('should return correct status severities', () => {
      expect(component.getStatusSeverity('pending')).toBe('info');
      expect(component.getStatusSeverity('syncing')).toBe('warn');
      expect(component.getStatusSeverity('synced')).toBe('success');
      expect(component.getStatusSeverity('conflict')).toBe('danger');
      expect(component.getStatusSeverity('failed')).toBe('danger');
    });
  });

  describe('conflictInfo computed', () => {
    it('should return empty info when no conflict selected', () => {
      component.selectedConflict.set(null);
      fixture.detectChanges();

      const info = component.conflictInfo();

      expect(info.title).toBe('');
    });

    it('should return conflict display info when conflict selected', fakeAsync(() => {
      conflictCountSignal.set(1);
      mockSyncQueue.getConflictItems.and.returnValue(Promise.resolve([mockConflictItem]));
      component.refreshData();
      tick();
      component.selectConflict(mockConflictItem);
      fixture.detectChanges();

      const info = component.conflictInfo();

      expect(mockConflictResolution.getConflictDisplayInfo).toHaveBeenCalledWith(mockConflictItem);
      expect(info.title).toBe('Phone Already Sold');
    }));
  });
});
