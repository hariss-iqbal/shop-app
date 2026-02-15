import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  Refund,
  RefundListResponse,
  RefundFilter,
  RefundSummary,
  ProcessFullRefundRequest,
  ProcessRefundResponse,
  CheckReceiptRefundableResponse,
  GetRefundByReceiptResponse,
  ProcessPartialRefundRequest,
  ProcessPartialRefundResponse,
  CheckPartialRefundableResponse
} from '../../models/refund.model';

/**
 * Refund Service
 * Handles refund operations including full refund processing with inventory restoration
 * Feature: F-009 Full Refund Processing
 */
@Injectable({
  providedIn: 'root'
})
export class RefundService {
  constructor(private supabase: SupabaseService) { }

  /**
   * Get all refunds with optional filtering
   */
  async getRefunds(filter?: RefundFilter): Promise<RefundListResponse> {
    let query = this.supabase
      .from('refunds')
      .select(`
        *,
        items:refund_items(
          id,
          original_sale_id,
          product_id,
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
      `, { count: 'exact' });

    if (filter?.startDate) {
      query = query.gte('refund_date', filter.startDate);
    }

    if (filter?.endDate) {
      query = query.lte('refund_date', filter.endDate);
    }

    if (filter?.status) {
      query = query.eq('status', filter.status);
    }

    if (filter?.customerPhone) {
      const cleanedPhone = filter.customerPhone.replace(/[^\d]/g, '');
      query = query.ilike('customer_phone', `%${cleanedPhone}%`);
    }

    if (filter?.refundNumber) {
      query = query.ilike('refund_number', `%${filter.refundNumber}%`);
    }

    query = query.order('refund_date', { ascending: false });

    if (filter?.limit) {
      query = query.limit(filter.limit);
    }

    if (filter?.page && filter?.limit) {
      const offset = (filter.page - 1) * filter.limit;
      query = query.range(offset, offset + filter.limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: (data || []).map(this.mapToRefund),
      total: count || 0
    };
  }

  /**
   * Get a refund by ID
   */
  async getRefundById(id: string): Promise<Refund | null> {
    const { data, error } = await this.supabase
      .from('refunds')
      .select(`
        *,
        items:refund_items(
          id,
          original_sale_id,
          product_id,
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

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return data ? this.mapToRefund(data) : null;
  }

  /**
   * Get a refund by refund number
   */
  async getRefundByNumber(refundNumber: string): Promise<Refund | null> {
    const { data, error } = await this.supabase
      .from('refunds')
      .select(`
        *,
        items:refund_items(
          id,
          original_sale_id,
          product_id,
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

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return data ? this.mapToRefund(data) : null;
  }

  /**
   * Process a full refund for an entire transaction
   * Creates refund record, refund items, and restores inventory
   * Feature: F-009 Full Refund Processing
   */
  async processFullRefund(request: ProcessFullRefundRequest): Promise<ProcessRefundResponse> {
    const { data, error } = await this.supabase.rpc('process_full_refund', {
      p_receipt_id: request.receiptId,
      p_refund_reason: request.refundReason?.trim() || null,
      p_notes: request.notes?.trim() || null
    });

    if (error) {
      throw new Error(error.message);
    }

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
   * Returns details about the receipt and any existing refunds
   * Feature: F-009 Full Refund Processing
   */
  async checkReceiptRefundable(receiptId: string): Promise<CheckReceiptRefundableResponse> {
    const { data, error } = await this.supabase.rpc('check_receipt_refundable', {
      p_receipt_id: receiptId
    });

    if (error) {
      throw new Error(error.message);
    }

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
   * Get refund by receipt ID
   * Feature: F-009 Full Refund Processing
   */
  async getRefundByReceipt(receiptId: string): Promise<GetRefundByReceiptResponse> {
    const { data, error } = await this.supabase.rpc('get_refund_by_receipt', {
      p_receipt_id: receiptId
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.found || !data.refund) {
      return {
        found: false,
        receiptId
      };
    }

    const refundData = data.refund;
    return {
      found: true,
      receiptId,
      refund: {
        id: refundData.id,
        refundNumber: refundData.refundNumber,
        originalReceiptId: refundData.originalReceiptId,
        originalReceiptNumber: null,
        refundDate: refundData.refundDate,
        refundTime: refundData.refundTime,
        subtotal: refundData.subtotal,
        taxRate: refundData.taxRate,
        taxAmount: refundData.taxAmount,
        refundAmount: refundData.refundAmount,
        refundReason: refundData.refundReason,
        customerName: refundData.customerName,
        customerPhone: refundData.customerPhone,
        customerEmail: refundData.customerEmail,
        status: refundData.status,
        notes: refundData.notes,
        items: refundData.items.map((item: Record<string, unknown>) => ({
          id: item['id'] as string,
          originalSaleId: item['originalSaleId'] as string | null,
          productId: item['phoneId'] as string | null,
          itemName: item['itemName'] as string,
          quantity: item['quantity'] as number,
          unitPrice: item['unitPrice'] as number,
          total: item['total'] as number,
          inventoryRestored: item['inventoryRestored'] as boolean,
          productModel: item['phoneModel'] as string | null,
          brandName: item['brandName'] as string | null
        })),
        itemCount: refundData.items.length,
        inventoryRestoredCount: refundData.items.filter((i: { inventoryRestored: boolean }) => i.inventoryRestored).length,
        isPartialRefund: refundData.isPartialRefund ?? false,
        managerApproved: refundData.managerApproved ?? false,
        managerApprovedAt: refundData.managerApprovedAt ?? null,
        managerApprovalReason: refundData.managerApprovalReason ?? null,
        hasCustomPrices: refundData.hasCustomPrices ?? false,
        createdAt: refundData.createdAt,
        updatedAt: null
      }
    };
  }

  /**
   * Get refund summary statistics
   */
  async getSummary(filter?: RefundFilter): Promise<RefundSummary> {
    let query = this.supabase
      .from('refunds')
      .select(`
        refund_amount,
        items:refund_items(id, inventory_restored)
      `)
      .eq('status', 'completed');

    if (filter?.startDate) {
      query = query.gte('refund_date', filter.startDate);
    }

    if (filter?.endDate) {
      query = query.lte('refund_date', filter.endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const refunds = data || [];
    let totalItemsRefunded = 0;
    let totalInventoryRestored = 0;

    refunds.forEach(refund => {
      const items = refund.items as Array<{ id: string; inventory_restored: boolean }> || [];
      totalItemsRefunded += items.length;
      totalInventoryRestored += items.filter(i => i.inventory_restored).length;
    });

    return {
      totalRefunds: refunds.length,
      totalRefundAmount: refunds.reduce((sum, r) => sum + (r.refund_amount || 0), 0),
      totalItemsRefunded,
      totalInventoryRestored
    };
  }

  /**
   * Find all refunds for a customer by their phone number
   */
  async findByCustomerPhone(customerPhone: string): Promise<RefundListResponse> {
    if (!customerPhone || !customerPhone.trim()) {
      throw new Error('Phone number is required');
    }

    const cleanedPhone = customerPhone.replace(/[^\d]/g, '');

    const { data, error } = await this.supabase
      .from('refunds')
      .select(`
        *,
        items:refund_items(
          id,
          original_sale_id,
          product_id,
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

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: (data || []).map(this.mapToRefund),
      total: data?.length || 0
    };
  }

  /**
   * Check if a receipt can be partially refunded
   * Returns detailed item info for selection
   * Feature: F-010 Partial Refund Processing
   */
  async checkReceiptPartialRefundable(receiptId: string): Promise<CheckPartialRefundableResponse> {
    const { data, error } = await this.supabase.rpc('check_receipt_partial_refundable', {
      p_receipt_id: receiptId
    });

    if (error) {
      throw new Error(error.message);
    }

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
   * Process a partial refund with custom return prices
   * Creates refund record, refund items for selected items, and restores inventory
   * Feature: F-010 Partial Refund Processing
   */
  async processPartialRefund(request: ProcessPartialRefundRequest): Promise<ProcessPartialRefundResponse> {
    const { data, error } = await this.supabase.rpc('process_partial_refund', {
      p_receipt_id: request.receiptId,
      p_items: request.items,
      p_refund_reason: request.refundReason?.trim() || null,
      p_notes: request.notes?.trim() || null,
      p_manager_approved: request.managerApproved || false,
      p_manager_approval_reason: request.managerApprovalReason?.trim() || null
    });

    if (error) {
      throw new Error(error.message);
    }

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
   * Feature: F-010 Partial Refund Processing
   */
  async findPartialRefundsByReceiptId(receiptId: string): Promise<RefundListResponse> {
    const { data, error } = await this.supabase
      .from('refunds')
      .select(`
        *,
        items:refund_items(
          id,
          original_sale_id,
          product_id,
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

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: (data || []).map(this.mapToRefund),
      total: data?.length || 0
    };
  }

  private mapToRefund(data: Record<string, unknown>): Refund {
    const items = (data['items'] as Array<Record<string, unknown>> || []).map(item => ({
      id: item['id'] as string,
      originalSaleId: item['original_sale_id'] as string | null,
      productId: item['product_id'] as string | null,
      itemName: item['item_name'] as string,
      quantity: item['quantity'] as number,
      unitPrice: item['unit_price'] as number,
      total: item['total'] as number,
      inventoryRestored: item['inventory_restored'] as boolean,
      originalUnitPrice: item['original_unit_price'] as number | null,
      isCustomPrice: item['is_custom_price'] as boolean || false,
      priceDifference: item['price_difference'] as number || 0
    }));

    const originalReceipt = data['original_receipt'] as Record<string, unknown> | null;
    const hasCustomPrices = items.some(i => i.isCustomPrice);

    return {
      id: data['id'] as string,
      refundNumber: data['refund_number'] as string,
      originalReceiptId: data['original_receipt_id'] as string | null,
      originalReceiptNumber: originalReceipt ? originalReceipt['receipt_number'] as string : null,
      refundDate: data['refund_date'] as string,
      refundTime: data['refund_time'] as string,
      subtotal: data['subtotal'] as number,
      taxRate: data['tax_rate'] as number,
      taxAmount: data['tax_amount'] as number,
      refundAmount: data['refund_amount'] as number,
      refundReason: data['refund_reason'] as string | null,
      customerName: data['customer_name'] as string | null,
      customerPhone: data['customer_phone'] as string | null,
      customerEmail: data['customer_email'] as string | null,
      status: data['status'] as 'pending' | 'completed' | 'cancelled',
      notes: data['notes'] as string | null,
      isPartialRefund: data['is_partial_refund'] as boolean || false,
      managerApproved: data['manager_approved'] as boolean || false,
      managerApprovedAt: data['manager_approved_at'] as string | null,
      managerApprovalReason: data['manager_approval_reason'] as string | null,
      items,
      itemCount: items.length,
      inventoryRestoredCount: items.filter(i => i.inventoryRestored).length,
      hasCustomPrices,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string | null
    };
  }
}
