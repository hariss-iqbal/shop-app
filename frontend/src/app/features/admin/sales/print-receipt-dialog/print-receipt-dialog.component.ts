import { Component, input, output, computed, OnChanges, SimpleChanges, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { SharedModule } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { ReceiptData, StoreConfig } from '../../../../models/sale.model';
import { ReceiptService } from '../../../../shared/services/receipt.service';
import { WhatsAppService } from '../../../../shared/services/whatsapp.service';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';
import { ReceiptSendLogService } from '../../../../core/services/receipt-send-log.service';
import { EmailReceiptService } from '../../../../core/services/email-receipt.service';
import { PaymentMethodLabels, PaymentMethod } from '../../../../enums/payment-method.enum';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';

@Component({
  selector: 'app-print-receipt-dialog',
  imports: [
    DecimalPipe,
    AppCurrencyPipe,
    DialogModule,
    ButtonModule,
    FormsModule,
    DividerModule,
    SharedModule,
    TableModule,
    InputTextModule,
    TooltipModule,
    MessageModule,
    ProgressSpinnerModule
  ],
  templateUrl: './print-receipt-dialog.component.html',
  styleUrls: ['./print-receipt-dialog.component.scss']
})
export class PrintReceiptDialogComponent implements OnChanges {

  receiptData = input<ReceiptData | null>(null);
  receiptId = input<string | null>(null);
  visible = input<boolean>(false);
  visibleChange = output<boolean>();
  whatsAppSent = output<{ phoneNumber: string; receiptNumber: string }>();
  emailSent = output<{ email: string; receiptNumber: string }>();

  manualPhoneNumber = '';
  manualEmailAddress = '';
  storeConfig: StoreConfig;

  showWhatsAppInput = signal(false);
  showEmailInput = signal(false);
  emailSending = signal(false);
  whatsAppSending = signal(false);
  pdfSharing = signal(false);
  lastEmailError = signal<string | null>(null);
  lastEmailAddress = signal<string | null>(null);
  lastWhatsAppError = signal<string | null>(null);
  lastWhatsAppLink = signal<string | null>(null);

  constructor(
    private receiptService: ReceiptService,
    private whatsAppService: WhatsAppService,
    private emailReceiptService: EmailReceiptService,
    private focusService: FocusManagementService,
    private receiptSendLogService: ReceiptSendLogService
  ) {
    this.storeConfig = this.receiptService.getStoreConfig();
  }

  dialogHeader = computed(() => {
    const data = this.receiptData();
    return data ? `Receipt - ${data.receiptNumber}` : 'Print Receipt';
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      const v = this.visible();
      if (v) {
        this.showWhatsAppInput.set(false);
        this.showEmailInput.set(false);
        this.manualPhoneNumber = '';
        this.manualEmailAddress = '';
        this.lastEmailError.set(null);
        this.lastEmailAddress.set(null);
        this.lastWhatsAppError.set(null);
        this.lastWhatsAppLink.set(null);
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

  onClose(): void {
    this.visibleChange.emit(false);
  }

  onPrint(): void {
    const data = this.receiptData();
    if (!data) return;

    this.receiptService.printReceipt(data, { showQrCode: false });
  }

  onDownloadPdf(): void {
    const data = this.receiptData();
    if (!data) return;

    this.receiptService.generatePdf(data, { showQrCode: false });
  }

  async onSharePdf(): Promise<void> {
    const data = this.receiptData();
    if (!data) return;

    this.pdfSharing.set(true);
    try {
      // Try to share with customer phone if available
      const customerPhone = data.customerPhone;
      if (customerPhone && this.whatsAppService.canSendWhatsApp(customerPhone)) {
        await this.whatsAppService.shareToWhatsApp(data, customerPhone, { showQrCode: false });
      } else {
        // Just share the PDF without targeting WhatsApp specifically
        await this.whatsAppService.sharePdfReceipt(data, { showQrCode: false });
      }
    } finally {
      this.pdfSharing.set(false);
    }
  }

  // WhatsApp functionality
  hasCustomerPhone(): boolean {
    const data = this.receiptData();
    return !!data?.customerPhone && this.whatsAppService.canSendWhatsApp(data.customerPhone);
  }

  canSendWhatsApp(): boolean {
    return this.receiptData() !== null;
  }

  whatsAppTooltip(): string {
    const data = this.receiptData();
    if (!data) return 'No receipt data';
    if (data.customerPhone && this.whatsAppService.canSendWhatsApp(data.customerPhone)) {
      return `Send to ${this.whatsAppService.formatPhoneDisplay(data.customerPhone)}`;
    }
    return 'Enter phone number to send via WhatsApp';
  }

  onSendWhatsApp(): void {
    const data = this.receiptData();
    if (!data) return;

    if (data.customerPhone && this.whatsAppService.canSendWhatsApp(data.customerPhone)) {
      this.sendToWhatsApp(data.customerPhone);
    } else {
      this.showWhatsAppInput.set(true);
      this.showEmailInput.set(false);
    }
  }

  async onSendWhatsAppWithManualPhone(): Promise<void> {
    if (!this.isManualPhoneValid()) return;

    const data = this.receiptData();
    if (!data) return;

    this.pdfSharing.set(true);
    try {
      await this.whatsAppService.shareToWhatsApp(data, this.manualPhoneNumber, { showQrCode: false });
      this.showWhatsAppInput.set(false);
      this.manualPhoneNumber = '';
    } finally {
      this.pdfSharing.set(false);
    }
  }

  isManualPhoneValid(): boolean {
    return this.whatsAppService.canSendWhatsApp(this.manualPhoneNumber);
  }

  hideWhatsAppInput(): void {
    this.showWhatsAppInput.set(false);
    this.manualPhoneNumber = '';
  }

  // Email functionality
  hasCustomerEmail(): boolean {
    const data = this.receiptData();
    return !!data?.customerEmail && this.emailReceiptService.canSendEmail(data.customerEmail);
  }

  canSendEmail(): boolean {
    return this.receiptData() !== null && !this.emailSending();
  }

  emailTooltip(): string {
    const data = this.receiptData();
    if (!data) return 'No receipt data';
    if (data.customerEmail && this.emailReceiptService.canSendEmail(data.customerEmail)) {
      return `Send to ${data.customerEmail}`;
    }
    return 'Enter email address to send receipt';
  }

  onSendEmail(): void {
    const data = this.receiptData();
    if (!data) return;

    if (data.customerEmail && this.emailReceiptService.canSendEmail(data.customerEmail)) {
      this.sendToEmail(data.customerEmail);
    } else {
      this.showEmailInput.set(true);
      this.showWhatsAppInput.set(false);
      this.lastEmailError.set(null);
    }
  }

  onResendEmail(): void {
    const data = this.receiptData();
    if (!data || !data.customerEmail) return;
    this.sendToEmail(data.customerEmail);
  }

  onSendEmailWithManualAddress(): void {
    if (!this.isManualEmailValid()) return;
    this.sendToEmail(this.manualEmailAddress);
  }

  isManualEmailValid(): boolean {
    return this.emailReceiptService.canSendEmail(this.manualEmailAddress);
  }

  hideEmailInput(): void {
    this.showEmailInput.set(false);
    this.manualEmailAddress = '';
    this.lastEmailError.set(null);
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    return PaymentMethodLabels[method] || method;
  }

  private async sendToWhatsApp(phoneNumber: string): Promise<void> {
    const data = this.receiptData();
    if (!data) return;

    this.whatsAppSending.set(true);
    this.lastWhatsAppError.set(null);
    this.lastWhatsAppLink.set(null);

    try {
      const result = this.whatsAppService.sendReceiptViaWhatsApp(data, phoneNumber);

      const currentReceiptId = this.receiptId();
      if (currentReceiptId) {
        try {
          await this.receiptSendLogService.logSend({
            receiptId: currentReceiptId,
            channel: 'whatsapp',
            recipientPhone: phoneNumber,
            status: result.success ? 'sent' : 'failed',
            errorMessage: result.success ? null : result.error
          });
        } catch (error) {
          console.error('Failed to log send:', error);
        }
      }

      if (result.success) {
        this.whatsAppSent.emit({
          phoneNumber,
          receiptNumber: data.receiptNumber
        });
      } else {
        this.lastWhatsAppError.set(result.error || 'Failed to open WhatsApp');
        if (result.whatsappLink) {
          this.lastWhatsAppLink.set(result.whatsappLink);
        }
      }
    } finally {
      this.whatsAppSending.set(false);
    }
  }

  onRetryWhatsApp(): void {
    const link = this.lastWhatsAppLink();
    if (link) {
      window.open(link, '_blank');
      this.lastWhatsAppError.set(null);
      this.lastWhatsAppLink.set(null);
    }
  }

  private async sendToEmail(emailAddress: string): Promise<void> {
    const data = this.receiptData();
    if (!data) return;

    this.emailSending.set(true);
    this.lastEmailError.set(null);
    this.lastEmailAddress.set(emailAddress);

    try {
      const result = await this.emailReceiptService.sendReceiptDataViaEmail(
        data,
        emailAddress,
        { showSuccessToast: true, showErrorToast: false }
      );

      if (result.success) {
        this.showEmailInput.set(false);
        this.manualEmailAddress = '';
        this.lastEmailAddress.set(null);
        this.emailSent.emit({
          email: emailAddress,
          receiptNumber: data.receiptNumber
        });
      } else {
        this.lastEmailError.set(result.error || 'Failed to send email');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
      this.lastEmailError.set(errorMessage);
    } finally {
      this.emailSending.set(false);
    }
  }

  onRetryEmail(): void {
    const emailAddress = this.lastEmailAddress();
    if (emailAddress) {
      this.sendToEmail(emailAddress);
    }
  }

  dismissEmailError(): void {
    this.lastEmailError.set(null);
    this.lastEmailAddress.set(null);
  }
}
