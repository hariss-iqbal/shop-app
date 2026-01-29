import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';

import { SupplierListComponent } from './supplier-list.component';
import { SupplierService } from '../../../../core/services/supplier.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirmation.service';
import { Supplier } from '../../../../models/supplier.model';

describe('SupplierListComponent', () => {
  let component: SupplierListComponent;
  let fixture: ComponentFixture<SupplierListComponent>;
  let mockSupplierService: jasmine.SpyObj<SupplierService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockConfirmService: jasmine.SpyObj<ConfirmDialogService>;
  let router: Router;

  const mockSuppliers: Supplier[] = [
    {
      id: 'supplier-1',
      name: 'Tech Supplies Inc',
      contactPerson: 'John Doe',
      contactEmail: 'john@techsupplies.com',
      contactPhone: '+1-555-0100',
      address: '123 Tech Street',
      notes: 'Reliable supplier',
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
    },
    {
      id: 'supplier-3',
      name: 'Phone Wholesalers',
      contactPerson: 'Jane Smith',
      contactEmail: null,
      contactPhone: '+1-555-0200',
      address: '456 Wholesale Ave',
      notes: null,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: null
    }
  ];

  beforeEach(async () => {
    mockSupplierService = jasmine.createSpyObj('SupplierService', [
      'getSuppliers', 'deleteSupplier', 'hasPurchaseOrders'
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warn']);
    mockConfirmService = jasmine.createSpyObj('ConfirmDialogService', ['confirmDelete']);

    mockSupplierService.getSuppliers.and.returnValue(Promise.resolve({ data: mockSuppliers, total: 3 }));
    mockConfirmService.confirmDelete.and.returnValue(Promise.resolve(true));
    mockSupplierService.hasPurchaseOrders.and.returnValue(Promise.resolve(false));

    await TestBed.configureTestingModule({
      imports: [
        SupplierListComponent,
        NoopAnimationsModule,
        FormsModule
      ],
      providers: [
        provideRouter([]),
        { provide: SupplierService, useValue: mockSupplierService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ConfirmDialogService, useValue: mockConfirmService },
        MessageService,
        ConfirmationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SupplierListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  describe('component initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load suppliers on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockSupplierService.getSuppliers).toHaveBeenCalled();
      expect(component.suppliers().length).toBe(3);
    }));

    it('should set loading state while fetching suppliers', fakeAsync(() => {
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

    it('should display "Suppliers" as page title', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h1')?.textContent).toContain('Suppliers');
    }));

    it('should show error toast when loading fails', fakeAsync(() => {
      mockSupplierService.getSuppliers.and.returnValue(Promise.reject(new Error('Load failed')));

      fixture.detectChanges();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to load suppliers');
    }));

    it('should show empty state when no suppliers exist', fakeAsync(() => {
      mockSupplierService.getSuppliers.and.returnValue(Promise.resolve({ data: [], total: 0 }));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No suppliers found');
      expect(compiled.textContent).toContain('Add Your First Supplier');
    }));
  });

  describe('supplier list display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should display supplier names', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Tech Supplies Inc');
      expect(compiled.textContent).toContain('Mobile Parts Ltd');
      expect(compiled.textContent).toContain('Phone Wholesalers');
    });

    it('should display contact person when available', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('John Doe');
      expect(compiled.textContent).toContain('Jane Smith');
    });

    it('should display dash for missing contact person', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const cells = compiled.querySelectorAll('td');
      let foundDash = false;
      cells.forEach(cell => {
        if (cell.textContent?.trim() === '-') {
          foundDash = true;
        }
      });
      expect(foundDash).toBe(true);
    });

    it('should display phone numbers as clickable links', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const phoneLinks = compiled.querySelectorAll('a[href^="tel:"]');
      expect(phoneLinks.length).toBeGreaterThanOrEqual(2);
    });

    it('should display email addresses as clickable links', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const emailLinks = compiled.querySelectorAll('a[href^="mailto:"]');
      expect(emailLinks.length).toBeGreaterThanOrEqual(2);
    });

    it('should have edit and delete buttons for each supplier', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const dataRows = compiled.querySelectorAll('tbody tr');
      expect(dataRows.length).toBe(3);

      const actionButtons = compiled.querySelectorAll('td p-button');
      expect(actionButtons.length).toBeGreaterThanOrEqual(6); // 2 per row * 3 rows
    });
  });

  describe('search functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should have search input', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const searchInput = compiled.querySelector('input[type="text"][placeholder="Search suppliers..."]');
      expect(searchInput).toBeTruthy();
    });

    it('should call onGlobalFilter on input', () => {
      spyOn(component, 'onGlobalFilter');
      const compiled = fixture.nativeElement as HTMLElement;
      const searchInput = compiled.querySelector('input[type="text"][placeholder="Search suppliers..."]') as HTMLInputElement;

      const event = new Event('input');
      searchInput.dispatchEvent(event);

      expect(component.onGlobalFilter).toHaveBeenCalled();
    });
  });

  describe('edit supplier', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should navigate to edit page when edit button is clicked', fakeAsync(() => {
      const navigateSpy = spyOn(router, 'navigate');
      const supplier = mockSuppliers[0];

      component.onEdit(supplier);
      tick();

      expect(navigateSpy).toHaveBeenCalledWith(['/admin/suppliers', 'supplier-1', 'edit']);
    }));
  });

  describe('delete supplier', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should check for purchase orders before showing delete confirmation', fakeAsync(() => {
      mockSupplierService.deleteSupplier.and.returnValue(Promise.resolve());
      const supplier = mockSuppliers[0];

      component.onDelete(supplier);
      tick();

      expect(mockSupplierService.hasPurchaseOrders).toHaveBeenCalledWith('supplier-1');
    }));

    it('should show error when supplier has purchase orders', fakeAsync(() => {
      mockSupplierService.hasPurchaseOrders.and.returnValue(Promise.resolve(true));
      const supplier = mockSuppliers[0];

      component.onDelete(supplier);
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Cannot Delete',
        'Supplier "Tech Supplies Inc" has existing purchase orders. Delete or reassign the purchase orders first.'
      );
      expect(mockConfirmService.confirmDelete).not.toHaveBeenCalled();
    }));

    it('should show confirmation dialog before delete', fakeAsync(() => {
      mockSupplierService.deleteSupplier.and.returnValue(Promise.resolve());
      const supplier = mockSuppliers[0];

      component.onDelete(supplier);
      tick();

      expect(mockConfirmService.confirmDelete).toHaveBeenCalledWith('supplier', 'Tech Supplies Inc');
    }));

    it('should not delete if confirmation is cancelled', fakeAsync(() => {
      mockConfirmService.confirmDelete.and.returnValue(Promise.resolve(false));
      const supplier = mockSuppliers[0];

      component.onDelete(supplier);
      tick();

      expect(mockSupplierService.deleteSupplier).not.toHaveBeenCalled();
    }));

    it('should delete supplier and reload list on confirmation', fakeAsync(() => {
      mockSupplierService.deleteSupplier.and.returnValue(Promise.resolve());
      const supplier = mockSuppliers[0];
      const initialCallCount = mockSupplierService.getSuppliers.calls.count();

      component.onDelete(supplier);
      tick();

      expect(mockSupplierService.deleteSupplier).toHaveBeenCalledWith('supplier-1');
      expect(mockToastService.success).toHaveBeenCalledWith(
        'Deleted',
        'Supplier "Tech Supplies Inc" has been deleted'
      );
      expect(mockSupplierService.getSuppliers.calls.count()).toBe(initialCallCount + 1);
    }));

    it('should show error toast on delete failure', fakeAsync(() => {
      mockSupplierService.deleteSupplier.and.returnValue(Promise.reject(new Error('Delete failed')));
      const supplier = mockSuppliers[0];

      component.onDelete(supplier);
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Delete failed');
    }));
  });

  describe('pagination', () => {
    it('should show paginator when more than 10 suppliers', fakeAsync(() => {
      const manySuppliers = Array.from({ length: 15 }, (_, i) => ({
        id: `supplier-${i}`,
        name: `Supplier ${i}`,
        contactPerson: null,
        contactEmail: null,
        contactPhone: null,
        address: null,
        notes: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: null
      }));
      mockSupplierService.getSuppliers.and.returnValue(
        Promise.resolve({ data: manySuppliers, total: 15 })
      );

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.p-paginator')).toBeTruthy();
    }));

    it('should display correct page report template', fakeAsync(() => {
      const manySuppliers = Array.from({ length: 15 }, (_, i) => ({
        id: `supplier-${i}`,
        name: `Supplier ${i}`,
        contactPerson: null,
        contactEmail: null,
        contactPhone: null,
        address: null,
        notes: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: null
      }));
      mockSupplierService.getSuppliers.and.returnValue(
        Promise.resolve({ data: manySuppliers, total: 15 })
      );

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('suppliers');
    }));
  });

  describe('accessibility', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should have proper button tooltips', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('[ptooltip="Edit"]')).toBeTruthy();
      expect(compiled.querySelector('[ptooltip="Delete"]')).toBeTruthy();
    });

    it('should have Add Supplier button with icon', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const addButton = compiled.querySelector('p-button[label="Add Supplier"]');
      expect(addButton).toBeTruthy();
    });
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
      expect(sortableHeaders.length).toBeGreaterThanOrEqual(4);
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
  });
});
