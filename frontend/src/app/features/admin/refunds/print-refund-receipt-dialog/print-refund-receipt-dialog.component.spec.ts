import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';

import { PrintRefundReceiptDialogComponent } from './print-refund-receipt-dialog.component';
import { Refund } from '../../../../models/refund.model';

describe('PrintRefundReceiptDialogComponent', () => {
  let component: PrintRefundReceiptDialogComponent;
  let fixture: ComponentFixture<PrintRefundReceiptDialogComponent>;

  const mockRefund: Refund = {
    id: 'refund-1',
    refundNumber: 'REF-000001',
    originalReceiptId: 'receipt-1',
    originalReceiptNumber: 'RCP100',
    refundDate: '2026-01-31',
    refundTime: '10:30:00',
    subtotal: 100,
    taxRate: 8.5,
    taxAmount: 8.5,
    refundAmount: 108.5,
    refundReason: 'Customer request',
    customerName: 'John Doe',
    customerPhone: '1234567890',
    customerEmail: 'john@example.com',
    status: 'completed',
    notes: null,
    isPartialRefund: false,
    managerApproved: false,
    managerApprovedAt: null,
    managerApprovalReason: null,
    items: [
      {
        id: 'item-1',
        originalSaleId: 'sale-1',
        productId: 'phone-1',
        itemName: 'iPhone 15 Pro',
        quantity: 1,
        unitPrice: 100,
        total: 100,
        inventoryRestored: true,
        originalUnitPrice: 100,
        isCustomPrice: false,
        priceDifference: 0
      }
    ],
    itemCount: 1,
    inventoryRestoredCount: 1,
    hasCustomPrices: false,
    createdAt: '2026-01-31T10:30:00Z',
    updatedAt: null
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintRefundReceiptDialogComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(PrintRefundReceiptDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build receipt data when refund changes', () => {
    component.refund = mockRefund;

    component.ngOnChanges({
      refund: new SimpleChange(null, mockRefund, true)
    });

    expect(component.receiptData).toBeTruthy();
    expect(component.receiptData?.refundNumber).toBe('REF-000001');
    expect(component.receiptData?.refundAmount).toBe(108.5);
  });

  it('should display refund banner', fakeAsync(() => {
    component.refund = mockRefund;
    component.visible = true;

    component.ngOnChanges({
      refund: new SimpleChange(null, mockRefund, true)
    });

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('REFUND');
  }));

  it('should display partial refund indicator', fakeAsync(() => {
    const partialRefund = { ...mockRefund, isPartialRefund: true };
    component.refund = partialRefund;
    component.visible = true;

    component.ngOnChanges({
      refund: new SimpleChange(null, partialRefund, true)
    });

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('PARTIAL REFUND');
  }));

  it('should display custom price indicator', fakeAsync(() => {
    const refundWithCustomPrice = {
      ...mockRefund,
      hasCustomPrices: true,
      items: [
        {
          ...mockRefund.items[0],
          isCustomPrice: true,
          originalUnitPrice: 120,
          priceDifference: -20
        }
      ]
    };

    component.refund = refundWithCustomPrice;
    component.visible = true;

    component.ngOnChanges({
      refund: new SimpleChange(null, refundWithCustomPrice, true)
    });

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Custom return price applied');
  }));

  it('should display manager approved indicator', fakeAsync(() => {
    const approvedRefund = { ...mockRefund, managerApproved: true };
    component.refund = approvedRefund;
    component.visible = true;

    component.ngOnChanges({
      refund: new SimpleChange(null, approvedRefund, true)
    });

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Manager Approved');
  }));

  it('should display refund reason if provided', fakeAsync(() => {
    component.refund = mockRefund;
    component.visible = true;

    component.ngOnChanges({
      refund: new SimpleChange(null, mockRefund, true)
    });

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Customer request');
  }));

  it('should display customer information', fakeAsync(() => {
    component.refund = mockRefund;
    component.visible = true;

    component.ngOnChanges({
      refund: new SimpleChange(null, mockRefund, true)
    });

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('John Doe');
    expect(compiled.textContent).toContain('1234567890');
  }));

  it('should generate print HTML correctly', () => {
    component.refund = mockRefund;

    component.ngOnChanges({
      refund: new SimpleChange(null, mockRefund, true)
    });

    const html = (component as any).generatePrintHtml();

    expect(html).toContain('REF-000001');
    expect(html).toContain('iPhone 15 Pro');
    expect(html).toContain('REFUND TOTAL');
    expect(html).toContain('$108.50');
  });

  it('should call window.open for print', () => {
    component.refund = mockRefund;

    component.ngOnChanges({
      refund: new SimpleChange(null, mockRefund, true)
    });

    const mockWindow = {
      document: {
        write: jasmine.createSpy('write'),
        close: jasmine.createSpy('close')
      },
      focus: jasmine.createSpy('focus'),
      print: jasmine.createSpy('print'),
      close: jasmine.createSpy('close')
    };

    spyOn(window, 'open').and.returnValue(mockWindow as any);
    spyOn(document, 'getElementById').and.returnValue(document.createElement('div'));

    component.onPrint();

    expect(window.open).toHaveBeenCalledWith('', '_blank');
    expect(mockWindow.document.write).toHaveBeenCalled();
    expect(mockWindow.print).toHaveBeenCalled();
  });

  it('should emit visibleChange when dialog is closed', () => {
    spyOn(component.visibleChange, 'emit');

    component.onVisibleChange(false);

    expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
  });

  it('should show original receipt number link', fakeAsync(() => {
    component.refund = mockRefund;
    component.visible = true;

    component.ngOnChanges({
      refund: new SimpleChange(null, mockRefund, true)
    });

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('RCP100');
  }));

  it('should display tax breakdown when tax exists', fakeAsync(() => {
    component.refund = mockRefund;
    component.visible = true;

    component.ngOnChanges({
      refund: new SimpleChange(null, mockRefund, true)
    });

    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('8.5%');
    expect(compiled.textContent).toContain('$8.50');
  }));
});
