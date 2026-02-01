import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  ReceiptSendLog,
  CreateReceiptSendLogRequest,
  ReceiptSendLogListResponse,
  ResendReceiptRequest,
  ResendReceiptResponse,
  SendChannel
} from '../../models/sale.model';

/**
 * Receipt Send Log Service
 * Handles tracking and logging of receipt send/resend operations
 * Feature: F-007 Receipt Resend Capability
 */
@Injectable({
  providedIn: 'root'
})
export class ReceiptSendLogService {
  private supabase = inject(SupabaseService);

  async getSendLogs(receiptId: string): Promise<ReceiptSendLogListResponse> {
    const { data, error, count } = await this.supabase
      .from('receipt_send_logs')
      .select(`
        *,
        receipt:receipts(receipt_number, grand_total, customer_name)
      `, { count: 'exact' })
      .eq('receipt_id', receiptId)
      .order('sent_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: (data || []).map(this.mapToReceiptSendLog),
      total: count || 0
    };
  }

  async getLastSend(receiptId: string): Promise<ReceiptSendLog | null> {
    const { data, error } = await this.supabase
      .from('receipt_send_logs')
      .select('*')
      .eq('receipt_id', receiptId)
      .eq('status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return this.mapToReceiptSendLog(data);
  }

  async logSend(request: CreateReceiptSendLogRequest): Promise<ReceiptSendLog> {
    const { data, error } = await this.supabase
      .from('receipt_send_logs')
      .insert({
        receipt_id: request.receiptId,
        channel: request.channel,
        recipient_phone: request.recipientPhone?.trim() || null,
        recipient_email: request.recipientEmail?.trim() || null,
        status: request.status || 'sent',
        error_message: request.errorMessage?.trim() || null
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapToReceiptSendLog(data);
  }

  async logResend(request: ResendReceiptRequest): Promise<ResendReceiptResponse> {
    try {
      const sendLog = await this.logSend({
        receiptId: request.receiptId,
        channel: request.channel,
        recipientPhone: request.recipientPhone,
        recipientEmail: request.recipientEmail,
        status: 'sent'
      });

      return {
        success: true,
        message: 'Receipt resent successfully',
        sendLog
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      await this.logSend({
        receiptId: request.receiptId,
        channel: request.channel,
        recipientPhone: request.recipientPhone,
        recipientEmail: request.recipientEmail,
        status: 'failed',
        errorMessage
      });

      return {
        success: false,
        message: 'Failed to resend receipt',
        error: errorMessage
      };
    }
  }

  async getSendCount(receiptId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('receipt_send_logs')
      .select('*', { count: 'exact', head: true })
      .eq('receipt_id', receiptId)
      .eq('status', 'sent');

    if (error) {
      throw new Error(error.message);
    }

    return count || 0;
  }

  async getSendHistory(options?: {
    channel?: SendChannel;
    startDate?: string;
    endDate?: string;
    limit?: number;
    page?: number;
  }): Promise<ReceiptSendLogListResponse> {
    const limit = options?.limit || 20;
    const page = options?.page || 1;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('receipt_send_logs')
      .select(`
        *,
        receipt:receipts(receipt_number, grand_total, customer_name)
      `, { count: 'exact' });

    if (options?.channel) {
      query = query.eq('channel', options.channel);
    }

    if (options?.startDate) {
      query = query.gte('sent_at', options.startDate);
    }

    if (options?.endDate) {
      query = query.lte('sent_at', options.endDate);
    }

    query = query
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: (data || []).map(this.mapToReceiptSendLog),
      total: count || 0
    };
  }

  private mapToReceiptSendLog(data: Record<string, unknown>): ReceiptSendLog {
    const receipt = data['receipt'] as Record<string, unknown> | undefined;

    return {
      id: data['id'] as string,
      receiptId: data['receipt_id'] as string,
      channel: data['channel'] as 'whatsapp' | 'email' | 'sms',
      recipientPhone: data['recipient_phone'] as string | null,
      recipientEmail: data['recipient_email'] as string | null,
      status: data['status'] as 'sent' | 'failed' | 'pending',
      errorMessage: data['error_message'] as string | null,
      sentAt: data['sent_at'] as string,
      createdAt: data['created_at'] as string,
      ...(receipt && {
        receipt: {
          receiptNumber: receipt['receipt_number'] as string,
          grandTotal: receipt['grand_total'] as number,
          customerName: receipt['customer_name'] as string | null
        }
      })
    };
  }
}
