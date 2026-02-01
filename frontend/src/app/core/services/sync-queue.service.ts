import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { OfflineStorageService } from './offline-storage.service';
import { NetworkStatusService } from './network-status.service';
import {
  SyncQueueItem,
  SyncOperationType,
  SyncPriority,
  SyncPayload,
  SyncEntityType,
  AppSyncStatus,
  OfflineTransaction,
  OfflineSalePayload,
  OfflineWhatsAppPayload
} from '../../models/offline-sync.model';

/**
 * Sync Queue Service
 * Feature: F-020 Offline Mode and Sync
 *
 * Manages the queue of offline operations pending synchronization.
 * Provides methods to add, update, and retrieve sync queue items.
 */
@Injectable({
  providedIn: 'root'
})
export class SyncQueueService {
  private readonly offlineStorage = inject(OfflineStorageService);
  private readonly networkStatus = inject(NetworkStatusService);
  private readonly destroyRef = inject(DestroyRef);

  // Reactive state
  private readonly _pendingCount = signal(0);
  private readonly _conflictCount = signal(0);
  private readonly _failedCount = signal(0);
  private readonly _isSyncing = signal(false);
  private readonly _syncProgress = signal(0);
  private readonly _lastSyncAt = signal<string | null>(null);
  private readonly _lastSyncError = signal<string | null>(null);

  // Public computed signals
  readonly pendingCount = this._pendingCount.asReadonly();
  readonly conflictCount = this._conflictCount.asReadonly();
  readonly failedCount = this._failedCount.asReadonly();
  readonly isSyncing = this._isSyncing.asReadonly();
  readonly syncProgress = this._syncProgress.asReadonly();
  readonly lastSyncAt = this._lastSyncAt.asReadonly();
  readonly lastSyncError = this._lastSyncError.asReadonly();

  readonly hasPendingItems = computed(() => this._pendingCount() > 0);
  readonly hasConflicts = computed(() => this._conflictCount() > 0);
  readonly hasFailedItems = computed(() => this._failedCount() > 0);
  readonly totalPendingCount = computed(() =>
    this._pendingCount() + this._failedCount()
  );

  readonly syncStatus = computed<AppSyncStatus>(() => ({
    isOnline: this.networkStatus.isOnline(),
    isSyncing: this._isSyncing(),
    pendingCount: this._pendingCount(),
    conflictCount: this._conflictCount(),
    failedCount: this._failedCount(),
    lastSyncAt: this._lastSyncAt(),
    syncProgress: this._syncProgress(),
    lastSyncError: this._lastSyncError()
  }));

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    // Wait for storage to be ready
    await this.waitForStorage();

    // Load initial counts
    await this.refreshCounts();

    // Load last sync time
    const lastSync = await this.offlineStorage.getLastSyncTime();
    this._lastSyncAt.set(lastSync);

