import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, Params, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, skip } from 'rxjs/operators';
import { ProductService, CatalogPaginationParams, ModelCatalogItem } from '../../../core/services/product.service';
import { BrandService } from '../../../core/services/brand.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SeoService } from '../../../shared/services/seo.service';
import { ShopDetailsService } from '../../../core/services/shop-details.service';
import { Brand } from '../../../models/brand.model';
import { ProductCondition, ProductConditionLabels, PtaStatus, PtaStatusLabels, ProductStatus } from '../../../enums';

interface SortOption {
  label: string;
  value: string;
  field: string;
  order: number;
}

interface ActiveFilter {
  type: 'brand' | 'condition' | 'storage' | 'price' | 'search' | 'pta';
  label: string;
  value: string | number | ProductCondition;
}

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss']
})
export class CatalogComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  private isInitializing = true;
  private isNavigatingFromUrl = false;
  private filterVersion = signal(0);

  /* ── Data signals ── */
  models = signal<ModelCatalogItem[]>([]);
  brands = signal<Brand[]>([]);
  loading = signal(true);
  totalRecords = signal(0);
  availableStorageOptions = signal<number[]>([]);
  priceMin = signal(0);
  priceMax = signal(1000);

  /* ── Filter state ── */
  searchQuery = '';
  selectedBrandIds: string[] = [];
  selectedConditions: ProductCondition[] = [];
  selectedStorageValues: number[] = [];
  selectedPtaStatus: PtaStatus | null = null;
  selectedModelId: string | null = null;
  priceRange: [number, number] = [0, 1000];
  selectedSort: SortOption;
  first = signal(0);
  pageSize = 12;

  /* ── UI state ── */
  viewMode = signal<'grid' | 'list'>('grid');
  filterDrawerVisible = false;
  collapsedGroups: Record<string, boolean> = {};

  /* ── Sort options ── */
  sortOptions: SortOption[] = [
    { label: 'Most popular', value: 'popular', field: 'created_at', order: -1 },
    { label: 'Newest', value: 'newest', field: 'created_at', order: -1 },
    { label: 'Price: low → high', value: 'price_asc', field: 'selling_price', order: 1 },
    { label: 'Price: high → low', value: 'price_desc', field: 'selling_price', order: -1 },
  ];

  /* ── Condition pills ── */
  conditionPills = [
    { label: 'All', value: 'all' },
    { label: 'New', value: ProductCondition.NEW },
    { label: 'Open box', value: ProductCondition.OPEN_BOX },
    { label: 'Pre-owned · A', value: ProductCondition.USED },
  ];
  selectedConditionPill = signal<string>('all');

  /* ── PTA status references for template ── */
  ptaApproved = PtaStatus.PTA_APPROVED;
  ptaNonPta = PtaStatus.NON_PTA;

  /* ── Visual-only filter options ── */
  ramOptions = ['4 GB', '6 GB', '8 GB', '12 GB', '16 GB'];
  selectedRamValues: string[] = [];

  batteryHealthOptions = [
    { label: '95% & above', value: '95+' },
    { label: '90–95%', value: '90-95' },
    { label: '85–90%', value: '85-90' },
  ];
  selectedBatteryHealth: string[] = [];

  minRating = signal<number>(0);

  /* ── Computed ── */
  rangePercent = computed(() => {
    const span = this.priceMax() - this.priceMin();
    if (span <= 0) return { left: 0, right: 100, nubLeft: 0, nubRight: 100 };
    return {
      left: ((this.priceRange[0] - this.priceMin()) / span) * 100,
      right: 100 - ((this.priceRange[1] - this.priceMin()) / span) * 100,
      nubLeft: ((this.priceRange[0] - this.priceMin()) / span) * 100,
      nubRight: ((this.priceRange[1] - this.priceMin()) / span) * 100,
    };
  });

  activeFilters = computed((): ActiveFilter[] => {
    this.filterVersion();
    const filters: ActiveFilter[] = [];
    if (this.searchQuery) {
      filters.push({ type: 'search', label: `Search: "${this.searchQuery}"`, value: this.searchQuery });
    }
    for (const brandId of this.selectedBrandIds) {
      const brand = this.brands().find(b => b.id === brandId);
      if (brand) filters.push({ type: 'brand', label: brand.name, value: brandId });
    }
    for (const condition of this.selectedConditions) {
      filters.push({ type: 'condition', label: ProductConditionLabels[condition], value: condition });
    }
    for (const storage of this.selectedStorageValues) {
      filters.push({ type: 'storage', label: `${storage}GB`, value: storage });
    }
    if (this.selectedPtaStatus) {
      filters.push({ type: 'pta', label: PtaStatusLabels[this.selectedPtaStatus], value: this.selectedPtaStatus });
    }
    const min = this.priceMin();
    const max = this.priceMax();
    if (this.priceRange[0] > min || this.priceRange[1] < max) {
      filters.push({
        type: 'price',
        label: `PKR ${this.fmt(this.priceRange[0])} – ${this.fmt(this.priceRange[1])}`,
        value: `${this.priceRange[0]}-${this.priceRange[1]}`
      });
    }
    return filters;
  });

  totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize));
  currentPage = computed(() => Math.floor(this.first() / this.pageSize) + 1);
  showingFrom = computed(() => this.loading() ? 0 : this.first() + 1);
  showingTo = computed(() => Math.min(this.first() + this.pageSize, this.totalRecords()));

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const result: (number | string)[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) result.push(i);
    } else {
      result.push(1);
      if (current > 3) result.push('…');
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        result.push(i);
      }
      if (current < total - 2) result.push('…');
      result.push(total);
    }
    return result;
  });

  storageOptions = computed(() => this.availableStorageOptions().map(gb => `${gb}GB`));

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private productService: ProductService,
    private brandService: BrandService,
    private toastService: ToastService,
    private seoService: SeoService,
    private shopDetailsService: ShopDetailsService,
  ) {
    this.selectedSort = this.sortOptions[0];
  }

  ngOnInit(): void {
    const shopName = this.shopDetailsService.shopName() || 'Smart Cell';
    this.seoService.updateMetaTags({
      title: `${shopName} — All Smartphones`,
      description: 'Browse our wide selection of new, used, and open box phones. Filter by brand, condition, storage, and price.',
      url: '/catalog'
    });
    this.setupSearchDebounce();
    this.subscribeToQueryParams();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ── Data loading ── */

  private setupSearchDebounce(): void {
    this.searchSubject$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.first.set(0); this.filterVersion.update(v => v + 1); this.updateUrlParams(); this.loadModels(); });
  }

  private subscribeToQueryParams(): void {
    this.route.queryParams
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe((params: Params) => {
        if (this.isNavigatingFromUrl) { this.isNavigatingFromUrl = false; return; }
        if (this.isInitializing) return;
        this.applyParams(params);
        this.loadModels();
      });
  }

  private async loadInitialData(): Promise<void> {
    await Promise.all([this.loadBrands(), this.loadFilterOptions()]);
    this.applyParams(this.route.snapshot.queryParams);
    this.isInitializing = false;
    await this.loadModels();
  }

  async loadBrands(): Promise<void> {
    try {
      const brands = await this.brandService.getBrands();
      this.brands.set(brands);
    } catch (error) { console.error('Failed to load brands:', error); }
  }

  async loadFilterOptions(): Promise<void> {
    try {
      const [storageOptions, priceRange] = await Promise.all([
        this.productService.getDistinctStorageOptions(),
        this.productService.getPriceRange()
      ]);
      this.availableStorageOptions.set(storageOptions);
      this.priceMin.set(priceRange.min);
      this.priceMax.set(priceRange.max);
      if (this.priceRange[0] === 0 && this.priceRange[1] === 1000) {
        this.priceRange = [priceRange.min, priceRange.max];
      }
    } catch (error) { console.error('Failed to load filter options:', error); }
  }

  async loadModels(): Promise<void> {
    this.loading.set(true);
    try {
      const min = this.priceMin();
      const max = this.priceMax();
      const hasPriceFilter = this.priceRange[0] > min || this.priceRange[1] < max;
      const hasAnyFilter = this.selectedBrandIds.length > 0 || this.selectedConditions.length > 0
        || this.selectedStorageValues.length > 0 || this.selectedPtaStatus !== null
        || hasPriceFilter || !!this.searchQuery;
      const effectiveSort = (!hasAnyFilter && this.selectedSort.value === 'popular')
        ? { field: 'selling_price' as const, order: 1 as const }
        : { field: this.selectedSort.field, order: this.selectedSort.order };
      const paginationParams: CatalogPaginationParams = {
        first: this.first(), rows: this.pageSize,
        sortField: effectiveSort.field, sortOrder: effectiveSort.order
      };
      const result = await this.productService.getModelCatalog(paginationParams, {
        status: ProductStatus.AVAILABLE,
        brandIds: this.selectedBrandIds.length > 0 ? this.selectedBrandIds : undefined,
        conditions: this.selectedConditions.length > 0 ? this.selectedConditions : undefined,
        storageGbOptions: this.selectedStorageValues.length > 0 ? this.selectedStorageValues : undefined,
        minPrice: hasPriceFilter ? this.priceRange[0] : undefined,
        maxPrice: hasPriceFilter ? this.priceRange[1] : undefined,
        search: this.searchQuery || undefined,
        ptaStatus: this.selectedPtaStatus || undefined,
        modelId: this.selectedModelId || undefined
      });
      this.models.set(result.data);
      this.totalRecords.set(result.total);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load products';
      this.toastService.error('Error', message);
    } finally {
      this.loading.set(false);
    }
  }

  /* ── URL sync ── */

  private applyParams(params: Params): void {
    this.searchQuery = params['search'] || '';
    if (params['brand']) {
      this.selectedBrandIds = (params['brand'] as string).split(',').filter(id => id.trim().length > 0);
    } else { this.selectedBrandIds = []; }
    if (params['condition']) {
      const conditions = params['condition'].split(',') as ProductCondition[];
      this.selectedConditions = conditions.filter(c => Object.values(ProductCondition).includes(c));
    } else { this.selectedConditions = []; }
    if (params['storage']) {
      this.selectedStorageValues = params['storage'].split(',').map(Number).filter((n: number) => !isNaN(n));
    } else { this.selectedStorageValues = []; }
    if (params['pta']) {
      const pta = params['pta'] as PtaStatus;
      if (Object.values(PtaStatus).includes(pta)) this.selectedPtaStatus = pta;
    } else { this.selectedPtaStatus = null; }
    const min = this.priceMin(), max = this.priceMax();
    if (params['minPrice']) {
      const p = Number(params['minPrice']);
      this.priceRange = [!isNaN(p) ? p : min, this.priceRange[1]];
    } else { this.priceRange = [min, this.priceRange[1]]; }
    if (params['maxPrice']) {
      const p = Number(params['maxPrice']);
      this.priceRange = [this.priceRange[0], !isNaN(p) ? p : max];
    } else { this.priceRange = [this.priceRange[0], max]; }
    if (params['sort']) {
      const sort = this.sortOptions.find(s => s.value === params['sort']);
      this.selectedSort = sort || this.sortOptions[0];
    } else { this.selectedSort = this.sortOptions[0]; }
    if (params['page']) {
      const page = Number(params['page']);
      this.first.set((!isNaN(page) && page > 0) ? (page - 1) * this.pageSize : 0);
    } else { this.first.set(0); }
    if (params['view'] === 'list') { this.viewMode.set('list'); } else { this.viewMode.set('grid'); }

    this.selectedConditionPill.set(
      this.selectedConditions.length === 1 ? this.selectedConditions[0] : 'all'
    );
  }

  private buildQueryParams(): Record<string, string> {
    const params: Record<string, string | null> = {};
    params['search'] = this.searchQuery || null;
    params['brand'] = this.selectedBrandIds.length > 0 ? this.selectedBrandIds.join(',') : null;
    params['condition'] = this.selectedConditions.length > 0 ? this.selectedConditions.join(',') : null;
    params['storage'] = this.selectedStorageValues.length > 0 ? this.selectedStorageValues.join(',') : null;
    params['pta'] = this.selectedPtaStatus || null;
    const min = this.priceMin(), max = this.priceMax();
    params['minPrice'] = this.priceRange[0] > min ? String(this.priceRange[0]) : null;
    params['maxPrice'] = this.priceRange[1] < max ? String(this.priceRange[1]) : null;
    params['sort'] = this.selectedSort.value !== 'popular' ? this.selectedSort.value : null;
    params['view'] = this.viewMode() !== 'grid' ? this.viewMode() : null;
    const page = Math.floor(this.first() / this.pageSize) + 1;
    params['page'] = page > 1 ? String(page) : null;
    const cleanParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== null) cleanParams[key] = value;
    }
    return cleanParams;
  }

  private updateUrlParams(): void {
    this.isNavigatingFromUrl = true;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.buildQueryParams(),
      queryParamsHandling: ''
    });
  }

  /* ── Event handlers ── */

  onSearchInput(event: Event): void {
    this.searchSubject$.next((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchSubject$.next('');
  }

  hasActiveFilters(): boolean {
    const min = this.priceMin(), max = this.priceMax();
    return !!(this.searchQuery || this.selectedBrandIds.length > 0 ||
      this.selectedConditions.length > 0 || this.selectedStorageValues.length > 0 ||
      this.selectedPtaStatus || this.priceRange[0] > min || this.priceRange[1] < max);
  }

  clearFilters(): void {
    this.filterVersion.update(v => v + 1);
    this.searchQuery = '';
    this.selectedBrandIds = [];
    this.selectedConditions = [];
    this.selectedStorageValues = [];
    this.selectedPtaStatus = null;
    this.selectedModelId = null;
    this.selectedConditionPill.set('all');
    this.priceRange = [this.priceMin(), this.priceMax()];
    this.first.set(0);
    this.updateUrlParams();
    this.loadModels();
  }

  removeFilter(filter: ActiveFilter): void {
    this.filterVersion.update(v => v + 1);
    switch (filter.type) {
      case 'search': this.searchQuery = ''; break;
      case 'brand': this.selectedBrandIds = this.selectedBrandIds.filter(id => id !== filter.value); break;
      case 'condition': this.selectedConditions = this.selectedConditions.filter(c => c !== filter.value); break;
      case 'storage': this.selectedStorageValues = this.selectedStorageValues.filter(s => s !== filter.value); break;
      case 'price': this.priceRange = [this.priceMin(), this.priceMax()]; break;
      case 'pta': this.selectedPtaStatus = null; break;
    }
    this.first.set(0);
    this.updateUrlParams();
    this.loadModels();
  }

  onFilterChange(): void {
    if (this.isInitializing) return;
    this.first.set(0);
    this.filterVersion.update(v => v + 1);
    this.updateUrlParams();
    this.loadModels();
  }

  onSortChange(): void {
    if (this.isInitializing) return;
    this.first.set(0);
    this.filterVersion.update(v => v + 1);
    this.updateUrlParams();
    this.loadModels();
  }

  toggleBrand(brandId: string): void {
    const idx = this.selectedBrandIds.indexOf(brandId);
    this.selectedBrandIds = idx >= 0
      ? this.selectedBrandIds.filter(id => id !== brandId)
      : [...this.selectedBrandIds, brandId];
    this.onFilterChange();
  }

  setConditionPill(value: string): void {
    this.selectedConditionPill.set(value);
    this.selectedConditions = value === 'all' ? [] : [value as ProductCondition];
    this.onFilterChange();
  }

  togglePtaStatus(status: PtaStatus): void {
    this.selectedPtaStatus = this.selectedPtaStatus === status ? null : status;
    this.onFilterChange();
  }

  toggleStorage(value: number): void {
    const idx = this.selectedStorageValues.indexOf(value);
    this.selectedStorageValues = idx >= 0
      ? this.selectedStorageValues.filter(v => v !== value)
      : [...this.selectedStorageValues, value];
    this.onFilterChange();
  }

  setPriceQuick(min: number, max: number): void {
    this.priceRange = [min, max];
    this.onFilterChange();
  }

  onPriceInputChange(): void {
    this.onFilterChange();
  }

  onMinPriceChange(val: string): void {
    const parsed = Number(val.replace(/,/g, ''));
    this.priceRange[0] = isNaN(parsed) ? this.priceMin() : parsed;
    this.onFilterChange();
  }

  onMaxPriceChange(val: string): void {
    const parsed = Number(val.replace(/,/g, ''));
    this.priceRange[1] = isNaN(parsed) ? this.priceMax() : parsed;
    this.onFilterChange();
  }

  /* ── UI toggles ── */

  toggleViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
    this.updateUrlParams();
  }

  toggleFilterGroup(group: string): void {
    this.collapsedGroups[group] = !this.collapsedGroups[group];
  }

  isGroupCollapsed(group: string): boolean {
    return !!this.collapsedGroups[group];
  }

  toggleFilterDrawer(): void {
    this.filterDrawerVisible = !this.filterDrawerVisible;
  }

  toggleRamValue(ram: string): void {
    const idx = this.selectedRamValues.indexOf(ram);
    this.selectedRamValues = idx >= 0 ? this.selectedRamValues.filter(r => r !== ram) : [...this.selectedRamValues, ram];
  }

  toggleBatteryHealth(value: string): void {
    const idx = this.selectedBatteryHealth.indexOf(value);
    this.selectedBatteryHealth = idx >= 0 ? this.selectedBatteryHealth.filter(b => b !== value) : [...this.selectedBatteryHealth, value];
  }

  setMinRating(rating: number): void {
    this.minRating.set(this.minRating() === rating ? 0 : rating);
  }

  /* ── Pagination ── */

  goToPage(page: number | string): void {
    if (typeof page === 'string') return;
    this.first.set((page - 1) * this.pageSize);
    this.updateUrlParams();
    this.loadModels();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prevPage(): void {
    const cur = this.currentPage();
    if (cur > 1) this.goToPage(cur - 1);
  }

  nextPage(): void {
    const cur = this.currentPage();
    if (cur < this.totalPages()) this.goToPage(cur + 1);
  }

  viewModel(model: ModelCatalogItem): void {
    this.router.navigate(['/product', model.slug], model.color ? { queryParams: { color: model.color } } : {});
  }

  /* ── Helpers ── */

  fmt(n: number): string {
    return n.toLocaleString('en-PK');
  }

  getCondLabel(cond: string): string {
    if (cond === 'new' || cond === ProductCondition.NEW) return 'New';
    if (cond === 'used' || cond === ProductCondition.USED) return 'Pre-owned · A';
    if (cond === 'open_box' || cond === ProductCondition.OPEN_BOX) return 'Open box';
    return cond;
  }

  getCondClass(cond: string): string {
    if (cond === 'new' || cond === ProductCondition.NEW) return 'new';
    if (cond === 'used' || cond === ProductCondition.USED) return 'used';
    return 'open';
  }

  getModelColor(model: ModelCatalogItem): string {
    const colors: Record<string, string> = {
      'Google': '#D6F96B', 'Apple': '#C5C5C0', 'Samsung': '#3A3A3A',
      'OnePlus': '#2E7D5E', 'Xiaomi': '#FF6900', 'Nothing': '#D6F96B',
    };
    return colors[model.brandName] || 'var(--accent)';
  }

  getColorDot(color: string): string {
    const c = color.toLowerCase();
    if (/black|obsidian|midnight|carbon/i.test(c)) return '#1F1F23';
    if (/white|snow|starlight|porcelain|silver/i.test(c)) return '#E8E6E1';
    if (/blue|ocean|navy|sky|cobalt/i.test(c)) return '#4A7FB5';
    if (/green|mint|alpine|forest/i.test(c)) return '#5F9E6F';
    if (/red|crimson/i.test(c)) return '#C44B4B';
    if (/gold|bronze|champagne/i.test(c)) return '#C9A96E';
    if (/purple|violet|lavender/i.test(c)) return '#8B6BAE';
    if (/pink|rose|peony|coral/i.test(c)) return '#E4AEB4';
    if (/yellow|lemon/i.test(c)) return '#E8D44D';
    if (/orange|tangerine|apricot/i.test(c)) return '#E89B4D';
    if (/gray|graphite|hazel|titanium/i.test(c)) return '#8A816A';
    if (/teal|aqua/i.test(c)) return '#4DA8A8';
    return '#888';
  }

  gradientId(id: string): string {
    return 'pb' + id.replace(/[^a-zA-Z0-9]/g, '');
  }

  gradientUrl(id: string): string {
    return 'url(#pb' + id.replace(/[^a-zA-Z0-9]/g, '') + ')';
  }

  navigateToCatalog(): void {
    this.router.navigate(['/catalog']);
  }

  compareSort(a: SortOption, b: SortOption): boolean {
    return a && b ? a.value === b.value : a === b;
  }
}
