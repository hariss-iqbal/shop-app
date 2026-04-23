import { Component, OnInit, signal, computed, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Accordion, AccordionPanel, AccordionHeader, AccordionContent } from 'primeng/accordion';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { PurchaseOrderService } from '../../../../core/services/purchase-order.service';
import { ProductService } from '../../../../core/services/product.service';
import { InputSanitizationService } from '../../../../core/services/input-sanitization.service';
import {
  PurchaseOrder,
  ReceivePurchaseOrderRequest,
  ReceivingProductRecord
} from '../../../../models/purchase-order.model';
import { Variant } from '../../../../models/variant.model';
import { ProductCondition, ProductConditionLabels } from '../../../../enums';
import { PtaStatusLabels } from '../../../../enums/pta-status.enum';
import { ToastService } from '../../../../shared/services/toast.service';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';
import { MenuItem } from 'primeng/api';
import { PRODUCT_CONSTRAINTS } from '../../../../constants/validation.constants';

interface ProductFormGroup {
  lineItemIndex: number;
  brand: string;
  model: string;
  unitIndex: number;
  unitCost: number;
}

@Component({
  selector: 'app-purchase-order-receiving',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TextareaModule,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    TagModule,
    DividerModule,
    ProgressSpinnerModule,
    TooltipModule,
    MenuModule,
    AppCurrencyPipe
  ],
  templateUrl: './purchase-order-receiving.component.html',
  styleUrls: ['./purchase-order-receiving.component.scss']
})
export class PurchaseOrderReceivingComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private purchaseOrderService: PurchaseOrderService,
    private productService: ProductService,
    private sanitizer: InputSanitizationService,
    private toastService: ToastService,
    private focusService: FocusManagementService
  ) { }

  @Input() purchaseOrder: PurchaseOrder | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() received = new EventEmitter<{ productsCreated: number }>();

  visible = true;
  saving = signal(false);

  /** Cache of variant data keyed by variant ID, loaded during form initialization */
  variantCache = signal<Map<string, Variant>>(new Map());

  /** Expose PTA status labels for template rendering */
  readonly ptaStatusLabels = PtaStatusLabels;

  /** Expose condition labels for template rendering */
  readonly ProductConditionLabels = ProductConditionLabels;

  /** Validation constraints for product form fields (F-058: Input Sanitization) */
  readonly constraints = PRODUCT_CONSTRAINTS;

  form!: FormGroup;
  productFormGroups: ProductFormGroup[] = [];

  conditionOptions = [
    { label: ProductConditionLabels[ProductCondition.NEW], value: ProductCondition.NEW },
    { label: ProductConditionLabels[ProductCondition.USED], value: ProductCondition.USED },
    { label: ProductConditionLabels[ProductCondition.OPEN_BOX], value: ProductCondition.OPEN_BOX }
  ];

  quickFillMenuItems: MenuItem[] = [
    {
      label: 'Set All Condition to New',
      icon: 'pi pi-star',
      command: () => this.applyToAll('condition', ProductCondition.NEW)
    },
    {
      label: 'Set All Condition to Used',
      icon: 'pi pi-replay',
      command: () => this.applyToAll('condition', ProductCondition.USED)
    },
    {
      label: 'Set All Condition to Open Box',
      icon: 'pi pi-sync',
      command: () => this.applyToAll('condition', ProductCondition.OPEN_BOX)
    },
    { separator: true },
    {
      label: 'Copy First Product to All',
      icon: 'pi pi-copy',
      command: () => this.copyFirstToAll()
    }
  ];

  totalUnits = computed(() => {
    if (!this.purchaseOrder) return 0;
    return this.purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0);
  });

  activeAccordionValues = computed(() => {
    if (!this.purchaseOrder) return [];
    return this.purchaseOrder.items.map((_, i) => i.toString());
  });

  invalidCount = signal(0);

  onDialogShow(): void {
    this.focusService.saveTriggerElement();
  }

  onDialogHide(): void {
    this.focusService.restoreFocus();
    this.onCancel();
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    if (!this.purchaseOrder) return;

    const productsArray: FormGroup[] = [];
    this.productFormGroups = [];

    // Collect unique variant IDs to load in batch
    const variantIds = new Set<string>();
    this.purchaseOrder.items.forEach(item => {
      if (item.variantId) {
        variantIds.add(item.variantId);
      }
    });

    // Build form groups first
    this.purchaseOrder.items.forEach((item, itemIdx) => {
      for (let unitIdx = 0; unitIdx < item.quantity; unitIdx++) {
        this.productFormGroups.push({
          lineItemIndex: itemIdx,
          brand: item.brand,
          model: item.model,
          unitIndex: unitIdx,
          unitCost: item.unitCost
        });

        const hasVariant = !!item.variantId;

        const productGroup = this.fb.group({
          lineItemIndex: [itemIdx],
          brand: [item.brand],
          model: [item.model],
          condition: [hasVariant && item.condition ? item.condition : ProductCondition.NEW, Validators.required],
          sellingPrice: [hasVariant ? 0 : null, hasVariant ? [Validators.required, Validators.min(0)] : [Validators.required, Validators.min(0)]],
          color: [item.color || ''],
          imei: [''],
          storageGb: [item.storageGb || null],
          ramGb: [null],
          batteryHealth: [{ value: null, disabled: true }],
          notes: ['']
        });

        productsArray.push(productGroup);
      }
    });

    this.form = this.fb.group({
      products: this.fb.array(productsArray)
    });

    this.updateInvalidCount();
    this.form.valueChanges.subscribe(() => this.updateInvalidCount());

    // Load variant data asynchronously
    this.loadVariants(variantIds);
  }

  private async loadVariants(variantIds: Set<string>): Promise<void> {
    if (variantIds.size === 0) return;

    const cache = new Map(this.variantCache());

    const loadPromises = Array.from(variantIds).map(async (variantId) => {
      try {
        const variant = await this.productService.getVariantById(variantId);
        if (variant) {
          cache.set(variantId, variant);
        }
      } catch (err) {
        console.error(`Failed to load variant ${variantId}:`, err);
      }
    });

    await Promise.all(loadPromises);
    this.variantCache.set(cache);

    // Pre-fill form fields from variant data
    if (!this.purchaseOrder) return;

    this.purchaseOrder.items.forEach((item, itemIdx) => {
      if (!item.variantId) return;
      const variant = cache.get(item.variantId);
      if (!variant) return;

      for (let unitIdx = 0; unitIdx < item.quantity; unitIdx++) {
        const formIdx = this.getFormIndex(itemIdx, unitIdx);
        const control = this.productsArray.at(formIdx);

        // Auto-fill condition from variant
        control.get('condition')?.setValue(variant.condition);
        // Auto-fill selling price from variant
        control.get('sellingPrice')?.setValue(variant.sellingPrice);
        // Auto-fill storage from variant if not already set
        if (!control.get('storageGb')?.value && variant.storageGb) {
          control.get('storageGb')?.setValue(variant.storageGb);
        }

        this.onConditionChange(formIdx);
      }
    });
  }

  onConditionChange(formIdx: number): void {
    const batteryHealthControl = this.getFormControl(formIdx, 'batteryHealth');
    const shouldEnable = this.shouldShowBatteryHealth(formIdx);

    if (shouldEnable) {
      batteryHealthControl.enable();
    } else {
      batteryHealthControl.disable();
      batteryHealthControl.setValue(null);
    }
  }

  getLineItemValidCount(itemIdx: number): number {
    const item = this.purchaseOrder!.items[itemIdx];
    let count = 0;
    for (let unitIdx = 0; unitIdx < item.quantity; unitIdx++) {
      const formIdx = this.getFormIndex(itemIdx, unitIdx);
      if (this.productsArray.at(formIdx).valid) {
        count++;
      }
    }
    return count;
  }

  applyToAll(field: string, value: unknown): void {
    this.productsArray.controls.forEach((control, idx) => {
      control.get(field)?.setValue(value);
      if (field === 'condition') {
        this.onConditionChange(idx);
      }
    });
    this.toastService.success('Applied', `${field} updated for all products`);
  }

  copyFirstToAll(): void {
    if (this.productsArray.length < 2) return;

    const firstProduct = this.productsArray.at(0);
    const firstValues = {
      condition: firstProduct.get('condition')?.value,
      sellingPrice: firstProduct.get('sellingPrice')?.value,
      color: firstProduct.get('color')?.value,
      storageGb: firstProduct.get('storageGb')?.value,
      ramGb: firstProduct.get('ramGb')?.value,
      batteryHealth: firstProduct.get('batteryHealth')?.value,
      notes: firstProduct.get('notes')?.value
    };

    for (let i = 1; i < this.productsArray.length; i++) {
      const control = this.productsArray.at(i);
      control.get('condition')?.setValue(firstValues.condition);
      control.get('sellingPrice')?.setValue(firstValues.sellingPrice);
      control.get('color')?.setValue(firstValues.color);
      control.get('storageGb')?.setValue(firstValues.storageGb);
      control.get('ramGb')?.setValue(firstValues.ramGb);
      control.get('notes')?.setValue(firstValues.notes);
      this.onConditionChange(i);
      if (this.shouldShowBatteryHealth(i)) {
        control.get('batteryHealth')?.setValue(firstValues.batteryHealth);
      }
    }

    this.toastService.success('Copied', 'First product values copied to all other products');
  }

  copyFirstToRest(itemIdx: number, event: Event): void {
    event.stopPropagation();

    const item = this.purchaseOrder!.items[itemIdx];
    if (item.quantity < 2) return;

    const firstFormIdx = this.getFormIndex(itemIdx, 0);
    const firstProduct = this.productsArray.at(firstFormIdx);
    const firstValues = {
      condition: firstProduct.get('condition')?.value,
      sellingPrice: firstProduct.get('sellingPrice')?.value,
      color: firstProduct.get('color')?.value,
      storageGb: firstProduct.get('storageGb')?.value,
      ramGb: firstProduct.get('ramGb')?.value,
      batteryHealth: firstProduct.get('batteryHealth')?.value,
      notes: firstProduct.get('notes')?.value
    };

    for (let unitIdx = 1; unitIdx < item.quantity; unitIdx++) {
      const formIdx = this.getFormIndex(itemIdx, unitIdx);
      const control = this.productsArray.at(formIdx);
      control.get('condition')?.setValue(firstValues.condition);
      control.get('sellingPrice')?.setValue(firstValues.sellingPrice);
      control.get('color')?.setValue(firstValues.color);
      control.get('storageGb')?.setValue(firstValues.storageGb);
      control.get('ramGb')?.setValue(firstValues.ramGb);
      control.get('notes')?.setValue(firstValues.notes);
      this.onConditionChange(formIdx);
      if (this.shouldShowBatteryHealth(formIdx)) {
        control.get('batteryHealth')?.setValue(firstValues.batteryHealth);
      }
    }

    this.toastService.success('Copied', `First unit values copied to ${item.quantity - 1} other unit(s)`);
  }

  private updateInvalidCount(): void {
    const productsArray = this.form.get('products') as FormArray;
    let count = 0;
    for (let i = 0; i < productsArray.length; i++) {
      if (productsArray.at(i).invalid) {
        count++;
      }
    }
    this.invalidCount.set(count);
  }

  get productsArray(): FormArray {
    return this.form.get('products') as FormArray;
  }

  getFormControl(index: number, controlName: string): any {
    return this.productsArray.at(index).get(controlName);
  }

  getFormIndex(itemIdx: number, unitIdx: number): number {
    let index = 0;
    for (let i = 0; i < itemIdx; i++) {
      index += this.purchaseOrder!.items[i].quantity;
    }
    return index + unitIdx;
  }

  getUnitRange(quantity: number): number[] {
    return Array.from({ length: quantity }, (_, i) => i);
  }

  shouldShowBatteryHealth(formIdx: number): boolean {
    const condition = this.getFormControl(formIdx, 'condition').value;
    return condition === ProductCondition.USED || condition === ProductCondition.OPEN_BOX;
  }

  /** Check if a PO line item has a variant linked */
  hasVariant(itemIdx: number): boolean {
    if (!this.purchaseOrder) return false;
    const item = this.purchaseOrder.items[itemIdx];
    return !!item?.variantId;
  }

  /** Get the Variant for a PO line item, or null if not linked */
  getVariantForItem(itemIdx: number): Variant | null {
    if (!this.purchaseOrder) return null;
    const item = this.purchaseOrder.items[itemIdx];
    if (!item?.variantId) return null;
    return this.variantCache().get(item.variantId) ?? null;
  }

  /** Get a human-readable label for a PTA status value */
  getPtaStatusLabel(status: string | null | undefined): string {
    if (!status) return 'N/A';
    return (PtaStatusLabels as Record<string, string>)[status] ?? status;
  }

  /** Get a human-readable label for a condition value */
  getConditionLabel(condition: string | null | undefined): string {
    if (!condition) return 'N/A';
    return (ProductConditionLabels as Record<string, string>)[condition] ?? condition;
  }

  isFormValid(): boolean {
    return this.form.valid;
  }

  async onSubmit(): Promise<void> {
    if (!this.form.valid || !this.purchaseOrder) return;

    this.saving.set(true);

    try {
      const productsValue = this.productsArray.getRawValue();
      const products: ReceivingProductRecord[] = productsValue.map((product: any) => {
        const itemIdx = product.lineItemIndex;
        const poItem = this.purchaseOrder!.items[itemIdx];
        const variant = poItem?.variantId ? this.variantCache().get(poItem.variantId) : null;

        return {
          lineItemIndex: product.lineItemIndex,
          brand: this.sanitizer.sanitize(product.brand),
          model: this.sanitizer.sanitize(product.model),
          condition: product.condition,
          sellingPrice: variant ? variant.sellingPrice : product.sellingPrice,
          color: this.sanitizer.sanitizeOrNull(product.color),
          imei: this.sanitizer.sanitizeOrNull(product.imei),
          storageGb: product.storageGb || (variant?.storageGb ?? null),
          ramGb: product.ramGb || null,
          batteryHealth: product.batteryHealth || null,
          notes: this.sanitizer.sanitizeOrNull(product.notes)
        };
      });

      const request: ReceivePurchaseOrderRequest = { products };
      const result = await this.purchaseOrderService.receiveWithInventory(this.purchaseOrder.id, request);

      this.toastService.success(
        'Order Received',
        `Successfully created ${result.productsCreated} product${result.productsCreated > 1 ? 's' : ''} in inventory`
      );

      this.received.emit({ productsCreated: result.productsCreated });
      this.visible = false;
    } catch (error) {
      console.error('Failed to receive order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to receive purchase order';
      this.toastService.error('Error', errorMessage);
    } finally {
      this.saving.set(false);
    }
  }

  onCancel(): void {
    if (!this.saving()) {
      this.visible = false;
      this.closed.emit();
    }
  }
}
