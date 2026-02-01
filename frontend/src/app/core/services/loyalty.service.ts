import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  LoyaltyConfig,
  UpdateLoyaltyConfigRequest,
  CustomerLoyalty,
  CustomerLoyaltyListResponse,
  CustomerLoyaltyProfile,
  EnrollCustomerRequest,
  LoyaltyTransaction,
  LoyaltyTransactionListResponse,
  PointsEarnedResult,
  MaxRedeemableResult,
  AwardPointsRequest,
  AwardPointsResult,
  RedeemPointsRequest,
  RedeemPointsResult,
  AdjustPointsRequest,
  AdjustPointsResult,
  LoyaltyPointsSummary,
  LoyaltyRedemptionPreview
} from '../../models';
import {
  LoyaltyTier,
  LoyaltyTierLabels,
  LoyaltyTransactionType
} from '../../enums';

/**
 * Loyalty Service
 * Frontend service for loyalty points feature
 * Feature: F-022 Loyalty Points Integration
 */
@Injectable({
  providedIn: 'root'
})
export class LoyaltyService {
  private supabase = inject(SupabaseService);

  // Cached config for quick access
  private configCache = signal<LoyaltyConfig | null>(null);

  // ============================================================================
  // Loyalty Program Configuration
  // ============================================================================

  /**
   * Get loyalty program configuration
   */
  async getConfig(): Promise<LoyaltyConfig> {
    const { data, error } = await this.supabase.client.rpc('get_loyalty_config');
    if (error) throw new Error(error.message);

    const config = data as LoyaltyConfig;
    this.configCache.set(config);
    return config;
  }

  /**
   * Get cached config or fetch if not available
   */
  async getCachedConfig(): Promise<LoyaltyConfig> {
    const cached = this.configCache();
    if (cached) return cached;
    return this.getConfig();
  }

  /**
   * Check if loyalty program is enabled
   */
  async isEnabled(): Promise<boolean> {
    const config = await this.getCachedConfig();
    return config.isEnabled;
  }

