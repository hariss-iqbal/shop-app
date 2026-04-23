import { Component, OnInit, OnDestroy, signal, computed, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { ProductService, ModelVariant } from '../../../core/services/product.service';
import { ProductViewTrackerService } from '../../../core/services/product-view-tracker.service';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SeoService } from '../../../shared/services/seo.service';
import { JsonLdService } from '../../../shared/services/json-ld.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { ShopDetailsService } from '../../../core/services/shop-details.service';
import { ProductDetail, Product } from '../../../models/product.model';
import { ProductCondition, ProductConditionLabels, PtaStatus, PtaStatusLabels } from '../../../enums';

interface GalleryImage {
  detailUrl: string;
  detailSrcSet: string;
  thumbUrl: string;
  originalUrl: string;
  alt: string;
}

interface VariantChip {
  id: string;
  slug: string;
  storageGb: number | null;
  availableColors: string[];
  condition: string;
  conditionLabel: string;
  ptaStatus: string | null;
  ptaLabel: string;
  ptaClass: string;
  sellingPrice: number;
  avgCostPrice: number;
  stockCount: number;
  isCurrent: boolean;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
  modelVariants = signal<ModelVariant[]>([]);
  loading = signal(true);
  notFound = signal(false);
  private routeSub!: Subscription;
  private destroy$ = new Subject<void>();

  /* ── Gallery ── */
  galleryImages: GalleryImage[] = [];
  activeIndex = signal(0);
  fullscreen = signal(false);
  imageLoading = signal(false);
  showLoader = signal(false);
  linkCopied = signal(false);
  private loadedImages = new Set<number>();

  /* ── UI state ── */
  scrollPosition = signal(0);

  /* ── Touch tracking ── */
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

  /* ── Computed ── */
  showStickyBar = computed(() => this.scrollPosition() > 400 && !!this.product());

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

