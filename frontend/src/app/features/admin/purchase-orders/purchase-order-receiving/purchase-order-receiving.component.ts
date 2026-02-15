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
import { InputSanitizationService } from '../../../../core/services/input-sanitization.service';
import {
  PurchaseOrder,
  ReceivePurchaseOrderRequest,
  ReceivingProductRecord
} from '../../../../models/purchase-order.model';
import { ProductCondition, ProductConditionLabels } from '../../../../enums';
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
    private sanitizer: InputSanitizationService,
    private toastService: ToastService,
    private focusService: FocusManagementService
  ) { }

  @Input() purchaseOrder: PurchaseOrder | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() received = new EventEmitter<{ productsCreated: number }>();

  visible = true;
  saving = signal(false);

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

    this.purchaseOrder.items.forEach((item, itemIdx) => {
      for (let unitIdx = 0; unitIdx < item.quantity; unitIdx++) {
        this.productFormGroups.push({
          lineItemIndex: itemIdx,
          brand: item.brand,
          model: item.model,
          unitIndex: unitIdx,
          unitCost: item.unitCost
        });

        const productGroup = this.fb.group({
          lineItemIndex: [itemIdx],
          brand: [item.brand],
          model: [item.model],
          condition: [ProductCondition.NEW, Validators.required],
          sellingPrice: [null, [Validators.required, Validators.min(0)]],
          color: [''],
          imei: [''],
          storageGb: [null],
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

  isFormValid(): boolean {
    return this.form.valid;
  }

  async onSubmit(): Promise<void> {
    if (!this.form.valid || !this.purchaseOrder) return;

    this.saving.set(true);

    try {
      const productsValue = this.productsArray.getRawValue();
      const products: ReceivingProductRecord[] = productsValue.map((product: any) => ({
        lineItemIndex: product.lineItemIndex,
        brand: this.sanitizer.sanitize(product.brand),
        model: this.sanitizer.sanitize(product.model),
        condition: product.condition,
        sellingPrice: product.sellingPrice,
        color: this.sanitizer.sanitizeOrNull(product.color),
        imei: this.sanitizer.sanitizeOrNull(product.imei),
        storageGb: product.storageGb || null,
        ramGb: product.ramGb || null,
        batteryHealth: product.batteryHealth || null,
        notes: this.sanitizer.sanitizeOrNull(product.notes)
      }));

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
