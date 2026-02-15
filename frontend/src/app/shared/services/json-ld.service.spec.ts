import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { JsonLdService } from './json-ld.service';
import { ProductDetail } from '../../models/product.model';
import { ProductCondition } from '../../enums/product-condition.enum';
import { ProductStatus } from '../../enums/product-status.enum';


describe('JsonLdService', () => {
  let service: JsonLdService;
  let mockDocument: Document;

  const mockProductDetail: ProductDetail = {
    id: 'product-123',
    brandId: 'brand-1',
    brandName: 'Apple',
    brandLogoUrl: 'https://example.com/apple.png',
    model: 'iPhone 15 Pro',
    description: 'The latest iPhone with advanced camera system and A17 Pro chip.',
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
    primaryImageUrl: 'https://example.com/phone-primary.jpg',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: null,
    taxRate: 10,
    isTaxInclusive: false,
    isTaxExempt: false,
    images: [
      { id: 'img-1', imageUrl: 'https://example.com/phone1.jpg', isPrimary: true, displayOrder: 0 },
      { id: 'img-2', imageUrl: 'https://example.com/phone2.jpg', isPrimary: false, displayOrder: 1 },
      { id: 'img-3', imageUrl: 'https://example.com/phone3.jpg', isPrimary: false, displayOrder: 2 }
    ]
  };

  beforeEach(() => {
    mockDocument = document.implementation.createHTMLDocument('Test');

    TestBed.configureTestingModule({
      providers: [
        JsonLdService,
        { provide: DOCUMENT, useValue: mockDocument }
      ]
    });

    service = TestBed.inject(JsonLdService);
  });

  afterEach(() => {
    service.removeStructuredData();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setProductStructuredData', () => {
    it('should inject JSON-LD script into document head', () => {
      service.setProductStructuredData(mockProductDetail);

      const script = mockDocument.getElementById('json-ld-product');
      expect(script).toBeTruthy();
      expect(script?.getAttribute('type')).toBe('application/ld+json');
    });

    it('should create valid JSON-LD structure', () => {
      service.setProductStructuredData(mockProductDetail);

      const script = mockDocument.getElementById('json-ld-product');
      const jsonLd = JSON.parse(script?.textContent || '{}');

      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBe('Product');
    });

    it('should set product name as brand + model', () => {
      service.setProductStructuredData(mockProductDetail);

      const script = mockDocument.getElementById('json-ld-product');
      const jsonLd = JSON.parse(script?.textContent || '{}');

      expect(jsonLd.name).toBe('Apple iPhone 15 Pro');
    });

    it('should set product description when available', () => {
      service.setProductStructuredData(mockProductDetail);

      const script = mockDocument.getElementById('json-ld-product');
      const jsonLd = JSON.parse(script?.textContent || '{}');

      expect(jsonLd.description).toBe('The latest iPhone with advanced camera system and A17 Pro chip.');
    });

    it('should not include description when not available', () => {
      const productWithoutDescription = { ...mockProductDetail, description: null };
      service.setProductStructuredData(productWithoutDescription);

      const script = mockDocument.getElementById('json-ld-product');
      const jsonLd = JSON.parse(script?.textContent || '{}');

      expect(jsonLd.description).toBeUndefined();
    });

    it('should set brand information correctly', () => {
      service.setProductStructuredData(mockProductDetail);

      const script = mockDocument.getElementById('json-ld-product');
      const jsonLd = JSON.parse(script?.textContent || '{}');

      expect(jsonLd.brand).toEqual({
        '@type': 'Brand',
        name: 'Apple'
      });
    });

    it('should set SKU to IMEI when available', () => {
      service.setProductStructuredData(mockProductDetail);

      const script = mockDocument.getElementById('json-ld-product');
      const jsonLd = JSON.parse(script?.textContent || '{}');

      expect(jsonLd.sku).toBe('123456789012345');
    });

    it('should not include SKU when IMEI not available', () => {
      const productWithoutImei = { ...mockProductDetail, imei: null };
      service.setProductStructuredData(productWithoutImei);

      const script = mockDocument.getElementById('json-ld-product');
      const jsonLd = JSON.parse(script?.textContent || '{}');

      expect(jsonLd.sku).toBeUndefined();
    });

    describe('Images', () => {
      it('should include all images sorted with primary first', () => {
        service.setProductStructuredData(mockProductDetail);

        const script = mockDocument.getElementById('json-ld-product');
        const jsonLd = JSON.parse(script?.textContent || '{}');

        expect(jsonLd.image).toEqual([
          'https://example.com/phone1.jpg',
          'https://example.com/phone2.jpg',
          'https://example.com/phone3.jpg'
        ]);
      });

      it('should use primaryImageUrl as fallback when no images array', () => {
        const productWithPrimaryOnly = { ...mockProductDetail, images: [] };
        service.setProductStructuredData(productWithPrimaryOnly);

        const script = mockDocument.getElementById('json-ld-product');
        const jsonLd = JSON.parse(script?.textContent || '{}');

        expect(jsonLd.image).toEqual(['https://example.com/phone-primary.jpg']);
      });

      it('should not include image array when no images available', () => {
        const productWithoutImages = { ...mockProductDetail, images: [], primaryImageUrl: null };
        service.setProductStructuredData(productWithoutImages);

        const script = mockDocument.getElementById('json-ld-product');
        const jsonLd = JSON.parse(script?.textContent || '{}');

        expect(jsonLd.image).toBeUndefined();
      });

      it('should sort images by primary flag and then display order', () => {
        const productWithMixedImages: ProductDetail = {
          ...mockProductDetail,
          images: [
            { id: 'img-3', imageUrl: 'https://example.com/third.jpg', isPrimary: false, displayOrder: 2 },
            { id: 'img-1', imageUrl: 'https://example.com/primary.jpg', isPrimary: true, displayOrder: 5 },
            { id: 'img-2', imageUrl: 'https://example.com/second.jpg', isPrimary: false, displayOrder: 1 }
          ]
        };

        service.setProductStructuredData(productWithMixedImages);

        const script = mockDocument.getElementById('json-ld-product');
        const jsonLd = JSON.parse(script?.textContent || '{}');

        expect(jsonLd.image[0]).toBe('https://example.com/primary.jpg');
        expect(jsonLd.image[1]).toBe('https://example.com/second.jpg');
        expect(jsonLd.image[2]).toBe('https://example.com/third.jpg');
      });
    });

    describe('Offers', () => {
      it('should set correct offer structure', () => {
        service.setProductStructuredData(mockProductDetail);

        const script = mockDocument.getElementById('json-ld-product');
        const jsonLd = JSON.parse(script?.textContent || '{}');

        expect(jsonLd.offers['@type']).toBe('Offer');
        expect(jsonLd.offers.price).toBe(1200);
        expect(jsonLd.offers.priceCurrency).toBe('PKR');
      });

      it('should set product URL in offer', () => {
        service.setProductStructuredData(mockProductDetail);

        const script = mockDocument.getElementById('json-ld-product');
        const jsonLd = JSON.parse(script?.textContent || '{}');

        expect(jsonLd.offers.url).toBe('http://localhost:4200/product/product-123');
      });
    });

    describe('Availability Mapping', () => {
      it('should map AVAILABLE status to InStock', () => {
        const availableProduct = { ...mockProductDetail, status: ProductStatus.AVAILABLE };
        service.setProductStructuredData(availableProduct);

        const script = mockDocument.getElementById('json-ld-product');
        const jsonLd = JSON.parse(script?.textContent || '{}');

        expect(jsonLd.offers.availability).toBe('https://schema.org/InStock');
      });

      it('should map SOLD status to SoldOut', () => {
        const soldProduct = { ...mockProductDetail, status: ProductStatus.SOLD };
        service.setProductStructuredData(soldProduct);

        const script = mockDocument.getElementById('json-ld-product');
        const jsonLd = JSON.parse(script?.textContent || '{}');

        expect(jsonLd.offers.availability).toBe('https://schema.org/SoldOut');
      });

      it('should map RESERVED status to LimitedAvailability', () => {
        const reservedProduct = { ...mockProductDetail, status: ProductStatus.RESERVED };
        service.setProductStructuredData(reservedProduct);

        const script = mockDocument.getElementById('json-ld-product');
        const jsonLd = JSON.parse(script?.textContent || '{}');

        expect(jsonLd.offers.availability).toBe('https://schema.org/LimitedAvailability');
      });
    });

    describe('Condition Mapping', () => {
      it('should map NEW condition to NewCondition', () => {
        const newProduct = { ...mockProductDetail, condition: ProductCondition.NEW };
        service.setProductStructuredData(newProduct);

        const script = mockDocument.getElementById('json-ld-product');
        const jsonLd = JSON.parse(script?.textContent || '{}');

        expect(jsonLd.offers.itemCondition).toBe('https://schema.org/NewCondition');
      });

      it('should map USED condition to UsedCondition', () => {
        const usedProduct = { ...mockProductDetail, condition: ProductCondition.USED };
        service.setProductStructuredData(usedProduct);

        const script = mockDocument.getElementById('json-ld-product');
        const jsonLd = JSON.parse(script?.textContent || '{}');

        expect(jsonLd.offers.itemCondition).toBe('https://schema.org/UsedCondition');
      });

      it('should map REFURBISHED condition to RefurbishedCondition', () => {
        const refurbishedProduct = { ...mockProductDetail, condition: ProductCondition.REFURBISHED };
        service.setProductStructuredData(refurbishedProduct);

        const script = mockDocument.getElementById('json-ld-product');
        const jsonLd = JSON.parse(script?.textContent || '{}');

        expect(jsonLd.offers.itemCondition).toBe('https://schema.org/RefurbishedCondition');
      });
    });
  });

  describe('removeStructuredData', () => {
    it('should remove JSON-LD script from document', () => {
      service.setProductStructuredData(mockProductDetail);
      expect(mockDocument.getElementById('json-ld-product')).toBeTruthy();

      service.removeStructuredData();
      expect(mockDocument.getElementById('json-ld-product')).toBeFalsy();
    });

    it('should handle removing when no script exists', () => {
      expect(() => service.removeStructuredData()).not.toThrow();
    });
  });

  describe('Multiple updates', () => {
    it('should replace existing JSON-LD when setting new data', () => {
      service.setProductStructuredData(mockProductDetail);

      const anotherProduct: ProductDetail = {
        ...mockProductDetail,
        id: 'product-456',
        model: 'Galaxy S24',
        brandName: 'Samsung'
      };

      service.setProductStructuredData(anotherProduct);

      const scripts = mockDocument.querySelectorAll('#json-ld-product');
      expect(scripts.length).toBe(1);

      const jsonLd = JSON.parse(scripts[0].textContent || '{}');
      expect(jsonLd.name).toBe('Samsung Galaxy S24');
    });
  });

  describe('Complete JSON-LD validation', () => {
    it('should produce valid schema.org Product structured data', () => {
      service.setProductStructuredData(mockProductDetail);

      const script = mockDocument.getElementById('json-ld-product');
      const jsonLd = JSON.parse(script?.textContent || '{}');

      // Verify core structure
      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBe('Product');
      expect(jsonLd.name).toBe('Apple iPhone 15 Pro');
      expect(jsonLd.description).toBe('The latest iPhone with advanced camera system and A17 Pro chip.');
      expect(jsonLd.image).toEqual([
        'https://example.com/phone1.jpg',
        'https://example.com/phone2.jpg',
        'https://example.com/phone3.jpg'
      ]);
      expect(jsonLd.brand).toEqual({
        '@type': 'Brand',
        name: 'Apple'
      });
      expect(jsonLd.sku).toBe('123456789012345');
      expect(jsonLd.color).toBe('Space Black');
      expect(jsonLd.category).toBe('Mobile Phones');

      // Verify offer structure
      expect(jsonLd.offers['@type']).toBe('Offer');
      expect(jsonLd.offers.price).toBe(1200);
      expect(jsonLd.offers.priceCurrency).toBe('PKR');
      expect(jsonLd.offers.availability).toBe('https://schema.org/InStock');
      expect(jsonLd.offers.itemCondition).toBe('https://schema.org/NewCondition');
      expect(jsonLd.offers.url).toBe('http://localhost:4200/product/product-123');
    });
  });

  describe('Enhanced schema.org fields', () => {
    it('should include priceValidUntil date in offers', () => {
      service.setProductStructuredData(mockProductDetail);

      const script = mockDocument.getElementById('json-ld-product');
      const jsonLd = JSON.parse(script?.textContent || '{}');

      expect(jsonLd.offers.priceValidUntil).toBeDefined();
      // Should be a valid date format (YYYY-MM-DD)
      expect(jsonLd.offers.priceValidUntil).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should set priceValidUntil to 30 days from now', () => {
      service.setProductStructuredData(mockProductDetail);

      const script = mockDocument.getElementById('json-ld-product');
      const jsonLd = JSON.parse(script?.textContent || '{}');

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 30);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      expect(jsonLd.offers.priceValidUntil).toBe(expectedDateStr);
    });

    it('should include seller organization when business info is available', () => {
      service.setProductStructuredData(mockProductDetail);

      const script = mockDocument.getElementById('json-ld-product');
      const jsonLd = JSON.parse(script?.textContent || '{}');

      expect(jsonLd.offers.seller).toBeDefined();
      expect(jsonLd.offers.seller['@type']).toBe('Organization');
      expect(jsonLd.offers.seller.name).toBe('Phone Shop');
      expect(jsonLd.offers.seller.url).toBe('http://localhost:4200');
    });

    it('should include product category', () => {
      service.setProductStructuredData(mockProductDetail);

      const script = mockDocument.getElementById('json-ld-product');
      const jsonLd = JSON.parse(script?.textContent || '{}');

      expect(jsonLd.category).toBe('Mobile Phones');
    });

    it('should include color when available', () => {
      service.setProductStructuredData(mockProductDetail);

      const script = mockDocument.getElementById('json-ld-product');
      const jsonLd = JSON.parse(script?.textContent || '{}');

      expect(jsonLd.color).toBe('Space Black');
    });

    it('should not include color when not available', () => {
      const productWithoutColor = { ...mockProductDetail, color: null };
      service.setProductStructuredData(productWithoutColor);

      const script = mockDocument.getElementById('json-ld-product');
      const jsonLd = JSON.parse(script?.textContent || '{}');

      expect(jsonLd.color).toBeUndefined();
    });
  });
});
