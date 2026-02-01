import { LoyaltyRepository } from '../repositories';
import {
  LoyaltyProgramConfig,
  LoyaltyProgramConfigUpdate,
  CustomerLoyalty,
  CustomerLoyaltyWithCustomer,
  LoyaltyTransaction
} from '../entities';
import {
  LoyaltyConfigResponseDto,
  UpdateLoyaltyConfigDto,
  CustomerLoyaltyResponseDto,
  CustomerLoyaltyListResponseDto,
  CustomerLoyaltyProfileResponseDto,
  LoyaltyTransactionResponseDto,
  LoyaltyTransactionListResponseDto,
  PointsEarnedResponseDto,
  MaxRedeemableResponseDto,
  AwardPointsResponseDto,
  RedeemPointsResponseDto,
  AdjustPointsResponseDto,
  ReceiptLoyaltyInfoDto
} from '../dto';
import {
  LoyaltyTier,
  LoyaltyTierLabels,
  LoyaltyTransactionType,
  LoyaltyTransactionTypeLabels
} from '../enums';

/**
 * Loyalty Service
 * Business logic for loyalty points feature
 * Feature: F-022 Loyalty Points Integration
 */
export class LoyaltyService {
  constructor(private readonly loyaltyRepository: LoyaltyRepository) {}

  // ============================================================================
  // Loyalty Program Configuration
  // ============================================================================

  /**
   * Get loyalty program configuration
   */
  async getConfig(): Promise<LoyaltyConfigResponseDto> {
    const config = await this.loyaltyRepository.getConfig();
    return this.configToResponseDto(config);
  }

  /**
   * Update loyalty program configuration
   */
  async updateConfig(dto: UpdateLoyaltyConfigDto): Promise<LoyaltyConfigResponseDto> {
    const update: LoyaltyProgramConfigUpdate = {};

    if (dto.isEnabled !== undefined) update.is_enabled = dto.isEnabled;
    if (dto.pointsPerDollar !== undefined) update.points_per_dollar = dto.pointsPerDollar;
    if (dto.redemptionRate !== undefined) update.redemption_rate = dto.redemptionRate;
    if (dto.minPointsToRedeem !== undefined) update.min_points_to_redeem = dto.minPointsToRedeem;
    if (dto.maxRedemptionPercent !== undefined) update.max_redemption_percent = dto.maxRedemptionPercent;
    if (dto.silverThreshold !== undefined) update.silver_threshold = dto.silverThreshold;
    if (dto.goldThreshold !== undefined) update.gold_threshold = dto.goldThreshold;
    if (dto.platinumThreshold !== undefined) update.platinum_threshold = dto.platinumThreshold;
    if (dto.bronzeMultiplier !== undefined) update.bronze_multiplier = dto.bronzeMultiplier;
    if (dto.silverMultiplier !== undefined) update.silver_multiplier = dto.silverMultiplier;
    if (dto.goldMultiplier !== undefined) update.gold_multiplier = dto.goldMultiplier;
    if (dto.platinumMultiplier !== undefined) update.platinum_multiplier = dto.platinumMultiplier;
    if (dto.pointsExpirationDays !== undefined) update.points_expiration_days = dto.pointsExpirationDays;

    const config = await this.loyaltyRepository.upsertConfig(update);
    return this.configRecordToResponseDto(config);
  }

  // ============================================================================
  // Customer Loyalty
  // ============================================================================

  /**
   * Get all customer loyalty records
   */
  async getAllLoyalty(options?: {
    tier?: LoyaltyTier;
    minBalance?: number;
    limit?: number;
    offset?: number;
  }): Promise<CustomerLoyaltyListResponseDto> {
    const loyalties = await this.loyaltyRepository.findAllLoyalty({
      tier: options?.tier,
      minBalance: options?.minBalance,
      limit: options?.limit,
      offset: options?.offset
    });

    const total = await this.loyaltyRepository.countLoyalty(options?.tier);

    return {
      data: loyalties.map(l => this.loyaltyToResponseDto(l)),
      total
    };
  }

  /**
   * Enroll customer in loyalty program
   */
  async enrollCustomer(customerId: string): Promise<CustomerLoyaltyResponseDto> {
    const result = await this.loyaltyRepository.enrollCustomer(customerId);

    if (!result.success) {
      throw new Error(result.error || 'Failed to enroll customer');
    }

    // Get full loyalty record with customer info
    const loyalty = await this.loyaltyRepository.findByCustomerId(customerId);
    if (!loyalty) {
      throw new Error('Loyalty record not found after enrollment');
    }

    return this.loyaltyToResponseDto(loyalty);
  }

