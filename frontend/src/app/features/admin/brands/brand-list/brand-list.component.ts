import { Component, OnInit, inject, signal, AfterViewChecked, QueryList, ViewChildren, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { FileUploadModule, FileSelectEvent } from 'primeng/fileupload';
import { BrandService } from '../../../../core/services/brand.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirmation.service';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';
import { Brand, CreateBrandRequest, UpdateBrandRequest } from '../../../../models/brand.model';
import { BRAND_CONSTRAINTS } from '../../../../constants/validation.constants';

interface EditableBrand extends Brand {
  editing?: boolean;
  editName?: string;
}

@Component({
  selector: 'app-brand-list',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    DialogModule,
    ProgressSpinnerModule,
    SkeletonModule,
    TooltipModule,
    AvatarModule,
    FileUploadModule
  ],
  template: `
    <div class="grid">
      <div class="col-12 flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between gap-3 mb-4">
        <h1 class="text-3xl font-bold m-0">Brands</h1>
        <p-button label="Add Brand" icon="pi pi-plus" (onClick)="openAddDialog()" styleClass="w-full sm:w-auto" />
      </div>

      <div class="col-12">
        <p-card>
          @if (loading()) {
            <p-table [value]="skeletonRows" styleClass="p-datatable-striped">
              <ng-template pTemplate="header">
                <tr>
                  <th style="width: 80px;">Logo</th>
                  <th>Name</th>
                  <th style="width: 200px;">Created</th>
                  <th style="width: 150px;">Actions</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body">
                <tr>
                  <td><p-skeleton shape="circle" size="2.5rem" /></td>
                  <td><p-skeleton width="60%" /></td>
                  <td><p-skeleton width="70%" /></td>
                  <td>
                    <div class="flex gap-1">
                      <p-skeleton shape="circle" size="2rem" />
                      <p-skeleton shape="circle" size="2rem" />
                      <p-skeleton shape="circle" size="2rem" />
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          } @else if (brands().length === 0) {
            <div class="text-center py-6">
              <i class="pi pi-tag text-4xl text-500 mb-3"></i>
              <p class="text-500 m-0">No brands found. Add your first brand to get started.</p>
            </div>
          } @else {
            <p-table
              [value]="brands()"
              [paginator]="brands().length > 10"
              [rows]="10"
              [rowsPerPageOptions]="[10, 25, 50]"
              [showCurrentPageReport]="true"
              currentPageReportTemplate="Showing {first} to {last} of {totalRecords} brands"
              styleClass="p-datatable-striped"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th style="width: 80px;">Logo</th>
                  <th pSortableColumn="name">Name <p-sortIcon field="name" /></th>
                  <th style="width: 200px;">Created</th>
                  <th style="width: 150px;">Actions</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-brand>
                <tr>
                  <td>
                    @if (brand.logoUrl) {
                      <img [src]="brand.logoUrl" [alt]="brand.name" class="border-round" style="width: 40px; height: 40px; object-fit: contain;" />
                    } @else {
                      <p-avatar [label]="brand.name.charAt(0).toUpperCase()" shape="circle" />
                    }
                  </td>
                  <td>
                    @if (brand.editing) {
                      <input
                        pInputText
                        [(ngModel)]="brand.editName"
                        class="w-full"
                        [maxlength]="constraints.NAME_MAX"
                        (keyup.enter)="saveEdit(brand)"
                        (keyup.escape)="cancelEdit(brand)"
                        [attr.data-brand-id]="brand.id"
                        #editInput
                        aria-label="Edit brand name"
                      />
                    } @else {
                      <span class="font-medium">{{ brand.name }}</span>
                    }
                  </td>
                  <td>
                    <span class="text-500">{{ brand.createdAt | date:'medium' }}</span>
                  </td>
                  <td>
                    @if (brand.editing) {
                      <div class="flex gap-1">
                        <p-button
                          icon="pi pi-check"
                          [rounded]="true"
                          [text]="true"
                          severity="success"
                          pTooltip="Save"
                          (onClick)="saveEdit(brand)"
                          [loading]="savingId() === brand.id"
                        />
                        <p-button
                          icon="pi pi-times"
                          [rounded]="true"
                          [text]="true"
                          severity="secondary"
                          pTooltip="Cancel"
                          (onClick)="cancelEdit(brand)"
                        />
                      </div>
                    } @else {
                      <div class="flex gap-1">
                        <p-button
                          icon="pi pi-pencil"
                          [rounded]="true"
                          [text]="true"
                          severity="info"
                          pTooltip="Edit Name"
                          (onClick)="startEdit(brand)"
                        />
                        <p-button
                          icon="pi pi-image"
                          [rounded]="true"
                          [text]="true"
                          severity="secondary"
                          pTooltip="Change Logo"
                          (onClick)="openLogoDialog(brand)"
                        />
                        <p-button
                          icon="pi pi-trash"
                          [rounded]="true"
                          [text]="true"
                          severity="danger"
                          pTooltip="Delete"
                          (onClick)="confirmDelete(brand)"
                          [loading]="deletingId() === brand.id"
                        />
                      </div>
                    }
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="4" class="text-center py-4 text-500">No brands found</td>
                </tr>
              </ng-template>
            </p-table>
          }
        </p-card>
      </div>
    </div>

    <!-- Add Brand Dialog -->
    <p-dialog
      header="Add Brand"
      [(visible)]="showAddDialog"
      [modal]="true"
      [style]="{ width: '450px', 'max-width': '95vw' }"
      [closable]="!saving()"
      [focusOnShow]="true"
      [focusTrap]="true"
      [closeOnEscape]="true"
      (onShow)="onDialogShow()"
      (onHide)="onDialogHide()"
      role="dialog"
      aria-label="Add Brand"
    >
      <div class="flex flex-column gap-3">
        <div>
          <label for="newBrandName" class="block font-medium mb-2">Brand Name <span class="text-red-500">*</span></label>
          <input
            id="newBrandName"
            pInputText
            [(ngModel)]="newBrandName"
            class="w-full"
            [maxlength]="constraints.NAME_MAX"
            placeholder="Enter brand name"
            (keyup.enter)="saveBrand()"
            [ngClass]="{'ng-invalid ng-dirty': similarBrandExists}"
            aria-describedby="brand-name-hint"
          />
          @if (similarBrandExists) {
            <small id="brand-name-hint" class="p-error block mt-1">
              <i class="pi pi-exclamation-triangle mr-1"></i>
              A brand named "{{ similarBrandExists.name }}" already exists
            </small>
          } @else {
            <small id="brand-name-hint" class="text-500 block mt-1">{{ newBrandName.length }}/{{ constraints.NAME_MAX }} characters</small>
          }
        </div>
        <div>
          <label class="block font-medium mb-2">Logo (Optional)</label>
          <p-fileUpload
            #fileUpload
            mode="basic"
            [auto]="true"
            accept="image/jpeg,image/png,image/webp"
            [maxFileSize]="2097152"
            chooseLabel="Choose Logo"
            (onSelect)="onLogoSelect($event)"
          />
          @if (newBrandLogoPreview) {
            <div class="mt-2 flex align-items-center gap-2">
              <img [src]="newBrandLogoPreview" alt="Logo preview" class="border-round" style="width: 50px; height: 50px; object-fit: contain;" />
              <p-button
                icon="pi pi-times"
                [rounded]="true"
                [text]="true"
                severity="danger"
                size="small"
                (onClick)="clearNewLogo()"
              />
            </div>
          }
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="Cancel" severity="secondary" [text]="true" (onClick)="closeAddDialog()" [disabled]="saving()" />
        <p-button label="Save" icon="pi pi-check" (onClick)="saveBrand()" [loading]="saving()" [disabled]="!newBrandName.trim() || !!similarBrandExists" />
      </ng-template>
    </p-dialog>

    <!-- Logo Dialog -->
    <p-dialog
      header="Change Logo"
      [(visible)]="showLogoDialog"
      [modal]="true"
      [style]="{ width: '400px', 'max-width': '95vw' }"
      [closable]="!uploadingLogo()"
      [focusOnShow]="true"
      [focusTrap]="true"
      [closeOnEscape]="true"
      (onShow)="onDialogShow()"
      (onHide)="onDialogHide()"
      role="dialog"
      aria-label="Change Logo"
    >
      @if (selectedBrand) {
        <div class="flex flex-column align-items-center gap-3">
          <div class="text-center">
            @if (selectedBrand.logoUrl) {
              <img [src]="selectedBrand.logoUrl" [alt]="selectedBrand.name" class="border-round mb-2" style="width: 80px; height: 80px; object-fit: contain;" />
              <p class="text-500 m-0">Current logo for {{ selectedBrand.name }}</p>
            } @else {
              <p-avatar [label]="selectedBrand.name.charAt(0).toUpperCase()" size="xlarge" shape="circle" />
              <p class="text-500 mt-2 mb-0">No logo set for {{ selectedBrand.name }}</p>
            }
          </div>
          <p-fileUpload
            mode="basic"
            [auto]="true"
            accept="image/jpeg,image/png,image/webp"
            [maxFileSize]="2097152"
            chooseLabel="Upload New Logo"
            (onSelect)="uploadBrandLogo($event)"
          />
          @if (selectedBrand.logoUrl) {
            <p-button
              label="Remove Logo"
              icon="pi pi-trash"
              severity="danger"
              [outlined]="true"
              (onClick)="removeBrandLogo()"
              [loading]="uploadingLogo()"
            />
          }
        </div>
      }
      <ng-template pTemplate="footer">
        <p-button label="Close" severity="secondary" [text]="true" (onClick)="closeLogoDialog()" [disabled]="uploadingLogo()" />
      </ng-template>
    </p-dialog>
  `
})
export class BrandListComponent implements OnInit, AfterViewChecked {
  private brandService = inject(BrandService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmDialogService);
  private focusService = inject(FocusManagementService);