  /**
   * Update loyalty program configuration
   */
  async updateConfig(request: UpdateLoyaltyConfigRequest): Promise<LoyaltyConfig> {
    // Get existing config
    const existing = await this.getConfigRecord();

    const updateData: Record<string, unknown> = {};
    if (request.isEnabled !== undefined) updateData['is_enabled'] = request.isEnabled;
    if (request.pointsPerDollar !== undefined) updateData['points_per_dollar'] = request.pointsPerDollar;
    if (request.redemptionRate !== undefined) updateData['redemption_rate'] = request.redemptionRate;
    if (request.minPointsToRedeem !== undefined) updateData['min_points_to_redeem'] = request.minPointsToRedeem;
    if (request.maxRedemptionPercent !== undefined) updateData['max_redemption_percent'] = request.maxRedemptionPercent;
    if (request.silverThreshold !== undefined) updateData['silver_threshold'] = request.silverThreshold;
    if (request.goldThreshold !== undefined) updateData['gold_threshold'] = request.goldThreshold;
    if (request.platinumThreshold !== undefined) updateData['platinum_threshold'] = request.platinumThreshold;
    if (request.bronzeMultiplier !== undefined) updateData['bronze_multiplier'] = request.bronzeMultiplier;
    if (request.silverMultiplier !== undefined) updateData['silver_multiplier'] = request.silverMultiplier;
    if (request.goldMultiplier !== undefined) updateData['gold_multiplier'] = request.goldMultiplier;
    if (request.platinumMultiplier !== undefined) updateData['platinum_multiplier'] = request.platinumMultiplier;
    if (request.pointsExpirationDays !== undefined) updateData['points_expiration_days'] = request.pointsExpirationDays;

    if (existing) {
      const { error } = await this.supabase.client
        .from('loyalty_program_config')
        .update(updateData)
        .eq('id', existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await this.supabase.client
        .from('loyalty_program_config')
        .insert(updateData);
      if (error) throw new Error(error.message);
    }

    // Clear cache and return fresh config
    this.configCache.set(null);
    return this.getConfig();
  }

  private async getConfigRecord(): Promise<{ id: string } | null> {
    const { data, error } = await this.supabase.client
      .from('loyalty_program_config')
      .select('id')
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
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
  }): Promise<CustomerLoyaltyListResponse> {
    let query = this.supabase.client
      .from('customer_loyalty')
      .select(`
        *,
        customer:customers(id, name, phone, email)
      `, { count: 'exact' });

    if (options?.tier) {
      query = query.eq('current_tier', options.tier);
    }

    if (options?.minBalance !== undefined) {
      query = query.gte('current_balance', options.minBalance);
    }

    query = query.order('lifetime_points_earned', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data || []).map(this.mapToCustomerLoyalty.bind(this)),
      total: count || 0
    };
  }

  /**
   * Get customer loyalty by customer ID
   */
  async getByCustomerId(customerId: string): Promise<CustomerLoyalty | null> {
    const { data, error } = await this.supabase.client
      .from('customer_loyalty')
      .select(`
        *,
        customer:customers(id, name, phone, email)
      `)
      .eq('customer_id', customerId)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    if (!data) return null;

    return this.mapToCustomerLoyalty(data);
  }

  /**
   * Enroll customer in loyalty program
   */
  async enrollCustomer(request: EnrollCustomerRequest): Promise<CustomerLoyalty> {
    const { data, error } = await this.supabase.client.rpc('enroll_customer_loyalty', {
      p_customer_id: request.customerId
    });

    if (error) throw new Error(error.message);

    const result = data as { success: boolean; error?: string; loyalty?: Record<string, unknown> };
    if (!result.success) {
      throw new Error(result.error || 'Failed to enroll customer');
    }

    // Fetch the full record
    const loyalty = await this.getByCustomerId(request.customerId);
    if (!loyalty) throw new Error('Loyalty record not found after enrollment');

    return loyalty;
  }

  /**
   * Get customer loyalty profile with transaction history
   */
  async getCustomerProfile(customerId: string): Promise<CustomerLoyaltyProfile> {
    const { data, error } = await this.supabase.client.rpc('get_customer_loyalty_profile', {
      p_customer_id: customerId
    });

    if (error) throw new Error(error.message);
    return data as CustomerLoyaltyProfile;
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
  ): Promise<LoyaltyTransactionListResponse> {
    const loyalty = await this.getByCustomerId(customerId);
    if (!loyalty) return { data: [], total: 0 };

    let query = this.supabase.client
      .from('loyalty_transactions')
      .select('*', { count: 'exact' })
      .eq('customer_loyalty_id', loyalty.id);

    if (options?.type) {
      query = query.eq('transaction_type', options.type);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data || []).map(this.mapToTransaction.bind(this)),
      total: count || 0
    };
  }

  // ============================================================================
  // Points Calculation
  // ============================================================================

  /**
   * Calculate points to be earned for a purchase
   */
  async calculatePointsEarned(customerId: string, purchaseAmount: number): Promise<PointsEarnedResult> {
    const { data, error } = await this.supabase.client.rpc('calculate_loyalty_points_earned', {
      p_customer_id: customerId,
      p_purchase_amount: purchaseAmount
    });

    if (error) throw new Error(error.message);

    const result = data as Record<string, unknown>;
    return {
      pointsToEarn: result['pointsToEarn'] as number,
      basePoints: result['basePoints'] as number,
      multiplier: result['multiplier'] as number,
      tier: result['tier'] as LoyaltyTier,
      tierLabel: LoyaltyTierLabels[result['tier'] as LoyaltyTier] || (result['tier'] as string),
      currentBalance: (result['currentBalance'] as number) || 0,
      isEnabled: result['isEnabled'] as boolean,
      isEnrolled: (result['isEnrolled'] as boolean) || false
    };
  }

  /**
   * Calculate maximum points redeemable for a purchase
   */
  async calculateMaxRedeemable(customerId: string, purchaseAmount: number): Promise<MaxRedeemableResult> {
    const { data, error } = await this.supabase.client.rpc('calculate_max_redeemable_points', {
      p_customer_id: customerId,
      p_purchase_amount: purchaseAmount
    });

    if (error) throw new Error(error.message);

    const result = data as Record<string, unknown>;
    return {
      maxRedeemablePoints: result['maxRedeemablePoints'] as number,
      maxDiscountValue: result['maxDiscountValue'] as number,
      currentBalance: result['currentBalance'] as number,
      redemptionRate: (result['redemptionRate'] as number) || 0.01,
      minPointsToRedeem: (result['minPointsToRedeem'] as number) || 100,
      maxRedemptionPercent: (result['maxRedemptionPercent'] as number) || 100,
      isEnabled: result['isEnabled'] as boolean,
      isEnrolled: (result['isEnrolled'] as boolean) || false,
      reason: result['reason'] as string | undefined
    };
  }

  // ============================================================================
  // Points Award/Redeem
  // ============================================================================

  /**
   * Award loyalty points for a sale
   */
  async awardPoints(request: AwardPointsRequest): Promise<AwardPointsResult> {
    const { data, error } = await this.supabase.client.rpc('award_loyalty_points', {
      p_customer_id: request.customerId,
      p_sale_id: request.saleId,
      p_purchase_amount: request.purchaseAmount
    });

    if (error) throw new Error(error.message);

    const result = data as Record<string, unknown>;
    return {
      success: result['success'] as boolean,
      error: result['error'] as string | undefined,
      pointsAwarded: result['pointsAwarded'] as number,
      basePoints: (result['basePoints'] as number) || 0,
      multiplier: (result['multiplier'] as number) || 1,
      newBalance: (result['newBalance'] as number) || 0,
      previousBalance: (result['previousBalance'] as number) || 0,
      currentTier: (result['currentTier'] as LoyaltyTier) || LoyaltyTier.BRONZE,
      tierLabel: LoyaltyTierLabels[(result['currentTier'] as LoyaltyTier)] || 'Bronze',
      previousTier: (result['previousTier'] as LoyaltyTier) || LoyaltyTier.BRONZE,
      tierChanged: (result['tierChanged'] as boolean) || false,
      transactionId: (result['transactionId'] as string) || ''
    };
  }

  /**
   * Redeem loyalty points for a sale
   */
  async redeemPoints(request: RedeemPointsRequest): Promise<RedeemPointsResult> {
    const { data, error } = await this.supabase.client.rpc('redeem_loyalty_points', {
      p_customer_id: request.customerId,
      p_sale_id: request.saleId,
      p_points_to_redeem: request.pointsToRedeem
    });

    if (error) throw new Error(error.message);

    const result = data as Record<string, unknown>;
    return {
      success: result['success'] as boolean,
      error: result['error'] as string | undefined,
      pointsRedeemed: (result['pointsRedeemed'] as number) || 0,
      discountValue: (result['discountValue'] as number) || 0,
      newBalance: (result['newBalance'] as number) || 0,
      previousBalance: (result['previousBalance'] as number) || 0,
      transactionId: (result['transactionId'] as string) || ''
    };
  }

  /**
   * Manually adjust points
   */
  async adjustPoints(request: AdjustPointsRequest): Promise<AdjustPointsResult> {
    const { data, error } = await this.supabase.client.rpc('adjust_loyalty_points', {
      p_customer_id: request.customerId,
      p_points: request.points,
      p_reason: request.reason,
      p_transaction_type: request.transactionType || 'adjusted'
    });

    if (error) throw new Error(error.message);

    const result = data as Record<string, unknown>;
    return {
      success: result['success'] as boolean,
      error: result['error'] as string | undefined,
      pointsAdjusted: (result['pointsAdjusted'] as number) || 0,
      newBalance: (result['newBalance'] as number) || 0,
      previousBalance: (result['previousBalance'] as number) || 0,
      transactionId: (result['transactionId'] as string) || ''
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Calculate points summary for UI display
   */
  calculatePointsSummary(loyalty: CustomerLoyalty, config: LoyaltyConfig): LoyaltyPointsSummary {
    let progressPercent = 0;
    let tierThreshold = 0;
    let prevThreshold = 0;

    switch (loyalty.currentTier) {
      case LoyaltyTier.BRONZE:
        tierThreshold = config.silverThreshold;
        prevThreshold = 0;
        break;
      case LoyaltyTier.SILVER:
        tierThreshold = config.goldThreshold;
        prevThreshold = config.silverThreshold;
        break;
      case LoyaltyTier.GOLD:
        tierThreshold = config.platinumThreshold;
        prevThreshold = config.goldThreshold;
        break;
      case LoyaltyTier.PLATINUM:
        tierThreshold = config.platinumThreshold;
        prevThreshold = config.platinumThreshold;
        progressPercent = 100;
        break;
    }

    if (loyalty.currentTier !== LoyaltyTier.PLATINUM) {
      const range = tierThreshold - prevThreshold;
      const progress = loyalty.lifetimePointsEarned - prevThreshold;
      progressPercent = Math.min(100, Math.max(0, (progress / range) * 100));
    }

    return {
      currentBalance: loyalty.currentBalance,
      lifetimeEarned: loyalty.lifetimePointsEarned,
      lifetimeRedeemed: loyalty.lifetimePointsRedeemed,
      currentTier: loyalty.currentTier,
      tierLabel: loyalty.tierLabel,
      nextTier: loyalty.nextTier,
      pointsToNextTier: loyalty.pointsToNextTier,
      progressPercent
    };
  }

  /**
   * Calculate redemption preview
   */
  calculateRedemptionPreview(
    pointsToRedeem: number,
    currentBalance: number,
    maxRedeemable: MaxRedeemableResult
  ): LoyaltyRedemptionPreview {
    const actualPoints = Math.min(pointsToRedeem, maxRedeemable.maxRedeemablePoints, currentBalance);
    const discountValue = actualPoints * maxRedeemable.redemptionRate;

    return {
      pointsToRedeem: actualPoints,
      discountValue,
      remainingBalance: currentBalance - actualPoints,
      maxRedeemable: maxRedeemable.maxRedeemablePoints,
      maxDiscount: maxRedeemable.maxDiscountValue
    };
  }

  // ============================================================================
  // Private Mappers
  // ============================================================================

  private mapToCustomerLoyalty(data: Record<string, unknown>): CustomerLoyalty {
    const config = this.configCache();
    const currentTier = data['current_tier'] as LoyaltyTier;
    const lifetimePoints = data['lifetime_points_earned'] as number;

    const nextTierInfo = this.calculateNextTier(currentTier, lifetimePoints, config);

    return {
      id: data['id'] as string,
      customerId: data['customer_id'] as string,
      currentBalance: data['current_balance'] as number,
      lifetimePointsEarned: lifetimePoints,
      lifetimePointsRedeemed: data['lifetime_points_redeemed'] as number,
      lifetimeSpend: data['lifetime_spend'] as number,
      currentTier,
      tierLabel: LoyaltyTierLabels[currentTier] || currentTier,
      tierUpdatedAt: data['tier_updated_at'] as string | null,
      enrolledAt: data['enrolled_at'] as string,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string | null,
      nextTier: nextTierInfo.nextTier,
      pointsToNextTier: nextTierInfo.pointsToNextTier,
      customer: data['customer'] ? {
        id: (data['customer'] as Record<string, unknown>)['id'] as string,
        name: (data['customer'] as Record<string, unknown>)['name'] as string,
        phone: (data['customer'] as Record<string, unknown>)['phone'] as string,
        email: (data['customer'] as Record<string, unknown>)['email'] as string | null
      } : undefined
    };
  }

  private mapToTransaction(data: Record<string, unknown>): LoyaltyTransaction {
    const transactionType = data['transaction_type'] as LoyaltyTransactionType;

    return {
      id: data['id'] as string,
      customerLoyaltyId: data['customer_loyalty_id'] as string,
      transactionType,
      transactionTypeLabel: this.getTransactionTypeLabel(transactionType),
      points: data['points'] as number,
      balanceBefore: data['balance_before'] as number,
      balanceAfter: data['balance_after'] as number,
      saleId: data['sale_id'] as string | null,
      refundId: data['refund_id'] as string | null,
      description: data['description'] as string | null,
      purchaseAmount: data['purchase_amount'] as number | null,
      pointsRate: data['points_rate'] as number | null,
      tierMultiplier: data['tier_multiplier'] as number | null,
      redemptionValue: data['redemption_value'] as number | null,
      expiresAt: data['expires_at'] as string | null,
      expiredAt: data['expired_at'] as string | null,
      createdAt: data['created_at'] as string
    };
  }

  private getTransactionTypeLabel(type: LoyaltyTransactionType): string {
    const labels: Record<LoyaltyTransactionType, string> = {
      [LoyaltyTransactionType.EARNED]: 'Points Earned',
      [LoyaltyTransactionType.REDEEMED]: 'Points Redeemed',
      [LoyaltyTransactionType.EXPIRED]: 'Points Expired',
      [LoyaltyTransactionType.ADJUSTED]: 'Points Adjusted',
      [LoyaltyTransactionType.BONUS]: 'Bonus Points'
    };
    return labels[type] || type;
  }

  private calculateNextTier(
    currentTier: LoyaltyTier,
    lifetimePoints: number,
    config: LoyaltyConfig | null
  ): { nextTier: LoyaltyTier | null; pointsToNextTier: number } {
    const silverThreshold = config?.silverThreshold || 1000;
    const goldThreshold = config?.goldThreshold || 5000;
    const platinumThreshold = config?.platinumThreshold || 10000;

    switch (currentTier) {
      case LoyaltyTier.BRONZE:
        return {
          nextTier: LoyaltyTier.SILVER,
          pointsToNextTier: Math.max(0, silverThreshold - lifetimePoints)
        };
      case LoyaltyTier.SILVER:
        return {
          nextTier: LoyaltyTier.GOLD,
          pointsToNextTier: Math.max(0, goldThreshold - lifetimePoints)
        };
      case LoyaltyTier.GOLD:
        return {
          nextTier: LoyaltyTier.PLATINUM,
          pointsToNextTier: Math.max(0, platinumThreshold - lifetimePoints)
        };
      case LoyaltyTier.PLATINUM:
        return {
          nextTier: null,
          pointsToNextTier: 0
        };
      default:
        return {
          nextTier: LoyaltyTier.SILVER,
          pointsToNextTier: Math.max(0, silverThreshold - lifetimePoints)
        };
    }
  }
}