  /**
   * Get customer loyalty by customer ID
   */
  async getByCustomerId(customerId: string): Promise<CustomerLoyaltyResponseDto | null> {
    const loyalty = await this.loyaltyRepository.findByCustomerId(customerId);
    if (!loyalty) return null;
    return this.loyaltyToResponseDto(loyalty);
  }

  /**
   * Get customer loyalty profile with transaction history
   */
  async getCustomerProfile(customerId: string): Promise<CustomerLoyaltyProfileResponseDto> {
    const profile = await this.loyaltyRepository.getCustomerProfile(customerId);

    if (!profile.found) {
      return { found: false, isEnrolled: false, error: profile.error };
    }

    return {
      found: true,
      isEnrolled: profile.isEnrolled,
      customer: profile.customer,
      loyalty: profile.loyalty ? {
        ...profile.loyalty,
        tierLabel: LoyaltyTierLabels[profile.loyalty.currentTier as LoyaltyTier] || profile.loyalty.currentTier
      } : undefined,
      transactions: profile.transactions?.map(t => ({
        id: t.id,
        customerLoyaltyId: '',
        transactionType: t.transactionType as LoyaltyTransactionType,
        transactionTypeLabel: LoyaltyTransactionTypeLabels[t.transactionType as LoyaltyTransactionType] || t.transactionType,
        points: t.points,
        balanceBefore: t.balanceBefore,
        balanceAfter: t.balanceAfter,
        saleId: null,
        refundId: null,
        description: t.description,
        purchaseAmount: t.purchaseAmount,
        pointsRate: null,
        tierMultiplier: null,
        redemptionValue: t.redemptionValue,
        expiresAt: null,
        expiredAt: null,
        createdAt: t.createdAt
      }))
    };
  }

  // ============================================================================
  // Loyalty Transactions
  // ============================================================================

  /**
   * Get transactions for a customer
   */
  async getTransactions(
    customerId: string,
    options?: {
      type?: LoyaltyTransactionType;
      limit?: number;
      offset?: number;
    }
  ): Promise<LoyaltyTransactionListResponseDto> {
    const loyalty = await this.loyaltyRepository.findByCustomerId(customerId);
    if (!loyalty) {
      return { data: [], total: 0 };
    }

    const transactions = await this.loyaltyRepository.findTransactionsByLoyaltyId(
      loyalty.id,
      options
    );

    const total = await this.loyaltyRepository.countTransactions(
      loyalty.id,
      options?.type
    );

    return {
      data: transactions.map(t => this.transactionToResponseDto(t)),
      total
    };
  }

  // ============================================================================
  // Points Calculation
  // ============================================================================

  /**
   * Calculate points to be earned for a purchase
   */
  async calculatePointsEarned(
    customerId: string,
    purchaseAmount: number
  ): Promise<PointsEarnedResponseDto> {
    const result = await this.loyaltyRepository.calculatePointsEarned(customerId, purchaseAmount);

    return {
      pointsToEarn: result.pointsToEarn,
      basePoints: result.basePoints,
      multiplier: result.multiplier,
      tier: result.tier as LoyaltyTier,
      tierLabel: LoyaltyTierLabels[result.tier as LoyaltyTier] || result.tier,
      currentBalance: result.currentBalance || 0,
      isEnabled: result.isEnabled,
      isEnrolled: result.isEnrolled || false
    };
  }

  /**
   * Calculate maximum points redeemable for a purchase
   */
  async calculateMaxRedeemable(
    customerId: string,
    purchaseAmount: number
  ): Promise<MaxRedeemableResponseDto> {
    const result = await this.loyaltyRepository.calculateMaxRedeemable(customerId, purchaseAmount);

    return {
      maxRedeemablePoints: result.maxRedeemablePoints,
      maxDiscountValue: result.maxDiscountValue,
      currentBalance: result.currentBalance,
      redemptionRate: result.redemptionRate || 0.01,
      minPointsToRedeem: result.minPointsToRedeem || 100,
      maxRedemptionPercent: result.maxRedemptionPercent || 100,
      isEnabled: result.isEnabled,
      isEnrolled: result.isEnrolled || false,
      reason: result.reason
    };
  }

  // ============================================================================
  // Points Award/Redeem
  // ============================================================================

