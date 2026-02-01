import { CouponRepository } from '../repositories/coupon.repository';
import { Coupon, CouponWithStats } from '../entities/coupon.entity';
import { DiscountType, CouponStatus } from '../enums';
import {
  CreateCouponDto,
  UpdateCouponDto,
  CouponResponseDto,
  CouponListResponseDto,
  CouponFilterDto,
  CouponSummaryDto,
  ValidateCouponDto,
  CouponValidationResponseDto,
  ApplyDiscountDto,
  ApplyDiscountResponseDto,
  DiscountConfigResponseDto,
  UpdateDiscountConfigDto,
  CouponRedemptionResponseDto,
  CouponRedemptionListResponseDto
} from '../dto/coupon.dto';
import { CouponRedemptionWithDetails } from '../entities/coupon-redemption.entity';

/**
 * Coupon Service
 * Business logic for Coupon and Discount Management
 * Feature: F-023 Discount and Coupon Management
 */
export class CouponService {
  constructor(private readonly couponRepository: CouponRepository) {}

  // =====================================================
  // Coupon CRUD
  // =====================================================

  async findAll(filter?: CouponFilterDto): Promise<CouponListResponseDto> {
    const coupons = await this.couponRepository.findAll({
      status: filter?.status,
      discountType: filter?.discountType,
      code: filter?.code,
      includeExpired: filter?.includeExpired,
      validOn: filter?.validOn
    });

    const total = await this.couponRepository.count({
      status: filter?.status,
      discountType: filter?.discountType
    });

    return {
      data: coupons.map(this.toResponseDto),
      total
    };
  }

  async findById(id: string): Promise<CouponResponseDto | null> {
    const coupon = await this.couponRepository.findById(id);
    return coupon ? this.toResponseDto(coupon) : null;
  }

  async findByCode(code: string): Promise<CouponResponseDto | null> {
    const coupon = await this.couponRepository.findByCode(code);
    return coupon ? this.toResponseDto(coupon) : null;
  }

  async create(dto: CreateCouponDto, createdBy?: string): Promise<CouponResponseDto> {
    // Validate discount value for percentage type
    if (dto.discountType === DiscountType.PERCENTAGE && dto.discountValue > 100) {
      throw new Error('Percentage discount cannot exceed 100%');
    }

    const coupon = await this.couponRepository.create({
      code: dto.code.toUpperCase().trim(),
      description: dto.description?.trim() || null,
      discount_type: dto.discountType,
      discount_value: dto.discountValue,
      min_purchase_amount: dto.minPurchaseAmount ?? null,
      max_discount_amount: dto.maxDiscountAmount ?? null,
      max_redemptions: dto.maxRedemptions ?? null,
      valid_from: dto.validFrom,
      valid_until: dto.validUntil ?? null,
      requires_manager_approval: dto.requiresManagerApproval ?? false,
      created_by: createdBy || null,
      status: CouponStatus.ACTIVE
    });

    return this.toResponseDto(coupon);
  }

  async update(id: string, dto: UpdateCouponDto): Promise<CouponResponseDto> {
    const existing = await this.couponRepository.findById(id);
    if (!existing) {
      throw new Error(`Coupon with id "${id}" not found`);
    }

    // Validate discount value for percentage type
    const discountType = dto.discountType ?? existing.discount_type;
    const discountValue = dto.discountValue ?? existing.discount_value;
    if (discountType === DiscountType.PERCENTAGE && discountValue > 100) {
      throw new Error('Percentage discount cannot exceed 100%');
    }

    const coupon = await this.couponRepository.update(id, {
      ...(dto.code && { code: dto.code.toUpperCase().trim() }),
      ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
      ...(dto.discountType && { discount_type: dto.discountType }),
      ...(dto.discountValue !== undefined && { discount_value: dto.discountValue }),
      ...(dto.minPurchaseAmount !== undefined && { min_purchase_amount: dto.minPurchaseAmount }),
      ...(dto.maxDiscountAmount !== undefined && { max_discount_amount: dto.maxDiscountAmount }),
      ...(dto.maxRedemptions !== undefined && { max_redemptions: dto.maxRedemptions }),
      ...(dto.validFrom && { valid_from: dto.validFrom }),
      ...(dto.validUntil !== undefined && { valid_until: dto.validUntil }),
      ...(dto.status && { status: dto.status }),
      ...(dto.requiresManagerApproval !== undefined && { requires_manager_approval: dto.requiresManagerApproval })
    });

    return this.toResponseDto(coupon);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.couponRepository.findById(id);
    if (!existing) {
      throw new Error(`Coupon with id "${id}" not found`);
    }

    await this.couponRepository.delete(id);
  }

  async disable(id: string): Promise<CouponResponseDto> {
    return this.update(id, { status: CouponStatus.DISABLED });
  }

  async enable(id: string): Promise<CouponResponseDto> {
    return this.update(id, { status: CouponStatus.ACTIVE });
  }

  // =====================================================
  // Coupon Validation
  // =====================================================

  async validateCoupon(dto: ValidateCouponDto): Promise<CouponValidationResponseDto> {
    const result = await this.couponRepository.validateCoupon(dto.code, dto.purchaseAmount);

    if (!result.isValid) {
      return {
        isValid: false,
        error: result.error,
        requiresManagerApproval: false
      };
    }

    const coupon = await this.couponRepository.findById(result.couponId!);

    return {
      isValid: true,
      coupon: coupon ? this.toResponseDto(coupon) : undefined,
      discountAmount: result.discountAmount,
      finalPrice: result.finalPrice,
      requiresManagerApproval: result.requiresManagerApproval
    };
  }

