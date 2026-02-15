import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, skip } from 'rxjs/operators';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { SliderModule } from 'primeng/slider';
import { ChipModule } from 'primeng/chip';
import { BadgeModule } from 'primeng/badge';
import { CheckboxModule } from 'primeng/checkbox';
import { DrawerModule } from 'primeng/drawer';
import { ProductService, CatalogPaginationParams } from '../../../core/services/product.service';
import { BrandService } from '../../../core/services/brand.service';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SeoService } from '../../../shared/services/seo.service';
import { ProductComparisonService } from '../../../shared/services/product-comparison.service';
import { ProductCardKeyboardDirective } from '../../../shared/directives/product-card-keyboard.directive';
import { BlurUpImageDirective } from '../../../shared/directives/blur-up-image.directive';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { Product } from '../../../models/product.model';
import { Brand } from '../../../models/brand.model';
import { ProductStatus, ProductCondition, ProductConditionLabels, PtaStatus, PtaStatusLabels } from '../../../enums';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { CurrencyService } from '../../../core/services/currency.service';
import { ShopDetailsService } from '../../../core/services/shop-details.service';

type ViewMode = 'grid' | 'list';
type CatalogSection = 'all' | 'new-arrivals';

interface BrandOption {
  id: string | null;
  name: string;
  logoUrl: string | null;
}

interface SortOption {
  label: string;
  value: string;
  field: string;
  order: number;
  icon: string;
}

interface ViewOption {
  icon: string;
  value: ViewMode;
  tooltip: string;
}

interface ConditionOption {
  label: string;
  value: ProductCondition;
}

interface StorageOption {
  label: string;
  value: number;
}

interface ActiveFilter {
  type: 'brand' | 'condition' | 'storage' | 'price' | 'search' | 'pta';
  label: string;
  value: string | number | ProductCondition;
}

interface ProductWithExtras extends Product {
  isNewArrival: boolean;
  hasDiscount: boolean;
  discountPercent: number;
  originalPrice: number | null;
  isFeatured: boolean;
}

