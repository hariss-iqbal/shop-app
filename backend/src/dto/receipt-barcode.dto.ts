/**
 * Receipt Barcode/QR Code DTOs
 * Data Transfer Objects for barcode/QR code generation and lookup
 * Feature: F-017 Barcode/QR Code on Receipts
 */

/**
 * QR Code data payload structure
 * Encoded in the QR code for receipt lookup
 */
export interface ReceiptQrCodeData {
  /** Receipt number for lookup */
  receiptNumber: string;
  /** Store identifier for multi-store environments */
  storeId: string;
  /** Version of the QR code format for future compatibility */
  version: number;
  /** Checksum for data validation */
  checksum: string;
}

/**
 * Request to generate a QR code for a receipt
 */
export interface GenerateReceiptQrCodeRequest {
  receiptNumber: string;
  storeId?: string;
}

/**
 * Response containing QR code generation result
 */
export interface GenerateReceiptQrCodeResponse {
  success: boolean;
  /** The encoded data string for the QR code */
  qrCodeData: string;
  /** URL for external QR code generation service */
  qrCodeUrl: string;
  /** Lookup URL that the QR code points to */
  lookupUrl: string;
  /** Size of the QR code in pixels */
  size: number;
  error?: string;
}

/**
 * Request to lookup a receipt via QR code/barcode scan
 */
export interface ReceiptLookupRequest {
  /** The encoded QR code data or receipt number */
  code: string;
  /** Type of code being scanned */
  codeType: 'qr' | 'barcode' | 'receipt_number';
}

/**
 * Response from receipt lookup
 */
export interface ReceiptLookupResponse {
  success: boolean;
  found: boolean;
  /** The receipt data if found */
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
  /** Reason if receipt not found */
  notFoundReason?: 'invalid_code' | 'receipt_not_found' | 'store_mismatch' | 'expired';
}

/**
 * Barcode format types supported
 */
export type BarcodeFormat = 'code128' | 'code39' | 'ean13' | 'qr';

/**
 * Configuration for barcode/QR code generation
 */
export interface ReceiptCodeConfig {
  /** Default QR code size in pixels */
  defaultQrSize: number;
  /** Default barcode width */
  defaultBarcodeWidth: number;
  /** Default barcode height */
  defaultBarcodeHeight: number;
  /** Store identifier */
  storeId: string;
  /** Base URL for receipt lookup */
  lookupBaseUrl: string;
  /** QR code version for encoding */
  qrVersion: number;
}

/**
 * Barcode generation request
 */
export interface GenerateBarcodeRequest {
  receiptNumber: string;
  format?: BarcodeFormat;
  width?: number;
  height?: number;
}

/**
 * Barcode generation response
 */
export interface GenerateBarcodeResponse {
  success: boolean;
  /** Barcode data string for rendering */
  barcodeData: string;
  /** SVG or image URL for the barcode */
  barcodeUrl?: string;
  format: BarcodeFormat;
  error?: string;
}

/**
 * Receipt lookup result for admin scanner
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
