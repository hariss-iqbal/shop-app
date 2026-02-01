import { SupabaseClient } from '@supabase/supabase-js';
import {
  Receipt,
  ReceiptInsert,
  ReceiptUpdate,
  ReceiptWithItems,
  ReceiptItem,
  ReceiptItemInsert,
  ReceiptTaxBreakdown,
  ReceiptTaxBreakdownInsert
} from '../entities/receipt.entity';

/**
 * Receipt Repository
 * Handles database operations for Receipt entity
 * Table: receipts
 * Feature: F-005 Receipt Storage and Retrieval
 */
export class ReceiptRepository {
  private readonly tableName = 'receipts';
  private readonly itemsTableName = 'receipt_items';
  private readonly taxBreakdownTableName = 'receipt_tax_breakdown';

  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(options?: {
    receiptNumber?: string;
    customerPhone?: string;
    customerName?: string;
    customerEmail?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    limit?: number;
    offset?: number;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ReceiptWithItems[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        items:receipt_items(*),
        tax_breakdown:receipt_tax_breakdown(*)
      `);

    if (options?.receiptNumber) {
      query = query.ilike('receipt_number', `%${options.receiptNumber}%`);
    }
    if (options?.customerPhone) {
      const cleanedPhone = options.customerPhone.replace(/[^\d]/g, '');
      query = query.ilike('customer_phone', `%${cleanedPhone}%`);
    }
    if (options?.customerName) {
      query = query.ilike('customer_name', `%${options.customerName}%`);
    }
    if (options?.customerEmail) {
      query = query.ilike('customer_email', `%${options.customerEmail}%`);
    }
    if (options?.startDate) {
      query = query.gte('transaction_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('transaction_date', options.endDate);
    }
    if (options?.minAmount !== undefined) {
      query = query.gte('grand_total', options.minAmount);
    }
    if (options?.maxAmount !== undefined) {
      query = query.lte('grand_total', options.maxAmount);
    }

    const sortField = this.mapSortField(options?.sortField);
    const ascending = options?.sortOrder === 'asc';
    query = query.order(sortField, { ascending });

    if (options?.limit) {
      const start = options.offset || 0;
      const end = start + options.limit - 1;
      query = query.range(start, end);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  private mapSortField(field?: string): string {
    const fieldMap: Record<string, string> = {
      'transactionDate': 'transaction_date',
      'grandTotal': 'grand_total',
      'receiptNumber': 'receipt_number',
      'createdAt': 'created_at'
    };
    return fieldMap[field || ''] || 'created_at';
  }

  async findById(id: string): Promise<ReceiptWithItems | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        items:receipt_items(*),
        tax_breakdown:receipt_tax_breakdown(*)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByReceiptNumber(receiptNumber: string): Promise<ReceiptWithItems | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        items:receipt_items(*),
        tax_breakdown:receipt_tax_breakdown(*)
      `)
      .eq('receipt_number', receiptNumber)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Find all receipts for a customer by phone number
   * Returns receipts in chronological order (newest first)
   * Feature: F-005 Receipt Storage and Retrieval - AC4
   */
  async findByCustomerPhone(customerPhone: string): Promise<ReceiptWithItems[]> {
    const cleanedPhone = customerPhone.replace(/[^\d]/g, '');
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        items:receipt_items(*),
        tax_breakdown:receipt_tax_breakdown(*)
      `)
      .ilike('customer_phone', `%${cleanedPhone}%`)
      .order('transaction_date', { ascending: false })
      .order('transaction_time', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async create(receipt: ReceiptInsert): Promise<Receipt> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(receipt)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createWithItems(receipt: ReceiptInsert, items: Omit<ReceiptItemInsert, 'receipt_id'>[]): Promise<ReceiptWithItems> {
    const createdReceipt = await this.create(receipt);

    if (items.length > 0) {
      const receiptItems: ReceiptItemInsert[] = items.map(item => ({
        ...item,
        receipt_id: createdReceipt.id
      }));

      const { error: itemsError } = await this.supabase
        .from(this.itemsTableName)
        .insert(receiptItems);

      if (itemsError) throw itemsError;
    }

    return this.findById(createdReceipt.id) as Promise<ReceiptWithItems>;
  }

  async update(id: string, receipt: ReceiptUpdate): Promise<Receipt> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(receipt)
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
    receiptNumber?: string;
    customerPhone?: string;
    customerName?: string;
    customerEmail?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
  }): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (options?.receiptNumber) {
      query = query.ilike('receipt_number', `%${options.receiptNumber}%`);
    }
    if (options?.customerPhone) {
      const cleanedPhone = options.customerPhone.replace(/[^\d]/g, '');
      query = query.ilike('customer_phone', `%${cleanedPhone}%`);
    }
    if (options?.customerName) {
      query = query.ilike('customer_name', `%${options.customerName}%`);
    }
    if (options?.customerEmail) {
      query = query.ilike('customer_email', `%${options.customerEmail}%`);
    }
    if (options?.startDate) {
      query = query.gte('transaction_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('transaction_date', options.endDate);
    }
    if (options?.minAmount !== undefined) {
      query = query.gte('grand_total', options.minAmount);
    }
    if (options?.maxAmount !== undefined) {
      query = query.lte('grand_total', options.maxAmount);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  async findAllForExport(options?: {
    receiptNumber?: string;
    customerPhone?: string;
    customerName?: string;
    customerEmail?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ReceiptWithItems[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        items:receipt_items(*),
        tax_breakdown:receipt_tax_breakdown(*)
      `);

    if (options?.receiptNumber) {
      query = query.ilike('receipt_number', `%${options.receiptNumber}%`);
    }
    if (options?.customerPhone) {
      const cleanedPhone = options.customerPhone.replace(/[^\d]/g, '');
      query = query.ilike('customer_phone', `%${cleanedPhone}%`);
    }
    if (options?.customerName) {
      query = query.ilike('customer_name', `%${options.customerName}%`);
    }
    if (options?.customerEmail) {
      query = query.ilike('customer_email', `%${options.customerEmail}%`);
    }
    if (options?.startDate) {
      query = query.gte('transaction_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('transaction_date', options.endDate);
    }
    if (options?.minAmount !== undefined) {
      query = query.gte('grand_total', options.minAmount);
    }
    if (options?.maxAmount !== undefined) {
      query = query.lte('grand_total', options.maxAmount);
    }

    const sortField = this.mapSortField(options?.sortField);
    const ascending = options?.sortOrder === 'asc';
    query = query.order(sortField, { ascending });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async getTotalRevenue(options?: { startDate?: string; endDate?: string }): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('grand_total');

    if (options?.startDate) {
      query = query.gte('transaction_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('transaction_date', options.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.reduce((sum, r) => sum + (r.grand_total || 0), 0) || 0;
  }

  async createItem(item: ReceiptItemInsert): Promise<ReceiptItem> {
    const { data, error } = await this.supabase
      .from(this.itemsTableName)
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getItemsByReceiptId(receiptId: string): Promise<ReceiptItem[]> {
    const { data, error } = await this.supabase
      .from(this.itemsTableName)
      .select('*')
      .eq('receipt_id', receiptId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create tax breakdown entries for a receipt
   * Feature: F-012 Tax Calculation and Compliance
   */
  async createTaxBreakdown(entries: ReceiptTaxBreakdownInsert[]): Promise<ReceiptTaxBreakdown[]> {
    if (entries.length === 0) return [];

    const { data, error } = await this.supabase
      .from(this.taxBreakdownTableName)
      .insert(entries)
      .select();

    if (error) throw error;
    return data || [];
  }

  /**
   * Get tax breakdown for a receipt
   * Feature: F-012 Tax Calculation and Compliance
   */
  async getTaxBreakdownByReceiptId(receiptId: string): Promise<ReceiptTaxBreakdown[]> {
    const { data, error } = await this.supabase
      .from(this.taxBreakdownTableName)
      .select('*')
      .eq('receipt_id', receiptId)
      .order('tax_rate', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create receipt with items and tax breakdown
   * Feature: F-012 Tax Calculation and Compliance
   */
  async createWithItemsAndTaxBreakdown(
    receipt: ReceiptInsert,
    items: Omit<ReceiptItemInsert, 'receipt_id'>[],
    taxBreakdown: Omit<ReceiptTaxBreakdownInsert, 'receipt_id'>[]
  ): Promise<ReceiptWithItems> {
    const createdReceipt = await this.create(receipt);

    if (items.length > 0) {
      const receiptItems: ReceiptItemInsert[] = items.map(item => ({
        ...item,
        receipt_id: createdReceipt.id
      }));

      const { error: itemsError } = await this.supabase
        .from(this.itemsTableName)
        .insert(receiptItems);

      if (itemsError) throw itemsError;
    }

    if (taxBreakdown.length > 0) {
      const taxEntries: ReceiptTaxBreakdownInsert[] = taxBreakdown.map(entry => ({
        ...entry,
        receipt_id: createdReceipt.id
      }));

      const { error: taxError } = await this.supabase
        .from(this.taxBreakdownTableName)
        .insert(taxEntries);

      if (taxError) throw taxError;
    }

    return this.findById(createdReceipt.id) as Promise<ReceiptWithItems>;
  }
}