interface SectionOption {
  label: string;
  value: CatalogSection;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-catalog',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    TagModule,
    ProgressSpinnerModule,
    AvatarModule,
    SkeletonModule,
    PaginatorModule,
    SelectButtonModule,
    DividerModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    MultiSelectModule,
    SliderModule,
    ChipModule,
    BadgeModule,
    CheckboxModule,
    DrawerModule,
    ProductCardKeyboardDirective,
    BlurUpImageDirective,
    AppCurrencyPipe,
    ProductCardComponent
  ],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss']
})
export class CatalogComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  private isInitializing = true;
  private isNavigatingFromUrl = false;

  products = signal<Product[]>([]);
  brands = signal<Brand[]>([]);
  loading = signal(true);
  totalRecords = signal(0);
  availableStorageOptions = signal<number[]>([]);
  priceMin = signal(0);
  priceMax = signal(1000);

  searchQuery = '';
  selectedBrandId: string | null = null;
  selectedConditions: ProductCondition[] = [];
  selectedStorageValues: number[] = [];
  selectedPtaStatus: PtaStatus | null = null;
  priceRange: [number, number] = [0, 1000];
  selectedSort: SortOption;
  first = 0;
  pageSize = 12;
  viewMode: ViewMode = 'grid';
  currentSection: CatalogSection = 'all';

  skeletonItems = Array(8).fill(0);

  // Section options for AC_REDESIGN_002 & AC_REDESIGN_004
  sectionOptions: SectionOption[] = [
    {
      label: 'All Products',
      value: 'all',
      icon: 'pi pi-th-large',
      description: 'Browse our complete collection of products'
    },
    {
      label: 'New Arrivals',
      value: 'new-arrivals',
      icon: 'pi pi-sparkles',
      description: 'Discover our latest additions - freshly stocked products just for you'
    }
  ];

  // Computed property for section info
  currentSectionInfo = computed(() => {
    return this.sectionOptions.find(s => s.value === this.currentSection) || null;
  });

  // Filter drawer for mobile
  filterDrawerVisible = false;
  activeFilterCount = computed(() => this.activeFilters().length);

  openFilterDrawer(): void {
    this.filterDrawerVisible = true;
  }

  closeFilterDrawer(): void {
    this.filterDrawerVisible = false;
  }

  // Computed extras for list view (grid view uses ProductCardComponent)
  productsWithExtras = computed((): ProductWithExtras[] => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return this.products().map((product) => {
      const createdAt = new Date(product.createdAt);
      const isNewArrival = createdAt >= sevenDaysAgo;
      const hasDiscount = product.profitMargin >= 20;
      const discountPercent = hasDiscount ? Math.round(product.profitMargin) : 0;
      const originalPrice = hasDiscount
        ? Math.round(product.sellingPrice * (1 + discountPercent / 100))
        : null;

      return { ...product, isNewArrival, hasDiscount, discountPercent, originalPrice, isFeatured: product.isFeatured };
    });
  });

  viewOptions: ViewOption[] = [
    { icon: 'pi pi-th-large', value: 'grid', tooltip: 'Grid View' },
    { icon: 'pi pi-list', value: 'list', tooltip: 'List View' }
  ];

  sortOptions: SortOption[] = [
    { label: 'Newest First', value: 'newest', field: 'created_at', order: -1, icon: 'pi pi-clock' },
    { label: 'Oldest First', value: 'oldest', field: 'created_at', order: 1, icon: 'pi pi-history' },
    { label: 'Price: Low to High', value: 'price_asc', field: 'selling_price', order: 1, icon: 'pi pi-sort-amount-up' },
    { label: 'Price: High to Low', value: 'price_desc', field: 'selling_price', order: -1, icon: 'pi pi-sort-amount-down' },
    { label: 'Name: A to Z', value: 'name_asc', field: 'model', order: 1, icon: 'pi pi-sort-alpha-down' },
    { label: 'Name: Z to A', value: 'name_desc', field: 'model', order: -1, icon: 'pi pi-sort-alpha-up' }
  ];

  conditionOptions: ConditionOption[] = [
    { label: ProductConditionLabels[ProductCondition.NEW], value: ProductCondition.NEW },
    { label: ProductConditionLabels[ProductCondition.USED], value: ProductCondition.USED },
    { label: ProductConditionLabels[ProductCondition.OPEN_BOX], value: ProductCondition.OPEN_BOX }
  ];

  ptaStatusOptions = [
    { label: 'All', value: null },
    { label: PtaStatusLabels[PtaStatus.PTA_APPROVED], value: PtaStatus.PTA_APPROVED },
    { label: PtaStatusLabels[PtaStatus.NON_PTA], value: PtaStatus.NON_PTA }
  ];

  brandOptions = computed(() => {
    const allOption: BrandOption = { id: null, name: 'All Brands', logoUrl: null };
    const brandOpts: BrandOption[] = this.brands().map(b => ({
      id: b.id,
      name: b.name,
      logoUrl: b.logoUrl
    }));
    return [allOption, ...brandOpts];
  });

  storageOptions = computed((): StorageOption[] => {
    return this.availableStorageOptions().map(gb => ({
      label: `${gb}GB`,
      value: gb
    }));
  });

  activeFilters = computed((): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];

    if (this.searchQuery) {
      filters.push({
        type: 'search',
        label: `Search: "${this.searchQuery}"`,
        value: this.searchQuery
      });
    }

    if (this.selectedBrandId) {
      const brand = this.brands().find(b => b.id === this.selectedBrandId);
      if (brand) {
        filters.push({
          type: 'brand',
          label: `Brand: ${brand.name}`,
          value: this.selectedBrandId
        });
      }
    }

    for (const condition of this.selectedConditions) {
      filters.push({
        type: 'condition',
        label: `Condition: ${ProductConditionLabels[condition]}`,
        value: condition
      });
    }

    for (const storage of this.selectedStorageValues) {
      filters.push({
        type: 'storage',
        label: `Storage: ${storage}GB`,
        value: storage
      });
    }

    if (this.selectedPtaStatus) {
      filters.push({
        type: 'pta',
        label: `PTA: ${PtaStatusLabels[this.selectedPtaStatus]}`,
        value: this.selectedPtaStatus
      });
    }

    const min = this.priceMin();
    const max = this.priceMax();
    if (this.priceRange[0] > min || this.priceRange[1] < max) {
      filters.push({
        type: 'price',
        label: `Price: ${this.currencyService.symbol}${this.priceRange[0]} - ${this.currencyService.symbol}${this.priceRange[1]}`,
        value: `${this.priceRange[0]}-${this.priceRange[1]}`
      });
    }

    return filters;
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private productService: ProductService,
    private brandService: BrandService,
    private imageOptimization: ImageOptimizationService,
    private toastService: ToastService,
    private seoService: SeoService,
    public comparisonService: ProductComparisonService,
    private currencyService: CurrencyService,
    private shopDetailsService: ShopDetailsService
  ) {
    this.selectedSort = this.sortOptions[0];
  }

  ngOnInit(): void {
    const shopName = this.shopDetailsService.shopName() || 'Phone Shop';
    this.seoService.updateMetaTags({
      title: `${shopName} - Quality Mobile Products`,
      description: 'Browse our wide selection of new, used, and open box products at competitive prices. Filter by brand, condition, storage, and price range.',
      url: '/'
    });
    this.setupSearchDebounce();
    this.subscribeToQueryParams();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.first = 0;
        this.updateUrlParams();
        this.loadProducts();
      });
  }

  private subscribeToQueryParams(): void {
    this.route.queryParams
      .pipe(
        skip(1),
        takeUntil(this.destroy$)
      )
      .subscribe((params: Params) => {
        if (this.isNavigatingFromUrl) {
          this.isNavigatingFromUrl = false;
          return;
        }

        if (this.isInitializing) {
          return;
        }

        this.applyParams(params);
        this.loadProducts();
      });
  }

  private async loadInitialData(): Promise<void> {
    await Promise.all([
      this.loadBrands(),
      this.loadFilterOptions()
    ]);

    this.applyParams(this.route.snapshot.queryParams);
    this.isInitializing = false;
    await this.loadProducts();
  }

  private applyParams(params: Params): void {
    // Apply section filter
    const section = params['section'] as CatalogSection;
    if (section && ['all', 'new-arrivals'].includes(section)) {
      this.currentSection = section;
    } else {
      this.currentSection = 'all';
    }

    this.searchQuery = params['search'] || '';

    this.selectedBrandId = params['brand'] || null;

    if (params['condition']) {
      const conditions = params['condition'].split(',') as ProductCondition[];
      this.selectedConditions = conditions.filter(c =>
        Object.values(ProductCondition).includes(c)
      );
    } else {
      this.selectedConditions = [];
    }

    if (params['storage']) {
      const storageValues = params['storage'].split(',').map(Number).filter((n: number) => !isNaN(n));
      this.selectedStorageValues = storageValues;
    } else {
      this.selectedStorageValues = [];
    }

    if (params['pta']) {
      const pta = params['pta'] as PtaStatus;
      if (Object.values(PtaStatus).includes(pta)) {
        this.selectedPtaStatus = pta;
      }
    } else {
      this.selectedPtaStatus = null;
    }

    const min = this.priceMin();
    const max = this.priceMax();

    if (params['minPrice']) {
      const minPrice = Number(params['minPrice']);
      this.priceRange = [!isNaN(minPrice) ? minPrice : min, this.priceRange[1]];
    } else {
      this.priceRange = [min, this.priceRange[1]];
    }

    if (params['maxPrice']) {
      const maxPrice = Number(params['maxPrice']);
      this.priceRange = [this.priceRange[0], !isNaN(maxPrice) ? maxPrice : max];
    } else {
      this.priceRange = [this.priceRange[0], max];
    }

    if (params['sort']) {
      const sort = this.sortOptions.find(s => s.value === params['sort']);
      this.selectedSort = sort || this.sortOptions[0];
    } else {
      this.selectedSort = this.sortOptions[0];
    }

    if (params['pageSize']) {
      const size = Number(params['pageSize']);
      if (!isNaN(size) && [12, 24, 48].includes(size)) {
        this.pageSize = size;
      }
    } else {
      this.pageSize = 12;
    }

    if (params['page']) {
      const page = Number(params['page']);
      if (!isNaN(page) && page > 0) {
        this.first = (page - 1) * this.pageSize;
      } else {
        this.first = 0;
      }
    } else {
      this.first = 0;
    }
  }

  private buildQueryParams(): Record<string, string> {
    const params: Record<string, string | null> = {};

    params['section'] = this.currentSection !== 'all' ? this.currentSection : null;
    params['search'] = this.searchQuery || null;
    params['brand'] = this.selectedBrandId || null;
    params['condition'] = this.selectedConditions.length > 0
      ? this.selectedConditions.join(',')
      : null;
    params['storage'] = this.selectedStorageValues.length > 0
      ? this.selectedStorageValues.join(',')
      : null;
    params['pta'] = this.selectedPtaStatus || null;

    const min = this.priceMin();
    const max = this.priceMax();
    params['minPrice'] = this.priceRange[0] > min ? String(this.priceRange[0]) : null;
    params['maxPrice'] = this.priceRange[1] < max ? String(this.priceRange[1]) : null;

    params['sort'] = this.selectedSort.value !== 'newest' ? this.selectedSort.value : null;

    params['pageSize'] = this.pageSize !== 12 ? String(this.pageSize) : null;

    const page = Math.floor(this.first / this.pageSize) + 1;
    params['page'] = page > 1 ? String(page) : null;

    const cleanParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== null) {
        cleanParams[key] = value;
      }
    }

    return cleanParams;
  }

  private updateUrlParams(): void {
    const cleanParams = this.buildQueryParams();

    this.isNavigatingFromUrl = true;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: cleanParams,
      queryParamsHandling: ''
    });
  }

  async loadBrands(): Promise<void> {
    try {
      const brands = await this.brandService.getBrands();
      this.brands.set(brands);
    } catch (error) {
      console.error('Failed to load brands:', error);
    }
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
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  }

  async loadProducts(): Promise<void> {
    this.loading.set(true);
    try {
      const min = this.priceMin();
      const max = this.priceMax();
      const hasPriceFilter = this.priceRange[0] > min || this.priceRange[1] < max;

      // Adjust pagination params based on section
      const paginationParams: CatalogPaginationParams = {
        first: this.first,
        rows: this.pageSize,
        sortField: this.selectedSort.field,
        sortOrder: this.selectedSort.order
      };

      // For "New Arrivals", always sort by newest first
      if (this.currentSection === 'new-arrivals') {
        paginationParams.sortField = 'created_at';
        paginationParams.sortOrder = -1;
      }

      const result = await this.productService.getCatalogProducts(
        paginationParams,
        {
          status: ProductStatus.AVAILABLE,
          brandId: this.selectedBrandId || undefined,
          conditions: this.selectedConditions.length > 0 ? this.selectedConditions : undefined,
          storageGbOptions: this.selectedStorageValues.length > 0 ? this.selectedStorageValues : undefined,
          minPrice: hasPriceFilter ? this.priceRange[0] : undefined,
          maxPrice: hasPriceFilter ? this.priceRange[1] : undefined,
          search: this.searchQuery || undefined,
          ptaStatus: this.selectedPtaStatus || undefined
        }
      );

      let products = result.data;
      let total = result.total;

      // Filter products based on section (client-side for now)
      if (this.currentSection === 'new-arrivals') {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        products = products.filter(product => new Date(product.createdAt) >= sevenDaysAgo);
        total = products.length;
      }

      this.products.set(products);
      this.totalRecords.set(total);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load products';
      this.toastService.error('Error', message);
    } finally {
      this.loading.set(false);
    }
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject$.next(target.value);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchSubject$.next('');
  }

  hasActiveFilters(): boolean {
    const min = this.priceMin();
    const max = this.priceMax();
    return !!(
      this.searchQuery ||
      this.selectedBrandId ||
      this.selectedConditions.length > 0 ||
      this.selectedStorageValues.length > 0 ||
      this.selectedPtaStatus ||
      this.priceRange[0] > min ||
      this.priceRange[1] < max
    );
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedBrandId = null;
    this.selectedConditions = [];
    this.selectedStorageValues = [];
    this.selectedPtaStatus = null;
    this.priceRange = [this.priceMin(), this.priceMax()];
    this.first = 0;
    this.updateUrlParams();
    this.loadProducts();
  }

  removeFilter(filter: ActiveFilter): void {
    switch (filter.type) {
      case 'search':
        this.searchQuery = '';
        break;
      case 'brand':
        this.selectedBrandId = null;
        break;
      case 'condition':
        this.selectedConditions = this.selectedConditions.filter(c => c !== filter.value);
        break;
      case 'storage':
        this.selectedStorageValues = this.selectedStorageValues.filter(s => s !== filter.value);
        break;
      case 'price':
        this.priceRange = [this.priceMin(), this.priceMax()];
        break;
      case 'pta':
        this.selectedPtaStatus = null;
        break;
    }

    this.first = 0;
    this.updateUrlParams();
    this.loadProducts();
  }

  onFilterChange(): void {
    if (this.isInitializing) return;
    this.first = 0;
    this.updateUrlParams();
    this.loadProducts();
  }

  onPriceRangeChange(): void {
    if (this.isInitializing) return;
    this.first = 0;
    this.updateUrlParams();
    this.loadProducts();
  }

  onSortChange(): void {
    if (this.isInitializing) return;
    this.first = 0;
    this.updateUrlParams();
    this.loadProducts();
  }

  onPageChange(event: PaginatorState): void {
    this.first = event.first ?? 0;
    this.pageSize = event.rows ?? 12;
    this.updateUrlParams();
    this.loadProducts();
    // Scroll to top of catalog for better UX when navigating pages
    this.scrollToTop();
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  viewProduct(product: Product): void {
    this.router.navigate(['/product', product.id]);
  }

  isProductSelected(productId: string): boolean {
    return this.comparisonService.isSelected(productId);
  }

  toggleCompare(event: Event, product: Product): void {
    event.stopPropagation();
    const result = this.comparisonService.toggle(product);
    if (result === 'full') {
      this.toastService.warn('Comparison Limit', 'You can compare up to 3 products at a time. Remove a product to add another.');
    }
  }

  onCompareToggled(event: { product: Product; result: 'added' | 'removed' | 'full' }): void {
    if (event.result === 'full') {
      this.toastService.warn('Comparison Limit', 'You can compare up to 3 products at a time. Remove a product to add another.');
    }
  }

  removeFromCompare(productId: string): void {
    this.comparisonService.remove(productId);
  }

  clearComparison(): void {
    this.comparisonService.clear();
  }

  goToComparison(): void {
    const ids = this.comparisonService.getProductIds();
    this.router.navigate(['/compare'], { queryParams: { ids: ids.join(',') } });
  }

  getCardOptimizedUrl(url: string): string {
    return this.imageOptimization.getCardImageUrl(url);
  }

  getListOptimizedUrl(url: string): string {
    return this.imageOptimization.getListImageUrl(url);
  }

  getListSrcSet(url: string): string {
    return this.imageOptimization.getListSrcSet(url);
  }

  getConditionLabel(condition: ProductCondition): string {
    return ProductConditionLabels[condition];
  }

  getConditionSeverity(condition: ProductCondition): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (condition) {
      case ProductCondition.NEW:
        return 'success';
      case ProductCondition.OPEN_BOX:
        return 'info';
      case ProductCondition.USED:
        return 'warn';
      default:
        return 'secondary';
    }
  }

  // Handle image loading errors - show default placeholder (only once)
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Use a default phone image from Unsplash for all phones
    if (!img.src.includes('photo-1695048133142-1a20484d2569')) {
      img.src = 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=400&fit=crop';
    }
  }

  // Section switching for AC_REDESIGN_004
  switchSection(section: CatalogSection): void {
    if (this.currentSection === section) return;

    this.currentSection = section;
    this.first = 0;

    // Update sort based on section
    if (section === 'new-arrivals') {
      this.selectedSort = this.sortOptions[0]; // Newest First
    }

    this.updateUrlParams();
    this.loadProducts();
  }

  // Get section icon background color
  getSectionIconBg(): string {
    switch (this.currentSection) {
      case 'new-arrivals':
        return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
      default:
        return 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)';
    }
  }
}
