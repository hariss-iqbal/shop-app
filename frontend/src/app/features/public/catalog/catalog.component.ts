import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
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
import { RatingModule } from 'primeng/rating';
import { PhoneService, CatalogPaginationParams } from '../../../core/services/phone.service';
import { BrandService } from '../../../core/services/brand.service';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SeoService } from '../../../shared/services/seo.service';
import { PhoneComparisonService } from '../../../shared/services/phone-comparison.service';
import { PhoneCardKeyboardDirective } from '../../../shared/directives/phone-card-keyboard.directive';
import { BlurUpImageDirective } from '../../../shared/directives/blur-up-image.directive';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { Phone } from '../../../models/phone.model';
import { Brand } from '../../../models/brand.model';
import { PhoneStatus, PhoneCondition, PhoneConditionLabels, PtaStatus, PtaStatusLabels } from '../../../enums';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';

type ViewMode = 'grid' | 'list';
type CatalogSection = 'all' | 'new-arrivals' | 'top-sellers';

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
  value: PhoneCondition;
}

interface StorageOption {
  label: string;
  value: number;
}

interface ActiveFilter {
  type: 'brand' | 'condition' | 'storage' | 'price' | 'search' | 'pta';
  label: string;
  value: string | number | PhoneCondition;
}

interface PhoneWithExtras extends Phone {
  isNewArrival: boolean;
  isTopSeller: boolean;
  hasDiscount: boolean;
  discountPercent: number;
  originalPrice: number | null;
  rating: number;
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
    RatingModule,
    PhoneCardKeyboardDirective,
    BlurUpImageDirective,
    AppCurrencyPipe,
    ProductCardComponent
  ],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss']
})
export class CatalogComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private phoneService = inject(PhoneService);
  private brandService = inject(BrandService);
  private imageOptimization = inject(ImageOptimizationService);
  private toastService = inject(ToastService);
  private seoService = inject(SeoService);
  comparisonService = inject(PhoneComparisonService);

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  private isInitializing = true;
  private isNavigatingFromUrl = false;

  phones = signal<Phone[]>([]);
  brands = signal<Brand[]>([]);
  loading = signal(true);
  totalRecords = signal(0);
  availableStorageOptions = signal<number[]>([]);
  priceMin = signal(0);
  priceMax = signal(1000);

  searchQuery = '';
  selectedBrandId: string | null = null;
  selectedConditions: PhoneCondition[] = [];
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
      label: 'All Phones',
      value: 'all',
      icon: 'pi pi-th-large',
      description: 'Browse our complete collection of smartphones'
    },
    {
      label: 'New Arrivals',
      value: 'new-arrivals',
      icon: 'pi pi-sparkles',
      description: 'Discover our latest additions - freshly stocked phones just for you'
    },
    {
      label: 'Top Sellers',
      value: 'top-sellers',
      icon: 'pi pi-star',
      description: 'Our most loved picks by customers - best value phones in stock'
    }
  ];

  // Computed property for section info
  currentSectionInfo = computed(() => {
    return this.sectionOptions.find(s => s.value === this.currentSection) || null;
  });

  // Computed extras for list view (grid view uses ProductCardComponent)
  phonesWithExtras = computed((): PhoneWithExtras[] => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return this.phones().map((phone, index) => {
      const createdAt = new Date(phone.createdAt);
      const isNewArrival = createdAt >= sevenDaysAgo;
      const hasDiscount = phone.profitMargin >= 20;
      const discountPercent = hasDiscount ? Math.round(phone.profitMargin) : 0;
      const originalPrice = hasDiscount
        ? Math.round(phone.sellingPrice * (1 + discountPercent / 100))
        : null;

      let rating = 4;
      if (phone.condition === PhoneCondition.NEW) {
        rating = 5;
      } else if (phone.condition === PhoneCondition.OPEN_BOX) {
        rating = 4;
      } else {
        rating = phone.batteryHealth ? Math.min(5, Math.max(3, Math.round(phone.batteryHealth / 25))) : 3;
      }

      const isTopSeller = !isNewArrival && !hasDiscount && index < 12 && index % 3 === 0;

      return { ...phone, isNewArrival, isTopSeller, hasDiscount, discountPercent, originalPrice, rating };
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
    { label: PhoneConditionLabels[PhoneCondition.NEW], value: PhoneCondition.NEW },
    { label: PhoneConditionLabels[PhoneCondition.USED], value: PhoneCondition.USED },
    { label: PhoneConditionLabels[PhoneCondition.OPEN_BOX], value: PhoneCondition.OPEN_BOX }
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
        label: `Condition: ${PhoneConditionLabels[condition]}`,
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
        label: `Price: $${this.priceRange[0]} - $${this.priceRange[1]}`,
        value: `${this.priceRange[0]}-${this.priceRange[1]}`
      });
    }

    return filters;
  });

  constructor() {
    this.selectedSort = this.sortOptions[0];
  }

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Phone Catalog',
      description: 'Browse our wide selection of new, used, and open box phones at competitive prices. Filter by brand, condition, storage, and price range.',
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
        this.loadPhones();
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
        this.loadPhones();
      });
  }

  private async loadInitialData(): Promise<void> {
    await Promise.all([
      this.loadBrands(),
      this.loadFilterOptions()
    ]);

    this.applyParams(this.route.snapshot.queryParams);
    this.isInitializing = false;
    await this.loadPhones();
  }

  private applyParams(params: Params): void {
    // Apply section filter
    const section = params['section'] as CatalogSection;
    if (section && ['all', 'new-arrivals', 'top-sellers'].includes(section)) {
      this.currentSection = section;
    } else {
      this.currentSection = 'all';
    }

    this.searchQuery = params['search'] || '';

    this.selectedBrandId = params['brand'] || null;

    if (params['condition']) {
      const conditions = params['condition'].split(',') as PhoneCondition[];
      this.selectedConditions = conditions.filter(c =>
        Object.values(PhoneCondition).includes(c)
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
        this.phoneService.getDistinctStorageOptions(),
        this.phoneService.getPriceRange()
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

  async loadPhones(): Promise<void> {
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

      const result = await this.phoneService.getCatalogPhones(
        paginationParams,
        {
          status: PhoneStatus.AVAILABLE,
          brandId: this.selectedBrandId || undefined,
          conditions: this.selectedConditions.length > 0 ? this.selectedConditions : undefined,
          storageGbOptions: this.selectedStorageValues.length > 0 ? this.selectedStorageValues : undefined,
          minPrice: hasPriceFilter ? this.priceRange[0] : undefined,
          maxPrice: hasPriceFilter ? this.priceRange[1] : undefined,
          search: this.searchQuery || undefined,
          ptaStatus: this.selectedPtaStatus || undefined
        }
      );

      let phones = result.data;
      let total = result.total;

      // Filter phones based on section (client-side for now)
      if (this.currentSection === 'new-arrivals') {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        phones = phones.filter(phone => new Date(phone.createdAt) >= sevenDaysAgo);
        total = phones.length;
      } else if (this.currentSection === 'top-sellers') {
        // Top sellers: phones with high profit margin (good deals)
        phones = phones.filter(phone => phone.profitMargin >= 15);
        total = phones.length;
      }

      this.phones.set(phones);
      this.totalRecords.set(total);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load phones';
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
    this.loadPhones();
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
    this.loadPhones();
  }

  onFilterChange(): void {
    if (this.isInitializing) return;
    this.first = 0;
    this.updateUrlParams();
    this.loadPhones();
  }

  onPriceRangeChange(): void {
    if (this.isInitializing) return;
    this.first = 0;
    this.updateUrlParams();
    this.loadPhones();
  }

  onSortChange(): void {
    if (this.isInitializing) return;
    this.first = 0;
    this.updateUrlParams();
    this.loadPhones();
  }

  onPageChange(event: PaginatorState): void {
    this.first = event.first ?? 0;
    this.pageSize = event.rows ?? 12;
    this.updateUrlParams();
    this.loadPhones();
    // Scroll to top of catalog for better UX when navigating pages
    this.scrollToTop();
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  viewPhone(phone: Phone): void {
    this.router.navigate(['/phone', phone.id]);
  }

  isPhoneSelected(phoneId: string): boolean {
    return this.comparisonService.isSelected(phoneId);
  }

  toggleCompare(event: Event, phone: Phone): void {
    event.stopPropagation();
    const result = this.comparisonService.toggle(phone);
    if (result === 'full') {
      this.toastService.warn('Comparison Limit', 'You can compare up to 3 phones at a time. Remove a phone to add another.');
    }
  }

  onCompareToggled(event: { phone: Phone; result: 'added' | 'removed' | 'full' }): void {
    if (event.result === 'full') {
      this.toastService.warn('Comparison Limit', 'You can compare up to 3 phones at a time. Remove a phone to add another.');
    }
  }

  removeFromCompare(phoneId: string): void {
    this.comparisonService.remove(phoneId);
  }

  clearComparison(): void {
    this.comparisonService.clear();
  }

  goToComparison(): void {
    const ids = this.comparisonService.getPhoneIds();
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

  getConditionLabel(condition: PhoneCondition): string {
    return PhoneConditionLabels[condition];
  }

  getConditionSeverity(condition: PhoneCondition): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (condition) {
      case PhoneCondition.NEW:
        return 'success';
      case PhoneCondition.OPEN_BOX:
        return 'info';
      case PhoneCondition.USED:
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
    } else if (section === 'top-sellers') {
      this.selectedSort = this.sortOptions[2]; // Price: Low to High (best value)
    }

    this.updateUrlParams();
    this.loadPhones();
  }

  // Get section icon background color
  getSectionIconBg(): string {
    switch (this.currentSection) {
      case 'new-arrivals':
        return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
      case 'top-sellers':
        return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      default:
        return 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)';
    }
  }
}
