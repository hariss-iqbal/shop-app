import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { PhoneService } from '../../../../core/services/phone.service';
import { BrandService } from '../../../../core/services/brand.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { InputSanitizationService } from '../../../../core/services/input-sanitization.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';
import { Brand } from '../../../../models/brand.model';
import { Supplier } from '../../../../models/supplier.model';
import { CreatePhoneRequest, UpdatePhoneRequest } from '../../../../models/phone.model';
import { PhoneImage } from '../../../../models/phone-image.model';
import { PhoneCondition, PhoneConditionLabels, PhoneStatus, PhoneStatusLabels } from '../../../../enums';
import { PhoneImageUploadComponent } from '../phone-image-upload/phone-image-upload.component';
import { PHONE_CONSTRAINTS } from '../../../../constants/validation.constants';

interface DropdownOption<T> {
  label: string;
  value: T;
}

interface BrandSuggestion {
  id?: string;
  name: string;
  logoUrl?: string | null;
  isCreateNew?: boolean;
}

@Component({
  selector: 'app-inventory-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    AutoCompleteModule,
    DatePickerModule,
    TextareaModule,
    ProgressSpinnerModule,
    SkeletonModule,
    DividerModule,
    DialogModule,
    TooltipModule,
    TagModule,
    PhoneImageUploadComponent
  ],
  template: `
    <div class="grid">
      <div class="col-12">
        <div class="flex align-items-center justify-content-between mb-4">
          <h1 class="text-3xl font-bold m-0">{{ isEdit ? 'Edit Phone' : 'Add Phone' }}</h1>
          @if (isEdit) {
            <p-tag [value]="'ID: ' + phoneId" severity="secondary" />
          }
        </div>
      </div>

      @if (loading()) {
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
              <div class="col-12 md:col-6 lg:col-3">
                <p-skeleton width="40%" height="1rem" styleClass="mb-2" />
                <p-skeleton width="100%" height="2.5rem" />
              </div>
              <div class="col-12 md:col-6 lg:col-3">
                <p-skeleton width="40%" height="1rem" styleClass="mb-2" />
                <p-skeleton width="100%" height="2.5rem" />
              </div>
              <div class="col-12 md:col-6 lg:col-3">
                <p-skeleton width="40%" height="1rem" styleClass="mb-2" />
                <p-skeleton width="100%" height="2.5rem" />
              </div>
              <div class="col-12 md:col-6 lg:col-3">
                <p-skeleton width="40%" height="1rem" styleClass="mb-2" />
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
                <p-skeleton width="100%" height="5rem" />
              </div>
            </div>
          </p-card>
        </div>
      } @else {
        <div class="col-12">
          <p-card>
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="grid">
                <!-- Section: Basic Information -->
                <div class="col-12">
                  <h3 class="text-lg font-semibold m-0 mb-3 flex align-items-center gap-2">
                    <i class="pi pi-mobile text-primary"></i>
                    Basic Information
                  </h3>
                </div>

                <!-- Brand (Autocomplete with inline create) -->
                <div class="col-12 md:col-6">
                  <label for="brand" class="block font-medium mb-2">
                    Brand <span class="text-red-500">*</span>
                    <i class="pi pi-info-circle text-500 ml-1 text-sm" pTooltip="Select an existing brand or type to create a new one" tooltipPosition="top"></i>
                  </label>
                  <p-autocomplete
                    id="brand"
                    formControlName="brand"
                    [suggestions]="brandSuggestions()"
                    (completeMethod)="searchBrands($event)"
                    (onSelect)="onBrandSelect($event)"
                    field="name"
                    [dropdown]="true"
                    [forceSelection]="false"
                    placeholder="Type to search or create new brand..."
                    styleClass="w-full"
                    inputStyleClass="w-full"
                    ariaLabel="Phone brand"
                  >
                    <ng-template let-item pTemplate="item">
                      @if (item.isCreateNew) {
                        <div class="flex align-items-center gap-2 text-primary font-medium">
                          <i class="pi pi-plus"></i>
                          <span>Create "{{ item.name }}"</span>
                        </div>
                      } @else {
                        <div class="flex align-items-center gap-2">
                          @if (item.logoUrl) {
                            <img [src]="item.logoUrl" [alt]="item.name" style="width: 24px; height: 24px; object-fit: contain;" />
                          } @else {
                            <i class="pi pi-tag text-500"></i>
                          }
                          <span>{{ item.name }}</span>
                        </div>
                      }
                    </ng-template>
                  </p-autocomplete>
                  @if (form.controls['brand'].invalid && form.controls['brand'].touched) {
                    <small class="p-error block mt-1">Please select or create a brand</small>
                  }
                </div>

                <!-- Model -->
                <div class="col-12 md:col-6">
                  <label for="model" class="block font-medium mb-2">Model <span class="text-red-500">*</span></label>
                  <input
                    id="model"
                    type="text"
                    pInputText
                    formControlName="model"
                    class="w-full"
                    placeholder="e.g., iPhone 15 Pro Max"
                    [maxlength]="constraints.MODEL_MAX"
                    aria-describedby="model-help"
                  />
                  @if (form.controls['model'].invalid && form.controls['model'].touched) {
                    <small id="model-help" class="p-error block mt-1">Model name is required</small>
                  } @else {
                    <small id="model-help" class="text-500 block mt-1">{{ form.get('model')?.value?.length || 0 }}/{{ constraints.MODEL_MAX }} characters</small>
                  }
                </div>

                <!-- Section: Specifications -->
                <div class="col-12 mt-3">
                  <p-divider />
                  <h3 class="text-lg font-semibold m-0 mb-3 flex align-items-center gap-2">
                    <i class="pi pi-cog text-primary"></i>
                    Specifications
                  </h3>
                </div>

                <!-- Storage GB -->
                <div class="col-12 md:col-6 lg:col-3">
                  <label for="storageGb" class="block font-medium mb-2">Storage (GB)</label>
                  <p-inputNumber
                    id="storageGb"
                    formControlName="storageGb"
                    [min]="0"
                    [max]="9999"
                    [showButtons]="true"
                    styleClass="w-full"
                    inputStyleClass="w-full"
                    placeholder="e.g., 128"
                    ariaLabel="Storage capacity in gigabytes"
                  />
                </div>

                <!-- RAM GB -->
                <div class="col-12 md:col-6 lg:col-3">
                  <label for="ramGb" class="block font-medium mb-2">RAM (GB)</label>
                  <p-inputNumber
                    id="ramGb"
                    formControlName="ramGb"
                    [min]="0"
                    [max]="999"
                    [showButtons]="true"
                    styleClass="w-full"
                    inputStyleClass="w-full"
                    placeholder="e.g., 8"
                    ariaLabel="RAM in gigabytes"
                  />
                </div>

                <!-- Color -->
                <div class="col-12 md:col-6 lg:col-3">
                  <label for="color" class="block font-medium mb-2">Color</label>
                  <input
                    id="color"
                    type="text"
                    pInputText
                    formControlName="color"
                    class="w-full"
                    placeholder="e.g., Space Black"
                    [maxlength]="constraints.COLOR_MAX"
                  />
                </div>

                <!-- IMEI -->
                <div class="col-12 md:col-6 lg:col-3">
                  <label for="imei" class="block font-medium mb-2">
                    IMEI
                    <i class="pi pi-info-circle text-500 ml-1 text-sm" pTooltip="International Mobile Equipment Identity - unique device identifier" tooltipPosition="top"></i>
                  </label>
                  <input
                    id="imei"
                    type="text"
                    pInputText
                    formControlName="imei"
                    class="w-full"
                    placeholder="15-digit IMEI"
                    [maxlength]="constraints.IMEI_MAX"
                  />
                </div>

                <!-- Section: Condition -->
                <div class="col-12 mt-3">
                  <p-divider />
                  <h3 class="text-lg font-semibold m-0 mb-3 flex align-items-center gap-2">
                    <i class="pi pi-check-circle text-primary"></i>
                    Condition
                  </h3>
                </div>

                <!-- Condition -->
                <div class="col-12 md:col-6 lg:col-4">
                  <label for="condition" class="block font-medium mb-2">Condition <span class="text-red-500">*</span></label>
                  <p-select
                    id="condition"
                    formControlName="condition"
                    [options]="conditionOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select condition"
                    styleClass="w-full"
                    ariaLabel="Phone condition"
                  />
                  @if (form.controls['condition'].invalid && form.controls['condition'].touched) {
                    <small class="p-error block mt-1">Please select a condition</small>
                  }
                </div>

                <!-- Battery Health (conditionally shown) -->
                @if (showBatteryHealth()) {
                  <div class="col-12 md:col-6 lg:col-4">
                    <label for="batteryHealth" class="block font-medium mb-2">
                      Battery Health (%)
                      <i class="pi pi-info-circle text-500 ml-1 text-sm" pTooltip="Current battery capacity compared to when it was new" tooltipPosition="top"></i>
                    </label>
                    <p-inputNumber
                      id="batteryHealth"
                      formControlName="batteryHealth"
                      [min]="0"
                      [max]="100"
                      [showButtons]="true"
                      suffix="%"
                      styleClass="w-full"
                      inputStyleClass="w-full"
                      placeholder="0-100"
                      ariaLabel="Battery health percentage"
                    />
                    @if (form.controls['batteryHealth'].invalid && form.controls['batteryHealth'].touched) {
                      <small class="p-error block mt-1">Battery health must be between 0% and 100%</small>
                    }
                  </div>
                }

                <!-- Status -->
                <div class="col-12 md:col-6 lg:col-4">
                  <label for="status" class="block font-medium mb-2">Status <span class="text-red-500">*</span></label>
                  <p-select
                    id="status"
                    formControlName="status"
                    [options]="statusOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select status"
                    styleClass="w-full"
                    ariaLabel="Inventory status"
                  />
                  @if (form.controls['status'].invalid && form.controls['status'].touched) {
                    <small class="p-error block mt-1">Please select a status</small>
                  }
                </div>

                <!-- Section: Pricing -->
                <div class="col-12 mt-3">
                  <p-divider />
                  <h3 class="text-lg font-semibold m-0 mb-3 flex align-items-center gap-2">
                    <i class="pi pi-dollar text-primary"></i>
                    Pricing
                  </h3>
                </div>

                <!-- Cost Price -->
                <div class="col-12 md:col-6 lg:col-4">
                  <label for="costPrice" class="block font-medium mb-2">
                    Cost Price <span class="text-red-500">*</span>
                    <i class="pi pi-info-circle text-500 ml-1 text-sm" pTooltip="The price you paid to acquire this phone" tooltipPosition="top"></i>
                  </label>
                  <p-inputNumber
                    id="costPrice"
                    formControlName="costPrice"
                    mode="currency"
                    currency="USD"
                    [min]="0"
                    styleClass="w-full"
                    inputStyleClass="w-full"
                    placeholder="0.00"
                    ariaLabel="Cost price in USD"
                  />
                  @if (form.controls['costPrice'].invalid && form.controls['costPrice'].touched) {
                    <small class="p-error block mt-1">Cost price is required</small>
                  }
                </div>

                <!-- Selling Price -->
                <div class="col-12 md:col-6 lg:col-4">
                  <label for="sellingPrice" class="block font-medium mb-2">
                    Selling Price <span class="text-red-500">*</span>
                    <i class="pi pi-info-circle text-500 ml-1 text-sm" pTooltip="The price you will sell this phone for" tooltipPosition="top"></i>
                  </label>
                  <p-inputNumber
                    id="sellingPrice"
                    formControlName="sellingPrice"
                    mode="currency"
                    currency="USD"
                    [min]="0"
                    styleClass="w-full"
                    inputStyleClass="w-full"
                    placeholder="0.00"
                    ariaLabel="Selling price in USD"
                  />
                  @if (form.controls['sellingPrice'].invalid && form.controls['sellingPrice'].touched) {
                    <small class="p-error block mt-1">Selling price is required</small>
                  }
                </div>

                <!-- Profit Margin Preview -->
                <div class="col-12 md:col-6 lg:col-4">
                  <label class="block font-medium mb-2">Profit Margin</label>
                  <div class="surface-100 border-round p-3 flex align-items-center justify-content-between">
                    <div>
                      <span class="text-lg font-bold" [class.text-green-600]="profitMarginPreview() > 0" [class.text-red-600]="profitMarginPreview() < 0">
                        {{ profitMarginPreview() | number:'1.1-1' }}%
                      </span>
                      @if (profitAmountPreview() !== null) {
                        <span class="text-500 text-sm ml-2">({{ profitAmountPreview() | currency:'USD':'symbol':'1.2-2' }})</span>
                      }
                    </div>
                    @if (profitMarginPreview() > 20) {
                      <i class="pi pi-arrow-up text-green-600"></i>
                    } @else if (profitMarginPreview() < 0) {
                      <i class="pi pi-arrow-down text-red-600"></i>
                    } @else if (profitMarginPreview() > 0) {
                      <i class="pi pi-minus text-orange-500"></i>
                    }
                  </div>
                </div>

                <!-- Section: Procurement -->
                <div class="col-12 mt-3">
                  <p-divider />
                  <h3 class="text-lg font-semibold m-0 mb-3 flex align-items-center gap-2">
                    <i class="pi pi-truck text-primary"></i>
                    Procurement
                  </h3>
                </div>

                <!-- Purchase Date -->
                <div class="col-12 md:col-6">
                  <label for="purchaseDate" class="block font-medium mb-2">Purchase Date</label>
                  <p-datepicker
                    id="purchaseDate"
                    formControlName="purchaseDate"
                    [showIcon]="true"
                    dateFormat="yy-mm-dd"
                    [maxDate]="today"
                    styleClass="w-full"
                    inputStyleClass="w-full"
                    placeholder="Select date"
                    ariaLabel="Date of purchase"
                  />
                </div>

                <!-- Supplier -->
                <div class="col-12 md:col-6">
                  <label for="supplierId" class="block font-medium mb-2">Supplier</label>
                  <p-select
                    id="supplierId"
                    formControlName="supplierId"
                    [options]="supplierOptions()"
                    optionLabel="label"
                    optionValue="value"
                    [showClear]="true"
                    placeholder="Select supplier (optional)"
                    styleClass="w-full"
                    ariaLabel="Phone supplier"
                    [filter]="supplierOptions().length > 5"
                    filterPlaceholder="Search suppliers..."
                  />
                </div>

                <!-- Section: Additional Information -->
                <div class="col-12 mt-3">
                  <p-divider />
                  <h3 class="text-lg font-semibold m-0 mb-3 flex align-items-center gap-2">
                    <i class="pi pi-file-edit text-primary"></i>
                    Additional Information
                  </h3>
                </div>

                <!-- Notes -->
                <div class="col-12 md:col-6">
                  <label for="notes" class="block font-medium mb-2">
                    Internal Notes
                    <i class="pi pi-info-circle text-500 ml-1 text-sm" pTooltip="Private notes for internal use only (not shown to customers)" tooltipPosition="top"></i>
                  </label>
                  <textarea
                    id="notes"
                    pTextarea
                    formControlName="notes"
                    rows="3"
                    class="w-full"
                    placeholder="Enter any internal notes..."
                    [maxlength]="constraints.NOTES_MAX"
                    aria-describedby="notes-help"
                  ></textarea>
                  <small id="notes-help" class="text-500 block mt-1">{{ form.get('notes')?.value?.length || 0 }}/{{ constraints.NOTES_MAX }} characters</small>
                </div>

                <!-- Description -->
                <div class="col-12 md:col-6">
                  <label for="description" class="block font-medium mb-2">
                    Public Description
                    <i class="pi pi-info-circle text-500 ml-1 text-sm" pTooltip="Description shown to customers in the catalog" tooltipPosition="top"></i>
                  </label>
                  <textarea
                    id="description"
                    pTextarea
                    formControlName="description"
                    rows="3"
                    class="w-full"
                    placeholder="Enter phone description for catalog..."
                    [maxlength]="constraints.DESCRIPTION_MAX"
                    aria-describedby="description-help"
                  ></textarea>
                  <small id="description-help" class="text-500 block mt-1">{{ form.get('description')?.value?.length || 0 }}/{{ constraints.DESCRIPTION_MAX }} characters</small>
                </div>

                <!-- Image Upload Section -->
                @if (isEdit && phoneId) {
                  <div class="col-12 mt-3">
                    <p-divider />
                    <h3 class="text-lg font-semibold m-0 mb-3 flex align-items-center gap-2">
                      <i class="pi pi-images text-primary"></i>
                      Phone Images
                    </h3>
                    <app-phone-image-upload
                      [phoneId]="phoneId"
                      (imagesChanged)="onImagesChanged($event)"
                    />
                  </div>
                } @else {
                  <div class="col-12 mt-3">
                    <p-divider />
                    <h3 class="text-lg font-semibold m-0 mb-3 flex align-items-center gap-2">
                      <i class="pi pi-images text-primary"></i>
                      Phone Images
                    </h3>
                    <div class="surface-100 border-round p-4 text-center">
                      <i class="pi pi-info-circle text-2xl text-500 mb-2 block"></i>
                      <p class="text-500 m-0">Save the phone record first to upload images</p>
                    </div>
                  </div>
                }

                <!-- Actions -->
                <div class="col-12 mt-4">
                  <p-divider />
                  <div class="flex flex-column sm:flex-row justify-content-between align-items-center gap-3 mt-3">
                    <div class="text-500 text-sm">
                      <span class="text-red-500">*</span> indicates required fields
                    </div>
                    <div class="flex gap-2">
                      <p-button
                        label="Cancel"
                        severity="secondary"
                        [outlined]="true"
                        icon="pi pi-times"
                        (onClick)="onCancel()"
                      />
                      <p-button
                        [label]="isEdit ? 'Update Phone' : 'Add Phone'"
                        type="submit"
                        [icon]="isEdit ? 'pi pi-check' : 'pi pi-plus'"
                        [loading]="submitting()"
                        [disabled]="form.invalid || submitting()"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </p-card>
        </div>
      }
    </div>

    <!-- Create Brand Dialog -->
    <p-dialog
      header="Create New Brand"
      [(visible)]="showCreateBrandDialog"
      [modal]="true"
      [style]="{ width: '400px', 'max-width': '95vw' }"
      [closable]="!creatingBrand()"
      [focusOnShow]="true"
      [focusTrap]="true"
      [closeOnEscape]="true"
      (onShow)="onBrandDialogShow()"
      (onHide)="onBrandDialogHide()"
      role="dialog"
      aria-label="Create New Brand"
    >
      <div class="flex flex-column gap-3">
        <p class="text-500 m-0">Brand "{{ pendingBrandName }}" doesn't exist. Create it now?</p>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="Cancel" severity="secondary" [text]="true" (onClick)="cancelCreateBrand()" [disabled]="creatingBrand()" />
        <p-button label="Create Brand" icon="pi pi-check" (onClick)="confirmCreateBrand()" [loading]="creatingBrand()" />
      </ng-template>
    </p-dialog>
  `
})
export class InventoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private phoneService = inject(PhoneService);
  private brandService = inject(BrandService);
  private supplierService = inject(SupplierService);
  private sanitizer = inject(InputSanitizationService);
  private toastService = inject(ToastService);
  private focusService = inject(FocusManagementService);

  isEdit = false;
  phoneId: string | null = null;
  today = new Date();

  loading = signal(false);
  submitting = signal(false);
  brands = signal<Brand[]>([]);
  brandSuggestions = signal<BrandSuggestion[]>([]);
  suppliers = signal<Supplier[]>([]);
  showBatteryHealth = signal(false);
  creatingBrand = signal(false);

  showCreateBrandDialog = false;
  pendingBrandName = '';
  lastSearchQuery = '';

  supplierOptions = computed(() => {
    return this.suppliers().map(s => ({
      label: s.name,
      value: s.id
    }));
  });

  profitMarginPreview = computed(() => {
    const costPrice = this.form?.get('costPrice')?.value;
    const sellingPrice = this.form?.get('sellingPrice')?.value;

    if (sellingPrice && sellingPrice > 0) {
      return ((sellingPrice - (costPrice || 0)) / sellingPrice) * 100;
    }
    return 0;
  });

  profitAmountPreview = computed(() => {
    const costPrice = this.form?.get('costPrice')?.value;
    const sellingPrice = this.form?.get('sellingPrice')?.value;

    if (costPrice !== null && sellingPrice !== null) {
      return sellingPrice - costPrice;
    }
    return null;
  });

  conditionOptions: DropdownOption<PhoneCondition>[] = Object.values(PhoneCondition).map(value => ({
    label: PhoneConditionLabels[value],
    value
  }));

  statusOptions: DropdownOption<PhoneStatus>[] = Object.values(PhoneStatus).map(value => ({
    label: PhoneStatusLabels[value],
    value
  }));

  /** Validation constraints for phone form fields (F-058: Input Sanitization) */
  readonly constraints = PHONE_CONSTRAINTS;

  form: FormGroup = this.fb.group({
    brand: [null as Brand | null, Validators.required],
    model: ['', [Validators.required, Validators.maxLength(this.constraints.MODEL_MAX)]],
    storageGb: [null as number | null],
    ramGb: [null as number | null],
    color: ['', Validators.maxLength(this.constraints.COLOR_MAX)],
    condition: [PhoneCondition.NEW, Validators.required],
    batteryHealth: [null as number | null, [Validators.min(this.constraints.BATTERY_HEALTH_MIN), Validators.max(this.constraints.BATTERY_HEALTH_MAX)]],
    imei: ['', Validators.maxLength(this.constraints.IMEI_MAX)],
    costPrice: [null as number | null, [Validators.required, Validators.min(0)]],
    sellingPrice: [null as number | null, [Validators.required, Validators.min(0)]],
    status: [PhoneStatus.AVAILABLE, Validators.required],
    purchaseDate: [null as Date | null],
    supplierId: [null as string | null],
    notes: ['', Validators.maxLength(this.constraints.NOTES_MAX)],
    description: ['', Validators.maxLength(this.constraints.DESCRIPTION_MAX)]
  });

  ngOnInit(): void {
    this.phoneId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.phoneId;

    this.form.get('condition')?.valueChanges.subscribe((condition: PhoneCondition) => {
      const shouldShow = condition === PhoneCondition.USED || condition === PhoneCondition.REFURBISHED;
      this.showBatteryHealth.set(shouldShow);
      if (!shouldShow) {
        this.form.get('batteryHealth')?.setValue(null);
      }
    });

    this.loadInitialData();
  }

  private async loadInitialData(): Promise<void> {
    this.loading.set(true);
    try {
      const [brands, suppliers] = await Promise.all([
        this.brandService.getBrands(),
        this.supplierService.getSuppliers()
      ]);

      this.brands.set(brands);
      this.brandSuggestions.set(brands.map(b => ({
        id: b.id,
        name: b.name,
        logoUrl: b.logoUrl
      })));
      this.suppliers.set(suppliers.data);

      if (this.isEdit && this.phoneId) {
        await this.loadPhone(this.phoneId);
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to load form data');
      console.error('Failed to load initial data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadPhone(id: string): Promise<void> {
    const phone = await this.phoneService.getPhoneById(id);
    if (!phone) {
      this.toastService.error('Error', 'Phone not found');
      this.router.navigate(['/admin/inventory']);
      return;
    }

    const brand = this.brands().find(b => b.id === phone.brandId);

    const shouldShowBatteryHealth = phone.condition === PhoneCondition.USED || phone.condition === PhoneCondition.REFURBISHED;
    this.showBatteryHealth.set(shouldShowBatteryHealth);

    this.form.patchValue({
      brand: brand || null,
      model: phone.model,
      storageGb: phone.storageGb,
      ramGb: phone.ramGb,
      color: phone.color || '',
      condition: phone.condition,
      batteryHealth: phone.batteryHealth,
      imei: phone.imei || '',
      costPrice: phone.costPrice,
      sellingPrice: phone.sellingPrice,
      status: phone.status,
      purchaseDate: phone.purchaseDate ? new Date(phone.purchaseDate) : null,
      supplierId: phone.supplierId,
      notes: phone.notes || '',
      description: phone.description || ''
    });
  }

  searchBrands(event: AutoCompleteCompleteEvent): void {
    const query = event.query.trim();
    this.lastSearchQuery = query;

    if (!query) {
      this.brandSuggestions.set(this.brands().map(b => ({
        id: b.id,
        name: b.name,
        logoUrl: b.logoUrl
      })));
      return;
    }

    const queryLower = query.toLowerCase();
    const filteredBrands = this.brands()
      .filter(brand => brand.name.toLowerCase().includes(queryLower))
      .map(b => ({
        id: b.id,
        name: b.name,
        logoUrl: b.logoUrl
      }));

    const exactMatch = this.brands().some(b => b.name.toLowerCase() === queryLower);

    if (!exactMatch && query.length > 0) {
      this.brandSuggestions.set([
        ...filteredBrands,
        { name: query, isCreateNew: true }
      ]);
    } else {
      this.brandSuggestions.set(filteredBrands);
    }
  }

  onBrandDialogShow(): void {
    this.focusService.saveTriggerElement();
  }

  onBrandDialogHide(): void {
    this.focusService.restoreFocus();
  }

  onBrandSelect(event: AutoCompleteSelectEvent): void {
    const selected = event.value as BrandSuggestion;

    if (selected.isCreateNew) {
      this.pendingBrandName = selected.name;
      this.showCreateBrandDialog = true;
      this.form.get('brand')?.setValue(null);
    }
  }

  async confirmCreateBrand(): Promise<void> {
    if (!this.pendingBrandName.trim()) return;

    this.creatingBrand.set(true);
    try {
      const newBrand = await this.brandService.createBrand({
        name: this.pendingBrandName.trim()
      });

      this.brands.update(brands => [...brands, newBrand].sort((a, b) => a.name.localeCompare(b.name)));

      this.form.get('brand')?.setValue(newBrand);

      this.toastService.success('Success', `Brand "${newBrand.name}" created successfully`);
      this.showCreateBrandDialog = false;
      this.pendingBrandName = '';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create brand';
      this.toastService.error('Error', message);
    } finally {
      this.creatingBrand.set(false);
    }
  }

  cancelCreateBrand(): void {
    this.showCreateBrandDialog = false;
    this.pendingBrandName = '';
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    try {
      const formValue = this.form.value;
      const selectedBrand = formValue.brand as Brand;

      if (this.isEdit && this.phoneId) {
        const updateRequest: UpdatePhoneRequest = {
          brandId: selectedBrand.id,
          model: this.sanitizer.sanitize(formValue.model),
          storageGb: formValue.storageGb,
          ramGb: formValue.ramGb,
          color: this.sanitizer.sanitizeOrNull(formValue.color),
          condition: formValue.condition,
          batteryHealth: this.showBatteryHealth() ? formValue.batteryHealth : null,
          imei: this.sanitizer.sanitizeOrNull(formValue.imei),
          costPrice: formValue.costPrice,
          sellingPrice: formValue.sellingPrice,
          status: formValue.status,
          purchaseDate: formValue.purchaseDate ? this.formatDate(formValue.purchaseDate) : null,
          supplierId: formValue.supplierId || null,
          notes: this.sanitizer.sanitizeOrNull(formValue.notes),
          description: this.sanitizer.sanitizeOrNull(formValue.description)
        };

        await this.phoneService.updatePhone(this.phoneId, updateRequest);
        this.toastService.success('Success', 'Phone updated successfully');
      } else {
        const createRequest: CreatePhoneRequest = {
          brandId: selectedBrand.id,
          model: this.sanitizer.sanitize(formValue.model),
          storageGb: formValue.storageGb,
          ramGb: formValue.ramGb,
          color: this.sanitizer.sanitizeOrNull(formValue.color),
          condition: formValue.condition,
          batteryHealth: this.showBatteryHealth() ? formValue.batteryHealth : null,
          imei: this.sanitizer.sanitizeOrNull(formValue.imei),
          costPrice: formValue.costPrice,
          sellingPrice: formValue.sellingPrice,
          status: formValue.status,
          purchaseDate: formValue.purchaseDate ? this.formatDate(formValue.purchaseDate) : null,
          supplierId: formValue.supplierId || null,
          notes: this.sanitizer.sanitizeOrNull(formValue.notes),
          description: this.sanitizer.sanitizeOrNull(formValue.description)
        };

        await this.phoneService.createPhone(createRequest);
        this.toastService.success('Success', 'Phone added successfully');
      }

      this.router.navigate(['/admin/inventory']);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      this.toastService.error('Error', message);
      console.error('Failed to save phone:', error);
    } finally {
      this.submitting.set(false);
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/inventory']);
  }

  onImagesChanged(images: PhoneImage[]): void {
    console.log('Images updated:', images.length);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
