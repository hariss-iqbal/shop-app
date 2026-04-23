import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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

interface VariantRow {
  id: string;
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
  availableColors: string[];
  isActive: boolean;
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
    DecimalPipe
  ],
  templateUrl: './variant-list.component.html'
})
export class VariantListComponent implements OnInit {
  constructor(
    private supabase: SupabaseService,
    private productService: ProductService,
    private brandService: BrandService,
    private toastService: ToastService,
    private router: Router
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

  private lastLazyLoadEvent: TableLazyLoadEvent | null = null;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit(): Promise<void> {
    try {
      const brands = await this.brandService.getBrands();
      this.brands.set(brands);
    } catch (error) {
      console.error('Failed to load brands:', error);
    }
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
          primary_image_url,
          created_at,
          model:models!model_id(
            id,
            name,
            brand:brands!brand_id(
              id,
              name,
              logo_url
            )
          )
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

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const variantRows: VariantRow[] = [];

      for (const row of (data || [])) {
        const modelData = row.model as unknown as Record<string, unknown> | null;
        const brandData = modelData?.['brand'] as unknown as Record<string, unknown> | null;

        // Fetch aggregate data for this variant
        const variantId = row.id as string;

        const [stockResult, costResult, colorsResult] = await Promise.all([
          this.supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('variant_id', variantId)
            .eq('status', 'available'),
          this.supabase
            .from('products')
            .select('cost_price')
            .eq('variant_id', variantId)
            .eq('status', 'available'),
          this.supabase
            .from('products')
            .select('color')
            .eq('variant_id', variantId)
            .eq('status', 'available')
            .not('color', 'is', null)
        ]);

        const stockCount = stockResult.count ?? 0;
        const costPrices = (costResult.data || []).map((p: Record<string, unknown>) => Number(p['cost_price']));
        const avgCostPrice = costPrices.length > 0
          ? Math.round(costPrices.reduce((a, b) => a + b, 0) / costPrices.length)
          : 0;
        const availableColors = [...new Set((colorsResult.data || []).map((p: Record<string, unknown>) => p['color'] as string))];

        variantRows.push({
          id: variantId,
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
          stockCount,
          availableColors,
          isActive: row.is_active as boolean,
          primaryImageUrl: row.primary_image_url as string | null
        });
      }

      this.variants.set(variantRows);
      this.totalRecords.set(count ?? 0);
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
    if (this.lastLazyLoadEvent) {
      this.loadVariants({ ...this.lastLazyLoadEvent, first: 0 });
    }
  }

  onRowClick(variant: VariantRow): void {
    this.router.navigate(['/admin/variants', variant.id]);
  }

  startPriceEdit(variant: VariantRow, event: Event): void {
    event.stopPropagation();
    this.editingVariantId.set(variant.id);
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

    this.savingPriceId.set(variant.id);
    try {
      await this.productService.updateVariantSellingPrice(variant.id, newPrice);
      this.variants.update(variants =>
        variants.map(v => v.id === variant.id ? { ...v, sellingPrice: newPrice } : v)
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

  async toggleActive(variant: VariantRow, event: Event): Promise<void> {
    event.stopPropagation();
    this.togglingId.set(variant.id);
    try {
      const { error } = await this.supabase
        .from('variants')
        .update({ is_active: !variant.isActive })
        .eq('id', variant.id);

      if (error) throw new Error(error.message);

      this.variants.update(variants =>
        variants.map(v => v.id === variant.id ? { ...v, isActive: !v.isActive } : v)
      );
      this.toastService.success(
        'Updated',
        `${variant.brandName} ${variant.modelName} is now ${variant.isActive ? 'inactive' : 'active'}`
      );
    } catch (error) {
      this.toastService.error('Error', 'Failed to toggle active status');
      console.error('Failed to toggle active:', error);
    } finally {
      this.togglingId.set(null);
    }
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
