import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService } from 'primeng/api';
import { SyncQueueService } from '../../../core/services/sync-queue.service';
import { SyncSchedulerService } from '../../../core/services/sync-scheduler.service';
import { ConflictResolutionService } from '../../../core/services/conflict-resolution.service';
import { NetworkStatusService } from '../../../core/services/network-status.service';
import { ToastService } from '../../services/toast.service';
import { OfflineTransaction, SyncQueueItem, SyncResolutionAction } from '../../../models/offline-sync.model';

/**
 * Sync Status Panel Component
 * Feature: F-020 Offline Mode and Sync
 *
 * Displays detailed sync status, pending transactions, and conflict resolution interface.
 */
@Component({
  selector: 'app-sync-status-panel',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    ProgressBarModule,
    TooltipModule,
    ConfirmDialogModule,
    DialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './sync-status-panel.component.html',
  styleUrls: ['./sync-status-panel.component.scss']
})
export class SyncStatusPanelComponent implements OnInit {
  private readonly syncQueue = inject(SyncQueueService);
  private readonly syncScheduler = inject(SyncSchedulerService);
  private readonly conflictResolution = inject(ConflictResolutionService);
  private readonly networkStatus = inject(NetworkStatusService);
  private readonly toastService = inject(ToastService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly isOnline = this.networkStatus.isOnline;
  readonly isSyncing = this.syncQueue.isSyncing;
  readonly syncProgress = this.syncQueue.syncProgress;
  readonly pendingCount = this.syncQueue.pendingCount;
  readonly conflictCount = this.syncQueue.conflictCount;
  readonly lastSyncAt = this.syncQueue.lastSyncAt;

  readonly transactions = signal<OfflineTransaction[]>([]);
  readonly conflicts = signal<SyncQueueItem[]>([]);
  readonly selectedConflict = signal<SyncQueueItem | null>(null);

  conflictDialogVisible = false;

  readonly lastSyncDisplay = computed(() => {
    const lastSync = this.lastSyncAt();
    if (!lastSync) return 'Never';
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  });

  readonly conflictInfo = computed(() => {
    const conflict = this.selectedConflict();
    if (!conflict) {
      return { title: '', description: '', localSummary: '', serverSummary: null, options: [] };
    }
    return this.conflictResolution.getConflictDisplayInfo(conflict);
  });

  ngOnInit(): void {
    this.refreshData();
  }

  async refreshData(): Promise<void> {
    const [transactions, conflicts] = await Promise.all([
      this.syncQueue.getOfflineTransactions(),
      this.syncQueue.getConflictItems()
    ]);
    this.transactions.set(transactions);
    this.conflicts.set(conflicts);
  }

  async syncNow(): Promise<void> {
    const result = await this.syncScheduler.triggerSync();
    await this.refreshData();

    if (result.success) {
      this.toastService.success('Sync Complete', `${result.syncedItems} items synced successfully`);
    } else {
      const message = result.conflictItems > 0
        ? `${result.conflictItems} conflicts need resolution`
        : `${result.failedItems} items failed to sync`;
      this.toastService.warn('Sync Incomplete', message);
    }
  }

  async retryItem(item: OfflineTransaction): Promise<void> {
    const result = await this.syncScheduler.retryItem(item.id);
    await this.refreshData();

    if (result.success) {
      this.toastService.success('Success', 'Item synced successfully');
    } else if (result.isConflict) {
      this.toastService.warn('Conflict', 'A conflict was detected. Please resolve it.');
    } else {
      this.toastService.error('Failed', result.error?.errorMessage || 'Failed to sync item');
    }
  }

  discardItem(item: OfflineTransaction): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to discard this transaction? This action cannot be undone.',
      header: 'Discard Transaction',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        await this.syncQueue.removeItem(item.id);
        await this.refreshData();
        this.toastService.success('Discarded', 'Transaction has been removed');
      }
    });
  }

  showConflictDialog(): void {
    this.conflictDialogVisible = true;
    if (this.conflicts().length > 0 && !this.selectedConflict()) {
      this.selectConflict(this.conflicts()[0]);
    }
  }

  selectConflict(conflict: SyncQueueItem): void {
    this.selectedConflict.set(conflict);
  }

  async resolveConflict(action: SyncResolutionAction): Promise<void> {
    const conflict = this.selectedConflict();
    if (!conflict) return;

    const result = await this.conflictResolution.resolveConflict({
      queueItemId: conflict.id,
      resolution: action
    });

    await this.refreshData();

    if (result.success) {
      this.toastService.success('Resolved', result.message);
      // Select next conflict if available
      const remaining = this.conflicts();
      if (remaining.length > 0) {
        this.selectConflict(remaining[0]);
      } else {
        this.selectedConflict.set(null);
        this.conflictDialogVisible = false;
      }
    } else {
      this.toastService.error('Failed', result.error || result.message);
    }
  }

  getConflictDisplayName(conflict: SyncQueueItem): string {
    if (conflict.operationType === 'CREATE_SALE') {
      const payload = conflict.payload as any;
      return `${payload.phoneDetails?.brandName} ${payload.phoneDetails?.model}`;
    }
    return conflict.localTempId;
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'sale': return 'Sale';
      case 'receipt': return 'Receipt';
      case 'whatsapp': return 'WhatsApp';
      default: return type;
    }
  }

  getTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (type) {
      case 'sale': return 'success';
      case 'receipt': return 'info';
      case 'whatsapp': return 'contrast';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Pending';
      case 'syncing': return 'Syncing';
      case 'synced': return 'Synced';
      case 'conflict': return 'Conflict';
      case 'failed': return 'Failed';
      default: return status;
    }
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (status) {
      case 'pending': return 'info';
      case 'syncing': return 'warn';
      case 'synced': return 'success';
      case 'conflict': return 'danger';
      case 'failed': return 'danger';
      default: return 'secondary';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'sale': return 'pi-shopping-cart';
      case 'receipt': return 'pi-file';
      case 'whatsapp': return 'pi-whatsapp';
      default: return 'pi-circle';
    }
  }

  getConflictTypeLabel(conflictType: string | undefined): string {
    switch (conflictType) {
      case 'PHONE_ALREADY_SOLD': return 'Phone sold elsewhere';
      case 'PHONE_NOT_AVAILABLE': return 'Phone unavailable';
      case 'RECEIPT_NUMBER_EXISTS': return 'Duplicate receipt';
      case 'DATA_MODIFIED': return 'Data changed';
      case 'ENTITY_DELETED': return 'Item deleted';
      default: return 'Unknown conflict';
    }
  }

  getResolutionIcon(action: SyncResolutionAction): string {
    switch (action) {
      case 'DISCARD': return 'pi-trash';
      case 'KEEP_LOCAL': return 'pi-mobile';
      case 'KEEP_SERVER': return 'pi-cloud';
      case 'GENERATE_NEW_NUMBER': return 'pi-refresh';
      case 'MERGE': return 'pi-sitemap';
      default: return 'pi-cog';
    }
  }
}
