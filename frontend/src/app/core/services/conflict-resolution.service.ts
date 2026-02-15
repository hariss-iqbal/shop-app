import { Injectable, signal } from '@angular/core';
import { SyncQueueService } from './sync-queue.service';
import { OfflineStorageService } from './offline-storage.service';
import { SyncSchedulerService } from './sync-scheduler.service';
import { CurrencyService } from './currency.service';
import {
  SyncQueueItem,
  SyncResolutionAction,
  ResolveConflictRequest,
  ResolveConflictResponse,
  OfflineSalePayload
} from '../../models/offline-sync.model';

/**
 * Conflict Resolution Service
 * Feature: F-020 Offline Mode and Sync
 *
 * Handles resolution of sync conflicts when the same data
 * has been modified both offline and on the server.
 */
@Injectable({
  providedIn: 'root'
})
export class ConflictResolutionService {
  constructor(
    private readonly syncQueue: SyncQueueService,
    private readonly offlineStorage: OfflineStorageService,
    private readonly syncScheduler: SyncSchedulerService,
    private readonly currencyService: CurrencyService
  ) { }

  private readonly _isResolving = signal(false);
  private readonly _currentConflict = signal<SyncQueueItem | null>(null);

  readonly isResolving = this._isResolving.asReadonly();
  readonly currentConflict = this._currentConflict.asReadonly();

  /**
   * Get all items with conflicts
   */
  async getConflicts(): Promise<SyncQueueItem[]> {
    return this.syncQueue.getConflictItems();
  }

  /**
   * Get conflict count
   */
  getConflictCount(): number {
    return this.syncQueue.conflictCount();
  }

  /**
   * Start resolving a conflict
   */
  async startResolving(itemId: string): Promise<SyncQueueItem | null> {
    const item = await this.syncQueue.getItem(itemId);
    if (item && item.status === 'conflict') {
      this._currentConflict.set(item);
      this._isResolving.set(true);
      return item;
    }
    return null;
  }

  /**
   * Cancel conflict resolution
   */
  cancelResolving(): void {
    this._currentConflict.set(null);
    this._isResolving.set(false);
  }

  /**
   * Resolve a conflict with the specified action
   */
  async resolveConflict(request: ResolveConflictRequest): Promise<ResolveConflictResponse> {
    const item = await this.syncQueue.getItem(request.queueItemId);

    if (!item) {
      return {
        success: false,
        message: 'Conflict item not found',
        error: 'Item not found'
      };
    }

    if (item.status !== 'conflict') {
      return {
        success: false,
        message: 'Item is not in conflict state',
        error: 'Invalid state'
      };
    }

    try {
      switch (request.resolution) {
        case 'DISCARD':
          return await this.discardConflict(item);

        case 'GENERATE_NEW_NUMBER':
          return await this.resolveWithNewNumber(item, request.newReceiptNumber);

        case 'KEEP_LOCAL':
          return await this.keepLocalVersion(item);

        case 'KEEP_SERVER':
          return await this.keepServerVersion(item);

        case 'MERGE':
          return await this.mergeVersions(item, request.mergedData);

        default:
          return {
            success: false,
            message: 'Unknown resolution action',
            error: `Unknown action: ${request.resolution}`
          };
      }
    } finally {
      this._currentConflict.set(null);
      this._isResolving.set(false);
    }
  }

  /**
   * Discard the offline operation
   */
  private async discardConflict(item: SyncQueueItem): Promise<ResolveConflictResponse> {
    await this.syncQueue.removeItem(item.id);

    // If this was a sale, restore the phone status in cache
    if (item.operationType === 'CREATE_SALE') {
      const payload = item.payload as OfflineSalePayload;
      await this.offlineStorage.updateCachedProductStatus(payload.productId, 'available');
    }

    return {
      success: true,
      message: 'Conflict discarded. The offline operation has been removed.'
    };
  }

  /**
   * Resolve receipt number conflict by generating a new number
   */
  private async resolveWithNewNumber(
    item: SyncQueueItem,
    newReceiptNumber?: string
  ): Promise<ResolveConflictResponse> {
    if (item.operationType !== 'CREATE_SALE') {
      return {
        success: false,
        message: 'This resolution is only valid for sale operations',
        error: 'Invalid operation type'
      };
    }

    const payload = item.payload as OfflineSalePayload;

    // Generate new receipt number if not provided
    const receiptNumber = newReceiptNumber || this.offlineStorage.generateLocalReceiptNumber();
    payload.localReceiptNumber = receiptNumber;

    // Update the item and reset for retry
    item.payload = payload;
    item.status = 'pending';
    item.retryCount = 0;
    item.lastError = null;
    item.conflictData = undefined;

    await this.offlineStorage.updateSyncQueueItem(item);
    await this.syncQueue.refreshCounts();

    // Trigger sync
    const result = await this.syncScheduler.retryItem(item.id);

    if (result.success) {
      return {
        success: true,
        message: `Conflict resolved. Sale synced with receipt number: ${receiptNumber}`,
        updatedItem: item
      };
    } else if (result.isConflict) {
      return {
        success: false,
        message: 'A new conflict was detected. Please try a different resolution.',
        error: 'New conflict detected'
      };
    } else {
      return {
        success: false,
        message: 'Failed to sync after resolution. Will retry automatically.',
        error: result.error?.errorMessage
      };
    }
  }

