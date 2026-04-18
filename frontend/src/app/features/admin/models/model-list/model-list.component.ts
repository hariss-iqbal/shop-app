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
import { SelectModule } from 'primeng/select';
import { ListboxModule } from 'primeng/listbox';
import { MessageModule } from 'primeng/message';
import { ModelService } from '../../../../core/services/model.service';
import { BrandService } from '../../../../core/services/brand.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirmation.service';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';
import { ProductSpecsScraperService, GsmArenaSearchResult } from '../../../../core/services/product-specs-scraper.service';
import { PhoneModel, CreateModelRequest } from '../../../../models/phone-model.model';
import { Brand } from '../../../../models/brand.model';

interface EditableModel extends PhoneModel {
  editing?: boolean;
  editName?: string;
  stockCount?: number;
}

interface BrandOption {
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-model-list',
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
    SelectModule,
    ListboxModule,
    MessageModule
  ],
  templateUrl: './model-list.component.html'
})
export class ModelListComponent implements OnInit, AfterViewChecked {
  constructor(
    private modelService: ModelService,
    private brandService: BrandService,
    private toastService: ToastService,
    private confirmService: ConfirmDialogService,
    private focusService: FocusManagementService,
    private specsScraperService: ProductSpecsScraperService
  ) { }

  @ViewChildren('editInput') editInputs!: QueryList<ElementRef<HTMLInputElement>>;

  models = signal<EditableModel[]>([]);
  brands = signal<Brand[]>([]);
  loading = signal(true);
  readonly skeletonRows = Array(5).fill({});
  saving = signal(false);
  savingId = signal<string | null>(null);
  deletingId = signal<string | null>(null);

  brandFilter = signal<string | null>(null);
  brandOptions = signal<BrandOption[]>([]);

  showAddDialog = false;
  newModelBrandId: string | null = null;
  searchQuery = '';
  searchResults = signal<GsmArenaSearchResult[]>([]);
  selectedResult = signal<GsmArenaSearchResult | null>(null);
  searching = signal(false);
  searchError = signal<string | null>(null);
  searchPerformed = signal(false);

  private pendingFocusModelId: string | null = null;

  get newBrandOptions(): BrandOption[] {
    return this.brands().map(b => ({ label: b.name, value: b.id }));
  }

  get selectedBrandName(): string {
    if (!this.newModelBrandId) return '';
    return this.brands().find(b => b.id === this.newModelBrandId)?.name ?? '';
  }

  get selectedModelName(): string | null {
    const result = this.selectedResult();
    if (!result) return null;
    // Strip brand prefix from the name (e.g. "Samsung Galaxy S24" -> "Galaxy S24")
    const brandName = this.selectedBrandName;
    if (brandName && result.name.toLowerCase().startsWith(brandName.toLowerCase())) {
      return result.name.substring(brandName.length).trim();
    }
    return result.name;
  }

  get similarModelExists(): PhoneModel | null {
    const modelName = this.selectedModelName;
    if (!modelName || !this.newModelBrandId) return null;
    const normalizedInput = modelName.toLowerCase();
    return this.models().find(
      m => m.name.toLowerCase() === normalizedInput && m.brandId === this.newModelBrandId
    ) ?? null;
  }

  /** Check if a search result already exists in the DB for the selected brand */
  isModelInDb(result: GsmArenaSearchResult): boolean {
    if (!this.newModelBrandId) return false;
    const brandName = this.selectedBrandName;
    let modelName = result.name;
    if (brandName && modelName.toLowerCase().startsWith(brandName.toLowerCase())) {
      modelName = modelName.substring(brandName.length).trim();
    }
    const normalized = modelName.toLowerCase();
    return this.models().some(
      m => m.name.toLowerCase() === normalized && m.brandId === this.newModelBrandId
    );
  }

  onDialogShow(): void {
    this.focusService.saveTriggerElement();
  }

  onDialogHide(): void {
    this.focusService.restoreFocus();
  }

  ngOnInit(): void {
    this.loadBrands();
    this.loadModels();
  }

  ngAfterViewChecked(): void {
    if (this.pendingFocusModelId && this.editInputs) {
      const inputEl = this.editInputs.find(
        el => el.nativeElement.getAttribute('data-model-id') === this.pendingFocusModelId
      );
      if (inputEl) {
        inputEl.nativeElement.focus();
        inputEl.nativeElement.select();
        this.pendingFocusModelId = null;
      }
    }
  }

