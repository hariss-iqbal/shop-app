import { SupabaseClient } from '@supabase/supabase-js';
import {
  Refund,
  RefundInsert,
  RefundUpdate,
  RefundWithItems,
  RefundItem,
  RefundStatus,
  ProcessRefundResult,
  CheckReceiptRefundableResult,
  GetRefundByReceiptResult,
  PartialRefundItemInput,
  CheckPartialRefundableResult,
  ProcessPartialRefundResult
} from '../entities/refund.entity';

/**
 * Refund Repository
 * Handles database operations for Refund entity
 * Tables: refunds, refund_items
 * Feature: F-009 Full Refund Processing
 */
export class RefundRepository {
  private readonly tableName = 'refunds';
  private readonly itemsTableName = 'refund_items';

  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(options?: {
    startDate?: string;
    endDate?: string;
    status?: RefundStatus;
    customerPhone?: string;
    refundNumber?: string;
    isPartialRefund?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<RefundWithItems[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        items:refund_items(
          id,
          original_sale_id,
          phone_id,
          item_name,
          quantity,
          unit_price,
          total,
          inventory_restored,
          original_unit_price,
          is_custom_price,
          price_difference,
          created_at
        ),
        original_receipt:receipts(
          id,
          receipt_number,
          transaction_date,
          grand_total
        )
      `);

    if (options?.startDate) {
      query = query.gte('refund_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('refund_date', options.endDate);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.customerPhone) {
      const cleanedPhone = options.customerPhone.replace(/[^\d]/g, '');
      query = query.ilike('customer_phone', `%${cleanedPhone}%`);
    }
    if (options?.refundNumber) {
      query = query.ilike('refund_number', `%${options.refundNumber}%`);
    }
    if (options?.isPartialRefund !== undefined) {
      query = query.eq('is_partial_refund', options.isPartialRefund);
    }

    query = query.order('refund_date', { ascending: false });

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

  async findById(id: string): Promise<RefundWithItems | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        items:refund_items(
          id,
          original_sale_id,
          phone_id,
          item_name,
          quantity,
          unit_price,
          total,
          inventory_restored,
          original_unit_price,
          is_custom_price,
          price_difference,
          created_at
        ),
        original_receipt:receipts(
          id,
          receipt_number,
          transaction_date,
          grand_total
        )
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByRefundNumber(refundNumber: string): Promise<RefundWithItems | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        items:refund_items(
          id,
          original_sale_id,
          phone_id,
          item_name,
          quantity,
          unit_price,
          total,
          inventory_restored,
          original_unit_price,
          is_custom_price,
          price_difference,
          created_at
        ),
        original_receipt:receipts(
          id,
          receipt_number,
          transaction_date,
          grand_total
        )
      `)
      .eq('refund_number', refundNumber)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByReceiptId(receiptId: string): Promise<RefundWithItems | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        items:refund_items(
          id,
          original_sale_id,
          phone_id,
          item_name,
          quantity,
          unit_price,
          total,
          inventory_restored,
          original_unit_price,
          is_custom_price,
          price_difference,
          created_at
        ),
        original_receipt:receipts(
          id,
          receipt_number,
          transaction_date,
          grand_total
        )
      `)
      .eq('original_receipt_id', receiptId)
      .eq('status', 'completed')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(refund: RefundInsert): Promise<Refund> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(refund)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, refund: RefundUpdate): Promise<Refund> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(refund)
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
    startDate?: string;
    endDate?: string;
    status?: RefundStatus;
  }): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (options?.startDate) {
      query = query.gte('refund_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('refund_date', options.endDate);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  async getTotalRefundAmount(options?: {
    startDate?: string;
    endDate?: string;
    status?: RefundStatus;
  }): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('refund_amount');

    if (options?.startDate) {
      query = query.gte('refund_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('refund_date', options.endDate);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.reduce((sum, r) => sum + (r.refund_amount || 0), 0) || 0;
  }

  async getRefundsByMonth(year: number): Promise<{ month: number; count: number; amount: number }[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('refund_date, refund_amount')
      .gte('refund_date', `${year}-01-01`)
      .lte('refund_date', `${year}-12-31`)
      .eq('status', 'completed');

    if (error) throw error;

    const monthlyData: { [key: number]: { count: number; amount: number } } = {};
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = { count: 0, amount: 0 };
    }

    (data || []).forEach(refund => {
      const month = new Date(refund.refund_date).getMonth() + 1;
      monthlyData[month].count++;
      monthlyData[month].amount += refund.refund_amount || 0;
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month: parseInt(month),
      count: data.count,
      amount: data.amount
    }));
  }

  /**
   * Process a full refund using atomic RPC
   * Feature: F-009 Full Refund Processing
   */
  async processFullRefund(
    receiptId: string,
    refundReason?: string | null,
    notes?: string | null
  ): Promise<ProcessRefundResult> {
    const { data, error } = await this.supabase.rpc('process_full_refund', {
      p_receipt_id: receiptId,
      p_refund_reason: refundReason || null,
      p_notes: notes || null
    });

    if (error) throw error;

    return {
      success: data.success,
      refundId: data.refundId,
      refundNumber: data.refundNumber,
      originalReceiptId: data.originalReceiptId,
      originalReceiptNumber: data.originalReceiptNumber,
      refundAmount: data.refundAmount,
      itemsRefunded: data.itemsRefunded,
      inventoryRestored: data.inventoryRestored,
      items: data.items,
      error: data.error
    };
  }

  /**
   * Check if a receipt can be refunded
   * Feature: F-009 Full Refund Processing
   */
  async checkReceiptRefundable(receiptId: string): Promise<CheckReceiptRefundableResult> {
    const { data, error } = await this.supabase.rpc('check_receipt_refundable', {
      p_receipt_id: receiptId
    });

    if (error) throw error;

    return {
      canRefund: data.canRefund,
      reason: data.reason,
      receiptId: data.receiptId,
      receiptNumber: data.receiptNumber,
      transactionDate: data.transactionDate,
      transactionTime: data.transactionTime,
      subtotal: data.subtotal,
      taxRate: data.taxRate,
      taxAmount: data.taxAmount,
      grandTotal: data.grandTotal,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      existingRefundId: data.existingRefundId,
      existingRefundNumber: data.existingRefundNumber,
      items: data.items
    };
  }

  /**
   * Get refund by receipt ID using RPC
   * Feature: F-009 Full Refund Processing
   */
  async getRefundByReceipt(receiptId: string): Promise<GetRefundByReceiptResult> {
    const { data, error } = await this.supabase.rpc('get_refund_by_receipt', {
      p_receipt_id: receiptId
    });

    if (error) throw error;

    return {
      found: data.found,
      receiptId: data.receiptId,
      refund: data.refund
    };
  }

  /**
   * Find refunds by customer phone number
   */
  async findByCustomerPhone(customerPhone: string): Promise<RefundWithItems[]> {
    const cleanedPhone = customerPhone.replace(/[^\d]/g, '');

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        items:refund_items(
          id,
          original_sale_id,
          phone_id,
          item_name,
          quantity,
          unit_price,
          total,
          inventory_restored,
          original_unit_price,
          is_custom_price,
          price_difference,
          created_at
        ),
        original_receipt:receipts(
          id,
          receipt_number,
          transaction_date,
          grand_total
        )
      `)
      .ilike('customer_phone', `%${cleanedPhone}%`)
      .order('refund_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Check if a receipt can be partially refunded
   * Feature: F-010 Partial Refund Processing
   */
  async checkReceiptPartialRefundable(receiptId: string): Promise<CheckPartialRefundableResult> {
    const { data, error } = await this.supabase.rpc('check_receipt_partial_refundable', {
      p_receipt_id: receiptId
    });

    if (error) throw error;

    return {
      canPartialRefund: data.canPartialRefund,
      reason: data.reason,
      receiptId: data.receiptId,
      receiptNumber: data.receiptNumber,
      transactionDate: data.transactionDate,
      transactionTime: data.transactionTime,
      originalSubtotal: data.originalSubtotal,
      taxRate: data.taxRate,
      originalTaxAmount: data.originalTaxAmount,
      originalGrandTotal: data.originalGrandTotal,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      existingRefundId: data.existingRefundId,
      existingRefundNumber: data.existingRefundNumber,
      existingPartialRefunds: data.existingPartialRefunds,
      alreadyRefundedItemCount: data.alreadyRefundedItemCount,
      items: data.items
    };
  }

  /**
   * Process a partial refund using atomic RPC
   * Feature: F-010 Partial Refund Processing
   */
  async processPartialRefund(
    receiptId: string,
    items: PartialRefundItemInput[],
    refundReason?: string | null,
    notes?: string | null,
    managerApproved?: boolean,
    managerApprovalReason?: string | null
  ): Promise<ProcessPartialRefundResult> {
    const { data, error } = await this.supabase.rpc('process_partial_refund', {
      p_receipt_id: receiptId,
      p_items: items,
      p_refund_reason: refundReason || null,
      p_notes: notes || null,
      p_manager_approved: managerApproved || false,
      p_manager_approval_reason: managerApprovalReason || null
    });

    if (error) throw error;

    return {
      success: data.success,
      refundId: data.refundId,
      refundNumber: data.refundNumber,
      originalReceiptId: data.originalReceiptId,
      originalReceiptNumber: data.originalReceiptNumber,
      isPartialRefund: data.isPartialRefund,
      subtotal: data.subtotal,
      taxRate: data.taxRate,
      taxAmount: data.taxAmount,
      refundAmount: data.refundAmount,
      itemsRefunded: data.itemsRefunded,
      inventoryRestored: data.inventoryRestored,
      hasCustomPrices: data.hasCustomPrices,
      managerApproved: data.managerApproved,
      items: data.items,
      error: data.error
    };
  }

  /**
   * Find all partial refunds for a receipt
   */
  async findPartialRefundsByReceiptId(receiptId: string): Promise<RefundWithItems[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        items:refund_items(
          id,
          original_sale_id,
          phone_id,
          item_name,
          quantity,
          unit_price,
          total,
          inventory_restored,
          original_unit_price,
          is_custom_price,
          price_difference,
          created_at
        ),
        original_receipt:receipts(
          id,
          receipt_number,
          transaction_date,
          grand_total
        )
      `)
      .eq('original_receipt_id', receiptId)
      .eq('status', 'completed')
      .eq('is_partial_refund', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
