import { CouponService } from '../services/coupon.service';
import { AuditLogService } from '../services/audit-log.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
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
  CouponRedemptionListResponseDto
} from '../dto/coupon.dto';
import { COUPON_CONSTRAINTS, DISCOUNT_CONFIG_CONSTRAINTS } from '../constants/validation.constants';
import { DiscountType, CouponStatus } from '../enums';

/**
 * Coupon Controller
 * HTTP request handling for Coupon and Discount Management
 * Routes: /api/coupons, /api/discounts
 *
 * Security: All text inputs are sanitized to prevent XSS (F-058).
 * Feature: F-023 Discount and Coupon Management
 */
export class CouponController {
  private readonly sanitizer = new InputSanitizationService();

  constructor(
    private readonly couponService: CouponService,
    private readonly auditLogService?: AuditLogService
  ) {}

  // =====================================================
  // Coupon CRUD
  // =====================================================

  async getAll(filter?: CouponFilterDto): Promise<CouponListResponseDto> {
    return this.couponService.findAll(filter);
  }

  async getById(id: string): Promise<CouponResponseDto> {
    const coupon = await this.couponService.findById(id);
    if (!coupon) {
      throw new Error('Coupon not found');
    }
    return coupon;
  }

  async getByCode(code: string): Promise<CouponResponseDto> {
    const sanitizedCode = this.sanitizer.sanitizeString(code);
    if (sanitizedCode.length > COUPON_CONSTRAINTS.CODE_MAX) {
      throw new Error(`Coupon code must not exceed ${COUPON_CONSTRAINTS.CODE_MAX} characters`);
    }

    const coupon = await this.couponService.findByCode(sanitizedCode);
    if (!coupon) {
      throw new Error('Coupon not found');
    }
    return coupon;
  }

