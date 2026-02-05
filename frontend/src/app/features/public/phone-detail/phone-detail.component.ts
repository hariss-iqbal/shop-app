import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { RatingModule } from 'primeng/rating';
import { PhoneService } from '../../../core/services/phone.service';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SeoService } from '../../../shared/services/seo.service';
import { JsonLdService } from '../../../shared/services/json-ld.service';
import { PhoneDetail } from '../../../models/phone.model';
import { PhoneCondition, PhoneConditionLabels, PhoneStatus, PhoneStatusLabels } from '../../../enums';
import { environment } from '../../../../environments/environment';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { CurrencyService } from '../../../core/services/currency.service';

interface CustomerReview {
  id: string;
  customerName: string;
  customerInitials: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

interface GalleriaImage {
  itemImageSrc: string;
  itemSrcSet: string;
  thumbnailImageSrc: string;
  originalUrl: string;
  alt: string;
  isPrimary: boolean;
}

@Component({
  selector: 'app-phone-detail',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    ProgressBarModule,
    SkeletonModule,
    DividerModule,
    TooltipModule,
    AvatarModule,
    RatingModule,
    AppCurrencyPipe
  ],
  templateUrl: './phone-detail.component.html',
  styleUrls: ['./phone-detail.component.scss']
})
export class PhoneDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private phoneService = inject(PhoneService);
  private imageOptimization = inject(ImageOptimizationService);
  private toastService = inject(ToastService);
  private seoService = inject(SeoService);
  private jsonLdService = inject(JsonLdService);
  private currencyService = inject(CurrencyService);
  phone = signal<PhoneDetail | null>(null);
  loading = signal(true);
  notFound = signal(false);
  scrollPosition = signal(0);

  galleriaImages: GalleriaImage[] = [];
  activeIndex = 0;
  fullscreen = false;
  slideDirection: 'left' | 'right' | '' = '';
  imageLoading = false;
  customerReviews = signal<CustomerReview[]>([]);

  // Track which images have been loaded
  private loadedImages = new Set<number>();

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
  }

  private navigateTo(index: number): void {
    this.activeIndex = index;
    // Show loader only if this image hasn't been loaded before
    this.imageLoading = !this.loadedImages.has(index);
    this.scrollThumbnailIntoView();
    this.clearSlideDirection();
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

  // Computed properties for AC_REDESIGN_002
  averageRating = computed(() => {
    const reviews = this.customerReviews();
    if (reviews.length === 0) return 4.5;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  });

  // Show sticky bar after scrolling past the main CTA
  showStickyBar = computed(() => {
    return this.scrollPosition() > 400;
  });

  private readonly whatsappNumber = environment.whatsapp.phoneNumber;
  private readonly shopPhoneNumber = environment.businessInfo?.phoneLink || '+1234567890';

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrollPosition.set(window.scrollY);
  }

  ngOnInit(): void {
    const phoneId = this.route.snapshot.paramMap.get('id');
    if (phoneId) {
      this.loadPhoneDetail(phoneId);
    } else {
      this.notFound.set(true);
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.jsonLdService.removeStructuredData();
    document.body.style.overflow = '';
  }

  private async loadPhoneDetail(id: string): Promise<void> {
    this.loading.set(true);
    this.notFound.set(false);

    try {
      const phoneDetail = await this.phoneService.getAvailablePhoneDetail(id);

      if (!phoneDetail) {
        this.notFound.set(true);
        return;
      }

      this.phone.set(phoneDetail);
      this.buildGalleriaImages(phoneDetail);
      this.updateSeoTags(phoneDetail);
      this.jsonLdService.setProductStructuredData(phoneDetail);
      this.customerReviews.set(this.generateMockReviews(phoneDetail));
    } catch (error) {
      console.error('Failed to load phone detail:', error);
      this.toastService.error('Error', 'Failed to load phone details');
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private buildGalleriaImages(phoneDetail: PhoneDetail): void {
    this.loadedImages.clear();
    this.galleriaImages = phoneDetail.images.map(img => ({
      itemImageSrc: this.imageOptimization.getDetailImageUrl(img.imageUrl),
      itemSrcSet: this.imageOptimization.getDetailSrcSet(img.imageUrl),
      thumbnailImageSrc: this.imageOptimization.getThumbnailUrl(img.imageUrl),
      originalUrl: img.imageUrl,
      alt: `${phoneDetail.brandName} ${phoneDetail.model}`,
      isPrimary: img.isPrimary
    }));
    // The first image will be loaded by the browser directly
    this.loadedImages.add(0);
  }

  private updateSeoTags(phone: PhoneDetail): void {
    const phoneName = `${phone.brandName} ${phone.model}`;
    const conditionLabel = PhoneConditionLabels[phone.condition];
    const price = this.formatCurrency(phone.sellingPrice);
    const storagePart = phone.storageGb ? ` ${phone.storageGb}GB` : '';

    const primaryImage = phone.images.find(img => img.isPrimary) || phone.images[0];

    this.seoService.updateMetaTags({
      title: `${phoneName}${storagePart}`,
      description: `Buy ${phoneName}${storagePart} - ${conditionLabel} condition for ${price}. Browse specs, images, and inquire via WhatsApp.`,
      url: `/phone/${phone.id}`,
      image: primaryImage?.imageUrl || phone.primaryImageUrl,
      type: 'product'
    });
  }

  showBatteryHealth(): boolean {
    const currentPhone = this.phone();
    if (!currentPhone) return false;

    const isUsedOrRefurbished =
      currentPhone.condition === PhoneCondition.USED ||
      currentPhone.condition === PhoneCondition.OPEN_BOX;

    return isUsedOrRefurbished && currentPhone.batteryHealth !== null;
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

  getStatusLabel(status: PhoneStatus): string {
    return PhoneStatusLabels[status];
  }

  getStatusSeverity(status: PhoneStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (status) {
      case PhoneStatus.AVAILABLE:
        return 'success';
      case PhoneStatus.RESERVED:
        return 'warn';
      case PhoneStatus.SOLD:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  openWhatsAppInquiry(): void {
    const currentPhone = this.phone();
    if (!currentPhone) return;

    const message = this.buildWhatsAppMessage(currentPhone);
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

  private buildWhatsAppMessage(phone: PhoneDetail): string {
    const parts: string[] = [
      `Hi! I'm interested in the ${phone.brandName} ${phone.model}`,
    ];

    if (phone.storageGb) {
      parts[0] += ` (${phone.storageGb}GB)`;
    }

    parts.push('');
    parts.push(`Price: ${this.formatCurrency(phone.sellingPrice)}`);
    parts.push('');
    parts.push('Could you please provide more details about this phone?');

    return parts.join('\n');
  }

  private formatCurrency(value: number): string {
    return this.currencyService.format(value);
  }

  // AC_REDESIGN_001: Discount calculations
  hasDiscount(): boolean {
    const currentPhone = this.phone();
    if (!currentPhone) return false;
    return currentPhone.profitMargin >= 20;
  }

  getOriginalPrice(): number {
    const currentPhone = this.phone();
    if (!currentPhone) return 0;
    const discountPercent = Math.round(currentPhone.profitMargin);
    return Math.round(currentPhone.sellingPrice * (1 + discountPercent / 100));
  }

  getDiscountPercent(): number {
    const currentPhone = this.phone();
    if (!currentPhone) return 0;
    return Math.round(currentPhone.profitMargin);
  }

  // AC_REDESIGN_001: Condition background class
  getConditionBgClass(condition: PhoneCondition): string {
    switch (condition) {
      case PhoneCondition.NEW:
        return 'condition-new';
      case PhoneCondition.OPEN_BOX:
        return 'condition-open-box';
      case PhoneCondition.USED:
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

  // AC_REDESIGN_002: Scroll to reviews section
  scrollToReviews(): void {
    const reviewsSection = document.getElementById('reviews-section');
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Generate mock reviews based on phone condition - AC_REDESIGN_002
  private generateMockReviews(phone: PhoneDetail): CustomerReview[] {
    const reviewTemplates: Array<{name: string; comment: string; rating: number}> = [
      {
        name: 'Sarah Johnson',
        comment: 'Great phone at an excellent price! The condition was exactly as described. Fast delivery and great customer service.',
        rating: 5
      },
      {
        name: 'Michael Chen',
        comment: 'Very satisfied with my purchase. The phone works perfectly and looks almost new. Would definitely recommend!',
        rating: 5
      },
      {
        name: 'Emily Rodriguez',
        comment: 'Good value for money. Minor signs of use but nothing that affects functionality. Happy with my purchase.',
        rating: 4
      },
      {
        name: 'David Kim',
        comment: 'Exactly what I was looking for. The battery health is as advertised and the phone performs great.',
        rating: 4
      },
      {
        name: 'Jessica Thompson',
        comment: 'Quick shipping and well-packaged. The phone met all my expectations. Great experience overall!',
        rating: 5
      }
    ];

    // Generate 3-5 reviews based on phone
    const numReviews = phone.condition === PhoneCondition.NEW ? 5 : (phone.condition === PhoneCondition.OPEN_BOX ? 4 : 3);
    const selectedReviews = reviewTemplates.slice(0, numReviews);

    return selectedReviews.map((template, index) => ({
      id: `review-${index}`,
      customerName: template.name,
      customerInitials: template.name.split(' ').map(n => n[0]).join(''),
      rating: template.rating,
      date: this.getRandomRecentDate(),
      comment: template.comment,
      verified: Math.random() > 0.3 // 70% chance of being verified
    }));
  }

  private getRandomRecentDate(): string {
    const daysAgo = Math.floor(Math.random() * 60) + 1; // 1-60 days ago
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
      this.router.navigate(['/catalog']);
    }
  }
}
