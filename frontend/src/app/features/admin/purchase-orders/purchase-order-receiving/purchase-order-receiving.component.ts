import { Component, OnInit, inject, signal, computed, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    MenuModule
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [closable]="!saving()"
      [draggable]="false"
      [resizable]="false"
      [focusOnShow]="true"
      [focusTrap]="true"
      [closeOnEscape]="true"
      [style]="{ width: '90vw', maxWidth: '1200px' }"
      [contentStyle]="{ 'max-height': '80vh', 'overflow-y': 'auto' }"
      header="Receive Purchase Order"
      (onShow)="onDialogShow()"
      (onHide)="onDialogHide()"
      role="dialog"
      aria-label="Receive Purchase Order"
    >
      @if (purchaseOrder) {
        <!-- PO Header Info -->
        <div class="surface-50 border-round p-3 mb-4">
          <div class="flex flex-wrap gap-4 align-items-center justify-content-between">
            <div class="flex flex-wrap gap-4 align-items-center">
              <div>
                <span class="text-600 text-sm block">PO Number</span>
                <span class="font-bold text-900 text-lg">{{ purchaseOrder.poNumber }}</span>
              </div>
              <p-divider layout="vertical" styleClass="hidden md:block" />
              <div>
                <span class="text-600 text-sm block">Supplier</span>
                <span class="font-semibold text-900">{{ purchaseOrder.supplierName }}</span>
              </div>
              <p-divider layout="vertical" styleClass="hidden md:block" />
              <div>
                <span class="text-600 text-sm block">Total Units</span>
                <span class="font-bold text-primary text-lg">{{ totalUnits() }}</span>
              </div>
            </div>
            @if (totalUnits() > 1) {
              <p-button
                label="Quick Fill"
                icon="pi pi-bolt"
                severity="secondary"
                [outlined]="true"
                size="small"
                (onClick)="quickFillMenu.toggle($event)"
                pTooltip="Apply values to all phones"
              />
              <p-menu #quickFillMenu [model]="quickFillMenuItems" [popup]="true" appendTo="body" />
            }
          </div>
        </div>

        <!-- Instructions -->
        <div class="flex align-items-center gap-2 text-600 text-sm mb-4 p-3 surface-ground border-round">
          <i class="pi pi-info-circle text-primary"></i>
          <span>Fill in the details for each phone unit. Required fields are marked with <span class="text-red-500">*</span>. Brand and model are pre-filled from the PO.</span>
        </div>

        <p-accordion [multiple]="true" [value]="activeAccordionValues()">
          @for (item of purchaseOrder.items; track item.id; let itemIdx = $index) {
            <p-accordion-panel [value]="itemIdx.toString()">
              <p-accordion-header>
                <div class="flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between gap-2 w-full pr-3">
                  <div class="flex align-items-center gap-2 flex-wrap">
                    <span class="font-bold text-900">{{ item.brand }} {{ item.model }}</span>
                    <p-tag
                      [value]="item.quantity + ' unit' + (item.quantity > 1 ? 's' : '')"
                      severity="info"
                      [rounded]="true"
                    />
                    @if (getLineItemValidCount(itemIdx) === item.quantity) {
                      <i class="pi pi-check-circle text-green-500" pTooltip="All units ready"></i>
                    } @else {
                      <span class="text-orange-500 text-sm">
                        {{ getLineItemValidCount(itemIdx) }}/{{ item.quantity }} ready
                      </span>
                    }
                  </div>
                  <div class="flex align-items-center gap-3">
                    <span class="text-600 text-sm">
                      Cost: {{ item.unitCost | currency:'USD':'symbol':'1.2-2' }} each
                    </span>
                    @if (item.quantity > 1) {
                      <p-button
                        icon="pi pi-copy"
                        severity="secondary"
                        [text]="true"
                        size="small"
                        (onClick)="copyFirstToRest(itemIdx, $event)"
                        pTooltip="Copy first unit to others"
                        tooltipPosition="left"
                      />
                    }
                  </div>
                </div>
              </p-accordion-header>
              <p-accordion-content>
                <div class="grid">
                  @for (unitIdx of getUnitRange(item.quantity); track unitIdx) {
                    @let formIdx = getFormIndex(itemIdx, unitIdx);
                    <div class="col-12">
                      @if (item.quantity > 1) {
                        <div class="flex align-items-center justify-content-between mb-3">
                          <div class="flex align-items-center gap-2">
                            <span class="font-semibold text-primary">Unit {{ unitIdx + 1 }}</span>
                            @if (phonesArray.at(formIdx).valid) {
                              <i class="pi pi-check-circle text-green-500 text-sm"></i>
                            } @else {
                              <i class="pi pi-exclamation-circle text-orange-500 text-sm"></i>
                            }
                          </div>
                          @if (unitIdx === 0 && item.quantity > 1) {
                            <span class="text-500 text-xs">Use copy button above to duplicate to other units</span>
                          }
                        </div>
                      }

                      <div class="grid">
                        <!-- Row 1: Condition, Selling Price, Color, IMEI -->
                        <div class="col-12 md:col-6 lg:col-3">
                          <label class="block font-medium mb-2" [for]="'condition-' + formIdx">
                            Condition <span class="text-red-500">*</span>
                          </label>
                          <p-select
                            [options]="conditionOptions"
                            [formControl]="getFormControl(formIdx, 'condition')"
                            placeholder="Select condition"
                            optionLabel="label"
                            optionValue="value"
                            styleClass="w-full"
                            appendTo="body"
                            [inputId]="'condition-' + formIdx"
                            (onChange)="onConditionChange(formIdx)"
                          />
                        </div>

                        <div class="col-12 md:col-6 lg:col-3">
                          <label class="block font-medium mb-2" [for]="'sellingPrice-' + formIdx">
                            Selling Price <span class="text-red-500">*</span>
                          </label>
                          <p-inputNumber
                            [formControl]="getFormControl(formIdx, 'sellingPrice')"
                            mode="currency"
                            currency="USD"
                            locale="en-US"
                            [inputId]="'sellingPrice-' + formIdx"
                            styleClass="w-full"
                            placeholder="0.00"
                          />
                        </div>

                        <div class="col-12 md:col-6 lg:col-3">
                          <label class="block font-medium mb-2" [for]="'color-' + formIdx">Color</label>
                          <input
                            pInputText
                            [formControl]="getFormControl(formIdx, 'color')"
                            class="w-full"
                            placeholder="e.g., Space Gray"
                            [maxlength]="constraints.COLOR_MAX"
                            [id]="'color-' + formIdx"
                          />
                        </div>

                        <div class="col-12 md:col-6 lg:col-3">
                          <label class="block font-medium mb-2" [for]="'imei-' + formIdx">
                            IMEI
                            <i class="pi pi-info-circle text-400 ml-1" pTooltip="Each phone should have a unique IMEI"></i>
                          </label>
                          <input
                            pInputText
                            [formControl]="getFormControl(formIdx, 'imei')"
                            class="w-full"
                            placeholder="15-17 digits"
                            [maxlength]="constraints.IMEI_MAX"
                            [id]="'imei-' + formIdx"
                          />
                        </div>

                        <!-- Row 2: Storage, RAM, Battery Health, Notes -->
                        <div class="col-12 md:col-6 lg:col-3">
                          <label class="block font-medium mb-2" [for]="'storageGb-' + formIdx">Storage (GB)</label>
                          <p-inputNumber
                            [formControl]="getFormControl(formIdx, 'storageGb')"
                            [inputId]="'storageGb-' + formIdx"
                            styleClass="w-full"
                            placeholder="e.g., 128"
                            [min]="0"
                          />
                        </div>

                        <div class="col-12 md:col-6 lg:col-3">
                          <label class="block font-medium mb-2" [for]="'ramGb-' + formIdx">RAM (GB)</label>
                          <p-inputNumber
                            [formControl]="getFormControl(formIdx, 'ramGb')"
                            [inputId]="'ramGb-' + formIdx"
                            styleClass="w-full"
                            placeholder="e.g., 8"
                            [min]="0"
                          />
                        </div>

                        <div class="col-12 md:col-6 lg:col-3">
                          <label class="block font-medium mb-2" [for]="'batteryHealth-' + formIdx">
                            Battery Health (%)
                            <i
                              class="pi pi-info-circle ml-1"
                              [ngClass]="shouldShowBatteryHealth(formIdx) ? 'text-primary' : 'text-400'"
                              pTooltip="Applicable for used/refurbished phones"
                            ></i>
                          </label>
                          <p-inputNumber
                            [formControl]="getFormControl(formIdx, 'batteryHealth')"
                            [inputId]="'batteryHealth-' + formIdx"
                            styleClass="w-full"
                            placeholder="0-100"
                            [min]="0"
                            [max]="100"
                          />
                        </div>

                        <div class="col-12 lg:col-3">
                          <label class="block font-medium mb-2" [for]="'notes-' + formIdx">Notes</label>
                          <textarea
                            pTextarea
                            [formControl]="getFormControl(formIdx, 'notes')"
                            rows="1"
                            class="w-full"
                            placeholder="Optional notes"
                            [maxlength]="constraints.NOTES_MAX"
                            [id]="'notes-' + formIdx"
                          ></textarea>
                        </div>
                      </div>

                      @if (unitIdx < item.quantity - 1) {
                        <p-divider />
                      }
                    </div>
                  }
                </div>
              </p-accordion-content>
            </p-accordion-panel>
          }
        </p-accordion>
      }

      <ng-template pTemplate="footer">
        <div class="flex flex-column sm:flex-row justify-content-between align-items-center gap-3 w-full">
          <div class="flex align-items-center gap-2">
            @if (invalidCount() > 0) {
              <i class="pi pi-exclamation-circle text-orange-500"></i>
              <span class="text-600 text-sm">{{ invalidCount() }} phone(s) need required fields filled</span>
            } @else {
              <i class="pi pi-check-circle text-green-500"></i>
              <span class="text-green-600 font-medium">All {{ totalUnits() }} phones ready to receive</span>
            }
          </div>
          <div class="flex gap-2">
            <p-button
              label="Cancel"
              [text]="true"
              severity="secondary"
              (onClick)="onCancel()"
              [disabled]="saving()"
            />
            <p-button
              label="Receive & Create Inventory"
              icon="pi pi-check"
              severity="success"
              (onClick)="onSubmit()"
              [loading]="saving()"
              [disabled]="!isFormValid()"
            />
          </div>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: []
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
