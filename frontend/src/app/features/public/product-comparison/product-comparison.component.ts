import { Component, Inject, OnInit, PLATFORM_ID, computed, signal } from '@angular/core';
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
import { ProductService } from '../../../core/services/product.service';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';
import { ProductComparisonService } from '../../../shared/services/product-comparison.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SeoService } from '../../../shared/services/seo.service';
import { Product } from '../../../models/product.model';
import { ProductCondition, ProductConditionLabels } from '../../../enums';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-product-comparison',
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
  templateUrl: './product-comparison.component.html',
  styleUrls: ['./product-comparison.component.scss']
})
export class ProductComparisonComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private imageOptimization: ImageOptimizationService,
    private comparisonService: ProductComparisonService,
    private toastService: ToastService,
    private seoService: SeoService,
    private confirmationService: ConfirmationService,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) { }

  products = signal<Product[]>([]);
  loading = signal(true);
  liveAnnouncement = signal('');

  conditionNew = ProductCondition.NEW;

  // Computed values for highlighting best specs
  lowestPrice = computed(() => {
    const prices = this.products().map(p => p.sellingPrice);
    return prices.length > 0 ? Math.min(...prices) : 0;
  });

  highestStorage = computed(() => {
    const storage = this.products().map(p => p.storageGb ?? 0);
    return storage.length > 0 ? Math.max(...storage) : 0;
  });

  highestRam = computed(() => {
    const ram = this.products().map(p => p.ramGb ?? 0);
    return ram.length > 0 ? Math.max(...ram) : 0;
  });

  highestBatteryHealth = computed(() => {
    const health = this.products()
      .filter(p => p.batteryHealth !== null && p.condition !== ProductCondition.NEW)
      .map(p => p.batteryHealth!);
    return health.length > 0 ? Math.max(...health) : 0;
  });

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Product Comparison',
      description: 'Compare product specifications side by side. Evaluate brand, model, storage, RAM, condition, battery health, and price.',
      url: '/compare'
    });

    this.loadComparisonProducts();
  }

  private async loadComparisonProducts(): Promise<void> {
    this.loading.set(true);

    try {
      const idsParam = this.route.snapshot.queryParamMap.get('ids');
      const serviceProducts = this.comparisonService.products();

      if (serviceProducts.length > 0) {
        this.products.set(serviceProducts);
      } else if (idsParam) {
        const ids = idsParam.split(',').filter(id => id.trim());
        const productPromises = ids.slice(0, 3).map(id => this.productService.getProductById(id.trim()));
        const results = await Promise.all(productPromises);
        const validProducts = results.filter((p): p is Product => p !== null);
        this.products.set(validProducts);
      }
    } catch (error) {
      console.error('Failed to load comparison products:', error);
      this.toastService.error('Error', 'Failed to load products for comparison');
    } finally {
      this.loading.set(false);
    }
  }

  removeProduct(productId: string): void {
    const removedProduct = this.products().find(p => p.id === productId);
    this.comparisonService.remove(productId);
    this.products.update(products => products.filter(p => p.id !== productId));

    if (removedProduct) {
      this.announce(`${removedProduct.brandName} ${removedProduct.model} removed from comparison`);
    }
  }

  confirmClearAll(): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to remove all ${this.products().length} products from comparison?`,
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
    const count = this.products().length;
    this.comparisonService.clear();
    this.products.set([]);
    this.announce(`Cleared ${count} products from comparison`);
  }

  shareComparison(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const ids = this.products().map(p => p.id).join(',');
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

  viewProduct(product: Product): void {
    this.router.navigate(['/product', product.id]);
  }

  goBackToCatalog(): void {
    this.router.navigate(['/']);
  }

  // Highlight helpers for best value indicators
  isBestPrice(price: number): boolean {
    return this.products().length > 1 && price === this.lowestPrice();
  }

  isBestStorage(storage: number | null): boolean {
    return this.products().length > 1 && storage !== null && storage === this.highestStorage() && storage > 0;
  }

  isBestRam(ram: number | null): boolean {
    return this.products().length > 1 && ram !== null && ram === this.highestRam() && ram > 0;
  }

  isBestBatteryHealth(product: Product): boolean {
    return this.products().length > 1 &&
           product.batteryHealth !== null &&
           product.condition !== ProductCondition.NEW &&
           product.batteryHealth === this.highestBatteryHealth();
  }

  getOptimizedUrl(url: string): string {
    return this.imageOptimization.getCardImageUrl(url);
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
