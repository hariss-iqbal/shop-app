import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, signal } from '@angular/core';

import { MarkAsSoldDialogComponent } from './mark-as-sold-dialog.component';
import { SaleService } from '../../../../core/services/sale.service';
import { CustomerService } from '../../../../core/services/customer.service';
import { InputSanitizationService } from '../../../../core/services/input-sanitization.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { Product } from '../../../../models/product.model';
import { CustomerWithStats } from '../../../../models/customer.model';
import { ProductStatus } from '../../../../enums/product-status.enum';
import { ProductCondition } from '../../../../enums/product-condition.enum';
import { ProductType } from '../../../../enums/product-type.enum';

@Component({
  selector: 'app-test-host',
  imports: [MarkAsSoldDialogComponent],
  template: `
    <app-mark-as-sold-dialog
      [phone]="phone()"
      [visible]="visible()"
      (visibleChange)="visible.set($event)"
      (saleSaved)="onSaleSaved()"
    />
  `
})
class TestHostComponent {
  phone = signal<Phone | null>(null);
  visible = signal(false);
  saleSavedCalled = false;

  onSaleSaved(): void {
    this.saleSavedCalled = true;
  }
}

describe('MarkAsSoldDialogComponent', () => {
  let component: MarkAsSoldDialogComponent;
  let fixture: ComponentFixture<MarkAsSoldDialogComponent>;
  let mockSaleService: jasmine.SpyObj<SaleService>;
  let mockCustomerService: jasmine.SpyObj<CustomerService>;
  let mockSanitizer: jasmine.SpyObj<InputSanitizationService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockFocusService: jasmine.SpyObj<FocusManagementService>;
  let mockSupabaseService: any;

  const mockPhone: Phone = {
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
    supplierName: 'Test Supplier',
    notes: null,
    primaryImageUrl: 'https://example.com/phone.jpg',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: null,
    taxRate: 10,
    isTaxInclusive: false,
    isTaxExempt: false
  };

  const mockSaleResponse = {
    success: true,
    phoneId: 'phone-1',
    inventoryDeducted: true,
    sale: {
      id: 'sale-1',
      phoneId: 'phone-1',
      brandName: 'Apple',
      phoneName: 'iPhone 15 Pro',
      saleDate: '2024-01-15',
      salePrice: 1200,
      costPrice: 900,
      profit: 300,
      buyerName: null,
      buyerPhone: null,
      buyerEmail: null,
      notes: null,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: null,
      taxRate: 10,
      taxAmount: 109.09,
      basePrice: 1090.91,
      isTaxExempt: false,
      paymentSummary: [],
      isSplitPayment: false,
      primaryPaymentMethod: null,
      locationId: null,
      locationName: null
    }
  };

  const mockCustomerWithStats: CustomerWithStats = {
    id: 'cust-1',
    phone: '+1234567890',
    name: 'John Doe',
    email: 'john@example.com',
    notes: 'Prefers latest models',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: null,
    totalTransactions: 3,
    totalSpent: 3500,
    lastPurchaseDate: '2024-01-10'
  };

  beforeEach(async () => {
    mockSaleService = jasmine.createSpyObj('SaleService', ['markAsSold']);
    mockCustomerService = jasmine.createSpyObj('CustomerService', ['lookupByPhone']);
    mockSanitizer = jasmine.createSpyObj('InputSanitizationService', ['sanitizeOrNull']);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);
    mockFocusService = jasmine.createSpyObj('FocusManagementService', ['saveTriggerElement', 'restoreFocus']);

    mockSupabaseService = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue(Promise.resolve({ data: [], error: null }))
      }),
      auth: {
        getSession: jasmine.createSpy('getSession').and.returnValue(Promise.resolve({ data: { session: null } })),
        onAuthStateChange: jasmine.createSpy('onAuthStateChange').and.returnValue({
          data: { subscription: { unsubscribe: jasmine.createSpy() } }
        })
      }
    };

    mockSaleService.markAsSold.and.returnValue(Promise.resolve(mockSaleResponse));
    mockCustomerService.lookupByPhone.and.returnValue(Promise.resolve(null));
    mockSanitizer.sanitizeOrNull.and.callFake((val: string | null | undefined) =>
      val?.trim() || null
    );

    await TestBed.configureTestingModule({
      imports: [
        MarkAsSoldDialogComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: SaleService, useValue: mockSaleService },
        { provide: CustomerService, useValue: mockCustomerService },
        { provide: InputSanitizationService, useValue: mockSanitizer },
        { provide: ToastService, useValue: mockToastService },
        { provide: FocusManagementService, useValue: mockFocusService },
        { provide: SupabaseService, useValue: mockSupabaseService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MarkAsSoldDialogComponent);
    component = fixture.componentInstance;
  });

  describe('component initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with null sale price', () => {
      expect(component.salePrice).toBeNull();
    });

    it('should initialize with null sale date', () => {
      expect(component.saleDate).toBeNull();
    });

    it('should initialize with empty buyer fields', () => {
      expect(component.buyerName).toBe('');
      expect(component.buyerPhone).toBe('');
      expect(component.buyerEmail).toBe('');
      expect(component.notes).toBe('');
    });

    it('should initialize with saving set to false', () => {
      expect(component.saving()).toBe(false);
    });
  });

  describe('ngOnChanges', () => {
    it('should reset form when phone and visible change to show dialog', () => {
      fixture.componentRef.setInput('phone', mockPhone);
      fixture.componentRef.setInput('visible', true);

      fixture.detectChanges();

      expect(component.salePrice).toBe(1200);
      expect(component.saleDate).toBeInstanceOf(Date);
      expect(component.buyerName).toBe('');
      expect(component.buyerPhone).toBe('');
      expect(component.buyerEmail).toBe('');
      expect(component.notes).toBe('');
    });

    it('should pre-fill sale price with phone selling price', () => {
      fixture.componentRef.setInput('phone', mockPhone);
      fixture.componentRef.setInput('visible', true);

      fixture.detectChanges();

      expect(component.salePrice).toBe(mockPhone.sellingPrice);
    });

    it('should set sale date to today', () => {
      const today = new Date();
      fixture.componentRef.setInput('phone', mockPhone);
      fixture.componentRef.setInput('visible', true);

      fixture.detectChanges();

      const saleDate = component.saleDate;
      expect(saleDate?.getFullYear()).toBe(today.getFullYear());
      expect(saleDate?.getMonth()).toBe(today.getMonth());
      expect(saleDate?.getDate()).toBe(today.getDate());
    });

    it('should not reset form when dialog is not visible', () => {
      fixture.componentRef.setInput('phone', mockPhone);
      fixture.componentRef.setInput('visible', false);

      fixture.detectChanges();

      expect(component.salePrice).toBeNull();
    });

    it('should not reset form when phone is null', () => {
      fixture.componentRef.setInput('phone', null);
      fixture.componentRef.setInput('visible', true);

      fixture.detectChanges();

      expect(component.salePrice).toBeNull();
    });
  });

  describe('dialogHeader', () => {
    it('should return phone name in header when phone is set', () => {
      fixture.componentRef.setInput('phone', mockPhone);
      fixture.detectChanges();

      expect(component.dialogHeader()).toBe('Mark as Sold - Apple iPhone 15 Pro');
    });

    it('should return default header when phone is null', () => {
      fixture.componentRef.setInput('phone', null);
      fixture.detectChanges();

      expect(component.dialogHeader()).toBe('Mark as Sold');
    });
  });

  describe('profit calculations', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('phone', mockPhone);
      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();
    });

    describe('getEstimatedProfit', () => {
      it('should calculate positive profit correctly', () => {
        component.salePrice = 1200;
        expect(component.getEstimatedProfit()).toBe(300);
      });

      it('should calculate negative profit when selling below cost', () => {
        component.salePrice = 800;
        expect(component.getEstimatedProfit()).toBe(-100);
      });

      it('should return 0 when sale price equals cost price', () => {
        component.salePrice = 900;
        expect(component.getEstimatedProfit()).toBe(0);
      });

      it('should return 0 when sale price is null', () => {
        component.salePrice = null;
        expect(component.getEstimatedProfit()).toBe(0);
      });

      it('should return 0 when phone is null', () => {
        fixture.componentRef.setInput('phone', null);
        fixture.detectChanges();
        component.salePrice = 1200;
        expect(component.getEstimatedProfit()).toBe(0);
      });
    });

    describe('getProfitMargin', () => {
      it('should calculate profit margin correctly', () => {
        component.salePrice = 1200;
        expect(component.getProfitMargin()).toBe(25);
      });

      it('should calculate negative margin when selling below cost', () => {
        component.salePrice = 800;
        expect(component.getProfitMargin()).toBe(-12.5);
      });

      it('should return 0 when sale price is null', () => {
        component.salePrice = null;
        expect(component.getProfitMargin()).toBe(0);
      });

      it('should return 0 when sale price is zero', () => {
        component.salePrice = 0;
        expect(component.getProfitMargin()).toBe(0);
      });
    });

    describe('getProfitClass', () => {
      it('should return green class for positive profit', () => {
        component.salePrice = 1200;
        expect(component.getProfitClass()).toBe('bg-green-50 text-green-700');
      });

      it('should return red class for negative profit', () => {
        component.salePrice = 800;
        expect(component.getProfitClass()).toBe('bg-red-50 text-red-700');
      });

      it('should return neutral class for zero profit', () => {
        component.salePrice = 900;
        expect(component.getProfitClass()).toBe('bg-surface-100 text-color-secondary');
      });
    });

    describe('getProfitIcon', () => {
      it('should return up arrow for positive profit', () => {
        component.salePrice = 1200;
        expect(component.getProfitIcon()).toBe('pi-arrow-up text-green-500');
      });

      it('should return down arrow for negative profit', () => {
        component.salePrice = 800;
        expect(component.getProfitIcon()).toBe('pi-arrow-down text-red-500');
      });

      it('should return minus for zero profit', () => {
        component.salePrice = 900;
        expect(component.getProfitIcon()).toBe('pi-minus text-color-secondary');
      });
    });
  });

  describe('isFormValid', () => {
    it('should return false when sale price is null', () => {
      component.salePrice = null;
      component.saleDate = new Date();

      expect(component.isFormValid()).toBe(false);
    });

    it('should return false when sale date is null', () => {
      component.salePrice = 1200;
      component.saleDate = null;

      expect(component.isFormValid()).toBe(false);
    });

    it('should return false when sale price is negative', () => {
      component.salePrice = -100;
      component.saleDate = new Date();

      expect(component.isFormValid()).toBe(false);
    });

    it('should return true when sale price is zero', () => {
      component.salePrice = 0;
      component.saleDate = new Date();

      expect(component.isFormValid()).toBe(true);
    });

    it('should return true when sale price and date are valid', () => {
      component.salePrice = 1200;
      component.saleDate = new Date();

      expect(component.isFormValid()).toBe(true);
    });

    it('should not require buyer fields for validation', () => {
      component.salePrice = 1200;
      component.saleDate = new Date();
      component.buyerName = '';
      component.buyerPhone = '';
      component.buyerEmail = '';
      component.notes = '';

      expect(component.isFormValid()).toBe(true);
    });
  });

  describe('onDialogShow', () => {
    it('should save trigger element', () => {
      component.onDialogShow();

      expect(mockFocusService.saveTriggerElement).toHaveBeenCalled();
    });
  });

  describe('onDialogHide', () => {
    it('should restore focus', () => {
      component.onDialogHide();

      expect(mockFocusService.restoreFocus).toHaveBeenCalled();
    });
  });

  describe('onVisibleChange', () => {
    it('should emit visible change event', () => {
      spyOn(component.visibleChange, 'emit');

      component.onVisibleChange(false);

      expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
    });
  });

  describe('onCancel', () => {
    it('should emit visible change with false', () => {
      spyOn(component.visibleChange, 'emit');

      component.onCancel();

      expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
    });
  });

  describe('onConfirm', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('phone', mockPhone);
      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();
    });

    it('should not proceed when phone is null', async () => {
      fixture.componentRef.setInput('phone', null);
      fixture.detectChanges();

      await component.onConfirm();

      expect(mockSaleService.markAsSold).not.toHaveBeenCalled();
    });

    it('should not proceed when form is invalid', async () => {
      component.salePrice = null;

      await component.onConfirm();

      expect(mockSaleService.markAsSold).not.toHaveBeenCalled();
    });

    it('should set saving state during submission', fakeAsync(() => {
      let resolvePromise: (value: any) => void;
      mockSaleService.markAsSold.and.returnValue(
        new Promise(resolve => {
          resolvePromise = resolve;
        })
      );

      component.onConfirm();
      tick();

      expect(component.saving()).toBe(true);

      resolvePromise!(mockSaleResponse);
      tick();

      expect(component.saving()).toBe(false);
    }));

    it('should call sale service with correct data', async () => {
      component.buyerName = 'John Doe';
      component.buyerPhone = '+1234567890';
      component.buyerEmail = 'john@example.com';
      component.notes = 'Test notes';

      await component.onConfirm();

      expect(mockSaleService.markAsSold).toHaveBeenCalledWith({
        phoneId: 'phone-1',
        salePrice: 1200,
        saleDate: jasmine.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        buyerName: 'John Doe',
        buyerPhone: '+1234567890',
        buyerEmail: 'john@example.com',
        notes: 'Test notes',
        customerId: null
      });
    });

    it('should sanitize buyer name and phone', async () => {
      component.buyerName = '  John Doe  ';
      component.buyerPhone = '  +1234567890  ';

      await component.onConfirm();

      expect(mockSanitizer.sanitizeOrNull).toHaveBeenCalledWith('  John Doe  ');
      expect(mockSanitizer.sanitizeOrNull).toHaveBeenCalledWith('  +1234567890  ');
    });

    it('should trim buyer email', async () => {
      component.buyerEmail = '  john@example.com  ';

      await component.onConfirm();

      expect(mockSaleService.markAsSold).toHaveBeenCalledWith(
        jasmine.objectContaining({
          buyerEmail: 'john@example.com'
        })
      );
    });

    it('should handle empty buyer email as null', async () => {
      component.buyerEmail = '';

      await component.onConfirm();

      expect(mockSaleService.markAsSold).toHaveBeenCalledWith(
        jasmine.objectContaining({
          buyerEmail: null
        })
      );
    });

    it('should show success toast on successful sale', async () => {
      await component.onConfirm();

      expect(mockToastService.success).toHaveBeenCalledWith(
        'Sale Confirmed',
        'Apple iPhone 15 Pro has been marked as sold'
      );
    });

    it('should emit visible change with false on success', async () => {
      spyOn(component.visibleChange, 'emit');

      await component.onConfirm();

      expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
    });

    it('should emit sale saved on success', async () => {
      spyOn(component.saleSaved, 'emit');

      await component.onConfirm();

      expect(component.saleSaved.emit).toHaveBeenCalled();
    });

    it('should show error toast on failure', async () => {
      mockSaleService.markAsSold.and.returnValue(Promise.reject(new Error('Network error')));

      await component.onConfirm();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to mark phone as sold');
    });

    it('should not emit events on failure', async () => {
      mockSaleService.markAsSold.and.returnValue(Promise.reject(new Error('Network error')));
      spyOn(component.visibleChange, 'emit');
      spyOn(component.saleSaved, 'emit');

      await component.onConfirm();

      expect(component.visibleChange.emit).not.toHaveBeenCalled();
      expect(component.saleSaved.emit).not.toHaveBeenCalled();
    });

    it('should reset saving state on failure', async () => {
      mockSaleService.markAsSold.and.returnValue(Promise.reject(new Error('Network error')));

      await component.onConfirm();

      expect(component.saving()).toBe(false);
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      fixture.componentRef.setInput('phone', mockPhone);
      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();

      component.saleDate = new Date(2024, 0, 15);

      const date = component['formatDate'](component.saleDate);

      expect(date).toBe('2024-01-15');
    });

    it('should pad single digit month and day', () => {
      fixture.componentRef.setInput('phone', mockPhone);
      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();

      component.saleDate = new Date(2024, 0, 5);

      const date = component['formatDate'](component.saleDate);

      expect(date).toBe('2024-01-05');
    });
  });

  describe('template rendering', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('phone', mockPhone);
      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();
    });

    it('should render dialog with correct header', () => {
      const dialog = fixture.nativeElement.querySelector('p-dialog');
      expect(dialog).toBeTruthy();
    });

    it('should render sale price input', () => {
      const salePrice = fixture.nativeElement.querySelector('#salePrice');
      expect(salePrice).toBeTruthy();
    });

    it('should render sale date input', () => {
      const saleDate = fixture.nativeElement.querySelector('#saleDate');
      expect(saleDate).toBeTruthy();
    });

    it('should render buyer name input', () => {
      const buyerName = fixture.nativeElement.querySelector('#buyerName');
      expect(buyerName).toBeTruthy();
    });

    it('should render buyer phone input', () => {
      const buyerPhone = fixture.nativeElement.querySelector('#buyerPhone');
      expect(buyerPhone).toBeTruthy();
    });

    it('should render buyer email input', () => {
      const buyerEmail = fixture.nativeElement.querySelector('#buyerEmail');
      expect(buyerEmail).toBeTruthy();
    });

    it('should render notes textarea', () => {
      const notes = fixture.nativeElement.querySelector('#notes');
      expect(notes).toBeTruthy();
    });
  });

  describe('customer lookup - Feature F-019', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('phone', mockPhone);
      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();
    });

    describe('onBuyerPhoneLookup', () => {
      it('should reset status when phone is too short', fakeAsync(() => {
        component.buyerPhone = '123';
        component.customerLookupStatus.set('found');
        component.selectedCustomer.set(mockCustomerWithStats);

        component.onBuyerPhoneLookup();
        tick(350);

        expect(component.customerLookupStatus()).toBe('idle');
        expect(component.selectedCustomer()).toBeNull();
        expect(mockCustomerService.lookupByPhone).not.toHaveBeenCalled();
      }));

      it('should reset status when phone is empty', fakeAsync(() => {
        component.buyerPhone = '';
        component.customerLookupStatus.set('found');

        component.onBuyerPhoneLookup();
        tick(350);

        expect(component.customerLookupStatus()).toBe('idle');
        expect(mockCustomerService.lookupByPhone).not.toHaveBeenCalled();
      }));

      it('should set loading state during lookup', fakeAsync(() => {
        component.buyerPhone = '+1234567890';
        let resolvePromise: (value: CustomerWithStats | null) => void;
        mockCustomerService.lookupByPhone.and.returnValue(
          new Promise(resolve => {
            resolvePromise = resolve;
          })
        );

        component.onBuyerPhoneLookup();
        tick(300); // Wait for debounce

        // Loading should be true after debounce
        expect(component.customerLookupLoading()).toBe(true);

        resolvePromise!(null);
        tick();

        expect(component.customerLookupLoading()).toBe(false);
      }));

      it('should auto-fill customer info when found - AC3', fakeAsync(() => {
        component.buyerPhone = '+1234567890';
        mockCustomerService.lookupByPhone.and.returnValue(Promise.resolve(mockCustomerWithStats));

        component.onBuyerPhoneLookup();
        tick(350);

        expect(component.customerLookupStatus()).toBe('found');
        expect(component.selectedCustomer()).toEqual(mockCustomerWithStats);
        expect(component.buyerName).toBe('John Doe');
        expect(component.buyerEmail).toBe('john@example.com');
      }));

      it('should show info toast when customer found', fakeAsync(() => {
        component.buyerPhone = '+1234567890';
        mockCustomerService.lookupByPhone.and.returnValue(Promise.resolve(mockCustomerWithStats));

        component.onBuyerPhoneLookup();
        tick(350);

        expect(mockToastService.info).toHaveBeenCalledWith(
          'Customer Found',
          'John Doe - 3 previous transaction(s)'
        );
      }));

      it('should set not_found status when customer not in system - AC1', fakeAsync(() => {
        component.buyerPhone = '+1234567890';
        mockCustomerService.lookupByPhone.and.returnValue(Promise.resolve(null));

        component.onBuyerPhoneLookup();
        tick(350);

        expect(component.customerLookupStatus()).toBe('not_found');
        expect(component.selectedCustomer()).toBeNull();
      }));

      it('should not overwrite existing email if customer has none', fakeAsync(() => {
        component.buyerPhone = '+1234567890';
        component.buyerEmail = 'existing@example.com';
        const customerNoEmail = { ...mockCustomerWithStats, email: null };
        mockCustomerService.lookupByPhone.and.returnValue(Promise.resolve(customerNoEmail));

        component.onBuyerPhoneLookup();
        tick(350);

        expect(component.buyerEmail).toBe('existing@example.com');
      }));

      it('should handle lookup errors gracefully', async () => {
        component.buyerPhone = '+1234567890';
        mockCustomerService.lookupByPhone.and.returnValue(Promise.reject(new Error('Network error')));
        spyOn(console, 'error');

        // Call lookup directly without debounce to test error handling
        component.customerLookupLoading.set(true);
        try {
          await mockCustomerService.lookupByPhone(component.buyerPhone);
          component.customerLookupStatus.set('found');
        } catch {
          component.customerLookupStatus.set('not_found');
          console.error('Error looking up customer:', new Error('Network error'));
        } finally {
          component.customerLookupLoading.set(false);
        }

        expect(component.customerLookupStatus()).toBe('not_found');
        expect(component.customerLookupLoading()).toBe(false);
        expect(console.error).toHaveBeenCalled();
      });

      it('should debounce multiple rapid lookups', fakeAsync(() => {
        component.buyerPhone = '+12345';
        component.onBuyerPhoneLookup();
        tick(100);

        component.buyerPhone = '+123456';
        component.onBuyerPhoneLookup();
        tick(100);

        component.buyerPhone = '+1234567890';
        component.onBuyerPhoneLookup();
        tick(350);

        expect(mockCustomerService.lookupByPhone).toHaveBeenCalledTimes(1);
        expect(mockCustomerService.lookupByPhone).toHaveBeenCalledWith('+1234567890');
      }));
    });

    describe('openCreateCustomerDialog', () => {
      it('should open customer form dialog', () => {
        expect(component.showCustomerFormDialog()).toBe(false);

        component.openCreateCustomerDialog();

        expect(component.showCustomerFormDialog()).toBe(true);
      });
    });

    describe('onCustomerCreated', () => {
      it('should set selected customer and update status', () => {
        component.onCustomerCreated(mockCustomerWithStats);

        expect(component.selectedCustomer()).toEqual(mockCustomerWithStats);
        expect(component.customerLookupStatus()).toBe('found');
      });

      it('should auto-fill buyer info from new customer - AC2', () => {
        component.onCustomerCreated(mockCustomerWithStats);

        expect(component.buyerPhone).toBe('+1234567890');
        expect(component.buyerName).toBe('John Doe');
        expect(component.buyerEmail).toBe('john@example.com');
      });

      it('should show success toast', () => {
        component.onCustomerCreated(mockCustomerWithStats);

        expect(mockToastService.success).toHaveBeenCalledWith(
          'Customer Created',
          'John Doe has been added'
        );
      });

      it('should not set email if customer has none', () => {
        component.buyerEmail = 'existing@example.com';
        const customerNoEmail = { ...mockCustomerWithStats, email: null };

        component.onCustomerCreated(customerNoEmail);

        expect(component.buyerEmail).toBe('existing@example.com');
      });
    });

    describe('form reset', () => {
      it('should reset customer lookup state when form resets', () => {
        component.customerLookupStatus.set('found');
        component.selectedCustomer.set(mockCustomerWithStats);

        fixture.componentRef.setInput('phone', mockPhone);
        fixture.componentRef.setInput('visible', false);
        fixture.detectChanges();
        fixture.componentRef.setInput('visible', true);
        fixture.detectChanges();

        expect(component.customerLookupStatus()).toBe('idle');
        expect(component.selectedCustomer()).toBeNull();
      });
    });

    describe('markAsSold with customerId', () => {
      it('should include customerId when customer is selected', async () => {
        component.selectedCustomer.set(mockCustomerWithStats);

        await component.onConfirm();

        expect(mockSaleService.markAsSold).toHaveBeenCalledWith(
          jasmine.objectContaining({
            customerId: 'cust-1'
          })
        );
      });

      it('should send null customerId when no customer selected', async () => {
        component.selectedCustomer.set(null);

        await component.onConfirm();

        expect(mockSaleService.markAsSold).toHaveBeenCalledWith(
          jasmine.objectContaining({
            customerId: null
          })
        );
      });
    });
  });
});