  // =====================================================
  // Apply Discount
  // =====================================================

  async applyDiscount(dto: ApplyDiscountDto, appliedBy?: string): Promise<ApplyDiscountResponseDto> {
    const result = await this.couponRepository.applyDiscountToSale(
      dto.saleId,
      dto.couponId || null,
      dto.discountType,
      dto.discountValue,
      dto.originalPrice,
      appliedBy || null,
      dto.managerApprovedBy || null,
      dto.managerApprovalReason || null
    );

    return {
      success: result.success,
      saleId: result.saleId,
      discountId: result.discountId,
      originalPrice: result.originalPrice,
      discountAmount: result.discountAmount || 0,
      finalPrice: result.finalPrice || dto.originalPrice,
      requiresManagerApproval: result.requiresManagerApproval,
      managerApproved: result.managerApproved,
      error: result.error
    };
  }

  // =====================================================
  // Statistics & Redemptions
  // =====================================================

  async getSummary(): Promise<CouponSummaryDto> {
    const stats = await this.couponRepository.getStatistics();

    return {
      totalCoupons: stats.totalCoupons || 0,
      activeCoupons: stats.activeCoupons || 0,
      expiredCoupons: stats.expiredCoupons || 0,
      totalRedemptions: stats.totalRedemptions || 0,
      totalDiscountGiven: stats.totalDiscountGiven || 0
    };
  }

  async getRedemptions(options?: {
    couponId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<CouponRedemptionListResponseDto> {
    const redemptions = await this.couponRepository.findRedemptions(options);

    return {
      data: redemptions.map(this.toRedemptionDto),
      total: redemptions.length
    };
  }

  // =====================================================
  // Discount Configuration
  // =====================================================

  async getConfig(): Promise<DiscountConfigResponseDto | null> {
    const config = await this.couponRepository.getConfig();
    if (!config) return null;

    return {
      id: config.id,
      managerApprovalThreshold: config.manager_approval_threshold,
      maxDiscountPercentage: config.max_discount_percentage,
      maxDiscountAmount: config.max_discount_amount,
      discountsEnabled: config.discounts_enabled,
      couponsEnabled: config.coupons_enabled,
      createdAt: config.created_at,
      updatedAt: config.updated_at
    };
  }

  async updateConfig(dto: UpdateDiscountConfigDto): Promise<DiscountConfigResponseDto> {
    const config = await this.couponRepository.updateConfig({
      ...(dto.managerApprovalThreshold !== undefined && { manager_approval_threshold: dto.managerApprovalThreshold }),
      ...(dto.maxDiscountPercentage !== undefined && { max_discount_percentage: dto.maxDiscountPercentage }),
      ...(dto.maxDiscountAmount !== undefined && { max_discount_amount: dto.maxDiscountAmount }),
      ...(dto.discountsEnabled !== undefined && { discounts_enabled: dto.discountsEnabled }),
      ...(dto.couponsEnabled !== undefined && { coupons_enabled: dto.couponsEnabled })
    });

    return {
      id: config.id,
      managerApprovalThreshold: config.manager_approval_threshold,
      maxDiscountPercentage: config.max_discount_percentage,
      maxDiscountAmount: config.max_discount_amount,
      discountsEnabled: config.discounts_enabled,
      couponsEnabled: config.coupons_enabled,
      createdAt: config.created_at,
      updatedAt: config.updated_at
    };
  }

  // =====================================================
  // Mappers
  // =====================================================

  private toResponseDto(coupon: Coupon): CouponResponseDto {
    const today = new Date().toISOString().split('T')[0];
    const validUntil = coupon.valid_until;
    const validFrom = coupon.valid_from;

    // Calculate if coupon is currently valid
    const isDateValid = validFrom <= today && (!validUntil || validUntil >= today);
    const isRedemptionValid = !coupon.max_redemptions || coupon.current_redemptions < coupon.max_redemptions;
    const isValid = coupon.status === 'active' && isDateValid && isRedemptionValid;

    // Calculate days until expiry
    let daysUntilExpiry: number | null = null;
    if (validUntil) {
      const expiryDate = new Date(validUntil);
      const todayDate = new Date(today);
      daysUntilExpiry = Math.ceil((expiryDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Calculate remaining redemptions
    const remainingRedemptions = coupon.max_redemptions
      ? coupon.max_redemptions - coupon.current_redemptions
      : null;

    return {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      minPurchaseAmount: coupon.min_purchase_amount,
      maxDiscountAmount: coupon.max_discount_amount,
      maxRedemptions: coupon.max_redemptions,
      currentRedemptions: coupon.current_redemptions,
      remainingRedemptions,
      validFrom: coupon.valid_from,
      validUntil: coupon.valid_until,
      status: coupon.status,
      requiresManagerApproval: coupon.requires_manager_approval,
      isValid,
      daysUntilExpiry,
      createdBy: coupon.created_by,
      createdAt: coupon.created_at,
      updatedAt: coupon.updated_at
    };
  }

  private toRedemptionDto(redemption: CouponRedemptionWithDetails): CouponRedemptionResponseDto {
    return {
      id: redemption.id,
      couponId: redemption.coupon_id,
      couponCode: redemption.coupon?.code || '',
      saleId: redemption.sale_id,
      discountAmount: redemption.discount_amount,
      redeemedBy: redemption.redeemed_by,
      redeemedAt: redemption.redeemed_at,
      saleDate: redemption.sale?.sale_date || null,
      salePrice: redemption.sale?.sale_price || null,
      buyerName: redemption.sale?.buyer_name || null
    };
  }
}
