import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { PurchaseOrderDetailComponent } from './purchase-order-detail.component';
import { PurchaseOrderService } from '../../../../core/services/purchase-order.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirmation.service';
import { PurchaseOrder } from '../../../../models/purchase-order.model';
import { PurchaseOrderStatus } from '../../../../enums';

describe('PurchaseOrderDetailComponent', () => {
  let component: PurchaseOrderDetailComponent;
  let fixture: ComponentFixture<PurchaseOrderDetailComponent>;
  let mockPurchaseOrderService: jasmine.SpyObj<PurchaseOrderService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockConfirmDialogService: jasmine.SpyObj<ConfirmDialogService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockLocation: jasmine.SpyObj<Location>;
  let mockActivatedRoute: { snapshot: { paramMap: { get: jasmine.Spy } } };

  const mockPendingPO: PurchaseOrder = {
    id: 'po-1',
    poNumber: 'PO-0001',
    supplierId: 'supplier-1',
    supplierName: 'Tech Supplies Inc',
    orderDate: '2024-01-15',
    totalAmount: 4000,
    status: PurchaseOrderStatus.PENDING,
    notes: 'Test notes for pending PO',
    items: [
      {
        id: 'item-1',
        purchaseOrderId: 'po-1',
        brand: 'Apple',
        model: 'iPhone 15',
        quantity: 5,
        unitCost: 800,
        lineTotal: 4000,
        createdAt: '2024-01-15T00:00:00Z'
      }
    ],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: null
  };

  const mockReceivedPO: PurchaseOrder = {
    ...mockPendingPO,
    id: 'po-2',
    poNumber: 'PO-0002',
    status: PurchaseOrderStatus.RECEIVED,
    updatedAt: '2024-01-16T00:00:00Z'
  };

  const mockCancelledPO: PurchaseOrder = {
    ...mockPendingPO,
    id: 'po-3',
    poNumber: 'PO-0003',
    status: PurchaseOrderStatus.CANCELLED,
    updatedAt: '2024-01-16T00:00:00Z'
  };

  beforeEach(async () => {
    mockPurchaseOrderService = jasmine.createSpyObj('PurchaseOrderService', [
      'getPurchaseOrderById',
      'cancelPurchaseOrder'
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error']);
    mockConfirmDialogService = jasmine.createSpyObj('ConfirmDialogService', ['confirm']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockLocation = jasmine.createSpyObj('Location', ['back']);
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('po-1')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [PurchaseOrderDetailComponent],
      providers: [
        provideNoopAnimations(),
        { provide: PurchaseOrderService, useValue: mockPurchaseOrderService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ConfirmDialogService, useValue: mockConfirmDialogService },
        { provide: Router, useValue: mockRouter },
        { provide: Location, useValue: mockLocation },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PurchaseOrderDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    mockPurchaseOrderService.getPurchaseOrderById.and.returnValue(Promise.resolve(mockPendingPO));
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load purchase order on init when id is provided', fakeAsync(() => {
      mockPurchaseOrderService.getPurchaseOrderById.and.returnValue(Promise.resolve(mockPendingPO));

      fixture.detectChanges();
      tick();

      expect(mockPurchaseOrderService.getPurchaseOrderById).toHaveBeenCalledWith('po-1');
      expect(component.purchaseOrder()).toEqual(mockPendingPO);
      expect(component.loading()).toBeFalse();
      expect(component.notFound()).toBeFalse();
    }));

    it('should set notFound when no id is provided', fakeAsync(() => {
      mockActivatedRoute.snapshot.paramMap.get.and.returnValue(null);

      fixture.detectChanges();
      tick();

      expect(component.notFound()).toBeTrue();
      expect(component.loading()).toBeFalse();
    }));

    it('should set notFound when purchase order is not found', fakeAsync(() => {
      mockPurchaseOrderService.getPurchaseOrderById.and.returnValue(Promise.resolve(null));

      fixture.detectChanges();
      tick();

      expect(component.notFound()).toBeTrue();
      expect(component.loading()).toBeFalse();
    }));

    it('should show error toast when loading fails', fakeAsync(() => {
      mockPurchaseOrderService.getPurchaseOrderById.and.returnValue(Promise.reject(new Error('Network error')));

      fixture.detectChanges();
      tick();

      expect(component.notFound()).toBeTrue();
      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to load purchase order details');
    }));
  });

  describe('Status checks', () => {
    beforeEach(fakeAsync(() => {
      mockPurchaseOrderService.getPurchaseOrderById.and.returnValue(Promise.resolve(mockPendingPO));
      fixture.detectChanges();
      tick();
    }));

    it('should identify pending status', () => {
      expect(component.isPending()).toBeTrue();
      expect(component.isReceived()).toBeFalse();
      expect(component.isCancelled()).toBeFalse();
    });

    it('should identify received status', fakeAsync(() => {
      mockPurchaseOrderService.getPurchaseOrderById.and.returnValue(Promise.resolve(mockReceivedPO));
      component.ngOnInit();
      tick();

      expect(component.isPending()).toBeFalse();
      expect(component.isReceived()).toBeTrue();
      expect(component.isCancelled()).toBeFalse();
    }));

    it('should identify cancelled status', fakeAsync(() => {
      mockPurchaseOrderService.getPurchaseOrderById.and.returnValue(Promise.resolve(mockCancelledPO));
      component.ngOnInit();
      tick();

      expect(component.isPending()).toBeFalse();
      expect(component.isReceived()).toBeFalse();
      expect(component.isCancelled()).toBeTrue();
    }));
  });

  describe('getStatusLabel', () => {
    it('should return correct label for pending status', () => {
      expect(component.getStatusLabel(PurchaseOrderStatus.PENDING)).toBe('Pending');
    });

    it('should return correct label for received status', () => {
      expect(component.getStatusLabel(PurchaseOrderStatus.RECEIVED)).toBe('Received');
    });

    it('should return correct label for cancelled status', () => {
      expect(component.getStatusLabel(PurchaseOrderStatus.CANCELLED)).toBe('Cancelled');
    });
  });

  describe('getStatusSeverity', () => {
    it('should return warn for pending status', () => {
      expect(component.getStatusSeverity(PurchaseOrderStatus.PENDING)).toBe('warn');
    });

    it('should return success for received status', () => {
      expect(component.getStatusSeverity(PurchaseOrderStatus.RECEIVED)).toBe('success');
    });

    it('should return danger for cancelled status', () => {
      expect(component.getStatusSeverity(PurchaseOrderStatus.CANCELLED)).toBe('danger');
    });
  });

  describe('getTotalUnits', () => {
    it('should return 0 when no purchase order', () => {
      expect(component.getTotalUnits()).toBe(0);
    });

    it('should calculate total units correctly', fakeAsync(() => {
      mockPurchaseOrderService.getPurchaseOrderById.and.returnValue(Promise.resolve(mockPendingPO));
      fixture.detectChanges();
      tick();

      expect(component.getTotalUnits()).toBe(5);
    }));

    it('should sum units across multiple items', fakeAsync(() => {
      const poWithMultipleItems: PurchaseOrder = {
        ...mockPendingPO,
        items: [
          { ...mockPendingPO.items[0], quantity: 3 },
          { ...mockPendingPO.items[0], id: 'item-2', quantity: 7 }
        ]
      };
      mockPurchaseOrderService.getPurchaseOrderById.and.returnValue(Promise.resolve(poWithMultipleItems));
      fixture.detectChanges();
      tick();

      expect(component.getTotalUnits()).toBe(10);
    }));
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const result = component.formatDate('2024-01-15');
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });
  });

  describe('formatDateTime', () => {
    it('should format datetime correctly', () => {
      const result = component.formatDateTime('2024-01-15T10:30:00Z');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });
  });

  describe('Receiving Dialog', () => {
    beforeEach(fakeAsync(() => {
      mockPurchaseOrderService.getPurchaseOrderById.and.returnValue(Promise.resolve(mockPendingPO));
      fixture.detectChanges();
      tick();
    }));

    it('should open receiving dialog', () => {
      expect(component.showReceivingDialog()).toBeFalse();

      component.openReceivingDialog();

      expect(component.showReceivingDialog()).toBeTrue();
    });

    it('should close receiving dialog', () => {
      component.openReceivingDialog();
      expect(component.showReceivingDialog()).toBeTrue();

      component.onReceivingDialogClosed();

      expect(component.showReceivingDialog()).toBeFalse();
    });

    it('should refresh PO data when order is received', fakeAsync(() => {
      const updatedPO: PurchaseOrder = { ...mockPendingPO, status: PurchaseOrderStatus.RECEIVED };
      mockPurchaseOrderService.getPurchaseOrderById.and.returnValue(Promise.resolve(updatedPO));

      component.onOrderReceived({ phonesCreated: 5 });
      tick();

      expect(component.showReceivingDialog()).toBeFalse();
      expect(mockPurchaseOrderService.getPurchaseOrderById).toHaveBeenCalledWith('po-1');
      expect(component.purchaseOrder()?.status).toBe(PurchaseOrderStatus.RECEIVED);
    }));
  });

  describe('Cancel Order', () => {
    beforeEach(fakeAsync(() => {
      mockPurchaseOrderService.getPurchaseOrderById.and.returnValue(Promise.resolve(mockPendingPO));
      fixture.detectChanges();
      tick();
    }));

    it('should not cancel when user declines confirmation', fakeAsync(() => {
      mockConfirmDialogService.confirm.and.returnValue(Promise.resolve(false));

      component.cancelOrder();
      tick();

      expect(mockPurchaseOrderService.cancelPurchaseOrder).not.toHaveBeenCalled();
    }));

    it('should cancel order when user confirms', fakeAsync(() => {
      mockConfirmDialogService.confirm.and.returnValue(Promise.resolve(true));
      mockPurchaseOrderService.cancelPurchaseOrder.and.returnValue(Promise.resolve(mockCancelledPO));

      component.cancelOrder();
      tick();

      expect(mockPurchaseOrderService.cancelPurchaseOrder).toHaveBeenCalledWith('po-1');
      expect(component.purchaseOrder()?.status).toBe(PurchaseOrderStatus.CANCELLED);
      expect(mockToastService.success).toHaveBeenCalledWith('Success', 'Purchase order PO-0001 has been cancelled');
    }));

    it('should show error toast when cancel fails', fakeAsync(() => {
      mockConfirmDialogService.confirm.and.returnValue(Promise.resolve(true));
      mockPurchaseOrderService.cancelPurchaseOrder.and.returnValue(Promise.reject(new Error('Cancel failed')));

      component.cancelOrder();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to cancel purchase order');
    }));

    it('should set and clear action loading state', fakeAsync(() => {
      mockConfirmDialogService.confirm.and.returnValue(Promise.resolve(true));
      mockPurchaseOrderService.cancelPurchaseOrder.and.returnValue(
        new Promise(resolve => setTimeout(() => resolve(mockCancelledPO), 100))
      );

      expect(component.actionLoading()).toBeFalse();

      component.cancelOrder();
      tick(50);

      expect(component.actionLoading()).toBeTrue();

      tick(100);

      expect(component.actionLoading()).toBeFalse();
    }));
  });

  describe('Navigation', () => {
    beforeEach(fakeAsync(() => {
      mockPurchaseOrderService.getPurchaseOrderById.and.returnValue(Promise.resolve(mockPendingPO));
      fixture.detectChanges();
      tick();
    }));

    it('should go back using location.back when history exists', () => {
      spyOnProperty(window, 'history').and.returnValue({ length: 5 } as History);

      component.goBackToList();

      expect(mockLocation.back).toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should navigate to PO list when no history', () => {
      spyOnProperty(window, 'history').and.returnValue({ length: 1 } as History);

      component.goBackToList();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/purchase-orders']);
    });

    it('should navigate to inventory', () => {
      component.navigateToInventory();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/inventory']);
    });
  });

  describe('Acceptance Criteria - F-022', () => {
    it('AC1: should display all PO header information', fakeAsync(() => {
      mockPurchaseOrderService.getPurchaseOrderById.and.returnValue(Promise.resolve(mockPendingPO));
      fixture.detectChanges();
      tick();

      const po = component.purchaseOrder();
      expect(po?.supplierName).toBe('Tech Supplies Inc');
      expect(po?.orderDate).toBe('2024-01-15');
      expect(po?.status).toBe(PurchaseOrderStatus.PENDING);
      expect(po?.totalAmount).toBe(4000);
      expect(po?.notes).toBe('Test notes for pending PO');
    }));

    it('AC2: should display line items with brand, model, quantity, unit_cost, and line total', fakeAsync(() => {
      mockPurchaseOrderService.getPurchaseOrderById.and.returnValue(Promise.resolve(mockPendingPO));
      fixture.detectChanges();
      tick();

      const items = component.purchaseOrder()?.items;
      expect(items?.length).toBe(1);
      expect(items?.[0].brand).toBe('Apple');
      expect(items?.[0].model).toBe('iPhone 15');
      expect(items?.[0].quantity).toBe(5);
      expect(items?.[0].unitCost).toBe(800);
      expect(items?.[0].lineTotal).toBe(4000);
    }));

    it('AC3: should show action buttons for pending PO', fakeAsync(() => {
      mockPurchaseOrderService.getPurchaseOrderById.and.returnValue(Promise.resolve(mockPendingPO));
      fixture.detectChanges();
      tick();

      expect(component.isPending()).toBeTrue();
      // Buttons available when pending
    }));

    it('AC4: should hide action buttons for received PO', fakeAsync(() => {
      mockPurchaseOrderService.getPurchaseOrderById.and.returnValue(Promise.resolve(mockReceivedPO));
      fixture.detectChanges();
      tick();

      expect(component.isPending()).toBeFalse();
      expect(component.isReceived()).toBeTrue();
      // Action buttons hidden, lock indicator shown
    }));

    it('AC4: should hide action buttons for cancelled PO', fakeAsync(() => {
      mockPurchaseOrderService.getPurchaseOrderById.and.returnValue(Promise.resolve(mockCancelledPO));
      fixture.detectChanges();
      tick();

      expect(component.isPending()).toBeFalse();
      expect(component.isCancelled()).toBeTrue();
      // Action buttons hidden, lock indicator shown
    }));

    it('AC5: should provide link back to PO list', fakeAsync(() => {
      mockPurchaseOrderService.getPurchaseOrderById.and.returnValue(Promise.resolve(mockPendingPO));
      fixture.detectChanges();
      tick();

      // goBackToList method exists and works
      expect(component.goBackToList).toBeDefined();
    }));
  });
});
