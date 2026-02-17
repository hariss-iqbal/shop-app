import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { PaymentMethod } from '../../enums/payment-method.enum';
import {
  Sale,
  SaleListResponse,
  SaleFilter,
  SaleSummary,
  MarkAsSoldRequest,
  CompleteSaleTransactionRequest,
  CustomerPurchaseHistory,
  InventoryAvailabilityResult,
  SaleWithInventoryDeductionResponse,
  BatchSaleWithInventoryDeductionResponse
} from '../../models/sale.model';
import {
  FollowUpPaymentRequest,
  FollowUpPaymentResponse,
  BatchPaymentHistory
} from '../../models/payment.model';

/**
 * Sale Service
 * Handles sales operations with automatic inventory deduction
 * Feature: F-008 Automatic Inventory Deduction
 */
@Injectable({
  providedIn: 'root'
})
export class SaleService {
  constructor(private supabase: SupabaseService) { }

  async getSales(filter?: SaleFilter): Promise<SaleListResponse> {
    let query = this.supabase
      .from('sales')
      .select(`
        *,
        product:products(
          id,
          model,
          brand:brands(id, name)
        ),
        location:store_locations(
          id,
          name,
          code
        )
      `, { count: 'exact' });

    if (filter?.startDate) {
      query = query.gte('sale_date', filter.startDate);
    }

    if (filter?.endDate) {
      query = query.lte('sale_date', filter.endDate);
    }

    if (filter?.locationId) {
      query = query.eq('location_id', filter.locationId);
    }

    if (filter?.paymentStatus) {
      query = query.eq('payment_status', filter.paymentStatus);
    }

    query = query.order('sale_date', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: (data || []).map(this.mapToSale),
      total: count || 0
    };
  }

