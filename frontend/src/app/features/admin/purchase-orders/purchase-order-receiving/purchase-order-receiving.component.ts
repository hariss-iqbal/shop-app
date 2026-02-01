import { Component, OnInit, inject, signal, computed, EventEmitter, Output, Input } from '@angular/core';
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
  ReceivingPhoneRecord
} from '../../../../models/purchase-order.model';
import { PhoneCondition, PhoneConditionLabels } from '../../../../enums';
import { ToastService } from '../../../../shared/services/toast.service';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';
import { MenuItem } from 'primeng/api';
import { PHONE_CONSTRAINTS } from '../../../../constants/validation.constants';

interface PhoneFormGroup {
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
  private fb = inject(FormBuilder);
  private purchaseOrderService = inject(PurchaseOrderService);
  private sanitizer = inject(InputSanitizationService);
  private toastService = inject(ToastService);
  private focusService = inject(FocusManagementService);

  @Input() purchaseOrder: PurchaseOrder | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() received = new EventEmitter<{ phonesCreated: number }>();

  visible = true;
  saving = signal(false);

  /** Validation constraints for phone form fields (F-058: Input Sanitization) */
  readonly constraints = PHONE_CONSTRAINTS;

  form!: FormGroup;
  phoneFormGroups: PhoneFormGroup[] = [];

  conditionOptions = [
    { label: PhoneConditionLabels[PhoneCondition.NEW], value: PhoneCondition.NEW },
    { label: PhoneConditionLabels[PhoneCondition.USED], value: PhoneCondition.USED },
    { label: PhoneConditionLabels[PhoneCondition.REFURBISHED], value: PhoneCondition.REFURBISHED }
  ];

  quickFillMenuItems: MenuItem[] = [
    {
      label: 'Set All Condition to New',
      icon: 'pi pi-star',
      command: () => this.applyToAll('condition', PhoneCondition.NEW)
    },
    {
      label: 'Set All Condition to Used',
      icon: 'pi pi-replay',
      command: () => this.applyToAll('condition', PhoneCondition.USED)
    },
    {
      label: 'Set All Condition to Refurbished',
      icon: 'pi pi-sync',
      command: () => this.applyToAll('condition', PhoneCondition.REFURBISHED)
    },
    { separator: true },
    {
      label: 'Copy First Phone to All',
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

    const phonesArray: FormGroup[] = [];
    this.phoneFormGroups = [];

    this.purchaseOrder.items.forEach((item, itemIdx) => {
      for (let unitIdx = 0; unitIdx < item.quantity; unitIdx++) {
        this.phoneFormGroups.push({
          lineItemIndex: itemIdx,
          brand: item.brand,
          model: item.model,
          unitIndex: unitIdx,
          unitCost: item.unitCost
        });

        const phoneGroup = this.fb.group({
          lineItemIndex: [itemIdx],
          brand: [item.brand],
          model: [item.model],
          condition: [PhoneCondition.NEW, Validators.required],
          sellingPrice: [null, [Validators.required, Validators.min(0)]],
          color: [''],
          imei: [''],
          storageGb: [null],
          ramGb: [null],
          batteryHealth: [{ value: null, disabled: true }],
          notes: ['']
        });

        phonesArray.push(phoneGroup);
      }
    });

    this.form = this.fb.group({
      phones: this.fb.array(phonesArray)
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
      if (this.phonesArray.at(formIdx).valid) {
        count++;
      }
    }
    return count;
  }

  applyToAll(field: string, value: unknown): void {
    this.phonesArray.controls.forEach((control, idx) => {
      control.get(field)?.setValue(value);
      if (field === 'condition') {
        this.onConditionChange(idx);
      }
    });
    this.toastService.success('Applied', `${field} updated for all phones`);
  }

  copyFirstToAll(): void {
    if (this.phonesArray.length < 2) return;

    const firstPhone = this.phonesArray.at(0);
    const firstValues = {
      condition: firstPhone.get('condition')?.value,
      sellingPrice: firstPhone.get('sellingPrice')?.value,
      color: firstPhone.get('color')?.value,
      storageGb: firstPhone.get('storageGb')?.value,
      ramGb: firstPhone.get('ramGb')?.value,
      batteryHealth: firstPhone.get('batteryHealth')?.value,
      notes: firstPhone.get('notes')?.value
    };

    for (let i = 1; i < this.phonesArray.length; i++) {
      const control = this.phonesArray.at(i);
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

    this.toastService.success('Copied', 'First phone values copied to all other phones');
  }

  copyFirstToRest(itemIdx: number, event: Event): void {
    event.stopPropagation();

    const item = this.purchaseOrder!.items[itemIdx];
    if (item.quantity < 2) return;

    const firstFormIdx = this.getFormIndex(itemIdx, 0);
    const firstPhone = this.phonesArray.at(firstFormIdx);
    const firstValues = {
      condition: firstPhone.get('condition')?.value,
      sellingPrice: firstPhone.get('sellingPrice')?.value,
      color: firstPhone.get('color')?.value,
      storageGb: firstPhone.get('storageGb')?.value,
      ramGb: firstPhone.get('ramGb')?.value,
      batteryHealth: firstPhone.get('batteryHealth')?.value,
      notes: firstPhone.get('notes')?.value
    };

    for (let unitIdx = 1; unitIdx < item.quantity; unitIdx++) {
      const formIdx = this.getFormIndex(itemIdx, unitIdx);
      const control = this.phonesArray.at(formIdx);
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
    const phonesArray = this.form.get('phones') as FormArray;
    let count = 0;
    for (let i = 0; i < phonesArray.length; i++) {
      if (phonesArray.at(i).invalid) {
        count++;
      }
    }
    this.invalidCount.set(count);
  }

  get phonesArray(): FormArray {
    return this.form.get('phones') as FormArray;
  }

  getFormControl(index: number, controlName: string): any {
    return this.phonesArray.at(index).get(controlName);
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
    return condition === PhoneCondition.USED || condition === PhoneCondition.REFURBISHED;
  }

  isFormValid(): boolean {
    return this.form.valid;
  }

  async onSubmit(): Promise<void> {
    if (!this.form.valid || !this.purchaseOrder) return;

    this.saving.set(true);

    try {
      const phonesValue = this.phonesArray.getRawValue();
      const phones: ReceivingPhoneRecord[] = phonesValue.map((phone: any) => ({
        lineItemIndex: phone.lineItemIndex,
        brand: this.sanitizer.sanitize(phone.brand),
        model: this.sanitizer.sanitize(phone.model),
        condition: phone.condition,
        sellingPrice: phone.sellingPrice,
        color: this.sanitizer.sanitizeOrNull(phone.color),
        imei: this.sanitizer.sanitizeOrNull(phone.imei),
        storageGb: phone.storageGb || null,
        ramGb: phone.ramGb || null,
        batteryHealth: phone.batteryHealth || null,
        notes: this.sanitizer.sanitizeOrNull(phone.notes)
      }));

      const request: ReceivePurchaseOrderRequest = { phones };
      const result = await this.purchaseOrderService.receiveWithInventory(this.purchaseOrder.id, request);

      this.toastService.success(
        'Order Received',
        `Successfully created ${result.phonesCreated} phone${result.phonesCreated > 1 ? 's' : ''} in inventory`
      );

      this.received.emit({ phonesCreated: result.phonesCreated });
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
