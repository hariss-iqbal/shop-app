import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';

import { SupplierService } from '../../../../core/services/supplier.service';
import { InputSanitizationService } from '../../../../core/services/input-sanitization.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { PurchaseOrder } from '../../../../models/purchase-order.model';
import {
  PurchaseOrderStatus,
  PurchaseOrderStatusLabels,
  PurchaseOrderStatusColors
} from '../../../../enums/purchase-order-status.enum';
import { SUPPLIER_CONSTRAINTS } from '../../../../constants/validation.constants';

@Component({
  selector: 'app-supplier-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    TableModule,
    TagModule,
    DividerModule,
    TooltipModule,
    ProgressSpinnerModule,
    SkeletonModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './supplier-form.component.html'
})
export class SupplierFormComponent implements OnInit {
  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toast: ToastService,
    private readonly supplierService: SupplierService,
    private readonly sanitizer: InputSanitizationService,
    public readonly loading: LoadingService
  ) { }

  readonly isEditMode = signal(false);
  readonly pageLoading = signal(false);
  readonly saving = signal(false);
  readonly purchaseOrdersLoading = signal(false);
  readonly purchaseOrders = signal<PurchaseOrder[]>([]);

  /** Validation constraints for supplier form fields (F-058: Input Sanitization) */
  readonly constraints = SUPPLIER_CONSTRAINTS;

  supplierId: string | null = null;

  supplierForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(this.constraints.NAME_MAX)]],
    contactPerson: ['', Validators.maxLength(this.constraints.CONTACT_PERSON_MAX)],
    contactEmail: ['', [Validators.email, Validators.maxLength(this.constraints.CONTACT_EMAIL_MAX)]],
    contactPhone: ['', Validators.maxLength(this.constraints.CONTACT_PHONE_MAX)],
    address: ['', Validators.maxLength(this.constraints.ADDRESS_MAX)],
    notes: ['', Validators.maxLength(this.constraints.NOTES_MAX)]
  });

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id');
    if (this.supplierId) {
      this.isEditMode.set(true);
      this.loadSupplier();
      this.loadPurchaseOrders();
    }
  }

  private async loadSupplier(): Promise<void> {
    if (!this.supplierId) return;

    this.pageLoading.set(true);

    try {
      const supplier = await this.supplierService.getSupplierById(this.supplierId);

      if (!supplier) {
        this.toast.error('Not Found', 'Supplier not found');
        this.router.navigate(['/admin/suppliers']);
        return;
      }

      this.supplierForm.patchValue({
        name: supplier.name,
        contactPerson: supplier.contactPerson || '',
        contactEmail: supplier.contactEmail || '',
        contactPhone: supplier.contactPhone || '',
        address: supplier.address || '',
        notes: supplier.notes || ''
      });
    } catch (error) {
      this.toast.error('Error', 'Failed to load supplier');
      console.error('Failed to load supplier:', error);
      this.router.navigate(['/admin/suppliers']);
    } finally {
      this.pageLoading.set(false);
    }
  }

  private async loadPurchaseOrders(): Promise<void> {
    if (!this.supplierId) return;

    this.purchaseOrdersLoading.set(true);

    try {
      const orders = await this.supplierService.getPurchaseOrdersForSupplier(this.supplierId);
      this.purchaseOrders.set(orders);
    } catch (error) {
      console.error('Failed to load purchase orders:', error);
    } finally {
      this.purchaseOrdersLoading.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    try {
      const formData = this.supplierForm.value;

      if (this.isEditMode() && this.supplierId) {
        await this.supplierService.updateSupplier(this.supplierId, {
          name: this.sanitizer.sanitize(formData.name),
          contactPerson: this.sanitizer.sanitizeOrNull(formData.contactPerson),
          contactEmail: formData.contactEmail?.trim() || null,
          contactPhone: this.sanitizer.sanitizeOrNull(formData.contactPhone),
          address: this.sanitizer.sanitizeOrNull(formData.address),
          notes: this.sanitizer.sanitizeOrNull(formData.notes)
        });
        this.toast.success('Success', 'Supplier updated successfully');
      } else {
        await this.supplierService.createSupplier({
          name: this.sanitizer.sanitize(formData.name),
          contactPerson: this.sanitizer.sanitizeOrNull(formData.contactPerson),
          contactEmail: formData.contactEmail?.trim() || null,
          contactPhone: this.sanitizer.sanitizeOrNull(formData.contactPhone),
          address: this.sanitizer.sanitizeOrNull(formData.address),
          notes: this.sanitizer.sanitizeOrNull(formData.notes)
        });
        this.toast.success('Success', 'Supplier created successfully');
      }

      this.router.navigate(['/admin/suppliers']);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save supplier';
      this.toast.error('Error', errorMessage);
      console.error('Failed to save supplier:', error);
    } finally {
      this.saving.set(false);
    }
  }

  getStatusLabel(status: PurchaseOrderStatus): string {
    return PurchaseOrderStatusLabels[status];
  }

  getStatusSeverity(status: PurchaseOrderStatus): 'success' | 'danger' | 'warn' | 'info' | 'secondary' | 'contrast' | undefined {
    const colorMap: Record<string, 'success' | 'danger' | 'warn'> = {
      success: 'success',
      danger: 'danger',
      warning: 'warn'
    };
    return colorMap[PurchaseOrderStatusColors[status]];
  }

  goBack(): void {
    this.router.navigate(['/admin/suppliers']);
  }
}
