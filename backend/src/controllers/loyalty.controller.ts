import { LoyaltyService, InputSanitizationService } from '../services';
import { LOYALTY_CONSTRAINTS } from '../constants/validation.constants';
import {
  LoyaltyConfigResponseDto,
  UpdateLoyaltyConfigDto,
  CustomerLoyaltyResponseDto,
  CustomerLoyaltyListResponseDto,
  CustomerLoyaltyProfileResponseDto,
  LoyaltyTransactionListResponseDto,
  PointsEarnedResponseDto,
  MaxRedeemableResponseDto,
  AwardPointsResponseDto,
  RedeemPointsResponseDto,
  AdjustPointsResponseDto,
  AwardPointsDto,
  RedeemPointsDto,
  AdjustPointsDto,
  EnrollCustomerDto,
  CalculatePointsEarnedDto,
  CalculateMaxRedeemableDto
} from '../dto';
import { LoyaltyTier, LoyaltyTransactionType, isValidLoyaltyTier } from '../enums';

/**
 * Loyalty Controller
 * HTTP handler layer for loyalty points feature
 * Feature: F-022 Loyalty Points Integration
 */
export class LoyaltyController {
  private readonly sanitizer = new InputSanitizationService();

  constructor(private readonly loyaltyService: LoyaltyService) {}

  // ============================================================================
  // Loyalty Program Configuration
  // ============================================================================

  /**
   * Get loyalty program configuration
   */
  async getConfig(): Promise<LoyaltyConfigResponseDto> {
    return this.loyaltyService.getConfig();
  }

  /**
   * Update loyalty program configuration
   */
  async updateConfig(dto: UpdateLoyaltyConfigDto): Promise<LoyaltyConfigResponseDto> {
    this.validateUpdateConfigDto(dto);
    return this.loyaltyService.updateConfig(dto);
  }

  // ============================================================================
  // Customer Loyalty
  // ============================================================================

  /**
   * Get all customer loyalty records
   */
  async getAllLoyalty(options?: {
    tier?: string;
    minBalance?: number;
    limit?: number;
    offset?: number;
  }): Promise<CustomerLoyaltyListResponseDto> {
    if (options?.tier && !isValidLoyaltyTier(options.tier)) {
      throw new Error(`Invalid tier: ${options.tier}. Valid values are: bronze, silver, gold, platinum`);
    }

    return this.loyaltyService.getAllLoyalty({
      tier: options?.tier as LoyaltyTier,
      minBalance: options?.minBalance,
      limit: options?.limit,
      offset: options?.offset
    });
  }

  /**
   * Enroll customer in loyalty program
   */
  async enrollCustomer(dto: EnrollCustomerDto): Promise<CustomerLoyaltyResponseDto> {
    this.validateEnrollCustomerDto(dto);
    return this.loyaltyService.enrollCustomer(dto.customerId);
  }

  /**
   * Get customer loyalty by customer ID
   */
  async getByCustomerId(customerId: string): Promise<CustomerLoyaltyResponseDto | null> {
    if (!customerId || customerId.trim().length === 0) {
      throw new Error('Customer ID is required');
    }
    return this.loyaltyService.getByCustomerId(customerId);
  }

