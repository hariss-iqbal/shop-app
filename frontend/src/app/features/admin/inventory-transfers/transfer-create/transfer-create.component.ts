import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { InventoryTransferService } from '../../../../core/services/inventory-transfer.service';
import { StoreLocationService } from '../../../../core/services/store-location.service';
import { LocationInventoryService } from '../../../../core/services/location-inventory.service';
import { StoreLocation } from '../../../../models/store-location.model';
import { LocationInventory } from '../../../../models/location-inventory.model';
import { TransferItemRequest } from '../../../../models/inventory-transfer.model';

interface TransferItemForm extends TransferItemRequest {
  product?: LocationInventory['product'];
  maxQuantity: number;
}

/**
 * Transfer Create Component
 * Create a new inventory transfer between locations
 * Feature: F-024 Multi-Location Inventory Support
 */
@Component({
  selector: 'app-transfer-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    Select,
    Textarea,
    InputNumberModule,
    TableModule,
    DividerModule
  ],
  templateUrl: './transfer-create.component.html'
})
export class TransferCreateComponent implements OnInit {
  constructor(
    private router: Router,
    private inventoryTransferService: InventoryTransferService,
    private storeLocationService: StoreLocationService,
    private locationInventoryService: LocationInventoryService,
    private messageService: MessageService
  ) { }

  locations = signal<StoreLocation[]>([]);
  availableInventory = signal<LocationInventory[]>([]);
  transferItems = signal<TransferItemForm[]>([]);
  loadingInventory = signal(false);
  submitting = signal(false);

  sourceLocationId: string | null = null;
  destinationLocationId: string | null = null;
  notes: string | null = null;

  sourceLocations = computed(() => this.locations());

  destinationLocations = computed(() => {
    return this.locations().filter(l => l.id !== this.sourceLocationId);
  });

  totalItems = computed(() => {
    return this.transferItems().reduce((sum, item) => sum + item.quantity, 0);
  });

  canSubmit = computed(() => {
    return this.sourceLocationId &&
           this.destinationLocationId &&
           this.transferItems().length > 0 &&
           !this.submitting();
  });

  ngOnInit(): void {
    this.loadLocations();
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

  async onSourceLocationChange(): Promise<void> {
    this.transferItems.set([]);
    this.destinationLocationId = null;

    if (!this.sourceLocationId) {
      this.availableInventory.set([]);
      return;
    }

    this.loadingInventory.set(true);
    try {
      const response = await this.locationInventoryService.getInventoryByLocation(this.sourceLocationId);
      this.availableInventory.set(response.data);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load inventory'
      });
    } finally {
      this.loadingInventory.set(false);
    }
  }

  isItemAdded(item: LocationInventory): boolean {
    return this.transferItems().some(t => t.productId === item.productId);
  }

  addItem(item: LocationInventory): void {
    if (this.isItemAdded(item)) return;

    const newItem: TransferItemForm = {
      productId: item.productId,
      quantity: 1,
      notes: null,
      product: item.product,
      maxQuantity: item.quantity
    };

    this.transferItems.update(items => [...items, newItem]);
  }

  removeItem(index: number): void {
    this.transferItems.update(items => items.filter((_, i) => i !== index));
  }

  async submitTransfer(): Promise<void> {
    if (!this.canSubmit()) return;

    this.submitting.set(true);
    try {
      const result = await this.inventoryTransferService.initiateTransfer({
        sourceLocationId: this.sourceLocationId!,
        destinationLocationId: this.destinationLocationId!,
        items: this.transferItems().map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes
        })),
        notes: this.notes
      });

      if (result.success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Transfer ${result.transferNumber} created successfully`
        });
        this.router.navigate(['/admin/inventory-transfers']);
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: result.error || 'Failed to create transfer'
        });
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create transfer'
      });
    } finally {
      this.submitting.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/inventory-transfers']);
  }
}
