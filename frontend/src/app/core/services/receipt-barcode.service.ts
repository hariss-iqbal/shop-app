import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * QR Code data payload structure
 */
export interface ReceiptQrCodeData {
  receiptNumber: string;
  storeId: string;
  version: number;
  checksum: string;
}

/**
 * Response containing QR code generation result
 */
export interface GenerateQrCodeResponse {
  success: boolean;
  qrCodeData: string;
  qrCodeUrl: string;
  lookupUrl: string;
  size: number;
  error?: string;
}

/**
 * Receipt lookup response (limited info for public)
 */
export interface ReceiptLookupResponse {
  success: boolean;
  found: boolean;
  receipt?: {
    id: string;
    receiptNumber: string;
    transactionDate: string;
    transactionTime: string;
    grandTotal: number;
    customerName: string | null;
    storeId: string;
    itemCount: number;
  };
  error?: string;
  notFoundReason?: 'invalid_code' | 'receipt_not_found' | 'store_mismatch' | 'expired';
}

/**
 * Admin receipt lookup result (full details)
 */
export interface AdminReceiptLookupResult {
  success: boolean;
  found: boolean;
  receipt?: {
    id: string;
    receiptNumber: string;
    transactionDate: string;
    transactionTime: string;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    grandTotal: number;
    customerName: string | null;
    customerPhone: string | null;
    customerEmail: string | null;
    notes: string | null;
    itemCount: number;
    createdAt: string;
  };
  error?: string;
}

/**
 * Receipt Barcode Service
 * Handles QR code generation and receipt lookup for barcode/QR scanning
 * Feature: F-017 Barcode/QR Code on Receipts
 */
