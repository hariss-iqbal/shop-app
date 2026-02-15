import { Injectable, signal, DestroyRef, NgZone } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, merge, timer, Subject } from 'rxjs';
import { debounceTime, filter, switchMap } from 'rxjs/operators';
import { SyncQueueService } from './sync-queue.service';
import { OfflineStorageService } from './offline-storage.service';
import { NetworkStatusService } from './network-status.service';
import { SupabaseService } from './supabase.service';
import {
  SyncQueueItem,
  SyncBatchResult,
  SyncError,
  OfflineSalePayload,
  OfflineWhatsAppPayload,
  DEFAULT_OFFLINE_SYNC_CONFIG,
  OfflineSyncConfig
} from '../../models/offline-sync.model';

/**
 * Sync Scheduler Service
 * Feature: F-020 Offline Mode and Sync
 *
 * Automatically syncs pending offline operations when connection is restored.
 * Handles retry logic, batch processing, and conflict detection.
 */
@Injectable({
  providedIn: 'root'
})
export class SyncSchedulerService {

  private config: OfflineSyncConfig = DEFAULT_OFFLINE_SYNC_CONFIG;
  private syncInProgress = false;
  private readonly manualSyncTrigger$ = new Subject<void>();

  // State signals
  private readonly _currentSyncItem = signal<string | null>(null);
  private readonly _syncResults = signal<SyncBatchResult | null>(null);

  readonly currentSyncItem = this._currentSyncItem.asReadonly();
  readonly syncResults = this._syncResults.asReadonly();
  readonly isSyncing = this.syncQueue.isSyncing;

  constructor(
    private readonly syncQueue: SyncQueueService,
    private readonly offlineStorage: OfflineStorageService,
    private readonly networkStatus: NetworkStatusService,
    private readonly supabase: SupabaseService,
    private readonly destroyRef: DestroyRef,
    private readonly ngZone: NgZone
  ) {
    this.initializeScheduler();
  }

