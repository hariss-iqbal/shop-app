import { Component } from '@angular/core';
import { SyncStatusPanelComponent } from '../../../shared/components/sync-status-panel/sync-status-panel.component';

/**
 * Sync Status Page Component
 * Feature: F-020 Offline Mode and Sync
 *
 * Wrapper page for the sync status panel in the admin section.
 * Provides a dedicated page for managing offline transactions and conflicts.
 */
@Component({
  selector: 'app-sync-status-page',
  standalone: true,
  imports: [SyncStatusPanelComponent],
  templateUrl: './sync-status-page.component.html',
  styleUrls: ['./sync-status-page.component.scss']
})
export class SyncStatusPageComponent {}
