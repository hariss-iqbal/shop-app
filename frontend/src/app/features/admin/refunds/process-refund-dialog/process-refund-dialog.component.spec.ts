import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';

import { ProcessRefundDialogComponent } from './process-refund-dialog.component';
import { RefundService } from '../../../../core/services/refund.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CheckReceiptRefundableResponse, ProcessRefundResponse } from '../../../../models/refund.model';

describe('ProcessRefundDialogComponent', () => {
  let component: ProcessRefundDialogComponent;
  let fixture: ComponentFixture<ProcessRefundDialogComponent>;
  let mockRefundService: jasmine.SpyObj<RefundService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  const mockRefundableResponse: CheckReceiptRefundableResponse = {
    canRefund: true,
    receiptId: 'receipt-1',
    receiptNumber: 'RCP100',
    transactionDate: '2026-01-31',
    transactionTime: '10:30:00',
    subtotal: 100,
    taxRate: 8.5,
    taxAmount: 8.5,
    grandTotal: 108.5,
    customerName: 'John Doe',
    customerPhone: '1234567890',
    customerEmail: 'john@example.com',
    items: [
      {
        id: 'item-1',
        saleId: 'sale-1',
        phoneId: 'phone-1',
        itemName: 'iPhone 15 Pro',
        quantity: 1,
        unitPrice: 100,
        total: 100,
        phoneStatus: 'sold',
        phoneModel: 'iPhone 15 Pro',
        brandName: 'Apple',
        canRestoreInventory: true
      }
    ]
  };

  const mockProcessRefundResponse: ProcessRefundResponse = {
    success: true,
    refundId: 'refund-1',
    refundNumber: 'REF-000001',
    originalReceiptId: 'receipt-1',
    originalReceiptNumber: 'RCP100',
    refundAmount: 108.5,
    itemsRefunded: 1,
    inventoryRestored: 1,
    items: []
  };

  beforeEach(async () => {
    mockRefundService = jasmine.createSpyObj('RefundService', [
      'checkReceiptRefundable',
      'processFullRefund',
      'getRefundById'
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error']);

    mockRefundService.checkReceiptRefundable.and.returnValue(Promise.resolve(mockRefundableResponse));
    mockRefundService.processFullRefund.and.returnValue(Promise.resolve(mockProcessRefundResponse));

    await TestBed.configureTestingModule({
      imports: [ProcessRefundDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: RefundService, useValue: mockRefundService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessRefundDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should check refundable status when visible changes to true', fakeAsync(() => {
    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    expect(mockRefundService.checkReceiptRefundable).toHaveBeenCalledWith('receipt-1');
    expect(component.refundableInfo()).toEqual(mockRefundableResponse);
  }));

  it('should display receipt info when refundable', fakeAsync(() => {
    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('RCP100');
    expect(compiled.textContent).toContain('John Doe');
  }));

  it('should display cannot refund message when already refunded', fakeAsync(() => {
    const alreadyRefundedResponse: CheckReceiptRefundableResponse = {
      canRefund: false,
      receiptId: 'receipt-1',
      reason: 'Receipt has already been refunded (Refund #REF-000001)',
      existingRefundNumber: 'REF-000001'
    };

    mockRefundService.checkReceiptRefundable.and.returnValue(Promise.resolve(alreadyRefundedResponse));

    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Cannot Process Refund');
    expect(compiled.textContent).toContain('REF-000001');
  }));

  it('should process full refund successfully', fakeAsync(() => {
    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    component.refundReason = 'Customer not satisfied';
    component.notes = 'Test notes';

    spyOn(component.refundCompleted, 'emit');

    component.onProcessRefund();
    tick();

    expect(mockRefundService.processFullRefund).toHaveBeenCalledWith({
      receiptId: 'receipt-1',
      refundReason: 'Customer not satisfied',
      notes: 'Test notes'
    });

    expect(component.refundProcessed()).toBe(true);
    expect(component.refundResult()).toEqual(mockProcessRefundResponse);
    expect(component.refundCompleted.emit).toHaveBeenCalledWith(mockProcessRefundResponse);
    expect(mockToastService.success).toHaveBeenCalled();
  }));

  it('should show error when refund processing fails', fakeAsync(() => {
    const failedResponse: ProcessRefundResponse = {
      success: false,
      error: 'Database error'
    };

    mockRefundService.processFullRefund.and.returnValue(Promise.resolve(failedResponse));

    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    component.onProcessRefund();
    tick();

    expect(mockToastService.error).toHaveBeenCalledWith('Refund Failed', 'Database error');
    expect(component.refundProcessed()).toBe(false);
  }));

  it('should count items with inventory restore', fakeAsync(() => {
    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    expect(component.itemsWithInventoryRestore).toBe(1);
  }));

  it('should update dialog header based on state', fakeAsync(() => {
    component.receiptId = 'receipt-1';
    component.visible = true;

    component.checkingRefundable.set(true);
    expect(component.dialogHeader).toBe('Checking Receipt...');

    component.checkingRefundable.set(false);
    component.refundableInfo.set({ canRefund: false, receiptId: 'test' });
    expect(component.dialogHeader).toBe('Refund Not Available');

    component.refundableInfo.set(mockRefundableResponse);
    component.refundProcessed.set(true);
    expect(component.dialogHeader).toBe('Refund Complete');

    component.refundProcessed.set(false);
    expect(component.dialogHeader).toBe('Process Full Refund');
  }));

  it('should emit visibleChange when dialog is closed', () => {
    spyOn(component.visibleChange, 'emit');

    component.onClose();

    expect(component.visible).toBe(false);
    expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
  });

  it('should reset state when dialog is opened', fakeAsync(() => {
    component.refundReason = 'Previous reason';
    component.notes = 'Previous notes';
    component.refundProcessed.set(true);

    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    expect(component.refundReason).toBe('');
    expect(component.notes).toBe('');
    expect(component.refundProcessed()).toBe(false);
  }));
});
