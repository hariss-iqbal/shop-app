import { Component, OnInit, signal, AfterViewChecked, QueryList, ViewChildren, ElementRef } from '@angular/core';
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
  templateUrl: './brand-list.component.html'
})
export class BrandListComponent implements OnInit, AfterViewChecked {
  constructor(
    private brandService: BrandService,
    private toastService: ToastService,
    private confirmService: ConfirmDialogService,
    private focusService: FocusManagementService
  ) { }

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
