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
import { Phone } from '../../../models/phone.model';
import { Brand } from '../../../models/brand.model';
import { PhoneStatus, PhoneCondition, PhoneConditionLabels } from '../../../enums';

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
  type: 'brand' | 'condition' | 'storage' | 'price' | 'search';
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
    BlurUpImageDirective
  ],
  styles: [`
    .catalog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }
    .catalog-container {
      width: 100%;
      padding: 0 1rem;
    }
    .sale-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 4px;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
    }
    .new-arrival-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 4px;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
    }
    .top-seller-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 4px;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(217, 119, 6, 0.3);
    }
    .original-price {
      text-decoration: line-through;
      opacity: 0.7;
    }
    .discount-price {
      color: var(--p-red-500);
      font-weight: 700;
    }
    .section-header {
      border-bottom: 2px solid var(--p-primary-500);
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }
    .section-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .quick-action-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
      padding: 2rem 1rem 1rem;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .phone-card-focusable:hover .quick-action-overlay {
      opacity: 1;
    }
    @media (max-width: 575px) {
      .quick-action-overlay {
        opacity: 1;
        background: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%);
      }
    }
  `],
  template: `
    <div class="catalog-container">
      <div class="grid">
      <!-- Hero Header -->
      <div class="col-12 mb-4">
        <div class="surface-card border-round-xl p-4 sm:p-6" style="background: linear-gradient(135deg, var(--primary-50) 0%, var(--surface-card) 100%);">
          <div class="flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between gap-3">
            <div>
              <h1 class="text-3xl sm:text-4xl font-bold m-0 mb-2 text-primary">Phone Catalog</h1>
              <p class="text-color-secondary mt-0 mb-0 text-lg">Discover our curated selection of premium smartphones</p>
            </div>
            <div class="flex align-items-center gap-3">
              <span class="text-color-secondary text-sm hidden sm:inline">View:</span>
              <p-selectButton
                [options]="viewOptions"
                [(ngModel)]="viewMode"
                optionLabel="icon"
                optionValue="value"
                [unselectable]="true"
                aria-label="Switch between grid and list view"
              >
                <ng-template let-item pTemplate="item">
                  <i [class]="item.icon" [pTooltip]="item.tooltip" tooltipPosition="top"></i>
                </ng-template>
              </p-selectButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Section Tabs -->
      <div class="col-12 mb-3">
        <div class="flex flex-wrap gap-2">
          @for (section of sectionOptions; track section.value) {
            <button
              type="button"
              class="p-button p-component"
              [class.p-button-outlined]="currentSection !== section.value"
              [class.p-button-primary]="currentSection === section.value"
              (click)="switchSection(section.value)"
              [attr.aria-pressed]="currentSection === section.value"
            >
              <i [class]="section.icon + ' mr-2'"></i>
              <span>{{ section.label }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Section Header with Description - AC_REDESIGN_002 -->
      @if (currentSectionInfo()) {
        <div class="col-12 mb-3">
          <div class="section-header">
            <div class="flex align-items-center gap-3">
              <div class="section-icon" [style.background]="getSectionIconBg()">
                <i [class]="currentSectionInfo()!.icon + ' text-white'"></i>
              </div>
              <div>
                <h2 class="text-2xl font-bold m-0 mb-1">{{ currentSectionInfo()!.label }}</h2>
                <p class="text-color-secondary m-0">{{ currentSectionInfo()!.description }}</p>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Filters -->
      <div class="col-12">
        <p-card aria-label="Filter and sort options">
          <ng-template pTemplate="header">
            <div class="flex align-items-center justify-content-between px-3 pt-3">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-filter text-primary"></i>
                <span class="font-semibold">Filters</span>
                @if (activeFilters().length > 0) {
                  <p-badge [value]="activeFilters().length.toString()" severity="info" />
                }
              </div>
              @if (hasActiveFilters()) {
                <p-button
                  label="Clear All"
                  icon="pi pi-filter-slash"
                  [text]="true"
                  severity="secondary"
                  size="small"
                  (onClick)="clearFilters()"
                />
              }
            </div>
          </ng-template>
          <div class="grid align-items-end">
            <!-- Search -->
            <div class="col-12 md:col-6 lg:col-3">
              <label for="search" class="block font-medium mb-2">Search</label>
              <p-iconfield styleClass="w-full">
                <p-inputicon styleClass="pi pi-search" />
                <input
                  id="search"
                  pInputText
                  [(ngModel)]="searchQuery"
                  (input)="onSearchInput($event)"
                  class="w-full"
                  placeholder="Search by brand or model..."
                  aria-describedby="search-hint"
                />
                @if (searchQuery) {
                  <p-inputicon styleClass="pi pi-times cursor-pointer" (click)="clearSearch()" />
                }
              </p-iconfield>
              <small id="search-hint" class="text-500 text-xs mt-1 block" style="visibility: hidden; height: 0;">Results update as you type</small>
            </div>

            <!-- Brand Filter -->
            <div class="col-12 md:col-6 lg:col-3">
              <label for="brand" class="block font-medium mb-2">Brand</label>
              <p-select
                id="brand"
                [options]="brandOptions()"
                [(ngModel)]="selectedBrandId"
                (onChange)="onFilterChange()"
                optionLabel="name"
                optionValue="id"
                [showClear]="true"
                placeholder="All Brands"
                styleClass="w-full"
              >
                <ng-template let-brand pTemplate="selectedItem">
                  @if (brand) {
                    <div class="flex align-items-center gap-2">
                      @if (brand.logoUrl) {
                        <img [src]="brand.logoUrl" [alt]="brand.name" style="width: 20px; height: 20px; object-fit: contain;" (error)="onImageError($event)" />
                      }
                      <span>{{ brand.name }}</span>
                    </div>
                  }
                </ng-template>
                <ng-template let-brand pTemplate="item">
                  <div class="flex align-items-center gap-2">
                    @if (brand.logoUrl) {
                      <img [src]="brand.logoUrl" [alt]="brand.name" style="width: 24px; height: 24px; object-fit: contain;" (error)="onImageError($event)" />
                    } @else if (brand.id) {
                      <p-avatar [label]="brand.name.charAt(0).toUpperCase()" size="normal" shape="circle" />
                    } @else {
                      <i class="pi pi-list text-500"></i>
                    }
                    <span>{{ brand.name }}</span>
                  </div>
                </ng-template>
              </p-select>
            </div>

            <!-- Condition Multi-Select -->
            <div class="col-12 md:col-6 lg:col-3">
              <label for="condition" class="block font-medium mb-2">Condition</label>
              <p-multiSelect
                id="condition"
                [options]="conditionOptions"
                [(ngModel)]="selectedConditions"
                (onChange)="onFilterChange()"
                optionLabel="label"
                optionValue="value"
                placeholder="All Conditions"
                styleClass="w-full"
                [showClear]="true"
                display="chip"
              />
            </div>

            <!-- Sort -->
            <div class="col-12 md:col-6 lg:col-3">
              <label for="sort" class="block font-medium mb-2">Sort By</label>
              <p-select
                id="sort"
                [options]="sortOptions"
                [(ngModel)]="selectedSort"
                (onChange)="onSortChange()"
                optionLabel="label"
                styleClass="w-full"
                aria-label="Sort catalog by"
              >
                <ng-template let-sort pTemplate="selectedItem">
                  @if (sort) {
                    <div class="flex align-items-center gap-2">
                      <i [class]="sort.icon + ' text-primary'" aria-hidden="true"></i>
                      <span>{{ sort.label }}</span>
                    </div>
                  }
                </ng-template>
                <ng-template let-sort pTemplate="item">
                  <div class="flex align-items-center justify-content-between w-full gap-3">
                    <div class="flex align-items-center gap-2">
                      <i [class]="sort.icon + ' text-500'" aria-hidden="true"></i>
                      <span>{{ sort.label }}</span>
                    </div>
                    @if (sort.value === selectedSort.value) {
                      <i class="pi pi-check text-primary font-bold" aria-hidden="true"></i>
                    }
                  </div>
                </ng-template>
              </p-select>
            </div>

            <!-- Storage Filter -->
            <div class="col-12 md:col-6 lg:col-3">
              <label for="storage" class="block font-medium mb-2">Storage</label>
              <p-multiSelect
                id="storage"
                [options]="storageOptions()"
                [(ngModel)]="selectedStorageValues"
                (onChange)="onFilterChange()"
                optionLabel="label"
                optionValue="value"
                placeholder="All Storage Options"
                styleClass="w-full"
                [showClear]="true"
                display="chip"
              />
            </div>

            <!-- Price Range Slider -->
            <div class="col-12 md:col-6 lg:col-6">
              <label class="block font-medium mb-2">
                Price Range: {{ priceRange[0] | currency:'USD':'symbol':'1.0-0' }} - {{ priceRange[1] | currency:'USD':'symbol':'1.0-0' }}
              </label>
              <p-slider
                [(ngModel)]="priceRange"
                [range]="true"
                [min]="priceMin()"
                [max]="priceMax()"
                [step]="10"
                (onSlideEnd)="onPriceRangeChange()"
                styleClass="w-full"
              />
            </div>

          </div>

          <!-- Active Filter Chips -->
          @if (activeFilters().length > 0) {
            <p-divider />
            <div class="flex flex-wrap gap-2 align-items-center">
              <span class="text-color-secondary text-sm mr-2">Active Filters:</span>
              @for (filter of activeFilters(); track filter.type + '-' + filter.value) {
                <p-chip
                  [label]="filter.label"
                  [removable]="true"
                  (onRemove)="removeFilter(filter)"
                  styleClass="surface-200"
                />
              }
            </div>
          }
        </p-card>
      </div>

      <!-- Results -->
      <div class="col-12">
        @if (loading()) {
          <!-- Loading Skeletons - Grid View -->
          @if (viewMode === 'grid') {
            <div class="grid">
              @for (_ of skeletonItems; track $index) {
                <div class="col-12 sm:col-6 lg:col-4 xl:col-3">
                  <p-card>
                    <p-skeleton height="200px" styleClass="mb-3" />
                    <p-skeleton width="60%" styleClass="mb-2" />
                    <p-skeleton width="80%" styleClass="mb-2" />
                    <p-skeleton width="40%" />
                  </p-card>
                </div>
              }
            </div>
          } @else {
            <!-- Loading Skeletons - List View -->
            <div class="flex flex-column gap-3">
              @for (_ of skeletonItems.slice(0, 5); track $index) {
                <p-card>
                  <div class="flex flex-column sm:flex-row gap-4">
                    <p-skeleton width="120px" height="120px" />
                    <div class="flex-grow-1">
                      <p-skeleton width="40%" height="1.5rem" styleClass="mb-2" />
                      <p-skeleton width="60%" styleClass="mb-2" />
                      <p-skeleton width="30%" />
                    </div>
                    <p-skeleton width="100px" height="2rem" />
                  </div>
                </p-card>
              }
            </div>
          }
        } @else if (phones().length === 0) {
          <p-card>
            <div class="text-center py-6">
              <i class="pi pi-search text-4xl text-500 mb-3" style="display: block;"></i>
              <p class="text-900 text-xl font-semibold m-0">No phones found</p>
              <p class="text-500 mt-2 mb-4">
                @if (hasActiveFilters()) {
                  No phones match your current filters
                } @else {
                  No phones are currently available
                }
              </p>
              @if (hasActiveFilters()) {
                <p-button
                  label="Clear All Filters"
                  icon="pi pi-filter-slash"
                  [outlined]="true"
                  (onClick)="clearFilters()"
                />
              }
            </div>
          </p-card>
        } @else {
          <!-- F-042: Live region for screen readers to announce result count changes -->
          <div aria-live="polite" aria-atomic="true" class="sr-only" style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0);">
            {{ totalRecords() }} phones found
          </div>

          <!-- Grid View - AC_REDESIGN_001 & AC_REDESIGN_003 -->
          @if (viewMode === 'grid') {
            <div class="catalog-grid fadein animation-duration-300" role="list" aria-label="Phone catalog grid">
              @for (phone of phonesWithExtras(); track phone.id) {
                <div role="listitem"
                     tabindex="0"
                     class="phone-card-focusable"
                     [attr.aria-label]="phone.brandName + ' ' + phone.model + ', ' + getConditionLabel(phone.condition) + ', ' + (phone.sellingPrice | currency:'USD':'symbol':'1.0-0') + '. Press Enter to view details.'"
                     appPhoneCardKeyboard
                     (cardActivated)="viewPhone(phone)"
                     (click)="viewPhone(phone)">
                  <div class="surface-card border-round-xl h-full cursor-pointer p-3 hover:surface-ground transition-all">
                    <div class="relative mb-3 overflow-hidden border-round-lg" style="height: 200px; background: var(--p-surface-100);">
                      <!-- Sale/New Arrival/Top Seller Badge - AC_REDESIGN_001 -->
                      @if (phone.hasDiscount && phone.discountPercent >= 15) {
                        <span class="sale-badge">
                          <i class="pi pi-tag mr-1"></i>{{ phone.discountPercent }}% OFF
                        </span>
                      } @else if (phone.isNewArrival) {
                        <span class="new-arrival-badge">
                          <i class="pi pi-sparkles mr-1"></i>NEW
                        </span>
                      } @else if (phone.isTopSeller) {
                        <span class="top-seller-badge">
                          <i class="pi pi-star-fill mr-1"></i>TOP
                        </span>
                      }

                      @if (phone.primaryImageUrl) {
                        <img
                          [src]="getCardOptimizedUrl(phone.primaryImageUrl)"
                          [srcset]="getCardSrcSet(phone.primaryImageUrl)"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          [alt]="phone.brandName + ' ' + phone.model"
                          width="300"
                          height="200"
                          [loading]="$index < 4 ? 'eager' : 'lazy'"
                          [appBlurUpImage]="phone.primaryImageUrl"
                          [blurUpDisabled]="$index < 4"
                          class="w-full h-full"
                          style="object-fit: cover;"
                          (error)="onImageError($event)"
                        />
                      } @else {
                        <div class="w-full h-full flex flex-column align-items-center justify-content-center surface-100">
                          <i class="pi pi-image text-4xl text-400 mb-2" aria-hidden="true"></i>
                          <span class="text-400 text-xs">No image available</span>
                        </div>
                      }

                      <!-- Condition Tag -->
                      <p-tag
                        [value]="getConditionLabel(phone.condition)"
                        [severity]="getConditionSeverity(phone.condition)"
                        styleClass="absolute"
                        [style]="{ bottom: '10px', right: '10px' }"
                      />

                      <!-- Quick Action Overlay -->
                      <div class="quick-action-overlay flex justify-content-center gap-2">
                        <p-button
                          icon="pi pi-eye"
                          [rounded]="true"
                          severity="contrast"
                          pTooltip="Quick View"
                          tooltipPosition="top"
                          (onClick)="viewPhone(phone); $event.stopPropagation()"
                          tabindex="-1"
                        />
                        <p-button
                          [icon]="isPhoneSelected(phone.id) ? 'pi pi-check' : 'pi pi-clone'"
                          [rounded]="true"
                          [severity]="isPhoneSelected(phone.id) ? 'success' : 'contrast'"
                          [pTooltip]="isPhoneSelected(phone.id) ? 'In comparison' : 'Add to compare'"
                          tooltipPosition="top"
                          (onClick)="toggleCompare($event, phone)"
                          tabindex="-1"
                        />
                      </div>
                    </div>

                    <!-- Brand & Model -->
                    <div class="flex align-items-center gap-2 mb-2">
                      @if (phone.brandLogoUrl) {
                        <img [src]="phone.brandLogoUrl" [alt]="phone.brandName" style="width: 20px; height: 20px; object-fit: contain;" (error)="onImageError($event)" />
                      }
                      <span class="text-500 text-sm font-medium">{{ phone.brandName }}</span>
                    </div>

                    <h3 class="text-lg font-bold m-0 mb-2 white-space-nowrap overflow-hidden text-overflow-ellipsis text-900">
                      {{ phone.model }}
                    </h3>

                    <!-- Rating Stars - AC_REDESIGN_001 -->
                    <div class="flex align-items-center gap-2 mb-2 rating-stars">
                      <p-rating
                        [ngModel]="phone.rating"
                        [readonly]="true"
                        [stars]="5"
                      />
                      <span class="text-500 text-xs">({{ phone.rating }}.0)</span>
                    </div>

                    <!-- Specs -->
                    <div class="flex align-items-center gap-2 text-500 text-sm mb-3">
                      @if (phone.storageGb) {
                        <span class="surface-100 px-2 py-1 border-round text-xs font-medium">{{ phone.storageGb }}GB</span>
                      }
                      @if (phone.color) {
                        <span class="surface-100 px-2 py-1 border-round text-xs font-medium">{{ phone.color }}</span>
                      }
                    </div>

                    <!-- Price with Discount Strikethrough - AC_REDESIGN_001 -->
                    <div class="flex align-items-center justify-content-between mt-auto">
                      <div class="flex flex-column">
                        @if (phone.hasDiscount && phone.originalPrice) {
                          <span class="original-price">{{ phone.originalPrice | currency:'USD':'symbol':'1.0-0' }}</span>
                        }
                        <span class="text-xl font-bold" [class.discount-price]="phone.hasDiscount" [class.text-primary]="!phone.hasDiscount">
                          {{ phone.sellingPrice | currency:'USD':'symbol':'1.0-0' }}
                        </span>
                      </div>
                      <p-button
                        icon="pi pi-arrow-right"
                        [rounded]="true"
                        [text]="true"
                        severity="primary"
                        ariaLabel="View details"
                        tabindex="-1"
                      />
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <!-- List View - Redesigned -->
            <div class="flex flex-column gap-3 fadein animation-duration-300" role="list" aria-label="Phone catalog list">
              @for (phone of phonesWithExtras(); track phone.id) {
                <div role="listitem"
                     tabindex="0"
                     class="phone-card-focusable"
                     [attr.aria-label]="phone.brandName + ' ' + phone.model + ', ' + getConditionLabel(phone.condition) + ', ' + (phone.sellingPrice | currency:'USD':'symbol':'1.0-0') + '. Press Enter to view details.'"
                     appPhoneCardKeyboard
                     (cardActivated)="viewPhone(phone)"
                     (click)="viewPhone(phone)">
                  <div class="surface-card border-round-xl cursor-pointer p-3 sm:p-4 hover:surface-ground transition-all">
                    <div class="flex flex-column sm:flex-row gap-4">
                      <!-- Image with Badges -->
                      <div class="flex-shrink-0 relative">
                        @if (phone.hasDiscount && phone.discountPercent >= 15) {
                          <span class="sale-badge" style="top: 8px; left: 8px;">
                            {{ phone.discountPercent }}% OFF
                          </span>
                        } @else if (phone.isNewArrival) {
                          <span class="new-arrival-badge" style="top: 8px; left: 8px;">
                            NEW
                          </span>
                        } @else if (phone.isTopSeller) {
                          <span class="top-seller-badge" style="top: 8px; left: 8px;">
                            TOP
                          </span>
                        }

                        @if (phone.primaryImageUrl) {
                          <div class="overflow-hidden border-round-lg" style="width: 140px; height: 140px; background: var(--p-surface-100);">
                            <img
                              [src]="getListOptimizedUrl(phone.primaryImageUrl)"
                              [srcset]="getListSrcSet(phone.primaryImageUrl)"
                              sizes="140px"
                              [alt]="phone.brandName + ' ' + phone.model"
                              width="140"
                              height="140"
                              loading="lazy"
                              [appBlurUpImage]="phone.primaryImageUrl"
                              class="w-full h-full"
                              style="object-fit: cover;"
                              (error)="onImageError($event)"
                            />
                          </div>
                        } @else {
                          <div class="flex flex-column align-items-center justify-content-center surface-100 border-round-lg" style="width: 140px; height: 140px;">
                            <i class="pi pi-image text-3xl text-400 mb-1" aria-hidden="true"></i>
                            <span class="text-400 text-xs">No image</span>
                          </div>
                        }
                      </div>

                      <!-- Details -->
                      <div class="flex-grow-1 flex flex-column justify-content-between">
                        <div>
                          <div class="flex align-items-center flex-wrap gap-2 mb-2">
                            @if (phone.brandLogoUrl) {
                              <img [src]="phone.brandLogoUrl" [alt]="phone.brandName" style="width: 24px; height: 24px; object-fit: contain;" (error)="onImageError($event)" />
                            }
                            <span class="text-600 font-medium">{{ phone.brandName }}</span>
                            <p-tag
                              [value]="getConditionLabel(phone.condition)"
                              [severity]="getConditionSeverity(phone.condition)"
                            />
                          </div>

                          <h3 class="text-xl font-bold m-0 mb-2 text-900">
                            {{ phone.model }}
                          </h3>

                          <!-- Rating Stars -->
                          <div class="flex align-items-center gap-2 mb-3 rating-stars">
                            <p-rating
                              [ngModel]="phone.rating"
                              [readonly]="true"
                              [stars]="5"
                            />
                            <span class="text-500 text-sm">({{ phone.rating }}.0)</span>
                          </div>

                          <div class="flex align-items-center flex-wrap gap-2">
                            @if (phone.storageGb) {
                              <span class="surface-100 px-3 py-1 border-round-lg text-sm font-medium flex align-items-center gap-1">
                                <i class="pi pi-database text-primary" aria-hidden="true"></i>
                                {{ phone.storageGb }}GB
                              </span>
                            }
                            @if (phone.ramGb) {
                              <span class="surface-100 px-3 py-1 border-round-lg text-sm font-medium flex align-items-center gap-1">
                                <i class="pi pi-microchip text-primary" aria-hidden="true"></i>
                                {{ phone.ramGb }}GB RAM
                              </span>
                            }
                            @if (phone.color) {
                              <span class="surface-100 px-3 py-1 border-round-lg text-sm font-medium flex align-items-center gap-1">
                                <i class="pi pi-palette text-primary" aria-hidden="true"></i>
                                {{ phone.color }}
                              </span>
                            }
                          </div>
                        </div>
                      </div>

                      <!-- Price & Action -->
                      <div class="flex sm:flex-column align-items-center sm:align-items-end justify-content-between sm:justify-content-center gap-3">
                        <div class="text-right">
                          @if (phone.hasDiscount && phone.originalPrice) {
                            <span class="original-price block">{{ phone.originalPrice | currency:'USD':'symbol':'1.0-0' }}</span>
                          }
                          <span class="text-2xl font-bold" [class.discount-price]="phone.hasDiscount" [class.text-primary]="!phone.hasDiscount">
                            {{ phone.sellingPrice | currency:'USD':'symbol':'1.0-0' }}
                          </span>
                          @if (phone.hasDiscount && phone.discountPercent >= 10) {
                            <span class="block text-sm font-semibold text-green-600 mt-1">
                              Save {{ phone.discountPercent }}%
                            </span>
                          }
                        </div>
                        <div class="flex flex-column gap-2">
                          <p-button
                            label="View Details"
                            icon="pi pi-arrow-right"
                            iconPos="right"
                            size="small"
                            tabindex="-1"
                          />
                          <p-button
                            [label]="isPhoneSelected(phone.id) ? 'Compared' : 'Compare'"
                            [icon]="isPhoneSelected(phone.id) ? 'pi pi-check' : 'pi pi-clone'"
                            [outlined]="true"
                            [severity]="isPhoneSelected(phone.id) ? 'success' : 'secondary'"
                            size="small"
                            (onClick)="toggleCompare($event, phone)"
                            tabindex="-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Pagination -->
          @if (totalRecords() > pageSize) {
            <div class="col-12 mt-4" role="navigation" aria-label="Catalog pagination">
              <p-paginator
                [rows]="pageSize"
                [totalRecords]="totalRecords()"
                [first]="first"
                (onPageChange)="onPageChange($event)"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} phones"
                [rowsPerPageOptions]="[12, 24, 48]"
                [showFirstLastIcon]="true"
                [showPageLinks]="true"
                [showJumpToPageDropdown]="totalRecords() > 100"
                styleClass="justify-content-center"
              />
            </div>
          }
        }
      </div>
    </div>
    </div>

    <!-- Floating Comparison Bar -->
    @if (comparisonService.hasPhones()) {
      <div class="fixed bottom-0 left-0 right-0 z-5 surface-overlay shadow-8 border-top-1 surface-border px-3 py-3 sm:px-4 lg:px-6 fadein animation-duration-300">
        <div class="flex align-items-center justify-content-between gap-3 flex-wrap">
          <div class="flex align-items-center gap-3 flex-wrap flex-grow-1">
            <span class="font-semibold white-space-nowrap">
              Compare ({{ comparisonService.count() }}/3):
            </span>
            @for (phone of comparisonService.phones(); track phone.id) {
              <div class="flex align-items-center gap-2 surface-100 border-round px-3 py-2">
                @if (phone.primaryImageUrl) {
                  <img [src]="getCardOptimizedUrl(phone.primaryImageUrl)"
                       [alt]="phone.brandName + ' ' + phone.model"
                       style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px;"
                       (error)="onImageError($event)" />
                }
                <span class="text-sm font-medium white-space-nowrap">{{ phone.brandName }} {{ phone.model }}</span>
                <p-button
                  icon="pi pi-times"
                  [rounded]="true"
                  [text]="true"
                  severity="danger"
                  size="small"
                  (onClick)="removeFromCompare(phone.id)"
                  ariaLabel="Remove from comparison"
                />
              </div>
            }
          </div>
          <div class="flex align-items-center gap-2">
            <p-button
              label="Clear"
              [text]="true"
              severity="secondary"
              size="small"
              (onClick)="clearComparison()"
            />
            <p-button
              label="Compare Now"
              icon="pi pi-arrows-h"
              [disabled]="!comparisonService.canCompare()"
              (onClick)="goToComparison()"
              size="small"
            />
          </div>
        </div>
      </div>
    }
  `
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

  // Computed property to add extra display fields to phones - AC_REDESIGN_001
  phonesWithExtras = computed((): PhoneWithExtras[] => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return this.phones().map((phone, index) => {
      const createdAt = new Date(phone.createdAt);
      const isNewArrival = createdAt >= sevenDaysAgo;

      // Simulate discount based on profit margin (phones with high margin are "discounts")
      const hasDiscount = phone.profitMargin >= 20;
      const discountPercent = hasDiscount ? Math.round(phone.profitMargin) : 0;

      // Calculate original price from selling price and profit margin if there's a "discount"
      const originalPrice = hasDiscount
        ? Math.round(phone.sellingPrice * (1 + discountPercent / 100))
        : null;

      // Simulate rating based on condition (new = 5, refurbished = 4, used = 3-4)
      let rating = 4;
      if (phone.condition === PhoneCondition.NEW) {
        rating = 5;
      } else if (phone.condition === PhoneCondition.REFURBISHED) {
        rating = 4;
      } else {
        rating = phone.batteryHealth ? Math.min(5, Math.max(3, Math.round(phone.batteryHealth / 25))) : 3;
      }

      // Top sellers: index-based simulation (every 3rd item in first 12)
      const isTopSeller = !isNewArrival && !hasDiscount && index < 12 && index % 3 === 0;

      return {
        ...phone,
        isNewArrival,
        isTopSeller,
        hasDiscount,
        discountPercent,
        originalPrice,
        rating
      };
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
    { label: PhoneConditionLabels[PhoneCondition.REFURBISHED], value: PhoneCondition.REFURBISHED }
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
      description: 'Browse our wide selection of new, used, and refurbished phones at competitive prices. Filter by brand, condition, storage, and price range.',
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
          search: this.searchQuery || undefined
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
      this.priceRange[0] > min ||
      this.priceRange[1] < max
    );
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedBrandId = null;
    this.selectedConditions = [];
    this.selectedStorageValues = [];
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

  getCardSrcSet(url: string): string {
    return this.imageOptimization.getCardSrcSet(url);
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
      case PhoneCondition.REFURBISHED:
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
