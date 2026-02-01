import { TestBed, fakeAsync } from '@angular/core/testing';
import { ConflictResolutionService } from './conflict-resolution.service';
import { SyncQueueService } from './sync-queue.service';
import { OfflineStorageService } from './offline-storage.service';
import { SyncSchedulerService } from './sync-scheduler.service';
import { signal } from '@angular/core';
import {
  SyncQueueItem,
  OfflineSalePayload,
  ResolveConflictRequest
} from '../../models/offline-sync.model';

/**
 * Unit tests for ConflictResolutionService
 * Feature: F-020 Offline Mode and Sync
 */
describe('ConflictResolutionService', () => {
  let service: ConflictResolutionService;
  let mockSyncQueue: jasmine.SpyObj<SyncQueueService>;
  let mockOfflineStorage: jasmine.SpyObj<OfflineStorageService>;
  let mockSyncScheduler: jasmine.SpyObj<SyncSchedulerService>;

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

  const mockConflictItem: SyncQueueItem = {
    id: 'conflict-id-1',
    operationType: 'CREATE_SALE',
    payload: mockSalePayload,
    status: 'conflict',
    priority: 'high',
    retryCount: 1,
    maxRetries: 3,
    createdAt: '2024-01-15T10:00:00Z',
    lastAttemptAt: '2024-01-15T10:05:00Z',
    lastError: null,
    localTempId: 'conflict-id-1',
    entityType: 'sale',
    conflictData: {
      conflictType: 'PHONE_ALREADY_SOLD',
      description: 'Phone was sold by another user',
      localData: mockSalePayload,
      serverData: { phoneId: 'phone-1', currentStatus: 'sold' },
      detectedAt: '2024-01-15T10:05:00Z',
      resolutionOptions: [
        {
          id: 'discard',
          label: 'Discard Sale',
          description: 'Remove this offline sale',
          action: 'DISCARD',
          isRecommended: true
        }
      ]
    }
  };

  beforeEach(() => {
    mockSyncQueue = jasmine.createSpyObj('SyncQueueService', [
      'getConflictItems',
      'getItem',
      'removeItem',
      'refreshCounts'
    ], {
      conflictCount: signal(1)
    });

    mockOfflineStorage = jasmine.createSpyObj('OfflineStorageService', [
      'updateSyncQueueItem',
      'updateCachedPhoneStatus',
      'generateLocalReceiptNumber'
    ]);

    mockSyncScheduler = jasmine.createSpyObj('SyncSchedulerService', [
      'retryItem'
    ]);

    // Setup default return values
    mockSyncQueue.getConflictItems.and.returnValue(Promise.resolve([mockConflictItem]));
    mockSyncQueue.getItem.and.returnValue(Promise.resolve(mockConflictItem));
    mockSyncQueue.removeItem.and.returnValue(Promise.resolve());
    mockSyncQueue.refreshCounts.and.returnValue(Promise.resolve());
    mockOfflineStorage.updateSyncQueueItem.and.returnValue(Promise.resolve());
    mockOfflineStorage.updateCachedPhoneStatus.and.returnValue(Promise.resolve());
    mockOfflineStorage.generateLocalReceiptNumber.and.returnValue('OFF-20240115-NEW1');
    mockSyncScheduler.retryItem.and.returnValue(Promise.resolve({
      success: true,
      isConflict: false,
      serverId: 'server-123'
    }));

    TestBed.configureTestingModule({
      providers: [
        ConflictResolutionService,
        { provide: SyncQueueService, useValue: mockSyncQueue },
        { provide: OfflineStorageService, useValue: mockOfflineStorage },
        { provide: SyncSchedulerService, useValue: mockSyncScheduler }
      ]
    });

    service = TestBed.inject(ConflictResolutionService);
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should expose isResolving signal', () => {
      expect(service.isResolving).toBeDefined();
      expect(service.isResolving()).toBe(false);
    });

    it('should expose currentConflict signal', () => {
      expect(service.currentConflict).toBeDefined();
      expect(service.currentConflict()).toBeNull();
    });
  });

  describe('getConflicts', () => {
    it('should return all conflict items', fakeAsync(async () => {
      const conflicts = await service.getConflicts();

      expect(mockSyncQueue.getConflictItems).toHaveBeenCalled();
      expect(conflicts).toEqual([mockConflictItem]);
    }));
  });

  describe('getConflictCount', () => {
    it('should return conflict count from sync queue', () => {
      const count = service.getConflictCount();

      expect(count).toBe(1);
    });
  });

  describe('startResolving', () => {
    it('should set current conflict and resolving state', fakeAsync(async () => {
      const item = await service.startResolving('conflict-id-1');

      expect(mockSyncQueue.getItem).toHaveBeenCalledWith('conflict-id-1');
      expect(service.isResolving()).toBe(true);
      expect(service.currentConflict()).toEqual(mockConflictItem);
      expect(item).toEqual(mockConflictItem);
    }));

    it('should return null for non-conflict items', fakeAsync(async () => {
      const nonConflictItem: SyncQueueItem = {
        ...mockConflictItem,
        status: 'pending'
      };
      mockSyncQueue.getItem.and.returnValue(Promise.resolve(nonConflictItem));

      const item = await service.startResolving('conflict-id-1');

      expect(item).toBeNull();
      expect(service.isResolving()).toBe(false);
    }));

    it('should return null for non-existent items', fakeAsync(async () => {
      mockSyncQueue.getItem.and.returnValue(Promise.resolve(null));

      const item = await service.startResolving('non-existent');

      expect(item).toBeNull();
    }));
  });

  describe('cancelResolving', () => {
    it('should clear current conflict and resolving state', fakeAsync(async () => {
      await service.startResolving('conflict-id-1');
      expect(service.isResolving()).toBe(true);

      service.cancelResolving();

      expect(service.isResolving()).toBe(false);
      expect(service.currentConflict()).toBeNull();
    }));
  });

  describe('resolveConflict', () => {
    describe('DISCARD resolution', () => {
      it('should remove the conflict item', fakeAsync(async () => {
        const request: ResolveConflictRequest = {
          queueItemId: 'conflict-id-1',
          resolution: 'DISCARD'
        };

        const result = await service.resolveConflict(request);

        expect(mockSyncQueue.removeItem).toHaveBeenCalledWith('conflict-id-1');
        expect(result.success).toBe(true);
        expect(result.message).toContain('discarded');
      }));

      it('should restore phone status for sales', fakeAsync(async () => {
        const request: ResolveConflictRequest = {
          queueItemId: 'conflict-id-1',
          resolution: 'DISCARD'
        };

        await service.resolveConflict(request);

        expect(mockOfflineStorage.updateCachedPhoneStatus).toHaveBeenCalledWith('phone-1', 'available');
      }));
    });

    describe('GENERATE_NEW_NUMBER resolution', () => {
      it('should update payload and retry sync', fakeAsync(async () => {
        const request: ResolveConflictRequest = {
          queueItemId: 'conflict-id-1',
          resolution: 'GENERATE_NEW_NUMBER'
        };

        const result = await service.resolveConflict(request);

        expect(mockOfflineStorage.updateSyncQueueItem).toHaveBeenCalled();
        expect(mockSyncScheduler.retryItem).toHaveBeenCalled();
        expect(result.success).toBe(true);
      }));

      it('should use provided receipt number if given', fakeAsync(async () => {
        const request: ResolveConflictRequest = {
          queueItemId: 'conflict-id-1',
          resolution: 'GENERATE_NEW_NUMBER',
          newReceiptNumber: 'CUSTOM-REC-001'
        };

        await service.resolveConflict(request);

        const updatedItem = mockOfflineStorage.updateSyncQueueItem.calls.mostRecent().args[0];
        expect((updatedItem.payload as OfflineSalePayload).localReceiptNumber).toBe('CUSTOM-REC-001');
      }));

      it('should generate receipt number if not provided', fakeAsync(async () => {
        const request: ResolveConflictRequest = {
          queueItemId: 'conflict-id-1',
          resolution: 'GENERATE_NEW_NUMBER'
        };

        await service.resolveConflict(request);

        expect(mockOfflineStorage.generateLocalReceiptNumber).toHaveBeenCalled();
      }));

      it('should handle sync failure after resolution', fakeAsync(async () => {
        mockSyncScheduler.retryItem.and.returnValue(Promise.resolve({
          success: false,
          isConflict: false,
          error: {
            itemId: 'conflict-id-1',
            operationType: 'CREATE_RECEIPT',
            errorCode: 'NETWORK_ERROR',
            errorMessage: 'Network error',
            canRetry: true
          }
        }));

        const request: ResolveConflictRequest = {
          queueItemId: 'conflict-id-1',
          resolution: 'GENERATE_NEW_NUMBER'
        };

        const result = await service.resolveConflict(request);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Failed');
      }));

      it('should handle new conflict after resolution', fakeAsync(async () => {
        mockSyncScheduler.retryItem.and.returnValue(Promise.resolve({
          success: false,
          isConflict: true
        }));

        const request: ResolveConflictRequest = {
          queueItemId: 'conflict-id-1',
          resolution: 'GENERATE_NEW_NUMBER'
        };

        const result = await service.resolveConflict(request);

        expect(result.success).toBe(false);
        expect(result.message).toContain('new conflict');
      }));

      it('should reject for non-sale operations', fakeAsync(async () => {
        const whatsAppConflict: SyncQueueItem = {
          ...mockConflictItem,
          operationType: 'SEND_WHATSAPP',
          entityType: 'whatsapp_message'
        };
        mockSyncQueue.getItem.and.returnValue(Promise.resolve(whatsAppConflict));

        const request: ResolveConflictRequest = {
          queueItemId: 'conflict-id-1',
          resolution: 'GENERATE_NEW_NUMBER'
        };

        const result = await service.resolveConflict(request);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid operation');
      }));
    });

    describe('KEEP_LOCAL resolution', () => {
      it('should reset item for retry', fakeAsync(async () => {
        const request: ResolveConflictRequest = {
          queueItemId: 'conflict-id-1',
          resolution: 'KEEP_LOCAL'
        };

        const result = await service.resolveConflict(request);

        expect(mockOfflineStorage.updateSyncQueueItem).toHaveBeenCalled();
        const updatedItem = mockOfflineStorage.updateSyncQueueItem.calls.mostRecent().args[0];
        expect(updatedItem.status).toBe('pending');
        expect(updatedItem.retryCount).toBe(0);
        expect(result.success).toBe(true);
      }));
    });

    describe('KEEP_SERVER resolution', () => {
      it('should discard the local version', fakeAsync(async () => {
        const request: ResolveConflictRequest = {
          queueItemId: 'conflict-id-1',
          resolution: 'KEEP_SERVER'
        };

        const result = await service.resolveConflict(request);

        expect(mockSyncQueue.removeItem).toHaveBeenCalledWith('conflict-id-1');
        expect(result.success).toBe(true);
      }));
    });

    describe('MERGE resolution', () => {
      it('should update with merged data', fakeAsync(async () => {
        const mergedPayload = {
          ...mockSalePayload,
          notes: 'Merged notes'
        };
        const request: ResolveConflictRequest = {
          queueItemId: 'conflict-id-1',
          resolution: 'MERGE',
          mergedData: mergedPayload
        };

        const result = await service.resolveConflict(request);

        expect(mockOfflineStorage.updateSyncQueueItem).toHaveBeenCalled();
        const updatedItem = mockOfflineStorage.updateSyncQueueItem.calls.mostRecent().args[0];
        expect(updatedItem.payload).toEqual(mergedPayload);
        expect(result.success).toBe(true);
      }));

      it('should require merged data', fakeAsync(async () => {
        const request: ResolveConflictRequest = {
          queueItemId: 'conflict-id-1',
          resolution: 'MERGE'
        };

        const result = await service.resolveConflict(request);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Missing');
      }));
    });

    describe('error handling', () => {
      it('should handle item not found', fakeAsync(async () => {
        mockSyncQueue.getItem.and.returnValue(Promise.resolve(null));

        const request: ResolveConflictRequest = {
          queueItemId: 'non-existent',
          resolution: 'DISCARD'
        };

        const result = await service.resolveConflict(request);

        expect(result.success).toBe(false);
        expect(result.error).toContain('not found');
      }));

      it('should handle non-conflict state', fakeAsync(async () => {
        const pendingItem: SyncQueueItem = {
          ...mockConflictItem,
          status: 'pending'
        };
        mockSyncQueue.getItem.and.returnValue(Promise.resolve(pendingItem));

        const request: ResolveConflictRequest = {
          queueItemId: 'conflict-id-1',
          resolution: 'DISCARD'
        };

        const result = await service.resolveConflict(request);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid state');
      }));

      it('should handle unknown resolution action', fakeAsync(async () => {
        const request: ResolveConflictRequest = {
          queueItemId: 'conflict-id-1',
          resolution: 'UNKNOWN_ACTION' as any
        };

        const result = await service.resolveConflict(request);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Unknown');
      }));
    });

    it('should clear resolving state after completion', fakeAsync(async () => {
      await service.startResolving('conflict-id-1');
      expect(service.isResolving()).toBe(true);

      await service.resolveConflict({
        queueItemId: 'conflict-id-1',
        resolution: 'DISCARD'
      });

      expect(service.isResolving()).toBe(false);
      expect(service.currentConflict()).toBeNull();
    }));
  });

  describe('resolveAllConflicts', () => {
    it('should resolve all conflicts with same action', fakeAsync(async () => {
      const result = await service.resolveAllConflicts('DISCARD');

      expect(result.resolved).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.success).toBe(true);
    }));

    it('should track failures', fakeAsync(async () => {
      mockSyncQueue.getItem.and.returnValue(Promise.resolve(null));

      const result = await service.resolveAllConflicts('DISCARD');

      expect(result.failed).toBe(1);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBe(1);
    }));

    it('should handle multiple conflicts', fakeAsync(async () => {
      const conflict2: SyncQueueItem = {
        ...mockConflictItem,
        id: 'conflict-id-2'
      };
      mockSyncQueue.getConflictItems.and.returnValue(Promise.resolve([mockConflictItem, conflict2]));
      mockSyncQueue.getItem.and.callFake((id: string) => {
        if (id === 'conflict-id-1') return Promise.resolve(mockConflictItem);
        if (id === 'conflict-id-2') return Promise.resolve(conflict2);
        return Promise.resolve(null);
      });

      const result = await service.resolveAllConflicts('DISCARD');

      expect(result.resolved).toBe(2);
      expect(mockSyncQueue.removeItem).toHaveBeenCalledTimes(2);
    }));
  });

  describe('getConflictSummary', () => {
    it('should return summary by conflict type', fakeAsync(async () => {
      const summary = await service.getConflictSummary();

      expect(summary.total).toBe(1);
      expect(summary.byType['PHONE_ALREADY_SOLD']).toBe(1);
    }));

    it('should handle items without conflict data', fakeAsync(async () => {
      const itemWithoutData: SyncQueueItem = {
        ...mockConflictItem,
        conflictData: undefined
      };
      mockSyncQueue.getConflictItems.and.returnValue(Promise.resolve([itemWithoutData]));

      const summary = await service.getConflictSummary();

      expect(summary.byType['UNKNOWN']).toBe(1);
    }));
  });

  describe('getConflictDisplayInfo', () => {
    it('should return display info for PHONE_ALREADY_SOLD', () => {
      const info = service.getConflictDisplayInfo(mockConflictItem);

      expect(info.title).toBe('Phone Already Sold');
      expect(info.description).toContain('sold by another user');
      expect(info.localSummary).toContain('Apple iPhone 13');
      expect(info.options.length).toBeGreaterThan(0);
    });

    it('should return display info for PHONE_NOT_AVAILABLE', () => {
      const item: SyncQueueItem = {
        ...mockConflictItem,
        conflictData: {
          ...mockConflictItem.conflictData!,
          conflictType: 'PHONE_NOT_AVAILABLE'
        }
      };

      const info = service.getConflictDisplayInfo(item);

      expect(info.title).toBe('Phone Not Available');
    });

    it('should return display info for RECEIPT_NUMBER_EXISTS', () => {
      const item: SyncQueueItem = {
        ...mockConflictItem,
        conflictData: {
          ...mockConflictItem.conflictData!,
          conflictType: 'RECEIPT_NUMBER_EXISTS'
        }
      };

      const info = service.getConflictDisplayInfo(item);

      expect(info.title).toBe('Receipt Number Conflict');
    });

    it('should handle items without conflict data', () => {
      const item: SyncQueueItem = {
        ...mockConflictItem,
        conflictData: undefined
      };

      const info = service.getConflictDisplayInfo(item);

      expect(info.title).toBe('Unknown Conflict');
      expect(info.options.length).toBeGreaterThan(0);
    });

    it('should mark recommended options', () => {
      const info = service.getConflictDisplayInfo(mockConflictItem);

      const recommendedOption = info.options.find(o => o.recommended);
      expect(recommendedOption).toBeDefined();
    });
  });
});
