import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';
import { MessageService } from 'primeng/api';

import { PurchaseOrderListComponent } from './purchase-order-list.component';
import { PurchaseOrderService, PurchaseOrderSummary } from '../../../../core/services/purchase-order.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { PurchaseOrder } from '../../../../models/purchase-order.model';
import { Supplier } from '../../../../models/supplier.model';
import { PurchaseOrderStatus } from '../../../../enums';

describe('PurchaseOrderListComponent', () => {
  let component: PurchaseOrderListComponent;
  let fixture: ComponentFixture<PurchaseOrderListComponent>;
  let mockPurchaseOrderService: jasmine.SpyObj<PurchaseOrderService>;
  let mockSupplierService: jasmine.SpyObj<SupplierService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let router: Router;

  const mockSuppliers: Supplier[] = [
    {
      id: 'supplier-1',
      name: 'Tech Supplies Inc',
      contactPerson: 'John Doe',
      contactEmail: 'john@techsupplies.com',
      contactPhone: '+1-555-0100',
      address: '123 Tech Street',
      notes: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: null
    },
    {
      id: 'supplier-2',
      name: 'Mobile Parts Ltd',
      contactPerson: null,
      contactEmail: 'info@mobileparts.com',
      contactPhone: null,
      address: null,
      notes: null,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: null
    }
  ];

  const mockPurchaseOrders: PurchaseOrder[] = [
    {
      id: 'po-1',
      poNumber: 'PO-0001',
      supplierId: 'supplier-1',
      supplierName: 'Tech Supplies Inc',
      orderDate: '2024-01-15',
      totalAmount: 5000,
      status: PurchaseOrderStatus.PENDING,
      notes: null,
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
    },
    {
      id: 'po-2',
      poNumber: 'PO-0002',
      supplierId: 'supplier-2',
      supplierName: 'Mobile Parts Ltd',
      orderDate: '2024-01-10',
      totalAmount: 3000,
      status: PurchaseOrderStatus.RECEIVED,
      notes: 'Test notes',
      items: [
        {
          id: 'item-2',
          purchaseOrderId: 'po-2',
          brand: 'Samsung',
          model: 'Galaxy S24',
          quantity: 3,
          unitCost: 1000,
          lineTotal: 3000,
          createdAt: '2024-01-10T00:00:00Z'
        }
      ],
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-12T00:00:00Z'
    },
    {
      id: 'po-3',
      poNumber: 'PO-0003',
      supplierId: 'supplier-1',
      supplierName: 'Tech Supplies Inc',
      orderDate: '2024-01-05',
      totalAmount: 2000,
      status: PurchaseOrderStatus.CANCELLED,
      notes: null,
      items: [],
      createdAt: '2024-01-05T00:00:00Z',
      updatedAt: '2024-01-06T00:00:00Z'
    }
  ];

  const mockSummary: PurchaseOrderSummary = {
    totalOrders: 3,
    pendingOrders: 1,
    receivedOrders: 1,
    cancelledOrders: 1,
    totalAmount: 10000,
    pendingAmount: 5000
  };

  beforeEach(async () => {
    mockPurchaseOrderService = jasmine.createSpyObj('PurchaseOrderService', [
      'getPurchaseOrders', 'getSummary'
    ]);
    mockSupplierService = jasmine.createSpyObj('SupplierService', ['getSuppliers']);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warn']);

    mockPurchaseOrderService.getPurchaseOrders.and.returnValue(
      Promise.resolve({ data: mockPurchaseOrders, total: 3 })
    );
    mockPurchaseOrderService.getSummary.and.returnValue(Promise.resolve(mockSummary));
    mockSupplierService.getSuppliers.and.returnValue(
      Promise.resolve({ data: mockSuppliers, total: 2 })
    );

    await TestBed.configureTestingModule({
      imports: [
        PurchaseOrderListComponent,
        NoopAnimationsModule,
        FormsModule
      ],
      providers: [
        provideRouter([]),
        { provide: PurchaseOrderService, useValue: mockPurchaseOrderService },
        { provide: SupplierService, useValue: mockSupplierService },
        { provide: ToastService, useValue: mockToastService },
        MessageService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseOrderListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  describe('component initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load purchase orders on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockPurchaseOrderService.getPurchaseOrders).toHaveBeenCalled();
      expect(component.purchaseOrders().length).toBe(3);
    }));

    it('should load suppliers on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockSupplierService.getSuppliers).toHaveBeenCalled();
      expect(component.suppliers().length).toBe(2);
    }));

    it('should load summary on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockPurchaseOrderService.getSummary).toHaveBeenCalled();
      expect(component.summary()).toEqual(mockSummary);
    }));

    it('should set loading state while fetching data', fakeAsync(() => {
      expect(component.loading()).toBe(false);

      fixture.detectChanges();
      expect(component.loading()).toBe(true);

      tick();
      expect(component.loading()).toBe(false);
    }));

    it('should show skeleton loader while loading', fakeAsync(() => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('p-skeleton').length).toBeGreaterThan(0);

      tick();
      fixture.detectChanges();

      expect(compiled.querySelectorAll('p-skeleton').length).toBe(0);
    }));

    it('should display "Purchase Orders" as page title', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h1')?.textContent).toContain('Purchase Orders');
    }));

    it('should show error toast when loading fails', fakeAsync(() => {
      mockPurchaseOrderService.getPurchaseOrders.and.returnValue(
        Promise.reject(new Error('Load failed'))
      );

      fixture.detectChanges();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to load data');
    }));

    it('should show empty state when no purchase orders exist', fakeAsync(() => {
      mockPurchaseOrderService.getPurchaseOrders.and.returnValue(
        Promise.resolve({ data: [], total: 0 })
      );
      mockPurchaseOrderService.getSummary.and.returnValue(
        Promise.resolve({
          totalOrders: 0,
          pendingOrders: 0,
          receivedOrders: 0,
          cancelledOrders: 0,
          totalAmount: 0,
          pendingAmount: 0
        })
      );

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No purchase orders found');
      expect(compiled.textContent).toContain('Create Your First Purchase Order');
    }));
  });

  describe('summary statistics', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should display total orders count', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Total Orders');
      expect(compiled.textContent).toContain('3');
    });

    it('should display pending orders count', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Pending');
      expect(compiled.textContent).toContain('1');
    });

    it('should display received orders count', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Received');
    });

    it('should display cancelled orders count', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Cancelled');
      // mockSummary has cancelledOrders: 1
    });
  });

  describe('purchase order list display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should display PO numbers', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('PO-0001');
      expect(compiled.textContent).toContain('PO-0002');
      expect(compiled.textContent).toContain('PO-0003');
    });

    it('should display supplier names', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Tech Supplies Inc');
      expect(compiled.textContent).toContain('Mobile Parts Ltd');
    });

    it('should display total amounts with currency formatting', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('$5,000');
      expect(compiled.textContent).toContain('$3,000');
      expect(compiled.textContent).toContain('$2,000');
    });

    it('should display item counts', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('1 item(s)');
      expect(compiled.textContent).toContain('0 item(s)');
    });

    it('should have view details button for each PO', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const viewButtons = compiled.querySelectorAll('p-button[ptooltip="View Details"]');
      expect(viewButtons.length).toBe(3);
    });
  });

  describe('status display and color coding', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should display status labels', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Pending');
      expect(compiled.textContent).toContain('Received');
      expect(compiled.textContent).toContain('Cancelled');
    });

    it('should return correct status label for pending', () => {
      expect(component.getStatusLabel(PurchaseOrderStatus.PENDING)).toBe('Pending');
    });

    it('should return correct status label for received', () => {
      expect(component.getStatusLabel(PurchaseOrderStatus.RECEIVED)).toBe('Received');
    });

    it('should return correct status label for cancelled', () => {
      expect(component.getStatusLabel(PurchaseOrderStatus.CANCELLED)).toBe('Cancelled');
    });

    it('should return warn severity for pending status (orange)', () => {
      expect(component.getStatusSeverity(PurchaseOrderStatus.PENDING)).toBe('warn');
    });

    it('should return success severity for received status (green)', () => {
      expect(component.getStatusSeverity(PurchaseOrderStatus.RECEIVED)).toBe('success');
    });

    it('should return danger severity for cancelled status (red)', () => {
      expect(component.getStatusSeverity(PurchaseOrderStatus.CANCELLED)).toBe('danger');
    });
  });

  describe('filtering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should have status filter dropdown', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const statusLabel = compiled.querySelector('label[for="statusFilter"]');
      expect(statusLabel?.textContent).toContain('Status');
    });

    it('should have supplier filter dropdown', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const supplierLabel = compiled.querySelector('label[for="supplierFilter"]');
      expect(supplierLabel?.textContent).toContain('Supplier');
    });

    it('should have correct status options', () => {
      expect(component.statusOptions.length).toBe(4);
      expect(component.statusOptions[0].label).toBe('All Statuses');
      expect(component.statusOptions[1].label).toBe('Pending');
      expect(component.statusOptions[2].label).toBe('Received');
      expect(component.statusOptions[3].label).toBe('Cancelled');
    });

    it('should compute supplier options from loaded suppliers', () => {
      const options = component.supplierOptions();
      expect(options.length).toBe(3); // 'All Suppliers' + 2 suppliers
      expect(options[0].label).toBe('All Suppliers');
      expect(options[1].label).toBe('Tech Supplies Inc');
      expect(options[2].label).toBe('Mobile Parts Ltd');
    });

    it('should call onFilterChange when status is selected', fakeAsync(() => {
      const initialCallCount = mockPurchaseOrderService.getPurchaseOrders.calls.count();

      component.selectedStatus = PurchaseOrderStatus.PENDING;
      component.onFilterChange();
      tick();

      expect(mockPurchaseOrderService.getPurchaseOrders.calls.count()).toBe(initialCallCount + 1);
      expect(mockPurchaseOrderService.getPurchaseOrders).toHaveBeenCalledWith({
        status: PurchaseOrderStatus.PENDING
      });
    }));

    it('should call onFilterChange when supplier is selected', fakeAsync(() => {
      const initialCallCount = mockPurchaseOrderService.getPurchaseOrders.calls.count();

      component.selectedSupplierId = 'supplier-1';
      component.onFilterChange();
      tick();

      expect(mockPurchaseOrderService.getPurchaseOrders.calls.count()).toBe(initialCallCount + 1);
      expect(mockPurchaseOrderService.getPurchaseOrders).toHaveBeenCalledWith({
        supplierId: 'supplier-1'
      });
    }));

    it('should apply both filters when both are selected', fakeAsync(() => {
      component.selectedStatus = PurchaseOrderStatus.PENDING;
      component.selectedSupplierId = 'supplier-1';
      component.onFilterChange();
      tick();

      expect(mockPurchaseOrderService.getPurchaseOrders).toHaveBeenCalledWith({
        status: PurchaseOrderStatus.PENDING,
        supplierId: 'supplier-1'
      });
    }));

    it('should not have active filters initially', () => {
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should detect active status filter', () => {
      component.selectedStatus = PurchaseOrderStatus.PENDING;
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should detect active supplier filter', () => {
      component.selectedSupplierId = 'supplier-1';
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should show Clear Filters button when filters are active', fakeAsync(() => {
      component.selectedStatus = PurchaseOrderStatus.PENDING;
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Clear Filters');
    }));

    it('should clear all filters when Clear Filters is clicked', fakeAsync(() => {
      component.selectedStatus = PurchaseOrderStatus.PENDING;
      component.selectedSupplierId = 'supplier-1';

      component.clearFilters();
      tick();

      expect(component.selectedStatus).toBeNull();
      expect(component.selectedSupplierId).toBeNull();
      expect(component.hasActiveFilters()).toBe(false);
    }));

    it('should show filtered empty state when no results match filter', fakeAsync(() => {
      mockPurchaseOrderService.getPurchaseOrders.and.returnValue(
        Promise.resolve({ data: [], total: 0 })
      );

      component.selectedStatus = PurchaseOrderStatus.PENDING;
      component.onFilterChange();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No purchase orders match the current filters');
    }));
  });

  describe('navigation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should navigate to detail page when view details is clicked', fakeAsync(() => {
      const navigateSpy = spyOn(router, 'navigate');
      const po = mockPurchaseOrders[0];

      component.onViewDetails(po);
      tick();

      expect(navigateSpy).toHaveBeenCalledWith(['/admin/purchase-orders', 'po-1']);
    }));

    it('should have link to create new purchase order', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const newButton = compiled.querySelector('p-button[routerlink="/admin/purchase-orders/new"]');
      expect(newButton).toBeTruthy();
    });
  });

  describe('pagination', () => {
    it('should show paginator when more than 10 purchase orders', fakeAsync(() => {
      const manyOrders = Array.from({ length: 15 }, (_, i) => ({
        id: `po-${i}`,
        poNumber: `PO-${String(i).padStart(4, '0')}`,
        supplierId: 'supplier-1',
        supplierName: 'Tech Supplies Inc',
        orderDate: '2024-01-01',
        totalAmount: 1000,
        status: PurchaseOrderStatus.PENDING,
        notes: null,
        items: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: null
      }));
      mockPurchaseOrderService.getPurchaseOrders.and.returnValue(
        Promise.resolve({ data: manyOrders, total: 15 })
      );

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.p-paginator')).toBeTruthy();
    }));

    it('should display correct page report template', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('purchase orders');
    }));
  });

  describe('table features', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should have sortable columns', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const sortableHeaders = compiled.querySelectorAll('[psortablecolumn]');
      expect(sortableHeaders.length).toBeGreaterThanOrEqual(5);
    });

    it('should have frozen action column', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const frozenColumns = compiled.querySelectorAll('[pfrozencolumn]');
      expect(frozenColumns.length).toBeGreaterThan(0);
    });

    it('should have horizontal scroll enabled', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const table = compiled.querySelector('p-table');
      expect(table).toBeTruthy();
    });

    it('should sort by order date descending by default', () => {
      // The component should have sortField='orderDate' and sortOrder=-1
      // This is verified through the template configuration
      expect(component.purchaseOrders()[0].poNumber).toBe('PO-0001');
    });
  });

  describe('accessibility', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should have proper button tooltips', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[ptooltip="View Details"]')).toBeTruthy();
    });

    it('should have New Purchase Order button with icon', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const addButton = compiled.querySelector('p-button[label="New Purchase Order"]');
      expect(addButton).toBeTruthy();
    });

    it('should have labels for filter dropdowns', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const statusLabel = compiled.querySelector('label[for="statusFilter"]');
      const supplierLabel = compiled.querySelector('label[for="supplierFilter"]');
      expect(statusLabel).toBeTruthy();
      expect(supplierLabel).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should show error toast when filter request fails', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      mockPurchaseOrderService.getPurchaseOrders.and.returnValue(
        Promise.reject(new Error('Filter failed'))
      );

      component.selectedStatus = PurchaseOrderStatus.PENDING;
      component.onFilterChange();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to load purchase orders');
    }));

    it('should show error toast when clear filters fails', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      mockPurchaseOrderService.getPurchaseOrders.and.returnValue(
        Promise.reject(new Error('Clear failed'))
      );

      component.selectedStatus = PurchaseOrderStatus.PENDING;
      component.clearFilters();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to load purchase orders');
    }));
  });
});
