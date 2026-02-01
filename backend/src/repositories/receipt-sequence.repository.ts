import { SupabaseClient } from '@supabase/supabase-js';
import {
  ReceiptSequence,
  ReceiptSequenceInsert,
  ReceiptSequenceUpdate,
  ReceiptNumberLog,
  GenerateReceiptNumberResult,
  PreviewSequenceResult
} from '../entities/receipt-sequence.entity';

/**
 * Receipt Sequence Repository
 * Handles database operations for Receipt Sequence entity
 * Table: receipt_sequences, receipt_number_logs
 * Feature: F-011 Receipt Number Generation and Sequencing
 */
export class ReceiptSequenceRepository {
  private readonly tableName = 'receipt_sequences';
  private readonly logsTableName = 'receipt_number_logs';

  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(options?: {
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ReceiptSequence[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*');

    if (options?.isActive !== undefined) {
      query = query.eq('is_active', options.isActive);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) {
      const start = options.offset || 0;
      const end = start + options.limit - 1;
      query = query.range(start, end);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async findById(id: string): Promise<ReceiptSequence | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByRegisterId(registerId: string): Promise<ReceiptSequence | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('register_id', registerId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findActiveByRegisterId(registerId: string): Promise<ReceiptSequence | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('register_id', registerId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(sequence: ReceiptSequenceInsert): Promise<ReceiptSequence> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(sequence)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, sequence: ReceiptSequenceUpdate): Promise<ReceiptSequence> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(sequence)
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

  async count(options?: { isActive?: boolean }): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (options?.isActive !== undefined) {
      query = query.eq('is_active', options.isActive);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  /**
   * Generate next receipt number using atomic RPC function
   */
  async generateNextReceiptNumber(registerId: string = 'DEFAULT'): Promise<GenerateReceiptNumberResult> {
    const { data, error } = await this.supabase
      .rpc('generate_next_receipt_number', { p_register_id: registerId });

    if (error) throw error;

    return {
      success: data?.success ?? false,
      receiptNumber: data?.receiptNumber ?? null,
      sequenceValue: data?.sequenceValue ?? null,
      registerId: data?.registerId ?? null,
      logId: data?.logId ?? null,
      error: data?.error
    };
  }

  /**
   * Preview receipt number format without incrementing
   */
  async previewReceiptNumberFormat(options: {
    prefix?: string;
    sequencePadding?: number;
    formatPattern?: string;
    includeDate?: boolean;
    dateFormat?: string;
    separator?: string;
    sampleSequence?: number;
  }): Promise<string> {
    const { data, error } = await this.supabase
      .rpc('preview_receipt_number_format', {
        p_prefix: options.prefix || '',
        p_sequence_padding: options.sequencePadding || 4,
        p_format_pattern: options.formatPattern || '{PREFIX}{SEQ}',
        p_include_date: options.includeDate ?? false,
        p_date_format: options.dateFormat || 'YY-MM',
        p_separator: options.separator || '-',
        p_sample_sequence: options.sampleSequence || 1
      });

    if (error) throw error;
    return data || '';
  }

  /**
   * Get preview of next receipt number for a register
   */
  async getNextSequencePreview(registerId: string = 'DEFAULT'): Promise<PreviewSequenceResult> {
    const { data, error } = await this.supabase
      .rpc('get_next_sequence_preview', { p_register_id: registerId });

    if (error) throw error;

    return {
      success: data?.success ?? false,
      nextSequence: data?.nextSequence ?? null,
      previewNumber: data?.previewNumber ?? null,
      registerId: data?.registerId ?? null,
      registerName: data?.registerName ?? null,
      error: data?.error
    };
  }

  /**
   * Link a generated receipt number to a receipt
   */
  async linkReceiptNumberToReceipt(logId: string, receiptId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .rpc('link_receipt_number_to_receipt', {
        p_log_id: logId,
        p_receipt_id: receiptId
      });

    if (error) throw error;
    return data ?? false;
  }

  /**
   * Reset sequence to a new starting value
   */
  async resetSequence(id: string, newStartingValue: number): Promise<ReceiptSequence> {
    return this.update(id, { current_sequence: newStartingValue - 1 });
  }

  /**
   * Get logs for a sequence
   */
  async getLogs(options?: {
    sequenceId?: string;
    receiptNumber?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<ReceiptNumberLog[]> {
    let query = this.supabase
      .from(this.logsTableName)
      .select('*');

    if (options?.sequenceId) {
      query = query.eq('sequence_id', options.sequenceId);
    }
    if (options?.receiptNumber) {
      query = query.ilike('receipt_number', `%${options.receiptNumber}%`);
    }
    if (options?.startDate) {
      query = query.gte('generated_at', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('generated_at', options.endDate);
    }

    query = query.order('generated_at', { ascending: false });

    if (options?.limit) {
      const start = options.offset || 0;
      const end = start + options.limit - 1;
      query = query.range(start, end);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async countLogs(options?: {
    sequenceId?: string;
    receiptNumber?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<number> {
    let query = this.supabase
      .from(this.logsTableName)
      .select('*', { count: 'exact', head: true });

    if (options?.sequenceId) {
      query = query.eq('sequence_id', options.sequenceId);
    }
    if (options?.receiptNumber) {
      query = query.ilike('receipt_number', `%${options.receiptNumber}%`);
    }
    if (options?.startDate) {
      query = query.gte('generated_at', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('generated_at', options.endDate);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  /**
   * Check if a receipt number already exists
   */
  async receiptNumberExists(receiptNumber: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from(this.logsTableName)
      .select('*', { count: 'exact', head: true })
      .eq('receipt_number', receiptNumber);

    if (error) throw error;
    return (count || 0) > 0;
  }
}
