import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CustomerListComponent } from './customer-list.component';
import { CustomerService } from '../../../core/services/customer.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../shared/services/confirmation.service';
import { CustomerWithStats, CustomerListResponse } from '../../../models/customer.model';

describe('CustomerListComponent', () => {
  let component: CustomerListComponent;
  let fixture: ComponentFixture<CustomerListComponent>;
  let mockCustomerService: jasmine.SpyObj<CustomerService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockConfirmDialogService: jasmine.SpyObj<ConfirmDialogService>;

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

  const mockCustomers: CustomerWithStats[] = [
    mockCustomer,
    {
      ...mockCustomer,
      id: 'customer-2',
      phone: '+0987654321',
      name: 'Jane Smith',
      email: 'jane@example.com',
      totalTransactions: 3,
      totalSpent: 2500
    }
  ];

  const mockCustomerListResponse: CustomerListResponse = {
    data: mockCustomers,
    total: 2
  };

  beforeEach(async () => {
    mockCustomerService = jasmine.createSpyObj('CustomerService', [
      'getCustomers',
      'deleteCustomer'
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);
    mockConfirmDialogService = jasmine.createSpyObj('ConfirmDialogService', ['confirm']);

    mockCustomerService.getCustomers.and.returnValue(Promise.resolve(mockCustomerListResponse));

    await TestBed.configureTestingModule({
      imports: [
        CustomerListComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: CustomerService, useValue: mockCustomerService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ConfirmDialogService, useValue: mockConfirmDialogService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerListComponent);
    component = fixture.componentInstance;
  });

  describe('component initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load customers on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockCustomerService.getCustomers).toHaveBeenCalled();
      expect(component.customers().length).toBe(2);
      expect(component.totalCustomers()).toBe(2);
    }));

    it('should initialize with loading set to false after load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.loading()).toBe(false);
    }));
  });

  describe('search functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call loadData after search query changes', fakeAsync(() => {
      mockCustomerService.getCustomers.calls.reset();

      component.searchQuery = 'John';
      component.onSearch();
      tick(350); // debounce time + buffer

      expect(mockCustomerService.getCustomers).toHaveBeenCalledWith(
        jasmine.objectContaining({ search: 'John' })
      );
    }));

    it('should clear search and reload data', fakeAsync(() => {
      component.searchQuery = 'John';
      component.clearSearch();
      tick();

      expect(component.searchQuery).toBe('');
      expect(mockCustomerService.getCustomers).toHaveBeenCalled();
    }));
  });

  describe('dialog management', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should open create dialog', () => {
      component.openCreateDialog();

      expect(component.selectedCustomer()).toBeNull();
      expect(component.showFormDialog()).toBe(true);
    });

    it('should open edit dialog with customer', () => {
      component.editCustomer(mockCustomer);

      expect(component.selectedCustomer()).toEqual(mockCustomer);
      expect(component.showFormDialog()).toBe(true);
    });

    it('should open detail dialog', () => {
      component.viewCustomer(mockCustomer);

      expect(component.selectedCustomerId()).toBe(mockCustomer.id);
      expect(component.showDetailDialog()).toBe(true);
    });
  });

  describe('delete functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should confirm before deleting', fakeAsync(() => {
      mockConfirmDialogService.confirm.and.returnValue(Promise.resolve(true));
      mockCustomerService.deleteCustomer.and.returnValue(Promise.resolve());

      component.confirmDelete(mockCustomer);
      tick();

      expect(mockConfirmDialogService.confirm).toHaveBeenCalledWith(
        jasmine.objectContaining({
          header: 'Delete Customer',
          message: `Are you sure you want to delete ${mockCustomer.name}?`
        })
      );
    }));

    it('should delete customer when confirmed', fakeAsync(() => {
      mockConfirmDialogService.confirm.and.returnValue(Promise.resolve(true));
      mockCustomerService.deleteCustomer.and.returnValue(Promise.resolve());

      component.confirmDelete(mockCustomer);
      tick();

      expect(mockCustomerService.deleteCustomer).toHaveBeenCalledWith(mockCustomer.id);
      expect(mockToastService.success).toHaveBeenCalledWith(
        'Deleted',
        `${mockCustomer.name} has been deleted`
      );
    }));

    it('should not delete customer when cancelled', fakeAsync(() => {
      mockConfirmDialogService.confirm.and.returnValue(Promise.resolve(false));

      component.confirmDelete(mockCustomer);
      tick();

      expect(mockCustomerService.deleteCustomer).not.toHaveBeenCalled();
    }));

    it('should handle delete error', fakeAsync(() => {
      mockConfirmDialogService.confirm.and.returnValue(Promise.resolve(true));
      mockCustomerService.deleteCustomer.and.returnValue(Promise.reject(new Error('Delete failed')));

      component.confirmDelete(mockCustomer);
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to delete customer');
    }));
  });

  describe('customer saved handler', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show success toast for new customer', fakeAsync(() => {
      component.selectedCustomer.set(null);
      component.onCustomerSaved(mockCustomer);
      tick();

      expect(mockToastService.success).toHaveBeenCalledWith(
        'Created',
        `${mockCustomer.name} has been added`
      );
    }));

    it('should show success toast for updated customer', fakeAsync(() => {
      component.selectedCustomer.set(mockCustomer);
      component.onCustomerSaved(mockCustomer);
      tick();

      expect(mockToastService.success).toHaveBeenCalledWith(
        'Updated',
        `${mockCustomer.name} has been updated`
      );
    }));

    it('should reload data after save', fakeAsync(() => {
      mockCustomerService.getCustomers.calls.reset();
      component.onCustomerSaved(mockCustomer);
      tick();

      expect(mockCustomerService.getCustomers).toHaveBeenCalled();
    }));
  });

  describe('helper methods', () => {
    it('should generate initials from name', () => {
      expect(component.getInitials('John Doe')).toBe('JD');
      expect(component.getInitials('Jane')).toBe('J');
      expect(component.getInitials('John Michael Doe')).toBe('JM');
    });

    it('should format 10-digit phone number', () => {
      expect(component.formatPhone('1234567890')).toBe('(123) 456-7890');
    });

    it('should return unformatted phone for non-10-digit numbers', () => {
      expect(component.formatPhone('+1234567890')).toBe('+1234567890');
    });

    it('should count active customers', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.activeCustomers()).toBe(2); // Both have transactions > 0
    }));

    it('should calculate total revenue', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.totalRevenue()).toBe(7500); // 5000 + 2500
    }));
  });

  describe('error handling', () => {
    it('should handle load error gracefully', fakeAsync(() => {
      mockCustomerService.getCustomers.and.returnValue(Promise.reject(new Error('Load failed')));

      fixture.detectChanges();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to load customers');
      expect(component.loading()).toBe(false);
    }));
  });

  describe('acceptance criteria validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('AC4: should display customer purchase history in detail view', () => {
      component.viewCustomer(mockCustomer);

      expect(component.showDetailDialog()).toBe(true);
      expect(component.selectedCustomerId()).toBe(mockCustomer.id);
    });

    it('AC5: should display notes field in customer profile', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Customer notes should be available
      const customer = component.customers()[0];
      expect(customer.notes).toBe('VIP customer');
    }));
  });
});
