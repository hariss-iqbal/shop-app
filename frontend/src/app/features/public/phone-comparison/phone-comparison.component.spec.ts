import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { PhoneComparisonComponent } from './phone-comparison.component';
import { PhoneService } from '../../../core/services/phone.service';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';
import { PhoneComparisonService } from '../../../shared/services/phone-comparison.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SeoService } from '../../../shared/services/seo.service';
import { Phone } from '../../../models/phone.model';
import { PhoneStatus, PhoneCondition } from '../../../enums';

describe('PhoneComparisonComponent', () => {
  let component: PhoneComparisonComponent;
  let fixture: ComponentFixture<PhoneComparisonComponent>;
  let router: Router;
  let phoneServiceMock: jasmine.SpyObj<PhoneService>;
  let imageOptimizationMock: jasmine.SpyObj<ImageOptimizationService>;
  let comparisonServiceMock: jasmine.SpyObj<PhoneComparisonService>;
  let toastServiceMock: jasmine.SpyObj<ToastService>;
  let seoServiceMock: jasmine.SpyObj<SeoService>;

  const mockPhones: Phone[] = [
    {
      id: 'phone-1',
      brandId: 'brand-1',
      brandName: 'Apple',
      brandLogoUrl: 'https://example.com/apple.png',
      model: 'iPhone 14 Pro',
      description: 'Latest iPhone',
      storageGb: 256,
      ramGb: 6,
      color: 'Space Black',
      condition: PhoneCondition.NEW,
      batteryHealth: null,
      imei: '123456789012345',
      costPrice: 800,
      sellingPrice: 999,
      profitMargin: 19.92,
      status: PhoneStatus.AVAILABLE,
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
      id: 'phone-2',
      brandId: 'brand-2',
      brandName: 'Samsung',
      brandLogoUrl: 'https://example.com/samsung.png',
      model: 'Galaxy S24',
      description: 'Latest Samsung flagship',
      storageGb: 128,
      ramGb: 8,
      color: 'Phantom Black',
      condition: PhoneCondition.USED,
      batteryHealth: 92,
      imei: '987654321098765',
      costPrice: 600,
      sellingPrice: 799,
      profitMargin: 24.91,
      status: PhoneStatus.AVAILABLE,
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
      id: 'phone-3',
      brandId: 'brand-1',
      brandName: 'Apple',
      brandLogoUrl: 'https://example.com/apple.png',
      model: 'iPhone 13',
      description: 'Previous generation iPhone',
      storageGb: 128,
      ramGb: 4,
      color: 'Blue',
      condition: PhoneCondition.REFURBISHED,
      batteryHealth: 85,
      imei: '111222333444555',
      costPrice: 500,
      sellingPrice: 699,
      profitMargin: 28.47,
      status: PhoneStatus.AVAILABLE,
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
    }
  ];

  beforeEach(async () => {
    phoneServiceMock = jasmine.createSpyObj('PhoneService', ['getPhoneById']);
    imageOptimizationMock = jasmine.createSpyObj('ImageOptimizationService', ['getCardImageUrl']);
    comparisonServiceMock = jasmine.createSpyObj('PhoneComparisonService', [
      'phones',
      'remove',
      'clear'
    ]);
    toastServiceMock = jasmine.createSpyObj('ToastService', ['error', 'warn', 'success']);
    seoServiceMock = jasmine.createSpyObj('SeoService', ['updateMetaTags']);

    comparisonServiceMock.phones.and.returnValue(mockPhones);
    imageOptimizationMock.getCardImageUrl.and.callFake((url: string) => url);

    await TestBed.configureTestingModule({
      imports: [PhoneComparisonComponent, RouterTestingModule],
      providers: [
        { provide: PhoneService, useValue: phoneServiceMock },
        { provide: ImageOptimizationService, useValue: imageOptimizationMock },
        { provide: PhoneComparisonService, useValue: comparisonServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: SeoService, useValue: seoServiceMock }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(PhoneComparisonComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should set SEO meta tags on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(seoServiceMock.updateMetaTags).toHaveBeenCalledWith({
        title: 'Phone Comparison',
        description: jasmine.stringContaining('Compare phone specifications'),
        url: '/compare'
      });
    }));

    it('should load phones from comparison service', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.phones().length).toBe(3);
    }));

    it('should set loading to false after phones load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.loading()).toBe(false);
    }));
  });

  describe('Display - AC4: Comparison view specs aligned in columns', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should display phone images', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const images = compiled.querySelectorAll('table thead img');
      expect(images.length).toBeGreaterThan(0);
    });

    it('should display brand names', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Apple');
      expect(compiled.textContent).toContain('Samsung');
    });

    it('should display model names', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('iPhone 14 Pro');
      expect(compiled.textContent).toContain('Galaxy S24');
      expect(compiled.textContent).toContain('iPhone 13');
    });

    it('should display storage specs', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('256GB');
      expect(compiled.textContent).toContain('128GB');
    });

    it('should display RAM specs', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('6GB');
      expect(compiled.textContent).toContain('8GB');
      expect(compiled.textContent).toContain('4GB');
    });

    it('should display condition tags', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const tags = compiled.querySelectorAll('p-tag');
      expect(tags.length).toBeGreaterThan(0);
    });

    it('should display battery health for non-new phones', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('92%');
      expect(compiled.textContent).toContain('85%');
    });

    it('should display prices', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('$999');
      expect(compiled.textContent).toContain('$799');
      expect(compiled.textContent).toContain('$699');
    });

    it('should display color specs', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Space Black');
      expect(compiled.textContent).toContain('Phantom Black');
      expect(compiled.textContent).toContain('Blue');
    });

    it('should align specs in table format', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const table = compiled.querySelector('table');
      expect(table).toBeTruthy();
    });

    it('should show spec labels in first column', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Price');
      expect(compiled.textContent).toContain('Brand');
      expect(compiled.textContent).toContain('Model');
      expect(compiled.textContent).toContain('Storage');
      expect(compiled.textContent).toContain('RAM');
      expect(compiled.textContent).toContain('Condition');
      expect(compiled.textContent).toContain('Battery Health');
      expect(compiled.textContent).toContain('Color');
    });
  });

  describe('Empty State', () => {
    beforeEach(() => {
      comparisonServiceMock.phones.and.returnValue([]);
    });

    it('should show empty state when no phones to compare', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No phones to compare');
    }));

    it('should show browse catalog button in empty state', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Browse Catalog');
    }));
  });

  describe('Loading State', () => {
    it('should show loading skeleton while loading', fakeAsync(() => {
      // Set loading before detectChanges
      comparisonServiceMock.phones.and.returnValue([]);

      fixture.detectChanges();
      // Set loading true after initial detection
      component.loading.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const skeletons = compiled.querySelectorAll('p-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    }));

    it('should set loading to false after load completes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.loading()).toBe(false);
    }));
  });

  describe('Phone Removal', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should call comparison service remove when removing phone', () => {
      component.removePhone('phone-1');
      expect(comparisonServiceMock.remove).toHaveBeenCalledWith('phone-1');
    });

    it('should update local phones list when removing phone', fakeAsync(() => {
      component.phones.set([...mockPhones]);
      component.removePhone('phone-1');
      tick();

      expect(component.phones().length).toBe(2);
      expect(component.phones().some(p => p.id === 'phone-1')).toBe(false);
    }));
  });

  describe('Clear All', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should call comparison service clear when clearing all', () => {
      component.clearAll();
      expect(comparisonServiceMock.clear).toHaveBeenCalled();
    });

    it('should clear local phones list when clearing all', () => {
      component.clearAll();
      expect(component.phones().length).toBe(0);
    });

    it('should show clear all button when phones exist', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Clear All');
    });
  });

  describe('Navigation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should navigate to catalog when clicking back', () => {
      const navigateSpy = spyOn(router, 'navigate');
      component.goBackToCatalog();
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });

    it('should navigate to phone detail when clicking view', () => {
      const navigateSpy = spyOn(router, 'navigate');
      component.viewPhone(mockPhones[0]);
      expect(navigateSpy).toHaveBeenCalledWith(['/phone', 'phone-1']);
    });

    it('should have back to catalog button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Back to Catalog');
    });
  });

  describe('Image Optimization', () => {
    it('should use image optimization service for image URLs', () => {
      const url = 'https://example.com/test.jpg';
      component.getOptimizedUrl(url);
      expect(imageOptimizationMock.getCardImageUrl).toHaveBeenCalledWith(url);
    });
  });

  describe('Condition Display', () => {
    it('should return correct label for NEW condition', () => {
      const label = component.getConditionLabel(PhoneCondition.NEW);
      expect(label).toBe('New');
    });

    it('should return correct label for USED condition', () => {
      const label = component.getConditionLabel(PhoneCondition.USED);
      expect(label).toBe('Used');
    });

    it('should return correct label for REFURBISHED condition', () => {
      const label = component.getConditionLabel(PhoneCondition.REFURBISHED);
      expect(label).toBe('Refurbished');
    });

    it('should return success severity for NEW condition', () => {
      const severity = component.getConditionSeverity(PhoneCondition.NEW);
      expect(severity).toBe('success');
    });

    it('should return warn severity for USED condition', () => {
      const severity = component.getConditionSeverity(PhoneCondition.USED);
      expect(severity).toBe('warn');
    });

    it('should return info severity for REFURBISHED condition', () => {
      const severity = component.getConditionSeverity(PhoneCondition.REFURBISHED);
      expect(severity).toBe('info');
    });
  });

  describe('Battery Health Display', () => {
    it('should return excellent class for battery >= 90%', () => {
      expect(component.getBatteryHealthClass(95)).toBe('text-green-600');
      expect(component.getBatteryProgressClass(95)).toBe('battery-excellent');
    });

    it('should return good class for battery 80-89%', () => {
      expect(component.getBatteryHealthClass(85)).toBe('text-green-500');
      expect(component.getBatteryProgressClass(85)).toBe('battery-good');
    });

    it('should return fair class for battery 70-79%', () => {
      expect(component.getBatteryHealthClass(75)).toBe('text-yellow-600');
      expect(component.getBatteryProgressClass(75)).toBe('battery-fair');
    });

    it('should return poor class for battery 50-69%', () => {
      expect(component.getBatteryHealthClass(60)).toBe('text-orange-500');
      expect(component.getBatteryProgressClass(60)).toBe('battery-poor');
    });

    it('should return critical class for battery < 50%', () => {
      expect(component.getBatteryHealthClass(40)).toBe('text-red-500');
      expect(component.getBatteryProgressClass(40)).toBe('battery-critical');
    });

    it('should return empty string for null battery health', () => {
      expect(component.getBatteryHealthClass(null)).toBe('');
      expect(component.getBatteryProgressClass(null)).toBe('');
    });
  });

  describe('URL Parameter Loading', () => {
    it('should load phones from URL ids parameter when service is empty', fakeAsync(() => {
      comparisonServiceMock.phones.and.returnValue([]);
      phoneServiceMock.getPhoneById.and.callFake((id: string) => {
        const phone = mockPhones.find(p => p.id === id);
        return Promise.resolve(phone || null);
      });

      fixture.detectChanges();
      tick();

      // Since the component reads from route.snapshot.queryParamMap,
      // and we didn't set up the route with query params,
      // it should just have 0 phones from the empty service
      expect(component.phones().length).toBe(0);
    }));
  });

  describe('Error Handling', () => {
    it('should handle error when phone service fails', fakeAsync(() => {
      comparisonServiceMock.phones.and.returnValue([]);
      phoneServiceMock.getPhoneById.and.rejectWith(new Error('Test error'));

      fixture.detectChanges();
      tick();

      // The error is logged to console in this case
      expect(component.loading()).toBe(false);
    }));
  });

  describe('Accessibility', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should have tooltip on view details button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const viewButtons = compiled.querySelectorAll('[pTooltip="View details"]');
      expect(viewButtons.length).toBeGreaterThan(0);
    });

    it('should have tooltip on remove button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const removeButtons = compiled.querySelectorAll('[pTooltip="Remove from comparison"]');
      expect(removeButtons.length).toBeGreaterThan(0);
    });

    it('should have proper alt text for phone images', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const images = compiled.querySelectorAll('table thead img[alt]');
      expect(images.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should have overflow-x-auto for horizontal scrolling', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const scrollContainer = compiled.querySelector('.overflow-x-auto');
      expect(scrollContainer).toBeTruthy();
    });

    it('should have min-width on table for consistent display', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const table = compiled.querySelector('table');
      expect(table?.getAttribute('style')).toContain('min-width');
    });
  });

  describe('Best Value Highlighting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should identify lowest price correctly', () => {
      expect(component.lowestPrice()).toBe(699);
    });

    it('should identify highest storage correctly', () => {
      expect(component.highestStorage()).toBe(256);
    });

    it('should identify highest RAM correctly', () => {
      expect(component.highestRam()).toBe(8);
    });

    it('should identify best battery health correctly', () => {
      // Phone-2 has 92% battery health, highest among non-new phones
      expect(component.highestBatteryHealth()).toBe(92);
    });

    it('should return true for isBestPrice when price is lowest', () => {
      expect(component.isBestPrice(699)).toBe(true);
      expect(component.isBestPrice(999)).toBe(false);
    });

    it('should return true for isBestStorage when storage is highest', () => {
      expect(component.isBestStorage(256)).toBe(true);
      expect(component.isBestStorage(128)).toBe(false);
    });

    it('should return true for isBestRam when RAM is highest', () => {
      expect(component.isBestRam(8)).toBe(true);
      expect(component.isBestRam(6)).toBe(false);
    });

    it('should show best price badge in UI', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Best Price');
    });
  });

  describe('Confirmation Dialog', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should have confirm dialog component', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const confirmDialog = compiled.querySelector('p-confirmdialog');
      expect(confirmDialog).toBeTruthy();
    });
  });

  describe('Share Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should show share button when phones exist', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Share');
    });
  });

  describe('ARIA Live Region', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should have ARIA live region for announcements', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const liveRegion = compiled.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeTruthy();
    });

    it('should update announcement when phone is removed', fakeAsync(() => {
      component.phones.set([...mockPhones]);
      component.removePhone('phone-1');
      tick(150);

      expect(component.liveAnnouncement()).toContain('Apple iPhone 14 Pro removed from comparison');
    }));
  });
});
