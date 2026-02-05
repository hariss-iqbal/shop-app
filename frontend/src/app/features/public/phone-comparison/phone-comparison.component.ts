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
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';

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
    ConfirmDialogModule,
    AppCurrencyPipe
  ],
  providers: [ConfirmationService],
  templateUrl: './phone-comparison.component.html',
  styleUrls: ['./phone-comparison.component.scss']
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
      case PhoneCondition.OPEN_BOX:
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