  /**
   * Get customer loyalty profile with transaction history
   */
  async getCustomerProfile(customerId: string): Promise<CustomerLoyaltyProfileResponseDto> {
    if (!customerId || customerId.trim().length === 0) {
      throw new Error('Customer ID is required');
    }
    return this.loyaltyService.getCustomerProfile(customerId);
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
      type?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<LoyaltyTransactionListResponseDto> {
    if (!customerId || customerId.trim().length === 0) {
      throw new Error('Customer ID is required');
    }

    let transactionType: LoyaltyTransactionType | undefined;
    if (options?.type) {
      if (!Object.values(LoyaltyTransactionType).includes(options.type as LoyaltyTransactionType)) {
        throw new Error(`Invalid transaction type: ${options.type}`);
      }
      transactionType = options.type as LoyaltyTransactionType;
    }

    return this.loyaltyService.getTransactions(customerId, {
      type: transactionType,
      limit: options?.limit,
      offset: options?.offset
    });
  }

  // ============================================================================
  // Points Calculation
  // ============================================================================

  /**
   * Calculate points to be earned for a purchase
   */
  async calculatePointsEarned(dto: CalculatePointsEarnedDto): Promise<PointsEarnedResponseDto> {
    this.validateCalculatePointsDto(dto);
    return this.loyaltyService.calculatePointsEarned(dto.customerId, dto.purchaseAmount);
  }

  /**
   * Calculate maximum points redeemable for a purchase
   */
  async calculateMaxRedeemable(dto: CalculateMaxRedeemableDto): Promise<MaxRedeemableResponseDto> {
    this.validateCalculatePointsDto(dto);
    return this.loyaltyService.calculateMaxRedeemable(dto.customerId, dto.purchaseAmount);
  }

  // ============================================================================
  // Points Award/Redeem
  // ============================================================================

  /**
   * Award loyalty points for a sale
   */
  async awardPoints(dto: AwardPointsDto): Promise<AwardPointsResponseDto> {
    this.validateAwardPointsDto(dto);
    return this.loyaltyService.awardPoints(dto.customerId, dto.saleId, dto.purchaseAmount);
  }

  /**
   * Redeem loyalty points for a sale
   */
  async redeemPoints(dto: RedeemPointsDto): Promise<RedeemPointsResponseDto> {
    this.validateRedeemPointsDto(dto);
    return this.loyaltyService.redeemPoints(dto.customerId, dto.saleId, dto.pointsToRedeem);
  }

  /**
   * Manually adjust points
   */
  async adjustPoints(dto: AdjustPointsDto): Promise<AdjustPointsResponseDto> {
    const sanitizedDto = this.sanitizeAdjustPointsDto(dto);
    this.validateAdjustPointsDto(sanitizedDto);
    return this.loyaltyService.adjustPoints(
      sanitizedDto.customerId,
      sanitizedDto.points,
      sanitizedDto.reason,
      sanitizedDto.transactionType || 'adjusted'
    );
  }

  // ============================================================================
  // Validation
  // ============================================================================

  private validateUpdateConfigDto(dto: UpdateLoyaltyConfigDto): void {
    if (dto.pointsPerDollar !== undefined) {
      if (dto.pointsPerDollar < LOYALTY_CONSTRAINTS.POINTS_PER_DOLLAR_MIN ||
          dto.pointsPerDollar > LOYALTY_CONSTRAINTS.POINTS_PER_DOLLAR_MAX) {
        throw new Error(`Points per dollar must be between ${LOYALTY_CONSTRAINTS.POINTS_PER_DOLLAR_MIN} and ${LOYALTY_CONSTRAINTS.POINTS_PER_DOLLAR_MAX}`);
      }
    }

    if (dto.redemptionRate !== undefined) {
      if (dto.redemptionRate < LOYALTY_CONSTRAINTS.REDEMPTION_RATE_MIN ||
          dto.redemptionRate > LOYALTY_CONSTRAINTS.REDEMPTION_RATE_MAX) {
        throw new Error(`Redemption rate must be between ${LOYALTY_CONSTRAINTS.REDEMPTION_RATE_MIN} and ${LOYALTY_CONSTRAINTS.REDEMPTION_RATE_MAX}`);
      }
    }

    if (dto.minPointsToRedeem !== undefined) {
      if (dto.minPointsToRedeem < LOYALTY_CONSTRAINTS.MIN_POINTS_TO_REDEEM_MIN ||
          dto.minPointsToRedeem > LOYALTY_CONSTRAINTS.MIN_POINTS_TO_REDEEM_MAX) {
        throw new Error(`Minimum points to redeem must be between ${LOYALTY_CONSTRAINTS.MIN_POINTS_TO_REDEEM_MIN} and ${LOYALTY_CONSTRAINTS.MIN_POINTS_TO_REDEEM_MAX}`);
      }
    }

    if (dto.maxRedemptionPercent !== undefined) {
      if (dto.maxRedemptionPercent < LOYALTY_CONSTRAINTS.MAX_REDEMPTION_PERCENT_MIN ||
          dto.maxRedemptionPercent > LOYALTY_CONSTRAINTS.MAX_REDEMPTION_PERCENT_MAX) {
        throw new Error(`Maximum redemption percent must be between ${LOYALTY_CONSTRAINTS.MAX_REDEMPTION_PERCENT_MIN} and ${LOYALTY_CONSTRAINTS.MAX_REDEMPTION_PERCENT_MAX}`);
      }
    }

    // Validate tier thresholds are in ascending order
    const silver = dto.silverThreshold;
    const gold = dto.goldThreshold;
    const platinum = dto.platinumThreshold;

    if (silver !== undefined && gold !== undefined && silver >= gold) {
      throw new Error('Silver threshold must be less than Gold threshold');
    }

    if (gold !== undefined && platinum !== undefined && gold >= platinum) {
      throw new Error('Gold threshold must be less than Platinum threshold');
    }

    // Validate multipliers
    const multipliers = [dto.bronzeMultiplier, dto.silverMultiplier, dto.goldMultiplier, dto.platinumMultiplier];
    for (const mult of multipliers) {
      if (mult !== undefined) {
        if (mult < LOYALTY_CONSTRAINTS.MULTIPLIER_MIN || mult > LOYALTY_CONSTRAINTS.MULTIPLIER_MAX) {
          throw new Error(`Tier multiplier must be between ${LOYALTY_CONSTRAINTS.MULTIPLIER_MIN} and ${LOYALTY_CONSTRAINTS.MULTIPLIER_MAX}`);
        }
      }
    }

    if (dto.pointsExpirationDays !== undefined) {
      if (dto.pointsExpirationDays < LOYALTY_CONSTRAINTS.EXPIRATION_DAYS_MIN ||
          dto.pointsExpirationDays > LOYALTY_CONSTRAINTS.EXPIRATION_DAYS_MAX) {
        throw new Error(`Points expiration days must be between ${LOYALTY_CONSTRAINTS.EXPIRATION_DAYS_MIN} and ${LOYALTY_CONSTRAINTS.EXPIRATION_DAYS_MAX}`);
      }
    }
  }

  private validateEnrollCustomerDto(dto: EnrollCustomerDto): void {
    if (!dto.customerId || dto.customerId.trim().length === 0) {
      throw new Error('Customer ID is required');
    }
  }

  private validateCalculatePointsDto(dto: { customerId: string; purchaseAmount: number }): void {
    if (!dto.customerId || dto.customerId.trim().length === 0) {
      throw new Error('Customer ID is required');
    }

    if (dto.purchaseAmount === undefined || dto.purchaseAmount < 0) {
      throw new Error('Purchase amount must be a non-negative number');
    }
  }

  private validateAwardPointsDto(dto: AwardPointsDto): void {
    if (!dto.customerId || dto.customerId.trim().length === 0) {
      throw new Error('Customer ID is required');
    }

    if (!dto.saleId || dto.saleId.trim().length === 0) {
      throw new Error('Sale ID is required');
    }

    if (dto.purchaseAmount === undefined || dto.purchaseAmount < 0) {
      throw new Error('Purchase amount must be a non-negative number');
    }
  }

  private validateRedeemPointsDto(dto: RedeemPointsDto): void {
    if (!dto.customerId || dto.customerId.trim().length === 0) {
      throw new Error('Customer ID is required');
    }

    if (!dto.saleId || dto.saleId.trim().length === 0) {
      throw new Error('Sale ID is required');
    }

    if (dto.pointsToRedeem === undefined || dto.pointsToRedeem <= 0) {
      throw new Error('Points to redeem must be a positive number');
    }
  }

  private validateAdjustPointsDto(dto: AdjustPointsDto): void {
    if (!dto.customerId || dto.customerId.trim().length === 0) {
      throw new Error('Customer ID is required');
    }

    if (dto.points === undefined || dto.points === 0) {
      throw new Error('Points must be a non-zero number');
    }

    if (!dto.reason || dto.reason.trim().length === 0) {
      throw new Error('Reason is required for points adjustment');
    }

    if (dto.reason.length > LOYALTY_CONSTRAINTS.REASON_MAX) {
      throw new Error(`Reason must not exceed ${LOYALTY_CONSTRAINTS.REASON_MAX} characters`);
    }

    if (dto.transactionType && !['adjusted', 'bonus'].includes(dto.transactionType)) {
      throw new Error('Transaction type must be either "adjusted" or "bonus"');
    }
  }

  // ============================================================================
  // Sanitization
  // ============================================================================

  private sanitizeAdjustPointsDto(dto: AdjustPointsDto): AdjustPointsDto {
    return {
      ...dto,
      reason: this.sanitizer.sanitizeString(dto.reason)
    };
  }
}
