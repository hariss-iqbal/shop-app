import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { TableLazyLoadEvent } from 'primeng/table';
import { provideRouter } from '@angular/router';

import { InventoryListComponent } from './inventory-list.component';
import { ProductService } from '../../../../core/services/product.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirmation.service';
import { CsvExportService } from '../../../../shared/services/csv-export.service';
import { Product } from '../../../../models/product.model';
import { ProductStatus } from '../../../../enums/product-status.enum';
import { ProductCondition } from '../../../../enums/product-condition.enum';
import { ProductType } from '../../../../enums/product-type.enum';

describe('InventoryListComponent', () => {
  let component: InventoryListComponent;
  let fixture: ComponentFixture<InventoryListComponent>;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockConfirmDialogService: jasmine.SpyObj<ConfirmDialogService>;
  let mockCsvExportService: jasmine.SpyObj<CsvExportService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSupabaseService: any;

  const mockProduct: Product = {
    id: 'product-1',
    brandId: 'brand-1',
    brandName: 'Apple',
    brandLogoUrl: 'https://example.com/apple.png',
    model: 'iPhone 15 Pro',
    description: 'Test description',
    storageGb: 256,
    ramGb: 8,
    color: 'Space Black',
    condition: ProductCondition.NEW,
    batteryHealth: null,
    imei: '123456789012345',
    costPrice: 900,
    sellingPrice: 1200,
    profitMargin: 25,
    status: ProductStatus.AVAILABLE,
    purchaseDate: '2024-01-15',
    supplierId: 'supplier-1',
    supplierName: 'Test Supplier',
    notes: null,
    primaryImageUrl: 'https://example.com/phone.jpg',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: null,
    taxRate: 10,
    isTaxInclusive: false,
    isTaxExempt: false
  };

  const mockProducts: Product[] = [
    mockProduct,
    {
      ...mockProduct,
      id: 'product-2',
      model: 'iPhone 14',
      status: ProductStatus.SOLD
    },
    {
      ...mockProduct,
      id: 'product-3',
      model: 'iPhone 13',
      status: ProductStatus.RESERVED
    }
  ];

  beforeEach(async () => {
    mockProductService = jasmine.createSpyObj('ProductService', [
      'getProducts',
      'deleteProduct',
      'deleteProducts',
      'updateProductStatus',
      'updatePhonesStatus',
      'getExportPhones'
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warn']);
    mockConfirmDialogService = jasmine.createSpyObj('ConfirmDialogService', [
      'confirmDelete',
      'confirmBulkDelete',
      'confirmBulkAction'
    ]);
    mockCsvExportService = jasmine.createSpyObj('CsvExportService', ['exportToCsv']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    // Mock SupabaseService to prevent real initialization
    mockSupabaseService = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue(Promise.resolve({ data: [], error: null }))
      }),
      auth: {
        getSession: jasmine.createSpy('getSession').and.returnValue(Promise.resolve({ data: { session: null } })),
        onAuthStateChange: jasmine.createSpy('onAuthStateChange').and.returnValue({
          data: { subscription: { unsubscribe: jasmine.createSpy() } }
        })
      }
    };

    mockProductService.getProducts.and.returnValue(Promise.resolve({
      data: mockProducts,
      total: 3
    }));

    await TestBed.configureTestingModule({
      imports: [
        InventoryListComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideRouter([]),
        { provide: ProductService, useValue: mockProductService },
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ConfirmDialogService, useValue: mockConfirmDialogService },
        { provide: CsvExportService, useValue: mockCsvExportService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map() } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryListComponent);
    component = fixture.componentInstance;
  });

  describe('component initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty products array', () => {
      expect(component.products()).toEqual([]);
    });

    it('should initialize with zero total records', () => {
      expect(component.totalRecords()).toBe(0);
    });

    it('should initialize with loading set to false', () => {
      expect(component.loading()).toBe(false);
    });

    it('should initialize with empty selected products', () => {
      expect(component.selectedProducts()).toEqual([]);
    });

    it('should initialize with empty global filter', () => {
      expect(component.globalFilter).toBe('');
    });
  });

  describe('loadProducts', () => {
    it('should load products on lazy load event', fakeAsync(() => {
      const event: TableLazyLoadEvent = {
        first: 0,
        rows: 10,
        sortField: 'model',
        sortOrder: 1
      };

      component.loadProducts(event);
      tick();

      expect(mockProductService.getProducts).toHaveBeenCalledWith({
        first: 0,
        rows: 10,
        sortField: 'model',
        sortOrder: 1,
        globalFilter: undefined
      });
      expect(component.products()).toEqual(mockProducts);
      expect(component.totalRecords()).toBe(3);
    }));

    it('should set loading state during data fetch', fakeAsync(() => {
      const event: TableLazyLoadEvent = { first: 0, rows: 10 };

      component.loadProducts(event);
      expect(component.loading()).toBe(true);

      tick();
      expect(component.loading()).toBe(false);
    }));

    it('should include global filter in params when set', fakeAsync(() => {
      const event: TableLazyLoadEvent = { first: 0, rows: 10 };
      component.globalFilter = 'iPhone';

      component.loadProducts(event);
      tick();

      expect(mockProductService.getProducts).toHaveBeenCalledWith(
        jasmine.objectContaining({ globalFilter: 'iPhone' })
      );
    }));

    it('should show error toast on load failure', fakeAsync(() => {
      mockProductService.getProducts.and.returnValue(Promise.reject(new Error('Load failed')));
      const event: TableLazyLoadEvent = { first: 0, rows: 10 };

      component.loadProducts(event);
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to load products');
    }));

    it('should handle default values for undefined event properties', fakeAsync(() => {
      const event: TableLazyLoadEvent = {};

      component.loadProducts(event);
      tick();

      expect(mockProductService.getProducts).toHaveBeenCalledWith(
        jasmine.objectContaining({
          first: 0,
          rows: 10
        })
      );
    }));
  });

  describe('onSearch', () => {
    it('should debounce search input', fakeAsync(() => {
      const event: TableLazyLoadEvent = { first: 0, rows: 10 };
      component.loadProducts(event);
      tick();

      mockProductService.getProducts.calls.reset();
      component.globalFilter = 'Apple';

      component.onSearch();
      tick(100);
      expect(mockProductService.getProducts).not.toHaveBeenCalled();

      tick(200);
      expect(mockProductService.getProducts).toHaveBeenCalledTimes(1);
    }));

    it('should reset to first page on search', fakeAsync(() => {
      const event: TableLazyLoadEvent = { first: 20, rows: 10 };
      component.loadProducts(event);
      tick();

      mockProductService.getProducts.calls.reset();
      component.globalFilter = 'iPhone';
      component.onSearch();
      tick(300);

      expect(mockProductService.getProducts).toHaveBeenCalledWith(
        jasmine.objectContaining({ first: 0 })
      );
    }));

    it('should cancel previous search timeout', fakeAsync(() => {
      const event: TableLazyLoadEvent = { first: 0, rows: 10 };
      component.loadProducts(event);
      tick();

      mockProductService.getProducts.calls.reset();

      component.globalFilter = 'Apple';
      component.onSearch();
      tick(100);

      component.globalFilter = 'Samsung';
      component.onSearch();
      tick(300);

      expect(mockProductService.getProducts).toHaveBeenCalledTimes(1);
      expect(mockProductService.getProducts).toHaveBeenCalledWith(
        jasmine.objectContaining({ globalFilter: 'Samsung' })
      );
    }));
  });

  describe('onDelete', () => {
    it('should confirm deletion before deleting', fakeAsync(() => {
      mockConfirmDialogService.confirmDelete.and.returnValue(Promise.resolve(true));
      mockProductService.deletePhone.and.returnValue(Promise.resolve());

      const event: TableLazyLoadEvent = { first: 0, rows: 10 };
      component.loadProducts(event);
      tick();

      component.onDelete(mockProduct);
      tick();

      expect(mockConfirmDialogService.confirmDelete).toHaveBeenCalledWith(
        'product',
        'Apple iPhone 15 Pro (IMEI: 123456789012345)'
      );
    }));

    it('should delete product and show success toast on confirmation', fakeAsync(() => {
      mockConfirmDialogService.confirmDelete.and.returnValue(Promise.resolve(true));
      mockProductService.deletePhone.and.returnValue(Promise.resolve());

      const event: TableLazyLoadEvent = { first: 0, rows: 10 };
      component.loadProducts(event);
      tick();

      component.onDelete(mockProduct);
      tick();

      expect(mockProductService.deleteProduct).toHaveBeenCalledWith('product-1');
      expect(mockToastService.success).toHaveBeenCalledWith(
        'Deleted',
        'Apple iPhone 15 Pro has been deleted'
      );
    }));

    it('should not delete product when confirmation is cancelled', fakeAsync(() => {
      mockConfirmDialogService.confirmDelete.and.returnValue(Promise.resolve(false));

      component.onDelete(mockProduct);
      tick();

      expect(mockProductService.deleteProduct).not.toHaveBeenCalled();
    }));

    it('should show error toast on delete failure', async () => {
      mockConfirmDialogService.confirmDelete.and.returnValue(Promise.resolve(true));
      mockProductService.deletePhone.and.returnValue(Promise.reject(new Error('Delete failed')));

      const event: TableLazyLoadEvent = { first: 0, rows: 10 };
      await component.loadProducts(event);

      await component.onDelete(mockProduct);

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to delete product');
    });
  });

  describe('onBulkDelete', () => {
    it('should do nothing if no products selected', fakeAsync(() => {
      component.selectedProducts.set([]);

      component.onBulkDelete();
      tick();

      expect(mockConfirmDialogService.confirmBulkDelete).not.toHaveBeenCalled();
    }));

    it('should confirm bulk deletion', fakeAsync(() => {
      mockConfirmDialogService.confirmBulkDelete.and.returnValue(Promise.resolve(true));
      mockProductService.deleteProducts.and.returnValue(Promise.resolve());

      const event: TableLazyLoadEvent = { first: 0, rows: 10 };
      component.loadProducts(event);
      tick();

      component.selectedProducts.set([mockProducts[0], mockProducts[1]]);

      component.onBulkDelete();
      tick();

      expect(mockConfirmDialogService.confirmBulkDelete).toHaveBeenCalledWith('product', 2);
    }));

    it('should delete selected products and show success toast', fakeAsync(() => {
      mockConfirmDialogService.confirmBulkDelete.and.returnValue(Promise.resolve(true));
      mockProductService.deleteProducts.and.returnValue(Promise.resolve());

      const event: TableLazyLoadEvent = { first: 0, rows: 10 };
      component.loadProducts(event);
      tick();

      component.selectedProducts.set([mockProducts[0], mockProducts[1]]);

      component.onBulkDelete();
      tick();

      expect(mockProductService.deleteProducts).toHaveBeenCalledWith(['product-1', 'product-2']);
      expect(mockToastService.success).toHaveBeenCalledWith('Deleted', '2 product(s) have been deleted');
    }));

    it('should clear selection after bulk delete', fakeAsync(() => {
      mockConfirmDialogService.confirmBulkDelete.and.returnValue(Promise.resolve(true));
      mockProductService.deleteProducts.and.returnValue(Promise.resolve());

      const event: TableLazyLoadEvent = { first: 0, rows: 10 };
      component.loadProducts(event);
      tick();

      component.selectedProducts.set([mockProducts[0]]);

      component.onBulkDelete();
      tick();

      expect(component.selectedProducts()).toEqual([]);
    }));
  });

  describe('onBulkMarkAsSold', () => {
    it('should do nothing if no products selected', fakeAsync(() => {
      component.selectedProducts.set([]);

      component.onBulkMarkAsSold();
      tick();

      expect(mockConfirmDialogService.confirmBulkAction).not.toHaveBeenCalled();
    }));

    it('should warn if no available products selected', fakeAsync(() => {
      const soldPhone = { ...mockProduct, id: 'sold-1', status: ProductStatus.SOLD };
      component.selectedProducts.set([soldPhone]);

      component.onBulkMarkAsSold();
      tick();

      expect(mockToastService.warn).toHaveBeenCalledWith(
        'Warning',
        'No available products selected to mark as sold'
      );
    }));

    it('should only mark available products as sold', fakeAsync(() => {
      mockConfirmDialogService.confirmBulkAction.and.returnValue(Promise.resolve(true));
      mockProductService.updatePhonesStatus.and.returnValue(Promise.resolve());

      const event: TableLazyLoadEvent = { first: 0, rows: 10 };
      component.loadProducts(event);
      tick();

      const availablePhone = { ...mockProduct, id: 'avail-1', status: ProductStatus.AVAILABLE };
      const soldPhone = { ...mockProduct, id: 'sold-1', status: ProductStatus.SOLD };
      component.selectedProducts.set([availablePhone, soldPhone]);

      component.onBulkMarkAsSold();
      tick();

      expect(mockProductService.updatePhonesStatus).toHaveBeenCalledWith(
        ['avail-1'],
        ProductStatus.SOLD
      );
    }));

    it('should show confirmation dialog with correct count', fakeAsync(() => {
      mockConfirmDialogService.confirmBulkAction.and.returnValue(Promise.resolve(true));
      mockProductService.updatePhonesStatus.and.returnValue(Promise.resolve());

      const event: TableLazyLoadEvent = { first: 0, rows: 10 };
      component.loadProducts(event);
      tick();

      const product1 = { ...mockProduct, id: 'avail-1', status: ProductStatus.AVAILABLE };
      const product2 = { ...mockProduct, id: 'avail-2', status: ProductStatus.AVAILABLE };
      component.selectedProducts.set([product1, product2]);

      component.onBulkMarkAsSold();
      tick();

      expect(mockConfirmDialogService.confirmBulkAction).toHaveBeenCalledWith(
        'Mark as Sold',
        'product',
        2
      );
    }));
  });

  describe('onEdit', () => {
    it('should navigate to edit route', () => {
      component.onEdit(mockProduct);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/inventory', 'product-1', 'edit']);
    });
  });

  describe('onMarkAsSold', () => {
    it('should open mark as sold dialog', () => {
      component.onMarkAsSold(mockProduct);

      expect(component.markAsSoldProduct()).toBe(mockProduct);
      expect(component.markAsSoldDialogVisible()).toBe(true);
    });
  });

  describe('onPrintLabel', () => {
    it('should open print label dialog', () => {
      component.onPrintLabel(mockProduct);

      expect(component.printLabelProduct()).toBe(mockProduct);
      expect(component.printLabelDialogVisible()).toBe(true);
    });
  });

  describe('onSaleSaved', () => {
    it('should clear selection and refresh table', fakeAsync(() => {
      const event: TableLazyLoadEvent = { first: 0, rows: 10 };
      component.loadProducts(event);
      tick();

      component.selectedProducts.set([mockProduct]);
      mockProductService.getProducts.calls.reset();

      component.onSaleSaved();
      tick();

      expect(component.selectedProducts()).toEqual([]);
      expect(mockProductService.getProducts).toHaveBeenCalled();
    }));
  });

  describe('onStatusChanged', () => {
    it('should refresh table', fakeAsync(() => {
      const event: TableLazyLoadEvent = { first: 0, rows: 10 };
      component.loadProducts(event);
      tick();

      mockProductService.getProducts.calls.reset();

      component.onStatusChanged();
      tick();

      expect(mockProductService.getProducts).toHaveBeenCalled();
    }));
  });

  describe('onExportCsv', () => {
    it('should export products to CSV', fakeAsync(() => {
      mockProductService.getExportPhones.and.returnValue(Promise.resolve(mockProducts));

      component.onExportCsv();
      tick();

      expect(mockProductService.getExportPhones).toHaveBeenCalledWith(undefined);
      expect(mockCsvExportService.exportToCsv).toHaveBeenCalled();
      expect(mockToastService.success).toHaveBeenCalledWith(
        'Export Complete',
        'Inventory data exported to CSV'
      );
    }));

    it('should pass global filter to export', fakeAsync(() => {
      mockProductService.getExportPhones.and.returnValue(Promise.resolve(mockProducts));
      component.globalFilter = 'Apple';

      component.onExportCsv();
      tick();

      expect(mockProductService.getExportPhones).toHaveBeenCalledWith('Apple');
    }));

    it('should warn if no products to export', fakeAsync(() => {
      mockProductService.getExportPhones.and.returnValue(Promise.resolve([]));

      component.onExportCsv();
      tick();

      expect(mockCsvExportService.exportToCsv).not.toHaveBeenCalled();
      expect(mockToastService.warn).toHaveBeenCalledWith('No Data', 'No products to export');
    }));

    it('should show error toast on export failure', fakeAsync(() => {
      mockProductService.getExportPhones.and.returnValue(Promise.reject(new Error('Export failed')));

      component.onExportCsv();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Error',
        'Failed to export inventory data'
      );
    }));
  });

  describe('helper methods', () => {
    describe('getConditionLabel', () => {
      it('should return correct label for NEW condition', () => {
        expect(component.getConditionLabel(ProductCondition.NEW)).toBe('New');
      });

      it('should return correct label for USED condition', () => {
        expect(component.getConditionLabel(ProductCondition.USED)).toBe('Used');
      });

      it('should return correct label for REFURBISHED condition', () => {
        expect(component.getConditionLabel(ProductCondition.REFURBISHED)).toBe('Refurbished');
      });

      it('should return original value for unknown condition', () => {
        expect(component.getConditionLabel('unknown' as any)).toBe('unknown');
      });
    });

    describe('getMarginSeverity', () => {
      it('should return danger for margin below 10%', () => {
        expect(component.getMarginSeverity(5)).toBe('danger');
        expect(component.getMarginSeverity(0)).toBe('danger');
        expect(component.getMarginSeverity(-5)).toBe('danger');
      });

      it('should return warn for margin between 10% and 25%', () => {
        expect(component.getMarginSeverity(10)).toBe('warn');
        expect(component.getMarginSeverity(15)).toBe('warn');
        expect(component.getMarginSeverity(25)).toBe('warn');
      });

      it('should return success for margin above 25%', () => {
        expect(component.getMarginSeverity(26)).toBe('success');
        expect(component.getMarginSeverity(50)).toBe('success');
        expect(component.getMarginSeverity(100)).toBe('success');
      });
    });

    describe('getMarginTooltip', () => {
      it('should return low margin tooltip for margin below 10%', () => {
        expect(component.getMarginTooltip(5)).toBe('Low margin - consider adjusting price');
        expect(component.getMarginTooltip(0)).toBe('Low margin - consider adjusting price');
        expect(component.getMarginTooltip(-5)).toBe('Low margin - consider adjusting price');
      });

      it('should return moderate margin tooltip for margin between 10% and 25%', () => {
        expect(component.getMarginTooltip(10)).toBe('Moderate margin');
        expect(component.getMarginTooltip(15)).toBe('Moderate margin');
        expect(component.getMarginTooltip(25)).toBe('Moderate margin');
      });

      it('should return good margin tooltip for margin above 25%', () => {
        expect(component.getMarginTooltip(26)).toBe('Good margin');
        expect(component.getMarginTooltip(50)).toBe('Good margin');
        expect(component.getMarginTooltip(100)).toBe('Good margin');
      });
    });
  });

  describe('template rendering', () => {
    beforeEach(fakeAsync(() => {
      const event: TableLazyLoadEvent = { first: 0, rows: 10 };
      component.loadProducts(event);
      tick();
      fixture.detectChanges();
    }));

    it('should render inventory title', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h1')?.textContent).toContain('Inventory');
    });

    it('should render add product button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const addButton = compiled.querySelector('p-button[routerLink="/admin/inventory/new"]');
      expect(addButton).toBeTruthy();
    });

    it('should render export button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const buttons = compiled.querySelectorAll('p-button');
      const exportButton = Array.from(buttons).find(b => b.getAttribute('label') === 'Export to CSV');
      expect(exportButton).toBeTruthy();
    });

    it('should render search input', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const searchInput = compiled.querySelector('input[pInputText]');
      expect(searchInput).toBeTruthy();
    });

    it('should render data table', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('p-table')).toBeTruthy();
    });

    it('should show bulk action buttons when products are selected', fakeAsync(() => {
      component.selectedProducts.set([mockProduct]);
      fixture.detectChanges();
      tick();

      const compiled = fixture.nativeElement as HTMLElement;
      const markAsSoldBtn = Array.from(compiled.querySelectorAll('p-button'))
        .find(b => b.getAttribute('label') === 'Mark as Sold');
      const deleteBtn = Array.from(compiled.querySelectorAll('p-button'))
        .find(b => b.getAttribute('label') === 'Delete Selected');

      expect(markAsSoldBtn).toBeTruthy();
      expect(deleteBtn).toBeTruthy();
    }));
  });
});
