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
import { RadioButtonModule } from 'primeng/radiobutton';
import { MessageModule } from 'primeng/message';
import { ChipModule } from 'primeng/chip';
import { PhoneService } from '../../../../core/services/phone.service';
import { PhoneImageService } from '../../../../core/services/phone-image.service';
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
import { PhoneCondition, PhoneConditionLabels, PhoneStatus, PhoneStatusLabels, PtaStatus, PtaStatusLabels } from '../../../../enums';
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
    RadioButtonModule,
    MessageModule,
    ChipModule,
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
  private phoneImageService = inject(PhoneImageService);

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

  ptaStatusOptions = [
    { label: PtaStatusLabels[PtaStatus.PTA_APPROVED], value: PtaStatus.PTA_APPROVED },
    { label: PtaStatusLabels[PtaStatus.NON_PTA], value: PtaStatus.NON_PTA }
  ];

  statusOptions: DropdownOption<PhoneStatus>[] = Object.values(PhoneStatus).map(value => ({
    label: PhoneStatusLabels[value],
    value
  }));

  /** Validation constraints for phone form fields (F-058: Input Sanitization) */
  readonly constraints = PHONE_CONSTRAINTS;

  // Dynamic quick options from GSMArena (start empty, populate on fetch)
  ramQuickOptions = signal<number[]>([]);
  storageQuickOptions = signal<number[]>([]);
  colorSuggestions = signal<string[]>([]);

  fetchingSpecs = signal(false);
  specsFetched = signal(false);
  specsError = signal<string | null>(null);

  // Fallback options (only used if API returns empty or fails)
  private readonly FALLBACK_RAM = [6, 8, 12, 16];
  private readonly FALLBACK_STORAGE = [128, 256, 512];

  recentSuppliers = signal<Supplier[]>([]);

  pendingImages = signal<File[]>([]);
  isUploadingImages = signal(false);
  pendingImagePreviews = signal<string[]>([]);

  form: FormGroup = this.fb.group({
    brand: [null as Brand | null, Validators.required],
    model: ['', [Validators.required, Validators.maxLength(this.constraints.MODEL_MAX)]],
    storageGb: [null as number | null],
    ramGb: [null as number | null],
    color: ['', Validators.maxLength(this.constraints.COLOR_MAX)],
    condition: [PhoneCondition.NEW, Validators.required],
    conditionRating: [null as number | null, [Validators.min(1), Validators.max(10)]],
    ptaStatus: [null as PtaStatus | null],
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
      const shouldShow = condition === PhoneCondition.USED || condition === PhoneCondition.OPEN_BOX;
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

      // Get last 2 distinct suppliers from recent phones
      if (suppliers.data.length > 0) {
        this.recentSuppliers.set(suppliers.data.slice(0, 2));
      }

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

    const shouldShowBatteryHealth = phone.condition === PhoneCondition.USED || phone.condition === PhoneCondition.OPEN_BOX;
    this.showBatteryHealth.set(shouldShowBatteryHealth);

    this.form.patchValue({
      brand: brand || null,
      model: phone.model,
      storageGb: phone.storageGb,
      ramGb: phone.ramGb,
      color: phone.color || '',
      condition: phone.condition,
      conditionRating: phone.conditionRating,
      ptaStatus: phone.ptaStatus,
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

  setRam(value: number): void {
    this.form.get('ramGb')?.setValue(value);
  }

  setStorage(value: number): void {
    this.form.get('storageGb')?.setValue(value);
  }

  setColor(value: string): void {
    this.form.get('color')?.setValue(value);
  }

  setSupplier(id: string): void {
    this.form.get('supplierId')?.setValue(id);
  }

  /**
   * Fetch phone specifications from GSMArena
   * Triggered when user clicks "Fetch Information" button
   */
  async fetchPhoneSpecs(): Promise<void> {
    const brand = this.form.get('brand')?.value;
    const model = this.form.get('model')?.value;

    // Validation
    if (!brand || !brand.name) {
      this.toastService.warn('Brand Required', 'Please select a brand first');
      return;
    }

    if (!model || model.trim().length === 0) {
      this.toastService.warn('Model Required', 'Please enter a phone model');
      return;
    }

    this.fetchingSpecs.set(true);
    this.specsError.set(null);
    this.specsFetched.set(false);

    try {
      const result = await this.phoneService.fetchPhoneSpecs(brand.name, model.trim());

      if (result.success && result.data) {
        // Update quick options with fetched data OR fallback if empty
        const ramOptions = result.data.ram.length > 0 ? result.data.ram : this.FALLBACK_RAM;
        const storageOptions = result.data.storage.length > 0 ? result.data.storage : this.FALLBACK_STORAGE;
        const colorOptions = result.data.colors.length > 0 ? result.data.colors : [];

        this.ramQuickOptions.set(ramOptions);
        this.storageQuickOptions.set(storageOptions);
        this.colorSuggestions.set(colorOptions);

        this.specsFetched.set(true);

        const specsCount = result.data.ram.length + result.data.storage.length + result.data.colors.length;
        if (specsCount > 0) {
          this.toastService.success(
            'Specs Loaded!',
            `Found ${specsCount} specifications from ${result.source || 'GSMArena'}`
          );
        } else {
          this.toastService.info(
            'Partial Data',
            'Some specifications not found. Using fallback options.'
          );
        }
      } else {
        // API failed - use fallback options
        this.ramQuickOptions.set(this.FALLBACK_RAM);
        this.storageQuickOptions.set(this.FALLBACK_STORAGE);
        this.colorSuggestions.set([]);

        this.specsError.set(result.error || 'No specifications found');
        this.toastService.warn('Not Found', result.error || 'Could not find phone specifications. Using fallback options.');
      }
    } catch (error) {
      // Exception - use fallback options
      this.ramQuickOptions.set(this.FALLBACK_RAM);
      this.storageQuickOptions.set(this.FALLBACK_STORAGE);
      this.colorSuggestions.set([]);

      const errorMsg = error instanceof Error ? error.message : 'An error occurred';
      this.specsError.set(errorMsg);
      this.toastService.error('Error', 'Failed to fetch specifications. Using fallback options.');
    } finally {
      this.fetchingSpecs.set(false);
    }
  }

  onPendingImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files).filter(f =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
    );

    this.pendingImages.update(existing => [...existing, ...files]);

    // Generate previews
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.pendingImagePreviews.update(previews => [...previews, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    }

    input.value = ''; // Reset input
  }

  removePendingImage(index: number): void {
    this.pendingImages.update(files => files.filter((_, i) => i !== index));
    this.pendingImagePreviews.update(previews => previews.filter((_, i) => i !== index));
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
          conditionRating: formValue.conditionRating,
          ptaStatus: formValue.ptaStatus,
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
          conditionRating: formValue.conditionRating,
          ptaStatus: formValue.ptaStatus,
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

        const createdPhone = await this.phoneService.createPhone(createRequest);
        this.toastService.success('Success', 'Phone added successfully');

        // Upload pending images if any
        if (this.pendingImages().length > 0 && createdPhone?.id) {
          this.isUploadingImages.set(true);
          try {
            for (const file of this.pendingImages()) {
              await this.phoneImageService.uploadImage(createdPhone.id, file);
            }
            this.toastService.success('Images Uploaded', `${this.pendingImages().length} image(s) uploaded successfully`);
          } catch (imgError) {
            console.error('Failed to upload images:', imgError);
            this.toastService.warn('Image Upload Issue', 'Phone was saved but some images failed to upload. You can add them by editing the phone.');
          } finally {
            this.isUploadingImages.set(false);
          }
        }
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
