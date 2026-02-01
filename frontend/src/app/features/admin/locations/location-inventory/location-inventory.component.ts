import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Select } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import { LocationInventoryService } from '../../../../core/services/location-inventory.service';
import { StoreLocationService } from '../../../../core/services/store-location.service';
import { UserLocationAssignmentService } from '../../../../core/services/user-location-assignment.service';
import { LocationInventory, LocationInventoryStats } from '../../../../models/location-inventory.model';
import { StoreLocation } from '../../../../models/store-location.model';

/**
 * Location Inventory Component
 * View inventory at a specific location
 * Feature: F-024 Multi-Location Inventory Support
 */
@Component({
  selector: 'app-location-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TableModule,
    ButtonModule,
    CardModule,
    TagModule,
    TooltipModule,
    Select,
    InputTextModule,
    ProgressBarModule
  ],
  templateUrl: './location-inventory.component.html'
})
export class LocationInventoryComponent implements OnInit {
  private locationInventoryService = inject(LocationInventoryService);
  private storeLocationService = inject(StoreLocationService);
  private userLocationAssignmentService = inject(UserLocationAssignmentService);
  private messageService = inject(MessageService);

  locations = signal<StoreLocation[]>([]);
  inventory = signal<LocationInventory[]>([]);
  stats = signal<LocationInventoryStats | null>(null);
  loading = signal(false);
  selectedLocationId: string | null = null;

  selectedLocation = computed(() => {
    return this.locations().find(l => l.id === this.selectedLocationId) || null;
  });

  ngOnInit(): void {
    this.loadLocations();
  }

  async loadLocations(): Promise<void> {
    try {
      const response = await this.storeLocationService.getActiveLocations();
      this.locations.set(response);

      const currentLocationId = this.userLocationAssignmentService.currentLocationId();
      if (currentLocationId) {
        this.selectedLocationId = currentLocationId;
        this.loadInventory();
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load locations'
      });
    }
  }

  onLocationChange(): void {
    if (this.selectedLocationId) {
      this.loadInventory();
    }
  }

  async loadInventory(): Promise<void> {
    if (!this.selectedLocationId) return;

    this.loading.set(true);
    try {
      const response = await this.locationInventoryService.getInventoryByLocation(this.selectedLocationId);
      this.inventory.set(response.data);
      this.stats.set(response.stats || null);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load inventory'
      });
    } finally {
      this.loading.set(false);
    }
  }

  getConditionSeverity(condition: string | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (condition) {
      case 'new': return 'success';
      case 'refurbished': return 'info';
      case 'used': return 'warn';
      default: return 'secondary';
    }
  }
}
