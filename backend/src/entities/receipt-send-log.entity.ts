/**
 * Receipt Send Log Entity
 * Tracks all receipt send/resend operations
 * Database table: receipt_send_logs
 * Owner Module: M-07 Sales (Receipt Resend Capability - F-007)
 */

export type SendChannel = 'whatsapp' | 'email' | 'sms';
export type SendStatus = 'sent' | 'failed' | 'pending';

export interface ReceiptSendLog {
  id: string;
  receipt_id: string;
  channel: SendChannel;
  recipient_phone: string | null;
  recipient_email: string | null;
  status: SendStatus;
  error_message: string | null;
  sent_at: string;
  created_at: string;
}

export interface ReceiptSendLogInsert {
  id?: string;
  receipt_id: string;
  channel: SendChannel;
  recipient_phone?: string | null;
  recipient_email?: string | null;
  status?: SendStatus;
  error_message?: string | null;
  sent_at?: string;
  created_at?: string;
}

export interface ReceiptSendLogUpdate {
  status?: SendStatus;
  error_message?: string | null;
}

export interface ReceiptSendLogWithReceipt extends ReceiptSendLog {
  receipt?: {
    receipt_number: string;
    grand_total: number;
    customer_name: string | null;
  };
}
