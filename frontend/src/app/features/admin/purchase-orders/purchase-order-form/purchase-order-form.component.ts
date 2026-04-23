import { Component, OnInit, signal, WritableSignal } from '@angular/core';
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
import { TagModule } from 'primeng/tag';
import { AutoCompleteModule, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { SupplierService } from '../../../../core/services/supplier.service';
import { PurchaseOrderService } from '../../../../core/services/purchase-order.service';
import { BrandService } from '../../../../core/services/brand.service';
import { ModelService } from '../../../../core/services/model.service';
import { ProductService } from '../../../../core/services/product.service';
import { InputSanitizationService } from '../../../../core/services/input-sanitization.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Supplier } from '../../../../models/supplier.model';
import { Brand } from '../../../../models/brand.model';
import { PhoneModel } from '../../../../models/phone-model.model';
import { Variant } from '../../../../models/variant.model';
import { PtaStatus, PtaStatusLabels } from '../../../../enums/pta-status.enum';
import { ProductCondition, ProductConditionLabels } from '../../../../enums/product-condition.enum';
import { CreatePurchaseOrderRequest } from '../../../../models/purchase-order.model';
import { PURCHASE_ORDER_CONSTRAINTS } from '../../../../constants/validation.constants';

interface LineItemForm {
  brand: string;
  model: string;
  modelId: string | null;
  quantity: number;
  unitCost: number;
  variantId: string | null;
  storageGb: number | null;
  ptaStatus: string | null;
  condition: string | null;
  color: string | null;
}

interface StorageOption {
  label: string;
  value: number;
}

interface SelectOption {
  label: string;
  value: string;
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
    TagModule,
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
    private modelService: ModelService,
    private productService: ProductService,
    private sanitizer: InputSanitizationService,
    private toastService: ToastService
  ) { }

  suppliers = signal<Supplier[]>([]);
  brands = signal<Brand[]>([]);
  filteredBrands = signal<string[]>([]);
  loading = signal(false);
  totalAmount = signal(0);

  // Per-line-item state maps
  lineItemModels = signal<Map<number, PhoneModel[]>>(new Map());
  lineItemVariants = signal<Map<number, Variant[]>>(new Map());
  lineItemSelectedVariantId = signal<Map<number, string | null>>(new Map());
  lineItemLoadingModels = signal<Map<number, boolean>>(new Map());
  lineItemLoadingVariants = signal<Map<number, boolean>>(new Map());

  // Dropdown options
  storageOptions: StorageOption[] = [
    { label: '32 GB', value: 32 },
    { label: '64 GB', value: 64 },
    { label: '128 GB', value: 128 },
    { label: '256 GB', value: 256 },
    { label: '512 GB', value: 512 },
    { label: '1 TB', value: 1024 }
  ];

  ptaStatusOptions: SelectOption[] = Object.values(PtaStatus).map(value => ({
    label: PtaStatusLabels[value],
    value
  }));

  conditionOptions: SelectOption[] = Object.values(ProductCondition).map(value => ({
    label: ProductConditionLabels[value],
    value
  }));

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

  onBrandSelect(index: number, event: AutoCompleteSelectEvent): void {
    const selectedBrandName = event.value as string;
    const brand = this.brands().find(b => b.name === selectedBrandName);

    // Clear model, variant, and dependent fields
    const itemGroup = this.getLineItemFormGroup(index);
    itemGroup.patchValue({
      model: '',
      modelId: null,
      variantId: null,
      storageGb: null,
      ptaStatus: null,
      condition: null
    });

    // Clear variant state for this line item
    this.updateMapSignal(this.lineItemVariants, index, []);
    this.updateMapSignal(this.lineItemSelectedVariantId, index, null);

    if (brand) {
      this.loadModelsForLineItem(index, brand.id);
    } else {
      this.updateMapSignal(this.lineItemModels, index, []);
    }
  }

  private async loadModelsForLineItem(index: number, brandId: string): Promise<void> {
    this.updateMapSignal(this.lineItemLoadingModels, index, true);
    try {
      const models = await this.modelService.getModelsByBrand(brandId);
      this.updateMapSignal(this.lineItemModels, index, models);
    } catch {
      this.updateMapSignal(this.lineItemModels, index, []);
    } finally {
      this.updateMapSignal(this.lineItemLoadingModels, index, false);
    }
  }

  onModelSelect(index: number, modelId: string): void {
    const itemGroup = this.getLineItemFormGroup(index);
    const models = this.lineItemModels().get(index) || [];
    const selectedModel = models.find(m => m.id === modelId);

    if (selectedModel) {
      itemGroup.patchValue({
        model: selectedModel.name,
        modelId: selectedModel.id
      });
    }

    // Clear variant fields
    itemGroup.patchValue({
      variantId: null,
      storageGb: null,
      ptaStatus: null,
      condition: null
    });
    this.updateMapSignal(this.lineItemSelectedVariantId, index, null);

    if (modelId) {
      this.loadVariantsForLineItem(index, modelId);
    } else {
      this.updateMapSignal(this.lineItemVariants, index, []);
    }
  }

  private async loadVariantsForLineItem(index: number, modelId: string): Promise<void> {
    this.updateMapSignal(this.lineItemLoadingVariants, index, true);
    try {
      const variants = await this.productService.getVariantsForModel(modelId);
      this.updateMapSignal(this.lineItemVariants, index, variants);
    } catch {
      this.updateMapSignal(this.lineItemVariants, index, []);
    } finally {
      this.updateMapSignal(this.lineItemLoadingVariants, index, false);
    }
  }

  onVariantSelect(index: number, variantId: string): void {
    const variants = this.lineItemVariants().get(index) || [];
    const variant = variants.find(v => v.id === variantId);

    if (variant) {
      const itemGroup = this.getLineItemFormGroup(index);
      itemGroup.patchValue({
        variantId: variant.id,
        storageGb: variant.storageGb,
        ptaStatus: variant.ptaStatus,
        condition: variant.condition
      });
      this.updateMapSignal(this.lineItemSelectedVariantId, index, variant.id);
    }
  }

  clearVariantSelection(index: number): void {
    const itemGroup = this.getLineItemFormGroup(index);
    itemGroup.patchValue({
      variantId: null,
      storageGb: null,
      ptaStatus: null,
      condition: null
    });
    this.updateMapSignal(this.lineItemSelectedVariantId, index, null);
  }

  getVariantLabel(variant: Variant): string {
    const parts: string[] = [];
    if (variant.storageGb) parts.push(`${variant.storageGb}GB`);
    if (variant.ptaStatus) {
      const label = PtaStatusLabels[variant.ptaStatus as PtaStatus] || variant.ptaStatus;
      parts.push(label);
    }
    if (variant.condition) {
      const label = ProductConditionLabels[variant.condition as ProductCondition] || variant.condition;
      parts.push(label);
    }
    return parts.join(' / ') || 'Unknown variant';
  }

  getModelsForLineItem(index: number): PhoneModel[] {
    return this.lineItemModels().get(index) || [];
  }

  getModelOptionsForLineItem(index: number): { label: string; value: string }[] {
    return this.getModelsForLineItem(index).map(m => ({ label: m.name, value: m.id }));
  }

  getVariantsForLineItem(index: number): Variant[] {
    return this.lineItemVariants().get(index) || [];
  }

  getSelectedVariantId(index: number): string | null {
    return this.lineItemSelectedVariantId().get(index) || null;
  }

  isLoadingModels(index: number): boolean {
    return this.lineItemLoadingModels().get(index) || false;
  }

  isLoadingVariants(index: number): boolean {
    return this.lineItemLoadingVariants().get(index) || false;
  }

  hasModelsLoaded(index: number): boolean {
    return this.lineItemModels().has(index);
  }

  /**
   * Helper to update a Map-based signal immutably.
   */
  private updateMapSignal<T>(sig: WritableSignal<Map<number, T>>, index: number, value: T): void {
    const newMap = new Map(sig());
    newMap.set(index, value);
    sig.set(newMap);
  }

  /**
   * Clean up per-line-item state maps when a line item is removed.
   * Re-indexes remaining entries to keep keys contiguous.
   */
  private reindexMapSignal<T>(sig: WritableSignal<Map<number, T>>): void {
    const oldMap = sig();
    const entries: [number, T][] = Array.from(oldMap.entries()).sort((a, b) => a[0] - b[0]);
    const newMap = new Map<number, T>();
    entries.forEach((entry, newIndex) => {
      newMap.set(newIndex, entry[1]);
    });
    sig.set(newMap);
  }

  getLineItemFormGroup(index: number): FormGroup {
    return this.lineItems.at(index) as FormGroup;
  }

  addLineItem(): void {
    const itemGroup = this.fb.group({
      brand: ['', [Validators.required, Validators.maxLength(this.constraints.ITEM_BRAND_MAX)]],
      model: ['', [Validators.required, Validators.maxLength(this.constraints.ITEM_MODEL_MAX)]],
      modelId: [null as string | null],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitCost: [0, [Validators.required, Validators.min(0)]],
      variantId: [null as string | null],
      storageGb: [null as number | null],
      ptaStatus: [null as string | null],
      condition: [null as string | null],
      color: [null as string | null]
    });

    itemGroup.valueChanges.subscribe(() => this.recalculateTotal());
    this.lineItems.push(itemGroup);
    this.recalculateTotal();
  }

  removeLineItem(index: number): void {
    this.lineItems.removeAt(index);
    // Clean up per-line-item state maps
    this.reindexMapSignal(this.lineItemModels);
    this.reindexMapSignal(this.lineItemVariants);
    this.reindexMapSignal(this.lineItemSelectedVariantId);
    this.reindexMapSignal(this.lineItemLoadingModels);
    this.reindexMapSignal(this.lineItemLoadingVariants);
    this.recalculateTotal();
  }

  duplicateLineItem(index: number): void {
    const sourceItem = this.lineItems.at(index);
    if (!sourceItem) return;

    const itemGroup = this.fb.group({
      brand: [sourceItem.get('brand')?.value || '', [Validators.required, Validators.maxLength(this.constraints.ITEM_BRAND_MAX)]],
      model: [sourceItem.get('model')?.value || '', [Validators.required, Validators.maxLength(this.constraints.ITEM_MODEL_MAX)]],
      modelId: [sourceItem.get('modelId')?.value || null],
      quantity: [sourceItem.get('quantity')?.value || 1, [Validators.required, Validators.min(1)]],
      unitCost: [sourceItem.get('unitCost')?.value || 0, [Validators.required, Validators.min(0)]],
      variantId: [sourceItem.get('variantId')?.value || null],
      storageGb: [sourceItem.get('storageGb')?.value || null],
      ptaStatus: [sourceItem.get('ptaStatus')?.value || null],
      condition: [sourceItem.get('condition')?.value || null],
      color: [sourceItem.get('color')?.value || null]
    });

    itemGroup.valueChanges.subscribe(() => this.recalculateTotal());
    this.lineItems.insert(index + 1, itemGroup);

    // Copy per-line-item state maps for the duplicated item
    // Shift all entries after index+1 by 1, then copy source state to index+1
    this.shiftMapEntriesAfter(index, this.lineItemModels);
    this.shiftMapEntriesAfter(index, this.lineItemVariants);
    this.shiftMapEntriesAfter(index, this.lineItemSelectedVariantId);
    this.shiftMapEntriesAfter(index, this.lineItemLoadingModels);
    this.shiftMapEntriesAfter(index, this.lineItemLoadingVariants);

    this.recalculateTotal();
    this.toastService.info('Item Duplicated', `Line item #${index + 1} duplicated`);
  }

  /**
   * After duplicating at index, shift all map entries with key > index up by 1,
   * then copy the state from index to index+1.
   */
  private shiftMapEntriesAfter<T>(afterIndex: number, sig: WritableSignal<Map<number, T>>): void {
    const oldMap = sig();
    const entries: [number, T][] = Array.from(oldMap.entries()).sort((a, b) => b[0] - a[0]); // descending
    const newMap = new Map<number, T>();

    for (const [key, value] of entries) {
      if (key > afterIndex) {
        newMap.set(key + 1, value);
      } else if (key === afterIndex) {
        newMap.set(key, value);
        newMap.set(key + 1, value); // duplicate
      } else {
        newMap.set(key, value);
      }
    }
    sig.set(newMap);
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
          unitCost: item.unitCost,
          variantId: item.variantId || null,
          storageGb: item.storageGb ?? null,
          ptaStatus: item.ptaStatus ?? null,
          condition: item.condition ?? null,
          color: this.sanitizer.sanitizeOrNull(item.color)
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
