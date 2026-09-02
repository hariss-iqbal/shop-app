import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ChipModule } from 'primeng/chip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { SupabaseService } from '../../../../core/services/supabase.service';
import { ProductService } from '../../../../core/services/product.service';
import { BrandService } from '../../../../core/services/brand.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Brand } from '../../../../models/brand.model';
import { ProductCondition, ProductConditionLabels } from '../../../../enums/product-condition.enum';
import { PtaStatus, PtaStatusLabels } from '../../../../enums/pta-status.enum';
import { PostPreviewComponent } from '../post-preview/post-preview.component';
import { PostTemplateContext } from '../../../../core/services/fb-post-template.service';

interface VariantRow {
  /** Synthetic row key: `${variantId}__${color ?? '__nocolor'}`. Used as the p-table dataKey so rows track per (variant, color). */
  id: string;
  /** Real variant id — use this for ALL mutations and navigation. */
  variantId: string;
  modelId: string;
  modelName: string;
  brandId: string;
  brandName: string;
  brandLogoUrl: string | null;
  storageGb: number | null;
  ptaStatus: string | null;
  condition: string;
  sellingPrice: number;
  avgCostPrice: number;
  stockCount: number;
  /** Single color for this row, or null if the variant has no available_colors. */
  color: string | null;
  isActive: boolean;
  /** Color-specific primary image; falls back to generic (color IS NULL) primary, else null. */
  primaryImageUrl: string | null;
}

