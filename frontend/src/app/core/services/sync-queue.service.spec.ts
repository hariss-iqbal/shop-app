import { TestBed, fakeAsync } from '@angular/core/testing';
import { SyncQueueService } from './sync-queue.service';
import { OfflineStorageService } from './offline-storage.service';
import { NetworkStatusService } from './network-status.service';
import { signal } from '@angular/core';
import {
  SyncQueueItem,
  OfflineSalePayload,
  OfflineWhatsAppPayload
} from '../../models/offline-sync.model';

/**
 * Unit tests for SyncQueueService
 * Feature: F-020 Offline Mode and Sync
 */
describe('SyncQueueService', () => {
  let service: SyncQueueService;
  let mockOfflineStorage: jasmine.SpyObj<OfflineStorageService>;
  let mockNetworkStatus: jasmine.SpyObj<NetworkStatusService>;

  const mockSalePayload: OfflineSalePayload = {
    productId: 'product-1',
    saleDate: '2024-01-15',
    salePrice: 500,
    costPrice: 400,
    buyerName: 'Test Buyer',
    buyerPhone: '1234567890',
    buyerEmail: 'test@example.com',
    notes: null,
    productDetails: {
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

  const mockWhatsAppPayload: OfflineWhatsAppPayload = {
    phoneNumber: '1234567890',
    message: 'Receipt message',
    receiptNumber: 'REC-001',
    receiptLocalId: 'local-1',
    customerName: 'Test Customer',
    grandTotal: 550
  };

  const mockSyncQueueItem: SyncQueueItem = {
    id: 'test-id-1',
    operationType: 'CREATE_SALE',
    payload: mockSalePayload,
    status: 'pending',
    priority: 'high',
    retryCount: 0,
    maxRetries: 3,
    createdAt: '2024-01-15T10:00:00Z',
    lastAttemptAt: null,
    lastError: null,
    localTempId: 'test-id-1',
    entityType: 'sale'
  };

  beforeEach(() => {
    mockOfflineStorage = jasmine.createSpyObj('OfflineStorageService', [
      'addToSyncQueue',
      'updateSyncQueueItem',
      'getSyncQueueItem',
      'getAllSyncQueueItems',
      'getSyncQueueItemsByStatus',
      'getPendingSyncItems',
      'getConflictItems',
      'removeSyncQueueItem',
      'clearSyncedItems',
      'getSyncQueueCount',
      'getLastSyncTime',
      'saveLastSyncTime',
      'generateLocalId'
    ], {
      isReady: signal(true)
    });

    mockNetworkStatus = jasmine.createSpyObj('NetworkStatusService', [], {
      isOnline: signal(true)
    });

    // Setup default return values
    mockOfflineStorage.addToSyncQueue.and.returnValue(Promise.resolve());
    mockOfflineStorage.updateSyncQueueItem.and.returnValue(Promise.resolve());
    mockOfflineStorage.getSyncQueueItem.and.returnValue(Promise.resolve(mockSyncQueueItem));
    mockOfflineStorage.getAllSyncQueueItems.and.returnValue(Promise.resolve([mockSyncQueueItem]));
    mockOfflineStorage.getSyncQueueItemsByStatus.and.returnValue(Promise.resolve([mockSyncQueueItem]));
    mockOfflineStorage.getPendingSyncItems.and.returnValue(Promise.resolve([mockSyncQueueItem]));
    mockOfflineStorage.getConflictItems.and.returnValue(Promise.resolve([]));
    mockOfflineStorage.removeSyncQueueItem.and.returnValue(Promise.resolve());
    mockOfflineStorage.clearSyncedItems.and.returnValue(Promise.resolve());
    mockOfflineStorage.getSyncQueueCount.and.returnValue(Promise.resolve({
      pending: 1,
      conflict: 0,
      failed: 0,
      total: 1
    }));
    mockOfflineStorage.getLastSyncTime.and.returnValue(Promise.resolve(null));
    mockOfflineStorage.saveLastSyncTime.and.returnValue(Promise.resolve());
    mockOfflineStorage.generateLocalId.and.returnValue('local_123456_abc');

    TestBed.configureTestingModule({
      providers: [
        SyncQueueService,
        { provide: OfflineStorageService, useValue: mockOfflineStorage },
        { provide: NetworkStatusService, useValue: mockNetworkStatus }
      ]
    });

    service = TestBed.inject(SyncQueueService);
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should expose pendingCount signal', () => {
      expect(service.pendingCount).toBeDefined();
    });

    it('should expose conflictCount signal', () => {
      expect(service.conflictCount).toBeDefined();
    });

    it('should expose failedCount signal', () => {
      expect(service.failedCount).toBeDefined();
    });

    it('should expose isSyncing signal', () => {
      expect(service.isSyncing).toBeDefined();
    });

    it('should expose syncProgress signal', () => {
      expect(service.syncProgress).toBeDefined();
    });

    it('should expose hasPendingItems computed signal', () => {
      expect(service.hasPendingItems).toBeDefined();
    });

    it('should expose hasConflicts computed signal', () => {
      expect(service.hasConflicts).toBeDefined();
    });

    it('should expose hasFailedItems computed signal', () => {
      expect(service.hasFailedItems).toBeDefined();
    });

    it('should expose syncStatus computed signal', () => {
      expect(service.syncStatus).toBeDefined();
    });
  });

  describe('queueSale', () => {
    it('should queue a sale operation', fakeAsync(async () => {
      const result = await service.queueSale(mockSalePayload);

      expect(mockOfflineStorage.addToSyncQueue).toHaveBeenCalled();
      expect(result.operationType).toBe('CREATE_SALE');
      expect(result.priority).toBe('high');
      expect(result.entityType).toBe('sale');
      expect(result.status).toBe('pending');
    }));

    it('should generate a local ID for the queue item', fakeAsync(async () => {
      const result = await service.queueSale(mockSalePayload);

      expect(mockOfflineStorage.generateLocalId).toHaveBeenCalled();
      expect(result.id).toBe('local_123456_abc');
      expect(result.localTempId).toBe('local_123456_abc');
    }));

    it('should refresh counts after queuing', fakeAsync(async () => {
      await service.queueSale(mockSalePayload);

      expect(mockOfflineStorage.getSyncQueueCount).toHaveBeenCalled();
    }));
  });

  describe('queueWhatsAppMessage', () => {
    it('should queue a WhatsApp message operation', fakeAsync(async () => {
      const result = await service.queueWhatsAppMessage(mockWhatsAppPayload);

      expect(mockOfflineStorage.addToSyncQueue).toHaveBeenCalled();
      expect(result.operationType).toBe('SEND_WHATSAPP');
      expect(result.priority).toBe('normal');
      expect(result.entityType).toBe('whatsapp_message');
    }));
  });

  describe('queueOperation', () => {
    it('should queue a generic operation with custom priority', fakeAsync(async () => {
      const result = await service.queueOperation(
        'CREATE_SALE',
        mockSalePayload,
        'sale',
        'low'
      );

      expect(result.priority).toBe('low');
    }));

    it('should use default priority when not specified', fakeAsync(async () => {
      const result = await service.queueOperation(
        'CREATE_SALE',
        mockSalePayload,
        'sale'
      );

      expect(result.priority).toBe('normal');
    }));
  });

  describe('getPendingItems', () => {
    it('should return pending sync items', fakeAsync(async () => {
      const items = await service.getPendingItems();

      expect(mockOfflineStorage.getPendingSyncItems).toHaveBeenCalled();
      expect(items).toEqual([mockSyncQueueItem]);
    }));
  });

  describe('getConflictItems', () => {
    it('should return conflict items', fakeAsync(async () => {
      const conflictItem: SyncQueueItem = {
        ...mockSyncQueueItem,
        status: 'conflict',
        conflictData: {
          conflictType: 'PRODUCT_ALREADY_SOLD',
          description: 'Product was sold',
          localData: mockSalePayload,
          serverData: null,
          detectedAt: '2024-01-15T10:00:00Z',
          resolutionOptions: []
        }
      };
      mockOfflineStorage.getConflictItems.and.returnValue(Promise.resolve([conflictItem]));

      const items = await service.getConflictItems();

      expect(mockOfflineStorage.getConflictItems).toHaveBeenCalled();
      expect(items).toEqual([conflictItem]);
    }));
  });

  describe('getAllItems', () => {
    it('should return all sync queue items', fakeAsync(async () => {
      const items = await service.getAllItems();

      expect(mockOfflineStorage.getAllSyncQueueItems).toHaveBeenCalled();
      expect(items).toEqual([mockSyncQueueItem]);
    }));
  });

  describe('getItem', () => {
    it('should return a specific queue item', fakeAsync(async () => {
      const item = await service.getItem('test-id-1');

      expect(mockOfflineStorage.getSyncQueueItem).toHaveBeenCalledWith('test-id-1');
      expect(item).toEqual(mockSyncQueueItem);
    }));

    it('should return null for non-existent item', fakeAsync(async () => {
      mockOfflineStorage.getSyncQueueItem.and.returnValue(Promise.resolve(null));

      const item = await service.getItem('non-existent');

      expect(item).toBeNull();
    }));
  });

  describe('markAsSyncing', () => {
    it('should update item status to syncing', fakeAsync(async () => {
      await service.markAsSyncing('test-id-1');

      expect(mockOfflineStorage.getSyncQueueItem).toHaveBeenCalledWith('test-id-1');
      expect(mockOfflineStorage.updateSyncQueueItem).toHaveBeenCalled();

      const updatedItem = mockOfflineStorage.updateSyncQueueItem.calls.mostRecent().args[0];
      expect(updatedItem.status).toBe('syncing');
      expect(updatedItem.lastAttemptAt).toBeDefined();
    }));
  });

  describe('markAsSynced', () => {
    it('should update item status to synced with server ID', fakeAsync(async () => {
      await service.markAsSynced('test-id-1', 'server-id-123');

      expect(mockOfflineStorage.updateSyncQueueItem).toHaveBeenCalled();

      const updatedItem = mockOfflineStorage.updateSyncQueueItem.calls.mostRecent().args[0];
      expect(updatedItem.status).toBe('synced');
      expect(updatedItem.serverId).toBe('server-id-123');
      expect(updatedItem.lastError).toBeNull();
    }));

    it('should refresh counts after marking as synced', fakeAsync(async () => {
      await service.markAsSynced('test-id-1', 'server-id-123');

      expect(mockOfflineStorage.getSyncQueueCount).toHaveBeenCalled();
    }));
  });

  describe('markAsFailed', () => {
    it('should increment retry count and set error', fakeAsync(async () => {
      await service.markAsFailed('test-id-1', 'Network error');

      expect(mockOfflineStorage.updateSyncQueueItem).toHaveBeenCalled();

      const updatedItem = mockOfflineStorage.updateSyncQueueItem.calls.mostRecent().args[0];
      expect(updatedItem.retryCount).toBe(1);
      expect(updatedItem.lastError).toBe('Network error');
    }));

    it('should mark as failed when max retries exceeded', fakeAsync(async () => {
      const itemWithRetries: SyncQueueItem = {
        ...mockSyncQueueItem,
        retryCount: 2,
        maxRetries: 3
      };
      mockOfflineStorage.getSyncQueueItem.and.returnValue(Promise.resolve(itemWithRetries));

      await service.markAsFailed('test-id-1', 'Network error');

      const updatedItem = mockOfflineStorage.updateSyncQueueItem.calls.mostRecent().args[0];
      expect(updatedItem.status).toBe('failed');
    }));

    it('should keep pending status when retries remain', fakeAsync(async () => {
      const itemWithRetries: SyncQueueItem = {
        ...mockSyncQueueItem,
        retryCount: 0,
        maxRetries: 3
      };
      mockOfflineStorage.getSyncQueueItem.and.returnValue(Promise.resolve(itemWithRetries));

      await service.markAsFailed('test-id-1', 'Network error');

      const updatedItem = mockOfflineStorage.updateSyncQueueItem.calls.mostRecent().args[0];
      expect(updatedItem.status).toBe('pending');
    }));
  });

  describe('markAsConflict', () => {
    it('should set conflict status with details', fakeAsync(async () => {
      await service.markAsConflict(
        'test-id-1',
        'PRODUCT_ALREADY_SOLD',
        'Product was sold by another user',
        { productId: 'product-1', currentStatus: 'sold' }
      );

      expect(mockOfflineStorage.updateSyncQueueItem).toHaveBeenCalled();

      const updatedItem = mockOfflineStorage.updateSyncQueueItem.calls.mostRecent().args[0];
      expect(updatedItem.status).toBe('conflict');
      expect(updatedItem.conflictData).toBeDefined();
      expect(updatedItem.conflictData!.conflictType).toBe('PRODUCT_ALREADY_SOLD');
      expect(updatedItem.conflictData!.description).toBe('Product was sold by another user');
    }));

    it('should provide resolution options for RECEIPT_NUMBER_EXISTS', fakeAsync(async () => {
      await service.markAsConflict(
        'test-id-1',
        'RECEIPT_NUMBER_EXISTS',
        'Receipt number already exists'
      );

      const updatedItem = mockOfflineStorage.updateSyncQueueItem.calls.mostRecent().args[0];
      const options = updatedItem.conflictData!.resolutionOptions;

      expect(options.length).toBeGreaterThan(0);
      expect(options.some((o: any) => o.action === 'GENERATE_NEW_NUMBER')).toBeTrue();
    }));

    it('should provide resolution options for PHONE_ALREADY_SOLD', fakeAsync(async () => {
      await service.markAsConflict(
        'test-id-1',
        'PRODUCT_ALREADY_SOLD',
        'Phone already sold'
      );

      const updatedItem = mockOfflineStorage.updateSyncQueueItem.calls.mostRecent().args[0];
      const options = updatedItem.conflictData!.resolutionOptions;

      expect(options.some((o: any) => o.action === 'DISCARD')).toBeTrue();
    }));
  });

  describe('removeItem', () => {
    it('should remove an item from the queue', fakeAsync(async () => {
      await service.removeItem('test-id-1');

      expect(mockOfflineStorage.removeSyncQueueItem).toHaveBeenCalledWith('test-id-1');
    }));

    it('should refresh counts after removal', fakeAsync(async () => {
      await service.removeItem('test-id-1');

      expect(mockOfflineStorage.getSyncQueueCount).toHaveBeenCalled();
    }));
  });

  describe('clearSyncedItems', () => {
    it('should clear all synced items', fakeAsync(async () => {
      await service.clearSyncedItems();

      expect(mockOfflineStorage.clearSyncedItems).toHaveBeenCalled();
    }));
  });

  describe('retryItem', () => {
    it('should reset a failed item for retry', fakeAsync(async () => {
      const failedItem: SyncQueueItem = {
        ...mockSyncQueueItem,
        status: 'failed',
        retryCount: 3,
        lastError: 'Previous error'
      };
      mockOfflineStorage.getSyncQueueItem.and.returnValue(Promise.resolve(failedItem));

      await service.retryItem('test-id-1');

      const updatedItem = mockOfflineStorage.updateSyncQueueItem.calls.mostRecent().args[0];
      expect(updatedItem.status).toBe('pending');
      expect(updatedItem.retryCount).toBe(0);
      expect(updatedItem.lastError).toBeNull();
    }));
  });

  describe('getOfflineTransactions', () => {
    it('should return formatted offline transactions', fakeAsync(async () => {
      const transactions = await service.getOfflineTransactions();

      expect(transactions.length).toBe(1);
      expect(transactions[0].type).toBe('sale');
      expect(transactions[0].displayName).toBe('Apple iPhone 13');
      expect(transactions[0].amount).toBe(500);
    }));

    it('should format WhatsApp transactions correctly', fakeAsync(async () => {
      const whatsAppItem: SyncQueueItem = {
        ...mockSyncQueueItem,
        operationType: 'SEND_WHATSAPP',
        entityType: 'whatsapp_message',
        payload: mockWhatsAppPayload
      };
      mockOfflineStorage.getAllSyncQueueItems.and.returnValue(Promise.resolve([whatsAppItem]));

      const transactions = await service.getOfflineTransactions();

      expect(transactions[0].type).toBe('whatsapp');
      expect(transactions[0].displayName).toContain('WhatsApp');
    }));

    it('should exclude synced items', fakeAsync(async () => {
      const syncedItem: SyncQueueItem = {
        ...mockSyncQueueItem,
        status: 'synced'
      };
      mockOfflineStorage.getAllSyncQueueItems.and.returnValue(Promise.resolve([syncedItem]));

      const transactions = await service.getOfflineTransactions();

      expect(transactions.length).toBe(0);
    }));
  });

  describe('state management', () => {
    it('should update syncing state', () => {
      service.setSyncing(true);
      expect(service.isSyncing()).toBe(true);

      service.setSyncing(false);
      expect(service.isSyncing()).toBe(false);
    });

    it('should update sync progress', () => {
      service.setSyncProgress(50);
      expect(service.syncProgress()).toBe(50);
    });

    it('should clamp progress between 0 and 100', () => {
      service.setSyncProgress(150);
      expect(service.syncProgress()).toBe(100);

      service.setSyncProgress(-10);
      expect(service.syncProgress()).toBe(0);
    });

    it('should update last sync error', () => {
      service.setLastSyncError('Test error');
      expect(service.lastSyncError()).toBe('Test error');

      service.setLastSyncError(null);
      expect(service.lastSyncError()).toBeNull();
    });
  });

  describe('updateLastSyncTime', () => {
    it('should save and update last sync time', fakeAsync(async () => {
      await service.updateLastSyncTime();

      expect(mockOfflineStorage.saveLastSyncTime).toHaveBeenCalled();
      expect(service.lastSyncAt()).toBeDefined();
    }));
  });

  describe('syncStatus computed', () => {
    it('should provide complete sync status object', () => {
      const status = service.syncStatus();

      expect(status).toBeDefined();
      expect(status.isOnline).toBeDefined();
      expect(status.isSyncing).toBeDefined();
      expect(status.pendingCount).toBeDefined();
      expect(status.conflictCount).toBeDefined();
      expect(status.failedCount).toBeDefined();
      expect(status.syncProgress).toBeDefined();
    });
  });
});
