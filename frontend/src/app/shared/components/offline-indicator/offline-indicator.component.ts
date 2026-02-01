import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { RippleModule } from 'primeng/ripple';
import { NetworkStatusService } from '../../../core/services/network-status.service';
import { SyncQueueService } from '../../../core/services/sync-queue.service';
import { SyncSchedulerService } from '../../../core/services/sync-scheduler.service';

/**
 * Offline Indicator Component
 * Feature: F-020 Offline Mode and Sync
 *
 * Displays current network status and sync queue information.
 * Shows offline mode indicator with pending transaction count.
 * Provides visual feedback with animations for status changes.
 */
@Component({
  selector: 'app-offline-indicator',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TagModule,
    BadgeModule,
    TooltipModule,
    ButtonModule,
    ProgressBarModule,
    RippleModule
  ],
  templateUrl: './offline-indicator.component.html',
  styleUrls: ['./offline-indicator.component.scss']
})
export class OfflineIndicatorComponent {
  private readonly networkStatus = inject(NetworkStatusService);
  private readonly syncQueue = inject(SyncQueueService);
  private readonly syncScheduler = inject(SyncSchedulerService);

  readonly isOnline = this.networkStatus.isOnline;
  readonly isOffline = this.networkStatus.isOffline;
  readonly hasPendingItems = this.syncQueue.hasPendingItems;
  readonly hasConflicts = this.syncQueue.hasConflicts;
  readonly isSyncing = this.syncQueue.isSyncing;
  readonly syncProgress = this.syncQueue.syncProgress;
  readonly pendingCount = this.syncQueue.pendingCount;
  readonly conflictCount = this.syncQueue.conflictCount;

  readonly offlineLabel = computed(() => 'Offline Mode');

  readonly offlineTooltip = computed(() =>
    'You are currently offline. Transactions will be saved locally and synced when connection is restored.'
  );

  readonly pendingLabel = computed(() => {
    const count = this.pendingCount();
    return count === 1 ? '1 Pending' : `${count} Pending`;
  });

  readonly pendingTooltip = computed(() => {
    const count = this.pendingCount();
    const items = count === 1 ? 'transaction' : 'transactions';
    return `${count} ${items} waiting to sync`;
  });

  readonly conflictLabel = computed(() => {
    const count = this.conflictCount();
    return count === 1 ? '1 Conflict' : `${count} Conflicts`;
  });

  readonly conflictTooltip = computed(() => {
    const count = this.conflictCount();
    const items = count === 1 ? 'conflict requires' : 'conflicts require';
    return `${count} ${items} manual resolution`;
  });

  async triggerSync(): Promise<void> {
    await this.syncScheduler.triggerSync();
  }
}
