import { Component, input, output, computed, signal, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';

import { StoredReceipt, ReceiptSendLog, SendChannel } from '../../../../models/sale.model';
import { ReceiptStorageService } from '../../../../core/services/receipt-storage.service';
import { ReceiptSendLogService } from '../../../../core/services/receipt-send-log.service';
import { EmailReceiptService } from '../../../../core/services/email-receipt.service';
import { WhatsAppService } from '../../../../shared/services/whatsapp.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';

/**
 * Event emitted when a receipt resend operation completes
 * Feature: F-007 Receipt Resend Capability
 */
export interface ResendReceiptEvent {
  receiptId: string;
  phoneNumber?: string;
  email?: string;
  channel: SendChannel;
  receiptNumber: string;
  success: boolean;
}

/**
 * Resend Receipt Dialog Component
 * Feature: F-007 Receipt Resend Capability
 *
 * Provides a tabbed interface for resending receipts via WhatsApp or Email.
 * Features:
 * - Pre-populated customer phone/email from stored receipt
 * - Ability to update recipient contact before sending
 * - Visual feedback when contact info differs from original
 * - Send history with retry capability for failed sends
 * - Accessibility-friendly with proper ARIA labels
 */
@Component({
  selector: 'app-resend-receipt-dialog',
  imports: [
    FormsModule,
    DatePipe,
    AppCurrencyPipe,
    DialogModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    DividerModule,
    TooltipModule,
    ProgressSpinnerModule,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    TagModule,
    SkeletonModule
  ],
  templateUrl: './resend-receipt-dialog.component.html'
})
export class ResendReceiptDialogComponent implements OnChanges {
  constructor(
    private receiptStorageService: ReceiptStorageService,
    private receiptSendLogService: ReceiptSendLogService,
    private emailReceiptService: EmailReceiptService,
    private whatsAppService: WhatsAppService,
    private toastService: ToastService,
    private focusService: FocusManagementService
  ) { }

  receipt = input<StoredReceipt | null>(null);
  visible = input<boolean>(false);
  visibleChange = output<boolean>();
  resendComplete = output<ResendReceiptEvent>();

  phoneNumber = '';
  emailAddress = '';
  activeTabIndex = 0;
  sending = signal(false);
  sendingChannel = signal<SendChannel | null>(null);
  retryingAll = signal(false);
  emailError = signal<string | null>(null);
  sendHistory = signal<ReceiptSendLog[]>([]);
  loadingHistory = signal(false);

  originalPhone = computed(() => this.receipt()?.customerPhone || null);
  originalEmail = computed(() => this.receipt()?.customerEmail || null);
  cleanedPhone = computed(() => this.phoneNumber.replace(/[^\d+]/g, ''));

  /**
   * Checks if the phone number has been updated from the original
   * Feature: F-007 - Phone number update support
   */
  isPhoneUpdated = computed(() => {
    const original = this.originalPhone();
    if (!original) return false;
    const cleanedOriginal = original.replace(/[^\d+]/g, '');
    const cleanedCurrent = this.phoneNumber.replace(/[^\d+]/g, '');
    return cleanedOriginal !== cleanedCurrent && this.phoneNumber.length > 0;
  });

  /**
   * Checks if the email address has been updated from the original
   * Feature: F-007 - Email update support
   */
  isEmailUpdated = computed(() => {
    const original = this.originalEmail();
    if (!original) return false;
    return original.toLowerCase().trim() !== this.emailAddress.toLowerCase().trim() && this.emailAddress.length > 0;
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] || changes['receipt']) {
      const isVisible = this.visible();
      const currentReceipt = this.receipt();

      if (isVisible && currentReceipt) {
        this.phoneNumber = currentReceipt.customerPhone || '';
        this.emailAddress = currentReceipt.customerEmail || '';
        this.emailError.set(null);
        this.loadSendHistory(currentReceipt.id);
      } else if (!isVisible) {
        this.phoneNumber = '';
        this.emailAddress = '';
        this.emailError.set(null);
        this.sendHistory.set([]);
        this.activeTabIndex = 0;
      }
    }
  }

  onDialogShow(): void {
    this.focusService.saveTriggerElement();
  }

  onDialogHide(): void {
    this.focusService.restoreFocus();
  }

  onVisibleChange(value: boolean): void {
    this.visibleChange.emit(value);
  }

  onCancel(): void {
    this.visibleChange.emit(false);
  }

  onTabChange(index: number | string | undefined): void {
    if (typeof index === 'number') {
      this.activeTabIndex = index;
    }
  }

  isPhoneValid(): boolean {
    return this.whatsAppService.canSendWhatsApp(this.phoneNumber);
  }

  isEmailValid(): boolean {
    return this.emailReceiptService.isValidEmail(this.emailAddress);
  }

  formatTime(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  formatPhoneDisplay(phone: string): string {
    return this.whatsAppService.formatPhoneDisplay(phone);
  }

  getStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' {
    switch (status) {
      case 'sent': return 'success';
      case 'failed': return 'danger';
      case 'pending': return 'warn';
      default: return 'info';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'sent': return 'Sent';
      case 'failed': return 'Failed';
      case 'pending': return 'Pending';
      default: return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'sent': return 'pi pi-check';
      case 'failed': return 'pi pi-times';
      case 'pending': return 'pi pi-clock';
      default: return '';
    }
  }

  getLogAriaLabel(log: ReceiptSendLog): string {
    const recipient = log.recipientPhone || log.recipientEmail || 'unknown recipient';
    const channel = log.channel === 'whatsapp' ? 'WhatsApp' : log.channel === 'email' ? 'Email' : 'SMS';
    return `${channel} to ${recipient}, status: ${log.status}`;
  }

  hasFailedEmails(): boolean {
    return this.sendHistory().some(log => log.channel === 'email' && log.status === 'failed');
  }

  async onConfirmWhatsAppResend(): Promise<void> {
    if (!this.isPhoneValid() || this.sending()) return;

    const currentReceipt = this.receipt();
    if (!currentReceipt) return;

    this.sending.set(true);
    this.sendingChannel.set('whatsapp');

    try {
      const receiptData = this.receiptStorageService.convertToReceiptData(currentReceipt);

      const result = this.whatsAppService.sendReceiptViaWhatsApp(
        receiptData,
        this.phoneNumber,
        { showSuccessToast: false }
      );

      if (result.success) {
        await this.receiptSendLogService.logSend({
          receiptId: currentReceipt.id,
          channel: 'whatsapp',
          recipientPhone: this.phoneNumber,
          status: 'sent'
        });

        const isUpdated = this.isPhoneUpdated();
        this.toastService.success(
          isUpdated ? 'Receipt Sent to Updated Number' : 'Receipt Sent',
          `Receipt ${currentReceipt.receiptNumber} sent to ${this.formatPhoneDisplay(this.phoneNumber)}`
        );

        this.resendComplete.emit({
          receiptId: currentReceipt.id,
          phoneNumber: this.phoneNumber,
          channel: 'whatsapp',
          receiptNumber: currentReceipt.receiptNumber,
          success: true
        });

        await this.loadSendHistory(currentReceipt.id);
      } else {
        await this.receiptSendLogService.logSend({
          receiptId: currentReceipt.id,
          channel: 'whatsapp',
          recipientPhone: this.phoneNumber,
          status: 'failed',
          errorMessage: result.error
        });

        this.toastService.error('Send Failed', result.error || 'Failed to open WhatsApp');

        this.resendComplete.emit({
          receiptId: currentReceipt.id,
          phoneNumber: this.phoneNumber,
          channel: 'whatsapp',
          receiptNumber: currentReceipt.receiptNumber,
          success: false
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.toastService.error('Send Failed', errorMessage);
    } finally {
      this.sending.set(false);
      this.sendingChannel.set(null);
    }
  }

  /**
   * Send receipt via email
   * Feature: F-021 Email Receipt Option
   */
  async onConfirmEmailResend(): Promise<void> {
    if (!this.isEmailValid() || this.sending()) return;

    const currentReceipt = this.receipt();
    if (!currentReceipt) return;

    this.sending.set(true);
    this.sendingChannel.set('email');
    this.emailError.set(null);

    try {
      const result = await this.emailReceiptService.sendReceiptEmail(
        {
          receiptId: currentReceipt.id,
          recipientEmail: this.emailAddress,
          recipientName: currentReceipt.customerName
        },
        { showSuccessToast: false, showErrorToast: false }
      );

      if (result.success) {
        const isUpdated = this.isEmailUpdated();
        this.toastService.success(
          isUpdated ? 'Receipt Sent to Updated Email' : 'Email Sent',
          `Receipt ${currentReceipt.receiptNumber} sent to ${this.emailAddress}`
        );

        this.resendComplete.emit({
          receiptId: currentReceipt.id,
          email: this.emailAddress,
          channel: 'email',
          receiptNumber: currentReceipt.receiptNumber,
          success: true
        });

        await this.loadSendHistory(currentReceipt.id);
      } else {
        this.emailError.set(result.error || 'Failed to send email');

        this.resendComplete.emit({
          receiptId: currentReceipt.id,
          email: this.emailAddress,
          channel: 'email',
          receiptNumber: currentReceipt.receiptNumber,
          success: false
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.emailError.set(errorMessage);
    } finally {
      this.sending.set(false);
      this.sendingChannel.set(null);
    }
  }

  /**
   * Retry a specific failed email send
   * Feature: F-021 Email Receipt Option
   */
  async onRetryEmail(log: ReceiptSendLog): Promise<void> {
    if (this.sending() || log.channel !== 'email') return;

    this.sending.set(true);
    this.sendingChannel.set('email');
    this.emailError.set(null);

    try {
      const result = await this.emailReceiptService.retryFailedSend(
        { sendLogId: log.id },
        { showSuccessToast: true, showErrorToast: false }
      );

      if (!result.success) {
        this.emailError.set(result.error || 'Failed to retry email');
      }

      const currentReceipt = this.receipt();
      if (currentReceipt) {
        await this.loadSendHistory(currentReceipt.id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retry email';
      this.emailError.set(errorMessage);
    } finally {
      this.sending.set(false);
      this.sendingChannel.set(null);
    }
  }

  /**
   * Retry all failed email sends for this receipt
   * Feature: F-021 Email Receipt Option
   */
  async onRetryAllFailedEmails(): Promise<void> {
    if (this.retryingAll()) return;

    const failedLogs = this.sendHistory().filter(
      log => log.channel === 'email' && log.status === 'failed'
    );

    if (failedLogs.length === 0) return;

    this.retryingAll.set(true);
    this.emailError.set(null);

    let successCount = 0;
    let failCount = 0;

    for (const log of failedLogs) {
      try {
        const result = await this.emailReceiptService.retryFailedSend(
          { sendLogId: log.id },
          { showSuccessToast: false, showErrorToast: false }
        );

        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    if (successCount > 0) {
      this.toastService.success(
        'Retry Complete',
        `${successCount} email(s) sent successfully${failCount > 0 ? `, ${failCount} failed` : ''}`
      );
    } else {
      this.toastService.error('Retry Failed', `All ${failCount} email(s) failed to send`);
    }

    const currentReceipt = this.receipt();
    if (currentReceipt) {
      await this.loadSendHistory(currentReceipt.id);
    }

    this.retryingAll.set(false);
  }

  private async loadSendHistory(receiptId: string): Promise<void> {
    this.loadingHistory.set(true);
    try {
      const response = await this.receiptSendLogService.getSendLogs(receiptId);
      this.sendHistory.set(response.data);
    } catch (error) {
      console.error('Failed to load send history:', error);
      this.sendHistory.set([]);
    } finally {
      this.loadingHistory.set(false);
    }
  }
}
