import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BarcodeScannerDialogComponent } from './barcode-scanner-dialog.component';
import { ReceiptBarcodeService } from '../../../../core/services/receipt-barcode.service';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';

describe('BarcodeScannerDialogComponent', () => {
  let component: BarcodeScannerDialogComponent;
  let fixture: ComponentFixture<BarcodeScannerDialogComponent>;
  let mockReceiptBarcodeService: jasmine.SpyObj<ReceiptBarcodeService>;
  let mockFocusService: jasmine.SpyObj<FocusManagementService>;

  beforeEach(async () => {
    mockReceiptBarcodeService = jasmine.createSpyObj('ReceiptBarcodeService', ['adminLookupReceipt']);
    mockFocusService = jasmine.createSpyObj('FocusManagementService', ['saveTriggerElement', 'restoreFocus']);

    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, BarcodeScannerDialogComponent],
      providers: [
        { provide: ReceiptBarcodeService, useValue: mockReceiptBarcodeService },
        { provide: FocusManagementService, useValue: mockFocusService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BarcodeScannerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onLookup', () => {
    it('should not lookup if code is empty', async () => {
      component.scannedCode = '';

      await component.onLookup();

      expect(mockReceiptBarcodeService.adminLookupReceipt).not.toHaveBeenCalled();
    });

    it('should not lookup if code is only whitespace', async () => {
      component.scannedCode = '   ';

      await component.onLookup();

      expect(mockReceiptBarcodeService.adminLookupReceipt).not.toHaveBeenCalled();
    });

    it('should call service with trimmed code', async () => {
      mockReceiptBarcodeService.adminLookupReceipt.and.returnValue(Promise.resolve({
        success: true,
        found: true,
        receipt: {
          id: '123',
          receiptNumber: 'RCP-001',
          transactionDate: '2024-01-15',
          transactionTime: '10:30',
          subtotal: 100,
          taxRate: 0.1,
          taxAmount: 10,
          grandTotal: 110,
          customerName: 'John Doe',
          customerPhone: '1234567890',
          customerEmail: 'john@example.com',
          notes: null,
          itemCount: 2,
          createdAt: '2024-01-15T10:30:00Z'
        }
      }));

      component.scannedCode = '  RCP-001  ';
      await component.onLookup();

      expect(mockReceiptBarcodeService.adminLookupReceipt).toHaveBeenCalledWith('RCP-001');
      expect(component.lookupResult()).not.toBeNull();
      expect(component.lookupResult()!.found).toBe(true);
    });

    it('should set loading state during lookup', fakeAsync(() => {
      mockReceiptBarcodeService.adminLookupReceipt.and.returnValue(
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          found: false
        }), 100))
      );

      component.scannedCode = 'RCP-002';
      const lookupPromise = component.onLookup();

      expect(component.loading()).toBe(true);

      tick(100);

      lookupPromise.then(() => {
        expect(component.loading()).toBe(false);
      });

      tick();
    }));

    it('should handle lookup errors gracefully', async () => {
      mockReceiptBarcodeService.adminLookupReceipt.and.rejectWith(new Error('Network error'));

      component.scannedCode = 'RCP-003';
      await component.onLookup();

      expect(component.lookupResult()!.success).toBe(false);
      expect(component.lookupResult()!.error).toBe('Failed to lookup receipt');
    });

    it('should track searched state', async () => {
      mockReceiptBarcodeService.adminLookupReceipt.and.returnValue(Promise.resolve({
        success: true,
        found: false
      }));

      expect(component.searched()).toBe(false);

      component.scannedCode = 'RCP-004';
      await component.onLookup();

      expect(component.searched()).toBe(true);
    });

    it('should store last searched code', async () => {
      mockReceiptBarcodeService.adminLookupReceipt.and.returnValue(Promise.resolve({
        success: true,
        found: false
      }));

      component.scannedCode = 'RCP-005';
      await component.onLookup();

      expect(component.lastSearchedCode()).toBe('RCP-005');
    });
  });

  describe('onClear', () => {
    it('should reset all state', async () => {
      mockReceiptBarcodeService.adminLookupReceipt.and.returnValue(Promise.resolve({
        success: true,
        found: true,
        receipt: {
          id: '123',
          receiptNumber: 'RCP-001',
          transactionDate: '2024-01-15',
          transactionTime: '10:30',
          subtotal: 100,
          taxRate: 0.1,
          taxAmount: 10,
          grandTotal: 110,
          customerName: null,
          customerPhone: null,
          customerEmail: null,
          notes: null,
          itemCount: 1,
          createdAt: '2024-01-15T10:30:00Z'
        }
      }));

      component.scannedCode = 'RCP-001';
      await component.onLookup();

      expect(component.searched()).toBe(true);
      expect(component.lookupResult()).not.toBeNull();

      component.onClear();

      expect(component.scannedCode).toBe('');
      expect(component.searched()).toBe(false);
      expect(component.lookupResult()).toBeNull();
      expect(component.lastSearchedCode()).toBe('');
    });
  });

  describe('onViewReceipt', () => {
    it('should emit receiptSelected and close dialog when receipt found', async () => {
      const receiptSelectedSpy = spyOn(component.receiptSelected, 'emit');

      mockReceiptBarcodeService.adminLookupReceipt.and.returnValue(Promise.resolve({
        success: true,
        found: true,
        receipt: {
          id: 'receipt-123',
          receiptNumber: 'RCP-001',
          transactionDate: '2024-01-15',
          transactionTime: '10:30',
          subtotal: 100,
          taxRate: 0.1,
          taxAmount: 10,
          grandTotal: 110,
          customerName: null,
          customerPhone: null,
          customerEmail: null,
          notes: null,
          itemCount: 1,
          createdAt: '2024-01-15T10:30:00Z'
        }
      }));

      component.scannedCode = 'RCP-001';
      await component.onLookup();

      component.onViewReceipt();

      expect(receiptSelectedSpy).toHaveBeenCalledWith('receipt-123');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const result = component.formatDate('2024-01-15');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should return dash for empty date', () => {
      expect(component.formatDate('')).toBe('-');
    });
  });

  describe('formatTime', () => {
    it('should format morning time correctly', () => {
      const result = component.formatTime('09:30');
      expect(result).toBe('9:30 AM');
    });

    it('should format afternoon time correctly', () => {
      const result = component.formatTime('14:45');
      expect(result).toBe('2:45 PM');
    });

    it('should format noon correctly', () => {
      const result = component.formatTime('12:00');
      expect(result).toBe('12:00 PM');
    });

    it('should format midnight correctly', () => {
      const result = component.formatTime('00:00');
      expect(result).toBe('12:00 AM');
    });

    it('should return dash for empty time', () => {
      expect(component.formatTime('')).toBe('-');
    });
  });

  describe('dialog lifecycle', () => {
    it('should save focus on dialog show', () => {
      component.onDialogShow();
      expect(mockFocusService.saveTriggerElement).toHaveBeenCalled();
    });

    it('should restore focus on dialog hide', () => {
      component.onDialogHide();
      expect(mockFocusService.restoreFocus).toHaveBeenCalled();
    });

    it('should clear state when dialog becomes visible', () => {
      mockReceiptBarcodeService.adminLookupReceipt.and.returnValue(Promise.resolve({
        success: true,
        found: true,
        receipt: {
          id: '123',
          receiptNumber: 'RCP-001',
          transactionDate: '2024-01-15',
          transactionTime: '10:30',
          subtotal: 100,
          taxRate: 0.1,
          taxAmount: 10,
          grandTotal: 110,
          customerName: null,
          customerPhone: null,
          customerEmail: null,
          notes: null,
          itemCount: 1,
          createdAt: '2024-01-15T10:30:00Z'
        }
      }));

      // Simulate some state
      component.scannedCode = 'OLD-CODE';
      component.searched.set(true);

      // Simulate visible becoming true
      component.ngOnChanges({
        visible: {
          currentValue: true,
          previousValue: false,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.scannedCode).toBe('');
      expect(component.searched()).toBe(false);
    });
  });
});
