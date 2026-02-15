import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { CustomerDetailDialogComponent } from './customer-detail-dialog.component';
import { CustomerService } from '../../../core/services/customer.service';
import { EmailReceiptService } from '../../../core/services/email-receipt.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CustomerProfile, Customer, CustomerSaleHistoryItem } from '../../../models/customer.model';

describe('CustomerDetailDialogComponent', () => {
  let component: CustomerDetailDialogComponent;
  let fixture: ComponentFixture<CustomerDetailDialogComponent>;
  let mockCustomerService: jasmine.SpyObj<CustomerService>;
  let mockEmailReceiptService: jasmine.SpyObj<EmailReceiptService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  const mockCustomer: Customer = {
    id: 'customer-1',
    phone: '+1234567890',
    name: 'John Doe',
    email: 'john@example.com',
    notes: 'VIP customer - prefers morning delivery',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: null
  };

  const mockSales: CustomerSaleHistoryItem[] = [
    {
      id: 'sale-1',
      productId: 'phone-1',
      saleDate: '2024-01-15',
      salePrice: 1200,
      productName: 'iPhone 15 Pro',
      brandName: 'Apple'
    },
    {
      id: 'sale-2',
      productId: 'phone-2',
      saleDate: '2024-01-10',
      salePrice: 1000,
      productName: 'Galaxy S24',
      brandName: 'Samsung'
    }
  ];

  const mockCustomerProfile: CustomerProfile = {
    customer: mockCustomer,
    sales: mockSales,
    stats: {
      totalTransactions: 2,
      totalSpent: 2200,
      lastPurchaseDate: '2024-01-15'
    }
  };

  beforeEach(async () => {
    mockCustomerService = jasmine.createSpyObj('CustomerService', [
      'getCustomerPurchaseHistory'
    ]);
    mockEmailReceiptService = jasmine.createSpyObj('EmailReceiptService', [
      'isValidEmail',
      'sendCustomerReceipts'
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);

    mockCustomerService.getCustomerPurchaseHistory.and.returnValue(Promise.resolve(mockCustomerProfile));
    mockEmailReceiptService.isValidEmail.and.callFake((email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    });

    await TestBed.configureTestingModule({
      imports: [
        CustomerDetailDialogComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideRouter([]),
        { provide: CustomerService, useValue: mockCustomerService },
        { provide: EmailReceiptService, useValue: mockEmailReceiptService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerDetailDialogComponent);
    component = fixture.componentInstance;
  });

  describe('component initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with null customer data', () => {
      expect(component.customerData()).toBeNull();
    });

    it('should initialize with loading false', () => {
      expect(component.loading()).toBe(false);
    });
  });

  describe('customer loading', () => {
    it('should load customer when customerId is set', fakeAsync(() => {
      component.customerId = 'customer-1';
      tick();

      expect(mockCustomerService.getCustomerPurchaseHistory).toHaveBeenCalledWith('customer-1');
    }));

    it('should set customerData after loading', fakeAsync(() => {
      component.customerId = 'customer-1';
      tick();

      expect(component.customerData()).toEqual(mockCustomerProfile);
    }));

    it('should initialize sales for email selection', fakeAsync(() => {
      component.customerId = 'customer-1';
      tick();

      expect(component.salesForEmail.length).toBe(2);
      expect(component.salesForEmail[0].selected).toBe(false);
    }));

    it('should pre-fill email address if customer has one', fakeAsync(() => {
      component.customerId = 'customer-1';
      tick();

      expect(component.emailAddress).toBe('john@example.com');
    }));

    it('should handle load error', fakeAsync(() => {
      mockCustomerService.getCustomerPurchaseHistory.and.returnValue(
        Promise.reject(new Error('Customer not found'))
      );

      component.customerId = 'invalid-customer';
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to load customer details');
      expect(component.customerData()).toBeNull();
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
  });

  describe('edit functionality', () => {
    it('should emit edit event with customer id', fakeAsync(() => {
      spyOn(component.edit, 'emit');
      component.customerId = 'customer-1';
      tick();

      component.onEdit();

      expect(component.edit.emit).toHaveBeenCalledWith('customer-1');
    }));
  });

  describe('email functionality', () => {
    beforeEach(fakeAsync(() => {
      component.customerId = 'customer-1';
      tick();
    }));

    it('should check if email is on file', () => {
      expect(component.hasEmailOnFile()).toBe(true);
    });

    it('should return false if no email on file', fakeAsync(() => {
      mockCustomerService.getCustomerPurchaseHistory.and.returnValue(
        Promise.resolve({
          ...mockCustomerProfile,
          customer: { ...mockCustomer, email: null }
        })
      );

      component.customerId = 'customer-2';
      tick();

      expect(component.hasEmailOnFile()).toBe(false);
    }));

    it('should toggle email section', () => {
      expect(component.showEmailSection()).toBe(false);

      component.toggleEmailSection();
      expect(component.showEmailSection()).toBe(true);

      component.toggleEmailSection();
      expect(component.showEmailSection()).toBe(false);
    });

    it('should hide email section', () => {
      component.showEmailSection.set(true);
      component.hideEmailSection();

      expect(component.showEmailSection()).toBe(false);
    });

    it('should validate email', () => {
      component.emailAddress = 'valid@example.com';
      expect(component.isEmailValid()).toBe(true);

      component.emailAddress = 'invalid';
      expect(component.isEmailValid()).toBe(false);
    });

    it('should select all receipts', () => {
      component.selectAllReceipts();

      expect(component.salesForEmail.every(s => s.selected)).toBe(true);
      expect(component.selectedReceiptCount()).toBe(2);
    });

    it('should clear receipt selection', () => {
      component.selectAllReceipts();
      component.clearReceiptSelection();

      expect(component.salesForEmail.every(s => !s.selected)).toBe(true);
      expect(component.selectedReceiptCount()).toBe(0);
    });

    it('should check if can send email', () => {
      expect(component.canSendEmail()).toBe(false);

      component.emailAddress = 'valid@example.com';
      component.selectAllReceipts();

      expect(component.canSendEmail()).toBe(true);
    });

    it('should send email receipts', fakeAsync(() => {
      mockEmailReceiptService.sendCustomerReceipts.and.returnValue(
        Promise.resolve({
          success: true,
          sentCount: 2,
          failedCount: 0,
          message: 'Sent',
          results: [
            { receiptId: 'sale-1', receiptNumber: 'R-001', success: true },
            { receiptId: 'sale-2', receiptNumber: 'R-002', success: true }
          ]
        })
      );
      spyOn(component.emailsSent, 'emit');

      component.emailAddress = 'john@example.com';
      component.selectAllReceipts();

      component.sendEmailReceipts();
      tick();

      expect(mockEmailReceiptService.sendCustomerReceipts).toHaveBeenCalledWith(
        jasmine.objectContaining({
          customerId: 'customer-1',
          recipientEmail: 'john@example.com',
          receiptIds: ['sale-1', 'sale-2']
        }),
        jasmine.objectContaining({ showSuccessToast: false, showErrorToast: false })
      );
      expect(component.emailSuccess()).toContain('Successfully sent 2 receipts');
      expect(component.emailsSent.emit).toHaveBeenCalled();
    }));

    it('should handle email send error', fakeAsync(() => {
      mockEmailReceiptService.sendCustomerReceipts.and.returnValue(
        Promise.resolve({
          success: false,
          sentCount: 0,
          failedCount: 2,
          message: 'Failed to send',
          results: [
            { receiptId: 'sale-1', receiptNumber: 'R-001', success: false, error: 'Failed' },
            { receiptId: 'sale-2', receiptNumber: 'R-002', success: false, error: 'Failed' }
          ]
        })
      );

      component.emailAddress = 'john@example.com';
      component.selectAllReceipts();

      component.sendEmailReceipts();
      tick();

      expect(component.emailError()).toBe('Failed to send');
    }));

    it('should get email button tooltip', () => {
      expect(component.emailButtonTooltip()).toBe('Email receipts to customer');

      // Simulate no email on file
      mockEmailReceiptService.isValidEmail.and.returnValue(false);
      expect(component.emailButtonTooltip()).toContain('No email address');
    });
  });

  describe('acceptance criteria validation', () => {
    beforeEach(fakeAsync(() => {
      component.customerId = 'customer-1';
      tick();
    }));

    it('AC4: should display complete purchase history for customer', () => {
      const data = component.customerData();

      expect(data).toBeTruthy();
      expect(data!.sales.length).toBe(2);
      expect(data!.sales[0].brandName).toBe('Apple');
      expect(data!.sales[0].productName).toBe('iPhone 15 Pro');
      expect(data!.stats.totalTransactions).toBe(2);
      expect(data!.stats.totalSpent).toBe(2200);
    });

    it('AC5: should display notes field for customer preferences', () => {
      const data = component.customerData();

      expect(data).toBeTruthy();
      expect(data!.customer.notes).toBe('VIP customer - prefers morning delivery');
    });

    it('should display customer stats correctly', () => {
      const data = component.customerData();

      expect(data!.stats.totalTransactions).toBe(2);
      expect(data!.stats.totalSpent).toBe(2200);
      expect(data!.stats.lastPurchaseDate).toBe('2024-01-15');
    });
  });
});
