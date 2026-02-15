import { Component, signal, input, output, computed, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { ImageModule } from 'primeng/image';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { SaleService } from '../../../../core/services/sale.service';
import { CustomerService } from '../../../../core/services/customer.service';
import { InputSanitizationService } from '../../../../core/services/input-sanitization.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';
import { Product } from '../../../../models/product.model';
import { CustomerWithStats } from '../../../../models/customer.model';
import { CustomerFormDialogComponent } from '../../customers/customer-form-dialog.component';

/**
 * Mark as Sold Dialog Component
 * Feature: F-019 Customer Contact Management - Customer auto-fill during sale
 * Feature: F-025 Mark as Sold workflow
 */
@Component({
  selector: 'app-mark-as-sold-dialog',
  imports: [
    FormsModule,
    CurrencyPipe,
    DecimalPipe,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    TextareaModule,
    FloatLabelModule,
    DividerModule,
    TagModule,
    ImageModule,
    ProgressSpinnerModule,
    CustomerFormDialogComponent
  ],
  templateUrl: './mark-as-sold-dialog.component.html'
})
export class MarkAsSoldDialogComponent implements OnChanges {
  constructor(
    private saleService: SaleService,
    private customerService: CustomerService,
    private sanitizer: InputSanitizationService,
    private toastService: ToastService,
    private focusService: FocusManagementService
  ) { }

  product = input<Product | null>(null);
  visible = input<boolean>(false);
  visibleChange = output<boolean>();
  saleSaved = output<void>();

  saving = signal(false);

  salePrice: number | null = null;
  saleDate: Date | null = null;
  buyerName = '';
  buyerPhone = '';
  buyerEmail = '';
  notes = '';

  // Customer lookup state - Feature: F-019
  customerLookupLoading = signal(false);
  customerLookupStatus = signal<'idle' | 'found' | 'not_found'>('idle');
  selectedCustomer = signal<CustomerWithStats | null>(null);
  showCustomerFormDialog = signal(false);
  private customerLookupTimeout: ReturnType<typeof setTimeout> | null = null;

  dialogHeader = computed(() => {
    const p = this.product();
    return p ? `Mark as Sold - ${p.brandName} ${p.model}` : 'Mark as Sold';
  });

  getEstimatedProfit(): number {
    const p = this.product();
    if (!p || this.salePrice === null) return 0;
    return this.salePrice - p.costPrice;
  }

  getProfitMargin(): number {
    if (this.salePrice === null || this.salePrice === 0) return 0;
    return (this.getEstimatedProfit() / this.salePrice) * 100;
  }

  getProfitClass(): string {
    const profit = this.getEstimatedProfit();
    if (profit > 0) return 'bg-green-50 text-green-700';
    if (profit < 0) return 'bg-red-50 text-red-700';
    return 'bg-surface-100 text-color-secondary';
  }

  getProfitIcon(): string {
    const profit = this.getEstimatedProfit();
    if (profit > 0) return 'pi-arrow-up text-green-500';
    if (profit < 0) return 'pi-arrow-down text-red-500';
    return 'pi-minus text-color-secondary';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] || changes['visible']) {
      const p = this.product();
      const v = this.visible();
      if (v && p) {
        this.resetForm(p);
      }
    }
  }

  isFormValid(): boolean {
    return this.salePrice !== null && this.salePrice >= 0 && this.saleDate !== null;
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

  /**
   * Look up customer by phone number when phone field loses focus
   * Feature: F-019 Customer Contact Management
   */
  async onBuyerPhoneLookup(): Promise<void> {
    const phone = this.buyerPhone.trim();

    // Reset if phone is empty or too short
    if (phone.length < 5) {
      this.customerLookupStatus.set('idle');
      this.selectedCustomer.set(null);
      return;
    }

    // Debounce to avoid multiple rapid lookups
    if (this.customerLookupTimeout) {
      clearTimeout(this.customerLookupTimeout);
    }

    this.customerLookupTimeout = setTimeout(async () => {
      this.customerLookupLoading.set(true);

      try {
        const customer = await this.customerService.lookupByPhone(phone);

        if (customer) {
          this.selectedCustomer.set(customer);
          this.customerLookupStatus.set('found');

          // Auto-fill customer info - Feature: F-019 AC3
          this.buyerName = customer.name;
          if (customer.email) {
            this.buyerEmail = customer.email;
          }

          this.toastService.info('Customer Found', `${customer.name} - ${customer.totalTransactions} previous transaction(s)`);
        } else {
          this.selectedCustomer.set(null);
          this.customerLookupStatus.set('not_found');
        }
      } catch (error) {
        console.error('Error looking up customer:', error);
        this.customerLookupStatus.set('not_found');
      } finally {
        this.customerLookupLoading.set(false);
      }
    }, 300);
  }

  /**
   * Open the create customer dialog
   * Feature: F-019 Customer Contact Management - AC1
   */
  openCreateCustomerDialog(): void {
    this.showCustomerFormDialog.set(true);
  }

  /**
   * Handle new customer creation from the dialog
   * Feature: F-019 Customer Contact Management - AC2
   */
  onCustomerCreated(customer: CustomerWithStats): void {
    this.selectedCustomer.set(customer);
    this.customerLookupStatus.set('found');

    // Fill buyer info
    this.buyerPhone = customer.phone;
    this.buyerName = customer.name;
    if (customer.email) {
      this.buyerEmail = customer.email;
    }

    this.toastService.success('Customer Created', `${customer.name} has been added`);
  }

  async onConfirm(): Promise<void> {
    const p = this.product();
    if (!p || !this.isFormValid()) return;

    this.saving.set(true);

    try {
      const saleDateFormatted = this.formatDate(this.saleDate!);

      await this.saleService.markAsSold({
        productId: p.id,
        salePrice: this.salePrice!,
        saleDate: saleDateFormatted,
        buyerName: this.sanitizer.sanitizeOrNull(this.buyerName),
        buyerPhone: this.sanitizer.sanitizeOrNull(this.buyerPhone),
        buyerEmail: this.buyerEmail?.trim() || null,
        notes: this.sanitizer.sanitizeOrNull(this.notes),
        customerId: this.selectedCustomer()?.id || null
      });

      this.toastService.success('Sale Confirmed', `${p.brandName} ${p.model} has been marked as sold`);
      this.visibleChange.emit(false);
      this.saleSaved.emit();
    } catch (error) {
      this.toastService.error('Error', 'Failed to mark product as sold');
      console.error('Failed to mark as sold:', error);
    } finally {
      this.saving.set(false);
    }
  }

  private resetForm(product: Product): void {
    this.salePrice = product.sellingPrice;
    this.saleDate = new Date();
    this.buyerName = '';
    this.buyerPhone = '';
    this.buyerEmail = '';
    this.notes = '';
    // Reset customer lookup state
    this.customerLookupStatus.set('idle');
    this.selectedCustomer.set(null);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