  ptaLabel = computed(() => {
    const p = this.product();
    if (!p || !p.ptaStatus) return '';
    return PtaStatusLabels[p.ptaStatus] ?? '';
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

  conditionLabel = computed(() => {
    const p = this.product();
    return p ? ProductConditionLabels[p.condition] : '';
  });

  variantChips = computed<VariantChip[]>(() => {
    const p = this.product();
    const mv = this.modelVariants();
    if (!p || mv.length === 0) return [];

    const currentVariantId = p.variantId;

    return mv.map(v => ({
      id: v.id,
      slug: v.slug,
      storageGb: v.storageGb,
      availableColors: v.availableColors || [],
      condition: v.condition,
      conditionLabel: this.getCondLabel(v.condition as ProductCondition),
      ptaStatus: v.ptaStatus,
      ptaLabel: v.ptaStatus ? (PtaStatusLabels[v.ptaStatus as PtaStatus] ?? '') : '',
      ptaClass: v.ptaStatus === PtaStatus.PTA_APPROVED ? 'pta' : 'npta',
      sellingPrice: v.sellingPrice,
      avgCostPrice: v.avgCostPrice,
      stockCount: v.stockCount,
      isCurrent: v.id === currentVariantId
    }));
  });

  otherVariants = computed<VariantChip[]>(() => {
    return this.variantChips().filter(v => !v.isCurrent);
  });

  currentVariantChip = computed<VariantChip | undefined>(() => {
    return this.variantChips().find(c => c.isCurrent);
  });

  /* ── Lifecycle ── */
  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (!slug) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }
      // Skip if this URL change came from our own variant switch
      const p = this.product();
      if (p && !this.loading() && p.variantSlug === slug) {
        return;
      }
      this.loadBySlugOrId(slug);
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
  private readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  private async loadBySlugOrId(slugOrId: string): Promise<void> {
    this.loading.set(true);
    this.notFound.set(false);
    this.product.set(null);
    this.modelVariants.set([]);

    try {
      // Backward compat: old UUID URLs still work
      if (this.UUID_REGEX.test(slugOrId)) {
        await this.loadById(slugOrId);
        return;
      }

      await this.loadBySlug(slugOrId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load product details';
      this.toastService.error('Error', message);
      this.notFound.set(true);
      this.loading.set(false);
    }
  }

  private async loadBySlug(slug: string): Promise<void> {
    const colorQuery = this.route.snapshot.queryParamMap.get('color');

    const result = await this.productService.getVariantBySlug(slug);
    if (!result) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

    const { variant, images } = result;

    // Find an available product matching the color query param
    const product = await this.findAvailableProduct(variant.id, colorQuery);
    if (!product) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

    const primaryImage = images.find(img => img.isPrimary) || images[0];
    const detail: ProductDetail = {
      ...product,
      variantId: variant.id,
      variantSlug: variant.slug,
      images: images.map(img => ({
        id: img.id,
        imageUrl: img.imageUrl,
        isPrimary: img.isPrimary,
        displayOrder: img.displayOrder
      })),
      primaryImageUrl: primaryImage?.imageUrl || null,
      profitMargin: variant.avgCostPrice > 0
        ? Math.round(((variant.sellingPrice - variant.avgCostPrice) / variant.sellingPrice) * 10000) / 100
        : 0
    };

    await this.onProductLoaded(detail);
  }

  private async findAvailableProduct(variantId: string, preferredColor: string | null): Promise<Product | null> {
    return this.productService.getAvailableProductByVariant(variantId, preferredColor);
  }

  private async loadById(id: string): Promise<void> {
    this.loading.set(true);
    this.notFound.set(false);
    this.product.set(null);
    this.modelVariants.set([]);

    try {
      let detail = await this.productService.getAvailableProductDetail(id);
      if (detail) {
        await this.onProductLoaded(detail);
        return;
      }

      detail = await this.productService.getProductByModel(id);
      if (detail) {
        await this.onProductLoaded(detail, id);
        return;
      }

      this.notFound.set(true);
      this.loading.set(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load product details';
      this.toastService.error('Error', message);
      this.notFound.set(true);
      this.loading.set(false);
    }
  }

  private async onProductLoaded(detail: ProductDetail, modelId?: string): Promise<void> {
    this.product.set(detail);
    this.buildGalleryImages(detail);
    this.updateSeoTags(detail);
    this.jsonLdService.setProductStructuredData(detail);
    this.tracker.trackView(detail.id);

    const mid = modelId || detail.modelId;
    if (mid) {
      await this.loadModelVariants(mid);
    }
    this.loading.set(false);
  }

  private async loadModelVariants(modelId: string): Promise<void> {
    try {
      const variants = await this.productService.getModelVariants(modelId);
      this.modelVariants.set(variants);
    } catch {
      this.modelVariants.set([]);
    }
  }

  /* ── Variant navigation ── */
  viewVariant(variantId: string): void {
    const p = this.product();
    if (p && p.variantId === variantId) return;
    this.switchToVariant(variantId);
  }

  private async switchToVariant(variantId: string): Promise<void> {
    try {
      // Load variant details via RPC
      const variant = await this.productService.getVariantById(variantId);
      if (!variant) return;

      // Get variant images
      const images = await this.productService.getVariantImages(variantId);
      const primaryImage = images.find(img => img.isPrimary) || images[0];

      // Find an available product in this variant to set as current product
      const currentProduct = this.product();
      const updatedProduct: ProductDetail = {
        ...(currentProduct!),
        variantId: variant.id,
        variantSlug: variant.slug,
        storageGb: variant.storageGb,
        condition: variant.condition,
        ptaStatus: variant.ptaStatus as any,
        sellingPrice: variant.sellingPrice,
        costPrice: variant.avgCostPrice,
        images: images.map(img => ({
          id: img.id,
          imageUrl: img.imageUrl,
          isPrimary: img.isPrimary,
          displayOrder: img.displayOrder
        })),
        primaryImageUrl: primaryImage?.imageUrl || null,
        profitMargin: variant.avgCostPrice > 0
          ? Math.round(((variant.sellingPrice - variant.avgCostPrice) / variant.sellingPrice) * 10000) / 100
          : 0
      };

      this.product.set(updatedProduct);
      this.buildGalleryImages(updatedProduct);
      this.updateSeoTags(updatedProduct);
      const colorParam = currentProduct?.color ? `?color=${encodeURIComponent(currentProduct.color)}` : '';
      this.location.replaceState(`/product/${variant.slug}${colorParam}`);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    } catch {
      // Stay on current variant if switch fails
    }
  }

  /* ── Gallery ── */
  selectImage(index: number): void {
    if (index === this.activeIndex()) return;
    this.navigateTo(index);
  }

  prevImage(): void {
    const imgs = this.galleryImages;
    const index = this.activeIndex() > 0 ? this.activeIndex() - 1 : imgs.length - 1;
    this.navigateTo(index);
  }

  nextImage(): void {
    const imgs = this.galleryImages;
    const index = this.activeIndex() < imgs.length - 1 ? this.activeIndex() + 1 : 0;
    this.navigateTo(index);
  }

  onImageLoad(): void {
    this.loadedImages.add(this.activeIndex());
    this.imageLoading.set(false);
    this.showLoader.set(false);
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
    if (p.color) parts[0] += ` in ${p.color}`;
    parts.push('', `Price: ${this.currencyService.format(p.sellingPrice)}`, '', 'Could you please provide more details about this product?');
    const msg = encodeURIComponent(parts.join('\n'));
    const url = this.whatsappNumber ? `https://wa.me/${this.whatsappNumber}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  }

  /* ── Helpers ── */
  fmt(n: number): string { return n.toLocaleString('en-PK'); }

  getCondLabel(cond: ProductCondition): string {
    if (cond === ProductCondition.NEW) return 'New';
    if (cond === ProductCondition.USED) return 'Pre-owned · A';
    return 'Open box';
  }

  getCondClass(cond: ProductCondition): string {
    if (cond === ProductCondition.NEW) return 'new';
    if (cond === ProductCondition.USED) return 'used';
    return 'open';
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2000);
    });
  }

  getPtaClass(pta: PtaStatus | null): string {
    if (!pta) return '';
    return pta === PtaStatus.PTA_APPROVED ? 'pta' : 'npta';
  }

  getProductColor(product: Product): string {
    const c = (product.color ?? '').toLowerCase();
    return this.cssColorFromName(c);
  }

  cssColorFromName(color: string): string {
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
    const slugUrl = product.variantSlug
      ? `/product/${product.variantSlug}` + (product.color ? `?color=${encodeURIComponent(product.color)}` : '')
      : `/product/${product.id}`;
    this.seoService.updateMetaTags({
      title: `${productName}${storagePart}`,
      description: `Buy ${productName}${storagePart} - ${conditionLabel} condition for ${price}. Browse specs, images, and inquire via WhatsApp.`,
      url: slugUrl,
      image: primaryImage?.imageUrl || product.primaryImageUrl,
      type: 'product'
    });
  }

  goBack(): void {
    if (window.history.length > 1) { this.location.back(); }
    else { this.router.navigate(['/catalog']); }
  }

  scrollToVariants(): void {
    document.getElementById('other-variants')?.scrollIntoView({ behavior: 'smooth' });
  }
}
