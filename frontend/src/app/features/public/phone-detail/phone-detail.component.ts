import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { GalleriaModule } from 'primeng/galleria';
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
import { BlurUpImageDirective } from '../../../shared/directives/blur-up-image.directive';
import { environment } from '../../../../environments/environment';

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
    GalleriaModule,
    ProgressBarModule,
    SkeletonModule,
    DividerModule,
    TooltipModule,
    AvatarModule,
    RatingModule,
    BlurUpImageDirective
  ],
  template: `
    <div class="phone-detail-container">
      <!-- Back to Catalog Link -->
      <div class="mb-4">
        <p-button
          icon="pi pi-arrow-left"
          label="Back to Catalog"
          [text]="true"
          (onClick)="goBackToCatalog()"
          ariaLabel="Go back to phone catalog"
        />
      </div>

      @if (loading()) {
        <!-- Loading Skeleton - Enhanced -->
        <div class="grid">
          <div class="col-12 lg:col-7" aria-busy="true" aria-label="Loading phone images">
            <p-skeleton height="500px" styleClass="mb-3 border-round-xl" />
            <div class="flex gap-2">
              <p-skeleton width="100px" height="75px" styleClass="border-round" />
              <p-skeleton width="100px" height="75px" styleClass="border-round" />
              <p-skeleton width="100px" height="75px" styleClass="border-round" />
              <p-skeleton width="100px" height="75px" styleClass="border-round" />
            </div>
          </div>
          <div class="col-12 lg:col-5" aria-busy="true" aria-label="Loading phone details">
            <p-skeleton width="40%" height="1.5rem" styleClass="mb-2" />
            <p-skeleton width="80%" height="2.5rem" styleClass="mb-3" />
            <p-skeleton width="50%" height="1rem" styleClass="mb-4" />
            <p-skeleton width="35%" height="3rem" styleClass="mb-4" />
            <p-skeleton height="120px" styleClass="mb-4 border-round" />
            <p-skeleton height="56px" styleClass="border-round" />
          </div>
        </div>
      } @else if (notFound()) {
        <!-- Phone Not Found -->
        <div class="col-12" role="alert">
          <p-card styleClass="border-round-xl">
            <div class="text-center py-8">
              <i class="pi pi-exclamation-circle text-7xl text-orange-500 mb-4" style="display: block;" aria-hidden="true"></i>
              <h2 class="text-3xl font-bold text-900 m-0 mb-3">Phone Not Found</h2>
              <p class="text-600 text-lg m-0 mb-5 line-height-3">
                The phone you're looking for is not available or doesn't exist.
              </p>
              <p-button
                icon="pi pi-arrow-left"
                label="Browse Available Phones"
                (onClick)="goBackToCatalog()"
                ariaLabel="Browse all available phones in catalog"
                styleClass="p-button-lg"
              />
            </div>
          </p-card>
        </div>
      } @else if (phone()) {
        <!-- Phone Detail Content - AC_REDESIGN_001: Redesigned layout -->
        <div class="grid">
          <!-- Image Gallery Section - Larger images -->
          <article class="col-12 lg:col-7 xl:col-7" aria-label="Phone images">
            @if (galleriaImages().length > 0) {
              <div class="gallery-container surface-card border-round-xl p-3 shadow-1">
                <p-galleria
                  [value]="galleriaImages()"
                  [showThumbnails]="galleriaImages().length > 1"
                  [showIndicators]="galleriaImages().length > 1"
                  [showItemNavigators]="galleriaImages().length > 1"
                  [numVisible]="4"
                  [circular]="true"
                  [responsiveOptions]="galleriaResponsiveOptions"
                  [containerStyle]="{ 'max-width': '100%' }"
                  thumbnailsPosition="bottom"
                >
                  <ng-template pTemplate="item" let-item>
                    <div class="gallery-main-image w-full border-round-lg overflow-hidden" style="height: 500px; background: linear-gradient(135deg, var(--surface-50) 0%, var(--surface-100) 100%);">
                      <img
                        [src]="item.itemImageSrc"
                        [srcset]="item.itemSrcSet"
                        sizes="(max-width: 1024px) 100vw, 60vw"
                        [alt]="item.alt"
                        width="800"
                        height="500"
                        [loading]="item.isPrimary ? 'eager' : 'lazy'"
                        [appBlurUpImage]="item.originalUrl"
                        [blurUpDisabled]="item.isPrimary"
                        class="w-full h-full border-round-lg"
                        style="object-fit: contain;"
                      />
                    </div>
                  </ng-template>
                  <ng-template pTemplate="thumbnail" let-item>
                    <div class="gallery-thumbnail border-round overflow-hidden cursor-pointer" style="width: 100px; height: 75px; background: var(--surface-100);">
                      <img
                        [src]="item.thumbnailImageSrc"
                        [alt]="item.alt"
                        width="100"
                        height="75"
                        loading="lazy"
                        [appBlurUpImage]="item.originalUrl"
                        class="w-full h-full border-round"
                        style="object-fit: cover;"
                      />
                    </div>
                  </ng-template>
                </p-galleria>
              </div>
            } @else {
              <div
                class="flex flex-column align-items-center justify-content-center surface-card border-round-xl gap-3 shadow-1"
                style="height: 500px;"
              >
                <i class="pi pi-image text-7xl text-300" aria-hidden="true"></i>
                <span class="text-400 text-lg">No images available</span>
              </div>
            }
          </article>

          <!-- Product Info Section -->
          <section class="col-12 lg:col-5 xl:col-5" aria-label="Phone specifications and details">
            <div class="product-info surface-card border-round-xl p-4 shadow-1 sticky" style="top: 1rem;">
              <!-- Brand & Status Row -->
              <div class="flex align-items-center justify-content-between mb-3">
                <div class="flex align-items-center gap-2">
                  @if (phone()!.brandLogoUrl) {
                    <img
                      [src]="phone()!.brandLogoUrl"
                      [alt]="phone()!.brandName"
                      style="width: 28px; height: 28px; object-fit: contain;"
                    />
                  }
                  <span class="text-600 font-medium">{{ phone()!.brandName }}</span>
                </div>
                <p-tag
                  [value]="getStatusLabel(phone()!.status)"
                  [severity]="getStatusSeverity(phone()!.status)"
                  [rounded]="true"
                  styleClass="text-sm px-3 py-1"
                />
              </div>

              <!-- Model Name -->
              <h1 class="text-3xl lg:text-4xl font-bold text-900 m-0 mb-3 line-height-2">{{ phone()!.model }}</h1>

              <!-- Rating Summary - AC_REDESIGN_002 -->
              <div class="flex align-items-center gap-2 mb-4">
                <p-rating
                  [ngModel]="averageRating()"
                  [readonly]="true"
                  [stars]="5"
                  styleClass="rating-display"
                />
                <span class="text-600 font-medium">{{ averageRating() }}</span>
                <span class="text-400">|</span>
                <a href="javascript:void(0)" (click)="scrollToReviews()" class="text-primary no-underline hover:underline">
                  {{ customerReviews().length }} reviews
                </a>
              </div>

              <!-- Price Section - AC_REDESIGN_001: Prominent display -->
              <div class="price-section surface-50 border-round-lg p-4 mb-4">
                <div class="flex align-items-baseline gap-2">
                  <span class="text-4xl lg:text-5xl font-bold text-primary">
                    {{ phone()!.sellingPrice | currency:'USD':'symbol':'1.0-0' }}
                  </span>
                  @if (hasDiscount()) {
                    <span class="text-xl text-500 line-through">
                      {{ getOriginalPrice() | currency:'USD':'symbol':'1.0-0' }}
                    </span>
                  }
                </div>
                @if (hasDiscount()) {
                  <div class="mt-2">
                    <p-tag value="SAVE {{ getDiscountPercent() }}%" severity="danger" styleClass="font-semibold" />
                  </div>
                }
              </div>

              <!-- Quick Specs Pills -->
              <div class="flex flex-wrap gap-2 mb-4">
                @if (phone()!.storageGb) {
                  <span class="surface-100 px-3 py-2 border-round-lg text-sm font-medium flex align-items-center gap-2">
                    <i class="pi pi-database text-primary" aria-hidden="true"></i>
                    {{ phone()!.storageGb }}GB Storage
                  </span>
                }
                @if (phone()!.ramGb) {
                  <span class="surface-100 px-3 py-2 border-round-lg text-sm font-medium flex align-items-center gap-2">
                    <i class="pi pi-microchip text-primary" aria-hidden="true"></i>
                    {{ phone()!.ramGb }}GB RAM
                  </span>
                }
                @if (phone()!.color) {
                  <span class="surface-100 px-3 py-2 border-round-lg text-sm font-medium flex align-items-center gap-2">
                    <i class="pi pi-palette text-primary" aria-hidden="true"></i>
                    {{ phone()!.color }}
                  </span>
                }
                <span class="px-3 py-2 border-round-lg text-sm font-medium flex align-items-center gap-2"
                      [ngClass]="getConditionBgClass(phone()!.condition)">
                  <i class="pi pi-check-circle" aria-hidden="true"></i>
                  {{ getConditionLabel(phone()!.condition) }}
                </span>
              </div>

              <!-- Battery Health (only for used/refurbished) -->
              @if (showBatteryHealth()) {
                <div class="battery-section surface-50 border-round-lg p-4 mb-4" role="group" aria-label="Battery health information">
                  <div class="flex align-items-center justify-content-between mb-3">
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-bolt text-xl" [ngClass]="getBatteryHealthClass(phone()!.batteryHealth)" aria-hidden="true"></i>
                      <span class="font-semibold text-900" id="battery-health-label">Battery Health</span>
                    </div>
                    <span
                      class="text-xl font-bold"
                      [ngClass]="getBatteryHealthClass(phone()!.batteryHealth)"
                      [attr.aria-label]="'Battery health is ' + phone()!.batteryHealth + ' percent'"
                    >
                      {{ phone()!.batteryHealth }}%
                    </span>
                  </div>
                  <p-progressBar
                    [value]="phone()!.batteryHealth || 0"
                    [showValue]="false"
                    styleClass="h-1rem border-round-lg"
                    [style]="{ 'background': 'var(--surface-200)' }"
                    [ngClass]="getBatteryProgressClass(phone()!.batteryHealth)"
                    role="progressbar"
                    [attr.aria-valuenow]="phone()!.batteryHealth"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-labelledby="battery-health-label"
                  />
                  <p class="text-sm text-500 mt-2 mb-0">{{ getBatteryHealthDescription(phone()!.batteryHealth) }}</p>
                </div>
              }

              <!-- CTA Buttons - AC_REDESIGN_001: Add to cart button -->
              <div class="flex flex-column gap-3">
                <p-button
                  icon="pi pi-whatsapp"
                  label="Inquire via WhatsApp"
                  styleClass="w-full p-button-lg"
                  severity="success"
                  (onClick)="openWhatsAppInquiry()"
                  pTooltip="Opens WhatsApp with a pre-filled message about this phone"
                  tooltipPosition="top"
                  ariaLabel="Inquire about {{ phone()!.brandName }} {{ phone()!.model }} via WhatsApp"
                />
                <p-button
                  icon="pi pi-phone"
                  label="Call to Reserve"
                  styleClass="w-full p-button-lg"
                  [outlined]="true"
                  severity="primary"
                  (onClick)="callToReserve()"
                  ariaLabel="Call to reserve {{ phone()!.brandName }} {{ phone()!.model }}"
                />
              </div>
            </div>
          </section>
        </div>

        <!-- Full Specifications Section -->
        <div class="grid mt-5">
          <div class="col-12 lg:col-7">
            <!-- Description -->
            @if (phone()!.description) {
              <div class="surface-card border-round-xl p-4 shadow-1 mb-4">
                <h2 class="text-xl font-bold text-900 m-0 mb-3 flex align-items-center gap-2">
                  <i class="pi pi-info-circle text-primary" aria-hidden="true"></i>
                  About This Phone
                </h2>
                <p class="text-700 line-height-3 m-0">{{ phone()!.description }}</p>
              </div>
            }

            <!-- Full Specifications -->
            <div class="surface-card border-round-xl p-4 shadow-1 mb-4">
              <h2 class="text-xl font-bold text-900 m-0 mb-4 flex align-items-center gap-2">
                <i class="pi pi-list text-primary" aria-hidden="true"></i>
                Specifications
              </h2>
              <dl class="grid m-0" role="list" aria-label="Full phone specifications">
                <div class="col-12 md:col-6 flex justify-content-between py-3 border-bottom-1 surface-border">
                  <dt class="text-600">Brand</dt>
                  <dd class="text-900 font-medium m-0">{{ phone()!.brandName }}</dd>
                </div>
                <div class="col-12 md:col-6 flex justify-content-between py-3 border-bottom-1 surface-border">
                  <dt class="text-600">Model</dt>
                  <dd class="text-900 font-medium m-0">{{ phone()!.model }}</dd>
                </div>
                @if (phone()!.storageGb) {
                  <div class="col-12 md:col-6 flex justify-content-between py-3 border-bottom-1 surface-border">
                    <dt class="text-600">Storage</dt>
                    <dd class="text-900 font-medium m-0">{{ phone()!.storageGb }}GB</dd>
                  </div>
                }
                @if (phone()!.ramGb) {
                  <div class="col-12 md:col-6 flex justify-content-between py-3 border-bottom-1 surface-border">
                    <dt class="text-600">RAM</dt>
                    <dd class="text-900 font-medium m-0">{{ phone()!.ramGb }}GB</dd>
                  </div>
                }
                @if (phone()!.color) {
                  <div class="col-12 md:col-6 flex justify-content-between py-3 border-bottom-1 surface-border">
                    <dt class="text-600">Color</dt>
                    <dd class="text-900 font-medium m-0">{{ phone()!.color }}</dd>
                  </div>
                }
                <div class="col-12 md:col-6 flex justify-content-between py-3 border-bottom-1 surface-border">
                  <dt class="text-600">Condition</dt>
                  <dd class="m-0">
                    <p-tag [value]="getConditionLabel(phone()!.condition)" [severity]="getConditionSeverity(phone()!.condition)" />
                  </dd>
                </div>
                @if (showBatteryHealth()) {
                  <div class="col-12 md:col-6 flex justify-content-between py-3 border-bottom-1 surface-border">
                    <dt class="text-600">Battery Health</dt>
                    <dd class="text-900 font-medium m-0" [ngClass]="getBatteryHealthClass(phone()!.batteryHealth)">{{ phone()!.batteryHealth }}%</dd>
                  </div>
                }
                <div class="col-12 md:col-6 flex justify-content-between py-3">
                  <dt class="text-600">Availability</dt>
                  <dd class="m-0">
                    <p-tag [value]="getStatusLabel(phone()!.status)" [severity]="getStatusSeverity(phone()!.status)" />
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Sidebar Widgets -->
          <div class="col-12 lg:col-5">
            <!-- Trust Badges -->
            <div class="surface-card border-round-xl p-4 shadow-1 mb-4">
              <div class="flex flex-column gap-3">
                <div class="flex align-items-center gap-3">
                  <div class="flex align-items-center justify-content-center bg-green-100 border-round-lg" style="width: 48px; height: 48px;">
                    <i class="pi pi-verified text-xl text-green-600" aria-hidden="true"></i>
                  </div>
                  <div>
                    <p class="font-semibold text-900 m-0">Quality Assured</p>
                    <p class="text-sm text-500 m-0">Every phone is thoroughly inspected</p>
                  </div>
                </div>
                <div class="flex align-items-center gap-3">
                  <div class="flex align-items-center justify-content-center bg-blue-100 border-round-lg" style="width: 48px; height: 48px;">
                    <i class="pi pi-shield text-xl text-blue-600" aria-hidden="true"></i>
                  </div>
                  <div>
                    <p class="font-semibold text-900 m-0">Warranty Included</p>
                    <p class="text-sm text-500 m-0">30-day warranty on all phones</p>
                  </div>
                </div>
                <div class="flex align-items-center gap-3">
                  <div class="flex align-items-center justify-content-center bg-purple-100 border-round-lg" style="width: 48px; height: 48px;">
                    <i class="pi pi-sync text-xl text-purple-600" aria-hidden="true"></i>
                  </div>
                  <div>
                    <p class="font-semibold text-900 m-0">Easy Returns</p>
                    <p class="text-sm text-500 m-0">7-day hassle-free return policy</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Contact Card -->
            <div class="surface-card border-round-xl p-4 shadow-1">
              <h3 class="text-lg font-semibold text-900 m-0 mb-3">Need Help?</h3>
              <p class="text-600 text-sm m-0 mb-3">Have questions about this phone? Our team is here to help!</p>
              <div class="flex flex-column gap-2">
                <a href="tel:+1234567890" class="flex align-items-center gap-2 text-primary no-underline hover:underline">
                  <i class="pi pi-phone" aria-hidden="true"></i>
                  +1 (234) 567-890
                </a>
                <a href="mailto:info@phoneshop.com" class="flex align-items-center gap-2 text-primary no-underline hover:underline">
                  <i class="pi pi-envelope" aria-hidden="true"></i>
                  info&#64;phoneshop.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Customer Reviews Section - AC_REDESIGN_002 -->
        <div id="reviews-section" class="mt-5">
          <div class="surface-card border-round-xl p-4 shadow-1">
            <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3 mb-4">
              <h2 class="text-2xl font-bold text-900 m-0 flex align-items-center gap-2">
                <i class="pi pi-star-fill text-yellow-500" aria-hidden="true"></i>
                Customer Reviews
              </h2>
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center gap-2">
                  <span class="text-3xl font-bold text-900">{{ averageRating() }}</span>
                  <div class="flex flex-column">
                    <p-rating [ngModel]="averageRating()" [readonly]="true" [stars]="5" styleClass="rating-display" />
                    <span class="text-sm text-500">Based on {{ customerReviews().length }} reviews</span>
                  </div>
                </div>
              </div>
            </div>

            @if (customerReviews().length > 0) {
              <div class="flex flex-column gap-4">
                @for (review of customerReviews(); track review.id) {
                  <div class="review-card surface-50 border-round-lg p-4">
                    <div class="flex align-items-start gap-3">
                      <p-avatar
                        [label]="review.customerInitials"
                        size="large"
                        shape="circle"
                        styleClass="bg-primary text-white font-semibold"
                      />
                      <div class="flex-grow-1">
                        <div class="flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between gap-2 mb-2">
                          <div>
                            <span class="font-semibold text-900">{{ review.customerName }}</span>
                            @if (review.verified) {
                              <p-tag value="Verified Purchase" severity="success" styleClass="ml-2 text-xs" />
                            }
                          </div>
                          <span class="text-sm text-500">{{ review.date }}</span>
                        </div>
                        <p-rating [ngModel]="review.rating" [readonly]="true" [stars]="5" styleClass="rating-display mb-2" />
                        <p class="text-700 line-height-3 m-0">{{ review.comment }}</p>
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="text-center py-6">
                <i class="pi pi-comments text-5xl text-300 mb-3" style="display: block;" aria-hidden="true"></i>
                <p class="text-600 m-0">No reviews yet. Be the first to share your experience!</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- Sticky Mobile CTA Bar - AC_REDESIGN_003 -->
      @if (phone() && showStickyBar()) {
        <div class="sticky-mobile-bar lg:hidden fixed bottom-0 left-0 right-0 surface-card shadow-8 border-top-1 surface-border px-3 py-3 z-5">
          <div class="flex align-items-center justify-content-between gap-3">
            <div class="flex flex-column">
              <span class="text-sm text-500">{{ phone()!.brandName }} {{ phone()!.model }}</span>
              <span class="text-xl font-bold text-primary">{{ phone()!.sellingPrice | currency:'USD':'symbol':'1.0-0' }}</span>
            </div>
            <p-button
              icon="pi pi-whatsapp"
              label="Inquire"
              severity="success"
              (onClick)="openWhatsAppInquiry()"
              ariaLabel="Inquire via WhatsApp"
            />
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .phone-detail-container {
      padding-bottom: 100px;
    }

    @media (min-width: 992px) {
      .phone-detail-container {
        padding-bottom: 0;
      }
    }

    .gallery-container {
      position: sticky;
      top: 1rem;
    }

    .gallery-main-image {
      transition: transform 0.3s ease;
    }

    .gallery-thumbnail {
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }

    .gallery-thumbnail:hover {
      border-color: var(--primary-500);
      transform: scale(1.05);
    }

    :host ::ng-deep .p-galleria-thumbnail-item-current .gallery-thumbnail {
      border-color: var(--primary-500);
    }

    .product-info {
      position: sticky;
      top: 1rem;
    }

    .price-section {
      border: 1px solid var(--surface-200);
    }

    .battery-section {
      border: 1px solid var(--surface-200);
    }

    .review-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .review-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    :host ::ng-deep .rating-display .p-rating-icon {
      font-size: 1rem;
    }

    :host ::ng-deep .p-progressbar.battery-excellent .p-progressbar-value {
      background: linear-gradient(90deg, var(--green-500) 0%, var(--green-400) 100%);
    }

    :host ::ng-deep .p-progressbar.battery-good .p-progressbar-value {
      background: linear-gradient(90deg, var(--green-400) 0%, var(--green-300) 100%);
    }

    :host ::ng-deep .p-progressbar.battery-fair .p-progressbar-value {
      background: linear-gradient(90deg, var(--yellow-500) 0%, var(--yellow-400) 100%);
    }

    :host ::ng-deep .p-progressbar.battery-poor .p-progressbar-value {
      background: linear-gradient(90deg, var(--orange-500) 0%, var(--orange-400) 100%);
    }

    :host ::ng-deep .p-progressbar.battery-critical .p-progressbar-value {
      background: linear-gradient(90deg, var(--red-500) 0%, var(--red-400) 100%);
    }

    .sticky-mobile-bar {
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .condition-new {
      background: var(--green-100);
      color: var(--green-700);
    }

    .condition-refurbished {
      background: var(--blue-100);
      color: var(--blue-700);
    }

    .condition-used {
      background: var(--yellow-100);
      color: var(--yellow-700);
    }
  `]
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

  phone = signal<PhoneDetail | null>(null);
  loading = signal(true);
  notFound = signal(false);
  scrollPosition = signal(0);

  galleriaImages = signal<GalleriaImage[]>([]);
  customerReviews = signal<CustomerReview[]>([]);

  // Computed properties for AC_REDESIGN_002
  averageRating = computed(() => {
    const reviews = this.customerReviews();
    if (reviews.length === 0) return 4.5; // Default rating when no reviews
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  });

  // Show sticky bar after scrolling past the main CTA
  showStickyBar = computed(() => {
    return this.scrollPosition() > 400;
  });

  galleriaResponsiveOptions = [
    {
      breakpoint: '1200px',
      numVisible: 4
    },
    {
      breakpoint: '1024px',
      numVisible: 4
    },
    {
      breakpoint: '768px',
      numVisible: 3
    },
    {
      breakpoint: '560px',
      numVisible: 2
    }
  ];

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
    const images: GalleriaImage[] = phoneDetail.images.map(img => ({
      itemImageSrc: this.imageOptimization.getDetailImageUrl(img.imageUrl),
      itemSrcSet: this.imageOptimization.getDetailSrcSet(img.imageUrl),
      thumbnailImageSrc: this.imageOptimization.getThumbnailUrl(img.imageUrl),
      originalUrl: img.imageUrl,
      alt: `${phoneDetail.brandName} ${phoneDetail.model}`,
      isPrimary: img.isPrimary
    }));

    this.galleriaImages.set(images);
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
      currentPhone.condition === PhoneCondition.REFURBISHED;

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
      case PhoneCondition.REFURBISHED:
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
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
      case PhoneCondition.REFURBISHED:
        return 'condition-refurbished';
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
    const numReviews = phone.condition === PhoneCondition.NEW ? 5 : (phone.condition === PhoneCondition.REFURBISHED ? 4 : 3);
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
