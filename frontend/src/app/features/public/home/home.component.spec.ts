import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './home.component';
import { SeoService } from '../../../shared/services/seo.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockSeoService: jasmine.SpyObj<SeoService>;

  beforeEach(async () => {
    mockSeoService = jasmine.createSpyObj('SeoService', ['updateMetaTags']);

    await TestBed.configureTestingModule({
      imports: [HomeComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: SeoService, useValue: mockSeoService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have features array', () => {
    expect(component.features).toBeDefined();
    expect(component.features.length).toBe(4);
  });

  it('should have testimonials array', () => {
    expect(component.testimonials).toBeDefined();
    expect(component.testimonials.length).toBeGreaterThan(0);
  });

  it('should update SEO meta tags on init', () => {
    expect(mockSeoService.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({
        title: jasmine.stringContaining('Phone Shop'),
        url: '/'
      })
    );
  });

  it('should render hero section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.hero-section')).toBeTruthy();
  });

  it('should render features section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.features-section')).toBeTruthy();
  });

  it('should render testimonials section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.testimonials-section')).toBeTruthy();
  });

  it('should render feature cards for each feature', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const featureCards = compiled.querySelectorAll('.feature-card');
    expect(featureCards.length).toBe(4);
  });

  it('should have responsive options for carousel', () => {
    expect(component.responsiveOptions).toBeDefined();
    expect(component.responsiveOptions.length).toBeGreaterThan(0);
  });

  it('should have shop now button in hero section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heroActions = compiled.querySelector('.hero-actions');
    expect(heroActions).toBeTruthy();
  });

  describe('Hero Section AC_REDESIGN_001', () => {
    it('should have hero badge with promotional text', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const badge = compiled.querySelector('.hero-badge');
      expect(badge).toBeTruthy();
      expect(badge?.textContent).toContain('New Arrivals');
    });

    it('should have hero title with proper heading', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const title = compiled.querySelector('#hero-heading');
      expect(title).toBeTruthy();
      expect(title?.textContent).toContain('Smartphone');
    });

    it('should have hero stats section', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const stats = compiled.querySelector('.hero-stats');
      expect(stats).toBeTruthy();

      const statItems = compiled.querySelectorAll('.stat-item');
      expect(statItems.length).toBe(3);
    });

    it('should have phone device mockup', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const phoneDevice = compiled.querySelector('.phone-device');
      expect(phoneDevice).toBeTruthy();
    });

    it('should have aria-labelledby on hero section', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const heroSection = compiled.querySelector('.hero-section');
      expect(heroSection?.getAttribute('aria-labelledby')).toBe('hero-heading');
    });
  });

  describe('Features Section AC_REDESIGN_002', () => {
    it('should have visually hidden heading for screen readers', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const heading = compiled.querySelector('#features-heading');
      expect(heading).toBeTruthy();
      expect(heading?.classList.contains('sr-only')).toBeTruthy();
    });

    it('should have feature icon wrappers', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const iconWrappers = compiled.querySelectorAll('.feature-icon-wrapper');
      expect(iconWrappers.length).toBe(4);
    });

    it('should have all feature items with title and description', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const titles = compiled.querySelectorAll('.feature-title');
      const descriptions = compiled.querySelectorAll('.feature-description');
      expect(titles.length).toBe(4);
      expect(descriptions.length).toBe(4);
    });
  });

  describe('Testimonials Section AC_REDESIGN_003', () => {
    it('should have section heading', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const heading = compiled.querySelector('#testimonials-heading');
      expect(heading).toBeTruthy();
      expect(heading?.textContent).toContain('What Our Customers Say');
    });

    it('should have carousel component', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const carousel = compiled.querySelector('p-carousel');
      expect(carousel).toBeTruthy();
    });

    it('should have correct testimonial data', () => {
      expect(component.testimonials.length).toBe(5);
      expect(component.testimonials[0].name).toBe('Sarah Johnson');
      expect(component.testimonials[0].rating).toBe(5);
    });
  });

  describe('CTA Sections', () => {
    it('should have catalog CTA banner', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const ctaBanner = compiled.querySelector('.cta-banner');
      expect(ctaBanner).toBeTruthy();
    });

    it('should have contact CTA section', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const contactCta = compiled.querySelector('.contact-cta');
      expect(contactCta).toBeTruthy();
    });

    it('should have WhatsApp button in contact CTA', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const whatsappLink = compiled.querySelector('.contact-cta a[href*="wa.me"]');
      expect(whatsappLink).toBeTruthy();
    });
  });
});
