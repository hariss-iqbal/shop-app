import { SupabaseClient } from '@supabase/supabase-js';
import { Coupon, CouponInsert, CouponUpdate, CouponWithStats } from '../entities/coupon.entity';
import { CouponRedemption, CouponRedemptionWithDetails } from '../entities/coupon-redemption.entity';
import { DiscountConfig, DiscountConfigUpdate } from '../entities/discount-config.entity';
import { CouponStatus, DiscountType } from '../enums';

/**
 * Coupon Repository
 * Handles database operations for Coupon and related entities
 * Feature: F-023 Discount and Coupon Management
 */
export class CouponRepository {
  private readonly tableName = 'coupons';
  private readonly redemptionsTable = 'coupon_redemptions';
  private readonly configTable = 'discount_configs';

  constructor(private readonly supabase: SupabaseClient) {}

  // =====================================================
  // Coupon CRUD Operations
  // =====================================================

  async findAll(options?: {
    status?: CouponStatus;
    discountType?: DiscountType;
    code?: string;
    includeExpired?: boolean;
    validOn?: string;
    limit?: number;
    offset?: number;
  }): Promise<Coupon[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*');

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.discountType) {
      query = query.eq('discount_type', options.discountType);
    }

    if (options?.code) {
      query = query.ilike('code', `%${options.code}%`);
    }

    if (!options?.includeExpired) {
      query = query.neq('status', 'expired');
    }

    if (options?.validOn) {
      query = query
        .lte('valid_from', options.validOn)
        .or(`valid_until.is.null,valid_until.gte.${options.validOn}`);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async findById(id: string): Promise<Coupon | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .ilike('code', code)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(coupon: CouponInsert): Promise<Coupon> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(coupon)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, coupon: CouponUpdate): Promise<Coupon> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(coupon)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async count(options?: {
    status?: CouponStatus;
    discountType?: DiscountType;
  }): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.discountType) {
      query = query.eq('discount_type', options.discountType);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  // =====================================================
  // Coupon Validation
  // =====================================================

  async validateCoupon(code: string, purchaseAmount: number): Promise<{
    isValid: boolean;
    couponId?: string;
    code?: string;
    description?: string;
    discountType?: string;
    discountValue?: number;
    discountAmount?: number;
    finalPrice?: number;
    requiresManagerApproval: boolean;
    remainingRedemptions?: number | null;
    error?: string;
  }> {
    const { data, error } = await this.supabase.rpc('validate_coupon', {
      p_coupon_code: code,
      p_purchase_amount: purchaseAmount
    });

    if (error) throw error;

    return {
      isValid: data.isValid,
      couponId: data.couponId,
      code: data.code,
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      discountAmount: data.discountAmount,
      finalPrice: data.finalPrice,
      requiresManagerApproval: data.requiresManagerApproval,
      remainingRedemptions: data.remainingRedemptions,
      error: data.error
    };
  }

  // =====================================================
  // Apply Discount
  // =====================================================

  async applyDiscountToSale(
    saleId: string,
    couponId: string | null,
    discountType: DiscountType,
    discountValue: number,
    originalPrice: number,
    appliedBy?: string | null,
    managerApprovedBy?: string | null,
    managerApprovalReason?: string | null
  ): Promise<{
    success: boolean;
    discountId?: string;
    saleId: string;
    originalPrice: number;
    discountAmount?: number;
    finalPrice?: number;
    requiresManagerApproval: boolean;
    managerApproved: boolean;
    discountPercentage?: number;
    threshold?: number;
    error?: string;
  }> {
    const { data, error } = await this.supabase.rpc('apply_discount_to_sale', {
      p_sale_id: saleId,
      p_coupon_id: couponId,
      p_discount_type: discountType,
      p_discount_value: discountValue,
      p_original_price: originalPrice,
      p_applied_by: appliedBy || null,
      p_manager_approved_by: managerApprovedBy || null,
      p_manager_approval_reason: managerApprovalReason || null
    });

    if (error) throw error;

    return {
      success: data.success,
      discountId: data.discountId,
      saleId: data.saleId || saleId,
      originalPrice: data.originalPrice || originalPrice,
      discountAmount: data.discountAmount,
      finalPrice: data.finalPrice,
      requiresManagerApproval: data.requiresManagerApproval,
      managerApproved: data.managerApproved || false,
      discountPercentage: data.discountPercentage,
      threshold: data.threshold,
      error: data.error
    };
  }

  // =====================================================
  // Redemption History
  // =====================================================

  async findRedemptions(options?: {
    couponId?: string;
    saleId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<CouponRedemptionWithDetails[]> {
    let query = this.supabase
      .from(this.redemptionsTable)
      .select(`
        *,
        coupon:coupons(id, code, discount_type, discount_value),
        sale:sales(id, sale_date, sale_price, buyer_name)
      `);

    if (options?.couponId) {
      query = query.eq('coupon_id', options.couponId);
    }

    if (options?.saleId) {
      query = query.eq('sale_id', options.saleId);
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

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  // =====================================================
  // Statistics
  // =====================================================

  async getStatistics(couponId?: string): Promise<{
    totalCoupons?: number;
    activeCoupons?: number;
    expiredCoupons?: number;
    depletedCoupons?: number;
    disabledCoupons?: number;
    totalRedemptions: number;
    totalDiscountGiven: number;
    couponId?: string;
    code?: string;
    remainingRedemptions?: number | null;
    averageDiscount?: number;
    lastRedemption?: string | null;
  }> {
    const { data, error } = await this.supabase.rpc('get_coupon_statistics', {
      p_coupon_id: couponId || null
    });

    if (error) throw error;
    return data;
  }

  // =====================================================
  // Discount Configuration
  // =====================================================

  async getConfig(): Promise<DiscountConfig | null> {
    const { data, error } = await this.supabase
      .from(this.configTable)
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateConfig(config: DiscountConfigUpdate): Promise<DiscountConfig> {
    // Get existing config ID
    const existing = await this.getConfig();
    if (!existing) {
      throw new Error('Discount configuration not found');
    }

    const { data, error } = await this.supabase
      .from(this.configTable)
      .update(config)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