    // Periodically refresh counts
    interval(30000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshCounts());
  }

  private async waitForStorage(): Promise<void> {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (this.offlineStorage.isReady()) {
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });
  }

  async refreshCounts(): Promise<void> {
    try {
      const counts = await this.offlineStorage.getSyncQueueCount();
      this._pendingCount.set(counts.pending);
      this._conflictCount.set(counts.conflict);
      this._failedCount.set(counts.failed);
    } catch (error) {
      console.error('Failed to refresh sync queue counts:', error);
    }
  }

  /**
   * Queue a sale operation for offline sync
   */
  async queueSale(payload: OfflineSalePayload): Promise<SyncQueueItem> {
    const item = this.createQueueItem('CREATE_SALE', payload, 'sale', 'high');
    await this.offlineStorage.addToSyncQueue(item);
    await this.refreshCounts();
    return item;
  }

  /**
   * Queue a WhatsApp message for offline sync
   */
  async queueWhatsAppMessage(payload: OfflineWhatsAppPayload): Promise<SyncQueueItem> {
    const item = this.createQueueItem('SEND_WHATSAPP', payload, 'whatsapp_message', 'normal');
    await this.offlineStorage.addToSyncQueue(item);
    await this.refreshCounts();
    return item;
  }

  /**
   * Queue any operation for offline sync
   */
  async queueOperation(
    operationType: SyncOperationType,
    payload: SyncPayload,
    entityType: SyncEntityType,
    priority: SyncPriority = 'normal'
  ): Promise<SyncQueueItem> {
    const item = this.createQueueItem(operationType, payload, entityType, priority);
    await this.offlineStorage.addToSyncQueue(item);
    await this.refreshCounts();
    return item;
  }

  private createQueueItem(
    operationType: SyncOperationType,
    payload: SyncPayload,
    entityType: SyncEntityType,
    priority: SyncPriority
  ): SyncQueueItem {
    const now = new Date().toISOString();
    const localId = this.offlineStorage.generateLocalId();

    return {
      id: localId,
      operationType,
      payload,
      status: 'pending',
      priority,
      retryCount: 0,
      maxRetries: 3,
      createdAt: now,
      lastAttemptAt: null,
      lastError: null,
      localTempId: localId,
      entityType
    };
  }

  /**
   * Get all pending items ready for sync
   */
  async getPendingItems(): Promise<SyncQueueItem[]> {
    return this.offlineStorage.getPendingSyncItems();
  }

  /**
   * Get all items with conflicts
   */
  async getConflictItems(): Promise<SyncQueueItem[]> {
    return this.offlineStorage.getConflictItems();
  }

  /**
   * Get all sync queue items
   */
  async getAllItems(): Promise<SyncQueueItem[]> {
    return this.offlineStorage.getAllSyncQueueItems();
  }

  /**
   * Get a specific queue item
   */
  async getItem(id: string): Promise<SyncQueueItem | null> {
    return this.offlineStorage.getSyncQueueItem(id);
  }

  /**
   * Update item status to syncing
   */
  async markAsSyncing(id: string): Promise<void> {
    const item = await this.offlineStorage.getSyncQueueItem(id);
    if (item) {
      item.status = 'syncing';
      item.lastAttemptAt = new Date().toISOString();
      await this.offlineStorage.updateSyncQueueItem(item);
    }
  }

  /**
   * Mark item as successfully synced
   */
  async markAsSynced(id: string, serverId: string): Promise<void> {
    const item = await this.offlineStorage.getSyncQueueItem(id);
    if (item) {
      item.status = 'synced';
      item.serverId = serverId;
      item.lastAttemptAt = new Date().toISOString();
      item.lastError = null;
      await this.offlineStorage.updateSyncQueueItem(item);
      await this.refreshCounts();
    }
  }

  /**
   * Mark item as failed
   */
  async markAsFailed(id: string, error: string): Promise<void> {
    const item = await this.offlineStorage.getSyncQueueItem(id);
    if (item) {
      item.retryCount++;
      item.lastAttemptAt = new Date().toISOString();
      item.lastError = error;

      if (item.retryCount >= item.maxRetries) {
        item.status = 'failed';
      } else {
        item.status = 'pending';
      }

      await this.offlineStorage.updateSyncQueueItem(item);
      await this.refreshCounts();
    }
  }

  /**
   * Mark item as having a conflict
   */
  async markAsConflict(
    id: string,
    conflictType: string,
    description: string,
    serverData?: unknown
  ): Promise<void> {
    const item = await this.offlineStorage.getSyncQueueItem(id);
    if (item) {
      item.status = 'conflict';
      item.lastAttemptAt = new Date().toISOString();
      item.conflictData = {
        conflictType: conflictType as any,
        description,
        localData: item.payload,
        serverData,
        detectedAt: new Date().toISOString(),
        resolutionOptions: this.getResolutionOptions(conflictType)
      };
      await this.offlineStorage.updateSyncQueueItem(item);
      await this.refreshCounts();
    }
  }

  private getResolutionOptions(conflictType: string): any[] {
    switch (conflictType) {
      case 'RECEIPT_NUMBER_EXISTS':
        return [
          {
            id: 'generate_new',
            label: 'Generate New Number',
            description: 'Create a new receipt number and sync',
            action: 'GENERATE_NEW_NUMBER',
            isRecommended: true
          },
          {
            id: 'discard',
            label: 'Discard Transaction',
            description: 'Remove this offline transaction',
            action: 'DISCARD',
            isRecommended: false
          }
        ];
      case 'PHONE_ALREADY_SOLD':
      case 'PHONE_NOT_AVAILABLE':
        return [
          {
            id: 'discard',
            label: 'Discard Sale',
            description: 'The phone is no longer available - remove this sale',
            action: 'DISCARD',
            isRecommended: true
          }
        ];
      default:
        return [
          {
            id: 'keep_local',
            label: 'Keep Local Version',
            description: 'Use the offline version',
            action: 'KEEP_LOCAL',
            isRecommended: false
          },
          {
            id: 'keep_server',
            label: 'Keep Server Version',
            description: 'Discard offline changes',
            action: 'KEEP_SERVER',
            isRecommended: true
          }
        ];
    }
  }

  /**
   * Remove a queue item
   */
  async removeItem(id: string): Promise<void> {
    await this.offlineStorage.removeSyncQueueItem(id);
    await this.refreshCounts();
  }

  /**
   * Clear all synced items
   */
  async clearSyncedItems(): Promise<void> {
    await this.offlineStorage.clearSyncedItems();
    await this.refreshCounts();
  }

  /**
   * Reset a failed item for retry
   */
  async retryItem(id: string): Promise<void> {
    const item = await this.offlineStorage.getSyncQueueItem(id);
    if (item) {
      item.status = 'pending';
      item.retryCount = 0;
      item.lastError = null;
      await this.offlineStorage.updateSyncQueueItem(item);
      await this.refreshCounts();
    }
  }

  /**
   * Get offline transactions for display
   */
  async getOfflineTransactions(): Promise<OfflineTransaction[]> {
    const items = await this.offlineStorage.getAllSyncQueueItems();
    return items
      .filter(item => item.status !== 'synced')
      .map(item => this.mapToOfflineTransaction(item));
  }

  private mapToOfflineTransaction(item: SyncQueueItem): OfflineTransaction {
    let displayName = '';
    let amount: number | null = null;
    let customerName: string | null = null;
    let receiptNumber: string | null = null;

    if (item.operationType === 'CREATE_SALE') {
      const payload = item.payload as OfflineSalePayload;
      displayName = `${payload.phoneDetails.brandName} ${payload.phoneDetails.model}`;
      amount = payload.salePrice;
      customerName = payload.buyerName;
      receiptNumber = payload.localReceiptNumber;
    } else if (item.operationType === 'SEND_WHATSAPP') {
      const payload = item.payload as OfflineWhatsAppPayload;
      displayName = `WhatsApp to ${payload.phoneNumber}`;
      amount = payload.grandTotal;
      customerName = payload.customerName;
      receiptNumber = payload.receiptNumber;
    }

    return {
      id: item.id,
      type: item.entityType === 'whatsapp_message' ? 'whatsapp' :
            item.entityType === 'receipt' ? 'receipt' : 'sale',
      displayName,
      amount,
      status: item.status,
      createdAt: item.createdAt,
      customerName,
      receiptNumber,
      retryCount: item.retryCount,
      lastError: item.lastError
    };
  }

  /**
   * Update sync state
   */
  setSyncing(isSyncing: boolean): void {
    this._isSyncing.set(isSyncing);
  }

  setSyncProgress(progress: number): void {
    this._syncProgress.set(Math.min(100, Math.max(0, progress)));
  }

  setLastSyncError(error: string | null): void {
    this._lastSyncError.set(error);
  }

  async updateLastSyncTime(): Promise<void> {
    const now = new Date().toISOString();
    await this.offlineStorage.saveLastSyncTime(now);
    this._lastSyncAt.set(now);
  }
}
