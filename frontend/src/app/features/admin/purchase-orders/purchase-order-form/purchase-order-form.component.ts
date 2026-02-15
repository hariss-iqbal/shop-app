import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
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
    AutoCompleteModule,
    AppCurrencyPipe
  ],
  templateUrl: './purchase-order-form.component.html',
  styleUrls: ['./purchase-order-form.component.scss']
})
export class PurchaseOrderFormComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private supplierService: SupplierService,
    private purchaseOrderService: PurchaseOrderService,
    private brandService: BrandService,
    private sanitizer: InputSanitizationService,
    private toastService: ToastService
  ) { }

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