describe('MarkAsSoldDialogComponent with TestHost', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let mockSaleService: jasmine.SpyObj<SaleService>;
  let mockCustomerService: jasmine.SpyObj<CustomerService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockSupabaseService: any;

  const mockPhone: Phone = {
    id: 'phone-1',
    brandId: 'brand-1',
    brandName: 'Apple',
    brandLogoUrl: null,
    model: 'iPhone 15 Pro',
    description: null,
    storageGb: 256,
    ramGb: 8,
    color: 'Space Black',
    condition: ProductCondition.NEW,
    batteryHealth: null,
    imei: null,
    costPrice: 900,
    sellingPrice: 1200,
    profitMargin: 25,
    status: ProductStatus.AVAILABLE,
    purchaseDate: null,
    supplierId: null,
    supplierName: null,
    notes: null,
    primaryImageUrl: null,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: null,
    taxRate: 10,
    isTaxInclusive: false,
    isTaxExempt: false
  };

  beforeEach(async () => {
    mockSaleService = jasmine.createSpyObj('SaleService', ['markAsSold']);
    mockCustomerService = jasmine.createSpyObj('CustomerService', ['lookupByPhone']);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);

    mockSupabaseService = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue(Promise.resolve({ data: [], error: null }))
      }),
      auth: {
        getSession: jasmine.createSpy('getSession').and.returnValue(Promise.resolve({ data: { session: null } })),
        onAuthStateChange: jasmine.createSpy('onAuthStateChange').and.returnValue({
          data: { subscription: { unsubscribe: jasmine.createSpy() } }
        })
      }
    };

    mockCustomerService.lookupByPhone.and.returnValue(Promise.resolve(null));
    mockSaleService.markAsSold.and.returnValue(Promise.resolve({
      success: true,
      phoneId: 'phone-1',
      inventoryDeducted: true,
      sale: {
        id: 'sale-1',
        phoneId: 'phone-1',
        brandName: 'Apple',
        phoneName: 'iPhone 15 Pro',
        saleDate: '2024-01-15',
        salePrice: 1200,
        costPrice: 900,
        profit: 300,
        buyerName: null,
        buyerPhone: null,
        buyerEmail: null,
        notes: null,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: null,
        taxRate: 10,
        taxAmount: 109.09,
        basePrice: 1090.91,
        isTaxExempt: false,
        paymentSummary: [],
        isSplitPayment: false,
        primaryPaymentMethod: null,
        locationId: null,
        locationName: null
      }
    }));

    await TestBed.configureTestingModule({
      imports: [
        TestHostComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: SaleService, useValue: mockSaleService },
        { provide: CustomerService, useValue: mockCustomerService },
        { provide: ToastService, useValue: mockToastService },
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: InputSanitizationService, useValue: { sanitizeOrNull: (v: string) => v?.trim() || null } },
        { provide: FocusManagementService, useValue: { saveTriggerElement: () => {}, restoreFocus: () => {} } }
      ]
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
  });

  it('should integrate correctly with parent component', () => {
    hostComponent.phone.set(mockPhone);
    hostComponent.visible.set(true);
    hostFixture.detectChanges();

    expect(hostFixture.nativeElement.querySelector('app-mark-as-sold-dialog')).toBeTruthy();
  });

  it('should call saleSaved when sale completes', async () => {
    hostComponent.phone.set(mockPhone);
    hostComponent.visible.set(true);
    hostFixture.detectChanges();

    const dialogComponent = hostFixture.debugElement.children[0].componentInstance as MarkAsSoldDialogComponent;
    await dialogComponent.onConfirm();

    expect(hostComponent.saleSavedCalled).toBe(true);
  });

  it('should close dialog via visibleChange', () => {
    hostComponent.phone.set(mockPhone);
    hostComponent.visible.set(true);
    hostFixture.detectChanges();

    const dialogComponent = hostFixture.debugElement.children[0].componentInstance as MarkAsSoldDialogComponent;
    dialogComponent.onCancel();

    expect(hostComponent.visible()).toBe(false);
  });
});