  /**
   * Award loyalty points for a sale
   */
  async awardPoints(
    customerId: string,
    saleId: string,
    purchaseAmount: number
  ): Promise<AwardPointsResponseDto> {
    const result = await this.loyaltyRepository.awardPoints(customerId, saleId, purchaseAmount);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        pointsAwarded: 0,
        basePoints: 0,
        multiplier: 1,
        newBalance: 0,
        previousBalance: 0,
        currentTier: LoyaltyTier.BRONZE,
        tierLabel: LoyaltyTierLabels[LoyaltyTier.BRONZE],
        previousTier: LoyaltyTier.BRONZE,
        tierChanged: false,
        transactionId: ''
      };
    }

    return {
      success: true,
      pointsAwarded: result.pointsAwarded,
      basePoints: result.basePoints || 0,
      multiplier: result.multiplier || 1,
      newBalance: result.newBalance || 0,
      previousBalance: result.previousBalance || 0,
      currentTier: (result.currentTier as LoyaltyTier) || LoyaltyTier.BRONZE,
      tierLabel: LoyaltyTierLabels[(result.currentTier as LoyaltyTier)] || result.currentTier || 'Bronze',
      previousTier: (result.previousTier as LoyaltyTier) || LoyaltyTier.BRONZE,
      tierChanged: result.tierChanged || false,
      transactionId: result.transactionId || ''
    };
  }

  /**
   * Redeem loyalty points for a sale
   */
  async redeemPoints(
    customerId: string,
    saleId: string,
    pointsToRedeem: number
  ): Promise<RedeemPointsResponseDto> {
    const result = await this.loyaltyRepository.redeemPoints(customerId, saleId, pointsToRedeem);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        pointsRedeemed: 0,
        discountValue: 0,
        newBalance: result.currentBalance || 0,
        previousBalance: result.currentBalance || 0,
        transactionId: ''
      };
    }

    return {
      success: true,
      pointsRedeemed: result.pointsRedeemed || 0,
      discountValue: result.discountValue || 0,
      newBalance: result.newBalance || 0,
      previousBalance: result.previousBalance || 0,
      transactionId: result.transactionId || ''
    };
  }

  /**
   * Manually adjust points
   */
  async adjustPoints(
    customerId: string,
    points: number,
    reason: string,
    transactionType: 'adjusted' | 'bonus' = 'adjusted'
  ): Promise<AdjustPointsResponseDto> {
    const result = await this.loyaltyRepository.adjustPoints(
      customerId,
      points,
      reason,
      transactionType
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        pointsAdjusted: 0,
        newBalance: result.currentBalance || 0,
        previousBalance: result.currentBalance || 0,
        transactionId: ''
      };
    }

    return {
      success: true,
      pointsAdjusted: result.pointsAdjusted || 0,
      newBalance: result.newBalance || 0,
      previousBalance: result.previousBalance || 0,
      transactionId: result.transactionId || ''
    };
  }

  // ============================================================================
  // Receipt Integration
  // ============================================================================

  /**
   * Get loyalty info for receipt display
   */
  async getReceiptLoyaltyInfo(customerId: string): Promise<ReceiptLoyaltyInfoDto> {
    const profile = await this.loyaltyRepository.getCustomerProfile(customerId);

    if (!profile.found || !profile.isEnrolled || !profile.loyalty) {
      return {
        isEnrolled: false,
        tier: null,
        tierLabel: null,
        pointsEarned: 0,
        pointsRedeemed: 0,
        discountApplied: 0,
        currentBalance: 0,
        pointsToNextTier: 0,
        nextTier: null,
        nextTierLabel: null
      };
    }

    return {
      isEnrolled: true,
      tier: profile.loyalty.currentTier,
      tierLabel: LoyaltyTierLabels[profile.loyalty.currentTier as LoyaltyTier] || profile.loyalty.currentTier,
      pointsEarned: 0, // Will be set by caller after transaction
      pointsRedeemed: 0, // Will be set by caller after transaction
      discountApplied: 0, // Will be set by caller after transaction
      currentBalance: profile.loyalty.currentBalance,
      pointsToNextTier: profile.loyalty.pointsToNextTier,
      nextTier: profile.loyalty.nextTier,
      nextTierLabel: profile.loyalty.nextTier
        ? LoyaltyTierLabels[profile.loyalty.nextTier as LoyaltyTier] || profile.loyalty.nextTier
        : null
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private configToResponseDto(config: any): LoyaltyConfigResponseDto {
    return {
      id: config.id,
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
      pointsExpirationDays: config.pointsExpirationDays,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    };
  }

  private configRecordToResponseDto(config: LoyaltyProgramConfig): LoyaltyConfigResponseDto {
    return {
      id: config.id,
      isEnabled: config.is_enabled,
      pointsPerDollar: config.points_per_dollar,
      redemptionRate: config.redemption_rate,
      minPointsToRedeem: config.min_points_to_redeem,
      maxRedemptionPercent: config.max_redemption_percent,
      silverThreshold: config.silver_threshold,
      goldThreshold: config.gold_threshold,
      platinumThreshold: config.platinum_threshold,
      bronzeMultiplier: config.bronze_multiplier,
      silverMultiplier: config.silver_multiplier,
      goldMultiplier: config.gold_multiplier,
      platinumMultiplier: config.platinum_multiplier,
      pointsExpirationDays: config.points_expiration_days,
      createdAt: config.created_at,
      updatedAt: config.updated_at
    };
  }

  private loyaltyToResponseDto(loyalty: CustomerLoyaltyWithCustomer): CustomerLoyaltyResponseDto {
    const config = this.getDefaultTierThresholds();
    const nextTierInfo = this.calculateNextTier(
      loyalty.current_tier as LoyaltyTier,
      loyalty.lifetime_points_earned,
      config
    );

    return {
      id: loyalty.id,
      customerId: loyalty.customer_id,
      currentBalance: loyalty.current_balance,
      lifetimePointsEarned: loyalty.lifetime_points_earned,
      lifetimePointsRedeemed: loyalty.lifetime_points_redeemed,
      lifetimeSpend: loyalty.lifetime_spend,
      currentTier: loyalty.current_tier as LoyaltyTier,
      tierLabel: LoyaltyTierLabels[loyalty.current_tier as LoyaltyTier] || loyalty.current_tier,
      tierUpdatedAt: loyalty.tier_updated_at,
      enrolledAt: loyalty.enrolled_at,
      createdAt: loyalty.created_at,
      updatedAt: loyalty.updated_at,
      nextTier: nextTierInfo.nextTier,
      pointsToNextTier: nextTierInfo.pointsToNextTier,
      customer: loyalty.customer ? {
        id: loyalty.customer.id,
        name: loyalty.customer.name,
        phone: loyalty.customer.phone,
        email: loyalty.customer.email
      } : undefined
    };
  }

  private transactionToResponseDto(transaction: LoyaltyTransaction): LoyaltyTransactionResponseDto {
    return {
      id: transaction.id,
      customerLoyaltyId: transaction.customer_loyalty_id,
      transactionType: transaction.transaction_type,
      transactionTypeLabel: LoyaltyTransactionTypeLabels[transaction.transaction_type] || transaction.transaction_type,
      points: transaction.points,
      balanceBefore: transaction.balance_before,
      balanceAfter: transaction.balance_after,
      saleId: transaction.sale_id,
      refundId: transaction.refund_id,
      description: transaction.description,
      purchaseAmount: transaction.purchase_amount,
      pointsRate: transaction.points_rate,
      tierMultiplier: transaction.tier_multiplier,
      redemptionValue: transaction.redemption_value,
      expiresAt: transaction.expires_at,
      expiredAt: transaction.expired_at,
      createdAt: transaction.created_at
    };
  }

  private getDefaultTierThresholds() {
    return {
      silverThreshold: 1000,
      goldThreshold: 5000,
      platinumThreshold: 10000
    };
  }

  private calculateNextTier(
    currentTier: LoyaltyTier,
    lifetimePoints: number,
    config: { silverThreshold: number; goldThreshold: number; platinumThreshold: number }
  ): { nextTier: LoyaltyTier | null; pointsToNextTier: number } {
    switch (currentTier) {
      case LoyaltyTier.BRONZE:
        return {
          nextTier: LoyaltyTier.SILVER,
          pointsToNextTier: Math.max(0, config.silverThreshold - lifetimePoints)
        };
      case LoyaltyTier.SILVER:
        return {
          nextTier: LoyaltyTier.GOLD,
          pointsToNextTier: Math.max(0, config.goldThreshold - lifetimePoints)
        };
      case LoyaltyTier.GOLD:
        return {
          nextTier: LoyaltyTier.PLATINUM,
          pointsToNextTier: Math.max(0, config.platinumThreshold - lifetimePoints)
        };
      case LoyaltyTier.PLATINUM:
        return {
          nextTier: null,
          pointsToNextTier: 0
        };
      default:
        return {
          nextTier: LoyaltyTier.SILVER,
          pointsToNextTier: Math.max(0, config.silverThreshold - lifetimePoints)
        };
    }
  }
}