  async create(dto: CreateCouponDto, userId?: string, clientIp?: string, userAgent?: string): Promise<CouponResponseDto> {
    const sanitizedDto = this.sanitizeCouponDto(dto);
    this.validateCreateDto(sanitizedDto);

    const coupon = await this.couponService.create(sanitizedDto, userId);

    // Audit log
    if (this.auditLogService) {
      try {
        await this.auditLogService.log({
          eventType: 'coupon_created',
          resourceType: 'coupon',
          resourceId: coupon.id,
          action: 'create',
          newValue: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue },
          performedBy: userId,
          clientIp,
          userAgent
        });
      } catch (error) {
        console.error('Failed to log coupon creation:', error);
      }
    }

    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto, userId?: string, clientIp?: string, userAgent?: string): Promise<CouponResponseDto> {
    const sanitizedDto = this.sanitizeCouponDto(dto);
    this.validateUpdateDto(sanitizedDto);

    const coupon = await this.couponService.update(id, sanitizedDto);

    // Audit log
    if (this.auditLogService) {
      try {
        await this.auditLogService.log({
          eventType: 'coupon_updated',
          resourceType: 'coupon',
          resourceId: id,
          action: 'update',
          newValue: sanitizedDto,
          performedBy: userId,
          clientIp,
          userAgent
        });
      } catch (error) {
        console.error('Failed to log coupon update:', error);
      }
    }

    return coupon;
  }

  async delete(id: string, userId?: string, clientIp?: string, userAgent?: string): Promise<void> {
    const coupon = await this.couponService.findById(id);
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    await this.couponService.delete(id);

    // Audit log
    if (this.auditLogService) {
      try {
        await this.auditLogService.log({
          eventType: 'coupon_deleted',
          resourceType: 'coupon',
          resourceId: id,
          action: 'delete',
          oldValue: { code: coupon.code },
          performedBy: userId,
          clientIp,
          userAgent
        });
      } catch (error) {
        console.error('Failed to log coupon deletion:', error);
      }
    }
  }

  async disable(id: string, userId?: string): Promise<CouponResponseDto> {
    return this.couponService.disable(id);
  }

  async enable(id: string, userId?: string): Promise<CouponResponseDto> {
    return this.couponService.enable(id);
  }

  // =====================================================
  // Coupon Validation
  // =====================================================

  async validateCoupon(dto: ValidateCouponDto): Promise<CouponValidationResponseDto> {
    const sanitizedCode = this.sanitizer.sanitizeString(dto.code);
    if (!sanitizedCode) {
      throw new Error('Coupon code is required');
    }
    if (sanitizedCode.length > COUPON_CONSTRAINTS.CODE_MAX) {
      throw new Error(`Coupon code must not exceed ${COUPON_CONSTRAINTS.CODE_MAX} characters`);
    }
    if (dto.purchaseAmount < 0) {
      throw new Error('Purchase amount must be positive');
    }

    return this.couponService.validateCoupon({
      code: sanitizedCode,
      purchaseAmount: dto.purchaseAmount
    });
  }

  // =====================================================
  // Apply Discount
  // =====================================================

  async applyDiscount(dto: ApplyDiscountDto, userId?: string, clientIp?: string, userAgent?: string): Promise<ApplyDiscountResponseDto> {
    this.validateApplyDiscountDto(dto);

    const result = await this.couponService.applyDiscount({
      ...dto,
      managerApprovalReason: dto.managerApprovalReason
        ? this.sanitizer.sanitizeString(dto.managerApprovalReason)
        : null
    }, userId);

    // Audit log for successful discount application
    if (result.success && this.auditLogService) {
      try {
        await this.auditLogService.log({
          eventType: 'discount_applied',
          resourceType: 'sale_discount',
          resourceId: result.discountId,
          action: 'create',
          newValue: {
            saleId: dto.saleId,
            discountType: dto.discountType,
            discountValue: dto.discountValue,
            originalPrice: dto.originalPrice,
            discountAmount: result.discountAmount,
            finalPrice: result.finalPrice,
            couponId: dto.couponId
          },
          performedBy: userId,
          clientIp,
          userAgent
        });
      } catch (error) {
        console.error('Failed to log discount application:', error);
      }
    }

    return result;
  }

  // =====================================================
  // Statistics & Redemptions
  // =====================================================

  async getSummary(): Promise<CouponSummaryDto> {
    return this.couponService.getSummary();
  }

  async getRedemptions(options?: {
    couponId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<CouponRedemptionListResponseDto> {
    return this.couponService.getRedemptions(options);
  }

  // =====================================================
  // Discount Configuration
  // =====================================================

  async getConfig(): Promise<DiscountConfigResponseDto | null> {
    return this.couponService.getConfig();
  }

  async updateConfig(dto: UpdateDiscountConfigDto, userId?: string, clientIp?: string, userAgent?: string): Promise<DiscountConfigResponseDto> {
    this.validateConfigDto(dto);

    const config = await this.couponService.updateConfig(dto);

    // Audit log
    if (this.auditLogService) {
      try {
        await this.auditLogService.log({
          eventType: 'discount_config_updated',
          resourceType: 'discount_config',
          resourceId: config.id,
          action: 'update',
          newValue: dto,
          performedBy: userId,
          clientIp,
          userAgent
        });
      } catch (error) {
        console.error('Failed to log config update:', error);
      }
    }

    return config;
  }

  // =====================================================
  // Validation Helpers
  // =====================================================

  private sanitizeCouponDto<T extends Partial<CreateCouponDto>>(dto: T): T {
    return {
      ...dto,
      code: dto.code ? this.sanitizer.sanitizeString(dto.code) : dto.code,
      description: dto.description ? this.sanitizer.sanitizeString(dto.description) : dto.description
    };
  }

  private validateCreateDto(dto: CreateCouponDto): void {
    if (!dto.code) {
      throw new Error('Coupon code is required');
    }
    if (dto.code.length > COUPON_CONSTRAINTS.CODE_MAX) {
      throw new Error(`Coupon code must not exceed ${COUPON_CONSTRAINTS.CODE_MAX} characters`);
    }
    if (dto.description && dto.description.length > COUPON_CONSTRAINTS.DESCRIPTION_MAX) {
      throw new Error(`Description must not exceed ${COUPON_CONSTRAINTS.DESCRIPTION_MAX} characters`);
    }
    if (!dto.discountType) {
      throw new Error('Discount type is required');
    }
    if (!Object.values(DiscountType).includes(dto.discountType)) {
      throw new Error('Invalid discount type');
    }
    if (dto.discountValue === undefined || dto.discountValue < COUPON_CONSTRAINTS.DISCOUNT_VALUE_MIN) {
      throw new Error('Discount value must be a positive number');
    }
    if (dto.discountType === DiscountType.PERCENTAGE && dto.discountValue > COUPON_CONSTRAINTS.DISCOUNT_PERCENTAGE_MAX) {
      throw new Error(`Percentage discount must not exceed ${COUPON_CONSTRAINTS.DISCOUNT_PERCENTAGE_MAX}%`);
    }
    if (dto.discountType === DiscountType.FIXED_AMOUNT && dto.discountValue > COUPON_CONSTRAINTS.DISCOUNT_AMOUNT_MAX) {
      throw new Error(`Fixed discount must not exceed ${COUPON_CONSTRAINTS.DISCOUNT_AMOUNT_MAX}`);
    }
    if (!dto.validFrom) {
      throw new Error('Valid from date is required');
    }
    if (dto.validUntil && dto.validUntil < dto.validFrom) {
      throw new Error('Valid until date must be after valid from date');
    }
    if (dto.maxRedemptions !== undefined && dto.maxRedemptions !== null) {
      if (dto.maxRedemptions < COUPON_CONSTRAINTS.MAX_REDEMPTIONS_MIN) {
        throw new Error(`Max redemptions must be at least ${COUPON_CONSTRAINTS.MAX_REDEMPTIONS_MIN}`);
      }
      if (dto.maxRedemptions > COUPON_CONSTRAINTS.MAX_REDEMPTIONS_MAX) {
        throw new Error(`Max redemptions must not exceed ${COUPON_CONSTRAINTS.MAX_REDEMPTIONS_MAX}`);
      }
    }
  }

  private validateUpdateDto(dto: UpdateCouponDto): void {
    if (dto.code && dto.code.length > COUPON_CONSTRAINTS.CODE_MAX) {
      throw new Error(`Coupon code must not exceed ${COUPON_CONSTRAINTS.CODE_MAX} characters`);
    }
    if (dto.description && dto.description.length > COUPON_CONSTRAINTS.DESCRIPTION_MAX) {
      throw new Error(`Description must not exceed ${COUPON_CONSTRAINTS.DESCRIPTION_MAX} characters`);
    }
    if (dto.discountType && !Object.values(DiscountType).includes(dto.discountType)) {
      throw new Error('Invalid discount type');
    }
    if (dto.status && !Object.values(CouponStatus).includes(dto.status)) {
      throw new Error('Invalid coupon status');
    }
    if (dto.discountValue !== undefined && dto.discountValue < COUPON_CONSTRAINTS.DISCOUNT_VALUE_MIN) {
      throw new Error('Discount value must be a positive number');
    }
    if (dto.validFrom && dto.validUntil && dto.validUntil < dto.validFrom) {
      throw new Error('Valid until date must be after valid from date');
    }
  }

  private validateApplyDiscountDto(dto: ApplyDiscountDto): void {
    if (!dto.saleId) {
      throw new Error('Sale ID is required');
    }
    if (!dto.discountType) {
      throw new Error('Discount type is required');
    }
    if (!Object.values(DiscountType).includes(dto.discountType)) {
      throw new Error('Invalid discount type');
    }
    if (dto.discountValue === undefined || dto.discountValue < 0) {
      throw new Error('Discount value must be a positive number');
    }
    if (dto.originalPrice === undefined || dto.originalPrice < 0) {
      throw new Error('Original price must be a positive number');
    }
    if (dto.managerApprovalReason && dto.managerApprovalReason.length > COUPON_CONSTRAINTS.MANAGER_APPROVAL_REASON_MAX) {
      throw new Error(`Manager approval reason must not exceed ${COUPON_CONSTRAINTS.MANAGER_APPROVAL_REASON_MAX} characters`);
    }
  }

  private validateConfigDto(dto: UpdateDiscountConfigDto): void {
    if (dto.managerApprovalThreshold !== undefined) {
      if (dto.managerApprovalThreshold < DISCOUNT_CONFIG_CONSTRAINTS.MANAGER_APPROVAL_THRESHOLD_MIN ||
          dto.managerApprovalThreshold > DISCOUNT_CONFIG_CONSTRAINTS.MANAGER_APPROVAL_THRESHOLD_MAX) {
        throw new Error(`Manager approval threshold must be between ${DISCOUNT_CONFIG_CONSTRAINTS.MANAGER_APPROVAL_THRESHOLD_MIN} and ${DISCOUNT_CONFIG_CONSTRAINTS.MANAGER_APPROVAL_THRESHOLD_MAX}`);
      }
    }
    if (dto.maxDiscountPercentage !== undefined) {
      if (dto.maxDiscountPercentage < DISCOUNT_CONFIG_CONSTRAINTS.MAX_DISCOUNT_PERCENTAGE_MIN ||
          dto.maxDiscountPercentage > DISCOUNT_CONFIG_CONSTRAINTS.MAX_DISCOUNT_PERCENTAGE_MAX) {
        throw new Error(`Max discount percentage must be between ${DISCOUNT_CONFIG_CONSTRAINTS.MAX_DISCOUNT_PERCENTAGE_MIN} and ${DISCOUNT_CONFIG_CONSTRAINTS.MAX_DISCOUNT_PERCENTAGE_MAX}`);
      }
    }
    if (dto.maxDiscountAmount !== undefined) {
      if (dto.maxDiscountAmount < DISCOUNT_CONFIG_CONSTRAINTS.MAX_DISCOUNT_AMOUNT_MIN ||
          dto.maxDiscountAmount > DISCOUNT_CONFIG_CONSTRAINTS.MAX_DISCOUNT_AMOUNT_MAX) {
        throw new Error(`Max discount amount must be between ${DISCOUNT_CONFIG_CONSTRAINTS.MAX_DISCOUNT_AMOUNT_MIN} and ${DISCOUNT_CONFIG_CONSTRAINTS.MAX_DISCOUNT_AMOUNT_MAX}`);
      }
    }
  }
}
