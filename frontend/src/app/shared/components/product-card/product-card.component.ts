import { Component, inject, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';
import { PhoneComparisonService } from '../../services/phone-comparison.service';
import { BlurUpImageDirective } from '../../directives/blur-up-image.directive';
import { AppCurrencyPipe } from '../../pipes/app-currency.pipe';
import { Phone } from '../../../models/phone.model';
import { PhoneCondition, PhoneConditionLabels } from '../../../enums';

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
  private imageOptimization = inject(ImageOptimizationService);
  private comparisonService = inject(PhoneComparisonService);
  private router = inject(Router);

  // Inputs
  phone = input.required<Phone>();
  index = input<number | undefined>(undefined);
  eagerLoad = input(false);
  showCompareButton = input(true);
  showBadges = input(true);
  showRating = input(true);
  showSpecs = input(true);
  showDiscount = input(true);

  // Outputs
  compareToggled = output<{ phone: Phone; result: 'added' | 'removed' | 'full' }>();

  // Computed signals
  phoneExtras = computed(() => {
    const p = this.phone();
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
    if (p.condition === PhoneCondition.NEW) {
      rating = 5;
    } else if (p.condition === PhoneCondition.OPEN_BOX) {
      rating = 4;
    } else {
      rating = p.batteryHealth ? Math.min(5, Math.max(3, Math.round(p.batteryHealth / 25))) : 3;
    }

    const isTopSeller = idx !== undefined && !isNewArrival && !hasDiscount && idx < 12 && idx % 3 === 0;

    return { isNewArrival, hasDiscount, discountPercent, originalPrice, rating, isTopSeller };
  });

  cardImageUrl = computed(() => {
    const url = this.phone().primaryImageUrl;
    return url ? this.imageOptimization.getCardContainUrl(url) : null;
  });

  cardSrcSet = computed(() => {
    const url = this.phone().primaryImageUrl;
    return url ? this.imageOptimization.getCardSrcSet(url) : '';
  });

  isCompareSelected = computed(() => {
    return this.comparisonService.isSelected(this.phone().id);
  });

  navigateToDetail(): void {
    this.router.navigate(['/phone', this.phone().id]);
  }

  toggleCompare(event: Event): void {
    event.stopPropagation();
    const result = this.comparisonService.toggle(this.phone());
    this.compareToggled.emit({ phone: this.phone(), result });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.includes('photo-1695048133142-1a20484d2569')) {
      img.src = 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=400&fit=crop';
    }
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
}
