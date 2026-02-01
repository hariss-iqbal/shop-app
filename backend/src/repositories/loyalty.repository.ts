import { SupabaseClient } from '@supabase/supabase-js';
import {
  LoyaltyProgramConfig,
  LoyaltyProgramConfigInsert,
  LoyaltyProgramConfigUpdate,
  LoyaltyConfigResponse,
  CustomerLoyalty,
  CustomerLoyaltyInsert,
  CustomerLoyaltyUpdate,
  CustomerLoyaltyWithCustomer,
  CustomerLoyaltyProfileResponse,
  EnrollCustomerLoyaltyResponse,
  LoyaltyTransaction,
  LoyaltyTransactionInsert,
  LoyaltyTransactionWithRelations,
  AwardLoyaltyPointsResponse,
  RedeemLoyaltyPointsResponse,
  CalculatePointsEarnedResponse,
  CalculateMaxRedeemableResponse,
  AdjustLoyaltyPointsResponse
} from '../entities';
import { LoyaltyTransactionType } from '../enums';

/**
 * Loyalty Repository
 * Data access layer for loyalty program entities
 * Feature: F-022 Loyalty Points Integration
 */
export class LoyaltyRepository {
  private readonly configTableName = 'loyalty_program_config';
  private readonly loyaltyTableName = 'customer_loyalty';
  private readonly transactionTableName = 'loyalty_transactions';

  constructor(private readonly supabase: SupabaseClient) {}

  // ============================================================================
  // Loyalty Program Configuration
  // ============================================================================

  /**
   * Get loyalty program configuration using database function
   */
  async getConfig(): Promise<LoyaltyConfigResponse> {
    const { data, error } = await this.supabase.rpc('get_loyalty_config');
    if (error) throw error;
    return data as LoyaltyConfigResponse;
  }

