import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  ReceiptSequence,
  CreateReceiptSequenceRequest,
  UpdateReceiptSequenceRequest,
  ReceiptSequenceListResponse,
  GenerateReceiptNumberResponse,
  PreviewReceiptNumberRequest,
  PreviewReceiptNumberResponse,
  PreviewNextReceiptNumberResponse,
  ReceiptNumberLog,
  ReceiptNumberLogListResponse,
  ReceiptNumberLogFilter,
  ResetSequenceRequest,
  DATE_FORMAT_OPTIONS,
  FORMAT_PATTERN_PLACEHOLDERS,
  DateFormatOption,
  FormatPatternPlaceholder
} from '../../models/receipt-sequence.model';

/**
 * Receipt Sequence Service
 * Frontend service for Receipt Number Generation and Sequencing
 * Feature: F-011
 */
@Injectable({
  providedIn: 'root'
})
export class ReceiptSequenceService {
  constructor(private readonly supabaseService: SupabaseService) { }
  private readonly tableName = 'receipt_sequences';
  private readonly logsTableName = 'receipt_number_logs';

  async findAll(isActive?: boolean): Promise<ReceiptSequenceListResponse> {
    let query = this.supabaseService.client
      .from(this.tableName)
      .select('*', { count: 'exact' });

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: (data || []).map(this.mapToReceiptSequence),
      total: count || 0
    };
  }

  async findById(id: string): Promise<ReceiptSequence | null> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.mapToReceiptSequence(data) : null;
  }

  async findByRegisterId(registerId: string): Promise<ReceiptSequence | null> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select('*')
      .eq('register_id', registerId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.mapToReceiptSequence(data) : null;
  }

  async findActiveByRegisterId(registerId: string): Promise<ReceiptSequence | null> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select('*')
      .eq('register_id', registerId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.mapToReceiptSequence(data) : null;
  }

  async create(request: CreateReceiptSequenceRequest): Promise<ReceiptSequence> {
    const insertData = {
      register_id: request.registerId.trim().toUpperCase(),
      register_name: request.registerName.trim(),
      prefix: request.prefix?.trim() || '',
      current_sequence: (request.startingSequence ?? 1000) - 1,
      sequence_padding: request.sequencePadding ?? 4,
      format_pattern: request.formatPattern || '{PREFIX}{SEP}{DATE}{SEP}{SEQ}',
      include_date: request.includeDate ?? true,
      date_format: request.dateFormat || 'YY-MM',
      separator: request.separator || '-',
      is_active: request.isActive ?? true
    };

    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return this.mapToReceiptSequence(data);
  }

  async update(id: string, request: UpdateReceiptSequenceRequest): Promise<ReceiptSequence> {
    const updateData: Record<string, unknown> = {};

    if (request.registerName !== undefined) updateData['register_name'] = request.registerName.trim();
    if (request.prefix !== undefined) updateData['prefix'] = request.prefix.trim();
    if (request.sequencePadding !== undefined) updateData['sequence_padding'] = request.sequencePadding;
    if (request.formatPattern !== undefined) updateData['format_pattern'] = request.formatPattern;
    if (request.includeDate !== undefined) updateData['include_date'] = request.includeDate;
    if (request.dateFormat !== undefined) updateData['date_format'] = request.dateFormat;
    if (request.separator !== undefined) updateData['separator'] = request.separator;
    if (request.isActive !== undefined) updateData['is_active'] = request.isActive;

    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToReceiptSequence(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabaseService.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async generateNextReceiptNumber(registerId: string = 'DEFAULT'): Promise<GenerateReceiptNumberResponse> {
    const { data, error } = await this.supabaseService.client
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

  async previewReceiptNumberFormat(request: PreviewReceiptNumberRequest): Promise<PreviewReceiptNumberResponse> {
    const { data, error } = await this.supabaseService.client
      .rpc('preview_receipt_number_format', {
        p_prefix: request.prefix || '',
        p_sequence_padding: request.sequencePadding || 4,
        p_format_pattern: request.formatPattern || '{PREFIX}{SEQ}',
        p_include_date: request.includeDate ?? false,
        p_date_format: request.dateFormat || 'YY-MM',
        p_separator: request.separator || '-',
        p_sample_sequence: request.sampleSequence || 1
      });

    if (error) throw error;
    return { previewNumber: data || '' };
  }

  async previewNextReceiptNumber(registerId: string = 'DEFAULT'): Promise<PreviewNextReceiptNumberResponse> {
    const { data, error } = await this.supabaseService.client
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

  async linkReceiptNumberToReceipt(logId: string, receiptId: string): Promise<boolean> {
    const { data, error } = await this.supabaseService.client
      .rpc('link_receipt_number_to_receipt', {
        p_log_id: logId,
        p_receipt_id: receiptId
      });

    if (error) throw error;
    return data ?? false;
  }

  async resetSequence(id: string, request: ResetSequenceRequest): Promise<ReceiptSequence> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .update({ current_sequence: request.newStartingValue - 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToReceiptSequence(data);
  }

  async getLogs(filter?: ReceiptNumberLogFilter): Promise<ReceiptNumberLogListResponse> {
    const limit = filter?.limit || 20;
    const page = filter?.page || 1;
    const offset = (page - 1) * limit;

    let query = this.supabaseService.client
      .from(this.logsTableName)
      .select('*', { count: 'exact' });

    if (filter?.sequenceId) {
      query = query.eq('sequence_id', filter.sequenceId);
    }
    if (filter?.receiptNumber) {
      query = query.ilike('receipt_number', `%${filter.receiptNumber}%`);
    }
    if (filter?.startDate) {
      query = query.gte('generated_at', filter.startDate);
    }
    if (filter?.endDate) {
      query = query.lte('generated_at', filter.endDate);
    }

    query = query.order('generated_at', { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: (data || []).map(this.mapToReceiptNumberLog),
      total: count || 0
    };
  }

  async receiptNumberExists(receiptNumber: string): Promise<boolean> {
    const { count, error } = await this.supabaseService.client
      .from(this.logsTableName)
      .select('*', { count: 'exact', head: true })
      .eq('receipt_number', receiptNumber);

    if (error) throw error;
    return (count || 0) > 0;
  }

  getAvailableDateFormats(): DateFormatOption[] {
    return DATE_FORMAT_OPTIONS;
  }

  getFormatPatternPlaceholders(): FormatPatternPlaceholder[] {
    return FORMAT_PATTERN_PLACEHOLDERS;
  }

  private mapToReceiptSequence(data: Record<string, unknown>): ReceiptSequence {
    return {
      id: data['id'] as string,
      registerId: data['register_id'] as string,
      registerName: data['register_name'] as string,
      prefix: data['prefix'] as string,
      currentSequence: data['current_sequence'] as number,
      sequencePadding: data['sequence_padding'] as number,
      formatPattern: data['format_pattern'] as string,
      includeDate: data['include_date'] as boolean,
      dateFormat: data['date_format'] as string,
      separator: data['separator'] as string,
      isActive: data['is_active'] as boolean,
      lastGeneratedAt: data['last_generated_at'] as string | null,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string | null
    };
  }

  private mapToReceiptNumberLog(data: Record<string, unknown>): ReceiptNumberLog {
    return {
      id: data['id'] as string,
      sequenceId: data['sequence_id'] as string,
      receiptNumber: data['receipt_number'] as string,
      sequenceValue: data['sequence_value'] as number,
      generatedAt: data['generated_at'] as string,
      receiptId: data['receipt_id'] as string | null
    };
  }
}
