import { Component, EventEmitter, Input, Output, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';

import { CustomerService } from '../../../core/services/customer.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CustomerWithStats, CUSTOMER_VALIDATION } from '../../../models/customer.model';

@Component({
  selector: 'app-customer-form-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    FloatLabelModule
  ],
  templateUrl: './customer-form-dialog.component.html'
})
export class CustomerFormDialogComponent implements OnChanges {
  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private toastService: ToastService
  ) { }

  @Input() visible = false;
  @Input() customer: CustomerWithStats | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<CustomerWithStats>();

  saving = signal(false);
  CUSTOMER_VALIDATION = CUSTOMER_VALIDATION;

  form: FormGroup = this.fb.group({
    phone: ['', [Validators.required, Validators.maxLength(CUSTOMER_VALIDATION.PHONE_MAX)]],
    name: ['', [Validators.required, Validators.maxLength(CUSTOMER_VALIDATION.NAME_MAX)]],
    email: ['', [Validators.email, Validators.maxLength(CUSTOMER_VALIDATION.EMAIL_MAX)]],
    notes: ['', [Validators.maxLength(CUSTOMER_VALIDATION.NOTES_MAX)]]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
    }
    if (changes['customer'] && this.customer) {
      this.patchForm();
    }
  }

  private resetForm(): void {
    this.form.reset({
      phone: '',
      name: '',
      email: '',
      notes: ''
    });
    this.form.markAsUntouched();
  }

  private patchForm(): void {
    if (this.customer) {
      this.form.patchValue({
        phone: this.customer.phone,
        name: this.customer.name,
        email: this.customer.email || '',
        notes: this.customer.notes || ''
      });
    }
  }

  onVisibleChange(visible: boolean): void {
    if (!visible && this.saving()) {
      return;
    }
    this.visibleChange.emit(visible);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    try {
      const formValue = this.form.value;

      if (this.customer) {
        // Update existing customer
        const updated = await this.customerService.updateCustomer(this.customer.id, {
          phone: formValue.phone,
          name: formValue.name,
          email: formValue.email || null,
          notes: formValue.notes || null
        });

        // Return with stats preserved from original
        this.saved.emit({
          ...updated,
          totalTransactions: this.customer.totalTransactions,
          totalSpent: this.customer.totalSpent,
          lastPurchaseDate: this.customer.lastPurchaseDate
        });
      } else {
        // Create new customer
        const created = await this.customerService.createCustomer({
          phone: formValue.phone,
          name: formValue.name,
          email: formValue.email || null,
          notes: formValue.notes || null
        });

        // New customer has no transactions yet
        this.saved.emit({
          ...created,
          totalTransactions: 0,
          totalSpent: 0,
          lastPurchaseDate: null
        });
      }

      this.visibleChange.emit(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save customer';
      this.toastService.error('Error', message);
      console.error('Failed to save customer:', error);
    } finally {
      this.saving.set(false);
    }
  }
}
