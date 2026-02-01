import { Injectable, inject, signal } from '@angular/core';
import { ReceiptService } from './receipt.service';
import { ToastService } from './toast.service';
import { ReceiptData, WhatsAppSendResult } from '../../models/sale.model';

export interface WhatsAppOptions {
  openInNewTab?: boolean;
  showSuccessToast?: boolean;
  /** Timeout in milliseconds before considering the send as failed (default: 10000) */
  timeoutMs?: number;
}

export interface ShareResult {
  success: boolean;
  method?: 'native' | 'download' | 'whatsapp';
  error?: string;
}

/**
 * WhatsApp Service
 * Feature: F-004 WhatsApp Receipt Integration
 *
 * Handles sending receipts via WhatsApp using wa.me deep links.
 * Supports phone validation, error handling with retry, and send logging.
 * Also supports sharing PDF receipts via native share or download.
 */

@Injectable({
  providedIn: 'root'
})
export class WhatsAppService {
  private readonly receiptService = inject(ReceiptService);
  private readonly toastService = inject(ToastService);

  /** Signal to track sending state for UI feedback */
  readonly sending = signal(false);

  /** Last failed receipt data for retry functionality */
  private lastFailedReceipt: { receiptData: ReceiptData; phone: string } | null = null;

  /**
   * Send receipt via WhatsApp
   * Opens WhatsApp Web/App with pre-formatted receipt message
   */
  sendReceiptViaWhatsApp(
    receiptData: ReceiptData,
    customerPhone: string,
    options: WhatsAppOptions = {}
  ): WhatsAppSendResult {
    const { openInNewTab = true, showSuccessToast = true } = options;

    this.sending.set(true);
    this.lastFailedReceipt = null;

    try {
      if (!this.receiptService.isValidWhatsAppNumber(customerPhone)) {
        const error = 'Invalid phone number format. Please provide a valid phone number with country code.';
        this.toastService.error('Invalid Phone Number', error);
        this.lastFailedReceipt = { receiptData, phone: customerPhone };
        return { success: false, error };
      }

      const formattedReceipt = this.receiptService.formatReceiptForWhatsApp(receiptData);
      const whatsappLink = this.receiptService.generateWhatsAppLink(
        customerPhone,
        formattedReceipt.message
      );

      if (openInNewTab) {
        const newWindow = window.open(whatsappLink, '_blank');
        if (!newWindow) {
          const error = 'Unable to open WhatsApp. Please disable your popup blocker or try the direct link.';
          this.toastService.error('Popup Blocked', error, 8000);
          this.lastFailedReceipt = { receiptData, phone: customerPhone };
          return { success: false, error, whatsappLink };
        }
      } else {
        window.location.href = whatsappLink;
      }

      if (showSuccessToast) {
        this.toastService.success(
          'WhatsApp Opened',
          `Receipt #${receiptData.receiptNumber} ready to send to ${this.formatPhoneDisplay(customerPhone)}`
        );
      }

      return {
        success: true,
        sentAt: new Date(),
        phoneNumber: customerPhone,
        whatsappLink
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate WhatsApp message';
      this.toastService.error('WhatsApp Error', `${errorMessage}. Please try again.`, 8000);
      this.lastFailedReceipt = { receiptData, phone: customerPhone };
      return { success: false, error: errorMessage };
    } finally {
      this.sending.set(false);
    }
  }

  /**
   * Generate filename with current date and time
   */
  private generatePdfFilename(): string {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // 2024-01-15
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // 14-30-45
    return `receipt_${date}_${time}.pdf`;
  }

  /**
   * Share PDF receipt - downloads PDF then opens WhatsApp chat
   */
  async sharePdfReceipt(
    receiptData: ReceiptData,
    options: { showQrCode?: boolean } = {}
  ): Promise<ShareResult> {
    this.sending.set(true);

    try {
      // Use async version to embed real QR code
      const pdfBlob = await this.receiptService.generatePdfBlobAsync(receiptData, options);
      const filename = this.generatePdfFilename();
      this.downloadPdfBlob(pdfBlob, filename);

      this.toastService.success('PDF Downloaded', 'Attach it to WhatsApp');
      return { success: true, method: 'download' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';
      this.toastService.error('PDF Error', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      this.sending.set(false);
    }
  }

  /**
   * Share PDF to WhatsApp - downloads PDF then opens WhatsApp chat
   */
  async shareToWhatsApp(
    receiptData: ReceiptData,
    phoneNumber?: string,
    options: { showQrCode?: boolean } = {}
  ): Promise<ShareResult> {
    this.sending.set(true);

    try {
      // Use async version to embed real QR code
      const pdfBlob = await this.receiptService.generatePdfBlobAsync(receiptData, options);
      const filename = this.generatePdfFilename();
      this.downloadPdfBlob(pdfBlob, filename);

      // Open WhatsApp chat with simple message
      if (phoneNumber && this.canSendWhatsApp(phoneNumber)) {
        const whatsappLink = this.receiptService.generateWhatsAppLink(
          phoneNumber,
          'Thank you for shopping with us.'
        );

        // Small delay to ensure PDF download starts first
        setTimeout(() => {
          window.open(whatsappLink, '_blank');
        }, 500);

        this.toastService.success(
          'PDF Downloaded',
          'WhatsApp opening - attach the PDF'
        );
        return { success: true, method: 'whatsapp' };
      }

      this.toastService.success('PDF Downloaded', 'Attach it to WhatsApp');
      return { success: true, method: 'download' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to share PDF';
      this.toastService.error('Share Error', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      this.sending.set(false);
    }
  }

  /**
   * Check if the device supports native file sharing
   */
  canUseNativeShare(): boolean {
    if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
      return false;
    }
    try {
      return navigator.canShare({ files: [new File([''], 'test.pdf', { type: 'application/pdf' })] });
    } catch {
      return false;
    }
  }

  /**
   * Download PDF blob as file
   */
  private downloadPdfBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Retry the last failed WhatsApp send
   */
  retryLastFailed(): WhatsAppSendResult | null {
    if (!this.lastFailedReceipt) {
      return null;
    }

    const { receiptData, phone } = this.lastFailedReceipt;
    return this.sendReceiptViaWhatsApp(receiptData, phone);
  }

  /**
   * Check if a retry is available
   */
  canRetry(): boolean {
    return this.lastFailedReceipt !== null;
  }

  /**
   * Clear the last failed receipt data
   */
  clearLastFailed(): void {
    this.lastFailedReceipt = null;
  }

  canSendWhatsApp(phoneNumber: string | null | undefined): boolean {
    return this.receiptService.isValidWhatsAppNumber(phoneNumber);
  }

  formatPhoneDisplay(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/[^\d]/g, '');
    if (cleaned.length <= 10) {
      return phoneNumber;
    }
    const countryCode = cleaned.slice(0, cleaned.length - 10);
    const areaCode = cleaned.slice(-10, -7);
    const firstPart = cleaned.slice(-7, -4);
    const lastPart = cleaned.slice(-4);
    return `+${countryCode} ${areaCode} ${firstPart} ${lastPart}`;
  }

  getWhatsAppPreviewLink(phoneNumber: string, receiptData: ReceiptData): string | null {
    if (!this.receiptService.isValidWhatsAppNumber(phoneNumber)) {
      return null;
    }

    const formattedReceipt = this.receiptService.formatReceiptForWhatsApp(receiptData);
    return this.receiptService.generateWhatsAppLink(phoneNumber, formattedReceipt.message);
  }
}
