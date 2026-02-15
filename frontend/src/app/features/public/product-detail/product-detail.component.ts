import { Component, OnInit, OnDestroy, signal, computed, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ProductService } from '../../../core/services/product.service';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SeoService } from '../../../shared/services/seo.service';
import { JsonLdService } from '../../../shared/services/json-ld.service';
import { ProductDetail } from '../../../models/product.model';
import { ProductCondition, ProductConditionLabels, ProductStatus, ProductStatusLabels } from '../../../enums';
import { ProductType, ProductTypeLabels } from '../../../enums/product-type.enum';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { CurrencyService } from '../../../core/services/currency.service';
import { ShopDetailsService } from '../../../core/services/shop-details.service';

interface GalleriaImage {
  itemImageSrc: string;
  itemSrcSet: string;
  thumbnailImageSrc: string;
  originalUrl: string;
  alt: string;
  isPrimary: boolean;
}

@Component({
  selector: 'app-product-detail',
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    ProgressBarModule,
    SkeletonModule,
    DividerModule,
    TooltipModule,
    AppCurrencyPipe
  ],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private productService: ProductService,
    private imageOptimization: ImageOptimizationService,
    private toastService: ToastService,
    private seoService: SeoService,
    private jsonLdService: JsonLdService,
    private currencyService: CurrencyService,
    private shopDetailsService: ShopDetailsService
  ) { }
  product = signal<ProductDetail | null>(null);
  loading = signal(true);
  notFound = signal(false);
  scrollPosition = signal(0);

  galleriaImages: GalleriaImage[] = [];
  activeIndex = 0;
  fullscreen = false;
  slideDirection: 'left' | 'right' | '' = '';
  imageLoading = false;
  // Track which images have been loaded
  private loadedImages = new Set<number>();
  showLoader = false;

  // Swipe tracking
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  swiping = false;
  private swipeOffset = 0;
  private readonly SWIPE_THRESHOLD = 40;

  get currentImage(): GalleriaImage | null {
    return this.galleriaImages[this.activeIndex] ?? null;
  }

  get imageCounter(): string {
    return `${this.activeIndex + 1} / ${this.galleriaImages.length}`;
  }

  selectImage(index: number): void {
    if (index === this.activeIndex) return;
    this.slideDirection = index > this.activeIndex ? 'left' : 'right';
    this.navigateTo(index);
  }

  prevImage(): void {
    this.slideDirection = 'right';
    const index = this.activeIndex > 0
      ? this.activeIndex - 1
      : this.galleriaImages.length - 1;
    this.navigateTo(index);
  }

  nextImage(): void {
    this.slideDirection = 'left';
    const index = this.activeIndex < this.galleriaImages.length - 1
      ? this.activeIndex + 1
      : 0;
    this.navigateTo(index);
  }

  onImageLoad(): void {
    this.loadedImages.add(this.activeIndex);
    this.imageLoading = false;
    this.showLoader = false;
    // Start slide animation only after new image is loaded
    this.clearSlideDirection();
  }

  private navigateTo(index: number): void {
    // Hide the current image immediately before changing src
    this.imageLoading = true;
    // Only show spinner for images that haven't been loaded yet
    this.showLoader = !this.loadedImages.has(index);
    this.activeIndex = index;
    this.scrollThumbnailIntoView();
  }

  // Fullscreen
  openFullscreen(): void {
    this.fullscreen = true;
    document.body.style.overflow = 'hidden';
  }

  closeFullscreen(): void {
    this.fullscreen = false;
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.fullscreen && this.galleriaImages.length <= 1) return;
    if (event.key === 'Escape' && this.fullscreen) {
      this.closeFullscreen();
    } else if (event.key === 'ArrowLeft') {
      this.prevImage();
    } else if (event.key === 'ArrowRight') {
      this.nextImage();
    }
  }

  // Swipe gestures
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchStartTime = Date.now();
    this.swiping = false;
    this.swipeOffset = 0;
  }

  onTouchMove(event: TouchEvent): void {
    if (this.galleriaImages.length <= 1) return;
    const deltaX = event.touches[0].clientX - this.touchStartX;
    const deltaY = event.touches[0].clientY - this.touchStartY;
    // Lock into horizontal swipe once threshold is met
    if (!this.swiping && Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
      this.swiping = true;
    }
    if (this.swiping) {
      event.preventDefault();
      this.swipeOffset = deltaX;
    }
  }

  onTouchEnd(_event: TouchEvent): void {
    if (this.galleriaImages.length <= 1 || !this.swiping) {
      this.swipeOffset = 0;
      this.swiping = false;
      return;
    }
    const velocity = Math.abs(this.swipeOffset) / (Date.now() - this.touchStartTime);
    // Trigger navigation if swiped far enough or fast enough
    if (Math.abs(this.swipeOffset) > this.SWIPE_THRESHOLD || velocity > 0.5) {
      if (this.swipeOffset < 0) {
        this.nextImage();
      } else {
        this.prevImage();
      }
    }
    this.swipeOffset = 0;
    this.swiping = false;
  }

  getSwipeTransform(): string {
    if (this.swiping && this.swipeOffset !== 0) {
      return `translateX(${this.swipeOffset}px)`;
    }
    return '';
  }

  private clearSlideDirection(): void {
    setTimeout(() => { this.slideDirection = ''; }, 300);
  }

  private scrollThumbnailIntoView(): void {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      const container = document.querySelector('.gallery-thumbs-scroll');
      const activeThumb = container?.querySelector('.gallery-thumbnail-active');
      if (activeThumb && container) {
        activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }

  // Show sticky bar after scrolling past the main CTA
  showStickyBar = computed(() => {
    return this.scrollPosition() > 400;
  });

  private get whatsappNumber(): string {
    return this.shopDetailsService.whatsappNumber();
  }
  private get shopPhoneNumber(): string {
    return this.shopDetailsService.phoneLink() || '';
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrollPosition.set(window.scrollY);
  }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProductDetail(productId);
    } else {
      this.notFound.set(true);
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.jsonLdService.removeStructuredData();
    document.body.style.overflow = '';
  }

  private async loadProductDetail(id: string): Promise<void> {
    this.loading.set(true);
    this.notFound.set(false);

    try {
      const productDetail = await this.productService.getAvailableProductDetail(id);

      if (!productDetail) {
        this.notFound.set(true);
        return;
      }

      this.product.set(productDetail);
      this.buildGalleriaImages(productDetail);
      this.updateSeoTags(productDetail);
      this.jsonLdService.setProductStructuredData(productDetail);
    } catch (error) {
      console.error('Failed to load product detail:', error);
      this.toastService.error('Error', 'Failed to load product details');
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private buildGalleriaImages(productDetail: ProductDetail): void {
    this.loadedImages.clear();
    this.galleriaImages = productDetail.images.map(img => ({
      itemImageSrc: this.imageOptimization.getDetailImageUrl(img.imageUrl),
      itemSrcSet: this.imageOptimization.getDetailSrcSet(img.imageUrl),
      thumbnailImageSrc: this.imageOptimization.getThumbnailUrl(img.imageUrl),
      originalUrl: img.imageUrl,
      alt: `${productDetail.brandName} ${productDetail.model}`,
      isPrimary: img.isPrimary
    }));
    // The first image will be loaded by the browser directly
    this.loadedImages.add(0);
  }

  private updateSeoTags(product: ProductDetail): void {
    const productName = `${product.brandName} ${product.model}`;
    const conditionLabel = ProductConditionLabels[product.condition];
    const price = this.formatCurrency(product.sellingPrice);
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

  showBatteryHealth(): boolean {
    const currentProduct = this.product();
    if (!currentProduct) return false;

    const isUsedOrRefurbished =
      currentProduct.condition === ProductCondition.USED ||
      currentProduct.condition === ProductCondition.OPEN_BOX;

    return isUsedOrRefurbished && currentProduct.batteryHealth !== null;
  }

  getBatteryHealthClass(batteryHealth: number | null): string {
    if (batteryHealth === null) return '';
    if (batteryHealth >= 90) return 'text-green-600';
    if (batteryHealth >= 80) return 'text-green-500';
    if (batteryHealth >= 70) return 'text-yellow-600';
    if (batteryHealth >= 50) return 'text-orange-500';
    return 'text-red-500';
  }

  getBatteryProgressClass(batteryHealth: number | null): string {
    if (batteryHealth === null) return '';
    if (batteryHealth >= 90) return 'battery-excellent';
    if (batteryHealth >= 80) return 'battery-good';
    if (batteryHealth >= 70) return 'battery-fair';
    if (batteryHealth >= 50) return 'battery-poor';
    return 'battery-critical';
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

  getStatusLabel(status: ProductStatus): string {
    return ProductStatusLabels[status];
  }

  getStatusSeverity(status: ProductStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (status) {
      case ProductStatus.AVAILABLE:
        return 'success';
      case ProductStatus.RESERVED:
        return 'warn';
      case ProductStatus.SOLD:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getProductTypeLabel(type: ProductType): string {
    return ProductTypeLabels[type] || type;
  }

  openWhatsAppInquiry(): void {
    const currentProduct = this.product();
    if (!currentProduct) return;

    const message = this.buildWhatsAppMessage(currentProduct);
    const encodedMessage = encodeURIComponent(message);

    // Build WhatsApp URL
    let whatsappUrl: string;
    if (this.whatsappNumber) {
      whatsappUrl = `https://wa.me/${this.whatsappNumber}?text=${encodedMessage}`;
    } else {
      // Without a number, opens WhatsApp with message to be shared
      whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    }

    window.open(whatsappUrl, '_blank');
  }

  private buildWhatsAppMessage(product: ProductDetail): string {
    const parts: string[] = [
      `Hi! I'm interested in the ${product.brandName} ${product.model}`,
    ];

    if (product.storageGb) {
      parts[0] += ` (${product.storageGb}GB)`;
    }

    parts.push('');
    parts.push(`Price: ${this.formatCurrency(product.sellingPrice)}`);
    parts.push('');
    parts.push('Could you please provide more details about this product?');

    return parts.join('\n');
  }

  private formatCurrency(value: number): string {
    return this.currencyService.format(value);
  }

  // AC_REDESIGN_001: Discount calculations
  hasDiscount(): boolean {
    const currentProduct = this.product();
    if (!currentProduct) return false;
    return currentProduct.profitMargin >= 20;
  }

  getOriginalPrice(): number {
    const currentProduct = this.product();
    if (!currentProduct) return 0;
    const discountPercent = Math.round(currentProduct.profitMargin);
    return Math.round(currentProduct.sellingPrice * (1 + discountPercent / 100));
  }

  getDiscountPercent(): number {
    const currentProduct = this.product();
    if (!currentProduct) return 0;
    return Math.round(currentProduct.profitMargin);
  }

  // AC_REDESIGN_001: Condition background class
  getConditionBgClass(condition: ProductCondition): string {
    switch (condition) {
      case ProductCondition.NEW:
        return 'condition-new';
      case ProductCondition.OPEN_BOX:
        return 'condition-open-box';
      case ProductCondition.USED:
        return 'condition-used';
      default:
        return 'surface-100';
    }
  }

  // Battery health description
  getBatteryHealthDescription(batteryHealth: number | null): string {
    if (batteryHealth === null) return '';
    if (batteryHealth >= 90) return 'Excellent - performs like new';
    if (batteryHealth >= 80) return 'Good - reliable performance';
    if (batteryHealth >= 70) return 'Fair - acceptable for normal use';
    if (batteryHealth >= 50) return 'Below average - may need replacement soon';
    return 'Critical - battery replacement recommended';
  }

  // Call to reserve action
  callToReserve(): void {
    window.location.href = `tel:${this.shopPhoneNumber}`;
  }

  goBackToCatalog(): void {
    // Use location.back() to preserve the filter/search state
    // Check if there's history to go back to
    if (window.history.length > 1) {
      this.location.back();
    } else {
      // Fallback to catalog root if no history
      this.router.navigate(['/']);
    }
  }
}
