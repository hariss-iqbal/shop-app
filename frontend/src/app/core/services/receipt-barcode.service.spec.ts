import { TestBed } from '@angular/core/testing';
import { ReceiptBarcodeService, ReceiptLookupResponse, GenerateQrCodeResponse, AdminReceiptLookupResult } from './receipt-barcode.service';

describe('ReceiptBarcodeService', () => {
  let service: ReceiptBarcodeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReceiptBarcodeService]
    });
    service = TestBed.inject(ReceiptBarcodeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateQrCode', () => {
    it('should generate QR code with valid receipt number', () => {
      const result: GenerateQrCodeResponse = service.generateQrCode('RCP-001');

      expect(result.success).toBe(true);
      expect(result.qrCodeData).toContain('RCP:');
      expect(result.qrCodeData).toContain('RCP-001');
      expect(result.qrCodeUrl).toContain('api.qrserver.com');
      expect(result.lookupUrl).toContain('/receipt/RCP-001');
      expect(result.size).toBe(200);
    });

    it('should return error for empty receipt number', () => {
      const result: GenerateQrCodeResponse = service.generateQrCode('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Receipt number is required');
    });

    it('should include store ID in QR data', () => {
      const result: GenerateQrCodeResponse = service.generateQrCode('RCP-002', 'STORE-A');

      expect(result.success).toBe(true);
      expect(result.qrCodeData).toContain('STORE-A');
      expect(result.lookupUrl).toContain('store=STORE-A');
    });

    it('should use default store ID when not specified', () => {
      const result: GenerateQrCodeResponse = service.generateQrCode('RCP-003');

      expect(result.qrCodeData).toContain('DEFAULT');
    });
  });

  describe('generateQrCodeUrl', () => {
    it('should generate QR code image URL', () => {
      const url = service.generateQrCodeUrl('RCP-001');

      expect(url).toContain('api.qrserver.com');
      expect(url).toContain('size=200x200');
      expect(url).toContain('receipt%2FRCP-001');
    });

    it('should support custom size', () => {
      const url = service.generateQrCodeUrl('RCP-001', 'DEFAULT', 300);

      expect(url).toContain('size=300x300');
    });
  });

  describe('generateSimpleQrCodeUrl', () => {
    it('should generate simple QR code URL without store ID param', () => {
      const url = service.generateSimpleQrCodeUrl('RCP-001');

      expect(url).toContain('api.qrserver.com');
      // The lookup URL is URL-encoded in the QR code API URL
      expect(url).toContain(encodeURIComponent('/receipt/'));
      expect(url).not.toContain('store=');
    });
  });

  describe('parseScannedCode', () => {
    it('should parse RCP format code', () => {
      const result = service.parseScannedCode('RCP:1:STORE-A:RCP-001:ABC123');

      expect(result).not.toBeNull();
      expect(result!.receiptNumber).toBe('RCP-001');
      expect(result!.storeId).toBe('STORE-A');
    });

    it('should parse URL format', () => {
      const result = service.parseScannedCode('https://example.com/receipt/RCP-002?store=STORE-B');

      expect(result).not.toBeNull();
      expect(result!.receiptNumber).toBe('RCP-002');
      expect(result!.storeId).toBe('STORE-B');
    });

    it('should handle plain receipt number', () => {
      const result = service.parseScannedCode('RCP-003');

      expect(result).not.toBeNull();
      expect(result!.receiptNumber).toBe('RCP-003');
      expect(result!.storeId).toBeNull();
    });

    it('should return null for empty code', () => {
      const result = service.parseScannedCode('');

      expect(result).toBeNull();
    });

    it('should trim whitespace from plain receipt number', () => {
      const result = service.parseScannedCode('  RCP-004  ');

      expect(result).not.toBeNull();
      expect(result!.receiptNumber).toBe('RCP-004');
    });
  });

  describe('lookupReceipt', () => {
    it('should return error for empty receipt number', async () => {
      const result: ReceiptLookupResponse = await service.lookupReceipt('');

      expect(result.success).toBe(false);
      expect(result.found).toBe(false);
      expect(result.error).toBe('Receipt number is required');
      expect(result.notFoundReason).toBe('invalid_code');
    });

    it('should return not found for non-existent receipt', async () => {
      const result: ReceiptLookupResponse = await service.lookupReceipt('NONEXISTENT-123');

      expect(result.success).toBe(true);
      expect(result.found).toBe(false);
      expect(result.notFoundReason).toBe('receipt_not_found');
    });
  });

  describe('adminLookupReceipt', () => {
    it('should return error for empty code', async () => {
      const result: AdminReceiptLookupResult = await service.adminLookupReceipt('');

      expect(result.success).toBe(false);
      expect(result.found).toBe(false);
      expect(result.error).toBe('Code is required');
    });

    it('should decode RCP format before lookup', async () => {
      const result: AdminReceiptLookupResult = await service.adminLookupReceipt('RCP:1:DEFAULT:RCP-001:ABC123');

      // Should not throw and should handle the decoded receipt number
      expect(result.success).toBe(true);
      expect(result.found).toBe(false); // Not found in mock DB
    });

    it('should handle plain receipt number', async () => {
      const result: AdminReceiptLookupResult = await service.adminLookupReceipt('RCP-002');

      expect(result.success).toBe(true);
      expect(result.found).toBe(false);
    });
  });

  describe('getStoreId', () => {
    it('should return default store ID', () => {
      const storeId = service.getStoreId();

      expect(storeId).toBe('DEFAULT');
    });
  });
});
