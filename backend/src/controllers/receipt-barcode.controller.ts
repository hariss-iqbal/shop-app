import { ReceiptBarcodeService } from '../services/receipt-barcode.service';
import {
  GenerateReceiptQrCodeRequest,
  GenerateReceiptQrCodeResponse,
  ReceiptLookupRequest,
  ReceiptLookupResponse,
  GenerateBarcodeRequest,
  GenerateBarcodeResponse,
  AdminReceiptLookupResult
} from '../dto/receipt-barcode.dto';

/**
 * Receipt Barcode/QR Code Controller
 * HTTP request handling for barcode/QR code operations
 * Routes: /api/receipts/barcode, /api/receipts/qrcode, /api/receipts/lookup
 * Feature: F-017 Barcode/QR Code on Receipts
 *
 * Public endpoints for QR code scanning do not require authentication.
 * Admin lookup endpoints require authentication for full receipt details.
 */
export class ReceiptBarcodeController {
  constructor(private readonly receiptBarcodeService: ReceiptBarcodeService) {}

  /**
   * Generate QR code data for a receipt
   * POST /api/receipts/qrcode/generate
   * Requires authentication
   */
  generateQrCode(request: GenerateReceiptQrCodeRequest): GenerateReceiptQrCodeResponse {
    this.validateGenerateQrCodeRequest(request);
    return this.receiptBarcodeService.generateQrCode(request);
  }

  /**
   * Generate barcode data for a receipt
   * POST /api/receipts/barcode/generate
   * Requires authentication
   */
  generateBarcode(request: GenerateBarcodeRequest): GenerateBarcodeResponse {
    this.validateGenerateBarcodeRequest(request);
    return this.receiptBarcodeService.generateBarcode(request);
  }

  /**
   * Public receipt lookup via QR code scan
   * POST /api/receipts/lookup
   * Public endpoint - no authentication required
   * Returns limited receipt information for customer verification
   */
  async lookupReceipt(request: ReceiptLookupRequest): Promise<ReceiptLookupResponse> {
    this.validateLookupRequest(request);
    return this.receiptBarcodeService.lookupReceipt(request);
  }

  /**
   * Public receipt lookup by receipt number
   * GET /api/receipts/lookup/:receiptNumber
   * Public endpoint - no authentication required
   * Returns limited receipt information for customer verification
   */
  async lookupByReceiptNumber(receiptNumber: string): Promise<ReceiptLookupResponse> {
    if (!receiptNumber || receiptNumber.trim().length === 0) {
      return {
        success: false,
        found: false,
        error: 'Receipt number is required',
        notFoundReason: 'invalid_code'
      };
    }

    return this.receiptBarcodeService.lookupReceipt({
      code: receiptNumber.trim(),
      codeType: 'receipt_number'
    });
  }

  /**
   * Admin receipt lookup with full details
   * POST /api/receipts/admin-lookup
   * Requires authentication
   * Returns full receipt details for admin use
   */
  async adminLookupReceipt(code: string): Promise<AdminReceiptLookupResult> {
    if (!code || code.trim().length === 0) {
      return {
        success: false,
        found: false,
        error: 'Code is required'
      };
    }

    return this.receiptBarcodeService.adminLookupReceipt(code.trim());
  }

  /**
   * Scan barcode and lookup receipt (admin)
   * POST /api/receipts/scan
   * Requires authentication
   * Used by admin barcode scanner to quickly find receipts
   */
  async scanAndLookup(code: string, codeType: 'qr' | 'barcode' | 'receipt_number' = 'receipt_number'): Promise<AdminReceiptLookupResult> {
    if (!code || code.trim().length === 0) {
      return {
        success: false,
        found: false,
        error: 'Code is required'
      };
    }

    return this.receiptBarcodeService.adminLookupReceipt(code.trim());
  }

  private validateGenerateQrCodeRequest(request: GenerateReceiptQrCodeRequest): void {
    if (!request.receiptNumber) {
      throw new Error('Receipt number is required');
    }

    if (request.receiptNumber.length > 50) {
      throw new Error('Receipt number must not exceed 50 characters');
    }

    if (request.storeId && request.storeId.length > 50) {
      throw new Error('Store ID must not exceed 50 characters');
    }
  }

  private validateGenerateBarcodeRequest(request: GenerateBarcodeRequest): void {
    if (!request.receiptNumber) {
      throw new Error('Receipt number is required');
    }

    if (request.receiptNumber.length > 50) {
      throw new Error('Receipt number must not exceed 50 characters');
    }

    if (request.format && !['code128', 'code39', 'ean13', 'qr'].includes(request.format)) {
      throw new Error('Invalid barcode format');
    }
  }

  private validateLookupRequest(request: ReceiptLookupRequest): void {
    if (!request.code) {
      throw new Error('Code is required');
    }

    if (request.code.length > 500) {
      throw new Error('Code must not exceed 500 characters');
    }

    if (!request.codeType || !['qr', 'barcode', 'receipt_number'].includes(request.codeType)) {
      throw new Error('Invalid code type');
    }
  }
}
