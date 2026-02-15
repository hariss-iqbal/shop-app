import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputNumber } from 'primeng/inputnumber';

import { LoyaltyService } from '../../../../core';
import { LoyaltyConfig, UpdateLoyaltyConfigRequest } from '../../../../models';
import { LoyaltyTier } from '../../../../enums';

/**
 * Loyalty Program Configuration Component
 * Admin interface for configuring loyalty program settings
 * Feature: F-022 Loyalty Points Integration
 */
@Component({
  selector: 'app-loyalty-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    ToggleSwitch,
    DividerModule,
    TooltipModule,
    SkeletonModule,
    TagModule,
    MessageModule,
    ToastModule,
    CurrencyPipe,
    InputNumber,
  ],
  providers: [MessageService],
  templateUrl: './loyalty-config.component.html',
  styleUrls: ['./loyalty-config.component.scss']
})
export class LoyaltyConfigComponent implements OnInit {
  constructor(
    private loyaltyService: LoyaltyService,
    private messageService: MessageService
  ) { }

  Math = Math;

  loading = signal(true);
  saving = signal(false);
  config = signal<LoyaltyConfig | null>(null);
  changed = signal(false);
  thresholdError = signal<string | null>(null);

  editConfig: EditConfig = {
    isEnabled: true,
    pointsPerDollar: 1,
    redemptionRate: 0.01,
    minPointsToRedeem: 100,
    maxRedemptionPercent: 100,
    silverThreshold: 1000,
    goldThreshold: 5000,
    platinumThreshold: 10000,
    bronzeMultiplier: 1,
    silverMultiplier: 1.25,
    goldMultiplier: 1.5,
    platinumMultiplier: 2,
    pointsExpirationDays: 0
  };

  tiers = [
    { value: LoyaltyTier.BRONZE, label: 'Bronze', severity: 'secondary' as const, multiplierKey: 'bronzeMultiplier' as const },
    { value: LoyaltyTier.SILVER, label: 'Silver', severity: 'info' as const, multiplierKey: 'silverMultiplier' as const },
    { value: LoyaltyTier.GOLD, label: 'Gold', severity: 'warn' as const, multiplierKey: 'goldMultiplier' as const },
    { value: LoyaltyTier.PLATINUM, label: 'Platinum', severity: 'success' as const, multiplierKey: 'platinumMultiplier' as const }
  ];

  async ngOnInit() {
    await this.loadConfig();
  }

  private async loadConfig() {
    this.loading.set(true);
    try {
      const config = await this.loyaltyService.getConfig();
      this.config.set(config);
      this.editConfig = {
        isEnabled: config.isEnabled,
        pointsPerDollar: config.pointsPerDollar,
        redemptionRate: config.redemptionRate,
        minPointsToRedeem: config.minPointsToRedeem,
        maxRedemptionPercent: config.maxRedemptionPercent,
        silverThreshold: config.silverThreshold,
        goldThreshold: config.goldThreshold,
        platinumThreshold: config.platinumThreshold,
        bronzeMultiplier: config.bronzeMultiplier,
        silverMultiplier: config.silverMultiplier,
        goldMultiplier: config.goldMultiplier,
        platinumMultiplier: config.platinumMultiplier,
        pointsExpirationDays: config.pointsExpirationDays
      };
      this.changed.set(false);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load loyalty configuration'
      });
    } finally {
      this.loading.set(false);
    }
  }

  markChanged() {
    this.changed.set(true);
    this.validateThresholds();
  }

  hasChanges(): boolean {
    return this.changed();
  }

  validateThresholds(): boolean {
    if (this.editConfig.silverThreshold >= this.editConfig.goldThreshold) {
      this.thresholdError.set('Silver threshold must be less than Gold threshold');
      return false;
    }
    if (this.editConfig.goldThreshold >= this.editConfig.platinumThreshold) {
      this.thresholdError.set('Gold threshold must be less than Platinum threshold');
      return false;
    }
    this.thresholdError.set(null);
    return true;
  }

  calculatePreviewPoints(amount: number, multiplier: number): number {
    return Math.floor(amount * this.editConfig.pointsPerDollar * multiplier);
  }

  async saveConfig() {
    if (!this.validateThresholds()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: this.thresholdError()!
      });
      return;
    }

    this.saving.set(true);
    try {
      const request: UpdateLoyaltyConfigRequest = {
        isEnabled: this.editConfig.isEnabled,
        pointsPerDollar: this.editConfig.pointsPerDollar,
        redemptionRate: this.editConfig.redemptionRate,
        minPointsToRedeem: this.editConfig.minPointsToRedeem,
        maxRedemptionPercent: this.editConfig.maxRedemptionPercent,
        silverThreshold: this.editConfig.silverThreshold,
        goldThreshold: this.editConfig.goldThreshold,
        platinumThreshold: this.editConfig.platinumThreshold,
        bronzeMultiplier: this.editConfig.bronzeMultiplier,
        silverMultiplier: this.editConfig.silverMultiplier,
        goldMultiplier: this.editConfig.goldMultiplier,
        platinumMultiplier: this.editConfig.platinumMultiplier,
        pointsExpirationDays: this.editConfig.pointsExpirationDays
      };

      const updated = await this.loyaltyService.updateConfig(request);
      this.config.set(updated);
      this.changed.set(false);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Loyalty program configuration saved'
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'Failed to save configuration'
      });
    } finally {
      this.saving.set(false);
    }
  }
}

interface EditConfig {
  isEnabled: boolean;
  pointsPerDollar: number;
  redemptionRate: number;
  minPointsToRedeem: number;
  maxRedemptionPercent: number;
  silverThreshold: number;
  goldThreshold: number;
  platinumThreshold: number;
  bronzeMultiplier: number;
  silverMultiplier: number;
  goldMultiplier: number;
  platinumMultiplier: number;
  pointsExpirationDays: number;
}
