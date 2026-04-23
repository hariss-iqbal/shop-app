import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SkeletonModule } from 'primeng/skeleton';
import { ProductService, ModelCatalogItem } from '../../../../core/services/product.service';
import { ToastService } from '../../../../shared/services/toast.service';

export interface PrefillData {
  modelId: string;
  modelName: string;
  brandId: string;
  brandName: string;
  storageGb: number | null;
  color: string | null;
  ptaStatus: string | null;
  condition: string;
  variantId: string;
  sellingPrice: number;
  avgCostPrice: number;
  stockCount: number;
}

@Component({
  selector: 'app-add-to-existing-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SkeletonModule
  ],
  template: `
    <p-dialog
      header="Add to Existing Stock"
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '720px', maxHeight: '85vh' }"
      (onShow)="loadCards()"
    >
      <div class="mb-3">
        <p-iconfield>
          <p-inputicon styleClass="pi pi-search" />
          <input pInputText type="text"
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
            placeholder="Search by brand or model..."
            class="w-full"
          />
        </p-iconfield>
      </div>

      @if (loading()) {
        <div class="grid" style="grid-template-columns: repeat(2, 1fr); gap: 12px;">
          @for (_ of [1,2,3,4]; track _) {
            <div class="p-3 border-round surface-border border-1 surface-card">
              <p-skeleton width="60%" height="14px" styleClass="mb-2" />
              <p-skeleton width="80%" height="16px" styleClass="mb-2" />
              <p-skeleton width="40%" height="12px" />
            </div>
          }
        </div>
      } @else if (cards().length === 0) {
        <div class="text-center py-5 text-color-secondary">
          <i class="pi pi-box" style="font-size: 2rem; opacity: 0.4;"></i>
          <p class="mt-2">No existing products found</p>
        </div>
      } @else {
        <div style="max-height: 55vh; overflow-y: auto;">
          <div class="grid" style="grid-template-columns: repeat(2, 1fr); gap: 10px;">
            @for (card of cards(); track card.variantId) {
              <div class="p-3 border-round surface-border border-1 surface-card cursor-pointer hover:border-primary transition-colors transition-duration-200"
                (click)="selectCard(card)"
                style="min-height: 90px;">
                <div class="text-xs text-color-secondary mb-1">{{ card.brandName }}</div>
                <div class="font-semibold text-sm mb-2">{{ card.modelName }}</div>
                <div class="flex flex-wrap gap-1 align-items-center">
                  @if (card.storageGb) {
                    <span class="text-xs px-2 py-1 bg-primary-100 text-primary border-round">{{ card.storageGb }}GB</span>
                  }
                  @if (card.color) {
                    <span class="text-xs px-2 py-1 bg-primary-100 text-primary border-round">{{ card.color }}</span>
                  }
                  @if (card.ptaStatus) {
                    <span class="text-xs px-2 py-1 bg-primary-100 text-primary border-round">{{ card.ptaStatus === 'pta_approved' ? 'PTA' : 'Non-PTA' }}</span>
                  }
                  <span class="text-xs px-2 py-1 bg-primary-100 text-primary border-round">{{ condLabel(card.condition) }}</span>
                </div>
                <div class="mt-2 text-xs text-color-secondary">
                  {{ card.stockCount }} in stock &middot; PKR {{ card.sellingPrice.toLocaleString() }}
                </div>
              </div>
            }
          </div>
        </div>
      }
    </p-dialog>
  `
})
export class AddToExistingDialogComponent {
  visible = false;
  loading = signal(false);
  cards = signal<ModelCatalogItem[]>([]);
  searchQuery = '';
  selected = output<PrefillData>();

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private productService: ProductService,
    private toastService: ToastService
  ) {}

  show(): void {
    this.searchQuery = '';
    this.visible = true;
  }

  async loadCards(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.productService.getModelCatalog(
        { first: 0, rows: 100, sortField: 'created_at', sortOrder: -1 },
        { search: this.searchQuery || undefined }
      );
      this.cards.set(result.data);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load catalog');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadCards(), 300);
  }

  selectCard(card: ModelCatalogItem): void {
    this.selected.emit({
      modelId: card.modelId,
      modelName: card.modelName,
      brandId: card.brandId,
      brandName: card.brandName,
      storageGb: card.storageGb,
      color: null,
      ptaStatus: card.ptaStatus,
      condition: card.condition,
      variantId: card.variantId,
      sellingPrice: card.sellingPrice,
      avgCostPrice: card.avgCostPrice,
      stockCount: card.stockCount
    });
    this.visible = false;
  }

  condLabel(cond: string): string {
    if (cond === 'new') return 'New';
    if (cond === 'used') return 'Used';
    if (cond === 'open_box') return 'Open Box';
    return cond;
  }
}
