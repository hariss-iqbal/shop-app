import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TimelineModule } from 'primeng/timeline';
import { MessageService, ConfirmationService } from 'primeng/api';
import { InventoryTransferService } from '../../../../core/services/inventory-transfer.service';
import { InventoryTransfer } from '../../../../models/inventory-transfer.model';
import {
  InventoryTransferStatus,
  InventoryTransferStatusLabels,
  InventoryTransferStatusSeverity
} from '../../../../enums';

interface TimelineEvent {
  status: string;
  date: Date | null;
  icon: string;
  color: string;
  user?: string;
}

/**
 * Transfer Detail Component
 * View details of an inventory transfer
 * Feature: F-024 Multi-Location Inventory Support
 */
@Component({
  selector: 'app-transfer-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    CardModule,
    TagModule,
    TableModule,
    DividerModule,
    TooltipModule,
    ConfirmDialogModule,
    TimelineModule
  ],
  templateUrl: './transfer-detail.component.html'
})
export class TransferDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private inventoryTransferService = inject(InventoryTransferService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  transfer = signal<InventoryTransfer | null>(null);
  loading = signal(false);
  actionLoading = signal(false);

  totalQuantity = computed(() => {
    const items = this.transfer()?.items || [];
    return items.reduce((sum, item) => sum + item.quantity, 0);
  });

  canTakeAction = computed(() => {
    const status = this.transfer()?.status;
    return status === 'pending' || status === 'in_transit';
  });

  timelineEvents = computed<TimelineEvent[]>(() => {
    const t = this.transfer();
    if (!t) return [];

    const events: TimelineEvent[] = [];

    // Initiated
    events.push({
      status: 'Initiated',
      date: t.initiatedAt ? new Date(t.initiatedAt) : null,
      icon: 'pi pi-plus',
      color: 'var(--blue-500)'
    });

    // In Transit (if applicable)
    if (t.status === 'in_transit' || t.status === 'completed') {
      events.push({
        status: 'In Transit',
        date: t.status === 'in_transit' ? new Date() : t.completedAt ? new Date(t.completedAt) : null,
        icon: 'pi pi-truck',
        color: 'var(--orange-500)'
      });
    } else if (t.status === 'pending') {
      events.push({
        status: 'In Transit',
        date: null,
        icon: 'pi pi-truck',
        color: 'var(--gray-400)'
      });
    }

    // Completed or Cancelled
    if (t.status === 'completed') {
      events.push({
        status: 'Completed',
        date: t.completedAt ? new Date(t.completedAt) : null,
        icon: 'pi pi-check',
        color: 'var(--green-500)'
      });
    } else if (t.status === 'cancelled') {
      events.push({
        status: 'Cancelled',
        date: t.updatedAt ? new Date(t.updatedAt) : null,
        icon: 'pi pi-times',
        color: 'var(--red-500)'
      });
    } else {
      events.push({
        status: 'Completed',
        date: null,
        icon: 'pi pi-check',
        color: 'var(--gray-400)'
      });
    }

    return events;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTransfer(id);
    }
  }

  async loadTransfer(id: string): Promise<void> {
    this.loading.set(true);
    try {
      const transfer = await this.inventoryTransferService.getTransferById(id);
      this.transfer.set(transfer);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load transfer details'
      });
    } finally {
      this.loading.set(false);
    }
  }

  getStatusLabel(status: InventoryTransferStatus): string {
    return InventoryTransferStatusLabels[status] || status;
  }

  getStatusSeverity(status: InventoryTransferStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    return InventoryTransferStatusSeverity[status] || 'secondary';
  }

  getConditionSeverity(condition: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (condition) {
      case 'new': return 'success';
      case 'refurbished': return 'info';
      case 'used': return 'warn';
      default: return 'secondary';
    }
  }

  async startTransit(): Promise<void> {
    const transfer = this.transfer();
    if (!transfer) return;

    this.actionLoading.set(true);
    try {
      await this.inventoryTransferService.startTransit(transfer.id);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Transfer marked as in transit'
      });
      this.loadTransfer(transfer.id);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update transfer'
      });
    } finally {
      this.actionLoading.set(false);
    }
  }

  async completeTransfer(): Promise<void> {
    const transfer = this.transfer();
    if (!transfer) return;

    this.actionLoading.set(true);
    try {
      const result = await this.inventoryTransferService.completeTransfer(transfer.id);
      if (result.success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Transfer completed successfully. Inventory has been updated.'
        });
        this.loadTransfer(transfer.id);
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: result.error || 'Failed to complete transfer'
        });
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to complete transfer'
      });
    } finally {
      this.actionLoading.set(false);
    }
  }

  confirmCancel(): void {
    const transfer = this.transfer();
    if (!transfer) return;

    this.confirmationService.confirm({
      message: `Are you sure you want to cancel transfer "${transfer.transferNumber}"? This action cannot be undone.`,
      header: 'Cancel Transfer',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.cancelTransfer()
    });
  }

  async cancelTransfer(): Promise<void> {
    const transfer = this.transfer();
    if (!transfer) return;

    this.actionLoading.set(true);
    try {
      const result = await this.inventoryTransferService.cancelTransfer(transfer.id);
      if (result.success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Transfer has been cancelled'
        });
        this.loadTransfer(transfer.id);
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: result.error || 'Failed to cancel transfer'
        });
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to cancel transfer'
      });
    } finally {
      this.actionLoading.set(false);
    }
  }
}
