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
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { PhoneService } from '../../../../core/services/phone.service';
import { BrandService } from '../../../../core/services/brand.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { InputSanitizationService } from '../../../../core/services/input-sanitization.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';
import { TaxCalculationService } from '../../../../core/services/tax-calculation.service';
import { Brand } from '../../../../models/brand.model';
import { Supplier } from '../../../../models/supplier.model';
import { CreatePhoneRequest, UpdatePhoneRequest } from '../../../../models/phone.model';
import { PhoneImage } from '../../../../models/phone-image.model';
import { PhoneCondition, PhoneConditionLabels, PhoneStatus, PhoneStatusLabels } from '../../../../enums';
import { PhoneImageUploadComponent } from '../phone-image-upload/phone-image-upload.component';
import { PHONE_CONSTRAINTS } from '../../../../constants/validation.constants';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';

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
    CheckboxModule,
    MessageModule,
    PhoneImageUploadComponent,
    AppCurrencyPipe
  ],
  templateUrl: './inventory-form.component.html'
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
  private taxCalcService = inject(TaxCalculationService);

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

  /**
   * Computes tax preview based on current form values
   * Feature: F-012 Tax Calculation and Compliance
   */
  taxPreview = computed(() => {
    const sellingPrice = this.form?.get('sellingPrice')?.value;
    const taxRate = this.form?.get('taxRate')?.value;
    const isTaxInclusive = this.form?.get('isTaxInclusive')?.value;
    const isTaxExempt = this.form?.get('isTaxExempt')?.value;

    if (!sellingPrice || sellingPrice <= 0) {
      return null;
    }

    if (isTaxExempt) {
      return {
        basePrice: sellingPrice,
        taxAmount: 0,
        totalPrice: sellingPrice
      };
    }

    const calc = this.taxCalcService.calculateItemTax(
      sellingPrice,
      taxRate || 0,
      isTaxInclusive || false,
      false,
      1
    );

    return {
      basePrice: calc.basePrice,
      taxAmount: calc.taxAmount,
      totalPrice: calc.totalPrice
    };
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
    description: ['', Validators.maxLength(this.constraints.DESCRIPTION_MAX)],
    // Tax configuration fields (F-012)
    taxRate: [0, [Validators.min(0), Validators.max(100)]],
    isTaxInclusive: [false],
    isTaxExempt: [false]
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
      description: phone.description || '',
      // Tax configuration fields (F-012)
      taxRate: phone.taxRate ?? 0,
      isTaxInclusive: phone.isTaxInclusive ?? false,
      isTaxExempt: phone.isTaxExempt ?? false
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
          description: this.sanitizer.sanitizeOrNull(formValue.description),
          // Tax configuration fields (F-012)
          taxRate: formValue.isTaxExempt ? 0 : (formValue.taxRate ?? 0),
          isTaxInclusive: formValue.isTaxInclusive ?? false,
          isTaxExempt: formValue.isTaxExempt ?? false
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
          description: this.sanitizer.sanitizeOrNull(formValue.description),
          // Tax configuration fields (F-012)
          taxRate: formValue.isTaxExempt ? 0 : (formValue.taxRate ?? 0),
          isTaxInclusive: formValue.isTaxInclusive ?? false,
          isTaxExempt: formValue.isTaxExempt ?? false
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
