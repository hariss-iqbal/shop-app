import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';
import { ProductComparisonService } from '../../services/product-comparison.service';
import { BlurUpImageDirective } from '../../directives/blur-up-image.directive';
import { AppCurrencyPipe } from '../../pipes/app-currency.pipe';
import { Product } from '../../../models/product.model';
import { ProductCondition, ProductConditionLabels } from '../../../enums';

@Component({
  selector: 'app-product-card',
  imports: [
    CommonModule,
    FormsModule,
    TagModule,
    RatingModule,
    ButtonModule,
    TooltipModule,
    BlurUpImageDirective,
    AppCurrencyPipe
  ],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  constructor(
    private imageOptimization: ImageOptimizationService,
    private comparisonService: ProductComparisonService,
    private router: Router
  ) { }

  // Inputs
  product = input.required<Product>();
  index = input<number | undefined>(undefined);
  eagerLoad = input(false);
  showCompareButton = input(true);
  showBadges = input(true);
  showRating = input(false);
  showSpecs = input(true);
  showDiscount = input(true);

  // Outputs
  compareToggled = output<{ product: Product; result: 'added' | 'removed' | 'full' }>();

  // Computed signals
  productExtras = computed(() => {
    const p = this.product();
    const idx = this.index();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const createdAt = new Date(p.createdAt);
    const isNewArrival = createdAt >= sevenDaysAgo;

    const hasDiscount = p.profitMargin >= 20;
    const discountPercent = hasDiscount ? Math.round(p.profitMargin) : 0;
    const originalPrice = hasDiscount
      ? Math.round(p.sellingPrice * (1 + discountPercent / 100))
      : null;

    let rating = 4;
    if (p.condition === ProductCondition.NEW) {
      rating = 5;
    } else if (p.condition === ProductCondition.OPEN_BOX) {
      rating = 4;
    } else {
      rating = p.batteryHealth ? Math.min(5, Math.max(3, Math.round(p.batteryHealth / 25))) : 3;
    }

    const isTopSeller = idx !== undefined && !isNewArrival && !hasDiscount && idx < 12 && idx % 3 === 0;

    return { isNewArrival, hasDiscount, discountPercent, originalPrice, rating, isTopSeller, isFeatured: p.isFeatured };
  });

  cardImageUrl = computed(() => {
    const url = this.product().primaryImageUrl;
    return url ? this.imageOptimization.getCardImageUrl(url) : null;
  });

  cardSrcSet = computed(() => {
    const url = this.product().primaryImageUrl;
    return url ? this.imageOptimization.getCardSrcSet(url) : '';
  });

  isCompareSelected = computed(() => {
    return this.comparisonService.isSelected(this.product().id);
  });

  navigateToDetail(): void {
    this.router.navigate(['/product', this.product().id]);
  }

  toggleCompare(event: Event): void {
    event.stopPropagation();
    const result = this.comparisonService.toggle(this.product());
    this.compareToggled.emit({ product: this.product(), result });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.includes('photo-1695048133142-1a20484d2569')) {
      img.src = 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=400&fit=crop';
    }
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
}
