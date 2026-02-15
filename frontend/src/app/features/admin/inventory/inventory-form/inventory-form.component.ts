import { Component, OnInit, signal, computed, input, output } from '@angular/core';
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
import { SelectButtonModule } from 'primeng/selectbutton';
import { ProductService } from '../../../../core/services/product.service';
import { ProductImageService } from '../../../../core/services/product-image.service';
import { BrandService } from '../../../../core/services/brand.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { InputSanitizationService } from '../../../../core/services/input-sanitization.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';
import { Brand } from '../../../../models/brand.model';
import { Supplier } from '../../../../models/supplier.model';
import { CreateProductRequest, UpdateProductRequest } from '../../../../models/product.model';
import { ProductImage } from '../../../../models/product-image.model';
import { ProductCondition, ProductConditionLabels, ProductStatus, ProductStatusLabels, PtaStatus, PtaStatusLabels, ProductType } from '../../../../enums';
import { ProductImageUploadComponent } from '../product-image-upload/product-image-upload.component';
import { PRODUCT_CONSTRAINTS } from '../../../../constants/validation.constants';
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
    SelectButtonModule,
    ProductImageUploadComponent,
    AppCurrencyPipe
  ],
  templateUrl: './inventory-form.component.html',
  styles: [`
    :host ::ng-deep {
      input::placeholder,
      textarea::placeholder {
        color: var(--p-text-muted-color, #b0b0b0) !important;
        opacity: 0.6 !important;
      }
      .p-inputnumber input::placeholder {
        color: var(--p-text-muted-color, #b0b0b0) !important;
        opacity: 0.6 !important;
      }
      .p-select-label.p-placeholder {
        color: var(--p-text-muted-color, #b0b0b0) !important;
        opacity: 0.6 !important;
      }
    }
  `]
})
export class InventoryFormComponent implements OnInit {
  dialogMode = input(false);
  dialogProductId = input<string | null>(null);
  saved = output<void>();
  cancelled = output<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private productService: ProductService,
    private brandService: BrandService,
    private supplierService: SupplierService,
    private sanitizer: InputSanitizationService,
    private toastService: ToastService,
    private focusService: FocusManagementService,
    private productImageService: ProductImageService
  ) { }

  isEdit = false;
  productId: string | null = null;
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

  conditionOptions: DropdownOption<ProductCondition>[] = Object.values(ProductCondition).map(value => ({
    label: ProductConditionLabels[value],
    value
  }));

  ptaStatusOptions = [
    { label: PtaStatusLabels[PtaStatus.PTA_APPROVED], value: PtaStatus.PTA_APPROVED },
    { label: PtaStatusLabels[PtaStatus.NON_PTA], value: PtaStatus.NON_PTA }
  ];

  statusOptions: DropdownOption<ProductStatus>[] = Object.values(ProductStatus).map(value => ({
    label: ProductStatusLabels[value],
    value
  }));

  productTypeOptions = [
    { label: 'Phone', value: ProductType.PHONE },
    { label: 'Accessory', value: ProductType.ACCESSORY },
    { label: 'Tablet', value: ProductType.TABLET },
    { label: 'Laptop', value: ProductType.LAPTOP }
  ];

  accessoryCategoryOptions = [
    { label: 'Case', value: 'Case' },
    { label: 'Charger', value: 'Charger' },
    { label: 'Earbuds', value: 'Earbuds' },
    { label: 'Screen Protector', value: 'Screen Protector' },
    { label: 'Cable', value: 'Cable' },
    { label: 'Adapter', value: 'Adapter' },
    { label: 'Stand', value: 'Stand' },
    { label: 'Other', value: 'Other' }
  ];

  /** Validation constraints for product form fields (F-058: Input Sanitization) */
  readonly constraints = PRODUCT_CONSTRAINTS;

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
    productType: [ProductType.PHONE],
    brand: [null as Brand | null, Validators.required],
    model: ['', [Validators.required, Validators.maxLength(this.constraints.MODEL_MAX)]],
    storageGb: [null as number | null],
    ramGb: [null as number | null],
    color: ['', Validators.maxLength(this.constraints.COLOR_MAX)],
    condition: [ProductCondition.NEW, Validators.required],
    conditionRating: [null as number | null, [Validators.min(1), Validators.max(10)]],
    ptaStatus: [null as PtaStatus | null],
    batteryHealth: [null as number | null, [Validators.min(this.constraints.BATTERY_HEALTH_MIN), Validators.max(this.constraints.BATTERY_HEALTH_MAX)]],
    imei: ['', Validators.maxLength(this.constraints.IMEI_MAX)],
    costPrice: [null as number | null, [Validators.required, Validators.min(0)]],
    sellingPrice: [null as number | null, [Validators.required, Validators.min(0)]],
    status: [ProductStatus.AVAILABLE, Validators.required],
    purchaseDate: [null as Date | null],
    supplierId: [null as string | null],
    notes: ['', Validators.maxLength(this.constraints.NOTES_MAX)],
    description: ['', Validators.maxLength(this.constraints.DESCRIPTION_MAX)],
    // Tax configuration fields (F-012)
    taxRate: [0, [Validators.min(0), Validators.max(100)]],
    isTaxInclusive: [false],
    isTaxExempt: [false],
    isFeatured: [false]
  });

  ngOnInit(): void {
    if (this.dialogMode()) {
      this.productId = this.dialogProductId();
    } else {
      this.productId = this.route.snapshot.paramMap.get('id');
    }
    this.isEdit = !!this.productId;

    this.form.get('condition')?.valueChanges.subscribe((condition: ProductCondition) => {
      const shouldShow = condition === ProductCondition.USED || condition === ProductCondition.OPEN_BOX;
      this.showBatteryHealth.set(shouldShow);
      if (!shouldShow) {
        this.form.get('batteryHealth')?.setValue(null);
      }
    });

    // Initialize phone-specific controls since default type is PHONE
    this.onProductTypeChange();

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

      // Get last 2 distinct suppliers from recent products
      if (suppliers.data.length > 0) {
        this.recentSuppliers.set(suppliers.data.slice(0, 2));
      }

      if (this.isEdit && this.productId) {
        await this.loadProduct(this.productId);
      }
    } catch (error) {
      this.toastService.error('Error', 'Failed to load form data');
      console.error('Failed to load initial data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadProduct(id: string): Promise<void> {
    const product = await this.productService.getProductById(id);
    if (!product) {
      this.toastService.error('Error', 'Product not found');
      this.router.navigate(['/admin/inventory']);
      return;
    }

    const brand = this.brands().find(b => b.id === product.brandId);

    const shouldShowBatteryHealth = product.condition === ProductCondition.USED || product.condition === ProductCondition.OPEN_BOX;
    this.showBatteryHealth.set(shouldShowBatteryHealth);

    // Set product type first so the correct fields are added
    this.form.get('productType')?.setValue(product.productType || ProductType.PHONE);
    this.onProductTypeChange();

    this.form.patchValue({
      brand: brand || null,
      model: product.model,
      storageGb: product.storageGb,
      ramGb: product.ramGb,
      color: product.color || '',
      condition: product.condition,
      conditionRating: product.conditionRating,
      ptaStatus: product.ptaStatus,
      batteryHealth: product.batteryHealth,
      imei: product.imei || '',
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      status: product.status,
      purchaseDate: product.purchaseDate ? new Date(product.purchaseDate) : null,
      supplierId: product.supplierId,
      notes: product.notes || '',
      description: product.description || '',
      // Tax configuration fields (F-012)
      taxRate: product.taxRate ?? 0,
      isTaxInclusive: product.isTaxInclusive ?? false,
      isTaxExempt: product.isTaxExempt ?? false,
      isFeatured: product.isFeatured ?? false
    });

    // Patch accessory-specific fields if applicable
    if (product.productType === ProductType.ACCESSORY) {
      this.form.patchValue({
        accessoryCategory: product.accessoryCategory || null,
        compatibleModels: product.compatibleModels || [],
        material: product.material || '',
        warrantyMonths: product.warrantyMonths,
        weightGrams: product.weightGrams,
        dimensions: product.dimensions || ''
      });
    }
  }

  /**
   * Handle product type change - add/remove type-specific form controls
   */
  onProductTypeChange(): void {
    const productType = this.form.get('productType')?.value;

    // Phone-specific control names
    const phoneControls = ['storageGb', 'ramGb', 'imei', 'batteryHealth', 'conditionRating', 'ptaStatus'];
    // Accessory-specific control names
    const accessoryControls = ['accessoryCategory', 'compatibleModels', 'material', 'warrantyMonths', 'weightGrams', 'dimensions'];

    if (productType === ProductType.PHONE) {
      // Add phone-specific controls if not present
      if (!this.form.get('storageGb')) {
        this.form.addControl('storageGb', this.fb.control(null as number | null));
      }
      if (!this.form.get('ramGb')) {
        this.form.addControl('ramGb', this.fb.control(null as number | null));
      }
      if (!this.form.get('imei')) {
        this.form.addControl('imei', this.fb.control('', Validators.maxLength(this.constraints.IMEI_MAX)));
      }
      if (!this.form.get('batteryHealth')) {
        this.form.addControl('batteryHealth', this.fb.control(null as number | null, [Validators.min(this.constraints.BATTERY_HEALTH_MIN), Validators.max(this.constraints.BATTERY_HEALTH_MAX)]));
      }
      if (!this.form.get('conditionRating')) {
        this.form.addControl('conditionRating', this.fb.control(null as number | null, [Validators.min(1), Validators.max(10)]));
      }
      if (!this.form.get('ptaStatus')) {
        this.form.addControl('ptaStatus', this.fb.control(null as PtaStatus | null));
      }

      // Remove accessory controls
      accessoryControls.forEach(ctrl => {
        if (this.form.get(ctrl)) {
          this.form.removeControl(ctrl);
        }
      });
    } else if (productType === ProductType.ACCESSORY) {
      // Add accessory-specific controls if not present
      if (!this.form.get('accessoryCategory')) {
        this.form.addControl('accessoryCategory', this.fb.control(null as string | null));
      }
      if (!this.form.get('compatibleModels')) {
        this.form.addControl('compatibleModels', this.fb.control([] as string[]));
      }
      if (!this.form.get('material')) {
        this.form.addControl('material', this.fb.control(''));
      }
      if (!this.form.get('warrantyMonths')) {
        this.form.addControl('warrantyMonths', this.fb.control(null as number | null, [Validators.min(0)]));
      }
      if (!this.form.get('weightGrams')) {
        this.form.addControl('weightGrams', this.fb.control(null as number | null, [Validators.min(0)]));
      }
      if (!this.form.get('dimensions')) {
        this.form.addControl('dimensions', this.fb.control(''));
      }

      // Remove phone-specific controls
      phoneControls.forEach(ctrl => {
        if (this.form.get(ctrl)) {
          this.form.removeControl(ctrl);
        }
      });
    } else {
      // Other types (tablet, laptop) - remove both sets for now
      phoneControls.forEach(ctrl => {
        if (this.form.get(ctrl)) {
          this.form.removeControl(ctrl);
        }
      });
      accessoryControls.forEach(ctrl => {
        if (this.form.get(ctrl)) {
          this.form.removeControl(ctrl);
        }
      });
    }
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
   * Fetch product specifications from GSMArena
   * Triggered when user clicks "Fetch Information" button
   */
  async fetchProductSpecs(): Promise<void> {
    const brand = this.form.get('brand')?.value;
    const model = this.form.get('model')?.value;

    // Validation
    if (!brand || !brand.name) {
      this.toastService.warn('Brand Required', 'Please select a brand first');
      return;
    }

    if (!model || model.trim().length === 0) {
      this.toastService.warn('Model Required', 'Please enter a model name');
      return;
    }

    this.fetchingSpecs.set(true);
    this.specsError.set(null);
    this.specsFetched.set(false);

    try {
      const result = await this.productService.fetchProductSpecs(brand.name, model.trim());

      if (result.success && result.data) {
        // Update quick options with fetched data OR fallback if empty
        const ramOptions = result.data.ram.length > 0 ? result.data.ram : this.FALLBACK_RAM;
        const storageOptions = result.data.storage.length > 0 ? result.data.storage : this.FALLBACK_STORAGE;
        const colorOptions = result.data.colors.length > 0 ? result.data.colors : [];

        this.ramQuickOptions.set(ramOptions);
        this.storageQuickOptions.set(storageOptions);
        this.colorSuggestions.set(colorOptions);

        // Update model name with canonical name from GSMArena
        if (result.data.modelName) {
          this.form.get('model')?.setValue(result.data.modelName);
        }

        // Auto-apply single results
        if (ramOptions.length === 1) {
          this.setRam(ramOptions[0]);
        }
        if (storageOptions.length === 1) {
          this.setStorage(storageOptions[0]);
        }
        if (colorOptions.length === 1) {
          this.setColor(colorOptions[0]);
        }

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
        this.toastService.warn('Not Found', result.error || 'Could not find specifications. Using fallback options.');
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
      const productType = formValue.productType as ProductType;

      if (this.isEdit && this.productId) {
        const updateRequest: UpdateProductRequest = {
          brandId: selectedBrand.id,
          model: this.sanitizer.sanitize(formValue.model),
          color: this.sanitizer.sanitizeOrNull(formValue.color),
          condition: formValue.condition,
          costPrice: formValue.costPrice,
          sellingPrice: formValue.sellingPrice,
          status: formValue.status,
          purchaseDate: formValue.purchaseDate ? this.formatDate(formValue.purchaseDate) : null,
          supplierId: formValue.supplierId || null,
          notes: this.sanitizer.sanitizeOrNull(formValue.notes),
          description: this.sanitizer.sanitizeOrNull(formValue.description),
          taxRate: 0,
          isTaxInclusive: false,
          isTaxExempt: true,
          productType,
          isFeatured: formValue.isFeatured ?? false
        };

        // Add phone-specific fields
        if (productType === ProductType.PHONE) {
          updateRequest.storageGb = formValue.storageGb;
          updateRequest.ramGb = formValue.ramGb;
          updateRequest.conditionRating = formValue.conditionRating;
          updateRequest.ptaStatus = formValue.ptaStatus;
          updateRequest.batteryHealth = this.showBatteryHealth() ? formValue.batteryHealth : null;
          updateRequest.imei = this.sanitizer.sanitizeOrNull(formValue.imei);
        }

        // Add accessory-specific fields
        if (productType === ProductType.ACCESSORY) {
          updateRequest.accessoryCategory = formValue.accessoryCategory || null;
          updateRequest.compatibleModels = formValue.compatibleModels || null;
          updateRequest.material = this.sanitizer.sanitizeOrNull(formValue.material);
          updateRequest.warrantyMonths = formValue.warrantyMonths;
          updateRequest.weightGrams = formValue.weightGrams;
          updateRequest.dimensions = this.sanitizer.sanitizeOrNull(formValue.dimensions);
        }

        await this.productService.updateProduct(this.productId, updateRequest);
        this.toastService.success('Success', 'Product updated successfully');
      } else {
        const createRequest: CreateProductRequest = {
          brandId: selectedBrand.id,
          model: this.sanitizer.sanitize(formValue.model),
          color: this.sanitizer.sanitizeOrNull(formValue.color),
          condition: formValue.condition,
          costPrice: formValue.costPrice,
          sellingPrice: formValue.sellingPrice,
          status: formValue.status,
          purchaseDate: formValue.purchaseDate ? this.formatDate(formValue.purchaseDate) : null,
          supplierId: formValue.supplierId || null,
          notes: this.sanitizer.sanitizeOrNull(formValue.notes),
          description: this.sanitizer.sanitizeOrNull(formValue.description),
          taxRate: 0,
          isTaxInclusive: false,
          isTaxExempt: true,
          productType,
          isFeatured: formValue.isFeatured ?? false
        };

        // Add phone-specific fields
        if (productType === ProductType.PHONE) {
          createRequest.storageGb = formValue.storageGb;
          createRequest.ramGb = formValue.ramGb;
          createRequest.conditionRating = formValue.conditionRating;
          createRequest.ptaStatus = formValue.ptaStatus;
          createRequest.batteryHealth = this.showBatteryHealth() ? formValue.batteryHealth : null;
          createRequest.imei = this.sanitizer.sanitizeOrNull(formValue.imei);
        }

        // Add accessory-specific fields
        if (productType === ProductType.ACCESSORY) {
          createRequest.accessoryCategory = formValue.accessoryCategory || null;
          createRequest.compatibleModels = formValue.compatibleModels || null;
          createRequest.material = this.sanitizer.sanitizeOrNull(formValue.material);
          createRequest.warrantyMonths = formValue.warrantyMonths;
          createRequest.weightGrams = formValue.weightGrams;
          createRequest.dimensions = this.sanitizer.sanitizeOrNull(formValue.dimensions);
        }

        const createdProduct = await this.productService.createProduct(createRequest);
        this.toastService.success('Success', 'Product added successfully');

        // Upload pending images if any
        if (this.pendingImages().length > 0 && createdProduct?.id) {
          this.isUploadingImages.set(true);
          try {
            for (const file of this.pendingImages()) {
              await this.productImageService.uploadImage(createdProduct.id, file);
            }
            this.toastService.success('Images Uploaded', `${this.pendingImages().length} image(s) uploaded successfully`);
          } catch (imgError) {
            console.error('Failed to upload images:', imgError);
            this.toastService.warn('Image Upload Issue', 'Product was saved but some images failed to upload. You can add them by editing the product.');
          } finally {
            this.isUploadingImages.set(false);
          }
        }
      }

      if (this.dialogMode()) {
        this.saved.emit();
      } else {
        this.router.navigate(['/admin/inventory']);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      this.toastService.error('Error', message);
      console.error('Failed to save product:', error);
    } finally {
      this.submitting.set(false);
    }
  }

  onCancel(): void {
    if (this.dialogMode()) {
      this.cancelled.emit();
    } else {
      this.router.navigate(['/admin/inventory']);
    }
  }

  onImagesChanged(images: ProductImage[]): void {
    console.log('Images updated:', images.length);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
