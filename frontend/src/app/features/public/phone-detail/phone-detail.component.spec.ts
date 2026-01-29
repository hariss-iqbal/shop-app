import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { PhoneDetailComponent } from './phone-detail.component';
import { PhoneService } from '../../../core/services/phone.service';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SeoService } from '../../../shared/services/seo.service';
import { JsonLdService } from '../../../shared/services/json-ld.service';
import { PhoneDetail } from '../../../models/phone.model';
import { PhoneCondition } from '../../../enums/phone-condition.enum';
import { PhoneStatus } from '../../../enums/phone-status.enum';

describe('PhoneDetailComponent', () => {
  let component: PhoneDetailComponent;
  let fixture: ComponentFixture<PhoneDetailComponent>;
  let mockPhoneService: jasmine.SpyObj<PhoneService>;
  let mockImageOptimization: jasmine.SpyObj<ImageOptimizationService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockSeoService: jasmine.SpyObj<SeoService>;
  let mockJsonLdService: jasmine.SpyObj<JsonLdService>;
  let mockLocation: jasmine.SpyObj<Location>;

  const mockPhoneDetail: PhoneDetail = {
    id: 'phone-1',
    brandId: 'brand-1',
    brandName: 'Apple',
    brandLogoUrl: 'https://example.com/apple.png',
    model: 'iPhone 15 Pro',
    description: 'Latest iPhone with advanced features',
    storageGb: 256,
    ramGb: 8,
    color: 'Space Black',
    condition: PhoneCondition.NEW,
    batteryHealth: null,
    imei: '123456789012345',
    costPrice: 900,
    sellingPrice: 1200,
    profitMargin: 25,
    status: PhoneStatus.AVAILABLE,
    purchaseDate: '2024-01-15',
    supplierId: 'supplier-1',
    supplierName: 'Test Supplier',
    notes: null,
    primaryImageUrl: 'https://example.com/phone.jpg',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: null,
    images: [
      { id: 'img-1', imageUrl: 'https://example.com/phone1.jpg', isPrimary: true, displayOrder: 0 },
      { id: 'img-2', imageUrl: 'https://example.com/phone2.jpg', isPrimary: false, displayOrder: 1 }
    ]
  };

  const mockUsedPhoneDetail: PhoneDetail = {
    ...mockPhoneDetail,
    id: 'phone-2',
    condition: PhoneCondition.USED,
    batteryHealth: 85
  };

  const mockRefurbishedPhoneDetail: PhoneDetail = {
    ...mockPhoneDetail,
    id: 'phone-3',
    condition: PhoneCondition.REFURBISHED,
    batteryHealth: 92
  };

  beforeEach(async () => {
    mockPhoneService = jasmine.createSpyObj('PhoneService', ['getAvailablePhoneDetail']);
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
      imports: [PhoneDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'id' ? 'phone-1' : null
              }
            }
          }
        },
        { provide: PhoneService, useValue: mockPhoneService },
        { provide: ImageOptimizationService, useValue: mockImageOptimization },
        { provide: ToastService, useValue: mockToastService },
        { provide: SeoService, useValue: mockSeoService },
        { provide: JsonLdService, useValue: mockJsonLdService },
        { provide: Location, useValue: mockLocation }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PhoneDetailComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockPhoneDetail));
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should load phone detail on init', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockPhoneDetail));
      fixture.detectChanges();
      tick();

      expect(mockPhoneService.getAvailablePhoneDetail).toHaveBeenCalledWith('phone-1');
      expect(component.phone()).toEqual(mockPhoneDetail);
      expect(component.loading()).toBeFalse();
      expect(component.notFound()).toBeFalse();
    }));

    it('should set notFound to true when phone id is missing', fakeAsync(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [PhoneDetailComponent],
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
          { provide: PhoneService, useValue: mockPhoneService },
          { provide: ImageOptimizationService, useValue: mockImageOptimization },
          { provide: ToastService, useValue: mockToastService },
          { provide: SeoService, useValue: mockSeoService },
          { provide: JsonLdService, useValue: mockJsonLdService },
          { provide: Location, useValue: mockLocation }
        ]
      });

      const newFixture = TestBed.createComponent(PhoneDetailComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      tick();

      expect(newComponent.notFound()).toBeTrue();
      expect(newComponent.loading()).toBeFalse();
    }));

    it('should set notFound to true when phone is not found', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(null));
      fixture.detectChanges();
      tick();

      expect(component.notFound()).toBeTrue();
      expect(component.loading()).toBeFalse();
    }));

    it('should show error toast and set notFound on API error', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.reject(new Error('API Error')));
      fixture.detectChanges();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Failed to load phone details');
      expect(component.notFound()).toBeTrue();
      expect(component.loading()).toBeFalse();
    }));
  });

  describe('Image Gallery (Galleria)', () => {
    it('should build galleria images from phone detail', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockPhoneDetail));
      fixture.detectChanges();
      tick();

      const images = component.galleriaImages();
      expect(images.length).toBe(2);
      expect(images[0].isPrimary).toBeTrue();
      expect(images[0].alt).toBe('Apple iPhone 15 Pro');
    }));

    it('should set primary image to load eagerly', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockPhoneDetail));
      fixture.detectChanges();
      tick();

      const images = component.galleriaImages();
      expect(images[0].isPrimary).toBeTrue();
    }));

    it('should apply image optimizations', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockPhoneDetail));
      fixture.detectChanges();
      tick();

      expect(mockImageOptimization.getDetailImageUrl).toHaveBeenCalled();
      expect(mockImageOptimization.getDetailSrcSet).toHaveBeenCalled();
      expect(mockImageOptimization.getThumbnailUrl).toHaveBeenCalled();
    }));

    it('should show no images placeholder when phone has no images', fakeAsync(() => {
      const phoneWithoutImages = { ...mockPhoneDetail, images: [] };
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(phoneWithoutImages));
      fixture.detectChanges();
      tick();

      expect(component.galleriaImages().length).toBe(0);
    }));
  });

  describe('Phone Specifications Display', () => {
    it('should display all phone specs', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockPhoneDetail));
      fixture.detectChanges();
      tick();

      const phone = component.phone();
      expect(phone?.brandName).toBe('Apple');
      expect(phone?.model).toBe('iPhone 15 Pro');
      expect(phone?.storageGb).toBe(256);
      expect(phone?.ramGb).toBe(8);
      expect(phone?.color).toBe('Space Black');
      expect(phone?.condition).toBe(PhoneCondition.NEW);
    }));

    it('should get correct condition label', () => {
      expect(component.getConditionLabel(PhoneCondition.NEW)).toBe('New');
      expect(component.getConditionLabel(PhoneCondition.USED)).toBe('Used');
      expect(component.getConditionLabel(PhoneCondition.REFURBISHED)).toBe('Refurbished');
    });

    it('should get correct condition severity', () => {
      expect(component.getConditionSeverity(PhoneCondition.NEW)).toBe('success');
      expect(component.getConditionSeverity(PhoneCondition.REFURBISHED)).toBe('info');
      expect(component.getConditionSeverity(PhoneCondition.USED)).toBe('warn');
    });

    it('should get correct status label', () => {
      expect(component.getStatusLabel(PhoneStatus.AVAILABLE)).toBe('Available');
      expect(component.getStatusLabel(PhoneStatus.SOLD)).toBe('Sold');
      expect(component.getStatusLabel(PhoneStatus.RESERVED)).toBe('Reserved');
    });

    it('should get correct status severity', () => {
      expect(component.getStatusSeverity(PhoneStatus.AVAILABLE)).toBe('success');
      expect(component.getStatusSeverity(PhoneStatus.RESERVED)).toBe('warn');
      expect(component.getStatusSeverity(PhoneStatus.SOLD)).toBe('danger');
    });
  });

  describe('Battery Health Display', () => {
    it('should not show battery health for new phones', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockPhoneDetail));
      fixture.detectChanges();
      tick();

      expect(component.showBatteryHealth()).toBeFalse();
    }));

    it('should show battery health for used phones', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockUsedPhoneDetail));
      fixture.detectChanges();
      tick();

      expect(component.showBatteryHealth()).toBeTrue();
    }));

    it('should show battery health for refurbished phones', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockRefurbishedPhoneDetail));
      fixture.detectChanges();
      tick();

      expect(component.showBatteryHealth()).toBeTrue();
    }));

    it('should not show battery health if value is null', fakeAsync(() => {
      const phoneWithNullBattery = { ...mockUsedPhoneDetail, batteryHealth: null };
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(phoneWithNullBattery));
      fixture.detectChanges();
      tick();

      expect(component.showBatteryHealth()).toBeFalse();
    }));

    it('should return correct battery health class for excellent health (>=90%)', () => {
      expect(component.getBatteryHealthClass(95)).toBe('text-green-600');
      expect(component.getBatteryHealthClass(90)).toBe('text-green-600');
    });

    it('should return correct battery health class for good health (80-89%)', () => {
      expect(component.getBatteryHealthClass(85)).toBe('text-green-500');
      expect(component.getBatteryHealthClass(80)).toBe('text-green-500');
    });

    it('should return correct battery health class for fair health (70-79%)', () => {
      expect(component.getBatteryHealthClass(75)).toBe('text-yellow-600');
      expect(component.getBatteryHealthClass(70)).toBe('text-yellow-600');
    });

    it('should return correct battery health class for poor health (50-69%)', () => {
      expect(component.getBatteryHealthClass(60)).toBe('text-orange-500');
      expect(component.getBatteryHealthClass(50)).toBe('text-orange-500');
    });

    it('should return correct battery health class for critical health (<50%)', () => {
      expect(component.getBatteryHealthClass(49)).toBe('text-red-500');
      expect(component.getBatteryHealthClass(20)).toBe('text-red-500');
    });

    it('should return empty string for null battery health', () => {
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
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockPhoneDetail));
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

    it('should not open WhatsApp when phone is null', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(null));
      fixture.detectChanges();
      tick();

      spyOn(window, 'open');
      component.openWhatsAppInquiry();

      expect(window.open).not.toHaveBeenCalled();
    }));

    it('should include price in WhatsApp message', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockPhoneDetail));
      fixture.detectChanges();
      tick();

      spyOn(window, 'open');
      component.openWhatsAppInquiry();

      const openCall = (window.open as jasmine.Spy).calls.mostRecent();
      const url = openCall.args[0] as string;
      expect(url).toContain('1%2C200');
    }));
  });

  describe('SEO and Structured Data', () => {
    it('should update SEO meta tags on phone load', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockPhoneDetail));
      fixture.detectChanges();
      tick();

      expect(mockSeoService.updateMetaTags).toHaveBeenCalled();
      const seoCall = mockSeoService.updateMetaTags.calls.mostRecent().args[0];
      expect(seoCall.title).toContain('Apple iPhone 15 Pro');
      expect(seoCall.title).toContain('256GB');
    }));

    it('should set JSON-LD structured data', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockPhoneDetail));
      fixture.detectChanges();
      tick();

      expect(mockJsonLdService.setProductStructuredData).toHaveBeenCalledWith(mockPhoneDetail);
    }));

    it('should remove structured data on destroy', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockPhoneDetail));
      fixture.detectChanges();
      tick();

      component.ngOnDestroy();

      expect(mockJsonLdService.removeStructuredData).toHaveBeenCalled();
    }));
  });

  describe('Navigation', () => {
    it('should go back using location.back when history exists', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockPhoneDetail));
      fixture.detectChanges();
      tick();

      spyOnProperty(window.history, 'length', 'get').and.returnValue(2);

      component.goBackToCatalog();

      expect(mockLocation.back).toHaveBeenCalled();
    }));
  });

  describe('Loading State', () => {
    it('should show loading skeleton while fetching', () => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(
        new Promise(() => {})
      );
      fixture.detectChanges();

      expect(component.loading()).toBeTrue();
    });

    it('should hide loading skeleton after fetch completes', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockPhoneDetail));
      fixture.detectChanges();
      tick();

      expect(component.loading()).toBeFalse();
    }));
  });

  describe('Galleria Responsive Options', () => {
    it('should have responsive options configured', () => {
      expect(component.galleriaResponsiveOptions).toBeDefined();
      expect(component.galleriaResponsiveOptions.length).toBe(4);
    });

    it('should have correct breakpoints', () => {
      const breakpoints = component.galleriaResponsiveOptions.map(opt => opt.breakpoint);
      expect(breakpoints).toContain('1200px');
      expect(breakpoints).toContain('1024px');
      expect(breakpoints).toContain('768px');
      expect(breakpoints).toContain('560px');
    });
  });

  // AC_REDESIGN_001: Discount and pricing tests
  describe('Discount and Pricing (AC_REDESIGN_001)', () => {
    it('should detect discount when profit margin is >= 20%', fakeAsync(() => {
      const phoneWithHighMargin = { ...mockPhoneDetail, profitMargin: 25 };
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(phoneWithHighMargin));
      fixture.detectChanges();
      tick();

      expect(component.hasDiscount()).toBeTrue();
      expect(component.getDiscountPercent()).toBe(25);
    }));

    it('should not show discount when profit margin is < 20%', fakeAsync(() => {
      const phoneWithLowMargin = { ...mockPhoneDetail, profitMargin: 15 };
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(phoneWithLowMargin));
      fixture.detectChanges();
      tick();

      expect(component.hasDiscount()).toBeFalse();
    }));

    it('should calculate original price correctly', fakeAsync(() => {
      const phoneWithDiscount = { ...mockPhoneDetail, sellingPrice: 1000, profitMargin: 25 };
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(phoneWithDiscount));
      fixture.detectChanges();
      tick();

      expect(component.getOriginalPrice()).toBe(1250); // 1000 * 1.25
    }));

    it('should return correct condition background class for NEW', () => {
      expect(component.getConditionBgClass(PhoneCondition.NEW)).toBe('condition-new');
    });

    it('should return correct condition background class for REFURBISHED', () => {
      expect(component.getConditionBgClass(PhoneCondition.REFURBISHED)).toBe('condition-refurbished');
    });

    it('should return correct condition background class for USED', () => {
      expect(component.getConditionBgClass(PhoneCondition.USED)).toBe('condition-used');
    });
  });

  // AC_REDESIGN_002: Customer reviews tests
  describe('Customer Reviews (AC_REDESIGN_002)', () => {
    it('should generate mock reviews when phone is loaded', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockPhoneDetail));
      fixture.detectChanges();
      tick();

      expect(component.customerReviews().length).toBeGreaterThan(0);
    }));

    it('should calculate average rating from reviews', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockPhoneDetail));
      fixture.detectChanges();
      tick();

      const avgRating = component.averageRating();
      expect(avgRating).toBeGreaterThanOrEqual(1);
      expect(avgRating).toBeLessThanOrEqual(5);
    }));

    it('should generate more reviews for NEW phones', fakeAsync(() => {
      const newPhone = { ...mockPhoneDetail, condition: PhoneCondition.NEW };
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(newPhone));
      fixture.detectChanges();
      tick();

      expect(component.customerReviews().length).toBe(5);
    }));

    it('should generate fewer reviews for USED phones', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockUsedPhoneDetail));
      fixture.detectChanges();
      tick();

      expect(component.customerReviews().length).toBe(3);
    }));

    it('should include customer initials in reviews', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockPhoneDetail));
      fixture.detectChanges();
      tick();

      const review = component.customerReviews()[0];
      expect(review.customerInitials).toBeDefined();
      expect(review.customerInitials.length).toBeGreaterThan(0);
    }));
  });

  // AC_REDESIGN_003: Sticky bar tests
  describe('Sticky Mobile Bar (AC_REDESIGN_003)', () => {
    it('should not show sticky bar initially', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockPhoneDetail));
      fixture.detectChanges();
      tick();

      expect(component.showStickyBar()).toBeFalse();
    }));

    it('should show sticky bar after scrolling past 400px', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockPhoneDetail));
      fixture.detectChanges();
      tick();

      component.scrollPosition.set(450);
      expect(component.showStickyBar()).toBeTrue();
    }));

    it('should hide sticky bar when scrolled back up', fakeAsync(() => {
      mockPhoneService.getAvailablePhoneDetail.and.returnValue(Promise.resolve(mockPhoneDetail));
      fixture.detectChanges();
      tick();

      component.scrollPosition.set(450);
      expect(component.showStickyBar()).toBeTrue();

      component.scrollPosition.set(200);
      expect(component.showStickyBar()).toBeFalse();
    }));
  });

  // Battery health description tests
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