  /**
   * Keep the local (offline) version
   */
  private async keepLocalVersion(item: SyncQueueItem): Promise<ResolveConflictResponse> {
    // Reset item for retry with force flag
    item.status = 'pending';
    item.retryCount = 0;
    item.lastError = null;
    item.conflictData = undefined;

    await this.offlineStorage.updateSyncQueueItem(item);
    await this.syncQueue.refreshCounts();

    return {
      success: true,
      message: 'Local version will be used. The operation will retry on next sync.',
      updatedItem: item
    };
  }

  /**
   * Keep the server version (discard local)
   */
  private async keepServerVersion(item: SyncQueueItem): Promise<ResolveConflictResponse> {
    // Just discard the local operation
    return this.discardConflict(item);
  }

  /**
   * Merge local and server versions
   */
  private async mergeVersions(
    item: SyncQueueItem,
    mergedData?: unknown
  ): Promise<ResolveConflictResponse> {
    if (!mergedData) {
      return {
        success: false,
        message: 'Merged data is required for merge resolution',
        error: 'Missing merged data'
      };
    }

    // Update payload with merged data
    item.payload = mergedData as any;
    item.status = 'pending';
    item.retryCount = 0;
    item.lastError = null;
    item.conflictData = undefined;

    await this.offlineStorage.updateSyncQueueItem(item);
    await this.syncQueue.refreshCounts();

    return {
      success: true,
      message: 'Versions merged. The operation will sync on next attempt.',
      updatedItem: item
    };
  }

  /**
   * Resolve all conflicts with the same action
   */
  async resolveAllConflicts(action: SyncResolutionAction): Promise<{
    success: boolean;
    resolved: number;
    failed: number;
    errors: string[];
  }> {
    const conflicts = await this.getConflicts();
    const results = {
      success: true,
      resolved: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const item of conflicts) {
      const result = await this.resolveConflict({
        queueItemId: item.id,
        resolution: action
      });

      if (result.success) {
        results.resolved++;
      } else {
        results.failed++;
        results.errors.push(`${item.id}: ${result.error || result.message}`);
      }
    }

    results.success = results.failed === 0;
    return results;
  }

  /**
   * Get a summary of conflict types
   */
  async getConflictSummary(): Promise<{
    total: number;
    byType: Record<string, number>;
  }> {
    const conflicts = await this.getConflicts();
    const byType: Record<string, number> = {};

    for (const item of conflicts) {
      const type = item.conflictData?.conflictType || 'UNKNOWN';
      byType[type] = (byType[type] || 0) + 1;
    }

    return {
      total: conflicts.length,
      byType
    };
  }

  /**
   * Get conflict details for display
   */
  getConflictDisplayInfo(item: SyncQueueItem): {
    title: string;
    description: string;
    localSummary: string;
    serverSummary: string | null;
    options: Array<{ label: string; action: SyncResolutionAction; recommended: boolean }>;
  } {
    const conflictData = item.conflictData;
    if (!conflictData) {
      return {
        title: 'Unknown Conflict',
        description: 'An unknown conflict occurred during synchronization.',
        localSummary: 'Local data',
        serverSummary: null,
        options: [
          { label: 'Discard', action: 'DISCARD', recommended: true }
        ]
      };
    }

    let title = 'Sync Conflict';
    let description = conflictData.description;
    let localSummary = '';
    let serverSummary: string | null = null;

    if (item.operationType === 'CREATE_SALE') {
      const payload = item.payload as OfflineSalePayload;
      localSummary = `${payload.productDetails.brandName} ${payload.productDetails.model} - ${this.currencyService.format(payload.salePrice)}`;

      switch (conflictData.conflictType) {
        case 'PRODUCT_ALREADY_SOLD':
          title = 'Product Already Sold';
          description = 'This product was sold by another user while you were offline.';
          break;
        case 'PRODUCT_NOT_AVAILABLE':
          title = 'Product Not Available';
          description = 'This product is no longer available in the inventory.';
          break;
        case 'RECEIPT_NUMBER_EXISTS':
          title = 'Receipt Number Conflict';
          description = 'The receipt number already exists. A new number will be generated.';
          break;
      }
    }

    const options = (conflictData.resolutionOptions || []).map(opt => ({
      label: opt.label,
      action: opt.action,
      recommended: opt.isRecommended
    }));

    return {
      title,
      description,
      localSummary,
      serverSummary,
      options
    };
  }
}
