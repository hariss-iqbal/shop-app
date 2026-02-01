import { SupabaseClient } from '@supabase/supabase-js';
import {
  ReceiptSendLog,
  ReceiptSendLogInsert,
  ReceiptSendLogUpdate,
  ReceiptSendLogWithReceipt
} from '../entities/receipt-send-log.entity';

/**
 * Receipt Send Log Repository
 * Handles database operations for ReceiptSendLog entity
 * Table: receipt_send_logs
 * Feature: F-007 Receipt Resend Capability
 */
export class ReceiptSendLogRepository {
  private readonly tableName = 'receipt_send_logs';

  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(options?: {
    receiptId?: string;
    channel?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<ReceiptSendLogWithReceipt[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        receipt:receipts(receipt_number, grand_total, customer_name)
      `);

    if (options?.receiptId) {
      query = query.eq('receipt_id', options.receiptId);
    }
    if (options?.channel) {
      query = query.eq('channel', options.channel);
    }
    if (options?.startDate) {
      query = query.gte('sent_at', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('sent_at', options.endDate);
    }

    query = query.order('sent_at', { ascending: false });

    if (options?.limit) {
      const start = options.offset || 0;
      const end = start + options.limit - 1;
      query = query.range(start, end);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async findById(id: string): Promise<ReceiptSendLogWithReceipt | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        receipt:receipts(receipt_number, grand_total, customer_name)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByReceiptId(receiptId: string): Promise<ReceiptSendLog[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('receipt_id', receiptId)
      .order('sent_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async create(log: ReceiptSendLogInsert): Promise<ReceiptSendLog> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(log)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, log: ReceiptSendLogUpdate): Promise<ReceiptSendLog> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(log)
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
    receiptId?: string;
    channel?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (options?.receiptId) {
      query = query.eq('receipt_id', options.receiptId);
    }
    if (options?.channel) {
      query = query.eq('channel', options.channel);
    }
    if (options?.startDate) {
      query = query.gte('sent_at', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('sent_at', options.endDate);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  async getLastSendForReceipt(receiptId: string): Promise<ReceiptSendLog | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('receipt_id', receiptId)
      .eq('status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}
