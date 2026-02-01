import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Textarea } from 'primeng/textarea';
import { MessageService, ConfirmationService } from 'primeng/api';
import { StoreLocationService } from '../../../../core/services/store-location.service';
import { StoreLocation, CreateStoreLocationRequest, UpdateStoreLocationRequest } from '../../../../models/store-location.model';

/**
 * Location List Component
 * Manage store locations
 * Feature: F-024 Multi-Location Inventory Support
 */
@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    DialogModule,
    ToggleSwitch,
    Textarea
  ],
  templateUrl: './location-list.component.html'
})
export class LocationListComponent implements OnInit {
  private storeLocationService = inject(StoreLocationService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  locations = signal<StoreLocation[]>([]);
  loading = signal(false);
  saving = signal(false);
  dialogVisible = false;
  editingLocation: StoreLocation | null = null;

  formData: CreateStoreLocationRequest & UpdateStoreLocationRequest = {
    code: '',
    name: '',
    address: null,
    phone: null,
    email: null,
    notes: null,
    isActive: true
  };

  ngOnInit(): void {
    this.loadLocations();
  }

  async loadLocations(): Promise<void> {
    this.loading.set(true);
    try {
      const response = await this.storeLocationService.getLocations();
      this.locations.set(response.data);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load locations'
      });
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.loadLocationsFiltered(searchTerm);
  }

  async loadLocationsFiltered(search?: string): Promise<void> {
    this.loading.set(true);
    try {
      const response = await this.storeLocationService.getLocations({ search });
      this.locations.set(response.data);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to search locations'
      });
    } finally {
      this.loading.set(false);
    }
  }

  openCreateDialog(): void {
    this.editingLocation = null;
    this.formData = {
      code: '',
      name: '',
      address: null,
      phone: null,
      email: null,
      notes: null,
      isActive: true
    };
    this.dialogVisible = true;
  }

  openEditDialog(location: StoreLocation): void {
    this.editingLocation = location;
    this.formData = {
      code: location.code,
      name: location.name,
      address: location.address,
      phone: location.phone,
      email: location.email,
      notes: location.notes,
      isActive: location.isActive
    };
    this.dialogVisible = true;
  }

  closeDialog(): void {
    this.dialogVisible = false;
    this.editingLocation = null;
  }

  async saveLocation(): Promise<void> {
    if (!this.formData.name?.trim() || !this.formData.code?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Name and code are required'
      });
      return;
    }

    this.saving.set(true);
    try {
      if (this.editingLocation) {
        await this.storeLocationService.updateLocation(this.editingLocation.id, this.formData);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Location updated successfully'
        });
      } else {
        await this.storeLocationService.createLocation(this.formData as CreateStoreLocationRequest);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Location created successfully'
        });
      }
      this.closeDialog();
      this.loadLocations();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'Failed to save location'
      });
    } finally {
      this.saving.set(false);
    }
  }

  async setPrimary(location: StoreLocation): Promise<void> {
    try {
      await this.storeLocationService.setLocationPrimary(location.id);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `${location.name} is now the primary location`
      });
      this.loadLocations();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to set primary location'
      });
    }
  }

  confirmDelete(location: StoreLocation): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${location.name}"?`,
      header: 'Delete Location',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteLocation(location)
    });
  }

  async deleteLocation(location: StoreLocation): Promise<void> {
    try {
      await this.storeLocationService.deleteLocation(location.id);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Location deleted successfully'
      });
      this.loadLocations();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'Failed to delete location'
      });
    }
  }
}