  async loadBrands(): Promise<void> {
    try {
      const brands = await this.brandService.getBrands();
      this.brands.set(brands);
      this.brandOptions.set([
        { label: 'All Brands', value: null },
        ...brands.map(b => ({ label: b.name, value: b.id }))
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load brands';
      this.toastService.error('Error', message);
    }
  }

  async loadModels(): Promise<void> {
    this.loading.set(true);
    try {
      const filter = this.brandFilter() ? { brandId: this.brandFilter()! } : undefined;
      const models = await this.modelService.getModels(filter);
      this.models.set(models.map(m => ({ ...m, editing: false, stockCount: undefined })));
      this.loadProductCounts();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load models';
      this.toastService.error('Error', message);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadProductCounts(): Promise<void> {
    const currentModels = this.models();
    if (currentModels.length === 0) return;

    try {
      const counts = await this.modelService.getStockCounts();
      this.models.set(
        currentModels.map(m => ({ ...m, stockCount: counts.get(m.id) || 0 }))
      );
    } catch {
      // Non-critical — leave counts as undefined
    }
  }

  onBrandFilterChange(): void {
    this.loadModels();
  }

  openAddDialog(): void {
    this.newModelBrandId = null;
    this.searchQuery = '';
    this.searchResults.set([]);
    this.selectedResult.set(null);
    this.searching.set(false);
    this.searchError.set(null);
    this.searchPerformed.set(false);
    this.showAddDialog = true;
  }

  closeAddDialog(): void {
    this.showAddDialog = false;
    this.newModelBrandId = null;
    this.searchQuery = '';
    this.searchResults.set([]);
    this.selectedResult.set(null);
    this.searchError.set(null);
    this.searchPerformed.set(false);
  }

  onSearchInput(): void {
    // Reset selection when typing new query
    this.selectedResult.set(null);
    this.searchError.set(null);
  }

  async performSearch(): Promise<void> {
    if (!this.newModelBrandId) {
      this.toastService.warn('Warning', 'Please select a brand first');
      return;
    }

    const query = `${this.selectedBrandName} ${this.searchQuery}`.trim();
    if (query.length < 2) return;

    this.searching.set(true);
    this.searchError.set(null);
    this.searchPerformed.set(false);

    try {
      const response = await this.specsScraperService.searchModels(query);

      if (response.success && response.data) {
        this.searchResults.set(response.data);
        this.searchPerformed.set(true);

        // Auto-select if only one result
        if (response.data.length === 1) {
          this.selectedResult.set(response.data[0]);
        }
      } else {
        this.searchResults.set([]);
        this.searchPerformed.set(true);
        this.searchError.set(response.error || 'No results found');
      }
    } catch (error) {
      this.searchError.set('Failed to search GSMArena');
      this.searchResults.set([]);
    } finally {
      this.searching.set(false);
    }
  }

  onResultSelect(result: GsmArenaSearchResult): void {
    this.selectedResult.set(result);
  }

  async saveModel(): Promise<void> {
    const modelName = this.selectedModelName;
    if (!modelName) {
      this.toastService.warn('Warning', 'Please search and select a model');
      return;
    }
    if (!this.newModelBrandId) {
      this.toastService.warn('Warning', 'Please select a brand');
      return;
    }

    this.saving.set(true);
    try {
      const request: CreateModelRequest = {
        brandId: this.newModelBrandId,
        name: modelName
      };

      await this.modelService.createModel(request);
      this.toastService.success('Success', `Model "${modelName}" created successfully`);
      this.closeAddDialog();
      await this.loadModels();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create model';
      this.toastService.error('Error', message);
    } finally {
      this.saving.set(false);
    }
  }

  startEdit(model: EditableModel): void {
    this.models().forEach(m => {
      if (m.editing) {
        m.editing = false;
      }
    });
    model.editing = true;
    model.editName = model.name;
    this.pendingFocusModelId = model.id;
  }

  cancelEdit(model: EditableModel): void {
    model.editing = false;
    model.editName = undefined;
  }

  async saveEdit(model: EditableModel): Promise<void> {
    if (!model.editName?.trim()) {
      this.toastService.warn('Warning', 'Model name cannot be empty');
      return;
    }

    if (model.editName.trim() === model.name) {
      this.cancelEdit(model);
      return;
    }

    this.savingId.set(model.id);
    try {
      await this.modelService.updateModel(model.id, { name: model.editName.trim() });
      model.name = model.editName.trim();
      model.editing = false;
      model.editName = undefined;
      this.toastService.success('Success', 'Model updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update model';
      this.toastService.error('Error', message);
    } finally {
      this.savingId.set(null);
    }
  }

  async confirmDelete(model: EditableModel): Promise<void> {
    if (model.stockCount && model.stockCount > 0) {
      const confirmed = await this.confirmService.confirm({
        header: 'Delete Model',
        message: `This model has ${model.stockCount} unit(s) in stock. Are you sure you want to delete "${model.name}"?`,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Delete',
        rejectLabel: 'Cancel'
      });
      if (!confirmed) return;
    } else {
      const confirmed = await this.confirmService.confirmDelete('model', model.name);
      if (!confirmed) return;
    }

    this.deletingId.set(model.id);
    try {
      await this.modelService.deleteModel(model.id);
      this.models.update(models => models.filter(m => m.id !== model.id));
      this.toastService.success('Success', 'Model deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete model';
      this.toastService.error('Error', message);
    } finally {
      this.deletingId.set(null);
    }
  }
}
