import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CustomerLookupComponent } from './customer-lookup.component';
import { SaleService } from '../../../../core/services/sale.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ReceiptService } from '../../../../shared/services/receipt.service';
import { WhatsAppService } from '../../../../shared/services/whatsapp.service';
import { Sale, CustomerPurchaseHistory, ReceiptData } from '../../../../models/sale.model';
import { PaymentMethod } from '../../../../enums/payment-method.enum';

describe('CustomerLookupComponent', () => {
  let component: CustomerLookupComponent;
  let fixture: ComponentFixture<CustomerLookupComponent>;
  let mockSaleService: jasmine.SpyObj<SaleService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockReceiptService: jasmine.SpyObj<ReceiptService>;
  let mockWhatsAppService: jasmine.SpyObj<WhatsAppService>;

  const mockSale: Sale = {
    id: 'sale-123abc45',
    phoneId: 'phone-1',
    brandName: 'Apple',
    phoneName: 'iPhone 15 Pro',
    saleDate: '2024-01-15',
    salePrice: 1200,
    costPrice: 900,
    profit: 300,
    buyerName: 'John Doe',
    buyerPhone: '+1234567890',
    buyerEmail: 'john@example.com',
    notes: 'Test sale',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: null,
    taxRate: 0,
    taxAmount: 0,
    basePrice: 1200,
    isTaxExempt: false,
    paymentSummary: [],
    isSplitPayment: false,
    primaryPaymentMethod: PaymentMethod.CASH,
    locationId: null,
    locationName: null
  };

  const mockSales: Sale[] = [
    mockSale,
    {
      ...mockSale,
      id: 'sale-456def78',
      saleDate: '2024-01-10',
      salePrice: 1000,
      brandName: 'Samsung',
      phoneName: 'Galaxy S24'
    },
    {
      ...mockSale,
      id: 'sale-789ghi01',
      saleDate: '2024-01-05',
      salePrice: 800,
      brandName: 'Google',
      phoneName: 'Pixel 8'
    }
  ];

  const mockCustomerHistory: CustomerPurchaseHistory = {
    customerPhone: '+1234567890',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    totalTransactions: 3,
    totalSpent: 3000,
    transactions: mockSales
  };

  const mockReceiptData: ReceiptData = {
    receiptNumber: 'RCP-123ABC45',
    transactionDate: 'Jan 15, 2024',
    transactionTime: '10:00 AM',
    items: [{
      name: 'Apple iPhone 15 Pro',
      quantity: 1,
      unitPrice: 1200,
      total: 1200,
      taxRate: 0,
      taxAmount: 0,
      basePrice: 1200,
      isTaxExempt: false
    }],
    subtotal: 1200,
    taxRate: 0,
    taxAmount: 0,
    grandTotal: 1200,
    customerName: 'John Doe',
    customerPhone: '+1234567890',
    customerEmail: 'john@example.com',
    notes: 'Test sale'
  };

  beforeEach(async () => {
    mockSaleService = jasmine.createSpyObj('SaleService', ['findByBuyerPhone']);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);
    mockReceiptService = jasmine.createSpyObj('ReceiptService', [
      'buildReceiptDataFromSale',
      'generatePdf',
      'printReceipt'
    ]);
    mockWhatsAppService = jasmine.createSpyObj('WhatsAppService', [
      'canSendWhatsApp',
      'sendReceiptViaWhatsApp',
      'formatPhoneDisplay'
    ]);

    mockReceiptService.buildReceiptDataFromSale.and.returnValue(mockReceiptData);
    mockWhatsAppService.canSendWhatsApp.and.returnValue(true);
    mockWhatsAppService.formatPhoneDisplay.and.returnValue('+1 (234) 567-890');

    await TestBed.configureTestingModule({
      imports: [
        CustomerLookupComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideRouter([]),
        { provide: SaleService, useValue: mockSaleService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ReceiptService, useValue: mockReceiptService },
        { provide: WhatsAppService, useValue: mockWhatsAppService },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerLookupComponent);
    component = fixture.componentInstance;
  });

  describe('component initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty phone number', () => {
      expect(component.phoneNumber).toBe('');
    });

    it('should initialize with searching set to false', () => {
      expect(component.searching()).toBe(false);
    });

    it('should initialize with hasSearched set to false', () => {
      expect(component.hasSearched()).toBe(false);
    });

    it('should initialize with null customer history', () => {
      expect(component.customerHistory()).toBeNull();
    });

    it('should have skeleton rows array', () => {
      expect(component.skeletonRows.length).toBe(5);
    });
  });

  describe('ngOnInit with query params', () => {
    it('should auto-search when phone query param is present', fakeAsync(() => {
      mockSaleService.findByBuyerPhone.and.returnValue(Promise.resolve(mockCustomerHistory));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CustomerLookupComponent, NoopAnimationsModule],
        providers: [
          provideRouter([]),
          { provide: SaleService, useValue: mockSaleService },
          { provide: ToastService, useValue: mockToastService },
          { provide: ReceiptService, useValue: mockReceiptService },
          { provide: WhatsAppService, useValue: mockWhatsAppService },
          {
            provide: ActivatedRoute,
            useValue: {
              queryParams: of({ phone: '+1234567890' })
            }
          }
        ]
      }).compileComponents();

      const newFixture = TestBed.createComponent(CustomerLookupComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      tick();

      expect(newComponent.phoneNumber).toBe('+1234567890');
      expect(mockSaleService.findByBuyerPhone).toHaveBeenCalledWith('+1234567890');
    }));
  });

  describe('onSearch', () => {
    it('should not search if phone number is empty', fakeAsync(() => {
      component.phoneNumber = '';
      component.onSearch();
      tick();

      expect(mockSaleService.findByBuyerPhone).not.toHaveBeenCalled();
    }));

    it('should not search if phone number is whitespace only', fakeAsync(() => {
      component.phoneNumber = '   ';
      component.onSearch();
      tick();

      expect(mockSaleService.findByBuyerPhone).not.toHaveBeenCalled();
    }));

    it('should set searching state during search', fakeAsync(() => {
      mockSaleService.findByBuyerPhone.and.returnValue(Promise.resolve(mockCustomerHistory));
      component.phoneNumber = '+1234567890';

      component.onSearch();
      expect(component.searching()).toBe(true);

      tick();
      expect(component.searching()).toBe(false);
    }));

    it('should set hasSearched to true after search', fakeAsync(() => {
      mockSaleService.findByBuyerPhone.and.returnValue(Promise.resolve(mockCustomerHistory));
      component.phoneNumber = '+1234567890';

      component.onSearch();
      tick();

      expect(component.hasSearched()).toBe(true);
    }));

    it('should update customer history with search results', fakeAsync(() => {
      mockSaleService.findByBuyerPhone.and.returnValue(Promise.resolve(mockCustomerHistory));
      component.phoneNumber = '+1234567890';

      component.onSearch();
      tick();

      expect(component.customerHistory()).toEqual(mockCustomerHistory);
    }));

    it('should trim phone number before searching', fakeAsync(() => {
      mockSaleService.findByBuyerPhone.and.returnValue(Promise.resolve(mockCustomerHistory));
      component.phoneNumber = '  +1234567890  ';

      component.onSearch();
      tick();

      expect(mockSaleService.findByBuyerPhone).toHaveBeenCalledWith('+1234567890');
    }));

    it('should show success toast when transactions are found', fakeAsync(() => {
      mockSaleService.findByBuyerPhone.and.returnValue(Promise.resolve(mockCustomerHistory));
      component.phoneNumber = '+1234567890';

      component.onSearch();
      tick();

      expect(mockToastService.success).toHaveBeenCalledWith(
        'Search Complete',
        'Found 3 transaction(s)'
      );
    }));

    it('should show info toast when no transactions are found', fakeAsync(() => {
      const emptyHistory: CustomerPurchaseHistory = {
        ...mockCustomerHistory,
        totalTransactions: 0,
        totalSpent: 0,
        transactions: []
      };
      mockSaleService.findByBuyerPhone.and.returnValue(Promise.resolve(emptyHistory));
      component.phoneNumber = '+1234567890';

      component.onSearch();
      tick();

      expect(mockToastService.info).toHaveBeenCalledWith(
        'No Results',
        'No transactions found for "+1234567890"'
      );
    }));

    it('should show error toast on search failure', fakeAsync(() => {
      mockSaleService.findByBuyerPhone.and.returnValue(Promise.reject(new Error('Search failed')));
      component.phoneNumber = '+1234567890';

      component.onSearch();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to search customer history');
    }));

    it('should set customer history to null on error', fakeAsync(() => {
      mockSaleService.findByBuyerPhone.and.returnValue(Promise.reject(new Error('Search failed')));
      component.phoneNumber = '+1234567890';

      component.onSearch();
      tick();

      expect(component.customerHistory()).toBeNull();
    }));
  });

  describe('onClear', () => {
    it('should clear phone number', () => {
      component.phoneNumber = '+1234567890';
      component.onClear();

      expect(component.phoneNumber).toBe('');
    });

    it('should reset hasSearched to false', () => {
      component.hasSearched.set(true);
      component.onClear();

      expect(component.hasSearched()).toBe(false);
    });

    it('should reset customer history to null', () => {
      component.customerHistory.set(mockCustomerHistory);
      component.onClear();

      expect(component.customerHistory()).toBeNull();
    });
  });

  describe('getReceiptNumber', () => {
    it('should generate receipt number from sale ID', () => {
      const result = component.getReceiptNumber(mockSale);
      expect(result).toBe('RCP-SALE-123');
    });

    it('should uppercase the receipt number', () => {
      const saleWithLowercase: Sale = {
        ...mockSale,
        id: 'abcdefgh-1234-5678-90ab-cdef12345678'
      };
      const result = component.getReceiptNumber(saleWithLowercase);
      expect(result).toBe('RCP-ABCDEFGH');
    });
  });

  describe('getAverageSpend', () => {
    it('should return 0 when no customer history', () => {
      component.customerHistory.set(null);
      expect(component.getAverageSpend()).toBe(0);
    });

    it('should return 0 when no transactions', () => {
      component.customerHistory.set({
        ...mockCustomerHistory,
        totalTransactions: 0,
        totalSpent: 0
      });
      expect(component.getAverageSpend()).toBe(0);
    });

    it('should calculate correct average spend', () => {
      component.customerHistory.set(mockCustomerHistory);
      expect(component.getAverageSpend()).toBe(1000); // 3000 / 3
    });
  });

  describe('getLastPurchaseDate', () => {
    it('should return null when no customer history', () => {
      component.customerHistory.set(null);
      expect(component.getLastPurchaseDate()).toBeNull();
    });

    it('should return null when no transactions', () => {
      component.customerHistory.set({
        ...mockCustomerHistory,
        transactions: []
      });
      expect(component.getLastPurchaseDate()).toBeNull();
    });

    it('should return date of first transaction (most recent)', () => {
      component.customerHistory.set(mockCustomerHistory);
      expect(component.getLastPurchaseDate()).toBe('2024-01-15');
    });
  });

  describe('receipt actions', () => {
    beforeEach(() => {
      component.customerHistory.set(mockCustomerHistory);
    });

    it('should build receipt data and open dialog on print receipt', () => {
      component.onPrintReceipt(mockSale);

      expect(mockReceiptService.buildReceiptDataFromSale).toHaveBeenCalledWith(mockSale);
      expect(component.selectedReceiptData()).toEqual(mockReceiptData);
      expect(component.showReceiptDialog()).toBe(true);
    });

    it('should build receipt data and generate PDF on download', () => {
      component.onDownloadPdf(mockSale);

      expect(mockReceiptService.buildReceiptDataFromSale).toHaveBeenCalledWith(mockSale);
      expect(mockReceiptService.generatePdf).toHaveBeenCalledWith(mockReceiptData);
    });

    it('should build receipt data and open dialog on view receipt', () => {
      component.onViewReceipt(mockSale);

      expect(mockReceiptService.buildReceiptDataFromSale).toHaveBeenCalledWith(mockSale);
      expect(component.selectedReceiptData()).toEqual(mockReceiptData);
      expect(component.showReceiptDialog()).toBe(true);
    });
  });

  describe('WhatsApp functionality', () => {
    it('should check if WhatsApp can be sent', () => {
      const result = component.canSendWhatsApp(mockSale);

      expect(mockWhatsAppService.canSendWhatsApp).toHaveBeenCalledWith('+1234567890');
      expect(result).toBe(true);
    });

    it('should not send WhatsApp if buyer phone is null', () => {
      const saleWithoutPhone: Sale = { ...mockSale, buyerPhone: null };
      component.onSendWhatsApp(saleWithoutPhone);

      expect(mockWhatsAppService.sendReceiptViaWhatsApp).not.toHaveBeenCalled();
    });

    it('should send WhatsApp receipt when phone is available', () => {
      component.onSendWhatsApp(mockSale);

      expect(mockReceiptService.buildReceiptDataFromSale).toHaveBeenCalledWith(mockSale);
      expect(mockWhatsAppService.sendReceiptViaWhatsApp).toHaveBeenCalledWith(
        mockReceiptData,
        '+1234567890'
      );
    });
  });

  describe('onWhatsAppSent', () => {
    it('should show success toast with formatted phone number', () => {
      component.onWhatsAppSent({
        phoneNumber: '+1234567890',
        receiptNumber: 'RCP-123ABC45'
      });

      expect(mockToastService.success).toHaveBeenCalledWith(
        'WhatsApp Receipt',
        'Receipt RCP-123ABC45 sent to +1 (234) 567-890'
      );
    });
  });

  describe('template rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render page title', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h1')?.textContent).toContain('Customer Purchase History');
    });

    it('should render back to sales button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('p-button');
      const backButton = Array.from(buttons).find(b => b.getAttribute('label') === 'Back to Sales');
      expect(backButton).toBeTruthy();
    });

    it('should render phone number input', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('input[type="tel"]')).toBeTruthy();
    });

    it('should render search button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('p-button');
      const searchButton = Array.from(buttons).find(b => b.getAttribute('label') === 'Search');
      expect(searchButton).toBeTruthy();
    });

    it('should show initial state message when not searched', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Search for a customer');
    });

    it('should show no transactions message when search returns empty', fakeAsync(() => {
      const emptyHistory: CustomerPurchaseHistory = {
        customerPhone: '+1234567890',
        customerName: null,
        customerEmail: null,
        totalTransactions: 0,
        totalSpent: 0,
        transactions: []
      };
      mockSaleService.findByBuyerPhone.and.returnValue(Promise.resolve(emptyHistory));

      component.phoneNumber = '+1234567890';
      component.onSearch();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No transactions found');
    }));

    it('should show clear button after search', fakeAsync(() => {
      mockSaleService.findByBuyerPhone.and.returnValue(Promise.resolve(mockCustomerHistory));
      component.phoneNumber = '+1234567890';
      component.onSearch();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('p-button');
      const clearButton = Array.from(buttons).find(b => b.getAttribute('label') === 'Clear');
      expect(clearButton).toBeTruthy();
    }));

    it('should display customer summary when results are found', fakeAsync(() => {
      mockSaleService.findByBuyerPhone.and.returnValue(Promise.resolve(mockCustomerHistory));
      component.phoneNumber = '+1234567890';
      component.onSearch();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('John Doe');
      expect(compiled.textContent).toContain('+1234567890');
      expect(compiled.textContent).toContain('john@example.com');
    }));

    it('should display transaction stats', fakeAsync(() => {
      mockSaleService.findByBuyerPhone.and.returnValue(Promise.resolve(mockCustomerHistory));
      component.phoneNumber = '+1234567890';
      component.onSearch();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Transactions');
      expect(compiled.textContent).toContain('Total Spent');
      expect(compiled.textContent).toContain('Avg. Spend');
      expect(compiled.textContent).toContain('Last Purchase');
    }));

    it('should render data table with transactions', fakeAsync(() => {
      mockSaleService.findByBuyerPhone.and.returnValue(Promise.resolve(mockCustomerHistory));
      component.phoneNumber = '+1234567890';
      component.onSearch();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('p-table')).toBeTruthy();
    }));
  });

  describe('loading state', () => {
    it('should show skeleton loaders while searching', fakeAsync(() => {
      mockSaleService.findByBuyerPhone.and.returnValue(
        new Promise(resolve => setTimeout(() => resolve(mockCustomerHistory), 100))
      );

      component.phoneNumber = '+1234567890';
      component.onSearch();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('p-skeleton').length).toBeGreaterThan(0);

      tick(100);
      fixture.detectChanges();

      expect(component.searching()).toBe(false);
    }));
  });

  describe('acceptance criteria validation', () => {
    it('AC1: should display all transactions for customer when phone is entered and submitted', fakeAsync(() => {
      mockSaleService.findByBuyerPhone.and.returnValue(Promise.resolve(mockCustomerHistory));
      component.phoneNumber = '+1234567890';
      component.onSearch();
      tick();
      fixture.detectChanges();

      expect(component.customerHistory()?.transactions.length).toBe(3);
    }));

    it('AC2: should sort transactions by date with most recent first', fakeAsync(() => {
      mockSaleService.findByBuyerPhone.and.returnValue(Promise.resolve(mockCustomerHistory));
      component.phoneNumber = '+1234567890';
      component.onSearch();
      tick();

      const transactions = component.customerHistory()?.transactions || [];
      expect(transactions[0].saleDate).toBe('2024-01-15'); // Most recent
      expect(transactions[2].saleDate).toBe('2024-01-05'); // Oldest
    }));

    it('AC3: should display date, receipt number, total amount, and item count for each entry', fakeAsync(() => {
      mockSaleService.findByBuyerPhone.and.returnValue(Promise.resolve(mockCustomerHistory));
      component.phoneNumber = '+1234567890';
      component.onSearch();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      // Check table headers exist
      expect(compiled.textContent).toContain('Date');
      expect(compiled.textContent).toContain('Receipt #');
      expect(compiled.textContent).toContain('Amount');
      expect(compiled.textContent).toContain('Items');
    }));

    it('AC4: should open receipt details dialog when clicking view receipt', fakeAsync(() => {
      mockSaleService.findByBuyerPhone.and.returnValue(Promise.resolve(mockCustomerHistory));
      component.phoneNumber = '+1234567890';
      component.onSearch();
      tick();

      component.onViewReceipt(mockSale);

      expect(component.showReceiptDialog()).toBe(true);
      expect(component.selectedReceiptData()).not.toBeNull();
    }));

    it('AC5: should display "No transactions found" when customer has no history', fakeAsync(() => {
      const emptyHistory: CustomerPurchaseHistory = {
        customerPhone: '+1234567890',
        customerName: null,
        customerEmail: null,
        totalTransactions: 0,
        totalSpent: 0,
        transactions: []
      };
      mockSaleService.findByBuyerPhone.and.returnValue(Promise.resolve(emptyHistory));

      component.phoneNumber = '+1234567890';
      component.onSearch();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No transactions found');
    }));
  });
});
