/**
 * Receipt Send Log DTOs
 * Data Transfer Objects for ReceiptSendLog entity
 * Feature: F-007 Receipt Resend Capability
 */

export type SendChannelDto = 'whatsapp' | 'email' | 'sms';
export type SendStatusDto = 'sent' | 'failed' | 'pending';

export interface CreateReceiptSendLogDto {
  receiptId: string;
  channel: SendChannelDto;
  recipientPhone?: string | null;
  recipientEmail?: string | null;
  status?: SendStatusDto;
  errorMessage?: string | null;
}

export interface UpdateReceiptSendLogDto {
  status?: SendStatusDto;
  errorMessage?: string | null;
}

export interface ReceiptSendLogResponseDto {
  id: string;
  receiptId: string;
  channel: SendChannelDto;
  recipientPhone: string | null;
  recipientEmail: string | null;
  status: SendStatusDto;
  errorMessage: string | null;
  sentAt: string;
  createdAt: string;
  receipt?: {
    receiptNumber: string;
    grandTotal: number;
    customerName: string | null;
  };
}

export interface ReceiptSendLogListResponseDto {
  data: ReceiptSendLogResponseDto[];
  total: number;
}

export interface ReceiptSendLogFilterDto {
  receiptId?: string;
  channel?: SendChannelDto;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ResendReceiptDto {
  receiptId: string;
  channel: SendChannelDto;
  recipientPhone?: string;
  recipientEmail?: string;
}

export interface ResendReceiptResponseDto {
  success: boolean;
  message: string;
  sendLog?: ReceiptSendLogResponseDto;
  error?: string;
}
