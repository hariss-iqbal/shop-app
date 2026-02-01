import { ReceiptRepository } from '../repositories/receipt.repository';
import {
  ReceiptQrCodeData,
  GenerateReceiptQrCodeRequest,
  GenerateReceiptQrCodeResponse,
  ReceiptLookupRequest,
  ReceiptLookupResponse,
  ReceiptCodeConfig,
  GenerateBarcodeRequest,
  GenerateBarcodeResponse,
  AdminReceiptLookupResult,
  BarcodeFormat
} from '../dto/receipt-barcode.dto';

/**
 * Receipt Barcode/QR Code Service
 * Handles generation and lookup of receipt barcodes and QR codes
 * Feature: F-017 Barcode/QR Code on Receipts
 */
export class ReceiptBarcodeService {
  private readonly config: ReceiptCodeConfig;
  private readonly QR_CODE_VERSION = 1;
  private readonly DEFAULT_STORE_ID = 'DEFAULT';
  private readonly QR_API_BASE = 'https://api.qrserver.com/v1/create-qr-code';

  constructor(
    private readonly receiptRepository: ReceiptRepository,
    config?: Partial<ReceiptCodeConfig>
  ) {
    this.config = {
      defaultQrSize: 200,
      defaultBarcodeWidth: 200,
      defaultBarcodeHeight: 80,
      storeId: config?.storeId || this.DEFAULT_STORE_ID,
      lookupBaseUrl: config?.lookupBaseUrl || '',
      qrVersion: this.QR_CODE_VERSION
    };
  }

  /**
   * Generate QR code data for a receipt
   */
  generateQrCode(request: GenerateReceiptQrCodeRequest): GenerateReceiptQrCodeResponse {
    const storeId = request.storeId || this.config.storeId;
    const receiptNumber = request.receiptNumber;

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

    const qrData = this.encodeQrData({
      receiptNumber,
      storeId,
      version: this.config.qrVersion,
      checksum: this.generateChecksum(receiptNumber, storeId)
    });

    const lookupUrl = this.buildLookupUrl(receiptNumber, storeId);
    const qrCodeUrl = this.buildQrCodeImageUrl(lookupUrl, this.config.defaultQrSize);

    return {
      success: true,
      qrCodeData: qrData,
      qrCodeUrl,
      lookupUrl,
      size: this.config.defaultQrSize
    };
  }