  /**
   * Get raw configuration record
   */
  async getConfigRecord(): Promise<LoyaltyProgramConfig | null> {
    const { data, error } = await this.supabase
      .from(this.configTableName)
      .select('*')
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Create or update loyalty program configuration
   */
  async upsertConfig(config: LoyaltyProgramConfigInsert | LoyaltyProgramConfigUpdate): Promise<LoyaltyProgramConfig> {
    const existing = await this.getConfigRecord();

    if (existing) {
      const { data, error } = await this.supabase
        .from(this.configTableName)
        .update(config as LoyaltyProgramConfigUpdate)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await this.supabase
        .from(this.configTableName)
        .insert(config as LoyaltyProgramConfigInsert)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  // ============================================================================
  // Customer Loyalty
  // ============================================================================

  /**
   * Get all customer loyalty records with customer info
   */
  async findAllLoyalty(options?: {
    tier?: string;
    minBalance?: number;
    limit?: number;
    offset?: number;
  }): Promise<CustomerLoyaltyWithCustomer[]> {
    let query = this.supabase
      .from(this.loyaltyTableName)
      .select(`
        *,
        customer:customers(id, name, phone, email)
      `);

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

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get customer loyalty by customer ID
   */
  async findByCustomerId(customerId: string): Promise<CustomerLoyaltyWithCustomer | null> {
    const { data, error } = await this.supabase
      .from(this.loyaltyTableName)
      .select(`
        *,
        customer:customers(id, name, phone, email)
      `)
      .eq('customer_id', customerId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Get customer loyalty by ID
   */
  async findLoyaltyById(id: string): Promise<CustomerLoyaltyWithCustomer | null> {
    const { data, error } = await this.supabase
      .from(this.loyaltyTableName)
      .select(`
        *,
        customer:customers(id, name, phone, email)
      `)
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Create customer loyalty record
   */
  async createLoyalty(loyalty: CustomerLoyaltyInsert): Promise<CustomerLoyalty> {
    const { data, error } = await this.supabase
      .from(this.loyaltyTableName)
      .insert(loyalty)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * Update customer loyalty record
   */
  async updateLoyalty(id: string, loyalty: CustomerLoyaltyUpdate): Promise<CustomerLoyalty> {
    const { data, error } = await this.supabase
      .from(this.loyaltyTableName)
      .update(loyalty)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * Count customer loyalty records
   */
  async countLoyalty(tier?: string): Promise<number> {
    let query = this.supabase
      .from(this.loyaltyTableName)
      .select('*', { count: 'exact', head: true });

    if (tier) {
      query = query.eq('current_tier', tier);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }

  // ============================================================================
  // Loyalty Transactions
  // ============================================================================

  /**
   * Get transactions for a customer loyalty record
   */
  async findTransactionsByLoyaltyId(
    customerLoyaltyId: string,
    options?: {
      type?: LoyaltyTransactionType;
      limit?: number;
      offset?: number;
    }
  ): Promise<LoyaltyTransaction[]> {
    let query = this.supabase
      .from(this.transactionTableName)
      .select('*')
      .eq('customer_loyalty_id', customerLoyaltyId);

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

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get transaction by ID with relations
   */
  async findTransactionById(id: string): Promise<LoyaltyTransactionWithRelations | null> {
    const { data, error } = await this.supabase
      .from(this.transactionTableName)
      .select(`
        *,
        customer_loyalty:customer_loyalty(
          id,
          customer_id,
          current_tier,
          customer:customers(id, name, phone)
        ),
        sale:sales(id, sale_date, sale_price)
      `)
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Create a loyalty transaction
   */
  async createTransaction(transaction: LoyaltyTransactionInsert): Promise<LoyaltyTransaction> {
    const { data, error } = await this.supabase
      .from(this.transactionTableName)
      .insert(transaction)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * Count transactions for a customer loyalty record
   */
  async countTransactions(customerLoyaltyId: string, type?: LoyaltyTransactionType): Promise<number> {
    let query = this.supabase
      .from(this.transactionTableName)
      .select('*', { count: 'exact', head: true })
      .eq('customer_loyalty_id', customerLoyaltyId);

    if (type) {
      query = query.eq('transaction_type', type);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }

  // ============================================================================
  // Database Functions (RPC)
  // ============================================================================

  /**
   * Enroll customer in loyalty program
   */
  async enrollCustomer(customerId: string): Promise<EnrollCustomerLoyaltyResponse> {
    const { data, error } = await this.supabase.rpc('enroll_customer_loyalty', {
      p_customer_id: customerId
    });
    if (error) throw error;
    return data as EnrollCustomerLoyaltyResponse;
  }

  /**
   * Get customer loyalty profile with transaction history
   */
  async getCustomerProfile(customerId: string): Promise<CustomerLoyaltyProfileResponse> {
    const { data, error } = await this.supabase.rpc('get_customer_loyalty_profile', {
      p_customer_id: customerId
    });
    if (error) throw error;
    return data as CustomerLoyaltyProfileResponse;
  }

  /**
   * Calculate points to be earned for a purchase
   */
  async calculatePointsEarned(
    customerId: string,
    purchaseAmount: number
  ): Promise<CalculatePointsEarnedResponse> {
    const { data, error } = await this.supabase.rpc('calculate_loyalty_points_earned', {
      p_customer_id: customerId,
      p_purchase_amount: purchaseAmount
    });
    if (error) throw error;
    return data as CalculatePointsEarnedResponse;
  }

  /**
   * Calculate maximum points redeemable for a purchase
   */
  async calculateMaxRedeemable(
    customerId: string,
    purchaseAmount: number
  ): Promise<CalculateMaxRedeemableResponse> {
    const { data, error } = await this.supabase.rpc('calculate_max_redeemable_points', {
      p_customer_id: customerId,
      p_purchase_amount: purchaseAmount
    });
    if (error) throw error;
    return data as CalculateMaxRedeemableResponse;
  }

  /**
   * Award loyalty points for a sale
   */
  async awardPoints(
    customerId: string,
    saleId: string,
    purchaseAmount: number
  ): Promise<AwardLoyaltyPointsResponse> {
    const { data, error } = await this.supabase.rpc('award_loyalty_points', {
      p_customer_id: customerId,
      p_sale_id: saleId,
      p_purchase_amount: purchaseAmount
    });
    if (error) throw error;
    return data as AwardLoyaltyPointsResponse;
  }

  /**
   * Redeem loyalty points for a sale
   */
  async redeemPoints(
    customerId: string,
    saleId: string,
    pointsToRedeem: number
  ): Promise<RedeemLoyaltyPointsResponse> {
    const { data, error } = await this.supabase.rpc('redeem_loyalty_points', {
      p_customer_id: customerId,
      p_sale_id: saleId,
      p_points_to_redeem: pointsToRedeem
    });
    if (error) throw error;
    return data as RedeemLoyaltyPointsResponse;
  }

  /**
   * Manually adjust points
   */
  async adjustPoints(
    customerId: string,
    points: number,
    reason: string,
    transactionType: 'adjusted' | 'bonus' = 'adjusted'
  ): Promise<AdjustLoyaltyPointsResponse> {
    const { data, error } = await this.supabase.rpc('adjust_loyalty_points', {
      p_customer_id: customerId,
      p_points: points,
      p_reason: reason,
      p_transaction_type: transactionType
    });
    if (error) throw error;
    return data as AdjustLoyaltyPointsResponse;
  }
}
