import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { PurchaseOrderFormComponent } from './purchase-order-form.component';
import { SupplierService } from '../../../../core/services/supplier.service';
import { PurchaseOrderService } from '../../../../core/services/purchase-order.service';
import { BrandService } from '../../../../core/services/brand.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { InputSanitizationService } from '../../../../core/services/input-sanitization.service';
import { PurchaseOrderStatus } from '../../../../enums';

describe('PurchaseOrderFormComponent', () => {
  let component: PurchaseOrderFormComponent;
  let fixture: ComponentFixture<PurchaseOrderFormComponent>;
  let mockSupplierService: jasmine.SpyObj<SupplierService>;
  let mockPurchaseOrderService: jasmine.SpyObj<PurchaseOrderService>;
  let mockBrandService: jasmine.SpyObj<BrandService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockSanitizer: jasmine.SpyObj<InputSanitizationService>;
  let router: Router;

  const mockSuppliers = [
    { id: 'supplier-1', name: 'Tech Supplies Inc', contactPerson: 'John', contactEmail: 'john@tech.com', contactPhone: '123', address: null, notes: null, createdAt: '2024-01-01', updatedAt: null },
    { id: 'supplier-2', name: 'Mobile Parts Ltd', contactPerson: 'Jane', contactEmail: 'jane@mobile.com', contactPhone: '456', address: null, notes: null, createdAt: '2024-01-01', updatedAt: null }
  ];

  const mockBrands = [
    { id: 'brand-1', name: 'Apple', logoUrl: null, createdAt: '2024-01-01', updatedAt: null },
    { id: 'brand-2', name: 'Samsung', logoUrl: null, createdAt: '2024-01-01', updatedAt: null },
    { id: 'brand-3', name: 'Google', logoUrl: null, createdAt: '2024-01-01', updatedAt: null }
  ];

  const mockCreatedPO = {
    id: 'po-1',
    poNumber: 'PO-0001',
    supplierId: 'supplier-1',
    supplierName: 'Tech Supplies Inc',
    orderDate: '2024-01-15',
    totalAmount: 1600,
    status: PurchaseOrderStatus.PENDING,
    notes: null,
    items: [
      { id: 'item-1', purchaseOrderId: 'po-1', brand: 'Apple', model: 'iPhone 15', quantity: 2, unitCost: 800, lineTotal: 1600, createdAt: '2024-01-15' }
    ],
    createdAt: '2024-01-15',
    updatedAt: null
  };

  beforeEach(async () => {
    mockSupplierService = jasmine.createSpyObj('SupplierService', ['getSuppliers']);
    mockPurchaseOrderService = jasmine.createSpyObj('PurchaseOrderService', ['createPurchaseOrder']);
    mockBrandService = jasmine.createSpyObj('BrandService', ['getBrands']);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warn', 'info']);
    mockSanitizer = jasmine.createSpyObj('InputSanitizationService', ['sanitize', 'sanitizeOrNull']);

    mockSupplierService.getSuppliers.and.returnValue(Promise.resolve({ data: mockSuppliers, total: 2 }));
    mockBrandService.getBrands.and.returnValue(Promise.resolve(mockBrands));
    mockPurchaseOrderService.createPurchaseOrder.and.returnValue(Promise.resolve(mockCreatedPO));
    mockSanitizer.sanitize.and.callFake((val: string) => val?.trim() || '');
    mockSanitizer.sanitizeOrNull.and.callFake((val: string | null | undefined) => val?.trim() || null);

    await TestBed.configureTestingModule({
      imports: [
        PurchaseOrderFormComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideRouter([]),
        { provide: SupplierService, useValue: mockSupplierService },
        { provide: PurchaseOrderService, useValue: mockPurchaseOrderService },
        { provide: BrandService, useValue: mockBrandService },
        { provide: ToastService, useValue: mockToastService },
        { provide: InputSanitizationService, useValue: mockSanitizer }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseOrderFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load suppliers and brands on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockSupplierService.getSuppliers).toHaveBeenCalled();
      expect(mockBrandService.getBrands).toHaveBeenCalled();
      expect(component.suppliers().length).toBe(2);
      expect(component.brands().length).toBe(3);
    }));

    it('should show error toast when loading fails', fakeAsync(() => {
      mockSupplierService.getSuppliers.and.returnValue(Promise.reject(new Error('Load failed')));
      fixture.detectChanges();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to load form data');
    }));

    it('should initialize form with default values', () => {
      fixture.detectChanges();

      expect(component.form.get('supplierId')?.value).toBe('');
      expect(component.form.get('orderDate')?.value).toBeInstanceOf(Date);
      expect(component.form.get('notes')?.value).toBe('');
      expect(component.lineItems.length).toBe(0);
    });

    it('should start with zero total amount', () => {
      fixture.detectChanges();
      expect(component.totalAmount()).toBe(0);
    });
  });

  describe('Line Item Management', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should add a new line item with default values', () => {
      component.addLineItem();

      expect(component.lineItems.length).toBe(1);
      const item = component.getLineItemFormGroup(0);
      expect(item.get('brand')?.value).toBe('');
      expect(item.get('model')?.value).toBe('');
      expect(item.get('quantity')?.value).toBe(1);
      expect(item.get('unitCost')?.value).toBe(0);
    });

    it('should remove a line item', () => {
      component.addLineItem();
      component.addLineItem();
      expect(component.lineItems.length).toBe(2);

      component.removeLineItem(0);
      expect(component.lineItems.length).toBe(1);
    });

    it('should duplicate a line item with same values', () => {
      component.addLineItem();
      const firstItem = component.getLineItemFormGroup(0);
      firstItem.patchValue({
        brand: 'Apple',
        model: 'iPhone 15',
        quantity: 3,
        unitCost: 800
      });

      component.duplicateLineItem(0);

      expect(component.lineItems.length).toBe(2);
      const duplicatedItem = component.getLineItemFormGroup(1);
      expect(duplicatedItem.get('brand')?.value).toBe('Apple');
      expect(duplicatedItem.get('model')?.value).toBe('iPhone 15');
      expect(duplicatedItem.get('quantity')?.value).toBe(3);
      expect(duplicatedItem.get('unitCost')?.value).toBe(800);
      expect(mockToastService.info).toHaveBeenCalledWith('Item Duplicated', 'Line item #1 duplicated');
    });

    it('should insert duplicated item after the source item', () => {
      component.addLineItem();
      component.addLineItem();
      component.addLineItem();

      component.getLineItemFormGroup(0).patchValue({ brand: 'Apple', model: 'iPhone' });
      component.getLineItemFormGroup(1).patchValue({ brand: 'Samsung', model: 'Galaxy' });
      component.getLineItemFormGroup(2).patchValue({ brand: 'Google', model: 'Pixel' });

      component.duplicateLineItem(1);

      expect(component.lineItems.length).toBe(4);
      expect(component.getLineItemFormGroup(1).get('brand')?.value).toBe('Samsung');
      expect(component.getLineItemFormGroup(2).get('brand')?.value).toBe('Samsung');
      expect(component.getLineItemFormGroup(3).get('brand')?.value).toBe('Google');
    });
  });

  describe('Total Calculation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should calculate line total correctly', () => {
      component.addLineItem();
      component.getLineItemFormGroup(0).patchValue({ quantity: 3, unitCost: 200 });

      expect(component.calculateLineTotal(0)).toBe(600);
    });

    it('should recalculate total when line item values change', fakeAsync(() => {
      component.addLineItem();
      component.getLineItemFormGroup(0).patchValue({ quantity: 3, unitCost: 200 });
      tick();

      expect(component.totalAmount()).toBe(600);
    }));

    it('should calculate total for multiple line items', fakeAsync(() => {
      component.addLineItem();
      component.addLineItem();
      component.getLineItemFormGroup(0).patchValue({ quantity: 2, unitCost: 500 });
      component.getLineItemFormGroup(1).patchValue({ quantity: 3, unitCost: 300 });
      tick();

      expect(component.totalAmount()).toBe(1900);
    }));

    it('should update total when line item is removed', fakeAsync(() => {
      component.addLineItem();
      component.addLineItem();
      component.getLineItemFormGroup(0).patchValue({ quantity: 2, unitCost: 500 });
      component.getLineItemFormGroup(1).patchValue({ quantity: 3, unitCost: 300 });
      tick();

      component.removeLineItem(0);
      tick();

      expect(component.totalAmount()).toBe(900);
    }));

    it('should return 0 for invalid index', () => {
      expect(component.calculateLineTotal(99)).toBe(0);
    });
  });

  describe('Brand Autocomplete', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter brands based on search query', () => {
      component.searchBrands({ query: 'app' } as any);
      expect(component.filteredBrands()).toContain('Apple');
      expect(component.filteredBrands()).not.toContain('Samsung');
    });

    it('should return all brands for empty query', () => {
      component.searchBrands({ query: '' } as any);
      expect(component.filteredBrands().length).toBe(3);
    });

    it('should be case insensitive', () => {
      component.searchBrands({ query: 'SAMSUNG' } as any);
      expect(component.filteredBrands()).toContain('Samsung');
    });
  });

  describe('Form Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should require supplier', () => {
      expect(component.form.get('supplierId')?.valid).toBeFalse();
      component.form.patchValue({ supplierId: 'supplier-1' });
      expect(component.form.get('supplierId')?.valid).toBeTrue();
    });

    it('should require order date', () => {
      component.form.patchValue({ orderDate: null });
      expect(component.form.get('orderDate')?.valid).toBeFalse();
      component.form.patchValue({ orderDate: new Date() });
      expect(component.form.get('orderDate')?.valid).toBeTrue();
    });

    it('should require at least one line item', () => {
      expect(component.lineItems.length).toBe(0);
      expect(component.form.get('items')?.hasError('required')).toBeTrue();
      component.addLineItem();
      expect(component.lineItems.length).toBe(1);
      expect(component.form.get('items')?.hasError('required')).toBeFalse();
    });

    it('should validate line item brand is required', () => {
      component.addLineItem();
      const item = component.getLineItemFormGroup(0);
      expect(item.get('brand')?.valid).toBeFalse();
      item.patchValue({ brand: 'Apple' });
      expect(item.get('brand')?.valid).toBeTrue();
    });

    it('should validate line item model is required', () => {
      component.addLineItem();
      const item = component.getLineItemFormGroup(0);
      expect(item.get('model')?.valid).toBeFalse();
      item.patchValue({ model: 'iPhone 15' });
      expect(item.get('model')?.valid).toBeTrue();
    });

    it('should validate quantity minimum is 1', () => {
      component.addLineItem();
      const item = component.getLineItemFormGroup(0);
      item.patchValue({ quantity: 0 });
      expect(item.get('quantity')?.valid).toBeFalse();
      item.patchValue({ quantity: 1 });
      expect(item.get('quantity')?.valid).toBeTrue();
    });

    it('should validate unit cost minimum is 0', () => {
      component.addLineItem();
      const item = component.getLineItemFormGroup(0);
      item.patchValue({ unitCost: -1 });
      expect(item.get('unitCost')?.valid).toBeFalse();
      item.patchValue({ unitCost: 0 });
      expect(item.get('unitCost')?.valid).toBeTrue();
    });

    it('should validate brand max length', () => {
      component.addLineItem();
      const item = component.getLineItemFormGroup(0);
      item.patchValue({ brand: 'A'.repeat(101) });
      expect(item.get('brand')?.valid).toBeFalse();
      item.patchValue({ brand: 'A'.repeat(100) });
      expect(item.get('brand')?.valid).toBeTrue();
    });

    it('should validate model max length', () => {
      component.addLineItem();
      const item = component.getLineItemFormGroup(0);
      item.patchValue({ model: 'M'.repeat(151) });
      expect(item.get('model')?.valid).toBeFalse();
      item.patchValue({ model: 'M'.repeat(150) });
      expect(item.get('model')?.valid).toBeTrue();
    });
  });

  describe('Form Submission', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not submit if form is invalid', fakeAsync(() => {
      component.onSubmit();
      tick();

      expect(mockPurchaseOrderService.createPurchaseOrder).not.toHaveBeenCalled();
    }));

    it('should show warning when no line items', fakeAsync(() => {
      component.form.patchValue({
        supplierId: 'supplier-1',
        orderDate: new Date()
      });

      component.onSubmit();
      tick();

      expect(mockToastService.warn).toHaveBeenCalledWith('Validation Error', 'At least one line item is required');
    }));

    it('should submit valid form', fakeAsync(() => {
      component.form.patchValue({
        supplierId: 'supplier-1',
        orderDate: new Date('2024-01-15'),
        notes: 'Test notes'
      });
      component.addLineItem();
      component.getLineItemFormGroup(0).patchValue({
        brand: 'Apple',
        model: 'iPhone 15',
        quantity: 2,
        unitCost: 800
      });

      component.onSubmit();
      tick();

      expect(mockPurchaseOrderService.createPurchaseOrder).toHaveBeenCalled();
      const callArg = mockPurchaseOrderService.createPurchaseOrder.calls.mostRecent().args[0];
      expect(callArg.supplierId).toBe('supplier-1');
      expect(callArg.items.length).toBe(1);
      expect(callArg.items[0].brand).toBe('Apple');
      expect(callArg.items[0].quantity).toBe(2);
    }));

    it('should show success toast and navigate on successful creation', fakeAsync(() => {
      component.form.patchValue({
        supplierId: 'supplier-1',
        orderDate: new Date('2024-01-15')
      });
      component.addLineItem();
      component.getLineItemFormGroup(0).patchValue({
        brand: 'Apple',
        model: 'iPhone 15',
        quantity: 2,
        unitCost: 800
      });

      component.onSubmit();
      tick();

      expect(mockToastService.success).toHaveBeenCalledWith('Success', 'Purchase order PO-0001 created successfully');
      expect(router.navigate).toHaveBeenCalledWith(['/admin/purchase-orders']);
    }));

    it('should show error toast on creation failure', fakeAsync(() => {
      mockPurchaseOrderService.createPurchaseOrder.and.returnValue(Promise.reject(new Error('Creation failed')));

      component.form.patchValue({
        supplierId: 'supplier-1',
        orderDate: new Date('2024-01-15')
      });
      component.addLineItem();
      component.getLineItemFormGroup(0).patchValue({
        brand: 'Apple',
        model: 'iPhone 15',
        quantity: 2,
        unitCost: 800
      });

      component.onSubmit();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Creation failed');
    }));

    it('should set loading state during submission', fakeAsync(() => {
      mockPurchaseOrderService.createPurchaseOrder.and.returnValue(
        new Promise(resolve => setTimeout(() => resolve(mockCreatedPO), 100))
      );

      component.form.patchValue({
        supplierId: 'supplier-1',
        orderDate: new Date('2024-01-15')
      });
      component.addLineItem();
      component.getLineItemFormGroup(0).patchValue({
        brand: 'Apple',
        model: 'iPhone 15',
        quantity: 2,
        unitCost: 800
      });

      expect(component.loading()).toBeFalse();
      component.onSubmit();
      expect(component.loading()).toBeTrue();

      tick(100);
      expect(component.loading()).toBeFalse();
    }));

    it('should sanitize input values before submission', fakeAsync(() => {
      component.form.patchValue({
        supplierId: 'supplier-1',
        orderDate: new Date('2024-01-15'),
        notes: '  Test notes  '
      });
      component.addLineItem();
      component.getLineItemFormGroup(0).patchValue({
        brand: '  Apple  ',
        model: '  iPhone 15  ',
        quantity: 2,
        unitCost: 800
      });

      component.onSubmit();
      tick();

      expect(mockSanitizer.sanitize).toHaveBeenCalledWith('  Apple  ');
      expect(mockSanitizer.sanitize).toHaveBeenCalledWith('  iPhone 15  ');
      expect(mockSanitizer.sanitizeOrNull).toHaveBeenCalledWith('  Test notes  ');
    }));
  });

  describe('Navigation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should navigate back to list', () => {
      component.navigateBack();
      expect(router.navigate).toHaveBeenCalledWith(['/admin/purchase-orders']);
    });
  });

  describe('Date Formatting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should format date correctly for submission', fakeAsync(() => {
      const testDate = new Date(2024, 5, 15); // June 15, 2024

      component.form.patchValue({
        supplierId: 'supplier-1',
        orderDate: testDate
      });
      component.addLineItem();
      component.getLineItemFormGroup(0).patchValue({
        brand: 'Apple',
        model: 'iPhone 15',
        quantity: 1,
        unitCost: 800
      });

      component.onSubmit();
      tick();

      const callArg = mockPurchaseOrderService.createPurchaseOrder.calls.mostRecent().args[0];
      expect(callArg.orderDate).toBe('2024-06-15');
    }));
  });

  describe('UI State', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show empty state when no line items', () => {
      expect(component.lineItems.length).toBe(0);
      expect(component.lineItemsArray.length).toBe(0);
    });

    it('should have line items after adding', () => {
      component.addLineItem();
      expect(component.lineItems.length).toBe(1);
      expect(component.lineItemsArray.length).toBe(1);
    });
  });
});
