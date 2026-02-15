import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { ConfirmationService } from 'primeng/api';

import { InventoryFormComponent } from './inventory-form.component';
import { ProductService } from '../../../../core/services/product.service';
import { BrandService } from '../../../../core/services/brand.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { InputSanitizationService } from '../../../../core/services/input-sanitization.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';
import { ConfirmDialogService } from '../../../../shared/services/confirmation.service';
import { ProductImageService } from '../../../../core/services/product-image.service';
import { Product } from '../../../../models/product.model';
import { Brand } from '../../../../models/brand.model';
import { Supplier } from '../../../../models/supplier.model';
import { ProductStatus } from '../../../../enums/product-status.enum';
import { ProductCondition } from '../../../../enums/product-condition.enum';

describe('InventoryFormComponent', () => {
  let component: InventoryFormComponent;
  let fixture: ComponentFixture<InventoryFormComponent>;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockBrandService: jasmine.SpyObj<BrandService>;
  let mockSupplierService: jasmine.SpyObj<SupplierService>;
  let mockSanitizer: jasmine.SpyObj<InputSanitizationService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockFocusService: jasmine.SpyObj<FocusManagementService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSupabaseService: any;
  let mockConfirmDialogService: jasmine.SpyObj<ConfirmDialogService>;
  let mockProductImageService: jasmine.SpyObj<ProductImageService>;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationService>;

  const mockBrands: Brand[] = [
    { id: 'brand-1', name: 'Apple', logoUrl: 'https://example.com/apple.png', createdAt: '2024-01-01T00:00:00Z', updatedAt: null },
    { id: 'brand-2', name: 'Samsung', logoUrl: null, createdAt: '2024-01-01T00:00:00Z', updatedAt: null }
  ];

  const mockSuppliers: Supplier[] = [
    { id: 'supplier-1', name: 'TechSupply Co', contactPerson: 'John Doe', contactEmail: 'john@techsupply.com', contactPhone: '555-0100', address: '123 Tech St', notes: null, createdAt: '2024-01-01T00:00:00Z', updatedAt: null },
    { id: 'supplier-2', name: 'Mobile Parts Inc', contactPerson: 'Jane Smith', contactEmail: 'jane@mobileparts.com', contactPhone: '555-0200', address: '456 Mobile Ave', notes: null, createdAt: '2024-01-01T00:00:00Z', updatedAt: null }
  ];

  const mockProduct: Product = {
    id: 'phone-1',
    brandId: 'brand-1',
    brandName: 'Apple',
    brandLogoUrl: 'https://example.com/apple.png',
    model: 'iPhone 15 Pro',
    description: 'Test description',
    storageGb: 256,
    ramGb: 8,
    color: 'Space Black',
    condition: ProductCondition.NEW,
    batteryHealth: null,
    imei: '123456789012345',
    costPrice: 900,
    sellingPrice: 1200,
    profitMargin: 25,
    status: ProductStatus.AVAILABLE,
    purchaseDate: '2024-01-15',
    supplierId: 'supplier-1',
    supplierName: 'TechSupply Co',
    notes: 'Test notes',
    primaryImageUrl: 'https://example.com/phone.jpg',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: null,
    taxRate: 10,
    isTaxInclusive: false,
    isTaxExempt: false
  };

  const setupTestBed = (phoneId: string | null = null) => {
    mockProductService = jasmine.createSpyObj('ProductService', ['getProductById', 'createProduct', 'updateProduct']);
    mockBrandService = jasmine.createSpyObj('BrandService', ['getBrands', 'createBrand']);
    mockSupplierService = jasmine.createSpyObj('SupplierService', ['getSuppliers']);
    mockSanitizer = jasmine.createSpyObj('InputSanitizationService', ['sanitize', 'sanitizeOrNull']);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warn']);
    mockFocusService = jasmine.createSpyObj('FocusManagementService', ['saveTriggerElement', 'restoreFocus']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockConfirmDialogService = jasmine.createSpyObj('ConfirmDialogService', ['confirmDelete', 'confirmBulkDelete', 'confirmAction']);
    mockProductImageService = jasmine.createSpyObj('ProductImageService', ['getImagesByProductId', 'uploadMultipleImages', 'reorderImages', 'setPrimary', 'deleteImage', 'validateFile']);
    mockConfirmationService = jasmine.createSpyObj('ConfirmationService', ['confirm']);

    // Setup default returns for image service
    mockProductImageService.getImagesByProductId.and.returnValue(Promise.resolve({ data: [], total: 0 }));
    mockProductImageService.validateFile.and.returnValue({ valid: true });
    mockConfirmDialogService.confirmDelete.and.returnValue(Promise.resolve(true));

    mockSupabaseService = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue(Promise.resolve({ data: [], error: null }))
      }),
      auth: {
        getSession: jasmine.createSpy('getSession').and.returnValue(Promise.resolve({ data: { session: null } })),
        onAuthStateChange: jasmine.createSpy('onAuthStateChange').and.returnValue({
          data: { subscription: { unsubscribe: jasmine.createSpy() } }
        })
      },
      storage: {
        from: jasmine.createSpy('from').and.returnValue({
          upload: jasmine.createSpy('upload').and.returnValue(Promise.resolve({ error: null })),
          getPublicUrl: jasmine.createSpy('getPublicUrl').and.returnValue({ data: { publicUrl: 'test-url' } })
        })
      }
    };

    mockBrandService.getBrands.and.returnValue(Promise.resolve(mockBrands));
    mockSupplierService.getSuppliers.and.returnValue(Promise.resolve({ data: mockSuppliers, total: 2 }));
    mockSanitizer.sanitize.and.callFake((val: string) => val.trim());
    mockSanitizer.sanitizeOrNull.and.callFake((val: string | null) => val?.trim() || null);

    return TestBed.configureTestingModule({
      imports: [
        InventoryFormComponent,
        NoopAnimationsModule,
        ReactiveFormsModule
      ],
      providers: [
        provideRouter([]),
        { provide: ProductService, useValue: mockProductService },
        { provide: BrandService, useValue: mockBrandService },
        { provide: SupplierService, useValue: mockSupplierService },
        { provide: InputSanitizationService, useValue: mockSanitizer },
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: ToastService, useValue: mockToastService },
        { provide: FocusManagementService, useValue: mockFocusService },
        { provide: Router, useValue: mockRouter },
        { provide: ConfirmDialogService, useValue: mockConfirmDialogService },
        { provide: ProductImageService, useValue: mockProductImageService },
        { provide: ConfirmationService, useValue: mockConfirmationService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(phoneId ? { id: phoneId } : {})
            }
          }
        }
      ]
    }).compileComponents();
  };

  describe('Add Mode (new phone)', () => {
    beforeEach(async () => {
      await setupTestBed(null);
      fixture = TestBed.createComponent(InventoryFormComponent);
      component = fixture.componentInstance;
    });

    describe('component initialization', () => {
      it('should create', () => {
        expect(component).toBeTruthy();
      });

      it('should initialize in add mode', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        expect(component.isEdit).toBe(false);
        expect(component.productId).toBeNull();
      }));

      it('should load brands and suppliers on init', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        expect(mockBrandService.getBrands).toHaveBeenCalled();
        expect(mockSupplierService.getSuppliers).toHaveBeenCalled();
        expect(component.brands()).toEqual(mockBrands);
        expect(component.suppliers()).toEqual(mockSuppliers);
      }));

      it('should initialize form with default values', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        expect(component.form.get('brand')?.value).toBeNull();
        expect(component.form.get('model')?.value).toBe('');
        expect(component.form.get('condition')?.value).toBe(ProductCondition.NEW);
        expect(component.form.get('status')?.value).toBe(ProductStatus.AVAILABLE);
        expect(component.form.get('costPrice')?.value).toBeNull();
        expect(component.form.get('sellingPrice')?.value).toBeNull();
      }));

      it('should display "Add Phone" title', fakeAsync(() => {
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('h1')?.textContent).toContain('Add Phone');
      }));
    });

    describe('form validation', () => {
      beforeEach(fakeAsync(() => {
        fixture.detectChanges();
        tick();
      }));

      it('should require brand field', () => {
        const brandControl = component.form.get('brand');
        brandControl?.setValue(null);
        expect(brandControl?.valid).toBe(false);

        brandControl?.setValue(mockBrands[0]);
        expect(brandControl?.valid).toBe(true);
      });

      it('should require model field', () => {
        const modelControl = component.form.get('model');
        modelControl?.setValue('');
        expect(modelControl?.valid).toBe(false);

        modelControl?.setValue('iPhone 15');
        expect(modelControl?.valid).toBe(true);
      });

      it('should enforce model max length of 150', () => {
        const modelControl = component.form.get('model');
        modelControl?.setValue('a'.repeat(151));
        expect(modelControl?.valid).toBe(false);

        modelControl?.setValue('a'.repeat(150));
        expect(modelControl?.valid).toBe(true);
      });

      it('should require condition field', () => {
        const conditionControl = component.form.get('condition');
        conditionControl?.setValue(null);
        expect(conditionControl?.valid).toBe(false);

        conditionControl?.setValue(ProductCondition.NEW);
        expect(conditionControl?.valid).toBe(true);
      });

      it('should require costPrice field', () => {
        const costPriceControl = component.form.get('costPrice');
        costPriceControl?.setValue(null);
        expect(costPriceControl?.valid).toBe(false);

        costPriceControl?.setValue(100);
        expect(costPriceControl?.valid).toBe(true);
      });

      it('should require sellingPrice field', () => {
        const sellingPriceControl = component.form.get('sellingPrice');
        sellingPriceControl?.setValue(null);
        expect(sellingPriceControl?.valid).toBe(false);

        sellingPriceControl?.setValue(150);
        expect(sellingPriceControl?.valid).toBe(true);
      });

      it('should require status field', () => {
        const statusControl = component.form.get('status');
        statusControl?.setValue(null);
        expect(statusControl?.valid).toBe(false);

        statusControl?.setValue(ProductStatus.AVAILABLE);
        expect(statusControl?.valid).toBe(true);
      });

      it('should validate battery health between 0 and 100', () => {
        const batteryControl = component.form.get('batteryHealth');

        batteryControl?.setValue(-1);
        expect(batteryControl?.valid).toBe(false);

        batteryControl?.setValue(101);
        expect(batteryControl?.valid).toBe(false);

        batteryControl?.setValue(85);
        expect(batteryControl?.valid).toBe(true);

        batteryControl?.setValue(0);
        expect(batteryControl?.valid).toBe(true);

        batteryControl?.setValue(100);
        expect(batteryControl?.valid).toBe(true);
      });

      it('should enforce notes max length of 2000', () => {
        const notesControl = component.form.get('notes');
        notesControl?.setValue('a'.repeat(2001));
        expect(notesControl?.valid).toBe(false);

        notesControl?.setValue('a'.repeat(2000));
        expect(notesControl?.valid).toBe(true);
      });

      it('should enforce description max length of 5000', () => {
        const descControl = component.form.get('description');
        descControl?.setValue('a'.repeat(5001));
        expect(descControl?.valid).toBe(false);

        descControl?.setValue('a'.repeat(5000));
        expect(descControl?.valid).toBe(true);
      });

      it('should invalidate form when required fields are empty', () => {
        expect(component.form.valid).toBe(false);
      });

      it('should validate form when all required fields are filled', () => {
        component.form.patchValue({
          brand: mockBrands[0],
          model: 'iPhone 15',
          condition: ProductCondition.NEW,
          costPrice: 900,
          sellingPrice: 1200,
          status: ProductStatus.AVAILABLE
        });

        expect(component.form.valid).toBe(true);
      });
    });

    describe('battery health visibility', () => {
      beforeEach(fakeAsync(() => {
        fixture.detectChanges();
        tick();
      }));

      it('should hide battery health for NEW condition', () => {
        component.form.get('condition')?.setValue(ProductCondition.NEW);
        expect(component.showBatteryHealth()).toBe(false);
      });

      it('should show battery health for USED condition', () => {
        component.form.get('condition')?.setValue(ProductCondition.USED);
        expect(component.showBatteryHealth()).toBe(true);
      });

      it('should show battery health for REFURBISHED condition', () => {
        component.form.get('condition')?.setValue(ProductCondition.REFURBISHED);
        expect(component.showBatteryHealth()).toBe(true);
      });

      it('should clear battery health when condition changes to NEW', () => {
        component.form.get('condition')?.setValue(ProductCondition.USED);
        component.form.get('batteryHealth')?.setValue(85);

        component.form.get('condition')?.setValue(ProductCondition.NEW);

        expect(component.form.get('batteryHealth')?.value).toBeNull();
      });
    });

    describe('brand autocomplete', () => {
      beforeEach(fakeAsync(() => {
        fixture.detectChanges();
        tick();
      }));

      it('should filter brands on search', () => {
        component.searchBrands({ query: 'App' } as any);

        expect(component.brandSuggestions().some(b => b.name === 'Apple')).toBe(true);
        expect(component.brandSuggestions().some(b => b.name === 'Samsung')).toBe(false);
      });

      it('should show all brands when search is empty', () => {
        component.searchBrands({ query: '' } as any);

        expect(component.brandSuggestions().length).toBe(2);
      });

      it('should show "Create" option when no exact match', () => {
        component.searchBrands({ query: 'Google' } as any);

        const createOption = component.brandSuggestions().find(b => b.isCreateNew);
        expect(createOption).toBeTruthy();
        expect(createOption?.name).toBe('Google');
      });

      it('should not show "Create" option when exact match exists', () => {
        component.searchBrands({ query: 'Apple' } as any);

        const createOption = component.brandSuggestions().find(b => b.isCreateNew);
        expect(createOption).toBeFalsy();
      });

      it('should open create dialog when "Create" option is selected', () => {
        const createSuggestion = { name: 'Google', isCreateNew: true };
        component.onBrandSelect({ value: createSuggestion } as any);

        expect(component.showCreateBrandDialog).toBe(true);
        expect(component.pendingBrandName).toBe('Google');
        expect(component.form.get('brand')?.value).toBeNull();
      });
    });

    describe('brand creation', () => {
      beforeEach(fakeAsync(() => {
        fixture.detectChanges();
        tick();
      }));

      it('should create brand and update form', fakeAsync(() => {
        const newBrand: Brand = { id: 'brand-3', name: 'Google', logoUrl: null, createdAt: '2024-01-01T00:00:00Z', updatedAt: null };
        mockBrandService.createBrand.and.returnValue(Promise.resolve(newBrand));

        component.pendingBrandName = 'Google';
        component.showCreateBrandDialog = true;

        component.confirmCreateBrand();
        tick();

        expect(mockBrandService.createBrand).toHaveBeenCalledWith({ name: 'Google' });
        expect(component.form.get('brand')?.value).toEqual(newBrand);
        expect(component.brands().some(b => b.name === 'Google')).toBe(true);
        expect(mockToastService.success).toHaveBeenCalled();
        expect(component.showCreateBrandDialog).toBe(false);
      }));

      it('should show error toast on brand creation failure', fakeAsync(() => {
        mockBrandService.createBrand.and.returnValue(Promise.reject(new Error('Brand already exists')));

        component.pendingBrandName = 'Apple';
        component.showCreateBrandDialog = true;

        component.confirmCreateBrand();
        tick();

        expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Brand already exists');
      }));

      it('should close dialog on cancel', () => {
        component.pendingBrandName = 'Google';
        component.showCreateBrandDialog = true;

        component.cancelCreateBrand();

        expect(component.showCreateBrandDialog).toBe(false);
        expect(component.pendingBrandName).toBe('');
      });
    });

    describe('form submission (add)', () => {
      beforeEach(fakeAsync(() => {
        fixture.detectChanges();
        tick();
      }));

      it('should create phone on valid form submission', fakeAsync(() => {
        mockProductService.createProduct.and.returnValue(Promise.resolve(mockProduct));

        component.form.patchValue({
          brand: mockBrands[0],
          model: 'iPhone 15 Pro',
          storageGb: 256,
          ramGb: 8,
          color: 'Space Black',
          condition: ProductCondition.NEW,
          imei: '123456789012345',
          costPrice: 900,
          sellingPrice: 1200,
          status: ProductStatus.AVAILABLE,
          supplierId: 'supplier-1',
          notes: 'Test notes',
          description: 'Test description'
        });

        component.onSubmit();
        tick();

        expect(mockProductService.createProduct).toHaveBeenCalledWith(jasmine.objectContaining({
          brandId: 'brand-1',
          model: 'iPhone 15 Pro',
          condition: ProductCondition.NEW,
          costPrice: 900,
          sellingPrice: 1200,
          status: ProductStatus.AVAILABLE
        }));
        expect(mockToastService.success).toHaveBeenCalledWith('Success', 'Phone added successfully');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/inventory']);
      }));

      it('should not submit if form is invalid', fakeAsync(() => {
        component.onSubmit();
        tick();

        expect(mockProductService.createProduct).not.toHaveBeenCalled();
        expect(component.form.touched).toBe(true);
      }));

      it('should show error toast on create failure', fakeAsync(() => {
        mockProductService.createProduct.and.returnValue(Promise.reject(new Error('Create failed')));

        component.form.patchValue({
          brand: mockBrands[0],
          model: 'iPhone 15 Pro',
          condition: ProductCondition.NEW,
          costPrice: 900,
          sellingPrice: 1200,
          status: ProductStatus.AVAILABLE
        });

        component.onSubmit();
        tick();

        expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Create failed');
      }));
    });

    describe('profit margin preview', () => {
      beforeEach(fakeAsync(() => {
        fixture.detectChanges();
        tick();
      }));

      it('should calculate profit margin correctly', () => {
        component.form.patchValue({
          costPrice: 800,
          sellingPrice: 1000
        });

        // (1000 - 800) / 1000 * 100 = 20%
        expect(component.profitMarginPreview()).toBe(20);
      });

      it('should return 0 when selling price is 0', () => {
        component.form.patchValue({
          costPrice: 800,
          sellingPrice: 0
        });

        expect(component.profitMarginPreview()).toBe(0);
      });

      it('should calculate negative margin when cost exceeds selling price', () => {
        component.form.patchValue({
          costPrice: 1200,
          sellingPrice: 1000
        });

        // (1000 - 1200) / 1000 * 100 = -20%
        expect(component.profitMarginPreview()).toBe(-20);
      });

      it('should calculate profit amount correctly', () => {
        component.form.patchValue({
          costPrice: 800,
          sellingPrice: 1000
        });

        expect(component.profitAmountPreview()).toBe(200);
      });
    });

    describe('supplier dropdown', () => {
      beforeEach(fakeAsync(() => {
        fixture.detectChanges();
        tick();
      }));

      it('should populate supplier options', () => {
        expect(component.supplierOptions().length).toBe(2);
        expect(component.supplierOptions()[0].label).toBe('TechSupply Co');
        expect(component.supplierOptions()[0].value).toBe('supplier-1');
      });

      it('should allow null supplier selection', () => {
        component.form.get('supplierId')?.setValue(null);
        expect(component.form.get('supplierId')?.valid).toBe(true);
      });
    });

    describe('navigation', () => {
      it('should navigate back on cancel', () => {
        component.onCancel();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/inventory']);
      });
    });
  });

  describe('Edit Mode (existing phone)', () => {
    beforeEach(async () => {
      await setupTestBed('phone-1');
      mockProductService.getProductById.and.returnValue(Promise.resolve(mockProduct));
      fixture = TestBed.createComponent(InventoryFormComponent);
      component = fixture.componentInstance;
    });

    it('should initialize in edit mode', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.isEdit).toBe(true);
      expect(component.productId).toBe('phone-1');
    }));

    it('should display "Edit Phone" title', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h1')?.textContent).toContain('Edit Phone');
    }));

    it('should load phone data on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockProductService.getProductById).toHaveBeenCalledWith('phone-1');
    }));

    it('should populate form with existing phone data', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.form.get('model')?.value).toBe('iPhone 15 Pro');
      expect(component.form.get('storageGb')?.value).toBe(256);
      expect(component.form.get('ramGb')?.value).toBe(8);
      expect(component.form.get('color')?.value).toBe('Space Black');
      expect(component.form.get('condition')?.value).toBe(ProductCondition.NEW);
      expect(component.form.get('costPrice')?.value).toBe(900);
      expect(component.form.get('sellingPrice')?.value).toBe(1200);
      expect(component.form.get('status')?.value).toBe(ProductStatus.AVAILABLE);
    }));

    it('should populate form with correct brand', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const brandValue = component.form.get('brand')?.value;
      expect(brandValue?.id).toBe('brand-1');
      expect(brandValue?.name).toBe('Apple');
    }));

    it('should show battery health for used phone', fakeAsync(() => {
      const usedPhone = { ...mockProduct, condition: ProductCondition.USED, batteryHealth: 85 };
      mockProductService.getProductById.and.returnValue(Promise.resolve(usedPhone));

      fixture.detectChanges();
      tick();

      expect(component.showBatteryHealth()).toBe(true);
      expect(component.form.get('batteryHealth')?.value).toBe(85);
    }));

    it('should navigate to inventory list if phone not found', fakeAsync(() => {
      mockProductService.getProductById.and.returnValue(Promise.resolve(null));

      fixture.detectChanges();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Phone not found');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/inventory']);
    }));

    it('should update phone on valid form submission', fakeAsync(() => {
      mockProductService.updateProduct.and.returnValue(Promise.resolve(mockProduct));

      fixture.detectChanges();
      tick();

      component.form.patchValue({ model: 'iPhone 15 Pro Max' });

      component.onSubmit();
      tick();

      expect(mockProductService.updateProduct).toHaveBeenCalledWith('phone-1', jasmine.objectContaining({
        model: 'iPhone 15 Pro Max'
      }));
      expect(mockToastService.success).toHaveBeenCalledWith('Success', 'Phone updated successfully');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/inventory']);
    }));

    it('should show error toast on update failure', async () => {
      mockProductService.updateProduct.and.returnValue(Promise.reject(new Error('Update failed')));

      fixture.detectChanges();
      await fixture.whenStable();

      await component.onSubmit();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Update failed');
    });

    it('should show image upload section in edit mode', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('app-phone-image-upload')).toBeTruthy();
    }));
  });

  describe('Error handling', () => {
    beforeEach(async () => {
      await setupTestBed(null);
    });

    it('should show error toast when loading brands fails', fakeAsync(() => {
      mockBrandService.getBrands.and.returnValue(Promise.reject(new Error('Load failed')));

      fixture = TestBed.createComponent(InventoryFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to load form data');
    }));

    it('should show error toast when loading suppliers fails', fakeAsync(() => {
      mockSupplierService.getSuppliers.and.returnValue(Promise.reject(new Error('Load failed')));

      fixture = TestBed.createComponent(InventoryFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to load form data');
    }));
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      await setupTestBed(null);
      fixture = TestBed.createComponent(InventoryFormComponent);
      component = fixture.componentInstance;
    });

    it('should have proper aria labels on form fields', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;

      // Check for labels associated with required fields
      const brandLabel = compiled.querySelector('label[for="brand"]');
      const modelLabel = compiled.querySelector('label[for="model"]');
      const conditionLabel = compiled.querySelector('label[for="condition"]');

      expect(brandLabel).toBeTruthy();
      expect(modelLabel).toBeTruthy();
      expect(conditionLabel).toBeTruthy();
    }));

    it('should display required field indicators', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const requiredIndicators = compiled.querySelectorAll('.text-red-500');

      // Brand, Model, Condition, Cost Price, Selling Price, Status = 6 required fields
      expect(requiredIndicators.length).toBeGreaterThanOrEqual(6);
    }));
  });
});
