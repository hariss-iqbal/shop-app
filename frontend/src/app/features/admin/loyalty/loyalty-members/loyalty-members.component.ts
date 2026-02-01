import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { LoyaltyService } from '../../../../core';
import {
  CustomerLoyalty,
  LoyaltyConfig,
  LoyaltyTransaction
} from '../../../../models';
import {
  LoyaltyTier,
  getLoyaltyTierSeverity,
  getLoyaltyTransactionTypeIcon
} from '../../../../enums';

/**
 * Loyalty Members Component
 * Admin interface for viewing and managing loyalty program members
 * Feature: F-022 Loyalty Points Integration
 */
@Component({
  selector: 'app-loyalty-members',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
    SelectModule,
    InputNumberModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ProgressBarModule,
    ToastModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe
  ],
  providers: [MessageService],
  templateUrl: './loyalty-members.component.html',
  styleUrls: ['./loyalty-members.component.scss']
})
export class LoyaltyMembersComponent implements OnInit {
  private loyaltyService = inject(LoyaltyService);
  private messageService = inject(MessageService);

  loading = signal(true);
  members = signal<CustomerLoyalty[]>([]);
  totalMembers = signal(0);
  config = signal<LoyaltyConfig | null>(null);

  // Computed stats
  goldPlusMembers = signal(0);
  totalPointsOutstanding = signal(0);
  pointsValue = signal(0);

  // Filters
  filterTier: LoyaltyTier | null = null;
  filterMinBalance: number | null = null;

  tierOptions = [
    { label: 'Bronze', value: LoyaltyTier.BRONZE },
    { label: 'Silver', value: LoyaltyTier.SILVER },
    { label: 'Gold', value: LoyaltyTier.GOLD },
    { label: 'Platinum', value: LoyaltyTier.PLATINUM }
  ];

  // Details dialog
  showDetailsDialog = false;
  selectedMember = signal<CustomerLoyalty | null>(null);
  memberTransactions = signal<LoyaltyTransaction[]>([]);
  loadingTransactions = signal(false);

  // Adjust dialog
  showAdjustDialog = false;
  adjustMember = signal<CustomerLoyalty | null>(null);
  adjustType: 'add' | 'remove' = 'add';
  adjustPoints: number | null = null;
  adjustReason = '';
  adjusting = signal(false);

  adjustTypeOptions = [
    { label: 'Add Points (Bonus)', value: 'add' },
    { label: 'Remove Points (Adjustment)', value: 'remove' }
  ];

  async ngOnInit() {
    await Promise.all([
      this.loadConfig(),
      this.loadMembers()
    ]);
  }

  private async loadConfig() {
    try {
      const config = await this.loyaltyService.getConfig();
      this.config.set(config);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  async loadMembers() {
    this.loading.set(true);
    try {
      const response = await this.loyaltyService.getAllLoyalty({
        tier: this.filterTier || undefined,
        minBalance: this.filterMinBalance || undefined
      });

      this.members.set(response.data);
      this.totalMembers.set(response.total);

      // Calculate stats
      const goldPlus = response.data.filter(m =>
        m.currentTier === LoyaltyTier.GOLD || m.currentTier === LoyaltyTier.PLATINUM
      ).length;
      this.goldPlusMembers.set(goldPlus);

      const totalPoints = response.data.reduce((sum, m) => sum + m.currentBalance, 0);
      this.totalPointsOutstanding.set(totalPoints);

      const config = this.config();
      if (config) {
        this.pointsValue.set(totalPoints * config.redemptionRate);
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load loyalty members'
      });
    } finally {
      this.loading.set(false);
    }
  }

  clearFilters() {
    this.filterTier = null;
    this.filterMinBalance = null;
    this.loadMembers();
  }

  getTierSeverity(tier: LoyaltyTier): 'secondary' | 'info' | 'warn' | 'success' {
    return getLoyaltyTierSeverity(tier);
  }

  calculateProgress(member: CustomerLoyalty): number {
    const config = this.config();
    if (!config || !member.nextTier) return 100;

    let prevThreshold = 0;
    let nextThreshold = 0;

    switch (member.currentTier) {
      case LoyaltyTier.BRONZE:
        nextThreshold = config.silverThreshold;
        break;
      case LoyaltyTier.SILVER:
        prevThreshold = config.silverThreshold;
        nextThreshold = config.goldThreshold;
        break;
      case LoyaltyTier.GOLD:
        prevThreshold = config.goldThreshold;
        nextThreshold = config.platinumThreshold;
        break;
      default:
        return 100;
    }

    const range = nextThreshold - prevThreshold;
    const progress = member.lifetimePointsEarned - prevThreshold;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  }

  async viewMember(member: CustomerLoyalty) {
    this.selectedMember.set(member);
    this.showDetailsDialog = true;
    await this.loadMemberTransactions(member.customerId);
  }

  private async loadMemberTransactions(customerId: string) {
    this.loadingTransactions.set(true);
    try {
      const response = await this.loyaltyService.getTransactions(customerId, { limit: 20 });
      this.memberTransactions.set(response.data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      this.loadingTransactions.set(false);
    }
  }

  getTransactionIcon(type: string): string {
    return getLoyaltyTransactionTypeIcon(type as any);
  }

  openAdjustDialog(member: CustomerLoyalty) {
    this.adjustMember.set(member);
    this.adjustType = 'add';
    this.adjustPoints = null;
    this.adjustReason = '';
    this.showAdjustDialog = true;
  }

  async applyAdjustment() {
    const member = this.adjustMember();
    if (!member || !this.adjustPoints || !this.adjustReason) return;

    this.adjusting.set(true);
    try {
      const points = this.adjustType === 'add' ? this.adjustPoints : -this.adjustPoints;
      const result = await this.loyaltyService.adjustPoints({
        customerId: member.customerId,
        points,
        reason: this.adjustReason,
        transactionType: this.adjustType === 'add' ? 'bonus' : 'adjusted'
      });

      if (result.success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `${Math.abs(points)} points ${this.adjustType === 'add' ? 'added' : 'removed'}`
        });
        this.showAdjustDialog = false;
        await this.loadMembers();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'Failed to adjust points'
      });
    } finally {
      this.adjusting.set(false);
    }
  }
}