  async getSummary(filter?: SaleFilter): Promise<SaleSummary> {
    let query = this.supabase
      .from('sales')
      .select('sale_price, cost_price, sale_date');

    if (filter?.startDate) {
      query = query.gte('sale_date', filter.startDate);
    }

    if (filter?.endDate) {
      query = query.lte('sale_date', filter.endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const sales = data || [];
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, s) => sum + (s.sale_price || 0), 0);
    const totalCost = sales.reduce((sum, s) => sum + (s.cost_price || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalSales,
      totalRevenue,
      totalCost,
      totalProfit,
      averageMargin
    };
  }

  /**
   * Check inventory availability for products before completing a sale
   * Feature: F-008 Automatic Inventory Deduction
   */
  async checkInventoryAvailability(productIds: string[]): Promise<InventoryAvailabilityResult> {
    const { data, error } = await this.supabase.rpc('check_inventory_availability', {
      p_product_ids: productIds
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      allAvailable: data.allAvailable,
      hasWarnings: data.hasWarnings,
      allowOversell: data.allowOversell,
      products: data.phones,
      warnings: data.warnings
    };
  }

  /**
   * Mark a product as sold with automatic inventory deduction
   * Uses atomic RPC to ensure consistency
   * Feature: F-008 Automatic Inventory Deduction
   * Feature: F-024 Multi-Location Inventory Support
   */
  async markAsSold(request: MarkAsSoldRequest): Promise<SaleWithInventoryDeductionResponse> {
    const { data, error } = await this.supabase.rpc('complete_sale_with_inventory_deduction', {
      p_product_id: request.productId,
      p_sale_date: request.saleDate,
      p_sale_price: request.salePrice,
      p_buyer_name: request.buyerName?.trim() || null,
      p_buyer_phone: request.buyerPhone?.trim() || null,
      p_buyer_email: request.buyerEmail?.trim() || null,
      p_notes: request.notes?.trim() || null,
      p_location_id: request.locationId || null
    });

    if (error) {
      throw new Error(error.message);
    }

    // If the RPC succeeded, fetch the complete sale data
    if (data.success && data.saleId) {
      const { data: saleData, error: fetchError } = await this.supabase
        .from('sales')
        .select(`
          *,
          product:products(
            id,
            model,
            brand:brands(id, name)
          )
        `)
        .eq('id', data.saleId)
        .single();

      if (fetchError) {
        console.error('Error fetching sale after creation:', fetchError);
      }

      return {
        success: true,
        sale: saleData ? this.mapToSale(saleData) : undefined,
        productId: data.productId,
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
        warning: data.warning,
        inventoryDeducted: data.inventoryDeducted
      };
    }

    return {
      success: data.success,
      productId: data.productId,
      inventoryDeducted: data.inventoryDeducted,
      error: data.error
    };
  }

  /**
   * Complete a sales transaction with multiple items using atomic inventory deduction
   * All items are processed atomically - all succeed or all fail
   * Feature: F-008 Automatic Inventory Deduction
   * Feature: F-024 Multi-Location Inventory Support
   */
  async completeSaleTransaction(request: CompleteSaleTransactionRequest): Promise<BatchSaleWithInventoryDeductionResponse> {
    const { data, error } = await this.supabase.rpc('complete_batch_sale_with_inventory_deduction', {
      p_items: request.items.map(item => ({
        productId: item.productId,
        salePrice: item.salePrice
      })),
      p_sale_date: request.saleDate,
      p_buyer_name: request.customerInfo.name?.trim() || null,
      p_buyer_phone: request.customerInfo.phone?.trim() || null,
      p_buyer_email: request.customerInfo.email?.trim() || null,
      p_notes: request.notes?.trim() || null,
      p_location_id: request.locationId || null,
      p_total_paid: request.totalPaid ?? null,
      p_grand_total: request.grandTotal ?? null
    });

    if (error) {
      throw new Error(error.message);
    }

    // If the RPC succeeded, fetch the complete sale data for all created sales
    if (data.success && data.sales && data.sales.length > 0) {
      const saleIds = data.sales.map((s: { saleId: string }) => s.saleId);

      const { data: salesData, error: fetchError } = await this.supabase
        .from('sales')
        .select(`
          *,
          product:products(
            id,
            model,
            brand:brands(id, name)
          )
        `)
        .in('id', saleIds);

      if (fetchError) {
        console.error('Error fetching sales after creation:', fetchError);
      }

      return {
        success: true,
        totalItems: data.totalItems,
        processedItems: data.processedItems,
        sales: salesData ? salesData.map(this.mapToSale) : undefined,
        warnings: data.warnings,
        inventoryDeducted: data.inventoryDeducted
      };
    }

    return {
      success: data.success,
      totalItems: data.totalItems,
      processedItems: data.processedItems,
      inventoryDeducted: data.inventoryDeducted,
      error: data.error
    };
  }

  /**
   * Delete a sale and restore inventory (product status to available)
   * Feature: F-008 Automatic Inventory Deduction
   */
  async deleteSale(saleId: string): Promise<{ success: boolean; inventoryRestored: boolean; error?: string }> {
    const { data, error } = await this.supabase.rpc('revert_sale_restore_inventory', {
      p_sale_id: saleId
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: data.success,
      inventoryRestored: data.inventoryRestored,
      error: data.error
    };
  }

  /**
   * Find all sales for a customer by their phone number
   * Returns purchase history with transactions sorted by date (most recent first)
   */
  async findByBuyerPhone(buyerPhone: string): Promise<CustomerPurchaseHistory> {
    if (!buyerPhone || !buyerPhone.trim()) {
      throw new Error('Phone number is required');
    }

    const cleanedPhone = buyerPhone.replace(/[^\d]/g, '');

    const { data, error } = await this.supabase
      .from('sales')
      .select(`
        *,
        product:products(
          id,
          model,
          brand:brands(id, name)
        )
      `)
      .ilike('buyer_phone', `%${cleanedPhone}%`)
      .order('sale_date', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const sales = (data || []).map(this.mapToSale);
    const totalSpent = sales.reduce((sum, sale) => sum + sale.salePrice, 0);

    const firstSale = sales.length > 0 ? sales[0] : null;

    return {
      customerPhone: buyerPhone,
      customerName: firstSale?.buyerName || null,
      customerEmail: firstSale?.buyerEmail || null,
      totalTransactions: sales.length,
      totalSpent,
      transactions: sales
    };
  }

  /**
   * Get customer purchase history by phone number
   * Alias for findByBuyerPhone for convenience
   */
  async getCustomerHistory(phone: string): Promise<CustomerPurchaseHistory> {
    return this.findByBuyerPhone(phone);
  }

  /**
   * Get inventory deduction logs for a specific product
   * Feature: F-008 Automatic Inventory Deduction
   */
  async getInventoryDeductionLogs(productId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('inventory_deduction_logs')
      .select(`
        *,
        sale:sales(id, sale_date, sale_price),
        product:products(id, model, brand:brands(id, name))
      `)
      .eq('product_id', productId)
      .order('deducted_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Record a follow-up payment against a batch
   */
  async recordFollowUpPayment(request: FollowUpPaymentRequest): Promise<FollowUpPaymentResponse> {
    const { data, error } = await this.supabase.rpc('record_follow_up_payment', {
      p_batch_id: request.batchId,
      p_amount: request.amount,
      p_payment_method: request.paymentMethod,
      p_payment_summary: request.paymentSummary,
      p_notes: request.notes || null
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: data.success,
      paymentId: data.paymentId,
      batchId: data.batchId,
      amountPaid: data.amountPaid,
      previousBalance: data.previousBalance,
      newBalance: data.newBalance,
      paymentStatus: data.paymentStatus,
      salesUpdated: data.salesUpdated,
      error: data.error
    };
  }

  /**
   * Get payment history for a batch
   */
  async getBatchPaymentHistory(batchId: string): Promise<BatchPaymentHistory> {
    const { data, error } = await this.supabase.rpc('get_batch_payment_history', {
      p_batch_id: batchId
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as BatchPaymentHistory;
  }

  private mapToSale(data: Record<string, unknown>): Sale {
    const product = data['product'] as Record<string, unknown> | null;
    const brand = product ? (product['brand'] as Record<string, unknown> | null) : null;
    const location = data['location'] as Record<string, unknown> | null;

    const salePrice = data['sale_price'] as number;
    const costPrice = data['cost_price'] as number;

    return {
      id: data['id'] as string,
      productId: data['product_id'] as string,
      brandName: brand ? (brand['name'] as string) : '',
      productName: product ? (product['model'] as string) : '',
      saleDate: data['sale_date'] as string,
      salePrice,
      costPrice,
      profit: salePrice - costPrice,
      buyerName: data['buyer_name'] as string | null,
      buyerPhone: data['buyer_phone'] as string | null,
      buyerEmail: data['buyer_email'] as string | null,
      notes: data['notes'] as string | null,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string | null,
      taxRate: (data['tax_rate'] as number) ?? 0,
      taxAmount: (data['tax_amount'] as number) ?? 0,
      basePrice: data['base_price'] as number | null,
      isTaxExempt: (data['is_tax_exempt'] as boolean) ?? false,
      paymentSummary: ((data['payment_summary'] as Array<{ method: string; amount: number }>) ?? []).map(p => ({
        ...p,
        method: p.method as PaymentMethod
      })),
      isSplitPayment: (data['is_split_payment'] as boolean) ?? false,
      primaryPaymentMethod: (data['primary_payment_method'] as string | null) as PaymentMethod | null,
      locationId: (data['location_id'] as string) || null,
      locationName: location ? (location['name'] as string) : null,
      balance: (data['balance'] as number) ?? 0,
      paymentStatus: (data['payment_status'] as 'paid' | 'partial_paid') ?? 'paid',
      batchId: (data['batch_id'] as string) || null
    };
  }
}
