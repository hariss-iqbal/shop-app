import { Component, OnInit, OnDestroy, signal, computed, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ProductService, ModelVariant, ModelCatalogItem } from '../../../core/services/product.service';
import { ProductViewTrackerService } from '../../../core/services/product-view-tracker.service';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SeoService } from '../../../shared/services/seo.service';
import { JsonLdService } from '../../../shared/services/json-ld.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ShopDetailsService } from '../../../core/services/shop-details.service';
import { ProductDetail, Product } from '../../../models/product.model';
import { ProductCondition, ProductConditionLabels, ProductStatus, PtaStatus, PtaStatusLabels } from '../../../enums';

interface GalleryImage {
  detailUrl: string;
  detailSrcSet: string;
  thumbUrl: string;
  originalUrl: string;
  alt: string;
}

interface StaticReview {
  initials: string;
  name: string;
  date: string;
  city: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
}

interface RatingBar {
  stars: number;
  percent: number;
}

interface BoxItem {
  text: string;
  included: boolean;
}

interface ColorVariant {
  color: string;
  productId: string;
  price: number;
  cssColor: string;
}

interface StorageVariant {
  storageGb: number;
  productId: string;
  price: number;
  available: boolean;
}

interface ColorGroup {
  color: string;
  cssColor: string;
  variants: ModelVariant[];
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private productService: ProductService,
    private tracker: ProductViewTrackerService,
    private imageOptimization: ImageOptimizationService,
    private toastService: ToastService,
    private seoService: SeoService,
    private jsonLdService: JsonLdService,
    private currencyService: CurrencyService,
    private shopDetailsService: ShopDetailsService
  ) {}

  /* ── Data signals ── */
  product = signal<ProductDetail | null>(null);
  variants = signal<Product[]>([]);
  modelVariants = signal<ModelVariant[]>([]);
  selectedColor = signal<string | null>(null);
  selectedStorageGb = signal<number | null>(null);
  relatedProducts = signal<Product[]>([]);
  loading = signal(true);
  notFound = signal(false);
  private routeSub!: Subscription;

  /* ── Gallery ── */
  galleryImages: GalleryImage[] = [];
  activeIndex = signal(0);
  fullscreen = signal(false);
  imageLoading = signal(false);
  showLoader = signal(false);
  slideDirection = signal<'left' | 'right' | ''>('');
  private loadedImages = new Set<number>();

  /* ── UI state ── */
  scrollPosition = signal(0);
  quantity = signal(1);
  activeTab = signal<string>('specs');
  searchOpen = signal(false);
  searchQuery = signal('');
  searchResults = signal<ModelCatalogItem[]>([]);
  searchLoading = signal(false);
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  relatedLoading = signal(false);
  variantOverlayOpen = signal(false);

  /* ── Swipe tracking ── */
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  swiping = false;
  swipeOffset = 0;
  private readonly SWIPE_THRESHOLD = 40;

  /* ── Shop details ── */
  shopPhoneDisplay = this.shopDetailsService.phoneDisplay;
  shopPhoneLink = this.shopDetailsService.phoneLink;
  shopEmail = this.shopDetailsService.email;

  get whatsappNumber(): string {
    return this.shopDetailsService.whatsappNumber();
  }
  get shopPhoneNumber(): string {
    return this.shopDetailsService.phoneLink() || '';
  }

  /* ── Static reviews (hardcoded until reviews backend exists) ── */
  reviews: StaticReview[] = [
    { initials: 'AR', name: 'Ahmed Rafiq', date: '2 weeks ago', city: 'Karachi', rating: 5, title: 'Smoothest phone purchase in Pakistan', body: 'Ordered Sunday, delivered Monday morning. Box was sealed, PTA approved, battery 100%. They even sent a video of my specific unit before dispatch. This is how it should be done.', verified: true },
    { initials: 'SM', name: 'Sana Malik', date: '1 month ago', city: 'Islamabad', rating: 5, title: 'Camera is a proper upgrade', body: 'Switched from an iPhone 13. The camera is sharper in low light and the Magic Eraser is genuinely useful. Condition grading was accurate — zero marks.', verified: true },
    { initials: 'HK', name: 'Hassan Khan', date: '2 months ago', city: 'Lahore', rating: 5, title: 'Trade-in process was seamless', body: 'Gave my old phone, paid the difference on this one. Quote was fair, pickup was on time. Been using it 2 months, no issues.', verified: true },
    { initials: 'FN', name: 'Fatima N.', date: '3 months ago', city: 'Peshawar', rating: 4, title: 'Great phone, delivery took 4 days', body: 'Phone itself is perfect. Delivery was slightly delayed but they stayed in touch via WhatsApp. Would still recommend.', verified: true }
  ];

  ratingDistribution: RatingBar[] = [
    { stars: 5, percent: 88 },
    { stars: 4, percent: 9 },
    { stars: 3, percent: 2 },
    { stars: 2, percent: 1 },
    { stars: 1, percent: 0 }
  ];

  boxContents: BoxItem[] = [
    { text: 'Phone unit', included: true },
    { text: 'USB-C cable', included: true },
    { text: 'SIM ejector tool', included: true },
    { text: 'Quick-start guide & warranty card', included: true },
    { text: 'Free tempered glass (pre-applied)', included: true },
    { text: 'Smart Cell slim case (bonus)', included: true },
    { text: 'Charging brick (varies by brand)', included: false }
  ];

  /* ── Computed ── */
  showStickyBar = computed(() => this.scrollPosition() > 400 && !!this.product());

  formattedPrice = computed(() => {
    const p = this.product();
    return p ? this.currencyService.format(p.sellingPrice) : '';
  });

  hasDiscount = computed(() => {
    const p = this.product();
    return p ? p.profitMargin >= 20 : false;
  });

  originalPrice = computed(() => {
    const p = this.product();
    if (!p) return 0;
    return Math.round(p.sellingPrice * (1 + Math.round(p.profitMargin) / 100));
  });

  discountAmount = computed(() => this.originalPrice() - (this.product()?.sellingPrice ?? 0));

  monthlyInstallment = computed(() => {
    const p = this.product();
    return p ? Math.round(p.sellingPrice / 12) : 0;
  });

  conditionLabel = computed(() => {
    const p = this.product();
    return p ? ProductConditionLabels[p.condition] : '';
  });

  conditionClass = computed(() => {
    const p = this.product();
    if (!p) return '';
    if (p.condition === ProductCondition.NEW) return 'new';
    if (p.condition === ProductCondition.USED) return 'used';
    return 'open';
  });

  ptaClass = computed(() => {
    const p = this.product();
    if (!p || !p.ptaStatus) return '';
    return p.ptaStatus === PtaStatus.PTA_APPROVED ? 'pta' : 'npta';
  });

  ptaLabel = computed(() => {
    const p = this.product();
    if (!p || !p.ptaStatus) return '';
    return PtaStatusLabels[p.ptaStatus] ?? '';
  });

  showBattery = computed(() => {
    const p = this.product();
    if (!p) return false;
    return (p.condition === ProductCondition.USED || p.condition === ProductCondition.OPEN_BOX) && p.batteryHealth !== null;
  });

  sku = computed(() => {
    const p = this.product();
    if (!p) return '';
    const parts: string[] = [];
    if (p.brandName) parts.push(p.brandName.substring(0, 2).toUpperCase());
    if (p.model) parts.push(p.model.replace(/\s+/g, '').substring(0, 6).toUpperCase());
    if (p.storageGb) parts.push(`${p.storageGb}`);
    if (p.color) parts.push(p.color.substring(0, 3).toUpperCase());
    return parts.join('-');
  });

  conditionGradeBars = computed(() => {
    const p = this.product();
    if (!p) return [];
    const isNew = p.condition === ProductCondition.NEW;
    const rating = p.conditionRating ?? 10;
    const scaled = isNew ? 10 : Math.min(10, Math.round(rating));
    const batteryPercent = p.batteryHealth ?? (isNew ? 100 : 85);
    return [
      { label: 'Body & frame', score: isNew ? '10/10' : `${scaled}/10`, percent: scaled * 10 },
      { label: 'Display', score: isNew ? '10/10' : `${scaled}/10`, percent: scaled * 10 },
      { label: 'Battery health', score: `${batteryPercent}%`, percent: batteryPercent },
      { label: 'Cameras', score: isNew ? '10/10' : `${scaled}/10`, percent: scaled * 10 },
      { label: 'Speakers & mics', score: 'Pass', percent: 100 },
      { label: 'IMEI lock', score: 'Clean', percent: 100 }
    ];
  });

  colorVariants = computed<ColorVariant[]>(() => {
    const p = this.product();
    if (!p) return [];
    const mv = this.modelVariants();
    if (mv.length > 0) {
      const seen = new Map<string, ColorVariant>();
      for (const v of mv) {
        if (!v.availableColors || v.availableColors.length === 0) continue;
        for (const c of v.availableColors) {
          const key = c.toLowerCase();
          if (!seen.has(key)) {
            seen.set(key, {
              color: c,
              productId: v.id,
              price: v.sellingPrice,
              cssColor: this.cssColorFromName(c)
            });
          }
        }
      }
      return Array.from(seen.values());
    }
    const all = [p, ...this.variants()];
    const seen = new Map<string, ColorVariant>();
    for (const v of all) {
      if (!v.color) continue;
      const key = v.color.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, { color: v.color, productId: v.id, price: v.sellingPrice, cssColor: this.getProductColor(v) });
      }
    }
    return Array.from(seen.values());
  });

  colorGroups = computed<ColorGroup[]>(() => {
    const mv = this.modelVariants();
    if (mv.length === 0) return [];
    const groups = new Map<string, ColorGroup>();
    for (const v of mv) {
      if (!v.availableColors || v.availableColors.length === 0) continue;
      for (const c of v.availableColors) {
        const key = c.toLowerCase();
        if (!groups.has(key)) {
          groups.set(key, {
            color: c,
            cssColor: this.cssColorFromName(c),
            variants: []
          });
        }
        groups.get(key)!.variants.push(v);
      }
    }
    return Array.from(groups.values());
  });

  storageVariants = computed<StorageVariant[]>(() => {
    const p = this.product();
    if (!p) return [];
    const mv = this.modelVariants();
    const selColor = this.selectedColor();

    if (mv.length > 0) {
      // Gather ALL storages across all colors
      const seen = new Map<number, { productId: string; price: number }>();
      for (const v of mv) {
        if (!v.storageGb) continue;
        if (!seen.has(v.storageGb)) {
          seen.set(v.storageGb, { productId: v.id, price: v.sellingPrice });
        }
      }
      // Determine which storages are available for selected color
      const colorStorages = new Set<number>();
      if (selColor) {
        for (const v of mv) {
          const hasColor = v.availableColors?.some(c => c.toLowerCase() === selColor.toLowerCase());
          if (hasColor && v.storageGb) {
            colorStorages.add(v.storageGb);
          }
        }
      }
      return Array.from(seen.entries())
        .map(([gb, data]) => ({
          storageGb: gb,
          productId: data.productId,
          price: data.price,
          available: !selColor || colorStorages.has(gb)
        }))
        .sort((a, b) => a.storageGb - b.storageGb);
    }
    const all = [p, ...this.variants()];
    const seen = new Map<number, StorageVariant>();
    for (const v of all) {
      if (!v.storageGb) continue;
      if (!seen.has(v.storageGb)) {
        seen.set(v.storageGb, { storageGb: v.storageGb, productId: v.id, price: v.sellingPrice, available: true });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.storageGb - b.storageGb);
  });

  /* ── Lifecycle ── */
  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => this.performSearch(query));

    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadById(id);
      } else {
        this.notFound.set(true);
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.routeSub?.unsubscribe();
    this.jsonLdService.removeStructuredData();
    document.body.style.overflow = '';
  }

  /* ── Data loading ── */
  private async loadById(id: string): Promise<void> {
    this.loading.set(true);
    this.notFound.set(false);
    this.product.set(null);
    this.modelVariants.set([]);
    this.selectedColor.set(null);

    try {
      // Try loading as product ID first
      let detail = await this.productService.getAvailableProductDetail(id);
      if (detail) {
        await this.onProductLoaded(detail);
        return;
      }

      // If not found as product, try as model ID
      detail = await this.productService.getProductByModel(id);
      if (detail) {
        await this.onProductLoaded(detail, id);
        return;
      }

      this.notFound.set(true);
      this.loading.set(false);
    } catch (err) {
      this.handleError(err);
    }
  }

  private handleError(err: unknown): void {
    const message = err instanceof Error ? err.message : 'Failed to load product details';
    this.toastService.error('Error', message);
    this.notFound.set(true);
    this.loading.set(false);
  }

  private async onProductLoaded(detail: ProductDetail, modelId?: string): Promise<void> {
    this.product.set(detail);
    this.selectedColor.set(detail.color?.toLowerCase() ?? null);
    this.selectedStorageGb.set(detail.storageGb ?? null);
    this.buildGalleryImages(detail);
    this.updateSeoTags(detail);
    this.jsonLdService.setProductStructuredData(detail);
    this.tracker.trackView(detail.id);

    const mid = modelId || detail.modelId;
    if (mid) {
      await this.loadModelVariants(mid);
    } else {
      this.loadVariants();
    }
    this.loadRelatedProducts();
    this.loading.set(false);
  }

  private async loadModelVariants(modelId: string): Promise<void> {
    try {
      const variants = await this.productService.getModelVariants(modelId);
      this.modelVariants.set(variants);
      // Also load legacy variants for compatibility
      const p = this.product();
      if (p) {
        const result = await this.productService.getCatalogProducts(
          { first: 0, rows: 20, sortField: 'selling_price', sortOrder: 1 },
          { status: ProductStatus.AVAILABLE, modelId }
        );
        this.variants.set(result.data.filter(r => r.id !== p.id));
      }
    } catch {
      this.modelVariants.set([]);
      this.variants.set([]);
    }
  }

  private async loadVariants(): Promise<void> {
    const p = this.product();
    if (!p) return;
    try {
      const filter: any = { status: ProductStatus.AVAILABLE };
      if (p.modelId) filter.modelId = p.modelId;
      else if (p.model) filter.model = p.model;
      else { this.variants.set([]); return; }
      const result = await this.productService.getCatalogProducts(
        { first: 0, rows: 20, sortField: 'selling_price', sortOrder: 1 },
        filter
      );
      this.variants.set(result.data.filter(r => r.id !== p.id));
    } catch {
      this.variants.set([]);
    }
  }

  selectVariant(productId: string): void {
    if (productId === this.product()?.id) return;
    this.switchToVariant(productId);
  }

  selectColor(color: string): void {
    this.selectedColor.set(color.toLowerCase());
    this.selectedStorageGb.set(null);
  }

  selectStorage(sv: StorageVariant): void {
    if (!sv.available) return;
    // Find the variant matching selected color + this storage
    const selColor = this.selectedColor();
    const mv = this.modelVariants();
    const match = mv.find(v =>
      v.storageGb === sv.storageGb &&
      (!selColor || v.availableColors?.some(c => c.toLowerCase() === selColor.toLowerCase()))
    );
    const productId = match?.id ?? sv.productId;
    this.selectedStorageGb.set(sv.storageGb);
    if (productId !== this.product()?.id) {
      this.switchToVariant(productId);
    }
  }

  private async switchToVariant(productId: string): Promise<void> {
    try {
      const detail = await this.productService.getAvailableProductDetail(productId);
      if (detail) {
        this.product.set(detail);
        this.buildGalleryImages(detail);
        this.updateSeoTags(detail);
        this.jsonLdService.setProductStructuredData(detail);
        this.location.replaceState(`/product/${productId}`);
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
    } catch {
      // Stay on current variant if switch fails
    }
  }

  cssColorFromName(color: string): string {
    const c = color.toLowerCase();
    if (/black|obsidian|midnight|space.?gray|carbon/i.test(c)) return '#1F1F23';
    if (/white|snow|starlight|porcelain|silver|shade/i.test(c)) return '#E8E6E1';
    if (/sorta.?seafoam|seafoam/i.test(c)) return '#93DFD0';
    if (/sage/i.test(c)) return '#9CAF88';
    if (/sea$/i.test(c)) return '#7FB5B0';
    if (/bay/i.test(c)) return '#6B9EAF';
    if (/moonstone/i.test(c)) return '#B8B8CC';
    if (/blue|ocean|navy|sky|cobalt/i.test(c)) return '#4A7FB5';
    if (/green|mint|alpine|forest|aloe/i.test(c)) return '#5F9E6F';
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

  private async loadRelatedProducts(): Promise<void> {
    const p = this.product();
    if (!p) return;
    this.relatedLoading.set(true);
    try {
      const result = await this.productService.getCatalogProducts(
        { first: 0, rows: 50, sortField: 'selling_price', sortOrder: 1 },
        { status: ProductStatus.AVAILABLE, brandIds: [p.brandId] }
      );
      const seen = new Set<string>();
      const filtered = result.data
        .filter(r => {
          if (r.id === p.id) return false;
          const key = r.modelId || r.model;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 8);
      this.relatedProducts.set(filtered);
    } catch {
      // Related products are non-critical
    } finally {
      this.relatedLoading.set(false);
    }
  }

  private buildGalleryImages(detail: ProductDetail): void {
    this.loadedImages.clear();
    this.galleryImages = detail.images.map(img => ({
      detailUrl: this.imageOptimization.getDetailImageUrl(img.imageUrl),
      detailSrcSet: this.imageOptimization.getDetailSrcSet(img.imageUrl),
      thumbUrl: this.imageOptimization.getThumbnailUrl(img.imageUrl),
      originalUrl: img.imageUrl,
      alt: `${detail.brandName} ${detail.model}`
    }));
    this.loadedImages.add(0);
    this.activeIndex.set(0);
  }

  private updateSeoTags(product: ProductDetail): void {
    const modelDisplay = product.modelName || product.model;
    const productName = `${product.brandName} ${modelDisplay}`;
    const conditionLabel = ProductConditionLabels[product.condition];
    const price = this.currencyService.format(product.sellingPrice);
    const storagePart = product.storageGb ? ` ${product.storageGb}GB` : '';
    const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
    this.seoService.updateMetaTags({
      title: `${productName}${storagePart}`,
      description: `Buy ${productName}${storagePart} - ${conditionLabel} condition for ${price}. Browse specs, images, and inquire via WhatsApp.`,
      url: `/product/${product.id}`,
      image: primaryImage?.imageUrl || product.primaryImageUrl,
      type: 'product'
    });
  }

  /* ── Gallery ── */
  selectImage(index: number): void {
    if (index === this.activeIndex()) return;
    this.slideDirection.set(index > this.activeIndex() ? 'left' : 'right');
    this.navigateTo(index);
  }

  prevImage(): void {
    this.slideDirection.set('right');
    const imgs = this.galleryImages;
    const index = this.activeIndex() > 0 ? this.activeIndex() - 1 : imgs.length - 1;
    this.navigateTo(index);
  }

  nextImage(): void {
    this.slideDirection.set('left');
    const imgs = this.galleryImages;
    const index = this.activeIndex() < imgs.length - 1 ? this.activeIndex() + 1 : 0;
    this.navigateTo(index);
  }

  onImageLoad(): void {
    this.loadedImages.add(this.activeIndex());
    this.imageLoading.set(false);
    this.showLoader.set(false);
    setTimeout(() => this.slideDirection.set(''), 300);
  }

  private navigateTo(index: number): void {
    this.imageLoading.set(true);
    this.showLoader.set(!this.loadedImages.has(index));
    this.activeIndex.set(index);
    requestAnimationFrame(() => {
      const container = document.querySelector('.gallery-thumbs');
      const active = container?.querySelector('.gthumb.on');
      if (active && container) active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  }

  openFullscreen(): void {
    this.fullscreen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeFullscreen(): void {
    this.fullscreen.set(false);
    document.body.style.overflow = '';
  }

  getSwipeTransform(): string {
    return this.swiping && this.swipeOffset !== 0 ? `translateX(${this.swipeOffset}px)` : '';
  }

  /* ── Touch ── */
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchStartTime = Date.now();
    this.swiping = false;
    this.swipeOffset = 0;
  }

  onTouchMove(event: TouchEvent): void {
    if (this.galleryImages.length <= 1) return;
    const dx = event.touches[0].clientX - this.touchStartX;
    const dy = event.touches[0].clientY - this.touchStartY;
    if (!this.swiping && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) this.swiping = true;
    if (this.swiping) { event.preventDefault(); this.swipeOffset = dx; }
  }

  onTouchEnd(): void {
    if (this.galleryImages.length <= 1 || !this.swiping) { this.swipeOffset = 0; this.swiping = false; return; }
    const velocity = Math.abs(this.swipeOffset) / (Date.now() - this.touchStartTime);
    if (Math.abs(this.swipeOffset) > this.SWIPE_THRESHOLD || velocity > 0.5) {
      this.swipeOffset < 0 ? this.nextImage() : this.prevImage();
    }
    this.swipeOffset = 0;
    this.swiping = false;
  }

  /* ── Keyboard ── */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.fullscreen()) {
      if (event.key === 'Escape') this.closeFullscreen();
      else if (event.key === 'ArrowLeft') this.prevImage();
      else if (event.key === 'ArrowRight') this.nextImage();
    }
  }

  /* ── Scroll ── */
  @HostListener('window:scroll')
  onScroll(): void {
    this.scrollPosition.set(window.scrollY);
  }

  /* ── Commerce ── */
  openWhatsAppInquiry(): void {
    const p = this.product();
    if (!p) return;
    const parts = [`Hi! I'm interested in the ${p.brandName} ${p.model}`];
    if (p.storageGb) parts[0] += ` (${p.storageGb}GB)`;
    parts.push('', `Price: ${this.currencyService.format(p.sellingPrice)}`, '', 'Could you please provide more details about this product?');
    const msg = encodeURIComponent(parts.join('\n'));
    const url = this.whatsappNumber ? `https://wa.me/${this.whatsappNumber}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  }

  callToReserve(): void {
    window.location.href = `tel:${this.shopPhoneNumber}`;
  }

  incrementQty(): void { this.quantity.update(v => v + 1); }
  decrementQty(): void { this.quantity.update(v => Math.max(1, v - 1)); }
  setTab(tab: string): void { this.activeTab.set(tab); }

  openSearch(): void {
    this.searchOpen.set(true);
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 50);
  }
  closeSearch(): void {
    this.searchOpen.set(false);
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.searchLoading.set(false);
  }
  onSearchInput(query: string): void {
    this.searchQuery.set(query);
    if (query.trim().length < 2) {
      this.searchResults.set([]);
      this.searchLoading.set(false);
      return;
    }
    this.searchLoading.set(true);
    this.searchSubject.next(query.trim());
  }
  private async performSearch(query: string): Promise<void> {
    try {
      const resp = await this.productService.getModelCatalog(
        { first: 0, rows: 3 },
        { search: query }
      );
      this.searchResults.set(resp.data);
    } catch {
      this.searchResults.set([]);
    } finally {
      this.searchLoading.set(false);
    }
  }
  submitSearch(): void {
    const q = this.searchQuery().trim();
    if (q) {
      this.router.navigate(['/catalog'], { queryParams: { search: q } });
      this.closeSearch();
    }
  }
  goToResult(item: ModelCatalogItem): void {
    this.router.navigate(['/catalog'], { queryParams: { search: item.modelName } });
    this.closeSearch();
  }

  /* ── Helpers ── */
  fmt(n: number): string { return n.toLocaleString('en-PK'); }

  getCondLabel(cond: ProductCondition): string {
    if (cond === ProductCondition.NEW) return 'New \u00B7 Sealed';
    if (cond === ProductCondition.USED) return 'Pre-owned';
    return 'Open box';
  }

  getCondClass(cond: ProductCondition): string {
    if (cond === ProductCondition.NEW) return 'new';
    if (cond === ProductCondition.USED) return 'used';
    return 'open';
  }

  getPtaClass(pta: PtaStatus | null): string {
    if (!pta) return '';
    return pta === PtaStatus.PTA_APPROVED ? 'pta' : 'npta';
  }

  gradientId(id: string): string { return `pg${id.replace(/[^a-z0-9]/gi, '')}`; }
  gradientUrl(id: string): string { return `url(#${this.gradientId(id)})`; }

  getProductColor(product: Product): string {
    const c = product.color?.toLowerCase() ?? '';
    if (/black|obsidian|midnight|space.?gray|carbon/i.test(c)) return '#1F1F23';
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
    return 'var(--accent)';
  }

  getProductSpecs(product: Product): string[] {
    const specs: string[] = [];
    if (product.storageGb) specs.push(`${product.storageGb} GB`);
    if (product.ramGb) specs.push(`${product.ramGb} GB RAM`);
    if (product.color) specs.push(product.color);
    if (product.batteryHealth && product.condition !== ProductCondition.NEW) specs.push(`${product.batteryHealth}%`);
    return specs;
  }

  viewProduct(product: Product): void {
    this.router.navigate(['/product', product.id]);
  }

  goBack(): void {
    if (window.history.length > 1) { this.location.back(); }
    else { this.router.navigate(['/catalog']); }
  }

  toggleVariantOverlay(): void {
    this.variantOverlayOpen.update(v => !v);
  }

  closeVariantOverlay(): void {
    this.variantOverlayOpen.set(false);
  }

  getStarsArray(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i < rating ? 1 : 0);
  }
}
