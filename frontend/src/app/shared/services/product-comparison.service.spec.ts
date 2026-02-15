import { TestBed } from '@angular/core/testing';
import { ProductComparisonService } from './product-comparison.service';
import { Product } from '../../models/product.model';
import { ProductStatus, ProductCondition } from '../../enums';

describe('ProductComparisonService', () => {
  let service: ProductComparisonService;

  const mockProducts: Product[] = [
    {
      id: 'product-1',
      brandId: 'brand-1',
      brandName: 'Apple',
      brandLogoUrl: 'https://example.com/apple.png',
      model: 'iPhone 14 Pro',
      description: 'Latest iPhone',
      storageGb: 256,
      ramGb: 6,
      color: 'Space Black',
      condition: ProductCondition.NEW,
      batteryHealth: null,
      imei: '123456789012345',
      costPrice: 800,
      sellingPrice: 999,
      profitMargin: 19.92,
      status: ProductStatus.AVAILABLE,
      purchaseDate: '2024-01-15',
      supplierId: null,
      supplierName: null,
      notes: null,
      primaryImageUrl: 'https://example.com/iphone.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: null,
      taxRate: 10,
      isTaxInclusive: false,
      isTaxExempt: false
    },
    {
      id: 'product-2',
      brandId: 'brand-2',
      brandName: 'Samsung',
      brandLogoUrl: 'https://example.com/samsung.png',
      model: 'Galaxy S24',
      description: 'Latest Samsung flagship',
      storageGb: 128,
      ramGb: 8,
      color: 'Phantom Black',
      condition: ProductCondition.USED,
      batteryHealth: 92,
      imei: '987654321098765',
      costPrice: 600,
      sellingPrice: 799,
      profitMargin: 24.91,
      status: ProductStatus.AVAILABLE,
      purchaseDate: '2024-02-01',
      supplierId: null,
      supplierName: null,
      notes: null,
      primaryImageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      taxRate: 10,
      isTaxInclusive: false,
      isTaxExempt: false
    },
    {
      id: 'product-3',
      brandId: 'brand-1',
      brandName: 'Apple',
      brandLogoUrl: 'https://example.com/apple.png',
      model: 'iPhone 13',
      description: 'Previous generation iPhone',
      storageGb: 128,
      ramGb: 4,
      color: 'Blue',
      condition: ProductCondition.REFURBISHED,
      batteryHealth: 85,
      imei: '111222333444555',
      costPrice: 500,
      sellingPrice: 699,
      profitMargin: 28.47,
      status: ProductStatus.AVAILABLE,
      purchaseDate: '2024-01-20',
      supplierId: null,
      supplierName: null,
      notes: null,
      primaryImageUrl: 'https://example.com/iphone13.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: null,
      taxRate: 10,
      isTaxInclusive: false,
      isTaxExempt: false
    },
    {
      id: 'product-4',
      brandId: 'brand-3',
      brandName: 'Google',
      brandLogoUrl: 'https://example.com/google.png',
      model: 'Pixel 8',
      description: 'Google flagship',
      storageGb: 128,
      ramGb: 8,
      color: 'Obsidian',
      condition: ProductCondition.NEW,
      batteryHealth: null,
      imei: '444555666777888',
      costPrice: 550,
      sellingPrice: 699,
      profitMargin: 21.32,
      status: ProductStatus.AVAILABLE,
      purchaseDate: '2024-03-01',
      supplierId: null,
      supplierName: null,
      notes: null,
      primaryImageUrl: 'https://example.com/pixel.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: null,
      taxRate: 10,
      isTaxInclusive: false,
      isTaxExempt: false
    }
  ];

  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();

    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductComparisonService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should start with empty products list', () => {
      expect(service.products().length).toBe(0);
    });

    it('should start with count of 0', () => {
      expect(service.count()).toBe(0);
    });

    it('should not be full initially', () => {
      expect(service.isFull()).toBe(false);
    });

    it('should not have products initially', () => {
      expect(service.hasProducts()).toBe(false);
    });

    it('should not be able to compare initially', () => {
      expect(service.canCompare()).toBe(false);
    });
  });

  describe('AC1: Compare checkbox/button on product card', () => {
    it('should add product when toggling unselected product', () => {
      const result = service.toggle(mockProducts[0]);

      expect(result).toBe('added');
      expect(service.products().length).toBe(1);
      expect(service.products()[0].id).toBe('product-1');
    });

    it('should remove product when toggling selected product', () => {
      service.toggle(mockProducts[0]);
      const result = service.toggle(mockProducts[0]);

      expect(result).toBe('removed');
      expect(service.products().length).toBe(0);
    });

    it('should correctly check if product is selected', () => {
      service.toggle(mockProducts[0]);

      expect(service.isSelected('product-1')).toBe(true);
      expect(service.isSelected('product-2')).toBe(false);
    });
  });

  describe('AC2: Floating comparison bar with up to 3 products', () => {
    it('should allow up to 3 products', () => {
      service.toggle(mockProducts[0]);
      service.toggle(mockProducts[1]);
      service.toggle(mockProducts[2]);

      expect(service.products().length).toBe(3);
      expect(service.isFull()).toBe(true);
    });

    it('should report hasProducts when at least one product selected', () => {
      expect(service.hasProducts()).toBe(false);

      service.toggle(mockProducts[0]);
      expect(service.hasProducts()).toBe(true);
    });

    it('should update count correctly', () => {
      expect(service.count()).toBe(0);

      service.toggle(mockProducts[0]);
      expect(service.count()).toBe(1);

      service.toggle(mockProducts[1]);
      expect(service.count()).toBe(2);

      service.toggle(mockProducts[2]);
      expect(service.count()).toBe(3);
    });
  });

  describe('AC3: Compare button navigates to comparison page', () => {
    it('should allow compare when 2 products selected', () => {
      service.toggle(mockProducts[0]);
      expect(service.canCompare()).toBe(false);

      service.toggle(mockProducts[1]);
      expect(service.canCompare()).toBe(true);
    });

    it('should allow compare when 3 products selected', () => {
      service.toggle(mockProducts[0]);
      service.toggle(mockProducts[1]);
      service.toggle(mockProducts[2]);

      expect(service.canCompare()).toBe(true);
    });

    it('should return product IDs for URL navigation', () => {
      service.toggle(mockProducts[0]);
      service.toggle(mockProducts[1]);

      const ids = service.getProductIds();
      expect(ids).toEqual(['product-1', 'product-2']);
    });
  });

  describe('AC5: Maximum 3 products limit with user notification', () => {
    it('should return "full" when trying to add 4th product', () => {
      service.toggle(mockProducts[0]);
      service.toggle(mockProducts[1]);
      service.toggle(mockProducts[2]);

      const result = service.toggle(mockProducts[3]);
      expect(result).toBe('full');
    });

    it('should not add 4th product when full', () => {
      service.toggle(mockProducts[0]);
      service.toggle(mockProducts[1]);
      service.toggle(mockProducts[2]);
      service.toggle(mockProducts[3]);

      expect(service.products().length).toBe(3);
      expect(service.products().some(p => p.id === 'product-4')).toBe(false);
    });

    it('should allow adding again after removal', () => {
      service.toggle(mockProducts[0]);
      service.toggle(mockProducts[1]);
      service.toggle(mockProducts[2]);

      // Remove one
      service.remove('product-1');
      expect(service.isFull()).toBe(false);

      // Add new one
      const result = service.toggle(mockProducts[3]);
      expect(result).toBe('added');
      expect(service.products().length).toBe(3);
    });
  });

  describe('Remove Product', () => {
    it('should remove specific product by ID', () => {
      service.toggle(mockProducts[0]);
      service.toggle(mockProducts[1]);
      service.toggle(mockProducts[2]);

      service.remove('product-2');

      expect(service.products().length).toBe(2);
      expect(service.isSelected('product-2')).toBe(false);
      expect(service.isSelected('product-1')).toBe(true);
      expect(service.isSelected('product-3')).toBe(true);
    });

    it('should do nothing when removing non-existent product', () => {
      service.toggle(mockProducts[0]);
      service.remove('non-existent-id');

      expect(service.products().length).toBe(1);
    });
  });

  describe('Clear All', () => {
    it('should remove all products', () => {
      service.toggle(mockProducts[0]);
      service.toggle(mockProducts[1]);
      service.toggle(mockProducts[2]);

      service.clear();

      expect(service.products().length).toBe(0);
      expect(service.count()).toBe(0);
      expect(service.hasProducts()).toBe(false);
      expect(service.isFull()).toBe(false);
      expect(service.canCompare()).toBe(false);
    });
  });

  describe('Signal Reactivity', () => {
    it('should update computed signals when products change', () => {
      expect(service.count()).toBe(0);
      expect(service.hasProducts()).toBe(false);
      expect(service.isFull()).toBe(false);
      expect(service.canCompare()).toBe(false);

      service.toggle(mockProducts[0]);
      expect(service.count()).toBe(1);
      expect(service.hasProducts()).toBe(true);
      expect(service.isFull()).toBe(false);
      expect(service.canCompare()).toBe(false);

      service.toggle(mockProducts[1]);
      expect(service.count()).toBe(2);
      expect(service.hasProducts()).toBe(true);
      expect(service.isFull()).toBe(false);
      expect(service.canCompare()).toBe(true);

      service.toggle(mockProducts[2]);
      expect(service.count()).toBe(3);
      expect(service.hasProducts()).toBe(true);
      expect(service.isFull()).toBe(true);
      expect(service.canCompare()).toBe(true);

      service.clear();
      expect(service.count()).toBe(0);
      expect(service.hasProducts()).toBe(false);
      expect(service.isFull()).toBe(false);
      expect(service.canCompare()).toBe(false);
    });
  });

  describe('Readonly products signal', () => {
    it('should return readonly version of products', () => {
      service.toggle(mockProducts[0]);
      const products = service.products;

      // Verify it returns the signal function, not a writable signal
      expect(typeof products).toBe('function');
      expect(products().length).toBe(1);
    });
  });

  describe('Session Storage Persistence', () => {
    it('should save products to sessionStorage when adding', () => {
      service.toggle(mockProducts[0]);

      const stored = sessionStorage.getItem('product_comparison_selection');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.length).toBe(1);
      expect(parsed[0].id).toBe('product-1');
    });

    it('should update sessionStorage when removing', () => {
      service.toggle(mockProducts[0]);
      service.toggle(mockProducts[1]);
      service.remove('product-1');

      const stored = sessionStorage.getItem('product_comparison_selection');
      const parsed = JSON.parse(stored!);
      expect(parsed.length).toBe(1);
      expect(parsed[0].id).toBe('product-2');
    });

    it('should clear sessionStorage when clearing all', () => {
      service.toggle(mockProducts[0]);
      service.clear();

      const stored = sessionStorage.getItem('product_comparison_selection');
      expect(stored).toBeNull();
    });

    it('should load products from sessionStorage on init', () => {
      // Set up sessionStorage before creating a new TestBed service instance
      sessionStorage.setItem('product_comparison_selection', JSON.stringify([mockProducts[0], mockProducts[1]]));

      // Need to reset TestBed and get a fresh service to test loading
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const newService = TestBed.inject(ProductComparisonService);

      expect(newService.products().length).toBe(2);
      expect(newService.products()[0].id).toBe('product-1');
      expect(newService.products()[1].id).toBe('product-2');
    });

    it('should handle corrupted sessionStorage gracefully', () => {
      sessionStorage.setItem('product_comparison_selection', 'invalid-json');

      // Need to reset TestBed and get a fresh service
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const newService = TestBed.inject(ProductComparisonService);

      // Should not throw and start with empty list
      expect(newService.products().length).toBe(0);
    });

    it('should ignore empty array in sessionStorage', () => {
      sessionStorage.setItem('product_comparison_selection', '[]');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const newService = TestBed.inject(ProductComparisonService);

      expect(newService.products().length).toBe(0);
    });

    it('should ignore array with more than 3 products in sessionStorage', () => {
      sessionStorage.setItem('product_comparison_selection', JSON.stringify([
        mockProducts[0], mockProducts[1], mockProducts[2], mockProducts[3]
      ]));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const newService = TestBed.inject(ProductComparisonService);

      expect(newService.products().length).toBe(0);
    });
  });
});
