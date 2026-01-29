import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter, ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';

import { SupplierFormComponent } from './supplier-form.component';
import { SupplierService } from '../../../../core/services/supplier.service';
import { InputSanitizationService } from '../../../../core/services/input-sanitization.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { Supplier } from '../../../../models/supplier.model';
import { PurchaseOrder } from '../../../../models/purchase-order.model';
import { PurchaseOrderStatus } from '../../../../enums/purchase-order-status.enum';

describe('SupplierFormComponent', () => {
  let component: SupplierFormComponent;
  let fixture: ComponentFixture<SupplierFormComponent>;
  let mockSupplierService: jasmine.SpyObj<SupplierService>;
  let mockSanitizer: jasmine.SpyObj<InputSanitizationService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockLoadingService: jasmine.SpyObj<LoadingService>;
  let router: Router;

  const mockSupplier: Supplier = {
    id: 'supplier-1',
    name: 'Tech Supplies Inc',
    contactPerson: 'John Doe',
    contactEmail: 'john@techsupplies.com',
    contactPhone: '+1-555-0100',
    address: '123 Tech Street',
    notes: 'Reliable supplier',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: null
  };

  const mockPurchaseOrders: PurchaseOrder[] = [
    {
      id: 'po-1',
      poNumber: 'PO-0001',
      supplierId: 'supplier-1',
      supplierName: 'Tech Supplies Inc',
      orderDate: '2024-01-15',
      totalAmount: 5000,
      status: PurchaseOrderStatus.PENDING,
      notes: null,
      items: [
        {
          id: 'item-1',
          purchaseOrderId: 'po-1',
          brand: 'Apple',
          model: 'iPhone 15',
          quantity: 5,
          unitCost: 800,
          lineTotal: 4000,
          createdAt: '2024-01-15T00:00:00Z'
        }
      ],
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: null
    },
    {
      id: 'po-2',
      poNumber: 'PO-0002',
      supplierId: 'supplier-1',
      supplierName: 'Tech Supplies Inc',
      orderDate: '2024-01-20',
      totalAmount: 3000,
      status: PurchaseOrderStatus.RECEIVED,
      notes: null,
      items: [],
      createdAt: '2024-01-20T00:00:00Z',
      updatedAt: null
    }
  ];

  function setupTestBed(routeParams: { id?: string } = {}) {
    mockSupplierService = jasmine.createSpyObj('SupplierService', [
      'getSupplierById', 'createSupplier', 'updateSupplier', 'getPurchaseOrdersForSupplier'
    ]);
    mockSanitizer = jasmine.createSpyObj('InputSanitizationService', ['sanitize', 'sanitizeOrNull']);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warn']);
    mockLoadingService = jasmine.createSpyObj('LoadingService', ['isLoading']);

    mockSanitizer.sanitize.and.callFake((value: string) => value.trim());
    mockSanitizer.sanitizeOrNull.and.callFake((value: string | null | undefined) =>
      value?.trim() || null
    );
    mockSupplierService.getSupplierById.and.returnValue(Promise.resolve(mockSupplier));
    mockSupplierService.getPurchaseOrdersForSupplier.and.returnValue(Promise.resolve(mockPurchaseOrders));
    mockSupplierService.createSupplier.and.returnValue(Promise.resolve(mockSupplier));
    mockSupplierService.updateSupplier.and.returnValue(Promise.resolve(mockSupplier));

    const activatedRoute = {
      snapshot: {
        paramMap: convertToParamMap(routeParams)
      }
    };

    return TestBed.configureTestingModule({
      imports: [
        SupplierFormComponent,
        NoopAnimationsModule,
        ReactiveFormsModule
      ],
      providers: [
        provideRouter([]),
        { provide: SupplierService, useValue: mockSupplierService },
        { provide: InputSanitizationService, useValue: mockSanitizer },
        { provide: ToastService, useValue: mockToastService },
        { provide: LoadingService, useValue: mockLoadingService },
        { provide: ActivatedRoute, useValue: activatedRoute },
        MessageService,
        ConfirmationService
      ]
    }).compileComponents();
  }

  describe('Create Mode', () => {
    beforeEach(async () => {
      await setupTestBed();
      fixture = TestBed.createComponent(SupplierFormComponent);
      component = fixture.componentInstance;
      router = TestBed.inject(Router);
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should be in create mode when no id parameter', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.isEditMode()).toBe(false);
    }));

    it('should display "Add Supplier" as title in create mode', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h1')?.textContent).toContain('Add Supplier');
    }));

    it('should have empty form in create mode', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.supplierForm.get('name')?.value).toBe('');
      expect(component.supplierForm.get('contactPerson')?.value).toBe('');
      expect(component.supplierForm.get('contactEmail')?.value).toBe('');
      expect(component.supplierForm.get('contactPhone')?.value).toBe('');
      expect(component.supplierForm.get('address')?.value).toBe('');
      expect(component.supplierForm.get('notes')?.value).toBe('');
    }));

    it('should not load purchase orders in create mode', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockSupplierService.getPurchaseOrdersForSupplier).not.toHaveBeenCalled();
    }));

    it('should not show purchase order history section in create mode', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).not.toContain('Purchase Order History');
    }));

    it('should show "Create Supplier" button in create mode', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Create Supplier');
    }));
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await setupTestBed({ id: 'supplier-1' });
      fixture = TestBed.createComponent(SupplierFormComponent);
      component = fixture.componentInstance;
      router = TestBed.inject(Router);
    });

    it('should be in edit mode when id parameter is present', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.isEditMode()).toBe(true);
    }));

    it('should display "Edit Supplier" as title in edit mode', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h1')?.textContent).toContain('Edit Supplier');
    }));

    it('should load supplier data in edit mode', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockSupplierService.getSupplierById).toHaveBeenCalledWith('supplier-1');
    }));

    it('should populate form with supplier data', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.supplierForm.get('name')?.value).toBe('Tech Supplies Inc');
      expect(component.supplierForm.get('contactPerson')?.value).toBe('John Doe');
      expect(component.supplierForm.get('contactEmail')?.value).toBe('john@techsupplies.com');
      expect(component.supplierForm.get('contactPhone')?.value).toBe('+1-555-0100');
      expect(component.supplierForm.get('address')?.value).toBe('123 Tech Street');
      expect(component.supplierForm.get('notes')?.value).toBe('Reliable supplier');
    }));

    it('should load purchase orders in edit mode', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockSupplierService.getPurchaseOrdersForSupplier).toHaveBeenCalledWith('supplier-1');
      expect(component.purchaseOrders().length).toBe(2);
    }));

    it('should show purchase order history section in edit mode', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Purchase Order History');
    }));

    it('should display purchase orders in table', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('PO-0001');
      expect(compiled.textContent).toContain('PO-0002');
    }));

    it('should show "Update Supplier" button in edit mode', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Update Supplier');
    }));

    it('should navigate to suppliers list if supplier not found', fakeAsync(() => {
      mockSupplierService.getSupplierById.and.returnValue(Promise.resolve(null));
      const navigateSpy = spyOn(router, 'navigate');

      fixture.detectChanges();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Not Found', 'Supplier not found');
      expect(navigateSpy).toHaveBeenCalledWith(['/admin/suppliers']);
    }));

    it('should show error toast and navigate on load failure', fakeAsync(() => {
      mockSupplierService.getSupplierById.and.returnValue(Promise.reject(new Error('Load failed')));
      const navigateSpy = spyOn(router, 'navigate');

      fixture.detectChanges();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to load supplier');
      expect(navigateSpy).toHaveBeenCalledWith(['/admin/suppliers']);
    }));
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      await setupTestBed();
      fixture = TestBed.createComponent(SupplierFormComponent);
      component = fixture.componentInstance;
      router = TestBed.inject(Router);
      fixture.detectChanges();
    });

    it('should require name field', () => {
      const nameControl = component.supplierForm.get('name');
      nameControl?.setValue('');
      nameControl?.markAsTouched();

      expect(nameControl?.valid).toBe(false);
      expect(nameControl?.hasError('required')).toBe(true);
    });

    it('should validate name max length (200 chars)', () => {
      const nameControl = component.supplierForm.get('name');
      nameControl?.setValue('a'.repeat(201));

      expect(nameControl?.valid).toBe(false);
      expect(nameControl?.hasError('maxlength')).toBe(true);
    });

    it('should validate email format', () => {
      const emailControl = component.supplierForm.get('contactEmail');
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();

      expect(emailControl?.valid).toBe(false);
      expect(emailControl?.hasError('email')).toBe(true);
    });

    it('should accept valid email format', () => {
      const emailControl = component.supplierForm.get('contactEmail');
      emailControl?.setValue('valid@email.com');

      expect(emailControl?.valid).toBe(true);
    });

    it('should validate contactPerson max length (200 chars)', () => {
      const control = component.supplierForm.get('contactPerson');
      control?.setValue('a'.repeat(201));

      expect(control?.valid).toBe(false);
      expect(control?.hasError('maxlength')).toBe(true);
    });

    it('should validate contactEmail max length (255 chars)', () => {
      const control = component.supplierForm.get('contactEmail');
      control?.setValue('a'.repeat(256) + '@email.com');

      expect(control?.valid).toBe(false);
      expect(control?.hasError('maxlength')).toBe(true);
    });

    it('should validate contactPhone max length (30 chars)', () => {
      const control = component.supplierForm.get('contactPhone');
      control?.setValue('1'.repeat(31));

      expect(control?.valid).toBe(false);
      expect(control?.hasError('maxlength')).toBe(true);
    });

    it('should validate address max length (1000 chars)', () => {
      const control = component.supplierForm.get('address');
      control?.setValue('a'.repeat(1001));

      expect(control?.valid).toBe(false);
      expect(control?.hasError('maxlength')).toBe(true);
    });

    it('should validate notes max length (2000 chars)', () => {
      const control = component.supplierForm.get('notes');
      control?.setValue('a'.repeat(2001));

      expect(control?.valid).toBe(false);
      expect(control?.hasError('maxlength')).toBe(true);
    });

    it('should mark form as touched on invalid submit', fakeAsync(() => {
      component.supplierForm.get('name')?.setValue('');

      component.onSubmit();
      tick();

      expect(component.supplierForm.touched).toBe(true);
      expect(mockSupplierService.createSupplier).not.toHaveBeenCalled();
    }));
  });

  describe('Form Submission - Create', () => {
    beforeEach(async () => {
      await setupTestBed();
      fixture = TestBed.createComponent(SupplierFormComponent);
      component = fixture.componentInstance;
      router = TestBed.inject(Router);
      fixture.detectChanges();
    });

    it('should create supplier with valid data', fakeAsync(() => {
      const navigateSpy = spyOn(router, 'navigate');
      component.supplierForm.patchValue({
        name: 'New Supplier',
        contactPerson: 'Contact Name',
        contactEmail: 'contact@email.com',
        contactPhone: '+1-555-0000',
        address: '123 Address St',
        notes: 'Some notes'
      });

      component.onSubmit();
      tick();

      expect(mockSupplierService.createSupplier).toHaveBeenCalled();
      expect(mockToastService.success).toHaveBeenCalledWith('Success', 'Supplier created successfully');
      expect(navigateSpy).toHaveBeenCalledWith(['/admin/suppliers']);
    }));

    it('should set saving state during submission', fakeAsync(() => {
      spyOn(router, 'navigate');
      let resolveCreate: (value: Supplier) => void;
      const createPromise = new Promise<Supplier>(resolve => {
        resolveCreate = resolve;
      });
      mockSupplierService.createSupplier.and.returnValue(createPromise);

      component.supplierForm.patchValue({ name: 'New Supplier' });
      component.onSubmit();

      expect(component.saving()).toBe(true);

      resolveCreate!(mockSupplier);
      tick();

      expect(component.saving()).toBe(false);
    }));

    it('should show error toast on create failure', fakeAsync(() => {
      mockSupplierService.createSupplier.and.returnValue(
        Promise.reject(new Error('Create failed'))
      );

      component.supplierForm.patchValue({ name: 'New Supplier' });
      component.onSubmit();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Create failed');
    }));

    it('should sanitize input before creating', fakeAsync(() => {
      spyOn(router, 'navigate');
      component.supplierForm.patchValue({
        name: 'New Supplier',
        contactPerson: 'Contact Name',
        address: 'Address'
      });

      component.onSubmit();
      tick();

      expect(mockSanitizer.sanitize).toHaveBeenCalledWith('New Supplier');
      expect(mockSanitizer.sanitizeOrNull).toHaveBeenCalled();
    }));
  });

  describe('Form Submission - Update', () => {
    beforeEach(async () => {
      await setupTestBed({ id: 'supplier-1' });
      fixture = TestBed.createComponent(SupplierFormComponent);
      component = fixture.componentInstance;
      router = TestBed.inject(Router);
    });

    it('should update supplier with valid data', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const navigateSpy = spyOn(router, 'navigate');
      component.supplierForm.patchValue({
        name: 'Updated Supplier'
      });

      component.onSubmit();
      tick();

      expect(mockSupplierService.updateSupplier).toHaveBeenCalledWith('supplier-1', jasmine.any(Object));
      expect(mockToastService.success).toHaveBeenCalledWith('Success', 'Supplier updated successfully');
      expect(navigateSpy).toHaveBeenCalledWith(['/admin/suppliers']);
    }));

    it('should show error toast on update failure', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      mockSupplierService.updateSupplier.and.returnValue(
        Promise.reject(new Error('Update failed'))
      );

      component.supplierForm.patchValue({ name: 'Updated Supplier' });
      component.onSubmit();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Update failed');
    }));
  });

  describe('Navigation', () => {
    beforeEach(async () => {
      await setupTestBed();
      fixture = TestBed.createComponent(SupplierFormComponent);
      component = fixture.componentInstance;
      router = TestBed.inject(Router);
      fixture.detectChanges();
    });

    it('should navigate back to suppliers list on cancel', fakeAsync(() => {
      const navigateSpy = spyOn(router, 'navigate');

      component.goBack();
      tick();

      expect(navigateSpy).toHaveBeenCalledWith(['/admin/suppliers']);
    }));

    it('should have Back to Suppliers button', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Back to Suppliers');
    }));
  });

  describe('Purchase Order Status Display', () => {
    beforeEach(async () => {
      await setupTestBed({ id: 'supplier-1' });
      fixture = TestBed.createComponent(SupplierFormComponent);
      component = fixture.componentInstance;
    });

    it('should return correct status label', () => {
      expect(component.getStatusLabel(PurchaseOrderStatus.PENDING)).toBe('Pending');
      expect(component.getStatusLabel(PurchaseOrderStatus.RECEIVED)).toBe('Received');
      expect(component.getStatusLabel(PurchaseOrderStatus.CANCELLED)).toBe('Cancelled');
    });

    it('should return correct status severity', () => {
      expect(component.getStatusSeverity(PurchaseOrderStatus.PENDING)).toBe('warn');
      expect(component.getStatusSeverity(PurchaseOrderStatus.RECEIVED)).toBe('success');
      expect(component.getStatusSeverity(PurchaseOrderStatus.CANCELLED)).toBe('danger');
    });
  });

  describe('Loading States', () => {
    beforeEach(async () => {
      await setupTestBed({ id: 'supplier-1' });
      fixture = TestBed.createComponent(SupplierFormComponent);
      component = fixture.componentInstance;
    });

    it('should show page loading skeleton while loading supplier', fakeAsync(() => {
      let resolveSupplier: (value: Supplier | null) => void;
      const supplierPromise = new Promise<Supplier | null>(resolve => {
        resolveSupplier = resolve;
      });
      mockSupplierService.getSupplierById.and.returnValue(supplierPromise);

      fixture.detectChanges();

      expect(component.pageLoading()).toBe(true);
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('p-skeleton').length).toBeGreaterThan(0);

      resolveSupplier!(mockSupplier);
      tick();

      expect(component.pageLoading()).toBe(false);
    }));

    it('should show purchase orders loading spinner', fakeAsync(() => {
      let resolvePOs: (value: PurchaseOrder[]) => void;
      const poPromise = new Promise<PurchaseOrder[]>(resolve => {
        resolvePOs = resolve;
      });
      mockSupplierService.getPurchaseOrdersForSupplier.and.returnValue(poPromise);

      fixture.detectChanges();
      tick(); // Wait for supplier to load

      expect(component.purchaseOrdersLoading()).toBe(true);

      resolvePOs!(mockPurchaseOrders);
      tick();

      expect(component.purchaseOrdersLoading()).toBe(false);
    }));
  });

  describe('Empty Purchase Orders State', () => {
    beforeEach(async () => {
      await setupTestBed({ id: 'supplier-1' });
      fixture = TestBed.createComponent(SupplierFormComponent);
      component = fixture.componentInstance;
      mockSupplierService.getPurchaseOrdersForSupplier.and.returnValue(Promise.resolve([]));
    });

    it('should show empty state when no purchase orders', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No purchase orders found for this supplier');
      expect(compiled.textContent).toContain('Create First Purchase Order');
    }));
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      await setupTestBed();
      fixture = TestBed.createComponent(SupplierFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should have labels for all form fields', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('label[for="name"]')).toBeTruthy();
      expect(compiled.querySelector('label[for="contactPerson"]')).toBeTruthy();
      expect(compiled.querySelector('label[for="contactEmail"]')).toBeTruthy();
      expect(compiled.querySelector('label[for="contactPhone"]')).toBeTruthy();
      expect(compiled.querySelector('label[for="address"]')).toBeTruthy();
      expect(compiled.querySelector('label[for="notes"]')).toBeTruthy();
    }));

    it('should have id attributes for all form fields', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('#name')).toBeTruthy();
      expect(compiled.querySelector('#contactPerson')).toBeTruthy();
      expect(compiled.querySelector('#contactEmail')).toBeTruthy();
      expect(compiled.querySelector('#contactPhone')).toBeTruthy();
      expect(compiled.querySelector('#address')).toBeTruthy();
      expect(compiled.querySelector('#notes')).toBeTruthy();
    }));

    it('should show required indicator for name field', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const nameLabel = compiled.querySelector('label[for="name"]');
      expect(nameLabel?.innerHTML).toContain('*');
    }));
  });
});
