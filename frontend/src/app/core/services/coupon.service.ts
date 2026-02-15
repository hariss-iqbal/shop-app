import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DiscountType, CouponStatus } from '../../enums';
import {
  Coupon,
  CreateCouponRequest,
  UpdateCouponRequest,
  CouponListResponse,
  CouponFilter,
  CouponSummary,
  ValidateCouponRequest,
  CouponValidationResponse,
  ApplyDiscountRequest,
  ApplyDiscountResponse,
  DiscountConfig,
  UpdateDiscountConfigRequest,
  CouponRedemption,
  CouponRedemptionListResponse
} from '../../models/coupon.model';

/**
 * Coupon Service
 * Handles coupon and discount operations
 * Feature: F-023 Discount and Coupon Management
 */
@Injectable({
  providedIn: 'root'
})
export class CouponService {
  constructor(private supabase: SupabaseService) { }

  // =====================================================
  // Coupon CRUD
  // =====================================================

  async getCoupons(filter?: CouponFilter): Promise<CouponListResponse> {
    let query = this.supabase
      .from('coupons')
      .select('*', { count: 'exact' });

    if (filter?.status) {
      query = query.eq('status', filter.status);
    }

    if (filter?.discountType) {
      query = query.eq('discount_type', filter.discountType);
    }

    if (filter?.code) {
      query = query.ilike('code', `%${filter.code}%`);
    }

    if (!filter?.includeExpired) {
      query = query.neq('status', 'expired');
    }

    if (filter?.validOn) {
      query = query
        .lte('valid_from', filter.validOn)
        .or(`valid_until.is.null,valid_until.gte.${filter.validOn}`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: (data || []).map(this.mapToCoupon),
      total: count || 0
    };
  }

  async getCouponById(id: string): Promise<Coupon | null> {
    const { data, error } = await this.supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return data ? this.mapToCoupon(data) : null;
  }

  async getCouponByCode(code: string): Promise<Coupon | null> {
    const { data, error } = await this.supabase
      .from('coupons')
      .select('*')
      .ilike('code', code)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return data ? this.mapToCoupon(data) : null;
  }

  async createCoupon(request: CreateCouponRequest): Promise<Coupon> {
    const { data, error } = await this.supabase
      .from('coupons')
      .insert({
        code: request.code.toUpperCase().trim(),
        description: request.description?.trim() || null,
        discount_type: request.discountType,
        discount_value: request.discountValue,
        min_purchase_amount: request.minPurchaseAmount ?? null,
        max_discount_amount: request.maxDiscountAmount ?? null,
        max_redemptions: request.maxRedemptions ?? null,
        valid_from: request.validFrom,
        valid_until: request.validUntil ?? null,
        requires_manager_approval: request.requiresManagerApproval ?? false,
        status: CouponStatus.ACTIVE
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapToCoupon(data);
  }

  async updateCoupon(id: string, request: UpdateCouponRequest): Promise<Coupon> {
    const updateData: Record<string, unknown> = {};

    if (request.code !== undefined) updateData['code'] = request.code.toUpperCase().trim();
    if (request.description !== undefined) updateData['description'] = request.description?.trim() || null;
    if (request.discountType !== undefined) updateData['discount_type'] = request.discountType;
    if (request.discountValue !== undefined) updateData['discount_value'] = request.discountValue;
    if (request.minPurchaseAmount !== undefined) updateData['min_purchase_amount'] = request.minPurchaseAmount;
    if (request.maxDiscountAmount !== undefined) updateData['max_discount_amount'] = request.maxDiscountAmount;
    if (request.maxRedemptions !== undefined) updateData['max_redemptions'] = request.maxRedemptions;
    if (request.validFrom !== undefined) updateData['valid_from'] = request.validFrom;
    if (request.validUntil !== undefined) updateData['valid_until'] = request.validUntil;
    if (request.status !== undefined) updateData['status'] = request.status;
    if (request.requiresManagerApproval !== undefined) updateData['requires_manager_approval'] = request.requiresManagerApproval;

    const { data, error } = await this.supabase
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapToCoupon(data);
  }

  async deleteCoupon(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async disableCoupon(id: string): Promise<Coupon> {
    return this.updateCoupon(id, { status: CouponStatus.DISABLED });
  }

  async enableCoupon(id: string): Promise<Coupon> {
    return this.updateCoupon(id, { status: CouponStatus.ACTIVE });
  }

  // =====================================================
  // Coupon Validation
  // =====================================================

  async validateCoupon(request: ValidateCouponRequest): Promise<CouponValidationResponse> {
    const { data, error } = await this.supabase.rpc('validate_coupon', {
      p_coupon_code: request.code,
      p_purchase_amount: request.purchaseAmount
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.isValid) {
      return {
        isValid: false,
        error: data.error,
        requiresManagerApproval: false
      };
    }

    // Fetch full coupon details
    const coupon = await this.getCouponById(data.couponId);

    return {
      isValid: true,
      coupon: coupon || undefined,
      discountAmount: data.discountAmount,
      finalPrice: data.finalPrice,
      requiresManagerApproval: data.requiresManagerApproval
    };
  }

  // =====================================================
  // Apply Discount
  // =====================================================

  async applyDiscount(request: ApplyDiscountRequest): Promise<ApplyDiscountResponse> {
    const { data, error } = await this.supabase.rpc('apply_discount_to_sale', {
      p_sale_id: request.saleId,
      p_coupon_id: request.couponId || null,
      p_discount_type: request.discountType,
      p_discount_value: request.discountValue,
      p_original_price: request.originalPrice,
      p_applied_by: null,
      p_manager_approved_by: request.managerApprovedBy || null,
      p_manager_approval_reason: request.managerApprovalReason || null
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: data.success,
      saleId: data.saleId || request.saleId,
      discountId: data.discountId,
      originalPrice: data.originalPrice || request.originalPrice,
      discountAmount: data.discountAmount || 0,
      finalPrice: data.finalPrice || request.originalPrice,
      requiresManagerApproval: data.requiresManagerApproval,
      managerApproved: data.managerApproved || false,
      error: data.error
    };
  }

  // =====================================================
  // Statistics & Summary
  // =====================================================

  async getSummary(): Promise<CouponSummary> {
    const { data, error } = await this.supabase.rpc('get_coupon_statistics', {
      p_coupon_id: null
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      totalCoupons: data.totalCoupons || 0,
      activeCoupons: data.activeCoupons || 0,
      expiredCoupons: data.expiredCoupons || 0,
      totalRedemptions: data.totalRedemptions || 0,
      totalDiscountGiven: data.totalDiscountGiven || 0
    };
  }

  async getRedemptions(options?: {
    couponId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<CouponRedemptionListResponse> {
    let query = this.supabase
      .from('coupon_redemptions')
      .select(`
        *,
        coupon:coupons(id, code, discount_type, discount_value),
        sale:sales(id, sale_date, sale_price, buyer_name)
      `, { count: 'exact' });

    if (options?.couponId) {
      query = query.eq('coupon_id', options.couponId);
    }

    if (options?.startDate) {
      query = query.gte('redeemed_at', options.startDate);
    }

    if (options?.endDate) {
      query = query.lte('redeemed_at', options.endDate);
    }

    query = query.order('redeemed_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: (data || []).map(this.mapToRedemption),
      total: count || 0
    };
  }

  // =====================================================
  // Discount Configuration
  // =====================================================

  async getConfig(): Promise<DiscountConfig | null> {
    const { data, error } = await this.supabase
      .from('discount_configs')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    if (!data) return null;

    return {
      id: data.id,
      managerApprovalThreshold: data.manager_approval_threshold,
      maxDiscountPercentage: data.max_discount_percentage,
      maxDiscountAmount: data.max_discount_amount,
      discountsEnabled: data.discounts_enabled,
      couponsEnabled: data.coupons_enabled,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async updateConfig(request: UpdateDiscountConfigRequest): Promise<DiscountConfig> {
    // Get existing config
    const existing = await this.getConfig();
    if (!existing) {
      throw new Error('Discount configuration not found');
    }

    const updateData: Record<string, unknown> = {};

    if (request.managerApprovalThreshold !== undefined) updateData['manager_approval_threshold'] = request.managerApprovalThreshold;
    if (request.maxDiscountPercentage !== undefined) updateData['max_discount_percentage'] = request.maxDiscountPercentage;
    if (request.maxDiscountAmount !== undefined) updateData['max_discount_amount'] = request.maxDiscountAmount;
    if (request.discountsEnabled !== undefined) updateData['discounts_enabled'] = request.discountsEnabled;
    if (request.couponsEnabled !== undefined) updateData['coupons_enabled'] = request.couponsEnabled;

    const { data, error } = await this.supabase
      .from('discount_configs')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data.id,
      managerApprovalThreshold: data.manager_approval_threshold,
      maxDiscountPercentage: data.max_discount_percentage,
      maxDiscountAmount: data.max_discount_amount,
      discountsEnabled: data.discounts_enabled,
      couponsEnabled: data.coupons_enabled,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  // =====================================================
  // Mappers
  // =====================================================

  private mapToCoupon(data: Record<string, unknown>): Coupon {
    const today = new Date().toISOString().split('T')[0];
    const validUntil = data['valid_until'] as string | null;
    const validFrom = data['valid_from'] as string;
    const maxRedemptions = data['max_redemptions'] as number | null;
    const currentRedemptions = data['current_redemptions'] as number;
    const status = data['status'] as CouponStatus;

    // Calculate if coupon is currently valid
    const isDateValid = validFrom <= today && (!validUntil || validUntil >= today);
    const isRedemptionValid = !maxRedemptions || currentRedemptions < maxRedemptions;
    const isValid = status === CouponStatus.ACTIVE && isDateValid && isRedemptionValid;

    // Calculate days until expiry
    let daysUntilExpiry: number | null = null;
    if (validUntil) {
      const expiryDate = new Date(validUntil);
      const todayDate = new Date(today);
      daysUntilExpiry = Math.ceil((expiryDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Calculate remaining redemptions
    const remainingRedemptions = maxRedemptions
      ? maxRedemptions - currentRedemptions
      : null;

    return {
      id: data['id'] as string,
      code: data['code'] as string,
      description: data['description'] as string | null,
      discountType: data['discount_type'] as DiscountType,
      discountValue: data['discount_value'] as number,
      minPurchaseAmount: data['min_purchase_amount'] as number | null,
      maxDiscountAmount: data['max_discount_amount'] as number | null,
      maxRedemptions,
      currentRedemptions,
      remainingRedemptions,
      validFrom,
      validUntil,
      status,
      requiresManagerApproval: data['requires_manager_approval'] as boolean,
      isValid,
      daysUntilExpiry,
      createdBy: data['created_by'] as string | null,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string | null
    };
  }

  private mapToRedemption(data: Record<string, unknown>): CouponRedemption {
    const coupon = data['coupon'] as Record<string, unknown> | null;
    const sale = data['sale'] as Record<string, unknown> | null;

    return {
      id: data['id'] as string,
      couponId: data['coupon_id'] as string,
      couponCode: coupon ? (coupon['code'] as string) : '',
      saleId: data['sale_id'] as string,
      discountAmount: data['discount_amount'] as number,
      redeemedBy: data['redeemed_by'] as string | null,
      redeemedAt: data['redeemed_at'] as string,
      saleDate: sale ? (sale['sale_date'] as string) : null,
      salePrice: sale ? (sale['sale_price'] as number) : null,
      buyerName: sale ? (sale['buyer_name'] as string | null) : null
    };
  }
}
