import { Component, OnInit, inject, signal } from '@angular/core';
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
  template: `
    <div class="grid">
      <div class="col-12 flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between gap-3 mb-4">
        <h1 class="text-3xl font-bold m-0">{{ isEditMode() ? 'Edit Supplier' : 'Add Supplier' }}</h1>
        <p-button
          label="Back to Suppliers"
          icon="pi pi-arrow-left"
          [outlined]="true"
          (onClick)="goBack()"
          styleClass="w-full sm:w-auto" />
      </div>

      @if (pageLoading()) {
        <div class="col-12">
          <p-card>
            <div class="grid">
              <div class="col-12 md:col-6">
                <p-skeleton width="30%" height="1rem" styleClass="mb-2" />
                <p-skeleton width="100%" height="2.5rem" />
              </div>
              <div class="col-12 md:col-6">
                <p-skeleton width="30%" height="1rem" styleClass="mb-2" />
                <p-skeleton width="100%" height="2.5rem" />
              </div>
              <div class="col-12 md:col-6">
                <p-skeleton width="30%" height="1rem" styleClass="mb-2" />
                <p-skeleton width="100%" height="2.5rem" />
              </div>
              <div class="col-12 md:col-6">
                <p-skeleton width="30%" height="1rem" styleClass="mb-2" />
                <p-skeleton width="100%" height="2.5rem" />
              </div>
              <div class="col-12">
                <p-skeleton width="20%" height="1rem" styleClass="mb-2" />
                <p-skeleton width="100%" height="4rem" />
              </div>
              <div class="col-12">
                <p-skeleton width="20%" height="1rem" styleClass="mb-2" />
                <p-skeleton width="100%" height="4rem" />
              </div>
            </div>
          </p-card>
        </div>
      } @else {
        <div class="col-12">
          <p-card>
            <form [formGroup]="supplierForm" (ngSubmit)="onSubmit()">
              <div class="grid">
                <div class="col-12 md:col-6 field">
                  <label for="name" class="font-semibold block mb-2">
                    Name <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    pInputText
                    formControlName="name"
                    class="w-full"
                    [maxlength]="constraints.NAME_MAX"
                    placeholder="Enter supplier name" />
                  @if (supplierForm.get('name')?.invalid && supplierForm.get('name')?.touched) {
                    <small class="p-error block mt-1">Supplier name is required</small>
                  }
                </div>

                <div class="col-12 md:col-6 field">
                  <label for="contactPerson" class="font-semibold block mb-2">Contact Person</label>
                  <input
                    id="contactPerson"
                    type="text"
                    pInputText
                    formControlName="contactPerson"
                    class="w-full"
                    [maxlength]="constraints.CONTACT_PERSON_MAX"
                    placeholder="Enter contact person name" />
                </div>

                <div class="col-12 md:col-6 field">
                  <label for="contactEmail" class="font-semibold block mb-2">Email</label>
                  <input
                    id="contactEmail"
                    type="email"
                    pInputText
                    formControlName="contactEmail"
                    class="w-full"
                    [maxlength]="constraints.CONTACT_EMAIL_MAX"
                    placeholder="Enter email address" />
                  @if (supplierForm.get('contactEmail')?.invalid && supplierForm.get('contactEmail')?.touched) {
                    <small class="p-error block mt-1">Please enter a valid email address</small>
                  }
                </div>

                <div class="col-12 md:col-6 field">
                  <label for="contactPhone" class="font-semibold block mb-2">Phone</label>
                  <input
                    id="contactPhone"
                    type="tel"
                    pInputText
                    formControlName="contactPhone"
                    class="w-full"
                    [maxlength]="constraints.CONTACT_PHONE_MAX"
                    placeholder="Enter phone number" />
                </div>

                <div class="col-12 field">
                  <div class="flex justify-content-between align-items-center mb-2">
                    <label for="address" class="font-semibold">Address</label>
                    <small class="text-color-secondary">
                      {{ supplierForm.get('address')?.value?.length || 0 }}/{{ constraints.ADDRESS_MAX }}
                    </small>
                  </div>
                  <textarea
                    id="address"
                    pTextarea
                    formControlName="address"
                    class="w-full"
                    rows="3"
                    [maxlength]="constraints.ADDRESS_MAX"
                    placeholder="Enter supplier address"
                    aria-describedby="address-count"></textarea>
                </div>

                <div class="col-12 field">
                  <div class="flex justify-content-between align-items-center mb-2">
                    <label for="notes" class="font-semibold">Notes</label>
                    <small class="text-color-secondary">
                      {{ supplierForm.get('notes')?.value?.length || 0 }}/{{ constraints.NOTES_MAX }}
                    </small>
                  </div>
                  <textarea
                    id="notes"
                    pTextarea
                    formControlName="notes"
                    class="w-full"
                    rows="3"
                    [maxlength]="constraints.NOTES_MAX"
                    placeholder="Additional notes about the supplier"
                    aria-describedby="notes-count"></textarea>
                </div>

                <div class="col-12 flex justify-content-end gap-2 mt-4">
                  <p-button
                    label="Cancel"
                    [outlined]="true"
                    severity="secondary"
                    (onClick)="goBack()" />
                  <p-button
                    [label]="isEditMode() ? 'Update Supplier' : 'Create Supplier'"
                    icon="pi pi-check"
                    type="submit"
                    [loading]="saving()"
                    [disabled]="supplierForm.invalid || saving()" />
                </div>
              </div>
            </form>
          </p-card>
        </div>

        @if (isEditMode()) {
          <div class="col-12 mt-4">
            <p-card>
              <ng-template #header>
                <div class="flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between gap-2 p-3 pb-0">
                  <h2 class="text-xl font-semibold m-0">Purchase Order History</h2>
                  <p-button
                    label="New Purchase Order"
                    icon="pi pi-plus"
                    size="small"
                    routerLink="/admin/purchase-orders/new"
                    [queryParams]="{ supplierId: supplierId }"
                    styleClass="w-full sm:w-auto" />
                </div>
              </ng-template>

              @if (purchaseOrdersLoading()) {
                <div class="flex align-items-center justify-content-center p-4">
                  <i class="pi pi-spin pi-spinner text-2xl"></i>
                </div>
              } @else if (purchaseOrders().length === 0) {
                <div class="flex flex-column align-items-center gap-3 p-4">
                  <i class="pi pi-shopping-cart text-4xl text-color-secondary"></i>
                  <span class="text-color-secondary">No purchase orders found for this supplier</span>
                  <p-button
                    label="Create First Purchase Order"
                    icon="pi pi-plus"
                    [outlined]="true"
                    routerLink="/admin/purchase-orders/new"
                    [queryParams]="{ supplierId: supplierId }" />
                </div>
              } @else {
                <p-table
                  [value]="purchaseOrders()"
                  [paginator]="purchaseOrders().length > 5"
                  [rows]="5"
                  [rowsPerPageOptions]="[5, 10, 25]"
                  [showCurrentPageReport]="true"
                  currentPageReportTemplate="Showing {first} to {last} of {totalRecords} orders"
                  [rowHover]="true"
                  dataKey="id"
                  styleClass="p-datatable-sm"
                  [scrollable]="true"
                  scrollDirection="horizontal"
                  [tableStyle]="{ 'min-width': '45rem' }"
                >
                  <ng-template #header>
                    <tr>
                      <th pSortableColumn="poNumber">
                        PO Number
                        <p-sortIcon field="poNumber" />
                      </th>
                      <th pSortableColumn="orderDate">
                        Order Date
                        <p-sortIcon field="orderDate" />
                      </th>
                      <th pSortableColumn="totalAmount">
                        Total Amount
                        <p-sortIcon field="totalAmount" />
                      </th>
                      <th>Items</th>
                      <th pSortableColumn="status">
                        Status
                        <p-sortIcon field="status" />
                      </th>
                      <th style="width: 5rem">Actions</th>
                    </tr>
                  </ng-template>

                  <ng-template #body let-po>
                    <tr>
                      <td>
                        <span class="font-medium">{{ po.poNumber }}</span>
                      </td>
                      <td>{{ po.orderDate | date:'mediumDate' }}</td>
                      <td>{{ po.totalAmount | currency }}</td>
                      <td>{{ po.items.length }} item(s)</td>
                      <td>
                        <p-tag
                          [value]="getStatusLabel(po.status)"
                          [severity]="getStatusSeverity(po.status)"
                        />
                      </td>
                      <td>
                        <p-button
                          icon="pi pi-eye"
                          [rounded]="true"
                          [text]="true"
                          severity="info"
                          size="small"
                          pTooltip="View Details"
                          tooltipPosition="top"
                          [routerLink]="['/admin/purchase-orders', po.id]"
                        />
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              }
            </p-card>
          </div>
        }
      }
    </div>
  `
})
export class SupplierFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly supplierService = inject(SupplierService);
  private readonly sanitizer = inject(InputSanitizationService);
  readonly loading = inject(LoadingService);

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
