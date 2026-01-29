import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { SupplierService } from '../../../../core/services/supplier.service';
import { PurchaseOrderService } from '../../../../core/services/purchase-order.service';
import { BrandService } from '../../../../core/services/brand.service';
import { InputSanitizationService } from '../../../../core/services/input-sanitization.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Supplier } from '../../../../models/supplier.model';
import { Brand } from '../../../../models/brand.model';
import { CreatePurchaseOrderRequest } from '../../../../models/purchase-order.model';
import { PURCHASE_ORDER_CONSTRAINTS } from '../../../../constants/validation.constants';

interface LineItemForm {
  brand: string;
  model: string;
  quantity: number;
  unitCost: number;
}

@Component({
  selector: 'app-purchase-order-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    TableModule,
    TooltipModule,
    DividerModule,
    AutoCompleteModule
  ],
  template: `
    <div class="grid">
      <div class="col-12">
        <div class="flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between gap-3 mb-4">
          <h1 class="text-3xl font-bold m-0">New Purchase Order</h1>
          <p-button
            label="Back to List"
            icon="pi pi-arrow-left"
            severity="secondary"
            [text]="true"
            (onClick)="navigateBack()"
            styleClass="w-full sm:w-auto"
          />
        </div>
      </div>

      <div class="col-12">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <p-card>
            <ng-template pTemplate="header">
              <div class="p-3 pb-0">
                <span class="text-xl font-semibold">Order Details</span>
              </div>
            </ng-template>

            <div class="grid">
              <div class="col-12 md:col-6">
                <label for="supplierId" class="block font-medium mb-2">
                  Supplier <span class="text-red-500">*</span>
                </label>
                <p-select
                  id="supplierId"
                  formControlName="supplierId"
                  [options]="suppliers()"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Select a supplier"
                  styleClass="w-full"
                  [filter]="true"
                  filterPlaceholder="Search suppliers..."
                  [showClear]="true"
                />
                @if (form.get('supplierId')?.invalid && form.get('supplierId')?.touched) {
                  <small class="text-red-500">Supplier is required</small>
                }
              </div>

              <div class="col-12 md:col-6">
                <label for="orderDate" class="block font-medium mb-2">
                  Order Date <span class="text-red-500">*</span>
                </label>
                <p-datepicker
                  id="orderDate"
                  formControlName="orderDate"
                  [showIcon]="true"
                  dateFormat="yy-mm-dd"
                  styleClass="w-full"
                  placeholder="Select order date"
                />
                @if (form.get('orderDate')?.invalid && form.get('orderDate')?.touched) {
                  <small class="text-red-500">Order date is required</small>
                }
              </div>

              <div class="col-12">
                <label for="notes" class="block font-medium mb-2">Notes</label>
                <textarea
                  pInputTextarea
                  id="notes"
                  formControlName="notes"
                  rows="3"
                  class="w-full"
                  placeholder="Optional notes for this purchase order..."
                  [maxlength]="2000"
                ></textarea>
                <small class="text-color-secondary">{{ form.get('notes')?.value?.length || 0 }} / 2000</small>
              </div>
            </div>
          </p-card>

          <p-card styleClass="mt-4">
            <ng-template pTemplate="header">
              <div class="p-3 pb-0 flex align-items-center justify-content-between">
                <span class="text-xl font-semibold">Line Items</span>
                <p-button
                  label="Add Item"
                  icon="pi pi-plus"
                  severity="success"
                  [outlined]="true"
                  size="small"
                  (onClick)="addLineItem()"
                />
              </div>
            </ng-template>

            @if (lineItems.length === 0) {
              <div class="text-center py-5">
                <i class="pi pi-inbox text-4xl text-color-secondary mb-3"></i>
                <p class="text-color-secondary m-0">No line items added yet. Click "Add Item" to begin.</p>
              </div>
            } @else {
              <!-- Desktop table view -->
              <div class="hidden md:block">
                <p-table [value]="lineItemsArray" [scrollable]="true" scrollDirection="horizontal" [tableStyle]="{ 'min-width': '60rem' }">
                  <ng-template pTemplate="header">
                    <tr>
                      <th style="width: 5%">#</th>
                      <th style="width: 18%">Brand <span class="text-red-500">*</span></th>
                      <th style="width: 22%">Model <span class="text-red-500">*</span></th>
                      <th style="width: 13%">Quantity <span class="text-red-500">*</span></th>
                      <th style="width: 15%">Unit Cost <span class="text-red-500">*</span></th>
                      <th style="width: 12%">Line Total</th>
                      <th style="width: 15%">Actions</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-item let-i="rowIndex">
                    <tr [formGroup]="getLineItemFormGroup(i)">
                      <td class="font-semibold">{{ i + 1 }}</td>
                      <td>
                        <p-autoComplete
                          formControlName="brand"
                          [suggestions]="filteredBrands()"
                          (completeMethod)="searchBrands($event)"
                          [dropdown]="true"
                          [forceSelection]="false"
                          placeholder="Select or type brand"
                          styleClass="w-full"
                          inputStyleClass="w-full"
                          [maxlength]="100"
                          appendTo="body"
                        />
                        @if (getLineItemFormGroup(i).get('brand')?.invalid && getLineItemFormGroup(i).get('brand')?.touched) {
                          <small class="text-red-500 block mt-1">Required</small>
                        }
                      </td>
                      <td>
                        <input
                          pInputText
                          formControlName="model"
                          class="w-full"
                          placeholder="Model name"
                          [maxlength]="150"
                        />
                        @if (getLineItemFormGroup(i).get('model')?.invalid && getLineItemFormGroup(i).get('model')?.touched) {
                          <small class="text-red-500 block mt-1">Required</small>
                        }
                      </td>
                      <td>
                        <p-inputNumber
                          formControlName="quantity"
                          [min]="1"
                          [showButtons]="true"
                          buttonLayout="horizontal"
                          spinnerMode="horizontal"
                          decrementButtonClass="p-button-secondary"
                          incrementButtonClass="p-button-secondary"
                          incrementButtonIcon="pi pi-plus"
                          decrementButtonIcon="pi pi-minus"
                          styleClass="w-full"
                        />
                        @if (getLineItemFormGroup(i).get('quantity')?.invalid && getLineItemFormGroup(i).get('quantity')?.touched) {
                          <small class="text-red-500 block mt-1">Min: 1</small>
                        }
                      </td>
                      <td>
                        <p-inputNumber
                          formControlName="unitCost"
                          mode="currency"
                          currency="USD"
                          locale="en-US"
                          [min]="0"
                          styleClass="w-full"
                        />
                        @if (getLineItemFormGroup(i).get('unitCost')?.invalid && getLineItemFormGroup(i).get('unitCost')?.touched) {
                          <small class="text-red-500 block mt-1">Required</small>
                        }
                      </td>
                      <td>
                        <span class="font-semibold text-primary">
                          {{ calculateLineTotal(i) | currency:'USD':'symbol':'1.2-2' }}
                        </span>
                      </td>
                      <td>
                        <div class="flex align-items-center gap-1">
                          <p-button
                            icon="pi pi-copy"
                            severity="secondary"
                            [text]="true"
                            [rounded]="true"
                            pTooltip="Duplicate item"
                            tooltipPosition="top"
                            (onClick)="duplicateLineItem(i)"
                          />
                          <p-button
                            icon="pi pi-trash"
                            severity="danger"
                            [text]="true"
                            [rounded]="true"
                            pTooltip="Remove item"
                            tooltipPosition="top"
                            (onClick)="removeLineItem(i)"
                          />
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>

              <!-- Mobile card view -->
              <div class="block md:hidden">
                @for (item of lineItemsArray; track $index; let i = $index) {
                  <div class="surface-50 border-round p-3 mb-3" [formGroup]="getLineItemFormGroup(i)">
                    <div class="flex justify-content-between align-items-center mb-3">
                      <span class="font-bold text-primary">Item #{{ i + 1 }}</span>
                      <div class="flex gap-1">
                        <p-button
                          icon="pi pi-copy"
                          severity="secondary"
                          [text]="true"
                          [rounded]="true"
                          size="small"
                          pTooltip="Duplicate"
                          (onClick)="duplicateLineItem(i)"
                        />
                        <p-button
                          icon="pi pi-trash"
                          severity="danger"
                          [text]="true"
                          [rounded]="true"
                          size="small"
                          pTooltip="Remove"
                          (onClick)="removeLineItem(i)"
                        />
                      </div>
                    </div>

                    <div class="grid">
                      <div class="col-12">
                        <label class="block text-color-secondary text-sm mb-1">Brand <span class="text-red-500">*</span></label>
                        <p-autoComplete
                          formControlName="brand"
                          [suggestions]="filteredBrands()"
                          (completeMethod)="searchBrands($event)"
                          [dropdown]="true"
                          [forceSelection]="false"
                          placeholder="Select or type brand"
                          styleClass="w-full"
                          inputStyleClass="w-full"
                          [maxlength]="100"
                          appendTo="body"
                        />
                        @if (getLineItemFormGroup(i).get('brand')?.invalid && getLineItemFormGroup(i).get('brand')?.touched) {
                          <small class="text-red-500">Required</small>
                        }
                      </div>

                      <div class="col-12">
                        <label class="block text-color-secondary text-sm mb-1">Model <span class="text-red-500">*</span></label>
                        <input
                          pInputText
                          formControlName="model"
                          class="w-full"
                          placeholder="Model name"
                          [maxlength]="150"
                        />
                        @if (getLineItemFormGroup(i).get('model')?.invalid && getLineItemFormGroup(i).get('model')?.touched) {
                          <small class="text-red-500">Required</small>
                        }
                      </div>

                      <div class="col-6">
                        <label class="block text-color-secondary text-sm mb-1">Quantity <span class="text-red-500">*</span></label>
                        <p-inputNumber
                          formControlName="quantity"
                          [min]="1"
                          [showButtons]="true"
                          buttonLayout="horizontal"
                          spinnerMode="horizontal"
                          decrementButtonClass="p-button-secondary"
                          incrementButtonClass="p-button-secondary"
                          incrementButtonIcon="pi pi-plus"
                          decrementButtonIcon="pi pi-minus"
                          styleClass="w-full"
                        />
                      </div>

                      <div class="col-6">
                        <label class="block text-color-secondary text-sm mb-1">Unit Cost <span class="text-red-500">*</span></label>
                        <p-inputNumber
                          formControlName="unitCost"
                          mode="currency"
                          currency="USD"
                          locale="en-US"
                          [min]="0"
                          styleClass="w-full"
                        />
                      </div>

                      <div class="col-12">
                        <div class="flex justify-content-between align-items-center pt-2 border-top-1 surface-border">
                          <span class="text-color-secondary">Line Total:</span>
                          <span class="text-xl font-bold text-primary">
                            {{ calculateLineTotal(i) | currency:'USD':'symbol':'1.2-2' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <p-divider />

              <div class="flex justify-content-end">
                <div class="text-right">
                  <span class="text-color-secondary mr-3">Total Amount:</span>
                  <span class="text-2xl font-bold text-primary">
                    {{ totalAmount() | currency:'USD':'symbol':'1.2-2' }}
                  </span>
                </div>
              </div>
            }

            @if (form.get('items')?.invalid && form.get('items')?.touched) {
              <div class="mt-3">
                <small class="text-red-500">At least one line item is required</small>
              </div>
            }
          </p-card>

          <div class="flex justify-content-end gap-2 mt-4">
            <p-button
              label="Cancel"
              severity="secondary"
              [outlined]="true"
              (onClick)="navigateBack()"
            />
            <p-button
              label="Create Purchase Order"
              icon="pi pi-check"
              type="submit"
              [loading]="loading()"
              [disabled]="form.invalid || lineItems.length === 0"
            />
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class PurchaseOrderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private supplierService = inject(SupplierService);
  private purchaseOrderService = inject(PurchaseOrderService);
  private brandService = inject(BrandService);
  private sanitizer = inject(InputSanitizationService);
  private toastService = inject(ToastService);

  suppliers = signal<Supplier[]>([]);
  brands = signal<Brand[]>([]);
  filteredBrands = signal<string[]>([]);
  loading = signal(false);
  totalAmount = signal(0);

  /** Validation constraints for purchase order form fields (F-058: Input Sanitization) */
  readonly constraints = PURCHASE_ORDER_CONSTRAINTS;

  form = this.fb.group({
    supplierId: ['', Validators.required],
    orderDate: [new Date(), Validators.required],
    notes: ['', Validators.maxLength(this.constraints.NOTES_MAX)],
    items: this.fb.array<FormGroup>([], [Validators.required, Validators.minLength(1)])
  });

  get lineItems(): FormArray {
    return this.form.get('items') as FormArray;
  }

  get lineItemsArray(): LineItemForm[] {
    return this.lineItems.controls.map(control => control.value as LineItemForm);
  }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    try {
      const [suppliersResponse, brandsData] = await Promise.all([
        this.supplierService.getSuppliers(),
        this.brandService.getBrands()
      ]);
      this.suppliers.set(suppliersResponse.data);
      this.brands.set(brandsData);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load form data');
    }
  }

  searchBrands(event: AutoCompleteCompleteEvent): void {
    const query = event.query.toLowerCase();
    const brandNames = this.brands().map(b => b.name);

    if (!query) {
      this.filteredBrands.set(brandNames);
    } else {
      this.filteredBrands.set(
        brandNames.filter(name => name.toLowerCase().includes(query))
      );
    }
  }

  getLineItemFormGroup(index: number): FormGroup {
    return this.lineItems.at(index) as FormGroup;
  }

  addLineItem(): void {
    const itemGroup = this.fb.group({
      brand: ['', [Validators.required, Validators.maxLength(this.constraints.ITEM_BRAND_MAX)]],
      model: ['', [Validators.required, Validators.maxLength(this.constraints.ITEM_MODEL_MAX)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitCost: [0, [Validators.required, Validators.min(0)]]
    });

    itemGroup.valueChanges.subscribe(() => this.recalculateTotal());
    this.lineItems.push(itemGroup);
    this.recalculateTotal();
  }

  removeLineItem(index: number): void {
    this.lineItems.removeAt(index);
    this.recalculateTotal();
  }

  duplicateLineItem(index: number): void {
    const sourceItem = this.lineItems.at(index);
    if (!sourceItem) return;

    const itemGroup = this.fb.group({
      brand: [sourceItem.get('brand')?.value || '', [Validators.required, Validators.maxLength(this.constraints.ITEM_BRAND_MAX)]],
      model: [sourceItem.get('model')?.value || '', [Validators.required, Validators.maxLength(this.constraints.ITEM_MODEL_MAX)]],
      quantity: [sourceItem.get('quantity')?.value || 1, [Validators.required, Validators.min(1)]],
      unitCost: [sourceItem.get('unitCost')?.value || 0, [Validators.required, Validators.min(0)]]
    });

    itemGroup.valueChanges.subscribe(() => this.recalculateTotal());
    this.lineItems.insert(index + 1, itemGroup);
    this.recalculateTotal();
    this.toastService.info('Item Duplicated', `Line item #${index + 1} duplicated`);
  }

  calculateLineTotal(index: number): number {
    const item = this.lineItems.at(index);
    if (!item) return 0;

    const quantity = item.get('quantity')?.value || 0;
    const unitCost = item.get('unitCost')?.value || 0;
    return quantity * unitCost;
  }

  private recalculateTotal(): void {
    let total = 0;
    for (let i = 0; i < this.lineItems.length; i++) {
      total += this.calculateLineTotal(i);
    }
    this.totalAmount.set(total);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.lineItems.length === 0) {
      this.form.markAllAsTouched();
      this.lineItems.controls.forEach(control => control.markAllAsTouched());

      if (this.lineItems.length === 0) {
        this.toastService.warn('Validation Error', 'At least one line item is required');
      }
      return;
    }

    this.loading.set(true);

    try {
      const formValue = this.form.value;
      const orderDate = formValue.orderDate as Date;

      const request: CreatePurchaseOrderRequest = {
        supplierId: formValue.supplierId!,
        orderDate: this.formatDate(orderDate),
        notes: this.sanitizer.sanitizeOrNull(formValue.notes),
        items: formValue.items!.map((item: LineItemForm) => ({
          brand: this.sanitizer.sanitize(item.brand),
          model: this.sanitizer.sanitize(item.model),
          quantity: item.quantity,
          unitCost: item.unitCost
        }))
      };

      const createdPO = await this.purchaseOrderService.createPurchaseOrder(request);
      this.toastService.success('Success', `Purchase order ${createdPO.poNumber} created successfully`);
      this.router.navigate(['/admin/purchase-orders']);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create purchase order';
      this.toastService.error('Error', message);
    } finally {
      this.loading.set(false);
    }
  }

  navigateBack(): void {
    this.router.navigate(['/admin/purchase-orders']);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
