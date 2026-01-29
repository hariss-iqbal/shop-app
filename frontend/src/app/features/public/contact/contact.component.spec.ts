import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PLATFORM_ID } from '@angular/core';
import { ContactComponent } from './contact.component';
import { ContactMessageService } from '../../../core/services/contact-message.service';
import { SpamPreventionService } from '../../../core/services/spam-prevention.service';
import { RecaptchaService } from '../../../core/services/recaptcha.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SeoService } from '../../../shared/services/seo.service';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';

describe('ContactComponent', () => {
  let component: ContactComponent;
  let fixture: ComponentFixture<ContactComponent>;
  let mockContactMessageService: jasmine.SpyObj<ContactMessageService>;
  let mockSpamPreventionService: jasmine.SpyObj<SpamPreventionService>;
  let mockRecaptchaService: jasmine.SpyObj<RecaptchaService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockSeoService: jasmine.SpyObj<SeoService>;

  beforeEach(async () => {
    mockContactMessageService = jasmine.createSpyObj('ContactMessageService', ['submitContactMessage']);
    mockSpamPreventionService = jasmine.createSpyObj('SpamPreventionService', [
      'isRateLimited',
      'getRemainingWaitSeconds',
      'isHoneypotFilled',
      'recordSubmission'
    ]);
    mockRecaptchaService = jasmine.createSpyObj('RecaptchaService', ['isEnabled', 'initialize', 'getToken']);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error']);
    mockSeoService = jasmine.createSpyObj('SeoService', ['updateMetaTags']);

    mockSpamPreventionService.isRateLimited.and.returnValue(false);
    mockSpamPreventionService.getRemainingWaitSeconds.and.returnValue(0);
    mockRecaptchaService.isEnabled.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [
        ContactComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        CardModule,
        InputTextModule,
        TextareaModule,
        ButtonModule,
        DividerModule,
        MessageModule,
        SkeletonModule
      ],
      providers: [
        { provide: ContactMessageService, useValue: mockContactMessageService },
        { provide: SpamPreventionService, useValue: mockSpamPreventionService },
        { provide: RecaptchaService, useValue: mockRecaptchaService },
        { provide: ToastService, useValue: mockToastService },
        { provide: SeoService, useValue: mockSeoService },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should update SEO meta tags on init', () => {
      expect(mockSeoService.updateMetaTags).toHaveBeenCalledWith({
        title: 'Contact Us',
        description: jasmine.any(String),
        url: '/contact'
      });
    });

    it('should check rate limit status on init', () => {
      expect(mockSpamPreventionService.isRateLimited).toHaveBeenCalled();
    });

    it('should initialize reCAPTCHA when enabled', async () => {
      mockRecaptchaService.isEnabled.and.returnValue(true);

      const newFixture = TestBed.createComponent(ContactComponent);
      newFixture.detectChanges();

      expect(mockRecaptchaService.initialize).toHaveBeenCalled();
      newFixture.componentInstance.ngOnDestroy();
    });
  });

  describe('Form validation', () => {
    it('should require name field', () => {
      component.contactForm.get('name')?.setValue('');
      expect(component.contactForm.get('name')?.valid).toBeFalse();

      component.contactForm.get('name')?.setValue('John Doe');
      expect(component.contactForm.get('name')?.valid).toBeTrue();
    });

    it('should require email field', () => {
      component.contactForm.get('email')?.setValue('');
      expect(component.contactForm.get('email')?.valid).toBeFalse();
    });

    it('should validate email format', () => {
      component.contactForm.get('email')?.setValue('invalid-email');
      expect(component.contactForm.get('email')?.valid).toBeFalse();

      component.contactForm.get('email')?.setValue('valid@email.com');
      expect(component.contactForm.get('email')?.valid).toBeTrue();
    });

    it('should require message field', () => {
      component.contactForm.get('message')?.setValue('');
      expect(component.contactForm.get('message')?.valid).toBeFalse();

      component.contactForm.get('message')?.setValue('Hello');
      expect(component.contactForm.get('message')?.valid).toBeTrue();
    });

    it('should not require phone field', () => {
      component.contactForm.get('phone')?.setValue('');
      expect(component.contactForm.get('phone')?.valid).toBeTrue();
    });

    it('should not require subject field', () => {
      component.contactForm.get('subject')?.setValue('');
      expect(component.contactForm.get('subject')?.valid).toBeTrue();
    });
  });

  describe('Honeypot field', () => {
    it('should have honeypot field in form (website)', () => {
      expect(component.contactForm.get('website')).toBeTruthy();
    });

    it('should not require honeypot field', () => {
      component.contactForm.get('website')?.setValue('');
      expect(component.contactForm.get('website')?.valid).toBeTrue();
    });
  });

  describe('Form submission', () => {
    beforeEach(() => {
      component.contactForm.setValue({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '',
        subject: '',
        message: 'Test message',
        website: ''
      });
    });

    it('should not submit if rate limited', async () => {
      mockSpamPreventionService.isRateLimited.and.returnValue(true);

      await component.onSubmit();

      expect(mockContactMessageService.submitContactMessage).not.toHaveBeenCalled();
      expect(component.rateLimited()).toBeTrue();
    });

    it('should not submit if form is invalid', async () => {
      component.contactForm.get('name')?.setValue('');

      await component.onSubmit();

      expect(mockContactMessageService.submitContactMessage).not.toHaveBeenCalled();
    });

    it('should submit valid form', async () => {
      mockContactMessageService.submitContactMessage.and.returnValue(Promise.resolve());

      await component.onSubmit();

      expect(mockContactMessageService.submitContactMessage).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        phone: null,
        subject: null,
        message: 'Test message',
        honeypot: ''
      });
    });

    it('should include honeypot value in submission', async () => {
      component.contactForm.get('website')?.setValue('bot-spam');
      mockContactMessageService.submitContactMessage.and.returnValue(Promise.resolve());

      await component.onSubmit();

      expect(mockContactMessageService.submitContactMessage).toHaveBeenCalledWith(
        jasmine.objectContaining({ honeypot: 'bot-spam' })
      );
    });

    it('should show success message on successful submission', async () => {
      mockContactMessageService.submitContactMessage.and.returnValue(Promise.resolve());

      await component.onSubmit();

      expect(mockToastService.success).toHaveBeenCalledWith('Message Sent', jasmine.any(String));
      expect(component.submitted()).toBeTrue();
    });

    it('should show error message on failed submission', async () => {
      mockContactMessageService.submitContactMessage.and.rejectWith(new Error('Network error'));

      await component.onSubmit();

      expect(mockToastService.error).toHaveBeenCalledWith('Error', 'Network error');
      expect(component.submitted()).toBeFalse();
    });

    it('should set submitting state during submission', async () => {
      let resolvePromise: () => void;
      const submitPromise = new Promise<void>(resolve => {
        resolvePromise = resolve;
      });
      mockContactMessageService.submitContactMessage.and.returnValue(submitPromise);

      const submitTask = component.onSubmit();
      expect(component.submitting()).toBeTrue();

      resolvePromise!();
      await submitTask;
      expect(component.submitting()).toBeFalse();
    });
  });

  describe('Rate limit countdown', () => {
    it('should start countdown when rate limited', fakeAsync(() => {
      mockSpamPreventionService.isRateLimited.and.returnValue(true);
      mockSpamPreventionService.getRemainingWaitSeconds.and.returnValue(120);

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.rateLimited()).toBeTrue();
      expect(component.rateLimitCountdown()).toBe(120);

      component.ngOnDestroy();
    }));

    it('should format countdown correctly', () => {
      expect(component.formatCountdown(120)).toBe('2:00');
      expect(component.formatCountdown(65)).toBe('1:05');
      expect(component.formatCountdown(30)).toBe('30 seconds');
      expect(component.formatCountdown(1)).toBe('1 second');
      expect(component.formatCountdown(0)).toBe('0 seconds');
    });
  });

  describe('Reset form', () => {
    it('should reset submitted state', () => {
      component.submitted.set(true);

      component.resetForm();

      expect(component.submitted()).toBeFalse();
    });

    it('should reset form values', () => {
      component.contactForm.setValue({
        name: 'John',
        email: 'john@test.com',
        phone: '123',
        subject: 'Test',
        message: 'Hello',
        website: ''
      });

      component.resetForm();

      expect(component.contactForm.get('name')?.value).toBeNull();
      expect(component.contactForm.get('email')?.value).toBeNull();
    });

    it('should check rate limit status after reset', () => {
      mockSpamPreventionService.isRateLimited.calls.reset();

      component.resetForm();

      expect(mockSpamPreventionService.isRateLimited).toHaveBeenCalled();
    });
  });

  describe('isInvalid helper', () => {
    it('should return false for valid field', () => {
      component.contactForm.get('name')?.setValue('John');
      component.contactForm.get('name')?.markAsTouched();

      expect(component.isInvalid('name')).toBeFalse();
    });

    it('should return true for invalid touched field', () => {
      component.contactForm.get('name')?.setValue('');
      component.contactForm.get('name')?.markAsTouched();

      expect(component.isInvalid('name')).toBeTrue();
    });

    it('should return false for invalid but untouched field', () => {
      component.contactForm.get('name')?.setValue('');

      expect(component.isInvalid('name')).toBeFalse();
    });
  });

  describe('Google Maps Embed', () => {
    it('should have map embed URL from business info', () => {
      expect(component.mapEmbedUrl).toBeTruthy();
    });

    it('should have business info with map URLs', () => {
      expect(component.businessInfo.mapEmbedUrl).toBeTruthy();
      expect(component.businessInfo.mapSearchUrl).toBeTruthy();
    });

    it('should initialize with mapVisible as false', () => {
      expect(component.mapVisible()).toBeFalse();
    });

    it('should initialize with mapLoading as true', () => {
      expect(component.mapLoading()).toBeTrue();
    });

    it('should initialize with mapLoadFailed as false', () => {
      expect(component.mapLoadFailed()).toBeFalse();
    });

    it('should set mapLoadFailed to true on map load error', () => {
      component.onMapLoadError();

      expect(component.mapLoadFailed()).toBeTrue();
      expect(component.mapLoading()).toBeFalse();
    });

    it('should set mapLoading to false on successful map load', () => {
      component.mapVisible.set(true);
      component.onMapLoad();

      expect(component.mapLoading()).toBeFalse();
      expect(component.mapLoadFailed()).toBeFalse();
    });

    it('should display fallback when map fails to load', () => {
      component.mapLoadFailed.set(true);
      fixture.detectChanges();

      const fallback = fixture.nativeElement.querySelector('.map-fallback');
      expect(fallback).toBeTruthy();
    });

    it('should display fallback text when map fails', () => {
      component.mapLoadFailed.set(true);
      fixture.detectChanges();

      const fallbackText = fixture.nativeElement.querySelector('.map-fallback-text');
      expect(fallbackText).toBeTruthy();
      expect(fallbackText.textContent).toContain('unavailable');
    });

    it('should have link to Google Maps in fallback', () => {
      component.mapLoadFailed.set(true);
      fixture.detectChanges();

      const link = fixture.nativeElement.querySelector('.map-fallback-link');
      expect(link).toBeTruthy();
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.textContent).toContain('Google Maps');
    });

    it('should show map container when not failed', () => {
      component.mapLoadFailed.set(false);
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.map-container');
      expect(container).toBeTruthy();
    });

    it('should have accessible region label on map container', () => {
      component.mapLoadFailed.set(false);
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.map-container[role="region"]');
      expect(container).toBeTruthy();
      expect(container.getAttribute('aria-label')).toContain('map');
    });

    it('should have accessible region label on fallback', () => {
      component.mapLoadFailed.set(true);
      fixture.detectChanges();

      const fallback = fixture.nativeElement.querySelector('.map-fallback');
      expect(fallback).toBeTruthy();
      expect(fallback.getAttribute('role')).toBe('region');
      expect(fallback.getAttribute('aria-label')).toContain('location');
    });

    it('should display physical address in fallback', () => {
      component.mapLoadFailed.set(true);
      fixture.detectChanges();

      const address = fixture.nativeElement.querySelector('.map-fallback-address');
      expect(address).toBeTruthy();
      expect(address.textContent).toContain(component.businessInfo.address);
    });

    it('should have loading="lazy" attribute on iframe', () => {
      component.mapLoadFailed.set(false);
      component.mapVisible.set(true);
      fixture.detectChanges();

      const iframe = fixture.nativeElement.querySelector('.map-iframe');
      expect(iframe).toBeTruthy();
      expect(iframe.getAttribute('loading')).toBe('lazy');
    });
  });

  describe('Lazy Loading with Intersection Observer', () => {
    let observerCallback: IntersectionObserverCallback | null = null;
    let mockObserverInstance: { observe: jasmine.Spy; disconnect: jasmine.Spy };
    let originalIntersectionObserver: typeof IntersectionObserver;

    beforeEach(() => {
      originalIntersectionObserver = window.IntersectionObserver;

      mockObserverInstance = {
        observe: jasmine.createSpy('observe'),
        disconnect: jasmine.createSpy('disconnect')
      };

      class MockIntersectionObserver {
        constructor(callback: IntersectionObserverCallback) {
          observerCallback = callback;
        }
        observe = mockObserverInstance.observe;
        disconnect = mockObserverInstance.disconnect;
        unobserve = jasmine.createSpy('unobserve');
        takeRecords = jasmine.createSpy('takeRecords').and.returnValue([]);
        root = null;
        rootMargin = '';
        thresholds = [];
      }

      (window as any).IntersectionObserver = MockIntersectionObserver;
    });

    afterEach(() => {
      window.IntersectionObserver = originalIntersectionObserver;
      observerCallback = null;
    });

    it('should create IntersectionObserver on init', () => {
      const newFixture = TestBed.createComponent(ContactComponent);
      newFixture.detectChanges();

      expect(mockObserverInstance.observe).toHaveBeenCalled();

      newFixture.componentInstance.ngOnDestroy();
    });

    it('should set mapVisible to true when map container enters viewport', fakeAsync(() => {
      const newFixture = TestBed.createComponent(ContactComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.mapVisible()).toBeFalse();

      // Simulate intersection
      if (observerCallback) {
        observerCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      }
      tick();

      expect(newComponent.mapVisible()).toBeTrue();

      newComponent.ngOnDestroy();
      discardPeriodicTasks();
    }));

    it('should disconnect observer after map becomes visible', fakeAsync(() => {
      const newFixture = TestBed.createComponent(ContactComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      if (observerCallback) {
        observerCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      }
      tick();

      expect(mockObserverInstance.disconnect).toHaveBeenCalled();

      newComponent.ngOnDestroy();
      discardPeriodicTasks();
    }));

    it('should not set mapVisible when not intersecting', fakeAsync(() => {
      const newFixture = TestBed.createComponent(ContactComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      if (observerCallback) {
        observerCallback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
      }
      tick();

      expect(newComponent.mapVisible()).toBeFalse();

      newComponent.ngOnDestroy();
      discardPeriodicTasks();
    }));

    it('should cleanup observer on destroy', () => {
      const newFixture = TestBed.createComponent(ContactComponent);
      newFixture.detectChanges();

      newFixture.componentInstance.ngOnDestroy();

      expect(mockObserverInstance.disconnect).toHaveBeenCalled();
    });
  });

  describe('Map Load Timeout', () => {
    it('should set mapLoadFailed after timeout if map does not load', fakeAsync(() => {
      component.mapVisible.set(true);
      (component as any).startMapLoadTimeout();

      expect(component.mapLoadFailed()).toBeFalse();

      tick(10000); // 10 second timeout

      expect(component.mapLoadFailed()).toBeTrue();
      expect(component.mapLoading()).toBeFalse();
    }));

    it('should clear timeout on successful load', fakeAsync(() => {
      component.mapVisible.set(true);
      (component as any).startMapLoadTimeout();

      tick(5000); // Partial time
      component.onMapLoad();

      tick(5000); // Remaining time

      // Should not be failed because we called onMapLoad before timeout
      expect(component.mapLoadFailed()).toBeFalse();
    }));

    it('should clear timeout on error', fakeAsync(() => {
      component.mapVisible.set(true);
      (component as any).startMapLoadTimeout();

      tick(5000);
      component.onMapLoadError();

      expect(component.mapLoadFailed()).toBeTrue();
      // No need to wait for timeout since error already handled
    }));
  });
});
