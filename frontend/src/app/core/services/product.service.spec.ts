import { TestBed } from '@angular/core/testing';
import { ProductService, LazyLoadParams } from './product.service';
import { SupabaseService } from './supabase.service';
import { ProductStatus } from '../../enums/product-status.enum';
import { ProductCondition } from '../../enums/product-condition.enum';

describe('ProductService', () => {
  let service: ProductService;
  let mockSupabaseService: any;
  let mockQueryBuilder: any;

  const mockProductData = {
    id: 'product-1',
    brand_id: 'brand-1',
    model: 'iPhone 15 Pro',
    description: 'Test description',
    storage_gb: 256,
    ram_gb: 8,
    color: 'Space Black',
    condition: 'new',
    battery_health: null,
    imei: '123456789012345',
    cost_price: 900,
    selling_price: 1200,
    status: 'available',
    purchase_date: '2024-01-15',
    supplier_id: 'supplier-1',
    notes: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: null,
    brand: { id: 'brand-1', name: 'Apple', logo_url: 'https://example.com/apple.png' },
    supplier: { id: 'supplier-1', name: 'Test Supplier' },
    images: [{ id: 'img-1', image_url: 'https://example.com/phone.jpg', is_primary: true, display_order: 0 }]
  };

  beforeEach(() => {
    // Create a chain-able mock query builder
    mockQueryBuilder = {
      select: jasmine.createSpy('select').and.callFake(() => mockQueryBuilder),
      eq: jasmine.createSpy('eq').and.callFake(() => mockQueryBuilder),
      in: jasmine.createSpy('in').and.callFake(() => mockQueryBuilder),
      gte: jasmine.createSpy('gte').and.callFake(() => mockQueryBuilder),
      lte: jasmine.createSpy('lte').and.callFake(() => mockQueryBuilder),
      ilike: jasmine.createSpy('ilike').and.callFake(() => mockQueryBuilder),
      or: jasmine.createSpy('or').and.callFake(() => mockQueryBuilder),
      not: jasmine.createSpy('not').and.callFake(() => mockQueryBuilder),
      order: jasmine.createSpy('order').and.callFake(() => mockQueryBuilder),
      range: jasmine.createSpy('range').and.callFake(() => mockQueryBuilder),
      single: jasmine.createSpy('single').and.callFake(() => mockQueryBuilder),
      insert: jasmine.createSpy('insert').and.callFake(() => mockQueryBuilder),
      update: jasmine.createSpy('update').and.callFake(() => mockQueryBuilder),
      delete: jasmine.createSpy('delete').and.callFake(() => mockQueryBuilder),
      then: jasmine.createSpy('then')
    };

    mockSupabaseService = {
      from: jasmine.createSpy('from').and.returnValue(mockQueryBuilder)
    };

    TestBed.configureTestingModule({
      providers: [
        ProductService,
        { provide: SupabaseService, useValue: mockSupabaseService }
      ]
    });

    service = TestBed.inject(ProductService);
  });

  describe('getProducts', () => {
    it('should fetch products with pagination', async () => {
      mockQueryBuilder.range.and.returnValue(
        Promise.resolve({
          data: [mockProductData],
          error: null,
          count: 1
        })
      );

      const params: LazyLoadParams = { first: 0, rows: 10 };
      const result = await service.getProducts(params);

      expect(mockSupabaseService.from).toHaveBeenCalledWith('phones');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 9);
      expect(result.data.length).toBe(1);
      expect(result.total).toBe(1);
    });

    it('should apply sorting when sortField is provided', async () => {
      mockQueryBuilder.range.and.returnValue(
        Promise.resolve({
          data: [mockProductData],
          error: null,
          count: 1
        })
      );

      const params: LazyLoadParams = { first: 0, rows: 10, sortField: 'model', sortOrder: 1 };
      await service.getProducts(params);

      expect(mockQueryBuilder.order).toHaveBeenCalledWith('model', { ascending: true });
    });

    it('should apply descending sort when sortOrder is -1', async () => {
      mockQueryBuilder.range.and.returnValue(
        Promise.resolve({
          data: [mockProductData],
          error: null,
          count: 1
        })
      );

      const params: LazyLoadParams = { first: 0, rows: 10, sortField: 'sellingPrice', sortOrder: -1 };
      await service.getProducts(params);

      expect(mockQueryBuilder.order).toHaveBeenCalledWith('selling_price', { ascending: false });
    });

    it('should search brands and apply or filter when globalFilter is provided', async () => {
      // Mock brands query
      const brandsQueryBuilder = {
        select: jasmine.createSpy('select').and.returnValue({
          ilike: jasmine.createSpy('ilike').and.returnValue(
            Promise.resolve({
              data: [{ id: 'brand-1' }],
              error: null
            })
          )
        })
      };

      mockSupabaseService.from.and.callFake((table: string) => {
        if (table === 'brands') return brandsQueryBuilder;
        return mockQueryBuilder;
      });

      mockQueryBuilder.range.and.returnValue(
        Promise.resolve({
          data: [mockProductData],
          error: null,
          count: 1
        })
      );

      const params: LazyLoadParams = { first: 0, rows: 10, globalFilter: 'Apple' };
      await service.getProducts(params);

      expect(mockSupabaseService.from).toHaveBeenCalledWith('brands');
      expect(mockQueryBuilder.or).toHaveBeenCalled();
    });

    it('should apply status filter when provided', async () => {
      mockQueryBuilder.range.and.returnValue(
        Promise.resolve({
          data: [mockProductData],
          error: null,
          count: 1
        })
      );

      const params: LazyLoadParams = { first: 0, rows: 10 };
      await service.getProducts(params, { status: ProductStatus.AVAILABLE });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', ProductStatus.AVAILABLE);
    });

    it('should apply brand filter when provided', async () => {
      mockQueryBuilder.range.and.returnValue(
        Promise.resolve({
          data: [mockProductData],
          error: null,
          count: 1
        })
      );

      const params: LazyLoadParams = { first: 0, rows: 10 };
      await service.getProducts(params, { brandId: 'brand-1' });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('brand_id', 'brand-1');
    });

    it('should apply condition filter when provided', async () => {
      mockQueryBuilder.range.and.returnValue(
        Promise.resolve({
          data: [mockProductData],
          error: null,
          count: 1
        })
      );

      const params: LazyLoadParams = { first: 0, rows: 10 };
      await service.getProducts(params, { conditions: [ProductCondition.NEW, ProductCondition.REFURBISHED] });

      expect(mockQueryBuilder.in).toHaveBeenCalledWith('condition', [ProductCondition.NEW, ProductCondition.REFURBISHED]);
    });

    it('should apply price range filters when provided', async () => {
      mockQueryBuilder.range.and.returnValue(
        Promise.resolve({
          data: [mockProductData],
          error: null,
          count: 1
        })
      );

      const params: LazyLoadParams = { first: 0, rows: 10 };
      await service.getProducts(params, { minPrice: 100, maxPrice: 1000 });

      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('selling_price', 100);
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('selling_price', 1000);
    });

    it('should throw error on query failure', async () => {
      mockQueryBuilder.range.and.returnValue(
        Promise.resolve({
          data: null,
          error: { message: 'Query failed' },
          count: 0
        })
      );

      const params: LazyLoadParams = { first: 0, rows: 10 };
      await expectAsync(service.getProducts(params)).toBeRejectedWithError('Query failed');
    });

    it('should sort by profitMargin client-side', async () => {
      const product1 = { ...mockProductData, id: 'p1', cost_price: 900, selling_price: 1000 }; // 10% margin
      const product2 = { ...mockProductData, id: 'p2', cost_price: 500, selling_price: 1000 }; // 50% margin

      // For profitMargin sort, we fetch all data without range, then sort/slice client-side
      // The query is directly awaited without calling order() for profitMargin sort
      // Mock the select to return a thenable that resolves with data
      const thenable = {
        then: (resolve: Function) => resolve({
          data: [product1, product2],
          error: null,
          count: 2
        })
      };

      // Override select to return our thenable chain
      mockQueryBuilder.select.and.returnValue(thenable);

      const params: LazyLoadParams = { first: 0, rows: 10, sortField: 'profitMargin', sortOrder: -1 };
      const result = await service.getProducts(params);

      // Higher margin first (descending)
      expect(result.data[0].profitMargin).toBeGreaterThan(result.data[1].profitMargin);
    });

    it('should map product data correctly', async () => {
      mockQueryBuilder.range.and.returnValue(
        Promise.resolve({
          data: [mockProductData],
          error: null,
          count: 1
        })
      );

      const params: LazyLoadParams = { first: 0, rows: 10 };
      const result = await service.getProducts(params);

      const product = result.data[0];
      expect(product.id).toBe('product-1');
      expect(product.brandId).toBe('brand-1');
      expect(product.brandName).toBe('Apple');
      expect(product.brandLogoUrl).toBe('https://example.com/apple.png');
      expect(product.model).toBe('iPhone 15 Pro');
      expect(product.storageGb).toBe(256);
      expect(product.costPrice).toBe(900);
      expect(product.sellingPrice).toBe(1200);
      expect(product.profitMargin).toBe(25); // (1200-900)/1200 * 100 = 25%
      expect(product.status).toBe('available');
      expect(product.primaryImageUrl).toBe('https://example.com/phone.jpg');
    });
  });

  describe('getProductById', () => {
    it('should fetch a single product by id', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({
          data: mockProductData,
          error: null
        })
      );

      const result = await service.getProductById('product-1');

      expect(mockSupabaseService.from).toHaveBeenCalledWith('phones');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'product-1');
      expect(result?.id).toBe('product-1');
    });

    it('should return null when product not found', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' }
        })
      );

      const result = await service.getProductById('nonexistent');
      expect(result).toBeNull();
    });

    it('should throw error on other failures', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({
          data: null,
          error: { code: 'OTHER', message: 'Database error' }
        })
      );

      await expectAsync(service.getProductById('product-1')).toBeRejectedWithError('Database error');
    });
  });

  describe('getAvailableProductDetail - F-018 Product Detail Page', () => {
    const mockProductDetailData = {
      ...mockProductData,
      images: [
        { id: 'img-1', image_url: 'https://example.com/phone1.jpg', is_primary: true, display_order: 0 },
        { id: 'img-2', image_url: 'https://example.com/phone2.jpg', is_primary: false, display_order: 1 },
        { id: 'img-3', image_url: 'https://example.com/phone3.jpg', is_primary: false, display_order: 2 }
      ]
    };

    it('should fetch available product by id', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({
          data: mockProductDetailData,
          error: null
        })
      );

      const result = await service.getAvailableProductDetail('product-1');

      expect(mockSupabaseService.from).toHaveBeenCalledWith('phones');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'product-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', ProductStatus.AVAILABLE);
      expect(result?.id).toBe('product-1');
    });

    it('should only return products with status AVAILABLE', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({
          data: mockProductDetailData,
          error: null
        })
      );

      await service.getAvailableProductDetail('product-1');

      const eqCalls = mockQueryBuilder.eq.calls.all();
      const statusCall = eqCalls.find((call: jasmine.CallInfo<typeof mockQueryBuilder.eq>) =>
        call.args[0] === 'status'
      );
      expect(statusCall?.args[1]).toBe(ProductStatus.AVAILABLE);
    });

    it('should return null when product not found (PGRST116)', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' }
        })
      );

      const result = await service.getAvailableProductDetail('nonexistent');
      expect(result).toBeNull();
    });

    it('should return null when product exists but is not available', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({
          data: null,
          error: { code: 'PGRST116', message: 'Row not found' }
        })
      );

      const result = await service.getAvailableProductDetail('sold-product');
      expect(result).toBeNull();
    });

    it('should throw error on database failure', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({
          data: null,
          error: { code: 'OTHER', message: 'Database connection failed' }
        })
      );

      await expectAsync(service.getAvailableProductDetail('product-1'))
        .toBeRejectedWithError('Database connection failed');
    });

    it('should include images in the response', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({
          data: mockProductDetailData,
          error: null
        })
      );

      const result = await service.getAvailableProductDetail('product-1');

      expect(result?.images).toBeDefined();
      expect(result?.images.length).toBe(3);
    });

    it('should sort images with primary first, then by displayOrder', async () => {
      const unsortedImages = [
        { id: 'img-3', image_url: 'https://example.com/phone3.jpg', is_primary: false, display_order: 2 },
        { id: 'img-1', image_url: 'https://example.com/phone1.jpg', is_primary: true, display_order: 0 },
        { id: 'img-2', image_url: 'https://example.com/phone2.jpg', is_primary: false, display_order: 1 }
      ];

      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({
          data: { ...mockProductData, images: unsortedImages },
          error: null
        })
      );

      const result = await service.getAvailableProductDetail('product-1');

      expect(result?.images[0].isPrimary).toBeTrue();
      expect(result?.images[0].id).toBe('img-1');
      expect(result?.images[1].id).toBe('img-2');
      expect(result?.images[2].id).toBe('img-3');
    });

    it('should map image properties correctly', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({
          data: mockProductDetailData,
          error: null
        })
      );

      const result = await service.getAvailableProductDetail('product-1');

      const primaryImage = result?.images.find(img => img.isPrimary);
      expect(primaryImage).toBeDefined();
      expect(primaryImage?.imageUrl).toBe('https://example.com/phone1.jpg');
      expect(primaryImage?.displayOrder).toBe(0);
    });

    it('should handle empty images array', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({
          data: { ...mockProductData, images: [] },
          error: null
        })
      );

      const result = await service.getAvailableProductDetail('product-1');

      expect(result?.images).toEqual([]);
    });

    it('should include brand information', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({
          data: mockProductDetailData,
          error: null
        })
      );

      const result = await service.getAvailableProductDetail('product-1');

      expect(result?.brandId).toBe('brand-1');
      expect(result?.brandName).toBe('Apple');
      expect(result?.brandLogoUrl).toBe('https://example.com/apple.png');
    });

    it('should include all product specifications', async () => {
      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({
          data: mockProductDetailData,
          error: null
        })
      );

      const result = await service.getAvailableProductDetail('product-1');

      expect(result?.model).toBe('iPhone 15 Pro');
      expect(result?.storageGb).toBe(256);
      expect(result?.ramGb).toBe(8);
      expect(result?.color).toBe('Space Black');
      expect(result?.condition).toBe(ProductCondition.NEW);
      expect(result?.sellingPrice).toBe(1200);
    });
  });

  describe('updateProductStatus', () => {
    it('should update product status', async () => {
      // First call is for update, second call chain is for getProductById
      let callCount = 0;
      mockQueryBuilder.eq.and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          // First eq call is from update
          return Promise.resolve({ error: null });
        }
        // Subsequent eq calls are from getProductById
        return mockQueryBuilder;
      });

      mockQueryBuilder.single.and.returnValue(
        Promise.resolve({
          data: { ...mockProductData, status: 'sold' },
          error: null
        })
      );

      const result = await service.updateProductStatus('product-1', ProductStatus.SOLD);

      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ status: ProductStatus.SOLD });
      expect(result.status).toBe('sold');
    });
  });

  describe('updateProductsStatus', () => {
    it('should update multiple products status', async () => {
      mockQueryBuilder.in.and.returnValue(
        Promise.resolve({ error: null })
      );

      await service.updateProductsStatus(['product-1', 'product-2'], ProductStatus.SOLD);

      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ status: ProductStatus.SOLD });
      expect(mockQueryBuilder.in).toHaveBeenCalledWith('id', ['product-1', 'product-2']);
    });

    it('should throw error on failure', async () => {
      mockQueryBuilder.in.and.returnValue(
        Promise.resolve({ error: { message: 'Update failed' } })
      );

      await expectAsync(
        service.updateProductsStatus(['product-1'], ProductStatus.SOLD)
      ).toBeRejectedWithError('Update failed');
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      mockQueryBuilder.eq.and.returnValue(
        Promise.resolve({ error: null })
      );

      await service.deleteProduct('product-1');

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'product-1');
    });

    it('should throw error on failure', async () => {
      mockQueryBuilder.eq.and.returnValue(
        Promise.resolve({ error: { message: 'Delete failed' } })
      );

      await expectAsync(service.deleteProduct('product-1')).toBeRejectedWithError('Delete failed');
    });
  });

  describe('deleteProducts', () => {
    it('should delete multiple products', async () => {
      mockQueryBuilder.in.and.returnValue(
        Promise.resolve({ error: null })
      );

      await service.deleteProducts(['product-1', 'product-2']);

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.in).toHaveBeenCalledWith('id', ['product-1', 'product-2']);
    });
  });

  describe('getExportProducts', () => {
    it('should fetch all products for export', async () => {
      mockQueryBuilder.order.and.returnValue(
        Promise.resolve({
          data: [mockProductData],
          error: null
        })
      );

      const result = await service.getExportProducts();

      expect(mockSupabaseService.from).toHaveBeenCalledWith('phones');
      expect(result.length).toBe(1);
    });

    it('should filter by global filter for export', async () => {
      const product1 = { ...mockProductData, id: 'p1', model: 'iPhone 15' };
      const product2 = { ...mockProductData, id: 'p2', model: 'Galaxy S24' };

      mockQueryBuilder.order.and.returnValue(
        Promise.resolve({
          data: [product1, product2],
          error: null
        })
      );

      const result = await service.getExportProducts('iPhone');

      expect(result.length).toBe(1);
      expect(result[0].model).toBe('iPhone 15');
    });
  });

  describe('getDistinctStorageOptions', () => {
    it('should fetch distinct storage options', async () => {
      mockQueryBuilder.not.and.returnValue(
        Promise.resolve({
          data: [{ storage_gb: 128 }, { storage_gb: 256 }, { storage_gb: 128 }],
          error: null
        })
      );

      const result = await service.getDistinctStorageOptions();

      expect(result).toEqual([128, 256]);
    });
  });

  describe('getPriceRange', () => {
    it('should return min and max prices', async () => {
      mockQueryBuilder.eq.and.returnValue(
        Promise.resolve({
          data: [{ selling_price: 500 }, { selling_price: 1200 }, { selling_price: 800 }],
          error: null
        })
      );

      const result = await service.getPriceRange();

      expect(result.min).toBe(500);
      expect(result.max).toBe(1200);
    });

    it('should return default range when no products exist', async () => {
      mockQueryBuilder.eq.and.returnValue(
        Promise.resolve({
          data: [],
          error: null
        })
      );

      const result = await service.getPriceRange();

      expect(result.min).toBe(0);
      expect(result.max).toBe(1000);
    });
  });

  describe('getCatalogProducts - F-014 Search', () => {
    let brandsQueryBuilder: any;

    beforeEach(() => {
      // Setup brands query builder for search tests
      brandsQueryBuilder = {
        select: jasmine.createSpy('select').and.returnValue({
          ilike: jasmine.createSpy('ilike').and.returnValue(
            Promise.resolve({
              data: [],
              error: null
            })
          )
        })
      };
    });

    it('should search by model name using ilike for case-insensitivity', async () => {
      mockSupabaseService.from.and.callFake((table: string) => {
        if (table === 'brands') return brandsQueryBuilder;
        return mockQueryBuilder;
      });

      mockQueryBuilder.range.and.returnValue(
        Promise.resolve({
          data: [mockProductData],
          error: null,
          count: 1
        })
      );

      await service.getCatalogProducts(
        { first: 0, rows: 10 },
        { search: 'iPhone' }
      );

      // When no brand matches, only model search via ilike
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('model', '%iphone%');
    });

    it('should search both brand and model when brand matches search term', async () => {
      // Mock brands query to return a matching brand
      const matchingBrandsQueryBuilder = {
        select: jasmine.createSpy('select').and.returnValue({
          ilike: jasmine.createSpy('ilike').and.returnValue(
            Promise.resolve({
              data: [{ id: 'brand-1' }],
              error: null
            })
          )
        })
      };

      mockSupabaseService.from.and.callFake((table: string) => {
        if (table === 'brands') return matchingBrandsQueryBuilder;
        return mockQueryBuilder;
      });

      mockQueryBuilder.range.and.returnValue(
        Promise.resolve({
          data: [mockProductData],
          error: null,
          count: 1
        })
      );

      await service.getCatalogProducts(
        { first: 0, rows: 10 },
        { search: 'Apple' }
      );

      // Should use OR filter to match both model and brand
      expect(mockQueryBuilder.or).toHaveBeenCalled();
      const orCall = mockQueryBuilder.or.calls.mostRecent().args[0];
      expect(orCall).toContain('model.ilike.%apple%');
      expect(orCall).toContain('brand_id.in.');
    });

    it('should handle lowercase search term for case-insensitivity', async () => {
      mockSupabaseService.from.and.callFake((table: string) => {
        if (table === 'brands') return brandsQueryBuilder;
        return mockQueryBuilder;
      });

      mockQueryBuilder.range.and.returnValue(
        Promise.resolve({
          data: [mockProductData],
          error: null,
          count: 1
        })
      );

      await service.getCatalogProducts(
        { first: 0, rows: 10 },
        { search: 'SAMSUNG' } // Uppercase input
      );

      // Search term should be lowercased
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('model', '%samsung%');
    });

    it('should return all products when search is empty or undefined', async () => {
      mockQueryBuilder.range.and.returnValue(
        Promise.resolve({
          data: [mockProductData],
          error: null,
          count: 1
        })
      );

      await service.getCatalogProducts(
        { first: 0, rows: 10 },
        { search: '' }
      );

      // Should not apply ilike or or filter
      expect(mockQueryBuilder.ilike).not.toHaveBeenCalled();
      expect(mockQueryBuilder.or).not.toHaveBeenCalled();
    });

    it('should trim whitespace from search term', async () => {
      mockSupabaseService.from.and.callFake((table: string) => {
        if (table === 'brands') return brandsQueryBuilder;
        return mockQueryBuilder;
      });

      mockQueryBuilder.range.and.returnValue(
        Promise.resolve({
          data: [mockProductData],
          error: null,
          count: 1
        })
      );

      await service.getCatalogProducts(
        { first: 0, rows: 10 },
        { search: '  iPhone  ' } // With whitespace
      );

      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('model', '%iphone%');
    });

    it('should return empty array when no products match search', async () => {
      mockSupabaseService.from.and.callFake((table: string) => {
        if (table === 'brands') return brandsQueryBuilder;
        return mockQueryBuilder;
      });

      mockQueryBuilder.range.and.returnValue(
        Promise.resolve({
          data: [],
          error: null,
          count: 0
        })
      );

      const result = await service.getCatalogProducts(
        { first: 0, rows: 10 },
        { search: 'nonexistent' }
      );

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should combine search with other filters', async () => {
      mockSupabaseService.from.and.callFake((table: string) => {
        if (table === 'brands') return brandsQueryBuilder;
        return mockQueryBuilder;
      });

      mockQueryBuilder.range.and.returnValue(
        Promise.resolve({
          data: [mockProductData],
          error: null,
          count: 1
        })
      );

      await service.getCatalogProducts(
        { first: 0, rows: 10 },
        {
          search: 'iPhone',
          status: ProductStatus.AVAILABLE,
          conditions: [ProductCondition.NEW],
          minPrice: 500,
          maxPrice: 1500
        }
      );

      // Verify all filters are applied
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', ProductStatus.AVAILABLE);
      expect(mockQueryBuilder.in).toHaveBeenCalledWith('condition', [ProductCondition.NEW]);
      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('selling_price', 500);
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('selling_price', 1500);
      expect(mockQueryBuilder.ilike).toHaveBeenCalled();
    });
  });

  describe('getCatalogProducts - F-017 Server-Side Pagination', () => {
    describe('Supabase Range Queries', () => {
      it('should use range(0, 11) for first page with pageSize 12', async () => {
        mockQueryBuilder.range.and.returnValue(
          Promise.resolve({
            data: [mockProductData],
            error: null,
            count: 50
          })
        );

        await service.getCatalogProducts({ first: 0, rows: 12 });

        expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 11);
      });

      it('should use range(12, 23) for second page with pageSize 12', async () => {
        mockQueryBuilder.range.and.returnValue(
          Promise.resolve({
            data: [mockProductData],
            error: null,
            count: 50
          })
        );

        await service.getCatalogProducts({ first: 12, rows: 12 });

        expect(mockQueryBuilder.range).toHaveBeenCalledWith(12, 23);
      });

      it('should use range(24, 47) for second page with pageSize 24', async () => {
        mockQueryBuilder.range.and.returnValue(
          Promise.resolve({
            data: [mockProductData],
            error: null,
            count: 100
          })
        );

        await service.getCatalogProducts({ first: 24, rows: 24 });

        expect(mockQueryBuilder.range).toHaveBeenCalledWith(24, 47);
      });

      it('should use range(0, 47) for first page with pageSize 48', async () => {
        mockQueryBuilder.range.and.returnValue(
          Promise.resolve({
            data: [mockProductData],
            error: null,
            count: 100
          })
        );

        await service.getCatalogProducts({ first: 0, rows: 48 });

        expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 47);
      });
    });

    describe('Exact Count from Supabase', () => {
      it('should request exact count using count: exact option', async () => {
        mockQueryBuilder.range.and.returnValue(
          Promise.resolve({
            data: [mockProductData],
            error: null,
            count: 150
          })
        );

        const result = await service.getCatalogProducts({ first: 0, rows: 12 });

        expect(mockQueryBuilder.select).toHaveBeenCalled();
        // Verify count: exact is used (first argument to select contains options object)
        const selectCall = mockQueryBuilder.select.calls.mostRecent().args;
        expect(selectCall[1]).toEqual({ count: 'exact' });
        expect(result.total).toBe(150);
      });

      it('should return total as 0 when count is null', async () => {
        mockQueryBuilder.range.and.returnValue(
          Promise.resolve({
            data: [mockProductData],
            error: null,
            count: null
          })
        );

        const result = await service.getCatalogProducts({ first: 0, rows: 12 });

        expect(result.total).toBe(0);
      });
    });

    describe('Pagination with Sorting', () => {
      it('should apply sorting before pagination', async () => {
        mockQueryBuilder.range.and.returnValue(
          Promise.resolve({
            data: [mockProductData],
            error: null,
            count: 50
          })
        );

        await service.getCatalogProducts({
          first: 0,
          rows: 12,
          sortField: 'selling_price',
          sortOrder: 1
        });

        expect(mockQueryBuilder.order).toHaveBeenCalledWith('selling_price', { ascending: true });
        expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 11);
      });

      it('should default to created_at descending when no sort specified', async () => {
        mockQueryBuilder.range.and.returnValue(
          Promise.resolve({
            data: [mockProductData],
            error: null,
            count: 50
          })
        );

        await service.getCatalogProducts({ first: 0, rows: 12 });

        expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
      });

      it('should apply descending sort with sortOrder -1', async () => {
        mockQueryBuilder.range.and.returnValue(
          Promise.resolve({
            data: [mockProductData],
            error: null,
            count: 50
          })
        );

        await service.getCatalogProducts({
          first: 0,
          rows: 12,
          sortField: 'selling_price',
          sortOrder: -1
        });

        expect(mockQueryBuilder.order).toHaveBeenCalledWith('selling_price', { ascending: false });
      });
    });

    describe('Pagination with Filters', () => {
      it('should combine pagination with status filter', async () => {
        mockQueryBuilder.range.and.returnValue(
          Promise.resolve({
            data: [mockProductData],
            error: null,
            count: 30
          })
        );

        await service.getCatalogProducts(
          { first: 12, rows: 12 },
          { status: ProductStatus.AVAILABLE }
        );

        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', ProductStatus.AVAILABLE);
        expect(mockQueryBuilder.range).toHaveBeenCalledWith(12, 23);
      });

      it('should combine pagination with brand filter', async () => {
        mockQueryBuilder.range.and.returnValue(
          Promise.resolve({
            data: [mockProductData],
            error: null,
            count: 20
          })
        );

        await service.getCatalogProducts(
          { first: 0, rows: 12 },
          { brandId: 'brand-1' }
        );

        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('brand_id', 'brand-1');
        expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 11);
      });

      it('should combine pagination with price range filters', async () => {
        mockQueryBuilder.range.and.returnValue(
          Promise.resolve({
            data: [mockProductData],
            error: null,
            count: 15
          })
        );

        await service.getCatalogProducts(
          { first: 0, rows: 12 },
          { minPrice: 500, maxPrice: 1000 }
        );

        expect(mockQueryBuilder.gte).toHaveBeenCalledWith('selling_price', 500);
        expect(mockQueryBuilder.lte).toHaveBeenCalledWith('selling_price', 1000);
        expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 11);
      });

      it('should combine pagination with condition filter', async () => {
        mockQueryBuilder.range.and.returnValue(
          Promise.resolve({
            data: [mockProductData],
            error: null,
            count: 25
          })
        );

        await service.getCatalogProducts(
          { first: 24, rows: 12 },
          { conditions: [ProductCondition.NEW, ProductCondition.REFURBISHED] }
        );

        expect(mockQueryBuilder.in).toHaveBeenCalledWith('condition', [ProductCondition.NEW, ProductCondition.REFURBISHED]);
        expect(mockQueryBuilder.range).toHaveBeenCalledWith(24, 35);
      });

      it('should combine pagination with storage filter', async () => {
        mockQueryBuilder.range.and.returnValue(
          Promise.resolve({
            data: [mockProductData],
            error: null,
            count: 10
          })
        );

        await service.getCatalogProducts(
          { first: 0, rows: 12 },
          { storageGbOptions: [128, 256] }
        );

        expect(mockQueryBuilder.in).toHaveBeenCalledWith('storage_gb', [128, 256]);
        expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 11);
      });
    });

    describe('Pagination with Search', () => {
      let brandsQueryBuilder: any;

      beforeEach(() => {
        brandsQueryBuilder = {
          select: jasmine.createSpy('select').and.returnValue({
            ilike: jasmine.createSpy('ilike').and.returnValue(
              Promise.resolve({
                data: [],
                error: null
              })
            )
          })
        };
      });

      it('should combine pagination with search filter', async () => {
        mockSupabaseService.from.and.callFake((table: string) => {
          if (table === 'brands') return brandsQueryBuilder;
          return mockQueryBuilder;
        });

        mockQueryBuilder.range.and.returnValue(
          Promise.resolve({
            data: [mockProductData],
            error: null,
            count: 5
          })
        );

        await service.getCatalogProducts(
          { first: 0, rows: 12 },
          { search: 'iPhone' }
        );

        expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('model', '%iphone%');
        expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 11);
      });
    });

    describe('Error Handling', () => {
      it('should throw error when Supabase returns error', async () => {
        mockQueryBuilder.range.and.returnValue(
          Promise.resolve({
            data: null,
            error: { message: 'Database connection failed' },
            count: 0
          })
        );

        await expectAsync(
          service.getCatalogProducts({ first: 0, rows: 12 })
        ).toBeRejectedWithError('Database connection failed');
      });
    });

    describe('Response Data Mapping', () => {
      it('should map product data correctly for paginated results', async () => {
        mockQueryBuilder.range.and.returnValue(
          Promise.resolve({
            data: [mockProductData],
            error: null,
            count: 50
          })
        );

        const result = await service.getCatalogProducts({ first: 0, rows: 12 });

        expect(result.data.length).toBe(1);
        expect(result.data[0].id).toBe('product-1');
        expect(result.data[0].brandName).toBe('Apple');
        expect(result.data[0].model).toBe('iPhone 15 Pro');
        expect(result.data[0].sellingPrice).toBe(1200);
        expect(result.data[0].profitMargin).toBe(25);
      });

      it('should return empty array when no data matches', async () => {
        mockQueryBuilder.range.and.returnValue(
          Promise.resolve({
            data: [],
            error: null,
            count: 0
          })
        );

        const result = await service.getCatalogProducts({ first: 0, rows: 12 });

        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
      });
    });
  });
});
