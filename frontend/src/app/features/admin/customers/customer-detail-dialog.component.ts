import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { CustomerService } from '../../../core/services/customer.service';
import { EmailReceiptService } from '../../../core/services/email-receipt.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CustomerProfile } from '../../../models/customer.model';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';

interface SaleForEmail {
  id: string;
  phoneId: string;
  brandName: string;
  phoneName: string;
  saleDate: string;
  salePrice: number;
  selected?: boolean;
}

@Component({
  selector: 'app-customer-detail-dialog',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    DialogModule,
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
    DividerModule,
    TextareaModule,
    InputTextModule,
    CheckboxModule,
    MessageModule,
    ProgressSpinnerModule,
    DatePipe,
    AppCurrencyPipe
  ],
  templateUrl: './customer-detail-dialog.component.html'
})
export class CustomerDetailDialogComponent {
  private customerService = inject(CustomerService);
  private emailReceiptService = inject(EmailReceiptService);
  private toastService = inject(ToastService);

  @Input() visible = false;
  @Input() set customerId(value: string | null) {
    if (value && value !== this._customerId) {
      this._customerId = value;
      this.loadCustomer(value);
    }
  }

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() edit = new EventEmitter<string>();
  @Output() emailsSent = new EventEmitter<{ customerId: string; sentCount: number }>();

  private _customerId: string | null = null;
  customerData = signal<CustomerProfile | null>(null);
  loading = signal(false);

  // Email functionality - Feature: F-021
  showEmailSection = signal(false);
  emailSending = signal(false);
  emailError = signal<string | null>(null);
  emailSuccess = signal<string | null>(null);
  emailAddress = '';
  salesForEmail: SaleForEmail[] = [];

  async loadCustomer(customerId: string): Promise<void> {
    this.loading.set(true);
    this.customerData.set(null);
    this.resetEmailSection();

    try {
      const data = await this.customerService.getCustomerPurchaseHistory(customerId);
      this.customerData.set(data);

      // Initialize sales for email selection
      this.salesForEmail = data.sales.map(sale => ({
        id: sale.id,
        phoneId: sale.phoneId,
        brandName: sale.brandName,
        phoneName: sale.phoneName,
        saleDate: sale.saleDate,
        salePrice: sale.salePrice,
        selected: false
      }));

      // Pre-fill email address if customer has one
      if (data.customer.email) {
        this.emailAddress = data.customer.email;
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to load customer details');
      console.error('Failed to load customer:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onEdit(): void {
    if (this._customerId) {
      this.edit.emit(this._customerId);
    }
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  formatPhone(phone: string): string {
    if (phone.length === 10) {
      return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6)}`;
    }
    return phone;
  }

  // Email functionality - Feature: F-021 Email Receipt Option
  hasEmailOnFile(): boolean {
    const data = this.customerData();
    return !!data?.customer?.email && this.emailReceiptService.isValidEmail(data.customer.email);
  }

  emailButtonTooltip(): string {
    if (!this.hasEmailOnFile()) {
      return 'Email receipts (enter email address manually)';
    }
    return 'Email receipts to customer';
  }

  toggleEmailSection(): void {
    const show = !this.showEmailSection();
    this.showEmailSection.set(show);
    if (!show) {
      this.resetEmailSection();
    }
  }

  hideEmailSection(): void {
    this.showEmailSection.set(false);
    this.resetEmailSection();
  }

  private resetEmailSection(): void {
    this.emailError.set(null);
    this.emailSuccess.set(null);
    this.clearReceiptSelection();
    const data = this.customerData();
    if (data?.customer?.email) {
      this.emailAddress = data.customer.email;
    } else {
      this.emailAddress = '';
    }
  }

  isEmailValid(): boolean {
    return this.emailReceiptService.isValidEmail(this.emailAddress);
  }

  selectAllReceipts(): void {
    this.salesForEmail.forEach(sale => sale.selected = true);
  }

  clearReceiptSelection(): void {
    this.salesForEmail.forEach(sale => sale.selected = false);
  }

  selectedReceiptCount(): number {
    return this.salesForEmail.filter(s => s.selected).length;
  }

  canSendEmail(): boolean {
    return this.isEmailValid() && this.selectedReceiptCount() > 0;
  }

  async sendEmailReceipts(): Promise<void> {
    if (!this._customerId || !this.canSendEmail()) return;

    this.emailSending.set(true);
    this.emailError.set(null);
    this.emailSuccess.set(null);

    const selectedReceiptIds = this.salesForEmail
      .filter(s => s.selected)
      .map(s => s.id);

    try {
      const result = await this.emailReceiptService.sendCustomerReceipts({
        customerId: this._customerId,
        recipientEmail: this.emailAddress.trim().toLowerCase(),
        receiptIds: selectedReceiptIds
      }, { showSuccessToast: false, showErrorToast: false });

      if (result.success) {
        this.emailSuccess.set(
          `Successfully sent ${result.sentCount} receipt${result.sentCount > 1 ? 's' : ''} to ${this.emailAddress}`
        );
        this.emailsSent.emit({
          customerId: this._customerId,
          sentCount: result.sentCount
        });
        this.clearReceiptSelection();
      } else {
        this.emailError.set(result.message || 'Failed to send emails');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send emails';
      this.emailError.set(errorMessage);
    } finally {
      this.emailSending.set(false);
    }
  }
}
