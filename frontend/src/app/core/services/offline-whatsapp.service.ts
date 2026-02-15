import { Injectable } from '@angular/core';
import { SyncQueueService } from './sync-queue.service';
import { NetworkStatusService } from './network-status.service';
import { WhatsAppService } from '../../shared/services/whatsapp.service';
import { ToastService } from '../../shared/services/toast.service';
import { ReceiptData, WhatsAppSendResult } from '../../models/sale.model';
import { OfflineWhatsAppPayload } from '../../models/offline-sync.model';
import { CurrencyService } from './currency.service';

/**
 * Offline WhatsApp Service
 * Feature: F-020 Offline Mode and Sync
 *
 * Handles WhatsApp message sending with offline support.
 * Queues messages when offline for sending when connection is restored.
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineWhatsAppService {
  constructor(
    private readonly syncQueue: SyncQueueService,
    private readonly networkStatus: NetworkStatusService,
    private readonly whatsAppService: WhatsAppService,
    private readonly toastService: ToastService,
    private readonly currencyService: CurrencyService
  ) { }

  /**
   * Send receipt via WhatsApp - online or queued for offline
   */
  async sendReceiptViaWhatsApp(
    receiptData: ReceiptData,
    customerPhone: string,
    options: { openInNewTab?: boolean; showSuccessToast?: boolean } = {}
  ): Promise<WhatsAppSendResult | { success: boolean; queued: boolean; message: string }> {
    if (this.networkStatus.isOnline()) {
      return this.whatsAppService.sendReceiptViaWhatsApp(receiptData, customerPhone, options);
    }

    return this.queueWhatsAppMessage(receiptData, customerPhone);
  }

  /**
   * Queue a WhatsApp message for later sending
   */
  async queueWhatsAppMessage(
    receiptData: ReceiptData,
    customerPhone: string
  ): Promise<{ success: boolean; queued: boolean; message: string }> {
    if (!this.whatsAppService.canSendWhatsApp(customerPhone)) {
      return {
        success: false,
        queued: false,
        message: 'Invalid phone number format'
      };
    }

    const formattedMessage = this.formatReceiptMessage(receiptData);

    const payload: OfflineWhatsAppPayload = {
      phoneNumber: this.cleanPhoneNumber(customerPhone),
      message: formattedMessage,
      receiptNumber: receiptData.receiptNumber,
      receiptLocalId: receiptData.receiptNumber,
      customerName: receiptData.customerName,
      grandTotal: receiptData.grandTotal
    };

    await this.syncQueue.queueWhatsAppMessage(payload);

    this.toastService.info(
      'Message Queued',
      'WhatsApp message will be sent when connection is restored'
    );

    return {
      success: true,
      queued: true,
      message: 'Message queued for sending when online'
    };
  }

  /**
   * Check if WhatsApp can be sent (valid number)
   */
  canSendWhatsApp(phoneNumber: string | null | undefined): boolean {
    return this.whatsAppService.canSendWhatsApp(phoneNumber);
  }

  /**
   * Format phone number for display
   */
  formatPhoneDisplay(phoneNumber: string): string {
    return this.whatsAppService.formatPhoneDisplay(phoneNumber);
  }

  /**
   * Get pending WhatsApp messages count
   */
  async getPendingWhatsAppCount(): Promise<number> {
    const items = await this.syncQueue.getPendingItems();
    return items.filter(item => item.operationType === 'SEND_WHATSAPP').length;
  }

  private formatReceiptMessage(receiptData: ReceiptData): string {
    const lines: string[] = [];

    lines.push('*RECEIPT*');
    lines.push(`Receipt #: ${receiptData.receiptNumber}`);
    lines.push(`Date: ${receiptData.transactionDate} ${receiptData.transactionTime}`);
    lines.push('');
    lines.push('*Items:*');

    for (const item of receiptData.items) {
      lines.push(`- ${item.name}: ${this.formatCurrency(item.total)}`);
    }

    lines.push('');
    lines.push(`Subtotal: ${this.formatCurrency(receiptData.subtotal)}`);

    if (receiptData.taxAmount > 0) {
      lines.push(`Tax (${receiptData.taxRate}%): ${this.formatCurrency(receiptData.taxAmount)}`);
    }

    lines.push(`*Total: ${this.formatCurrency(receiptData.grandTotal)}*`);

    if (receiptData.payments && receiptData.payments.length > 0) {
      lines.push('');
      lines.push('*Payment:*');
      for (const payment of receiptData.payments) {
        lines.push(`- ${payment.method}: ${this.formatCurrency(payment.amount)}`);
      }
    }

    if (receiptData.notes) {
      lines.push('');
      lines.push(`Notes: ${receiptData.notes}`);
    }

    lines.push('');
    lines.push('Thank you for your purchase!');

    return lines.join('\n');
  }

  private formatCurrency(amount: number): string {
    return this.currencyService.format(amount);
  }

  private cleanPhoneNumber(phone: string): string {
    return phone.replace(/[^\d]/g, '');
  }
}
