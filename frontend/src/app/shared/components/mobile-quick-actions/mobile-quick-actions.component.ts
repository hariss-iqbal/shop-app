import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SpeedDialModule } from 'primeng/speeddial';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';

import { ViewportService } from '../../../core/services/viewport.service';
import { SupabaseAuthService } from '../../../core/services/supabase-auth.service';

export type QuickActionType =
  | 'new-sale'
  | 'scan-barcode'
  | 'customer-lookup'
  | 'view-receipts'
  | 'process-refund'
  | 'check-inventory';

export interface QuickActionEvent {
  action: QuickActionType;
}

/**
 * Mobile Quick Actions Component
 * Feature: F-025 Mobile-Optimized Interface
 *
 * Provides a floating action button with quick access to common POS operations.
 * Touch-optimized with large tap targets (minimum 44x44px).
 */
@Component({
  selector: 'app-mobile-quick-actions',
  imports: [
    CommonModule,
    ButtonModule,
    SpeedDialModule,
    TooltipModule
  ],
  templateUrl: './mobile-quick-actions.component.html',
  styleUrls: ['./mobile-quick-actions.component.scss']
})
export class MobileQuickActionsComponent {
  @Input() showScanBarcode = true;
  @Input() showNewSale = true;
  @Input() showCustomerLookup = true;
  @Input() showViewReceipts = true;
  @Input() showProcessRefund = false;

  @Output() actionTriggered = new EventEmitter<QuickActionEvent>();

  viewportService = inject(ViewportService);
  private authService = inject(SupabaseAuthService);
  private router = inject(Router);

  fabStyle = {
    position: 'fixed',
    bottom: 'calc(70px + env(safe-area-inset-bottom, 0))',
    right: '16px'
  };

  quickActions = signal<MenuItem[]>([]);

  ngOnInit(): void {
    this.buildQuickActions();
  }

  private buildQuickActions(): void {
    const permissions = this.authService.permissions();
    const actions: MenuItem[] = [];

    if (this.showNewSale && permissions?.canAccessSales) {
      actions.push({
        icon: 'pi pi-plus',
        tooltip: 'New Sale',
        tooltipPosition: 'left',
        command: () => this.onAction('new-sale')
      });
    }

    if (this.showScanBarcode) {
      actions.push({
        icon: 'pi pi-camera',
        tooltip: 'Scan Barcode',
        tooltipPosition: 'left',
        command: () => this.onAction('scan-barcode')
      });
    }

    if (this.showCustomerLookup && permissions?.canAccessSales) {
      actions.push({
        icon: 'pi pi-search',
        tooltip: 'Customer Lookup',
        tooltipPosition: 'left',
        command: () => this.onAction('customer-lookup')
      });
    }

    if (this.showViewReceipts && permissions?.canAccessSales) {
      actions.push({
        icon: 'pi pi-receipt',
        tooltip: 'View Receipts',
        tooltipPosition: 'left',
        command: () => this.onAction('view-receipts')
      });
    }

    if (this.showProcessRefund && permissions?.canProcessRefunds) {
      actions.push({
        icon: 'pi pi-refresh',
        tooltip: 'Process Refund',
        tooltipPosition: 'left',
        command: () => this.onAction('process-refund')
      });
    }

    this.quickActions.set(actions);
  }

  private onAction(action: QuickActionType): void {
    this.actionTriggered.emit({ action });

    // Default navigation for some actions
    switch (action) {
      case 'new-sale':
        this.router.navigate(['/admin/sales/new']);
        break;
      case 'customer-lookup':
        this.router.navigate(['/admin/sales/customer-lookup']);
        break;
      case 'view-receipts':
        this.router.navigate(['/admin/receipts']);
        break;
      case 'process-refund':
        this.router.navigate(['/admin/refunds']);
        break;
      // scan-barcode and check-inventory are handled by parent via event
    }
  }
}