@Injectable({
  providedIn: 'root'
})
export class ReceiptBarcodeService {
  private readonly supabase: SupabaseClient;
  private readonly QR_CODE_VERSION = 1;
  private readonly DEFAULT_STORE_ID: string;
  private readonly QR_API_BASE = 'https://api.qrserver.com/v1/create-qr-code';
  private readonly DEFAULT_QR_SIZE = 200;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
    this.DEFAULT_STORE_ID = environment.businessInfo.storeId || 'DEFAULT';
  }

  /**
   * Generate QR code URL for a receipt
   * Includes store identifier and checksum for validation
   */
  generateQrCode(receiptNumber: string, storeId: string = this.DEFAULT_STORE_ID): GenerateQrCodeResponse {
    if (!receiptNumber) {
      return {
        success: false,
        qrCodeData: '',
        qrCodeUrl: '',
        lookupUrl: '',
        size: 0,
        error: 'Receipt number is required'
      };
    }

    const checksum = this.generateChecksum(receiptNumber, storeId);
    const qrData = this.encodeQrData({
      receiptNumber,
      storeId,
      version: this.QR_CODE_VERSION,
      checksum
    });

    const lookupUrl = this.buildLookupUrl(receiptNumber, storeId);
    const qrCodeUrl = this.buildQrCodeImageUrl(lookupUrl, this.DEFAULT_QR_SIZE);

    return {
      success: true,
      qrCodeData: qrData,
      qrCodeUrl,
      lookupUrl,
      size: this.DEFAULT_QR_SIZE
    };
  }

  /**
   * Generate QR code image URL using external service
   * This URL can be used directly in img src attribute
   */
  generateQrCodeUrl(receiptNumber: string, storeId: string = this.DEFAULT_STORE_ID, size: number = this.DEFAULT_QR_SIZE): string {
    const lookupUrl = this.buildLookupUrl(receiptNumber, storeId);
    return this.buildQrCodeImageUrl(lookupUrl, size);
  }

  /**
   * Generate a simple QR code URL without store ID (backward compatible)
   */
  generateSimpleQrCodeUrl(receiptNumber: string, size: number = this.DEFAULT_QR_SIZE): string {
    const lookupUrl = `${environment.siteUrl}/receipt/${encodeURIComponent(receiptNumber)}`;
    return this.buildQrCodeImageUrl(lookupUrl, size);
  }

  /**
   * Public receipt lookup by receipt number
   * Returns limited information for customer verification
   */
  async lookupReceipt(receiptNumber: string): Promise<ReceiptLookupResponse> {
    if (!receiptNumber) {
      return {
        success: false,
        found: false,
        error: 'Receipt number is required',
        notFoundReason: 'invalid_code'
      };
    }

    try {
      const { data, error } = await this.supabase
        .from('receipts')
        .select(`
          id,
          receipt_number,
          transaction_date,
          transaction_time,
          grand_total,
          customer_name,
          receipt_items (id)
        `)
        .eq('receipt_number', receiptNumber.trim())
        .single();

      if (error || !data) {
        return {
          success: true,
          found: false,
          notFoundReason: 'receipt_not_found'
        };
      }

      return {
        success: true,
        found: true,
        receipt: {
          id: data.id,
          receiptNumber: data.receipt_number,
          transactionDate: data.transaction_date,
          transactionTime: data.transaction_time,
          grandTotal: data.grand_total,
          customerName: data.customer_name,
          storeId: this.DEFAULT_STORE_ID,
          itemCount: Array.isArray(data.receipt_items) ? data.receipt_items.length : 0
        }
      };
    } catch (err) {
      return {
        success: false,
        found: false,
        error: 'Failed to lookup receipt'
      };
    }
  }

  /**
   * Admin receipt lookup with full details
   * Requires authentication
   */
  async adminLookupReceipt(code: string): Promise<AdminReceiptLookupResult> {
    if (!code) {
      return {
        success: false,
        found: false,
        error: 'Code is required'
      };
    }

    let receiptNumber = code.trim();

    if (code.startsWith('RCP:')) {
      const decoded = this.decodeQrData(code);
      if (decoded) {
        receiptNumber = decoded.receiptNumber;
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('receipts')
        .select(`
          id,
          receipt_number,
          transaction_date,
          transaction_time,
          subtotal,
          tax_rate,
          tax_amount,
          grand_total,
          customer_name,
          customer_phone,
          customer_email,
          notes,
          created_at,
          receipt_items (id)
        `)
        .eq('receipt_number', receiptNumber)
        .single();

      if (error || !data) {
        return {
          success: true,
          found: false
        };
      }

      return {
        success: true,
        found: true,
        receipt: {
          id: data.id,
          receiptNumber: data.receipt_number,
          transactionDate: data.transaction_date,
          transactionTime: data.transaction_time,
          subtotal: data.subtotal,
          taxRate: data.tax_rate,
          taxAmount: data.tax_amount,
          grandTotal: data.grand_total,
          customerName: data.customer_name,
          customerPhone: data.customer_phone,
          customerEmail: data.customer_email,
          notes: data.notes,
          itemCount: Array.isArray(data.receipt_items) ? data.receipt_items.length : 0,
          createdAt: data.created_at
        }
      };
    } catch (err) {
      return {
        success: false,
        found: false,
        error: 'Failed to lookup receipt'
      };
    }
  }

  /**
   * Parse QR code or barcode data to extract receipt number
   */
  parseScannedCode(code: string): { receiptNumber: string; storeId: string | null } | null {
    if (!code) {
      return null;
    }

    if (code.startsWith('RCP:')) {
      const decoded = this.decodeQrData(code);
      if (decoded) {
        return {
          receiptNumber: decoded.receiptNumber,
          storeId: decoded.storeId
        };
      }
    }

    const urlMatch = code.match(/\/receipt\/([^?/]+)/);
    if (urlMatch) {
      const params = new URLSearchParams(code.split('?')[1] || '');
      return {
        receiptNumber: decodeURIComponent(urlMatch[1]),
        storeId: params.get('store')
      };
    }

    return {
      receiptNumber: code.trim(),
      storeId: null
    };
  }

  private encodeQrData(data: ReceiptQrCodeData): string {
    return `RCP:${data.version}:${data.storeId}:${data.receiptNumber}:${data.checksum}`;
  }

  private decodeQrData(encoded: string): ReceiptQrCodeData | null {
    if (!encoded.startsWith('RCP:')) {
      return null;
    }

    const parts = encoded.split(':');
    if (parts.length < 5) {
      return null;
    }

    return {
      version: parseInt(parts[1], 10),
      storeId: parts[2],
      receiptNumber: parts[3],
      checksum: parts[4]
    };
  }

  private generateChecksum(receiptNumber: string, storeId: string): string {
    const input = `${receiptNumber}:${storeId}`;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 6).toUpperCase();
  }

  private buildLookupUrl(receiptNumber: string, storeId: string): string {
    const encodedReceipt = encodeURIComponent(receiptNumber);
    const encodedStore = encodeURIComponent(storeId);
    return `${environment.siteUrl}/receipt/${encodedReceipt}?store=${encodedStore}`;
  }

  private buildQrCodeImageUrl(data: string, size: number): string {
    return `${this.QR_API_BASE}/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
  }

  /**
   * Get store identifier from environment
   * Feature: F-017 Barcode/QR Code on Receipts
   */
  getStoreId(): string {
    return environment.businessInfo.storeId || this.DEFAULT_STORE_ID;
  }
}
