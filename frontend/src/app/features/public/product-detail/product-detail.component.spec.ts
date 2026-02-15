import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ProductDetailComponent } from './product-detail.component';
import { ProductService } from '../../../core/services/product.service';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SeoService } from '../../../shared/services/seo.service';
import { JsonLdService } from '../../../shared/services/json-ld.service';
import { ProductDetail } from '../../../models/product.model';
import { ProductCondition } from '../../../enums/product-condition.enum';
import { ProductStatus } from '../../../enums/product-status.enum';

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;
  let fixture: ComponentFixture<ProductDetailComponent>;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockImageOptimization: jasmine.SpyObj<ImageOptimizationService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockSeoService: jasmine.SpyObj<SeoService>;
  let mockJsonLdService: jasmine.SpyObj<JsonLdService>;
  let mockLocation: jasmine.SpyObj<Location>;

  const mockProductDetail: ProductDetail = {
    id: 'product-1',
    brandId: 'brand-1',
    brandName: 'Apple',
    brandLogoUrl: 'https://example.com/apple.png',
    model: 'iPhone 15 Pro',
    description: 'Latest iPhone with advanced features',
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
    primaryImageUrl: 'https://example.com/product.jpg',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: null,
    taxRate: 10,
    isTaxInclusive: false,
    isTaxExempt: false,
    images: [
      { id: 'img-1', imageUrl: 'https://example.com/product1.jpg', isPrimary: true, displayOrder: 0 },
      { id: 'img-2', imageUrl: 'https://example.com/product2.jpg', isPrimary: false, displayOrder: 1 }
    ]
  };

  const mockUsedProductDetail: ProductDetail = {
    ...mockProductDetail,
    id: 'product-2',
    condition: ProductCondition.USED,
    batteryHealth: 85
  };

  const mockRefurbishedProductDetail: ProductDetail = {
    ...mockProductDetail,
    id: 'product-3',
    condition: ProductCondition.REFURBISHED,
    batteryHealth: 92
  };

  beforeEach(async () => {
    mockProductService = jasmine.createSpyObj('ProductService', ['getAvailableProductDetail']);
    mockImageOptimization = jasmine.createSpyObj('ImageOptimizationService', [
      'getDetailImageUrl',
      'getDetailSrcSet',
      'getThumbnailUrl',
      'getTinyPlaceholderUrl'
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', ['error']);
    mockSeoService = jasmine.createSpyObj('SeoService', ['updateMetaTags']);
    mockJsonLdService = jasmine.createSpyObj('JsonLdService', ['setProductStructuredData', 'removeStructuredData']);
    mockLocation = jasmine.createSpyObj('Location', ['back']);

    mockImageOptimization.getDetailImageUrl.and.callFake((url: string) => url + '?w=800');
    mockImageOptimization.getDetailSrcSet.and.callFake((url: string) => `${url}?w=400 400w, ${url}?w=800 800w`);
    mockImageOptimization.getThumbnailUrl.and.callFake((url: string) => url + '?w=80');
    mockImageOptimization.getTinyPlaceholderUrl.and.callFake((url: string) => url ? url + '?w=20&q=20' : '');

    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'id' ? 'product-1' : null
              }
            }
          }
        },
        { provide: ProductService, useValue: mockProductService },
        { provide: ImageOptimizationService, useValue: mockImageOptimization },
        { provide: ToastService, useValue: mockToastService },
        { provide: SeoService, useValue: mockSeoService },
        { provide: JsonLdService, useValue: mockJsonLdService },
        { provide: Location, useValue: mockLocation }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      mockProductService.getAvailableProductDetail.and.returnValue(Promise.resolve(mockProductDetail));
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should load product detail on init', fakeAsync(() => {
      mockProductService.getAvailableProductDetail.and.returnValue(Promise.resolve(mockProductDetail));
      fixture.detectChanges();
      tick();

      expect(mockProductService.getAvailableProductDetail).toHaveBeenCalledWith('product-1');
      expect(component.product()).toEqual(mockProductDetail);
      expect(component.loading()).toBeFalse();
      expect(component.notFound()).toBeFalse();
    }));

    it('should set notFound to true when product id is missing', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ProductDetailComponent],
        providers: [
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: {
                  get: () => null
                }
              }
            }
          },
          { provide: ProductService, useValue: mockProductService },
          { provide: ImageOptimizationService, useValue: mockImageOptimization },
          { provide: ToastService, useValue: mockToastService },
          { provide: SeoService, useValue: mockSeoService },
          { provide: JsonLdService, useValue: mockJsonLdService },
          { provide: Location, useValue: mockLocation }
        ]
      });

      const newFixture = TestBed.createComponent(ProductDetailComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      tick();

      expect(newComponent.notFound()).toBeTrue();
      expect(newComponent.loading()).toBeFalse();
    }));

    it('should set notFound to true when product is not found', fakeAsync(() => {
      mockProductService.getAvailableProductDetail.and.returnValue(Promise.resolve(null));
      fixture.detectChanges();
      tick();

      expect(component.notFound()).toBeTrue();
      expect(component.loading()).toBeFalse();
    }));

    it('should show error toast and set notFound on API error', fakeAsync(() => {
      mockProductService.getAvailableProductDetail.and.returnValue(Promise.reject(new Error('API Error')));
      fixture.detectChanges();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to load product details');
      expect(component.notFound()).toBeTrue();
      expect(component.loading()).toBeFalse();
    }));
  });

  describe('Product Specifications Display', () => {
    it('should display all product specs', fakeAsync(() => {
      mockProductService.getAvailableProductDetail.and.returnValue(Promise.resolve(mockProductDetail));
      fixture.detectChanges();
      tick();

      const product = component.product();
      expect(product?.brandName).toBe('Apple');
      expect(product?.model).toBe('iPhone 15 Pro');
      expect(product?.storageGb).toBe(256);
      expect(product?.ramGb).toBe(8);
      expect(product?.color).toBe('Space Black');
      expect(product?.condition).toBe(ProductCondition.NEW);
    }));

    it('should get correct condition label', () => {
      expect(component.getConditionLabel(ProductCondition.NEW)).toBe('New');
      expect(component.getConditionLabel(ProductCondition.USED)).toBe('Used');
      expect(component.getConditionLabel(ProductCondition.REFURBISHED)).toBe('Refurbished');
    });

    it('should get correct condition severity', () => {
      expect(component.getConditionSeverity(ProductCondition.NEW)).toBe('success');
      expect(component.getConditionSeverity(ProductCondition.OPEN_BOX)).toBe('info');
      expect(component.getConditionSeverity(ProductCondition.USED)).toBe('warn');
    });

    it('should get correct status label', () => {
      expect(component.getStatusLabel(ProductStatus.AVAILABLE)).toBe('Available');
      expect(component.getStatusLabel(ProductStatus.SOLD)).toBe('Sold');
      expect(component.getStatusLabel(ProductStatus.RESERVED)).toBe('Reserved');
    });

    it('should get correct status severity', () => {
      expect(component.getStatusSeverity(ProductStatus.AVAILABLE)).toBe('success');
      expect(component.getStatusSeverity(ProductStatus.RESERVED)).toBe('warn');
      expect(component.getStatusSeverity(ProductStatus.SOLD)).toBe('danger');
    });
  });

  describe('Battery Health Display', () => {
    it('should not show battery health for new products', fakeAsync(() => {
      mockProductService.getAvailableProductDetail.and.returnValue(Promise.resolve(mockProductDetail));
      fixture.detectChanges();
      tick();

      expect(component.showBatteryHealth()).toBeFalse();
    }));

    it('should show battery health for used products', fakeAsync(() => {
      mockProductService.getAvailableProductDetail.and.returnValue(Promise.resolve(mockUsedProductDetail));
      fixture.detectChanges();
      tick();

      expect(component.showBatteryHealth()).toBeTrue();
    }));

    it('should not show battery health if value is null', fakeAsync(() => {
      const productWithNullBattery = { ...mockUsedProductDetail, batteryHealth: null };
      mockProductService.getAvailableProductDetail.and.returnValue(Promise.resolve(productWithNullBattery));
      fixture.detectChanges();
      tick();

      expect(component.showBatteryHealth()).toBeFalse();
    }));

    it('should return correct battery health class', () => {
      expect(component.getBatteryHealthClass(95)).toBe('text-green-600');
      expect(component.getBatteryHealthClass(85)).toBe('text-green-500');
      expect(component.getBatteryHealthClass(75)).toBe('text-yellow-600');
      expect(component.getBatteryHealthClass(60)).toBe('text-orange-500');
      expect(component.getBatteryHealthClass(49)).toBe('text-red-500');
      expect(component.getBatteryHealthClass(null)).toBe('');
    });

    it('should return correct battery progress class', () => {
      expect(component.getBatteryProgressClass(95)).toBe('battery-excellent');
      expect(component.getBatteryProgressClass(85)).toBe('battery-good');
      expect(component.getBatteryProgressClass(75)).toBe('battery-fair');
      expect(component.getBatteryProgressClass(55)).toBe('battery-poor');
      expect(component.getBatteryProgressClass(30)).toBe('battery-critical');
      expect(component.getBatteryProgressClass(null)).toBe('');
    });
  });

  describe('WhatsApp Inquiry', () => {
    it('should open WhatsApp with pre-filled message', fakeAsync(() => {
      mockProductService.getAvailableProductDetail.and.returnValue(Promise.resolve(mockProductDetail));
      fixture.detectChanges();
      tick();

      spyOn(window, 'open');
      component.openWhatsAppInquiry();

      expect(window.open).toHaveBeenCalled();
      const openCall = (window.open as jasmine.Spy).calls.mostRecent();
      const url = openCall.args[0] as string;
      expect(url).toContain('wa.me');
      expect(url).toContain('Apple');
      expect(url).toContain('iPhone%2015%20Pro');
      expect(url).toContain('256GB');
    }));

    it('should not open WhatsApp when product is null', fakeAsync(() => {
      mockProductService.getAvailableProductDetail.and.returnValue(Promise.resolve(null));
      fixture.detectChanges();
      tick();

      spyOn(window, 'open');
      component.openWhatsAppInquiry();

      expect(window.open).not.toHaveBeenCalled();
    }));
  });

  describe('SEO and Structured Data', () => {
    it('should update SEO meta tags on product load', fakeAsync(() => {
      mockProductService.getAvailableProductDetail.and.returnValue(Promise.resolve(mockProductDetail));
      fixture.detectChanges();
      tick();

      expect(mockSeoService.updateMetaTags).toHaveBeenCalled();
      const seoCall = mockSeoService.updateMetaTags.calls.mostRecent().args[0];
      expect(seoCall.title).toContain('Apple iPhone 15 Pro');
      expect(seoCall.title).toContain('256GB');
    }));

    it('should set JSON-LD structured data', fakeAsync(() => {
      mockProductService.getAvailableProductDetail.and.returnValue(Promise.resolve(mockProductDetail));
      fixture.detectChanges();
      tick();

      expect(mockJsonLdService.setProductStructuredData).toHaveBeenCalledWith(mockProductDetail);
    }));

    it('should remove structured data on destroy', fakeAsync(() => {
      mockProductService.getAvailableProductDetail.and.returnValue(Promise.resolve(mockProductDetail));
      fixture.detectChanges();
      tick();

      component.ngOnDestroy();

      expect(mockJsonLdService.removeStructuredData).toHaveBeenCalled();
    }));
  });

  describe('Navigation', () => {
    it('should go back using location.back when history exists', fakeAsync(() => {
      mockProductService.getAvailableProductDetail.and.returnValue(Promise.resolve(mockProductDetail));
      fixture.detectChanges();
      tick();

      spyOnProperty(window.history, 'length', 'get').and.returnValue(2);

      component.goBackToCatalog();

      expect(mockLocation.back).toHaveBeenCalled();
    }));
  });

  describe('Discount and Pricing', () => {
    it('should detect discount when profit margin is >= 20%', fakeAsync(() => {
      const productWithHighMargin = { ...mockProductDetail, profitMargin: 25 };
      mockProductService.getAvailableProductDetail.and.returnValue(Promise.resolve(productWithHighMargin));
      fixture.detectChanges();
      tick();

      expect(component.hasDiscount()).toBeTrue();
      expect(component.getDiscountPercent()).toBe(25);
    }));

    it('should not show discount when profit margin is < 20%', fakeAsync(() => {
      const productWithLowMargin = { ...mockProductDetail, profitMargin: 15 };
      mockProductService.getAvailableProductDetail.and.returnValue(Promise.resolve(productWithLowMargin));
      fixture.detectChanges();
      tick();

      expect(component.hasDiscount()).toBeFalse();
    }));

    it('should return correct condition background class', () => {
      expect(component.getConditionBgClass(ProductCondition.NEW)).toBe('condition-new');
      expect(component.getConditionBgClass(ProductCondition.OPEN_BOX)).toBe('condition-open-box');
      expect(component.getConditionBgClass(ProductCondition.USED)).toBe('condition-used');
    });
  });

  describe('Sticky Mobile Bar', () => {
    it('should not show sticky bar initially', fakeAsync(() => {
      mockProductService.getAvailableProductDetail.and.returnValue(Promise.resolve(mockProductDetail));
      fixture.detectChanges();
      tick();

      expect(component.showStickyBar()).toBeFalse();
    }));

    it('should show sticky bar after scrolling past 400px', fakeAsync(() => {
      mockProductService.getAvailableProductDetail.and.returnValue(Promise.resolve(mockProductDetail));
      fixture.detectChanges();
      tick();

      component.scrollPosition.set(450);
      expect(component.showStickyBar()).toBeTrue();
    }));
  });

  describe('Battery Health Description', () => {
    it('should return excellent description for >= 90%', () => {
      expect(component.getBatteryHealthDescription(95)).toContain('Excellent');
    });

    it('should return good description for 80-89%', () => {
      expect(component.getBatteryHealthDescription(85)).toContain('Good');
    });

    it('should return fair description for 70-79%', () => {
      expect(component.getBatteryHealthDescription(75)).toContain('Fair');
    });

    it('should return below average description for 50-69%', () => {
      expect(component.getBatteryHealthDescription(55)).toContain('Below average');
    });

    it('should return critical description for < 50%', () => {
      expect(component.getBatteryHealthDescription(40)).toContain('Critical');
    });

    it('should return empty string for null', () => {
      expect(component.getBatteryHealthDescription(null)).toBe('');
    });
  });
});
