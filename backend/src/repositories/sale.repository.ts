import { SupabaseClient } from '@supabase/supabase-js';
import { Sale, SaleInsert, SaleUpdate, SaleWithRelations } from '../entities/sale.entity';
import {
  SaleWithInventoryDeductionResult,
  BatchSaleWithInventoryDeductionResult,
  InventoryAvailabilityResult,
  RevertSaleResult
} from '../entities/inventory-deduction-log.entity';

/**
 * Sale Repository
 * Handles database operations for Sale entity
 * Table: sales
 */
export class SaleRepository {
  private readonly tableName = 'sales';

  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(options?: {
    startDate?: string;
    endDate?: string;
    brandId?: string;
    locationId?: string;
    limit?: number;
    offset?: number;
  }): Promise<SaleWithRelations[]> {
    let query = this.supabase
      .from(this.tableName)
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
      `);

    if (options?.startDate) {
      query = query.gte('sale_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('sale_date', options.endDate);
    }
    if (options?.locationId) {
      query = query.eq('location_id', options.locationId);
    }

    query = query.order('sale_date', { ascending: false });

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

  async findById(id: string): Promise<SaleWithRelations | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
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
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByProductId(productId: string): Promise<Sale | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('product_id', productId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(sale: SaleInsert): Promise<Sale> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(sale)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, sale: SaleUpdate): Promise<Sale> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(sale)
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

  async count(options?: { startDate?: string; endDate?: string }): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (options?.startDate) {
      query = query.gte('sale_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('sale_date', options.endDate);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  async getTotalRevenue(options?: { startDate?: string; endDate?: string }): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('sale_price');

    if (options?.startDate) {
      query = query.gte('sale_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('sale_date', options.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.reduce((sum, s) => sum + (s.sale_price || 0), 0) || 0;
  }

  async getTotalProfit(options?: { startDate?: string; endDate?: string }): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('sale_price, cost_price');

    if (options?.startDate) {
      query = query.gte('sale_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('sale_date', options.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.reduce((sum, s) => sum + ((s.sale_price || 0) - (s.cost_price || 0)), 0) || 0;
  }

  async getSalesByMonth(year: number): Promise<{ month: number; count: number; revenue: number }[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('sale_date, sale_price')
      .gte('sale_date', `${year}-01-01`)
      .lte('sale_date', `${year}-12-31`);

    if (error) throw error;

    const monthlyData: { [key: number]: { count: number; revenue: number } } = {};
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = { count: 0, revenue: 0 };
    }

    (data || []).forEach(sale => {
      const month = new Date(sale.sale_date).getMonth() + 1;
      monthlyData[month].count++;
      monthlyData[month].revenue += sale.sale_price || 0;
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month: parseInt(month),
      count: data.count,
      revenue: data.revenue
    }));
  }

  /**
   * Find all sales for a customer by their phone number
   * Uses substring matching to handle different phone number formats
   * Returns sales sorted by date with most recent first
   */
  async findByBuyerPhone(buyerPhone: string): Promise<SaleWithRelations[]> {
    const cleanedPhone = buyerPhone.replace(/[^\d]/g, '');

    const { data, error } = await this.supabase
      .from(this.tableName)
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
      `)
      .ilike('buyer_phone', `%${cleanedPhone}%`)
      .order('sale_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Complete a sale with automatic inventory deduction using atomic RPC
   * Feature: F-008 Automatic Inventory Deduction
   * Feature: F-024 Multi-Location Inventory Support
   */
  async completeSaleWithInventoryDeduction(
    productId: string,
    saleDate: string,
    salePrice: number,
    buyerName?: string | null,
    buyerPhone?: string | null,
    buyerEmail?: string | null,
    notes?: string | null,
    locationId?: string | null
  ): Promise<SaleWithInventoryDeductionResult> {
    const { data, error } = await this.supabase.rpc('complete_sale_with_inventory_deduction', {
      p_product_id: productId,
      p_sale_date: saleDate,
      p_sale_price: salePrice,
      p_buyer_name: buyerName || null,
      p_buyer_phone: buyerPhone || null,
      p_buyer_email: buyerEmail || null,
      p_notes: notes || null,
      p_location_id: locationId || null
    });

    if (error) throw error;

    return {
      success: data.success,
      saleId: data.saleId,
      productId: data.productId,
      previousStatus: data.previousStatus,
      newStatus: data.newStatus,
      warning: data.warning,
      inventoryDeducted: data.inventoryDeducted,
      error: data.error
    };
  }

  /**
   * Complete multiple sales with automatic inventory deduction using atomic RPC
   * Feature: F-008 Automatic Inventory Deduction
   * Feature: F-024 Multi-Location Inventory Support
   */
  async completeBatchSaleWithInventoryDeduction(
    items: Array<{ productId: string; salePrice: number }>,
    saleDate: string,
    buyerName?: string | null,
    buyerPhone?: string | null,
    buyerEmail?: string | null,
    notes?: string | null,
    locationId?: string | null
  ): Promise<BatchSaleWithInventoryDeductionResult> {
    const { data, error } = await this.supabase.rpc('complete_batch_sale_with_inventory_deduction', {
      p_items: items.map(item => ({
        productId: item.productId,
        salePrice: item.salePrice
      })),
      p_sale_date: saleDate,
      p_buyer_name: buyerName || null,
      p_buyer_phone: buyerPhone || null,
      p_buyer_email: buyerEmail || null,
      p_notes: notes || null,
      p_location_id: locationId || null
    });

    if (error) throw error;

    return {
      success: data.success,
      totalItems: data.totalItems,
      processedItems: data.processedItems,
      sales: data.sales,
      warnings: data.warnings,
      inventoryDeducted: data.inventoryDeducted,
      error: data.error
    };
  }

  /**
   * Check inventory availability for products before sale
   * Feature: F-008 Automatic Inventory Deduction
   */
  async checkInventoryAvailability(productIds: string[]): Promise<InventoryAvailabilityResult> {
    const { data, error } = await this.supabase.rpc('check_inventory_availability', {
      p_product_ids: productIds
    });

    if (error) throw error;

    return {
      allAvailable: data.allAvailable,
      hasWarnings: data.hasWarnings,
      allowOversell: data.allowOversell,
      products: data.products,
      warnings: data.warnings
    };
  }

  /**
   * Revert a sale and restore inventory (product status)
   * Feature: F-008 Automatic Inventory Deduction
   */
  async revertSaleRestoreInventory(saleId: string): Promise<RevertSaleResult> {
    const { data, error } = await this.supabase.rpc('revert_sale_restore_inventory', {
      p_sale_id: saleId
    });

    if (error) throw error;

    return {
      success: data.success,
      productId: data.productId,
      previousStatus: data.previousStatus,
      newStatus: data.newStatus,
      inventoryRestored: data.inventoryRestored,
      error: data.error
    };
  }
}
