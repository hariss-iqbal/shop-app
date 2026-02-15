import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';

import { ProcessPartialRefundDialogComponent } from './process-partial-refund-dialog.component';
import { RefundService } from '../../../../core/services/refund.service';
import { ToastService } from '../../../../shared/services/toast.service';
import {
  CheckPartialRefundableResponse,
  ProcessPartialRefundResponse
} from '../../../../models/refund.model';

describe('ProcessPartialRefundDialogComponent', () => {
  let component: ProcessPartialRefundDialogComponent;
  let fixture: ComponentFixture<ProcessPartialRefundDialogComponent>;
  let mockRefundService: jasmine.SpyObj<RefundService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  const mockPartialRefundableResponse: CheckPartialRefundableResponse = {
    canPartialRefund: true,
    receiptId: 'receipt-1',
    receiptNumber: 'RCP100',
    transactionDate: '2026-01-31',
    transactionTime: '10:30:00',
    originalSubtotal: 200,
    taxRate: 8.5,
    originalTaxAmount: 17,
    originalGrandTotal: 217,
    customerName: 'John Doe',
    customerPhone: '1234567890',
    customerEmail: 'john@example.com',
    items: [
      {
        id: 'item-1',
        saleId: 'sale-1',
        productId: 'phone-1',
        itemName: 'iPhone 15 Pro',
        quantity: 1,
        unitPrice: 100,
        total: 100,
        productStatus: 'sold',
        productModel: 'iPhone 15 Pro',
        brandName: 'Apple',
        canRestoreInventory: true,
        alreadyRefunded: false,
        canRefund: true
      },
      {
        id: 'item-2',
        saleId: 'sale-2',
        productId: 'phone-2',
        itemName: 'Samsung Galaxy S24',
        quantity: 1,
        unitPrice: 100,
        total: 100,
        productStatus: 'sold',
        productModel: 'Galaxy S24',
        brandName: 'Samsung',
        canRestoreInventory: true,
        alreadyRefunded: false,
        canRefund: true
      }
    ]
  };

  const mockProcessPartialRefundResponse: ProcessPartialRefundResponse = {
    success: true,
    refundId: 'refund-1',
    refundNumber: 'REF-000001',
    originalReceiptId: 'receipt-1',
    originalReceiptNumber: 'RCP100',
    isPartialRefund: true,
    subtotal: 100,
    taxRate: 8.5,
    taxAmount: 8.5,
    refundAmount: 108.5,
    itemsRefunded: 1,
    inventoryRestored: 1,
    hasCustomPrices: false,
    managerApproved: false,
    items: []
  };

  beforeEach(async () => {
    mockRefundService = jasmine.createSpyObj('RefundService', [
      'checkReceiptPartialRefundable',
      'processPartialRefund',
      'getRefundById'
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error']);

    mockRefundService.checkReceiptPartialRefundable.and.returnValue(
      Promise.resolve(mockPartialRefundableResponse)
    );
    mockRefundService.processPartialRefund.and.returnValue(
      Promise.resolve(mockProcessPartialRefundResponse)
    );

    await TestBed.configureTestingModule({
      imports: [ProcessPartialRefundDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: RefundService, useValue: mockRefundService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessPartialRefundDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should check partial refundable status when visible changes to true', fakeAsync(() => {
    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    expect(mockRefundService.checkReceiptPartialRefundable).toHaveBeenCalledWith('receipt-1');
    expect(component.refundableInfo()).toEqual(mockPartialRefundableResponse);
    expect(component.selectableItems().length).toBe(2);
  }));

  it('should calculate subtotal correctly when items are selected', fakeAsync(() => {
    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    const items = component.selectableItems();
    items[0].selected = true;
    items[0].returnPrice = 100;
    component.selectableItems.set([...items]);

    expect(component.calculatedSubtotal()).toBe(100);
    expect(component.selectedCount()).toBe(1);
  }));

  it('should calculate tax correctly', fakeAsync(() => {
    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    const items = component.selectableItems();
    items[0].selected = true;
    items[0].returnPrice = 100;
    component.selectableItems.set([...items]);

    expect(component.calculatedTax()).toBe(8.5);
    expect(component.calculatedTotal()).toBe(108.5);
  }));

  it('should require manager approval for higher return prices', fakeAsync(() => {
    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    const items = component.selectableItems();
    items[0].selected = true;
    items[0].returnPrice = 150;
    items[0].requiresApproval = true;
    component.selectableItems.set([...items]);

    expect(component.requiresManagerApproval()).toBe(true);
    expect(component.canProcessRefund()).toBe(false);

    component.managerApproved = true;
    expect(component.canProcessRefund()).toBe(true);
  }));

  it('should toggle select all items', fakeAsync(() => {
    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    component.toggleSelectAll({ checked: true });
    expect(component.allSelected()).toBe(true);
    expect(component.selectedCount()).toBe(2);

    component.toggleSelectAll({ checked: false });
    expect(component.allSelected()).toBe(false);
    expect(component.selectedCount()).toBe(0);
  }));

  it('should update custom price flag when return price changes', fakeAsync(() => {
    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    const items = component.selectableItems();
    items[0].selected = true;
    items[0].returnPrice = 80;

    component.onReturnPriceChange(items[0]);

    expect(items[0].hasCustomPrice).toBe(true);
    expect(items[0].requiresApproval).toBe(false);
  }));

  it('should process partial refund successfully', fakeAsync(() => {
    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    const items = component.selectableItems();
    items[0].selected = true;
    items[0].returnPrice = 100;
    component.selectableItems.set([...items]);

    component.refundReason = 'Customer request';

    spyOn(component.refundCompleted, 'emit');

    component.onProcessRefund();
    tick();

    expect(mockRefundService.processPartialRefund).toHaveBeenCalledWith({
      receiptId: 'receipt-1',
      items: [{ receiptItemId: 'item-1', returnPrice: 100 }],
      refundReason: 'Customer request',
      notes: null,
      managerApproved: false,
      managerApprovalReason: null
    });

    expect(component.refundProcessed()).toBe(true);
    expect(component.refundCompleted.emit).toHaveBeenCalledWith(mockProcessPartialRefundResponse);
    expect(mockToastService.success).toHaveBeenCalled();
  }));

  it('should show existing partial refunds warning', fakeAsync(() => {
    const responseWithExisting: CheckPartialRefundableResponse = {
      ...mockPartialRefundableResponse,
      existingPartialRefunds: [
        {
          refundNumber: 'REF-000001',
          refundDate: '2026-01-30',
          refundAmount: 50,
          itemCount: 1
        }
      ],
      alreadyRefundedItemCount: 1
    };

    mockRefundService.checkReceiptPartialRefundable.and.returnValue(
      Promise.resolve(responseWithExisting)
    );

    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('previous partial refund');
  }));

  it('should not allow processing when no items selected', fakeAsync(() => {
    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    expect(component.canProcessRefund()).toBe(false);
  }));

  it('should count items with inventory restore', fakeAsync(() => {
    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    const items = component.selectableItems();
    items[0].selected = true;
    items[1].selected = true;
    component.selectableItems.set([...items]);

    expect(component.itemsWithInventoryRestore()).toBe(2);
  }));

  it('should handle already refunded items', fakeAsync(() => {
    const responseWithRefundedItem: CheckPartialRefundableResponse = {
      ...mockPartialRefundableResponse,
      items: [
        {
          ...mockPartialRefundableResponse.items![0],
          alreadyRefunded: true,
          canRefund: false
        },
        mockPartialRefundableResponse.items![1]
      ]
    };

    mockRefundService.checkReceiptPartialRefundable.and.returnValue(
      Promise.resolve(responseWithRefundedItem)
    );

    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    expect(component.hasSelectableItems()).toBe(true);

    component.toggleSelectAll({ checked: true });
    expect(component.selectedCount()).toBe(1);
  }));

  it('should display price difference for custom prices', fakeAsync(() => {
    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    const items = component.selectableItems();
    items[0].selected = true;
    items[0].returnPrice = 120;
    items[0].unitPrice = 100;

    expect(component.getPriceDifference(items[0])).toBe('+$20.00');

    items[0].returnPrice = 80;
    expect(component.getPriceDifference(items[0])).toBe('-$20.00');

    items[0].returnPrice = 100;
    expect(component.getPriceDifference(items[0])).toBe('');
  }));

  it('should handle receipt that cannot be partially refunded', fakeAsync(() => {
    const cannotRefundResponse: CheckPartialRefundableResponse = {
      canPartialRefund: false,
      reason: 'Receipt has already been fully refunded',
      receiptId: 'receipt-1',
      receiptNumber: 'RCP100',
      existingRefundNumber: 'REF-000001'
    };

    mockRefundService.checkReceiptPartialRefundable.and.returnValue(
      Promise.resolve(cannotRefundResponse)
    );

    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();
    fixture.detectChanges();

    expect(component.refundableInfo()?.canPartialRefund).toBe(false);
    expect(component.dialogHeader).toBe('Partial Refund Not Available');
  }));

  it('should handle processing error gracefully', fakeAsync(() => {
    const errorResponse: ProcessPartialRefundResponse = {
      success: false,
      error: 'Failed to process refund'
    };

    mockRefundService.processPartialRefund.and.returnValue(
      Promise.resolve(errorResponse)
    );

    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    const items = component.selectableItems();
    items[0].selected = true;
    items[0].returnPrice = 100;
    component.selectableItems.set([...items]);

    component.onProcessRefund();
    tick();

    expect(component.refundProcessed()).toBe(false);
    expect(mockToastService.error).toHaveBeenCalledWith('Refund Failed', 'Failed to process refund');
  }));

  it('should process refund with custom price and manager approval', fakeAsync(() => {
    const customPriceResponse: ProcessPartialRefundResponse = {
      success: true,
      refundId: 'refund-2',
      refundNumber: 'REF-000002',
      originalReceiptId: 'receipt-1',
      originalReceiptNumber: 'RCP100',
      isPartialRefund: true,
      subtotal: 150,
      taxRate: 8.5,
      taxAmount: 12.75,
      refundAmount: 162.75,
      itemsRefunded: 1,
      inventoryRestored: 1,
      hasCustomPrices: true,
      managerApproved: true,
      items: [{
        itemName: 'iPhone 15 Pro',
        quantity: 1,
        originalUnitPrice: 100,
        returnPrice: 150,
        total: 150,
        productId: 'phone-1',
        inventoryRestored: true,
        isCustomPrice: true,
        priceDifference: 50
      }]
    };

    mockRefundService.processPartialRefund.and.returnValue(
      Promise.resolve(customPriceResponse)
    );

    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    const items = component.selectableItems();
    items[0].selected = true;
    items[0].returnPrice = 150;
    items[0].requiresApproval = true;
    component.selectableItems.set([...items]);

    component.managerApproved = true;
    component.managerApprovalReason = 'Customer loyalty adjustment';
    component.refundReason = 'Price adjustment';

    spyOn(component.refundCompleted, 'emit');

    component.onProcessRefund();
    tick();

    expect(mockRefundService.processPartialRefund).toHaveBeenCalledWith({
      receiptId: 'receipt-1',
      items: [{ receiptItemId: 'item-1', returnPrice: 150 }],
      refundReason: 'Price adjustment',
      notes: null,
      managerApproved: true,
      managerApprovalReason: 'Customer loyalty adjustment'
    });

    expect(component.refundProcessed()).toBe(true);
    expect(component.refundResult()?.hasCustomPrices).toBe(true);
    expect(component.refundResult()?.managerApproved).toBe(true);
  }));

  it('should calculate correctly with multiple selected items', fakeAsync(() => {
    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    const items = component.selectableItems();
    items[0].selected = true;
    items[0].returnPrice = 100;
    items[1].selected = true;
    items[1].returnPrice = 80;
    component.selectableItems.set([...items]);

    expect(component.selectedCount()).toBe(2);
    expect(component.calculatedSubtotal()).toBe(180);
    expect(component.calculatedTax()).toBe(15.3);
    expect(component.calculatedTotal()).toBe(195.3);
  }));

  it('should reset state when dialog closes and reopens', fakeAsync(() => {
    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    const items = component.selectableItems();
    items[0].selected = true;
    items[0].returnPrice = 150;
    component.selectableItems.set([...items]);
    component.refundReason = 'Test reason';
    component.managerApproved = true;

    component.onClose();

    component.visible = true;
    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    expect(component.refundReason).toBe('');
    expect(component.managerApproved).toBe(false);
    expect(component.selectableItems().every(i => !i.selected)).toBe(true);
  }));

  it('should handle items without inventory restore capability', fakeAsync(() => {
    const responseWithNoInventoryRestore: CheckPartialRefundableResponse = {
      ...mockPartialRefundableResponse,
      items: [
        {
          ...mockPartialRefundableResponse.items![0],
          canRestoreInventory: false,
          productId: null
        }
      ]
    };

    mockRefundService.checkReceiptPartialRefundable.and.returnValue(
      Promise.resolve(responseWithNoInventoryRestore)
    );

    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    const items = component.selectableItems();
    items[0].selected = true;
    component.selectableItems.set([...items]);

    expect(component.itemsWithInventoryRestore()).toBe(0);
  }));

  it('should handle check receipt error', fakeAsync(() => {
    mockRefundService.checkReceiptPartialRefundable.and.returnValue(
      Promise.reject(new Error('Network error'))
    );

    spyOn(component.visibleChange, 'emit');

    component.receiptId = 'receipt-1';
    component.visible = true;

    component.ngOnChanges({
      visible: new SimpleChange(false, true, false)
    });

    tick();

    expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to check receipt status');
    expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
  }));
});
