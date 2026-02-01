import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CustomerFormDialogComponent } from './customer-form-dialog.component';
import { CustomerService } from '../../../core/services/customer.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CustomerWithStats, Customer, CUSTOMER_VALIDATION } from '../../../models/customer.model';

describe('CustomerFormDialogComponent', () => {
  let component: CustomerFormDialogComponent;
  let fixture: ComponentFixture<CustomerFormDialogComponent>;
  let mockCustomerService: jasmine.SpyObj<CustomerService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  const mockCustomer: CustomerWithStats = {
    id: 'customer-1',
    phone: '+1234567890',
    name: 'John Doe',
    email: 'john@example.com',
    notes: 'VIP customer',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: null,
    totalTransactions: 5,
    totalSpent: 5000,
    lastPurchaseDate: '2024-01-10'
  };

  const mockCreatedCustomer: Customer = {
    id: 'customer-2',
    phone: '+0987654321',
    name: 'Jane Smith',
    email: 'jane@example.com',
    notes: null,
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: null
  };

  beforeEach(async () => {
    mockCustomerService = jasmine.createSpyObj('CustomerService', [
      'createCustomer',
      'updateCustomer'
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', ['error']);

    await TestBed.configureTestingModule({
      imports: [
        CustomerFormDialogComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: CustomerService, useValue: mockCustomerService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerFormDialogComponent);
    component = fixture.componentInstance;
  });

  describe('component initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have validation constants', () => {
      expect(component.CUSTOMER_VALIDATION).toBeDefined();
      expect(component.CUSTOMER_VALIDATION.PHONE_MAX).toBe(30);
      expect(component.CUSTOMER_VALIDATION.NAME_MAX).toBe(200);
      expect(component.CUSTOMER_VALIDATION.EMAIL_MAX).toBe(255);
      expect(component.CUSTOMER_VALIDATION.NOTES_MAX).toBe(2000);
    });

    it('should initialize form with empty values', () => {
      fixture.detectChanges();

      expect(component.form.value).toEqual({
        phone: '',
        name: '',
        email: '',
        notes: ''
      });
    });
  });

  describe('form validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require phone number', () => {
      component.form.patchValue({ phone: '' });
      expect(component.form.get('phone')?.valid).toBe(false);

      component.form.patchValue({ phone: '1234567890' });
      expect(component.form.get('phone')?.valid).toBe(true);
    });

    it('should require name', () => {
      component.form.patchValue({ name: '' });
      expect(component.form.get('name')?.valid).toBe(false);

      component.form.patchValue({ name: 'John Doe' });
      expect(component.form.get('name')?.valid).toBe(true);
    });

    it('should validate email format', () => {
      component.form.patchValue({ email: 'invalid-email' });
      expect(component.form.get('email')?.valid).toBe(false);

      component.form.patchValue({ email: 'valid@example.com' });
      expect(component.form.get('email')?.valid).toBe(true);
    });

    it('should allow empty email', () => {
      component.form.patchValue({ email: '' });
      expect(component.form.get('email')?.valid).toBe(true);
    });

    it('should enforce maxlength on phone', () => {
      const longPhone = '1'.repeat(CUSTOMER_VALIDATION.PHONE_MAX + 1);
      component.form.patchValue({ phone: longPhone });
      expect(component.form.get('phone')?.valid).toBe(false);
    });

    it('should enforce maxlength on name', () => {
      const longName = 'a'.repeat(CUSTOMER_VALIDATION.NAME_MAX + 1);
      component.form.patchValue({ name: longName });
      expect(component.form.get('name')?.valid).toBe(false);
    });

    it('should enforce maxlength on notes', () => {
      const longNotes = 'a'.repeat(CUSTOMER_VALIDATION.NOTES_MAX + 1);
      component.form.patchValue({ notes: longNotes });
      expect(component.form.get('notes')?.valid).toBe(false);
    });
  });

  describe('editing mode', () => {
    it('should patch form with customer data', () => {
      component.visible = true;
      component.customer = mockCustomer;
      fixture.detectChanges();

      // Trigger ngOnChanges
      component.ngOnChanges({
        visible: { currentValue: true, previousValue: false, firstChange: true, isFirstChange: () => true },
        customer: { currentValue: mockCustomer, previousValue: null, firstChange: true, isFirstChange: () => true }
      });

      expect(component.form.value).toEqual({
        phone: mockCustomer.phone,
        name: mockCustomer.name,
        email: mockCustomer.email,
        notes: mockCustomer.notes
      });
    });

    it('should reset form when dialog opens for new customer', () => {
      component.visible = true;
      component.customer = null;
      fixture.detectChanges();

      component.ngOnChanges({
        visible: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false }
      });

      expect(component.form.value).toEqual({
        phone: '',
        name: '',
        email: '',
        notes: ''
      });
    });
  });

  describe('form submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not submit if form is invalid', fakeAsync(() => {
      spyOn(component.saved, 'emit');

      component.form.patchValue({ phone: '', name: '' });
      component.onSubmit();
      tick();

      expect(mockCustomerService.createCustomer).not.toHaveBeenCalled();
      expect(component.saved.emit).not.toHaveBeenCalled();
    }));

    it('should create new customer when not editing', fakeAsync(() => {
      mockCustomerService.createCustomer.and.returnValue(Promise.resolve(mockCreatedCustomer));
      spyOn(component.saved, 'emit');
      spyOn(component.visibleChange, 'emit');

      component.customer = null;
      component.form.patchValue({
        phone: '+0987654321',
        name: 'Jane Smith',
        email: 'jane@example.com',
        notes: ''
      });

      component.onSubmit();
      tick();

      expect(mockCustomerService.createCustomer).toHaveBeenCalledWith({
        phone: '+0987654321',
        name: 'Jane Smith',
        email: 'jane@example.com',
        notes: null
      });
      expect(component.saved.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        ...mockCreatedCustomer,
        totalTransactions: 0,
        totalSpent: 0,
        lastPurchaseDate: null
      }));
      expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
    }));

    it('should update existing customer when editing', fakeAsync(() => {
      const updatedCustomer: Customer = { ...mockCreatedCustomer, id: mockCustomer.id };
      mockCustomerService.updateCustomer.and.returnValue(Promise.resolve(updatedCustomer));
      spyOn(component.saved, 'emit');
      spyOn(component.visibleChange, 'emit');

      component.customer = mockCustomer;
      component.form.patchValue({
        phone: '+1234567890',
        name: 'John Doe Updated',
        email: 'john.updated@example.com',
        notes: 'Updated notes'
      });

      component.onSubmit();
      tick();

      expect(mockCustomerService.updateCustomer).toHaveBeenCalledWith(mockCustomer.id, {
        phone: '+1234567890',
        name: 'John Doe Updated',
        email: 'john.updated@example.com',
        notes: 'Updated notes'
      });
      expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
    }));

    it('should handle duplicate phone error', fakeAsync(() => {
      const duplicateError = new Error('A customer with this phone number already exists');
      mockCustomerService.createCustomer.and.returnValue(Promise.reject(duplicateError));

      component.customer = null;
      component.form.patchValue({
        phone: '+1234567890',
        name: 'Test User'
      });

      component.onSubmit();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Error',
        'A customer with this phone number already exists'
      );
      expect(component.saving()).toBe(false);
    }));

    it('should handle general error', fakeAsync(() => {
      mockCustomerService.createCustomer.and.returnValue(Promise.reject(new Error('Server error')));

      component.customer = null;
      component.form.patchValue({
        phone: '+1234567890',
        name: 'Test User'
      });

      component.onSubmit();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Server error');
      expect(component.saving()).toBe(false);
    }));
  });

  describe('dialog visibility', () => {
    it('should emit visibility change when closing', () => {
      spyOn(component.visibleChange, 'emit');

      component.onVisibleChange(false);

      expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
    });

    it('should not close when saving', () => {
      spyOn(component.visibleChange, 'emit');
      component.saving.set(true);

      component.onVisibleChange(false);

      expect(component.visibleChange.emit).not.toHaveBeenCalled();
    });
  });

  describe('acceptance criteria validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('AC2: should store name and phone when profile is saved', fakeAsync(() => {
      mockCustomerService.createCustomer.and.returnValue(Promise.resolve(mockCreatedCustomer));
      spyOn(component.saved, 'emit');

      component.customer = null;
      component.form.patchValue({
        phone: '+0987654321',
        name: 'Jane Smith'
      });

      component.onSubmit();
      tick();

      expect(mockCustomerService.createCustomer).toHaveBeenCalledWith(
        jasmine.objectContaining({
          phone: '+0987654321',
          name: 'Jane Smith'
        })
      );
    }));

    it('AC5: should have notes field for customer preferences', () => {
      expect(component.form.get('notes')).toBeTruthy();

      component.form.patchValue({
        notes: 'Prefers early morning delivery'
      });

      expect(component.form.get('notes')?.value).toBe('Prefers early morning delivery');
    });
  });
});
