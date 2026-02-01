import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SliderModule } from 'primeng/slider';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';

import { LoyaltyService } from '../../../core';
import { MaxRedeemableResult, PointsEarnedResult, LoyaltyRedemptionPreview } from '../../../models';
import { LoyaltyTier, getLoyaltyTierSeverity } from '../../../enums';

/**
 * Loyalty Redemption Panel Component
 * Reusable component for displaying and selecting loyalty points redemption
 * Feature: F-022 Loyalty Points Integration
 */
@Component({
  selector: 'app-loyalty-redemption-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    SliderModule,
    InputNumberModule,
    TagModule,
    ProgressBarModule,
    TooltipModule,
    MessageModule,
    DividerModule,
    CurrencyPipe,
    DecimalPipe
  ],
  templateUrl: './loyalty-redemption-panel.component.html',
  styleUrls: ['./loyalty-redemption-panel.component.scss']
})
export class LoyaltyRedemptionPanelComponent implements OnChanges {
  private loyaltyService = inject(LoyaltyService);

  @Input() customerId: string | null = null;
  @Input() purchaseAmount: number = 0;
  @Input() useSlider: boolean = true;

  @Output() redemptionChange = new EventEmitter<{ points: number; discount: number }>();
  @Output() enrollCustomer = new EventEmitter<void>();

  loading = signal(false);
  isEnabled = signal(false);
  isEnrolled = signal(false);
  earnedResult = signal<PointsEarnedResult | null>(null);
  redeemableResult = signal<MaxRedeemableResult | null>(null);
  redemptionPreview = signal<LoyaltyRedemptionPreview | null>(null);

  pointsToRedeem: number = 0;

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['customerId'] || changes['purchaseAmount']) {
      await this.loadLoyaltyInfo();
    }
  }

  private async loadLoyaltyInfo() {
    if (!this.customerId || this.purchaseAmount <= 0) {
      this.isEnabled.set(false);
      this.isEnrolled.set(false);
      this.earnedResult.set(null);
      this.redeemableResult.set(null);
      return;
    }

    this.loading.set(true);
    try {
      // Check if loyalty is enabled and get earned points
      const earned = await this.loyaltyService.calculatePointsEarned(
        this.customerId,
        this.purchaseAmount
      );
      this.earnedResult.set(earned);
      this.isEnabled.set(earned.isEnabled);
      this.isEnrolled.set(earned.isEnrolled);

      if (earned.isEnabled && earned.isEnrolled) {
        // Get redeemable points
        const redeemable = await this.loyaltyService.calculateMaxRedeemable(
          this.customerId,
          this.purchaseAmount
        );
        this.redeemableResult.set(redeemable);
      }
    } catch (error) {
      console.error('Failed to load loyalty info:', error);
      this.isEnabled.set(false);
    } finally {
      this.loading.set(false);
    }
  }

  getTierSeverity(tier: LoyaltyTier): 'secondary' | 'info' | 'warn' | 'success' {
    return getLoyaltyTierSeverity(tier);
  }

  onPointsChange() {
    const redeemable = this.redeemableResult();
    if (!redeemable || this.pointsToRedeem <= 0) {
      this.redemptionPreview.set(null);
      this.redemptionChange.emit({ points: 0, discount: 0 });
      return;
    }

    const preview = this.loyaltyService.calculateRedemptionPreview(
      this.pointsToRedeem,
      this.earnedResult()?.currentBalance || 0,
      redeemable
    );

    this.redemptionPreview.set(preview);
    this.redemptionChange.emit({
      points: preview.pointsToRedeem,
      discount: preview.discountValue
    });
  }

  redeemMax() {
    const redeemable = this.redeemableResult();
    if (redeemable) {
      this.pointsToRedeem = redeemable.maxRedeemablePoints;
      this.onPointsChange();
    }
  }

  clearRedemption() {
    this.pointsToRedeem = 0;
    this.redemptionPreview.set(null);
    this.redemptionChange.emit({ points: 0, discount: 0 });
  }

  /**
   * Get current redemption info for external use
   */
  getRedemptionInfo(): { points: number; discount: number; balanceAfter: number } {
    const preview = this.redemptionPreview();
    return {
      points: preview?.pointsToRedeem || 0,
      discount: preview?.discountValue || 0,
      balanceAfter: preview?.remainingBalance || (this.earnedResult()?.currentBalance || 0)
    };
  }

  /**
   * Get points to earn for external use
   */
  getPointsToEarn(): number {
    return this.earnedResult()?.pointsToEarn || 0;
  }
}