  @ViewChildren('editInput') editInputs!: QueryList<ElementRef<HTMLInputElement>>;

  brands = signal<EditableBrand[]>([]);
  loading = signal(true);
  readonly skeletonRows = Array(5).fill({});
  saving = signal(false);
  savingId = signal<string | null>(null);
  deletingId = signal<string | null>(null);
  uploadingLogo = signal(false);

  /** Validation constraints for brand form fields (F-058: Input Sanitization) */
  readonly constraints = BRAND_CONSTRAINTS;

  showAddDialog = false;
  newBrandName = '';
  newBrandLogoFile: File | null = null;
  newBrandLogoPreview: string | null = null;

  showLogoDialog = false;
  selectedBrand: EditableBrand | null = null;

  private pendingFocusBrandId: string | null = null;

  get similarBrandExists(): Brand | null {
    if (!this.newBrandName.trim()) return null;
    const normalizedInput = this.newBrandName.trim().toLowerCase();
    return this.brands().find(b => b.name.toLowerCase() === normalizedInput) ?? null;
  }

  onDialogShow(): void {
    this.focusService.saveTriggerElement();
  }

  onDialogHide(): void {
    this.focusService.restoreFocus();
  }

  ngOnInit(): void {
    this.loadBrands();
  }

  ngAfterViewChecked(): void {
    if (this.pendingFocusBrandId && this.editInputs) {
      const inputEl = this.editInputs.find(
        el => el.nativeElement.getAttribute('data-brand-id') === this.pendingFocusBrandId
      );
      if (inputEl) {
        inputEl.nativeElement.focus();
        inputEl.nativeElement.select();
        this.pendingFocusBrandId = null;
      }
    }
  }