  private async initializeScheduler(): Promise<void> {
    // Load config
    try {
      this.config = await this.offlineStorage.getSyncConfig();
    } catch {
      this.config = DEFAULT_OFFLINE_SYNC_CONFIG;
    }

    // Listen for online events
    this.ngZone.runOutsideAngular(() => {
      const online$ = fromEvent(window, 'online');

      merge(online$, this.manualSyncTrigger$)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          filter(() => this.config.autoSyncEnabled || this.manualSyncTrigger$.observed),
          debounceTime(this.config.autoSyncDelayMs),
          filter(() => this.networkStatus.isOnline()),
          switchMap(() => timer(0))
        )
        .subscribe(() => {
          this.ngZone.run(() => this.startSync());
        });
    });
  }

  /**
   * Manually trigger sync
   */
  async triggerSync(): Promise<SyncBatchResult> {
    if (!this.networkStatus.isOnline()) {
      return {
        success: false,
        totalItems: 0,
        syncedItems: 0,
        failedItems: 0,
        conflictItems: 0,
        errors: [{
          itemId: '',
          operationType: 'CREATE_SALE',
          errorCode: 'OFFLINE',
          errorMessage: 'Cannot sync while offline',
          canRetry: true
        }],
        conflicts: [],
        syncedAt: new Date().toISOString()
      };
    }

    this.manualSyncTrigger$.next();
    return this.startSync();
  }

  /**
   * Start the sync process
   */
  private async startSync(): Promise<SyncBatchResult> {
    if (this.syncInProgress) {
      return {
        success: false,
        totalItems: 0,
        syncedItems: 0,
        failedItems: 0,
        conflictItems: 0,
        errors: [{
          itemId: '',
          operationType: 'CREATE_SALE',
          errorCode: 'SYNC_IN_PROGRESS',
          errorMessage: 'Sync already in progress',
          canRetry: true
        }],
        conflicts: [],
        syncedAt: new Date().toISOString()
      };
    }

    this.syncInProgress = true;
    this.syncQueue.setSyncing(true);
    this.syncQueue.setSyncProgress(0);
    this.syncQueue.setLastSyncError(null);

    const result: SyncBatchResult = {
      success: true,
      totalItems: 0,
      syncedItems: 0,
      failedItems: 0,
      conflictItems: 0,
      errors: [],
      conflicts: [],
      syncedAt: new Date().toISOString()
    };

    try {
      const pendingItems = await this.syncQueue.getPendingItems();
      result.totalItems = pendingItems.length;

      if (pendingItems.length === 0) {
        this.syncQueue.setSyncProgress(100);
        await this.syncQueue.updateLastSyncTime();
        this._syncResults.set(result);
        return result;
      }

      // Process in batches
      const batches = this.chunkArray(pendingItems, this.config.syncBatchSize);
      let processedCount = 0;

      for (const batch of batches) {
        for (const item of batch) {
          if (!this.networkStatus.isOnline()) {
            result.success = false;
            result.errors.push({
              itemId: item.id,
              operationType: item.operationType,
              errorCode: 'CONNECTION_LOST',
              errorMessage: 'Connection lost during sync',
              canRetry: true
            });
            break;
          }

          this._currentSyncItem.set(item.id);
          await this.syncQueue.markAsSyncing(item.id);

          const itemResult = await this.syncItem(item);

          if (itemResult.success) {
            result.syncedItems++;
          } else if (itemResult.isConflict) {
            result.conflictItems++;
            result.conflicts.push(item);
          } else {
            result.failedItems++;
            result.errors.push(itemResult.error!);
          }

          processedCount++;
          const progress = Math.round((processedCount / result.totalItems) * 100);
          this.syncQueue.setSyncProgress(progress);
        }

        // Small delay between batches
        if (batches.indexOf(batch) < batches.length - 1) {
          await this.delay(500);
        }
      }

      this._currentSyncItem.set(null);

      if (result.failedItems > 0 || result.conflictItems > 0) {
        result.success = false;
      }

      await this.syncQueue.updateLastSyncTime();
      await this.syncQueue.clearSyncedItems();

    } catch (error) {
      result.success = false;
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      this.syncQueue.setLastSyncError(errorMessage);
      result.errors.push({
        itemId: '',
        operationType: 'CREATE_SALE',
        errorCode: 'SYNC_ERROR',
        errorMessage,
        canRetry: true
      });
    } finally {
      this.syncInProgress = false;
      this.syncQueue.setSyncing(false);
      this._syncResults.set(result);
      await this.syncQueue.refreshCounts();
    }

    return result;
  }

  /**
   * Sync a single item
   */
  private async syncItem(item: SyncQueueItem): Promise<{
    success: boolean;
    isConflict: boolean;
    error?: SyncError;
    serverId?: string;
  }> {
    try {
      switch (item.operationType) {
        case 'CREATE_SALE':
          return await this.syncSale(item);
        case 'SEND_WHATSAPP':
          return await this.syncWhatsApp(item);
        default:
          return {
            success: false,
            isConflict: false,
            error: {
              itemId: item.id,
              operationType: item.operationType,
              errorCode: 'UNSUPPORTED_OPERATION',
              errorMessage: `Unsupported operation type: ${item.operationType}`,
              canRetry: false
            }
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.syncQueue.markAsFailed(item.id, errorMessage);

      return {
        success: false,
        isConflict: false,
        error: {
          itemId: item.id,
          operationType: item.operationType,
          errorCode: 'SYNC_ERROR',
          errorMessage,
          canRetry: true
        }
      };
    }
  }

  /**
   * Sync a sale item
   */
  private async syncSale(item: SyncQueueItem): Promise<{
    success: boolean;
    isConflict: boolean;
    error?: SyncError;
    serverId?: string;
  }> {
    const payload = item.payload as OfflineSalePayload;

    // Check if product is still available
    const { data: productCheck, error: productError } = await this.supabase
      .from('products')
      .select('id, status')
      .eq('id', payload.productId)
      .single();

    if (productError || !productCheck) {
      await this.syncQueue.markAsConflict(
        item.id,
        'PRODUCT_NOT_AVAILABLE',
        'The product no longer exists in the system',
        null
      );
      return { success: false, isConflict: true };
    }

    if (productCheck.status !== 'available') {
      await this.syncQueue.markAsConflict(
        item.id,
        'PRODUCT_ALREADY_SOLD',
        `The product has already been marked as ${productCheck.status}`,
        productCheck
      );
      return { success: false, isConflict: true };
    }

    // Process the sale using RPC
    const { data, error } = await this.supabase.rpc('complete_sale_with_inventory_deduction', {
      p_product_id: payload.productId,
      p_sale_date: payload.saleDate,
      p_sale_price: payload.salePrice,
      p_buyer_name: payload.buyerName,
      p_buyer_phone: payload.buyerPhone,
      p_buyer_email: payload.buyerEmail,
      p_notes: payload.notes ? `[Offline Sale] ${payload.notes}` : '[Offline Sale]'
    });

    if (error) {
      // Check for specific conflict errors
      if (error.message.includes('already sold') || error.message.includes('not available')) {
        await this.syncQueue.markAsConflict(
          item.id,
          'PRODUCT_ALREADY_SOLD',
          error.message,
          null
        );
        return { success: false, isConflict: true };
      }

      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to complete sale');
    }

    await this.syncQueue.markAsSynced(item.id, data.saleId);

    return {
      success: true,
      isConflict: false,
      serverId: data.saleId
    };
  }

  /**
   * Sync a WhatsApp message item
   */
  private async syncWhatsApp(item: SyncQueueItem): Promise<{
    success: boolean;
    isConflict: boolean;
    error?: SyncError;
    serverId?: string;
  }> {
    const payload = item.payload as OfflineWhatsAppPayload;

    // For WhatsApp, we just mark as synced since it will be sent
    // via client-side navigation when user is online
    await this.syncQueue.markAsSynced(item.id, `whatsapp_${item.id}`);

    // Open WhatsApp link if this was just synced
    const whatsappLink = this.generateWhatsAppLink(payload.phoneNumber, payload.message);
    window.open(whatsappLink, '_blank');

    return {
      success: true,
      isConflict: false,
      serverId: `whatsapp_${item.id}`
    };
  }

  private generateWhatsAppLink(phoneNumber: string, message: string): string {
    const cleanedNumber = phoneNumber.replace(/[^\d]/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanedNumber}?text=${encodedMessage}`;
  }

  /**
   * Retry a specific failed item
   */
  async retryItem(itemId: string): Promise<{
    success: boolean;
    isConflict: boolean;
    error?: SyncError;
  }> {
    if (!this.networkStatus.isOnline()) {
      return {
        success: false,
        isConflict: false,
        error: {
          itemId,
          operationType: 'CREATE_SALE',
          errorCode: 'OFFLINE',
          errorMessage: 'Cannot retry while offline',
          canRetry: true
        }
      };
    }

    const item = await this.syncQueue.getItem(itemId);
    if (!item) {
      return {
        success: false,
        isConflict: false,
        error: {
          itemId,
          operationType: 'CREATE_SALE',
          errorCode: 'NOT_FOUND',
          errorMessage: 'Item not found',
          canRetry: false
        }
      };
    }

    await this.syncQueue.retryItem(itemId);
    return this.syncItem(item);
  }

  /**
   * Update sync configuration
   */
  async updateConfig(config: Partial<OfflineSyncConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.offlineStorage.saveSyncConfig(this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): OfflineSyncConfig {
    return { ...this.config };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
