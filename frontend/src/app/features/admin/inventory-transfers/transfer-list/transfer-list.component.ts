import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Select } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { InventoryTransferService, TransferLazyLoadParams } from '../../../../core/services/inventory-transfer.service';
import { StoreLocationService } from '../../../../core/services/store-location.service';
import { InventoryTransfer, InventoryTransferFilter } from '../../../../models/inventory-transfer.model';
import { StoreLocation } from '../../../../models/store-location.model';
import {
  InventoryTransferStatus,
  InventoryTransferStatusLabels,
  InventoryTransferStatusSeverity
} from '../../../../enums';

/**
 * Transfer List Component
 * View and manage inventory transfers
 * Feature: F-024 Multi-Location Inventory Support
 */
@Component({
  selector: 'app-transfer-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    Select,
    ConfirmDialogModule
  ],
  templateUrl: './transfer-list.component.html'
})
export class TransferListComponent implements OnInit {
  constructor(
    private inventoryTransferService: InventoryTransferService,
    private storeLocationService: StoreLocationService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  transfers = signal<InventoryTransfer[]>([]);
  locations = signal<StoreLocation[]>([]);
  loading = signal(false);
  totalRecords = signal(0);

  filter: InventoryTransferFilter = {};

  statusOptions = [
    { label: 'Pending', value: InventoryTransferStatus.PENDING },
    { label: 'In Transit', value: InventoryTransferStatus.IN_TRANSIT },
    { label: 'Completed', value: InventoryTransferStatus.COMPLETED },
    { label: 'Cancelled', value: InventoryTransferStatus.CANCELLED }
  ];

  private lazyParams: TransferLazyLoadParams = { first: 0, rows: 10 };

  ngOnInit(): void {
    this.loadLocations();
  }

  hasActiveFilters(): boolean {
    return !!(this.filter.sourceLocationId || this.filter.destinationLocationId || this.filter.status);
  }

  clearFilters(): void {
    this.filter = {};
    this.loadTransfers();
  }

  async loadLocations(): Promise<void> {
    try {
      const response = await this.storeLocationService.getActiveLocations();
      this.locations.set(response);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load locations'
      });
    }
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    this.lazyParams = {
      first: event.first ?? 0,
      rows: event.rows ?? 10,
      sortField: event.sortField as string,
      sortOrder: event.sortOrder ?? -1
    };
    this.loadTransfers();
  }

  async loadTransfers(): Promise<void> {
    this.loading.set(true);
    try {
      const response = await this.inventoryTransferService.getTransfers(
        this.lazyParams,
        this.filter
      );
      this.transfers.set(response.data);
      this.totalRecords.set(response.total);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load transfers'
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

  async startTransit(transfer: InventoryTransfer): Promise<void> {
    try {
      await this.inventoryTransferService.startTransit(transfer.id);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Transfer marked as in transit'
      });
      this.loadTransfers();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update transfer'
      });
    }
  }

  async completeTransfer(transfer: InventoryTransfer): Promise<void> {
    try {
      const result = await this.inventoryTransferService.completeTransfer(transfer.id);
      if (result.success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Transfer completed successfully'
        });
        this.loadTransfers();
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
    }
  }

  confirmCancel(transfer: InventoryTransfer): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to cancel transfer "${transfer.transferNumber}"?`,
      header: 'Cancel Transfer',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.cancelTransfer(transfer)
    });
  }

  async cancelTransfer(transfer: InventoryTransfer): Promise<void> {
    try {
      const result = await this.inventoryTransferService.cancelTransfer(transfer.id);
      if (result.success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Transfer cancelled'
        });
        this.loadTransfers();
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
    }
  }
}