  async loadBrands(): Promise<void> {
    this.loading.set(true);
    try {
      const brands = await this.brandService.getBrands();
      this.brands.set(brands.map(b => ({ ...b, editing: false })));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load brands';
      this.toastService.error('Error', message);
    } finally {
      this.loading.set(false);
    }
  }

  openAddDialog(): void {
    this.newBrandName = '';
    this.newBrandLogoFile = null;
    this.newBrandLogoPreview = null;
    this.showAddDialog = true;
  }

  closeAddDialog(): void {
    this.showAddDialog = false;
    this.newBrandName = '';
    this.newBrandLogoFile = null;
    this.newBrandLogoPreview = null;
  }

  onLogoSelect(event: FileSelectEvent): void {
    const file = event.files[0];
    if (file) {
      this.newBrandLogoFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.newBrandLogoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  clearNewLogo(): void {
    this.newBrandLogoFile = null;
    this.newBrandLogoPreview = null;
  }

  async saveBrand(): Promise<void> {
    if (!this.newBrandName.trim()) {
      this.toastService.warn('Warning', 'Brand name is required');
      return;
    }

    this.saving.set(true);
    try {
      let logoUrl: string | null = null;
      if (this.newBrandLogoFile) {
        logoUrl = await this.brandService.uploadLogo(this.newBrandLogoFile);
      }

      const request: CreateBrandRequest = {
        name: this.newBrandName.trim(),
        logoUrl
      };

      await this.brandService.createBrand(request);
      this.toastService.success('Success', 'Brand created successfully');
      this.closeAddDialog();
      await this.loadBrands();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create brand';
      this.toastService.error('Error', message);
    } finally {
      this.saving.set(false);
    }
  }

  startEdit(brand: EditableBrand): void {
    this.brands().forEach(b => {
      if (b.editing) {
        b.editing = false;
      }
    });
    brand.editing = true;
    brand.editName = brand.name;
    this.pendingFocusBrandId = brand.id;
  }

  cancelEdit(brand: EditableBrand): void {
    brand.editing = false;
    brand.editName = undefined;
  }

  async saveEdit(brand: EditableBrand): Promise<void> {
    if (!brand.editName?.trim()) {
      this.toastService.warn('Warning', 'Brand name cannot be empty');
      return;
    }

    if (brand.editName.trim() === brand.name) {
      this.cancelEdit(brand);
      return;
    }

    this.savingId.set(brand.id);
    try {
      const request: UpdateBrandRequest = {
        name: brand.editName.trim()
      };

      await this.brandService.updateBrand(brand.id, request);
      brand.name = brand.editName.trim();
      brand.editing = false;
      brand.editName = undefined;
      this.toastService.success('Success', 'Brand updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update brand';
      this.toastService.error('Error', message);
    } finally {
      this.savingId.set(null);
    }
  }

  openLogoDialog(brand: EditableBrand): void {
    this.selectedBrand = brand;
    this.showLogoDialog = true;
  }

  closeLogoDialog(): void {
    this.showLogoDialog = false;
    this.selectedBrand = null;
  }

  async uploadBrandLogo(event: FileSelectEvent): Promise<void> {
    if (!this.selectedBrand) return;

    const file = event.files[0];
    if (!file) return;

    this.uploadingLogo.set(true);
    try {
      const oldLogoUrl = this.selectedBrand.logoUrl;
      const logoUrl = await this.brandService.uploadLogo(file);

      await this.brandService.updateBrand(this.selectedBrand.id, { logoUrl });

      if (oldLogoUrl) {
        await this.brandService.deleteLogo(oldLogoUrl);
      }

      this.selectedBrand.logoUrl = logoUrl;
      this.brands.update(brands =>
        brands.map(b => b.id === this.selectedBrand!.id ? { ...b, logoUrl } : b)
      );

      this.toastService.success('Success', 'Logo updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload logo';
      this.toastService.error('Error', message);
    } finally {
      this.uploadingLogo.set(false);
    }
  }

  async removeBrandLogo(): Promise<void> {
    if (!this.selectedBrand?.logoUrl) return;

    this.uploadingLogo.set(true);
    try {
      const oldLogoUrl = this.selectedBrand.logoUrl;

      await this.brandService.updateBrand(this.selectedBrand.id, { logoUrl: null });
      await this.brandService.deleteLogo(oldLogoUrl);

      this.selectedBrand.logoUrl = null;
      this.brands.update(brands =>
        brands.map(b => b.id === this.selectedBrand!.id ? { ...b, logoUrl: null } : b)
      );

      this.toastService.success('Success', 'Logo removed successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove logo';
      this.toastService.error('Error', message);
    } finally {
      this.uploadingLogo.set(false);
    }
  }

  async confirmDelete(brand: EditableBrand): Promise<void> {
    const confirmed = await this.confirmService.confirmDelete('brand', brand.name);
    if (!confirmed) return;

    this.deletingId.set(brand.id);
    try {
      if (brand.logoUrl) {
        await this.brandService.deleteLogo(brand.logoUrl);
      }
      await this.brandService.deleteBrand(brand.id);
      this.brands.update(brands => brands.filter(b => b.id !== brand.id));
      this.toastService.success('Success', 'Brand deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete brand';
      this.toastService.error('Error', message);
    } finally {
      this.deletingId.set(null);
    }
  }
}