@Component({
  selector: 'app-variant-list',
  imports: [
    RouterLink,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    SkeletonModule,
    TagModule,
    SelectModule,
    ChipModule,
    ToggleSwitchModule,
    DecimalPipe,
    PostPreviewComponent
  ],
  templateUrl: './variant-list.component.html'
})
export class VariantListComponent implements OnInit {
  constructor(
    private supabase: SupabaseService,
    private productService: ProductService,
    private brandService: BrandService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  variants = signal<VariantRow[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  readonly skeletonRows = Array(5).fill({});

  // Filters
  brands = signal<Brand[]>([]);
  brandFilter = signal<string | null>(null);
  brandOptions = computed(() => [
    { label: 'All Brands', value: null },
    ...this.brands().map(b => ({ label: b.name, value: b.id }))
  ]);

  searchFilter = '';
  conditionFilter = signal<string | null>(null);
  conditionOptions = [
    { label: 'All Conditions', value: null },
    { label: ProductConditionLabels[ProductCondition.NEW], value: ProductCondition.NEW },
    { label: ProductConditionLabels[ProductCondition.USED], value: ProductCondition.USED },
    { label: ProductConditionLabels[ProductCondition.OPEN_BOX], value: ProductCondition.OPEN_BOX }
  ];

  activeFilter = signal<boolean | null>(null);
  activeOptions = [
    { label: 'All', value: null },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
  ];

  // Inline price editing
  editingVariantId = signal<string | null>(null);
  editSellingPrice = signal<number | null>(null);
  savingPriceId = signal<string | null>(null);

  // Toggling active state
  togglingId = signal<string | null>(null);

  // Facebook post preview
  postDialogVisible = signal(false);
  postContext = signal<PostTemplateContext | null>(null);
  postImageUrl = signal<string | null>(null);

  private lastLazyLoadEvent: TableLazyLoadEvent | null = null;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit(): Promise<void> {
    // Restore filters from the URL synchronously so the p-table's initial
    // lazy-load (which fires after ngOnInit) applies them on first render.
    this.restoreFiltersFromUrl();

    try {
      const brands = await this.brandService.getBrands();
      this.brands.set(brands);
    } catch (error) {
      console.error('Failed to load brands:', error);
    }
  }

  /**
   * Seeds the filter state from the current route's query params. Lets filters
   * survive navigating to a variant and back (the browser restores the URL with
   * its query string, and this re-applies them).
   */
  private restoreFiltersFromUrl(): void {
    const params = this.route.snapshot.queryParamMap;
    this.searchFilter = params.get('q') ?? '';
    this.brandFilter.set(params.get('brand'));
    this.conditionFilter.set(params.get('condition'));
    const active = params.get('active');
    this.activeFilter.set(active === 'true' ? true : active === 'false' ? false : null);
  }

  /**
   * Writes the current filter state into the URL query string. Empty/null
   * filters are dropped (value null) so the URL stays clean. Uses replaceUrl so
   * each keystroke/selection doesn't pollute browser history.
   */
  private syncFiltersToUrl(): void {
    const queryParams: Params = {
      q: this.searchFilter?.trim() || null,
      brand: this.brandFilter() ?? null,
      condition: this.conditionFilter() ?? null,
      active: this.activeFilter() === null ? null : String(this.activeFilter())
    };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  async loadVariants(event: TableLazyLoadEvent): Promise<void> {
    this.lastLazyLoadEvent = event;
    this.loading.set(true);

    try {
      const first = event.first ?? 0;
      const rows = event.rows ?? 10;
      const searchTerm = this.searchFilter?.toLowerCase().trim() || undefined;

      let query = this.supabase
        .from('variants')
        .select(`
          id,
          storage_gb,
          pta_status,
          condition,
          selling_price,
          is_active,
          available_colors,
          created_at,
          model:models!model_id!inner(
            id,
            name,
            brand:brands!brand_id!inner(
              id,
              name,
              logo_url
            )
          ),
          variant_images(image_url, is_primary, color)
        `, { count: 'exact' });

      // Active filter
      const activeVal = this.activeFilter();
      if (activeVal !== null && activeVal !== undefined) {
        query = query.eq('is_active', activeVal);
      }

      // Brand filter
      if (this.brandFilter()) {
        query = query.eq('model.brand_id', this.brandFilter());
      }

      // Condition filter
      if (this.conditionFilter()) {
        query = query.eq('condition', this.conditionFilter());
      }

      // Search filter - search by model name
      if (searchTerm) {
        query = query.ilike('model.name', `%${searchTerm}%`);
      }

      // Sorting
      const sortField = event.sortField as string | undefined;
      const sortOrder = event.sortOrder ?? -1;
      if (sortField === 'sellingPrice') {
        query = query.order('selling_price', { ascending: sortOrder === 1 });
      } else if (sortField === 'storageGb') {
        query = query.order('storage_gb', { ascending: sortOrder === 1, nullsFirst: false });
      } else if (sortField === 'createdAt') {
        query = query.order('created_at', { ascending: sortOrder === 1 });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const end = first + rows - 1;
      query = query.range(first, end);

      // Parallel query: compute true fan-out row total across all filtered variants.
      // We replicate the same filter predicates (active, brand, condition, search) so the
      // count matches what the user is filtering on. Variants table is small (~22 rows),
      // so the extra round-trip is cheap.
      let countRowQuery = this.supabase
        .from('variants')
        .select('available_colors, model:models!model_id!inner(id, name, brand:brands!brand_id!inner(id))');

      if (activeVal !== null && activeVal !== undefined) {
        countRowQuery = countRowQuery.eq('is_active', activeVal);
      }
      if (this.brandFilter()) {
        countRowQuery = countRowQuery.eq('model.brand_id', this.brandFilter());
      }
      if (this.conditionFilter()) {
        countRowQuery = countRowQuery.eq('condition', this.conditionFilter());
      }
      if (searchTerm) {
        countRowQuery = countRowQuery.ilike('model.name', `%${searchTerm}%`);
      }

      const [{ data, error, count }, countRowResult] = await Promise.all([
        query,
        countRowQuery
      ]);

      if (error) {
        throw new Error(error.message);
      }

      const variantRows: VariantRow[] = [];

      for (const row of (data || [])) {
        const modelData = row.model as unknown as Record<string, unknown> | null;
        const brandData = modelData?.['brand'] as unknown as Record<string, unknown> | null;

        // Fetch aggregate data for this variant
        const variantId = row.id as string;

        // One query: pull color + cost_price for every available product on this variant,
        // then group in JS. Replaces the previous separate count + colorsResult queries.
        const stockResult = await this.supabase
          .from('products')
          .select('color, cost_price')
          .eq('variant_id', variantId)
          .eq('status', 'available');

        const stockProducts = (stockResult.data || []) as Array<Record<string, unknown>>;
        const totalStockCount = stockProducts.length;
        const allCostPrices = stockProducts.map(p => Number(p['cost_price'])).filter(n => !Number.isNaN(n));
        const avgCostPrice = allCostPrices.length > 0
          ? Math.round(allCostPrices.reduce((a, b) => a + b, 0) / allCostPrices.length)
          : 0;

        // Per-color stock breakdown (key '' = null/no-color products).
        const stockByColor = new Map<string, number>();
        for (const p of stockProducts) {
          const key = (p['color'] as string | null) ?? '';
          stockByColor.set(key, (stockByColor.get(key) ?? 0) + 1);
        }

        const variantImagesRaw = (row as unknown as Record<string, unknown>)['variant_images'];
        const variantImages: Array<Record<string, unknown>> = Array.isArray(variantImagesRaw)
          ? (variantImagesRaw as Array<Record<string, unknown>>)
          : [];

        const availableColorsRaw = (row as unknown as Record<string, unknown>)['available_colors'] as string[] | null | undefined;
        const colors: Array<string | null> = (availableColorsRaw && availableColorsRaw.length > 0)
          ? availableColorsRaw
          : [null];

        const baseRow = {
          modelId: modelData?.['id'] as string || '',
          modelName: modelData?.['name'] as string || '',
          brandId: brandData?.['id'] as string || '',
          brandName: brandData?.['name'] as string || '',
          brandLogoUrl: brandData?.['logo_url'] as string | null,
          storageGb: row.storage_gb as number | null,
          ptaStatus: row.pta_status as string | null,
          condition: row.condition as string,
          sellingPrice: Number(row.selling_price),
          avgCostPrice,
          isActive: row.is_active as boolean
        };

        for (const color of colors) {
          // Color-specific primary; fall back to the generic (color IS NULL) primary.
          const colorSpecificPrimary = variantImages
            .find(vi => vi['is_primary'] === true && (vi['color'] as string | null) === color);
          const genericPrimary = variantImages
            .find(vi => vi['is_primary'] === true && (vi['color'] as string | null) === null);
          const primaryImageUrl = (colorSpecificPrimary?.['image_url'] as string | null)
            ?? (genericPrimary?.['image_url'] as string | null)
            ?? null;

          // Per-color stock: when color is null we use the empty-key bucket; otherwise the color bucket.
          // If the variant has colors but a product was somehow saved with NULL color, that stock won't show on any row.
          // We accept that for now — the admin can fix the product's color in inventory.
          const stockCount = stockByColor.get(color ?? '') ?? (colors.length === 1 && color === null ? totalStockCount : 0);

          variantRows.push({
            id: `${variantId}__${color ?? '__nocolor'}`,
            variantId,
            color,
            stockCount,
            primaryImageUrl,
            ...baseRow
          });
        }
      }

      this.variants.set(variantRows);
      // Compute true total displayed-row count from the parallel count-row query: sum of
      // max(available_colors.length, 1) across all filtered variants.
      // Note: variant-level pagination is preserved (range applies to variants, not rows),
      // so a given page may render slightly more than `event.rows` rows when variants have
      // multiple colors. The paginator's total now accurately reflects fan-out row count.
      const countRowData = (countRowResult.data ?? []) as Array<Record<string, unknown>>;
      const totalRowCount = countRowData.reduce((acc, r) => {
        const colors = (r['available_colors'] as string[] | null | undefined) ?? [];
        return acc + Math.max(colors.length, 1);
      }, 0);
      // Fall back to PostgREST variant count if the count-row query failed for any reason.
      this.totalRecords.set(countRowResult.error ? (count ?? 0) : totalRowCount);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load variants');
      console.error('Failed to load variants:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.syncFiltersToUrl();
      if (this.lastLazyLoadEvent) {
        this.loadVariants({ ...this.lastLazyLoadEvent, first: 0 });
      }
    }, 300);
  }

  clearSearch(): void {
    this.searchFilter = '';
    this.onSearch();
  }

  onFilterChange(): void {
    this.syncFiltersToUrl();
    if (this.lastLazyLoadEvent) {
      this.loadVariants({ ...this.lastLazyLoadEvent, first: 0 });
    }
  }

  onRowClick(variant: VariantRow): void {
    // Carry the row's color so the detail page can preselect it for image uploads.
    this.router.navigate(['/admin/variants', variant.variantId], {
      queryParams: variant.color ? { color: variant.color } : {}
    });
  }

  startPriceEdit(variant: VariantRow, event: Event): void {
    event.stopPropagation();
    // editingVariantId tracks by variantId so all rows sharing a variant enter edit mode together —
    // the price is shared across colors and updating one updates the row group.
    this.editingVariantId.set(variant.variantId);
    this.editSellingPrice.set(variant.sellingPrice);
  }

  cancelPriceEdit(): void {
    this.editingVariantId.set(null);
    this.editSellingPrice.set(null);
  }

  async savePriceEdit(variant: VariantRow): Promise<void> {
    const newPrice = this.editSellingPrice();
    if (newPrice === null || newPrice < 0) {
      this.toastService.warn('Invalid', 'Selling price must be a valid positive number');
      return;
    }

    if (newPrice === variant.sellingPrice) {
      this.cancelPriceEdit();
      return;
    }

    this.savingPriceId.set(variant.variantId);
    try {
      await this.productService.updateVariantSellingPrice(variant.variantId, newPrice);
      this.variants.update(variants =>
        variants.map(v => v.variantId === variant.variantId ? { ...v, sellingPrice: newPrice } : v)
      );
      this.toastService.success('Updated', `Selling price updated for ${variant.brandName} ${variant.modelName}`);
      this.cancelPriceEdit();
    } catch (error) {
      this.toastService.error('Error', 'Failed to update selling price');
      console.error('Failed to update selling price:', error);
    } finally {
      this.savingPriceId.set(null);
    }
  }

  async toggleActive(variant: VariantRow, newValue: boolean): Promise<void> {
    this.togglingId.set(variant.variantId);
    try {
      const { error } = await this.supabase
        .from('variants')
        .update({ is_active: newValue })
        .eq('id', variant.variantId);

      if (error) throw new Error(error.message);

      this.variants.update(variants =>
        variants.map(v => v.variantId === variant.variantId ? { ...v, isActive: newValue } : v)
      );
      this.toastService.success(
        'Updated',
        `${variant.brandName} ${variant.modelName} is now ${newValue ? 'active' : 'inactive'}`
      );
    } catch (error) {
      this.toastService.error('Error', 'Failed to toggle active status');
      console.error('Failed to toggle active:', error);
    } finally {
      this.togglingId.set(null);
    }
  }

  /**
   * Opens the post preview for a row. The caption is rendered from the row we
   * already hold — stock, price and colour are exactly what the table shows,
   * so the post matches what the admin is looking at.
   */
  openPostPreview(variant: VariantRow): void {
    this.postContext.set({
      modelName: variant.modelName,
      brandName: variant.brandName,
      storageGb: variant.storageGb,
      color: variant.color,
      condition: variant.condition,
      ptaStatus: variant.ptaStatus,
      sellingPrice: variant.sellingPrice,
      stockCount: variant.stockCount
    });
    this.postImageUrl.set(variant.primaryImageUrl);
    this.postDialogVisible.set(true);
  }

  getPtaLabel(status: string | null): string {
    if (!status) return '-';
    return PtaStatusLabels[status as PtaStatus] || status;
  }

  getPtaSeverity(status: string | null): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | undefined {
    if (!status) return 'secondary';
    const map: Record<string, 'success' | 'warn'> = {
      pta_approved: 'success',
      non_pta: 'warn'
    };
    return map[status] || 'secondary';
  }

  getConditionLabel(condition: string): string {
    return ProductConditionLabels[condition as keyof typeof ProductConditionLabels] || condition;
  }

  getConditionSeverity(condition: string): 'success' | 'info' | 'warn' | 'secondary' | undefined {
    const map: Record<string, 'success' | 'info' | 'warn'> = {
      new: 'success',
      open_box: 'info',
      used: 'warn'
    };
    return map[condition] || 'secondary';
  }
}
