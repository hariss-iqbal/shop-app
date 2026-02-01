import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ReceiptLookupComponent } from './receipt-lookup.component';
import { ReceiptBarcodeService } from '../../../core/services/receipt-barcode.service';

describe('ReceiptLookupComponent', () => {
  let component: ReceiptLookupComponent;
  let fixture: ComponentFixture<ReceiptLookupComponent>;
  let mockReceiptBarcodeService: jasmine.SpyObj<ReceiptBarcodeService>;

  const createComponent = (receiptNumber: string | null = 'RCP-001') => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, ReceiptLookupComponent],
      providers: [
        { provide: ReceiptBarcodeService, useValue: mockReceiptBarcodeService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({
                receiptNumber: receiptNumber
              })
            }
          }
        }
      ]
    });

    fixture = TestBed.createComponent(ReceiptLookupComponent);
    component = fixture.componentInstance;
  };

  beforeEach(() => {
    mockReceiptBarcodeService = jasmine.createSpyObj('ReceiptBarcodeService', ['lookupReceipt']);
  });

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should lookup receipt on init with valid receipt number', fakeAsync(() => {
      mockReceiptBarcodeService.lookupReceipt.and.returnValue(Promise.resolve({
        success: true,
        found: true,
        receipt: {
          id: '123',
          receiptNumber: 'RCP-001',
          transactionDate: '2024-01-15',
          transactionTime: '10:30',
          grandTotal: 110,
          customerName: 'John Doe',
          storeId: 'DEFAULT',
          itemCount: 2
        }
      }));

      createComponent('RCP-001');
      fixture.detectChanges();
      tick();

      expect(mockReceiptBarcodeService.lookupReceipt).toHaveBeenCalledWith('RCP-001');
      expect(component.lookupResult()).not.toBeNull();
      expect(component.lookupResult()!.found).toBe(true);
      expect(component.loading()).toBe(false);
    }));

    it('should set error when no receipt number provided', fakeAsync(() => {
      createComponent(null);
      fixture.detectChanges();
      tick();

      expect(component.error()).toBe('No receipt number provided');
      expect(component.loading()).toBe(false);
      expect(mockReceiptBarcodeService.lookupReceipt).not.toHaveBeenCalled();
    }));

    it('should store receipt number from route', () => {
      mockReceiptBarcodeService.lookupReceipt.and.returnValue(Promise.resolve({
        success: true,
        found: false,
        notFoundReason: 'receipt_not_found'
      }));

      createComponent('TEST-RECEIPT');
      fixture.detectChanges();

      expect(component.receiptNumber()).toBe('TEST-RECEIPT');
    });
  });

  describe('lookup results', () => {
    it('should display receipt found state', fakeAsync(() => {
      mockReceiptBarcodeService.lookupReceipt.and.returnValue(Promise.resolve({
        success: true,
        found: true,
        receipt: {
          id: '123',
          receiptNumber: 'RCP-001',
          transactionDate: '2024-01-15',
          transactionTime: '14:30',
          grandTotal: 250.50,
          customerName: 'Jane Smith',
          storeId: 'STORE-A',
          itemCount: 3
        }
      }));

      createComponent('RCP-001');
      fixture.detectChanges();
      tick();

      expect(component.lookupResult()!.found).toBe(true);
      expect(component.lookupResult()!.receipt!.grandTotal).toBe(250.50);
      expect(component.lookupResult()!.receipt!.customerName).toBe('Jane Smith');
    }));

    it('should display not found state', fakeAsync(() => {
      mockReceiptBarcodeService.lookupReceipt.and.returnValue(Promise.resolve({
        success: true,
        found: false,
        notFoundReason: 'receipt_not_found'
      }));

      createComponent('INVALID-RECEIPT');
      fixture.detectChanges();
      tick();

      expect(component.lookupResult()!.found).toBe(false);
      expect(component.lookupResult()!.notFoundReason).toBe('receipt_not_found');
    }));

    it('should handle invalid code reason', fakeAsync(() => {
      mockReceiptBarcodeService.lookupReceipt.and.returnValue(Promise.resolve({
        success: true,
        found: false,
        notFoundReason: 'invalid_code'
      }));

      createComponent('CORRUPTED');
      fixture.detectChanges();
      tick();

      expect(component.lookupResult()!.notFoundReason).toBe('invalid_code');
    }));

    it('should handle store mismatch reason', fakeAsync(() => {
      mockReceiptBarcodeService.lookupReceipt.and.returnValue(Promise.resolve({
        success: true,
        found: false,
        notFoundReason: 'store_mismatch'
      }));

      createComponent('OTHER-STORE-001');
      fixture.detectChanges();
      tick();

      expect(component.lookupResult()!.notFoundReason).toBe('store_mismatch');
    }));

    it('should set error on lookup failure', fakeAsync(() => {
      mockReceiptBarcodeService.lookupReceipt.and.returnValue(Promise.resolve({
        success: false,
        found: false,
        error: 'Database connection failed'
      }));

      createComponent('RCP-002');
      fixture.detectChanges();
      tick();

      expect(component.error()).toBe('Database connection failed');
    }));

    it('should handle exception during lookup', fakeAsync(() => {
      mockReceiptBarcodeService.lookupReceipt.and.rejectWith(new Error('Network error'));

      createComponent('RCP-003');
      fixture.detectChanges();
      tick();

      expect(component.error()).toBe('An error occurred while looking up the receipt');
    }));
  });

  describe('formatDate', () => {
    beforeEach(() => {
      mockReceiptBarcodeService.lookupReceipt.and.returnValue(Promise.resolve({
        success: true,
        found: false
      }));
      createComponent();
    });

    it('should format date correctly', () => {
      const result = component.formatDate('2024-01-15');
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should return dash for empty date', () => {
      expect(component.formatDate('')).toBe('-');
    });

    it('should handle various date formats', () => {
      const result = component.formatDate('2024-12-25');
      expect(result).toContain('December');
      expect(result).toContain('25');
    });
  });

  describe('formatTime', () => {
    beforeEach(() => {
      mockReceiptBarcodeService.lookupReceipt.and.returnValue(Promise.resolve({
        success: true,
        found: false
      }));
      createComponent();
    });

    it('should format AM time correctly', () => {
      expect(component.formatTime('09:30')).toBe('9:30 AM');
    });

    it('should format PM time correctly', () => {
      expect(component.formatTime('15:45')).toBe('3:45 PM');
    });

    it('should format noon correctly', () => {
      expect(component.formatTime('12:00')).toBe('12:00 PM');
    });

    it('should format midnight correctly', () => {
      expect(component.formatTime('00:00')).toBe('12:00 AM');
    });

    it('should return dash for empty time', () => {
      expect(component.formatTime('')).toBe('-');
    });

    it('should handle single-digit minutes', () => {
      expect(component.formatTime('10:05')).toBe('10:05 AM');
    });
  });

  describe('store information', () => {
    beforeEach(() => {
      mockReceiptBarcodeService.lookupReceipt.and.returnValue(Promise.resolve({
        success: true,
        found: false
      }));
      createComponent();
    });

    it('should have store name from environment', () => {
      expect(component.storeName).toBeDefined();
      expect(component.storeName.length).toBeGreaterThan(0);
    });

    it('should have store address from environment', () => {
      expect(component.storeAddress).toBeDefined();
    });

    it('should have store phone from environment', () => {
      expect(component.storePhone).toBeDefined();
      expect(component.storePhoneLink).toBeDefined();
    });
  });
});