  /**
   * Lookup a receipt by QR code data, barcode, or receipt number
   */
  async lookupReceipt(request: ReceiptLookupRequest): Promise<ReceiptLookupResponse> {
    const { code, codeType } = request;

    if (!code) {
      return {
        success: false,
        found: false,
        error: 'Code is required',
        notFoundReason: 'invalid_code'
      };
    }

    let receiptNumber: string;
    let storeId: string | null = null;

    if (codeType === 'qr') {
      const decoded = this.decodeQrData(code);
      if (!decoded) {
        return {
          success: false,
          found: false,
          error: 'Invalid QR code data',
          notFoundReason: 'invalid_code'
        };
      }

      if (!this.validateChecksum(decoded)) {
        return {
          success: false,
          found: false,
          error: 'QR code validation failed',
          notFoundReason: 'invalid_code'
        };
      }

      receiptNumber = decoded.receiptNumber;
      storeId = decoded.storeId;
    } else if (codeType === 'barcode') {
      receiptNumber = this.decodeBarcodeData(code);
    } else {
      receiptNumber = code;
    }

    const receipt = await this.receiptRepository.findByReceiptNumber(receiptNumber);

    if (!receipt) {
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
        id: receipt.id,
        receiptNumber: receipt.receipt_number,
        transactionDate: receipt.transaction_date,
        transactionTime: receipt.transaction_time,
        grandTotal: receipt.grand_total,
        customerName: receipt.customer_name,
        storeId: storeId || this.config.storeId,
        itemCount: receipt.items?.length || 0
      }
    };
  }

  /**
   * Admin receipt lookup with full details
   */
  async adminLookupReceipt(code: string): Promise<AdminReceiptLookupResult> {
    if (!code) {
      return {
        success: false,
        found: false,
        error: 'Code is required'
      };
    }

    let receiptNumber = code;

    if (code.startsWith('RCP:')) {
      const decoded = this.decodeQrData(code);
      if (decoded) {
        receiptNumber = decoded.receiptNumber;
      }
    }

    const receipt = await this.receiptRepository.findByReceiptNumber(receiptNumber);

    if (!receipt) {
      return {
        success: true,
        found: false
      };
    }

    return {
      success: true,
      found: true,
      receipt: {
        id: receipt.id,
        receiptNumber: receipt.receipt_number,
        transactionDate: receipt.transaction_date,
        transactionTime: receipt.transaction_time,
        subtotal: receipt.subtotal,
        taxRate: receipt.tax_rate,
        taxAmount: receipt.tax_amount,
        grandTotal: receipt.grand_total,
        customerName: receipt.customer_name,
        customerPhone: receipt.customer_phone,
        customerEmail: receipt.customer_email,
        notes: receipt.notes,
        itemCount: receipt.items?.length || 0,
        createdAt: receipt.created_at
      }
    };
  }

  /**
   * Generate barcode data for a receipt
   */
  generateBarcode(request: GenerateBarcodeRequest): GenerateBarcodeResponse {
    const { receiptNumber, format = 'code128' } = request;

    if (!receiptNumber) {
      return {
        success: false,
        barcodeData: '',
        format,
        error: 'Receipt number is required'
      };
    }

    const barcodeData = this.encodeBarcodeData(receiptNumber, format);

    return {
      success: true,
      barcodeData,
      format
    };
  }

  /**
   * Encode receipt data into QR code format
   */
  private encodeQrData(data: ReceiptQrCodeData): string {
    return `RCP:${data.version}:${data.storeId}:${data.receiptNumber}:${data.checksum}`;
  }

  /**
   * Decode QR code data string
   */
  private decodeQrData(encoded: string): ReceiptQrCodeData | null {
    if (!encoded.startsWith('RCP:')) {
      const urlMatch = encoded.match(/\/receipt\/([^?/]+)/);
      if (urlMatch) {
        return {
          receiptNumber: decodeURIComponent(urlMatch[1]),
          storeId: this.config.storeId,
          version: this.config.qrVersion,
          checksum: ''
        };
      }
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

  /**
   * Encode barcode data
   */
  private encodeBarcodeData(receiptNumber: string, _format: BarcodeFormat): string {
    return receiptNumber.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
  }

  /**
   * Decode barcode data
   */
  private decodeBarcodeData(encoded: string): string {
    return encoded.trim();
  }

  /**
   * Generate a checksum for data validation
   */
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

  /**
   * Validate checksum of decoded data
   */
  private validateChecksum(data: ReceiptQrCodeData): boolean {
    if (!data.checksum) {
      return true;
    }
    const expectedChecksum = this.generateChecksum(data.receiptNumber, data.storeId);
    return data.checksum === expectedChecksum;
  }

  /**
   * Build the lookup URL for a receipt
   */
  private buildLookupUrl(receiptNumber: string, storeId: string): string {
    const baseUrl = this.config.lookupBaseUrl || '';
    const encodedReceipt = encodeURIComponent(receiptNumber);
    const encodedStore = encodeURIComponent(storeId);
    return `${baseUrl}/receipt/${encodedReceipt}?store=${encodedStore}`;
  }

  /**
   * Build QR code image URL using external service
   */
  private buildQrCodeImageUrl(data: string, size: number): string {
    return `${this.QR_API_BASE}/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ReceiptCodeConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Get current configuration
   */
  getConfig(): ReceiptCodeConfig {
    return { ...this.config };
  }
}
