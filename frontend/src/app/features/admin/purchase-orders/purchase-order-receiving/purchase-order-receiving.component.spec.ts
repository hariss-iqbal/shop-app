import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { PurchaseOrderReceivingComponent } from './purchase-order-receiving.component';
import { PurchaseOrderService } from '../../../../core/services/purchase-order.service';
import { InputSanitizationService } from '../../../../core/services/input-sanitization.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';
import { PurchaseOrder, ReceivePurchaseOrderResponse } from '../../../../models/purchase-order.model';
import { PurchaseOrderStatus, PhoneCondition } from '../../../../enums';

describe('PurchaseOrderReceivingComponent', () => {
  let component: PurchaseOrderReceivingComponent;
  let fixture: ComponentFixture<PurchaseOrderReceivingComponent>;
  let mockPurchaseOrderService: jasmine.SpyObj<PurchaseOrderService>;
  let mockSanitizer: jasmine.SpyObj<InputSanitizationService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockFocusService: jasmine.SpyObj<FocusManagementService>;

  const mockPurchaseOrder: PurchaseOrder = {
    id: 'po-1',
    poNumber: 'PO-0001',
    supplierId: 'supplier-1',
    supplierName: 'Tech Supplies Inc',
    orderDate: '2024-01-15',
    totalAmount: 4000,
    status: PurchaseOrderStatus.PENDING,
    notes: null,
    items: [
      {
        id: 'item-1',
        purchaseOrderId: 'po-1',
        brand: 'Apple',
        model: 'iPhone 15',
        quantity: 2,
        unitCost: 800,
        lineTotal: 1600,
        createdAt: '2024-01-15T00:00:00Z'
      },
      {
        id: 'item-2',
        purchaseOrderId: 'po-1',
        brand: 'Samsung',
        model: 'Galaxy S24',
        quantity: 1,
        unitCost: 1000,
        lineTotal: 1000,
        createdAt: '2024-01-15T00:00:00Z'
      }
    ],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: null
  };

  beforeEach(async () => {
    mockPurchaseOrderService = jasmine.createSpyObj('PurchaseOrderService', ['receiveWithInventory']);
    mockSanitizer = jasmine.createSpyObj('InputSanitizationService', ['sanitize', 'sanitizeOrNull']);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error']);
    mockFocusService = jasmine.createSpyObj('FocusManagementService', ['saveTriggerElement', 'restoreFocus']);

    // Default sanitizer behavior
    mockSanitizer.sanitize.and.callFake((value: string) => value);
    mockSanitizer.sanitizeOrNull.and.callFake((value: string | null) => value);

    await TestBed.configureTestingModule({
      imports: [PurchaseOrderReceivingComponent],
      providers: [
        provideNoopAnimations(),
        FormBuilder,
        { provide: PurchaseOrderService, useValue: mockPurchaseOrderService },
        { provide: InputSanitizationService, useValue: mockSanitizer },
        { provide: ToastService, useValue: mockToastService },
        { provide: FocusManagementService, useValue: mockFocusService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PurchaseOrderReceivingComponent);
    component = fixture.componentInstance;
    component.purchaseOrder = mockPurchaseOrder;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should initialize form with correct number of phone entries', () => {
      // 2 from first item + 1 from second item = 3 total
      expect(component.phonesArray.length).toBe(3);
    });

    it('should pre-fill brand and model from PO items', () => {
      const firstPhone = component.phonesArray.at(0);
      const secondPhone = component.phonesArray.at(1);
      const thirdPhone = component.phonesArray.at(2);

      expect(firstPhone.get('brand')?.value).toBe('Apple');
      expect(firstPhone.get('model')?.value).toBe('iPhone 15');
      expect(secondPhone.get('brand')?.value).toBe('Apple');
      expect(secondPhone.get('model')?.value).toBe('iPhone 15');
      expect(thirdPhone.get('brand')?.value).toBe('Samsung');
      expect(thirdPhone.get('model')?.value).toBe('Galaxy S24');
    });

    it('should set default condition to NEW', () => {
      const firstPhone = component.phonesArray.at(0);
      expect(firstPhone.get('condition')?.value).toBe(PhoneCondition.NEW);
    });

    it('should require condition and selling price', () => {
      const firstPhone = component.phonesArray.at(0);

      // Clear required fields
      firstPhone.get('condition')?.setValue(null);
      firstPhone.get('sellingPrice')?.setValue(null);

      expect(firstPhone.get('condition')?.invalid).toBeTrue();
      expect(firstPhone.get('sellingPrice')?.invalid).toBeTrue();
    });
  });

  describe('totalUnits', () => {
    it('should return 0 when no purchase order', () => {
      component.purchaseOrder = null;
      expect(component.totalUnits()).toBe(0);
    });

    it('should calculate total units correctly', () => {
      fixture.detectChanges();
      expect(component.totalUnits()).toBe(3); // 2 + 1
    });
  });

  describe('invalidCount', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should count invalid forms', () => {
      // All forms start with condition=NEW but sellingPrice=null
      expect(component.invalidCount()).toBe(3);
    });

    it('should update count when forms become valid', () => {
      // Make first phone valid
      component.phonesArray.at(0).get('sellingPrice')?.setValue(999);

      expect(component.invalidCount()).toBe(2);
    });

    it('should be 0 when all forms are valid', () => {
      component.phonesArray.controls.forEach(control => {
        control.get('sellingPrice')?.setValue(999);
      });

      expect(component.invalidCount()).toBe(0);
    });
  });

  describe('getFormIndex', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return correct index for first item, first unit', () => {
      expect(component.getFormIndex(0, 0)).toBe(0);
    });

    it('should return correct index for first item, second unit', () => {
      expect(component.getFormIndex(0, 1)).toBe(1);
    });

    it('should return correct index for second item, first unit', () => {
      // First item has 2 units, so second item starts at index 2
      expect(component.getFormIndex(1, 0)).toBe(2);
    });
  });

  describe('getUnitRange', () => {
    it('should return correct range for quantity', () => {
      expect(component.getUnitRange(3)).toEqual([0, 1, 2]);
      expect(component.getUnitRange(1)).toEqual([0]);
      expect(component.getUnitRange(5)).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('shouldShowBatteryHealth', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false for NEW condition', () => {
      component.phonesArray.at(0).get('condition')?.setValue(PhoneCondition.NEW);
      expect(component.shouldShowBatteryHealth(0)).toBeFalse();
    });

    it('should return true for USED condition', () => {
      component.phonesArray.at(0).get('condition')?.setValue(PhoneCondition.USED);
      expect(component.shouldShowBatteryHealth(0)).toBeTrue();
    });

    it('should return true for REFURBISHED condition', () => {
      component.phonesArray.at(0).get('condition')?.setValue(PhoneCondition.REFURBISHED);
      expect(component.shouldShowBatteryHealth(0)).toBeTrue();
    });
  });

  describe('isFormValid', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when form is invalid', () => {
      expect(component.isFormValid()).toBeFalse();
    });

    it('should return true when form is valid', () => {
      component.phonesArray.controls.forEach(control => {
        control.get('sellingPrice')?.setValue(999);
      });

      expect(component.isFormValid()).toBeTrue();
    });
  });

  describe('onSubmit', () => {
    const mockResponse: ReceivePurchaseOrderResponse = {
      purchaseOrder: { ...mockPurchaseOrder, status: PurchaseOrderStatus.RECEIVED },
      phonesCreated: 3,
      createdPhoneIds: ['phone-1', 'phone-2', 'phone-3']
    };

    beforeEach(() => {
      fixture.detectChanges();
      // Make form valid
      component.phonesArray.controls.forEach(control => {
        control.get('sellingPrice')?.setValue(999);
      });
    });

    it('should not submit when form is invalid', fakeAsync(() => {
      component.phonesArray.at(0).get('sellingPrice')?.setValue(null);

      component.onSubmit();
      tick();

      expect(mockPurchaseOrderService.receiveWithInventory).not.toHaveBeenCalled();
    }));

    it('should call receiveWithInventory with correct data', fakeAsync(() => {
      mockPurchaseOrderService.receiveWithInventory.and.returnValue(Promise.resolve(mockResponse));
      spyOn(component.received, 'emit');

      component.onSubmit();
      tick();

      expect(mockPurchaseOrderService.receiveWithInventory).toHaveBeenCalledWith(
        'po-1',
        jasmine.objectContaining({
          phones: jasmine.any(Array)
        })
      );
      expect(mockPurchaseOrderService.receiveWithInventory.calls.first().args[1].phones.length).toBe(3);
    }));

    it('should show success toast on successful submission', fakeAsync(() => {
      mockPurchaseOrderService.receiveWithInventory.and.returnValue(Promise.resolve(mockResponse));

      component.onSubmit();
      tick();

      expect(mockToastService.success).toHaveBeenCalledWith(
        'Order Received',
        'Successfully created 3 phones in inventory'
      );
    }));

    it('should emit received event on success', fakeAsync(() => {
      mockPurchaseOrderService.receiveWithInventory.and.returnValue(Promise.resolve(mockResponse));
      spyOn(component.received, 'emit');

      component.onSubmit();
      tick();

      expect(component.received.emit).toHaveBeenCalledWith({ phonesCreated: 3 });
    }));

    it('should close dialog on success', fakeAsync(() => {
      mockPurchaseOrderService.receiveWithInventory.and.returnValue(Promise.resolve(mockResponse));

      component.onSubmit();
      tick();

      expect(component.visible).toBeFalse();
    }));

    it('should show error toast on failure', fakeAsync(() => {
      mockPurchaseOrderService.receiveWithInventory.and.returnValue(
        Promise.reject(new Error('Duplicate IMEI'))
      );

      component.onSubmit();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Duplicate IMEI');
    }));

    it('should set and clear saving state', fakeAsync(() => {
      mockPurchaseOrderService.receiveWithInventory.and.returnValue(
        new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      );

      expect(component.saving()).toBeFalse();

      component.onSubmit();
      tick(50);

      expect(component.saving()).toBeTrue();

      tick(100);

      expect(component.saving()).toBeFalse();
    }));

    it('should sanitize input values', fakeAsync(() => {
      mockPurchaseOrderService.receiveWithInventory.and.returnValue(Promise.resolve(mockResponse));

      component.onSubmit();
      tick();

      expect(mockSanitizer.sanitize).toHaveBeenCalled();
      expect(mockSanitizer.sanitizeOrNull).toHaveBeenCalled();
    }));
  });

  describe('onCancel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should close dialog when not saving', () => {
      spyOn(component.closed, 'emit');

      component.onCancel();

      expect(component.visible).toBeFalse();
      expect(component.closed.emit).toHaveBeenCalled();
    });

    it('should not close dialog when saving', fakeAsync(() => {
      mockPurchaseOrderService.receiveWithInventory.and.returnValue(
        new Promise(resolve => setTimeout(() => resolve({} as ReceivePurchaseOrderResponse), 1000))
      );
      component.phonesArray.controls.forEach(control => {
        control.get('sellingPrice')?.setValue(999);
      });

      component.onSubmit();
      tick(50);

      spyOn(component.closed, 'emit');
      component.onCancel();

      expect(component.closed.emit).not.toHaveBeenCalled();
    }));
  });

  describe('Dialog lifecycle', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should save trigger element on show', () => {
      component.onDialogShow();
      expect(mockFocusService.saveTriggerElement).toHaveBeenCalled();
    });

    it('should restore focus and cancel on hide', () => {
      spyOn(component.closed, 'emit');

      component.onDialogHide();

      expect(mockFocusService.restoreFocus).toHaveBeenCalled();
      expect(component.closed.emit).toHaveBeenCalled();
    });
  });

  describe('Condition options', () => {
    it('should have all three condition options', () => {
      expect(component.conditionOptions.length).toBe(3);
      expect(component.conditionOptions.map(o => o.value)).toEqual([
        PhoneCondition.NEW,
        PhoneCondition.USED,
        PhoneCondition.REFURBISHED
      ]);
    });
  });

  describe('onConditionChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should enable battery health for USED condition', () => {
      const firstPhone = component.phonesArray.at(0);
      firstPhone.get('condition')?.setValue(PhoneCondition.USED);

      component.onConditionChange(0);

      expect(firstPhone.get('batteryHealth')?.disabled).toBeFalse();
    });

    it('should enable battery health for REFURBISHED condition', () => {
      const firstPhone = component.phonesArray.at(0);
      firstPhone.get('condition')?.setValue(PhoneCondition.REFURBISHED);

      component.onConditionChange(0);

      expect(firstPhone.get('batteryHealth')?.disabled).toBeFalse();
    });

    it('should disable and clear battery health for NEW condition', () => {
      const firstPhone = component.phonesArray.at(0);

      // First set to USED with battery health value
      firstPhone.get('condition')?.setValue(PhoneCondition.USED);
      component.onConditionChange(0);
      firstPhone.get('batteryHealth')?.setValue(85);

      // Then change back to NEW
      firstPhone.get('condition')?.setValue(PhoneCondition.NEW);
      component.onConditionChange(0);

      expect(firstPhone.get('batteryHealth')?.disabled).toBeTrue();
      expect(firstPhone.get('batteryHealth')?.value).toBeNull();
    });
  });

  describe('getLineItemValidCount', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return 0 when no phones are valid', () => {
      expect(component.getLineItemValidCount(0)).toBe(0);
    });

    it('should count valid phones in a line item', () => {
      // Make first phone valid
      component.phonesArray.at(0).get('sellingPrice')?.setValue(999);

      expect(component.getLineItemValidCount(0)).toBe(1);
    });

    it('should return full count when all phones in item are valid', () => {
      // Make both phones in first item valid
      component.phonesArray.at(0).get('sellingPrice')?.setValue(999);
      component.phonesArray.at(1).get('sellingPrice')?.setValue(999);

      expect(component.getLineItemValidCount(0)).toBe(2);
    });
  });

  describe('applyToAll', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should apply condition to all phones', () => {
      component.applyToAll('condition', PhoneCondition.USED);

      component.phonesArray.controls.forEach(control => {
        expect(control.get('condition')?.value).toBe(PhoneCondition.USED);
      });
    });

    it('should apply selling price to all phones', () => {
      component.applyToAll('sellingPrice', 1299);

      component.phonesArray.controls.forEach(control => {
        expect(control.get('sellingPrice')?.value).toBe(1299);
      });
    });

    it('should show success toast', () => {
      component.applyToAll('condition', PhoneCondition.NEW);

      expect(mockToastService.success).toHaveBeenCalledWith('Applied', 'condition updated for all phones');
    });
  });

  describe('copyFirstToAll', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should copy first phone values to all others', () => {
      const firstPhone = component.phonesArray.at(0);
      firstPhone.get('sellingPrice')?.setValue(1099);
      firstPhone.get('color')?.setValue('Space Gray');
      firstPhone.get('storageGb')?.setValue(256);
      firstPhone.get('ramGb')?.setValue(8);
      firstPhone.get('notes')?.setValue('Test note');

      component.copyFirstToAll();

      for (let i = 1; i < component.phonesArray.length; i++) {
        const control = component.phonesArray.at(i);
        expect(control.get('sellingPrice')?.value).toBe(1099);
        expect(control.get('color')?.value).toBe('Space Gray');
        expect(control.get('storageGb')?.value).toBe(256);
        expect(control.get('ramGb')?.value).toBe(8);
        expect(control.get('notes')?.value).toBe('Test note');
      }
    });

    it('should show success toast', () => {
      component.copyFirstToAll();

      expect(mockToastService.success).toHaveBeenCalledWith(
        'Copied',
        'First phone values copied to all other phones'
      );
    });

    it('should not copy IMEI (each phone should have unique IMEI)', () => {
      const firstPhone = component.phonesArray.at(0);
      firstPhone.get('imei')?.setValue('123456789012345');

      component.copyFirstToAll();

      // IMEI should not be copied
      for (let i = 1; i < component.phonesArray.length; i++) {
        const control = component.phonesArray.at(i);
        expect(control.get('imei')?.value).toBe('');
      }
    });
  });

  describe('copyFirstToRest', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should copy first unit values to other units in same line item', () => {
      const firstPhone = component.phonesArray.at(0);
      firstPhone.get('sellingPrice')?.setValue(1099);
      firstPhone.get('color')?.setValue('Midnight');

      const mockEvent = { stopPropagation: jasmine.createSpy('stopPropagation') } as unknown as Event;
      component.copyFirstToRest(0, mockEvent);

      // Second unit (index 1) should have copied values
      expect(component.phonesArray.at(1).get('sellingPrice')?.value).toBe(1099);
      expect(component.phonesArray.at(1).get('color')?.value).toBe('Midnight');

      // Third unit (different line item) should not be affected
      expect(component.phonesArray.at(2).get('sellingPrice')?.value).toBeNull();
    });

    it('should stop event propagation', () => {
      const mockEvent = { stopPropagation: jasmine.createSpy('stopPropagation') } as unknown as Event;

      component.copyFirstToRest(0, mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should show success toast with correct count', () => {
      const mockEvent = { stopPropagation: jasmine.createSpy('stopPropagation') } as unknown as Event;

      component.copyFirstToRest(0, mockEvent);

      expect(mockToastService.success).toHaveBeenCalledWith(
        'Copied',
        'First unit values copied to 1 other unit(s)'
      );
    });
  });

  describe('Battery health control state', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should initialize battery health as disabled (NEW condition)', () => {
      component.phonesArray.controls.forEach(control => {
        expect(control.get('batteryHealth')?.disabled).toBeTrue();
      });
    });

    it('should include battery health in getRawValue even when disabled', () => {
      const firstPhone = component.phonesArray.at(0);

      // Enable and set value
      firstPhone.get('condition')?.setValue(PhoneCondition.USED);
      component.onConditionChange(0);
      firstPhone.get('batteryHealth')?.setValue(90);

      // Then disable
      firstPhone.get('condition')?.setValue(PhoneCondition.NEW);
      component.onConditionChange(0);

      // getRawValue should still include batteryHealth (as null)
      const rawValue = component.phonesArray.getRawValue();
      expect(rawValue[0].batteryHealth).toBeNull();
    });
  });

  describe('Quick fill menu items', () => {
    it('should have menu items for all conditions', () => {
      const conditionItems = component.quickFillMenuItems.filter(
        item => item.label && item.label.includes('Condition')
      );
      expect(conditionItems.length).toBe(3);
    });

    it('should have copy first to all option', () => {
      const copyItem = component.quickFillMenuItems.find(
        item => item.label === 'Copy First Phone to All'
      );
      expect(copyItem).toBeTruthy();
    });
  });
});
