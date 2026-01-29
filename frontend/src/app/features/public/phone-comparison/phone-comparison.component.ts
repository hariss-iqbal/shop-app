import { Component, OnInit, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { PhoneService } from '../../../core/services/phone.service';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';
import { PhoneComparisonService } from '../../../shared/services/phone-comparison.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SeoService } from '../../../shared/services/seo.service';
import { Phone } from '../../../models/phone.model';
import { PhoneCondition, PhoneConditionLabels } from '../../../enums';

@Component({
  selector: 'app-phone-comparison',
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    DividerModule,
    SkeletonModule,
    ProgressBarModule,
    TooltipModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  template: `
    <!-- ARIA Live Region for screen reader announcements -->
    <div aria-live="polite" aria-atomic="true" class="sr-only" style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0);">
      {{ liveAnnouncement() }}
    </div>

    <p-confirmDialog />

    <div class="grid">
      <!-- Back to Catalog -->
      <div class="col-12 mb-3">
        <p-button
          icon="pi pi-arrow-left"
          label="Back to Catalog"
          [text]="true"
          (onClick)="goBackToCatalog()"
        />
      </div>

      <div class="col-12">
        <div class="flex flex-column sm:flex-row align-items-start sm:align-items-center justify-content-between gap-3 mb-4">
          <div>
            <div class="flex align-items-center gap-2 mb-2">
              <i class="pi pi-arrows-h text-primary text-2xl"></i>
              <h1 class="text-3xl font-bold m-0">Phone Comparison</h1>
            </div>
            <p class="text-color-secondary mt-0 mb-0">
              Compare up to 3 phones side by side to find the perfect match
            </p>
          </div>
          @if (phones().length > 0) {
            <div class="flex gap-2 flex-wrap">
              <p-button
                label="Add More"
                icon="pi pi-plus"
                [outlined]="true"
                size="small"
                (onClick)="goBackToCatalog()"
                [disabled]="phones().length >= 3"
                pTooltip="Add more phones to compare"
                tooltipPosition="top"
              />
              <p-button
                label="Share"
                icon="pi pi-share-alt"
                [outlined]="true"
                severity="secondary"
                size="small"
                (onClick)="shareComparison()"
                pTooltip="Copy shareable link"
                tooltipPosition="top"
              />
              <p-button
                label="Clear All"
                icon="pi pi-trash"
                [outlined]="true"
                severity="danger"
                size="small"
                (onClick)="confirmClearAll()"
              />
            </div>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="col-12">
          <p-card>
            <div class="grid">
              @for (_ of [1, 2, 3]; track $index) {
                <div class="col-12 md:col-4">
                  <p-skeleton height="200px" styleClass="mb-3" />
                  <p-skeleton width="70%" styleClass="mb-2" />
                  <p-skeleton width="50%" styleClass="mb-2" />
                  <p-skeleton width="40%" />
                </div>
              }
            </div>
          </p-card>
        </div>
      } @else if (phones().length === 0) {
        <div class="col-12">
          <p-card styleClass="text-center">
            <div class="py-8">
              <div class="flex justify-content-center mb-4">
                <div class="flex align-items-center justify-content-center border-circle surface-100"
                     style="width: 100px; height: 100px;">
                  <i class="pi pi-arrows-h text-5xl text-primary"></i>
                </div>
              </div>
              <h2 class="text-900 text-2xl font-semibold m-0 mb-2">No phones to compare</h2>
              <p class="text-500 mt-0 mb-4 line-height-3 mx-auto" style="max-width: 400px;">
                Select up to 3 phones from the catalog to compare their specifications side by side and find the perfect phone for you.
              </p>
              <p-button
                label="Browse Catalog"
                icon="pi pi-th-large"
                size="large"
                (onClick)="goBackToCatalog()"
              />
            </div>
          </p-card>
        </div>
      } @else if (phones().length === 1) {
        <div class="col-12">
          <p-card styleClass="text-center">
            <div class="py-6">
              <div class="flex justify-content-center mb-4">
                <div class="flex align-items-center justify-content-center border-circle surface-100"
                     style="width: 80px; height: 80px;">
                  <i class="pi pi-plus text-4xl text-primary"></i>
                </div>
              </div>
              <h2 class="text-900 text-xl font-semibold m-0 mb-2">Add one more phone to compare</h2>
              <p class="text-500 mt-0 mb-4">
                You have selected 1 phone. Add at least one more to start comparing.
              </p>
              <div class="flex gap-2 justify-content-center">
                <p-button
                  label="Add More Phones"
                  icon="pi pi-plus"
                  (onClick)="goBackToCatalog()"
                />
                <p-button
                  label="Remove"
                  icon="pi pi-trash"
                  [outlined]="true"
                  severity="secondary"
                  (onClick)="clearAll()"
                />
              </div>
            </div>
            <!-- Show the single selected phone -->
            <p-divider />
            @if (phones()[0]; as singlePhone) {
              <div class="flex align-items-center justify-content-center gap-4 py-4">
                @if (singlePhone.primaryImageUrl) {
                  <img [src]="getOptimizedUrl(singlePhone.primaryImageUrl)"
                       [alt]="singlePhone.brandName + ' ' + singlePhone.model"
                       style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;" />
                }
                <div class="text-left">
                  <div class="text-500 text-sm mb-1">{{ singlePhone.brandName }}</div>
                  <div class="font-bold text-lg">{{ singlePhone.model }}</div>
                  <div class="text-primary font-bold">{{ singlePhone.sellingPrice | currency:'USD':'symbol':'1.0-0' }}</div>
                </div>
              </div>
            }
          </p-card>
        </div>
      } @else {
        <!-- Comparison Count Badge -->
        <div class="col-12 mb-3">
          <div class="flex align-items-center gap-2 text-color-secondary">
            <i class="pi pi-info-circle"></i>
            <span>Comparing {{ phones().length }} phones</span>
            @if (phones().length < 3) {
              <span class="text-primary cursor-pointer" (click)="goBackToCatalog()">
                (Add {{ 3 - phones().length }} more)
              </span>
            }
          </div>
        </div>

        <!-- Phone Images & Names Row -->
        <div class="col-12">
          <p-card>
          <div class="overflow-x-auto">
            <table class="w-full comparison-table" style="border-collapse: separate; border-spacing: 0; min-width: 600px;">
              <!-- Phone Headers -->
              <thead>
                <tr>
                  <th class="text-left p-3 surface-50 border-round-left font-semibold text-color-secondary"
                      style="width: 180px; min-width: 180px;">
                    Specification
                  </th>
                  @for (phone of phones(); track phone.id) {
                    <th class="text-center p-3 surface-50"
                        [class.border-round-right]="$last"
                        style="min-width: 200px;">
                      <div class="flex flex-column align-items-center gap-3">
                        <!-- Phone Image -->
                        @if (phone.primaryImageUrl) {
                          <div class="border-round overflow-hidden"
                               style="width: 140px; height: 140px; background-color: var(--surface-100);">
                            <img
                              [src]="getOptimizedUrl(phone.primaryImageUrl)"
                              [alt]="phone.brandName + ' ' + phone.model"
                              width="140"
                              height="140"
                              class="w-full h-full border-round"
                              style="object-fit: cover;"
                            />
                          </div>
                        } @else {
                          <div class="flex flex-column align-items-center justify-content-center surface-100 border-round"
                               style="width: 140px; height: 140px;">
                            <i class="pi pi-image text-3xl text-400" aria-hidden="true"></i>
                          </div>
                        }
                        <!-- Brand & Model -->
                        <div class="flex flex-column align-items-center gap-1">
                          <div class="flex align-items-center gap-2">
                            @if (phone.brandLogoUrl) {
                              <img [src]="phone.brandLogoUrl" [alt]="phone.brandName"
                                   style="width: 20px; height: 20px; object-fit: contain;" />
                            }
                            <span class="text-500 text-sm">{{ phone.brandName }}</span>
                          </div>
                          <span class="font-bold text-900">{{ phone.model }}</span>
                        </div>
                        <!-- Actions -->
                        <div class="flex gap-2">
                          <p-button
                            icon="pi pi-eye"
                            [rounded]="true"
                            [text]="true"
                            severity="primary"
                            size="small"
                            pTooltip="View details"
                            tooltipPosition="top"
                            (onClick)="viewPhone(phone)"
                          />
                          <p-button
                            icon="pi pi-times"
                            [rounded]="true"
                            [text]="true"
                            severity="danger"
                            size="small"
                            pTooltip="Remove from comparison"
                            tooltipPosition="top"
                            (onClick)="removePhone(phone.id)"
                          />
                        </div>
                      </div>
                    </th>
                  }
                </tr>
              </thead>

              <!-- Spec Rows -->
              <tbody>
                <!-- Price Row -->
                <tr>
                  <td class="p-3 border-bottom-1 surface-border font-medium">
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-dollar text-primary"></i>
                      <span>Price</span>
                    </div>
                  </td>
                  @for (phone of phones(); track phone.id) {
                    <td class="text-center p-3 border-bottom-1 surface-border" [class.best-value-cell]="isBestPrice(phone.sellingPrice)">
                      <div class="flex flex-column align-items-center gap-1">
                        <span class="text-xl font-bold text-primary">
                          {{ phone.sellingPrice | currency:'USD':'symbol':'1.0-0' }}
                        </span>
                        @if (isBestPrice(phone.sellingPrice)) {
                          <span class="best-value-badge">
                            <i class="pi pi-star-fill text-xs mr-1"></i>Best Price
                          </span>
                        }
                      </div>
                    </td>
                  }
                </tr>

                <!-- Brand Row -->
                <tr>
                  <td class="p-3 border-bottom-1 surface-border font-medium">
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-building text-primary"></i>
                      <span>Brand</span>
                    </div>
                  </td>
                  @for (phone of phones(); track phone.id) {
                    <td class="text-center p-3 border-bottom-1 surface-border">
                      <div class="flex align-items-center justify-content-center gap-2">
                        @if (phone.brandLogoUrl) {
                          <img [src]="phone.brandLogoUrl" [alt]="phone.brandName"
                               style="width: 20px; height: 20px; object-fit: contain;" />
                        }
                        <span class="font-medium">{{ phone.brandName }}</span>
                      </div>
                    </td>
                  }
                </tr>

                <!-- Model Row -->
                <tr>
                  <td class="p-3 border-bottom-1 surface-border font-medium">
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-mobile text-primary"></i>
                      <span>Model</span>
                    </div>
                  </td>
                  @for (phone of phones(); track phone.id) {
                    <td class="text-center p-3 border-bottom-1 surface-border font-medium">
                      {{ phone.model }}
                    </td>
                  }
                </tr>

                <!-- Storage Row -->
                <tr>
                  <td class="p-3 border-bottom-1 surface-border font-medium">
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-database text-primary"></i>
                      <span>Storage</span>
                    </div>
                  </td>
                  @for (phone of phones(); track phone.id) {
                    <td class="text-center p-3 border-bottom-1 surface-border" [class.best-value-cell]="isBestStorage(phone.storageGb)">
                      @if (phone.storageGb) {
                        <div class="flex flex-column align-items-center gap-1">
                          <span class="font-medium">{{ phone.storageGb }}GB</span>
                          @if (isBestStorage(phone.storageGb)) {
                            <span class="best-value-badge">
                              <i class="pi pi-check text-xs mr-1"></i>Most
                            </span>
                          }
                        </div>
                      } @else {
                        <span class="text-400">N/A</span>
                      }
                    </td>
                  }
                </tr>

                <!-- RAM Row -->
                <tr>
                  <td class="p-3 border-bottom-1 surface-border font-medium">
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-microchip text-primary"></i>
                      <span>RAM</span>
                    </div>
                  </td>
                  @for (phone of phones(); track phone.id) {
                    <td class="text-center p-3 border-bottom-1 surface-border" [class.best-value-cell]="isBestRam(phone.ramGb)">
                      @if (phone.ramGb) {
                        <div class="flex flex-column align-items-center gap-1">
                          <span class="font-medium">{{ phone.ramGb }}GB</span>
                          @if (isBestRam(phone.ramGb)) {
                            <span class="best-value-badge">
                              <i class="pi pi-check text-xs mr-1"></i>Most
                            </span>
                          }
                        </div>
                      } @else {
                        <span class="text-400">N/A</span>
                      }
                    </td>
                  }
                </tr>

                <!-- Condition Row -->
                <tr>
                  <td class="p-3 border-bottom-1 surface-border font-medium">
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-check-circle text-primary"></i>
                      <span>Condition</span>
                    </div>
                  </td>
                  @for (phone of phones(); track phone.id) {
                    <td class="text-center p-3 border-bottom-1 surface-border">
                      <p-tag
                        [value]="getConditionLabel(phone.condition)"
                        [severity]="getConditionSeverity(phone.condition)"
                      />
                    </td>
                  }
                </tr>

                <!-- Battery Health Row -->
                <tr>
                  <td class="p-3 border-bottom-1 surface-border font-medium">
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-bolt text-primary"></i>
                      <span>Battery Health</span>
                    </div>
                  </td>
                  @for (phone of phones(); track phone.id) {
                    <td class="text-center p-3 border-bottom-1 surface-border" [class.best-value-cell]="isBestBatteryHealth(phone)">
                      @if (phone.batteryHealth !== null && phone.condition !== conditionNew) {
                        <div class="flex flex-column align-items-center gap-2">
                          <span class="font-bold" [ngClass]="getBatteryHealthClass(phone.batteryHealth)">
                            {{ phone.batteryHealth }}%
                          </span>
                          <p-progressBar
                            [value]="phone.batteryHealth"
                            [showValue]="false"
                            styleClass="h-0.5rem w-6rem"
                            [ngClass]="getBatteryProgressClass(phone.batteryHealth)"
                          />
                          @if (isBestBatteryHealth(phone)) {
                            <span class="best-value-badge">
                              <i class="pi pi-check text-xs mr-1"></i>Best
                            </span>
                          }
                        </div>
                      } @else if (phone.condition === conditionNew) {
                        <span class="text-green-600 font-medium">New</span>
                      } @else {
                        <span class="text-400">N/A</span>
                      }
                    </td>
                  }
                </tr>

                <!-- Color Row -->
                <tr>
                  <td class="p-3 border-bottom-1 surface-border font-medium">
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-palette text-primary"></i>
                      <span>Color</span>
                    </div>
                  </td>
                  @for (phone of phones(); track phone.id) {
                    <td class="text-center p-3 border-bottom-1 surface-border">
                      @if (phone.color) {
                        <span class="font-medium">{{ phone.color }}</span>
                      } @else {
                        <span class="text-400">N/A</span>
                      }
                    </td>
                  }
                </tr>
              </tbody>
            </table>
          </div>
          </p-card>
        </div>

        <!-- Quick Actions -->
        <div class="col-12 mt-4">
          <div class="flex flex-wrap gap-2 justify-content-center">
            <p-button
              label="Back to Catalog"
              icon="pi pi-arrow-left"
              [outlined]="true"
              severity="secondary"
              (onClick)="goBackToCatalog()"
            />
            @if (phones().length < 3) {
              <p-button
                label="Add More Phones"
                icon="pi pi-plus"
                [outlined]="true"
                (onClick)="goBackToCatalog()"
              />
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host ::ng-deep .p-progressbar.battery-excellent .p-progressbar-value {
      background: var(--green-500);
    }
    :host ::ng-deep .p-progressbar.battery-good .p-progressbar-value {
      background: var(--green-400);
    }
    :host ::ng-deep .p-progressbar.battery-fair .p-progressbar-value {
      background: var(--yellow-500);
    }
    :host ::ng-deep .p-progressbar.battery-poor .p-progressbar-value {
      background: var(--orange-500);
    }
    :host ::ng-deep .p-progressbar.battery-critical .p-progressbar-value {
      background: var(--red-500);
    }

    .comparison-table tbody tr:hover {
      background-color: var(--surface-hover);
    }

    .comparison-table tbody tr:nth-child(odd) {
      background-color: var(--surface-ground);
    }

    .comparison-table thead th {
      vertical-align: top;
    }

    /* Best value highlighting */
    .best-value-cell {
      background-color: rgba(34, 197, 94, 0.08) !important;
      position: relative;
    }

    .best-value-badge {
      display: inline-flex;
      align-items: center;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);
    }

    /* Dark theme adjustment */
    :host-context(.dark-theme) .best-value-cell {
      background-color: rgba(34, 197, 94, 0.12) !important;
    }
  `]
})
export class PhoneComparisonComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private phoneService = inject(PhoneService);
  private imageOptimization = inject(ImageOptimizationService);
  private comparisonService = inject(PhoneComparisonService);
  private toastService = inject(ToastService);
  private seoService = inject(SeoService);
  private confirmationService = inject(ConfirmationService);
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);

  phones = signal<Phone[]>([]);
  loading = signal(true);
  liveAnnouncement = signal('');

  conditionNew = PhoneCondition.NEW;

  // Computed values for highlighting best specs
  lowestPrice = computed(() => {
    const prices = this.phones().map(p => p.sellingPrice);
    return prices.length > 0 ? Math.min(...prices) : 0;
  });

  highestStorage = computed(() => {
    const storage = this.phones().map(p => p.storageGb ?? 0);
    return storage.length > 0 ? Math.max(...storage) : 0;
  });

  highestRam = computed(() => {
    const ram = this.phones().map(p => p.ramGb ?? 0);
    return ram.length > 0 ? Math.max(...ram) : 0;
  });

  highestBatteryHealth = computed(() => {
    const health = this.phones()
      .filter(p => p.batteryHealth !== null && p.condition !== PhoneCondition.NEW)
      .map(p => p.batteryHealth!);
    return health.length > 0 ? Math.max(...health) : 0;
  });

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Phone Comparison',
      description: 'Compare phone specifications side by side. Evaluate brand, model, storage, RAM, condition, battery health, and price.',
      url: '/compare'
    });

    this.loadComparisonPhones();
  }

  private async loadComparisonPhones(): Promise<void> {
    this.loading.set(true);

    try {
      const idsParam = this.route.snapshot.queryParamMap.get('ids');
      const servicePhones = this.comparisonService.phones();

      if (servicePhones.length > 0) {
        this.phones.set(servicePhones);
      } else if (idsParam) {
        const ids = idsParam.split(',').filter(id => id.trim());
        const phonePromises = ids.slice(0, 3).map(id => this.phoneService.getPhoneById(id.trim()));
        const results = await Promise.all(phonePromises);
        const validPhones = results.filter((p): p is Phone => p !== null);
        this.phones.set(validPhones);
      }
    } catch (error) {
      console.error('Failed to load comparison phones:', error);
      this.toastService.error('Error', 'Failed to load phones for comparison');
    } finally {
      this.loading.set(false);
    }
  }

  removePhone(phoneId: string): void {
    const removedPhone = this.phones().find(p => p.id === phoneId);
    this.comparisonService.remove(phoneId);
    this.phones.update(phones => phones.filter(p => p.id !== phoneId));

    if (removedPhone) {
      this.announce(`${removedPhone.brandName} ${removedPhone.model} removed from comparison`);
    }
  }

  confirmClearAll(): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to remove all ${this.phones().length} phones from comparison?`,
      header: 'Clear Comparison',
      icon: 'pi pi-exclamation-triangle',
      acceptIcon: 'pi pi-check',
      rejectIcon: 'pi pi-times',
      acceptLabel: 'Clear All',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.clearAll();
      }
    });
  }

  clearAll(): void {
    const count = this.phones().length;
    this.comparisonService.clear();
    this.phones.set([]);
    this.announce(`Cleared ${count} phones from comparison`);
  }

  shareComparison(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const ids = this.phones().map(p => p.id).join(',');
    const shareUrl = `${this.document.location.origin}/compare?ids=${ids}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.toastService.success('Link Copied', 'Comparison link copied to clipboard');
        this.announce('Comparison link copied to clipboard');
      }).catch(() => {
        this.fallbackCopyToClipboard(shareUrl);
      });
    } else {
      this.fallbackCopyToClipboard(shareUrl);
    }
  }

  private fallbackCopyToClipboard(text: string): void {
    const textArea = this.document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    this.document.body.appendChild(textArea);
    textArea.select();
    try {
      this.document.execCommand('copy');
      this.toastService.success('Link Copied', 'Comparison link copied to clipboard');
      this.announce('Comparison link copied to clipboard');
    } catch {
      this.toastService.error('Error', 'Failed to copy link. Please copy the URL manually.');
    }
    this.document.body.removeChild(textArea);
  }

  private announce(message: string): void {
    this.liveAnnouncement.set('');
    setTimeout(() => this.liveAnnouncement.set(message), 100);
  }

  viewPhone(phone: Phone): void {
    this.router.navigate(['/phone', phone.id]);
  }

  goBackToCatalog(): void {
    this.router.navigate(['/']);
  }

  // Highlight helpers for best value indicators
  isBestPrice(price: number): boolean {
    return this.phones().length > 1 && price === this.lowestPrice();
  }

  isBestStorage(storage: number | null): boolean {
    return this.phones().length > 1 && storage !== null && storage === this.highestStorage() && storage > 0;
  }

  isBestRam(ram: number | null): boolean {
    return this.phones().length > 1 && ram !== null && ram === this.highestRam() && ram > 0;
  }

  isBestBatteryHealth(phone: Phone): boolean {
    return this.phones().length > 1 &&
           phone.batteryHealth !== null &&
           phone.condition !== PhoneCondition.NEW &&
           phone.batteryHealth === this.highestBatteryHealth();
  }

  getOptimizedUrl(url: string): string {
    return this.imageOptimization.getCardImageUrl(url);
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
}
