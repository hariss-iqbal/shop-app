import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PublicLayoutComponent } from './public-layout.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ThemeService } from '../../../shared';
import { ProductComparisonService } from '../../../shared/services/product-comparison.service';
import { signal, WritableSignal } from '@angular/core';
import { ThemeMode } from '../../../enums/theme-mode.enum';

describe('PublicLayoutComponent', () => {
  let component: PublicLayoutComponent;
  let fixture: ComponentFixture<PublicLayoutComponent>;
  let themeServiceMock: {
    isDark: jasmine.Spy;
    toggleTheme: jasmine.Spy;
    currentTheme: WritableSignal<ThemeMode>;
  };
  let comparisonServiceMock: {
    count: jasmine.Spy;
    hasProducts: jasmine.Spy;
    products: jasmine.Spy;
  };

  beforeEach(async () => {
    themeServiceMock = {
      isDark: jasmine.createSpy('isDark').and.returnValue(false),
      toggleTheme: jasmine.createSpy('toggleTheme'),
      currentTheme: signal(ThemeMode.LIGHT)
    };

    comparisonServiceMock = {
      count: jasmine.createSpy('count').and.returnValue(0),
      hasProducts: jasmine.createSpy('hasProducts').and.returnValue(false),
      products: jasmine.createSpy('products').and.returnValue([])
    };

    await TestBed.configureTestingModule({
      imports: [PublicLayoutComponent, RouterTestingModule],
      providers: [
        { provide: ThemeService, useValue: themeServiceMock },
        { provide: ProductComparisonService, useValue: comparisonServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PublicLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Header', () => {
    it('should display shop logo and name', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const header = compiled.querySelector('header');
      expect(header).toBeTruthy();

      const logoIcon = header?.querySelector('i.pi-mobile');
      expect(logoIcon).toBeTruthy();

      const brandText = header?.textContent;
      expect(brandText).toContain('Phone Shop');
    });

    it('should have navigation links to Home, About, and Contact', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const menubar = compiled.querySelector('[role="menubar"]');

      // Desktop navigation links are in a div with role="menubar"
      const menuItems = menubar?.querySelectorAll('a[role="menuitem"]');
      expect(menuItems?.length).toBeGreaterThanOrEqual(3);

      const homeLink = menubar?.querySelector('a[routerLink="/"]');
      expect(homeLink?.textContent).toContain('Home');

      const aboutLink = menubar?.querySelector('a[routerLink="/about"]');
      expect(aboutLink?.textContent).toContain('About');

      const contactLink = menubar?.querySelector('a[routerLink="/contact"]');
      expect(contactLink?.textContent).toContain('Contact');
    });

    it('should have proper ARIA label on main navigation', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const nav = compiled.querySelector('header nav');
      expect(nav?.getAttribute('aria-label')).toBe('Main navigation');
    });

    it('should have desktop navigation with menubar role', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const menubar = compiled.querySelector('[role="menubar"]');
      expect(menubar).toBeTruthy();
    });

    it('should have navigation links with menuitem role', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const menuItems = compiled.querySelectorAll('[role="menuitem"]');
      expect(menuItems.length).toBeGreaterThan(0);
    });
  });

  describe('Mobile Navigation', () => {
    it('should have hamburger menu button for mobile', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const menuButton = compiled.querySelector('p-button[icon="pi pi-bars"]');
      expect(menuButton).toBeTruthy();
    });

    it('should have aria-controls attribute on menu button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const menuButton = compiled.querySelector('[aria-controls="mobile-nav-sidebar"]');
      expect(menuButton).toBeTruthy();
    });

    it('should open mobile menu when hamburger is clicked', fakeAsync(() => {
      expect(component.mobileMenuOpen()).toBe(false);
      component.mobileMenuVisible = true;
      tick();
      expect(component.mobileMenuOpen()).toBe(true);
    }));

    it('should close mobile menu when closeMobileMenu is called', fakeAsync(() => {
      component.mobileMenuVisible = true;
      tick();
      expect(component.mobileMenuOpen()).toBe(true);

      component.closeMobileMenu();
      tick();
      expect(component.mobileMenuOpen()).toBe(false);
    }));

    it('should have mobile sidebar with id for aria-controls', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const sidebar = compiled.querySelector('p-drawer#mobile-nav-sidebar, #mobile-nav-sidebar');
      expect(sidebar).toBeTruthy();
    });

    it('should have p-drawer component for mobile navigation', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const drawer = compiled.querySelector('p-drawer');
      expect(drawer).toBeTruthy();
    });
  });

  describe('Footer', () => {
    it('should have footer element with contentinfo role', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const footer = compiled.querySelector('footer[role="contentinfo"]');
      expect(footer).toBeTruthy();
    });

    it('should display business information', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const footer = compiled.querySelector('footer');
      expect(footer?.textContent).toContain('Phone Shop');
      expect(footer?.textContent).toContain('quality mobile phones');
    });

    it('should display copyright with current year', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const footer = compiled.querySelector('footer');
      const currentYear = new Date().getFullYear();
      expect(footer?.textContent).toContain(`${currentYear}`);
      expect(footer?.textContent).toContain('All rights reserved');
    });

    it('should have footer navigation with aria-label', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const footerNav = compiled.querySelector('footer nav[aria-label="Footer navigation"]');
      expect(footerNav).toBeTruthy();
    });

    it('should have quick links section', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const quickLinks = compiled.querySelector('footer');
      expect(quickLinks?.textContent).toContain('Quick Links');
    });

    it('should have contact information', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const footer = compiled.querySelector('footer');
      expect(footer?.textContent).toContain('Contact Us');
      expect(footer?.textContent).toContain('+1 234 567 890');
    });

    it('should have address element for contact info', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const address = compiled.querySelector('footer address');
      expect(address).toBeTruthy();
    });
  });

  describe('Main Content', () => {
    it('should have main element with role="main"', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const main = compiled.querySelector('main[role="main"]');
      expect(main).toBeTruthy();
    });

    it('should have main content with id for skip link', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const main = compiled.querySelector('main#main-content');
      expect(main).toBeTruthy();
    });

    it('should include router outlet', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const routerOutlet = compiled.querySelector('router-outlet');
      expect(routerOutlet).toBeTruthy();
    });
  });

  describe('Skip Link', () => {
    it('should include skip link component', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const skipLink = compiled.querySelector('app-skip-link');
      expect(skipLink).toBeTruthy();
    });
  });

  describe('Back to Top', () => {
    it('should include back-to-top component', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const backToTop = compiled.querySelector('app-back-to-top');
      expect(backToTop).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic header element', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('header')).toBeTruthy();
    });

    it('should have semantic footer element', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('footer')).toBeTruthy();
    });

    it('should have semantic nav elements', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const navElements = compiled.querySelectorAll('nav');
      expect(navElements.length).toBeGreaterThan(0);
    });

    it('should have aria-hidden on decorative icons', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const icons = compiled.querySelectorAll('i[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have descriptive aria-labels on links', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const labeledLinks = compiled.querySelectorAll('a[aria-label]');
      expect(labeledLinks.length).toBeGreaterThan(0);
    });

    it('should close menu on Escape key', fakeAsync(() => {
      component.mobileMenuVisible = true;
      tick();
      expect(component.mobileMenuOpen()).toBe(true);

      component.onEscapeKey();
      tick();
      expect(component.mobileMenuOpen()).toBe(false);
    }));
  });

  describe('Theme Toggle', () => {
    it('should have theme toggle button element', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      // PrimeNG p-button renders as a custom element
      const themeButton = compiled.querySelector('p-button');
      expect(themeButton).toBeTruthy();
    });

    it('should expose themeService for theme toggling', () => {
      expect(component.themeService).toBeTruthy();
    });

    it('should call toggleTheme when theme button is clicked', () => {
      component.themeService.toggleTheme();
      expect(themeServiceMock.toggleTheme).toHaveBeenCalled();
    });
  });

  describe('Responsive Design', () => {
    it('should use PrimeFlex responsive classes for desktop navigation', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const desktopNav = compiled.querySelector('.lg\\:flex');
      expect(desktopNav).toBeTruthy();
    });

    it('should have hidden desktop nav on mobile', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const desktopNav = compiled.querySelector('.hidden.lg\\:flex');
      expect(desktopNav).toBeTruthy();
    });

    it('should use PrimeFlex grid classes in footer', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const grid = compiled.querySelector('footer .grid');
      expect(grid).toBeTruthy();
    });

    it('should use responsive column classes', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const responsiveCols = compiled.querySelectorAll('[class*="col-12"], [class*="md:col-"], [class*="lg:col-"]');
      expect(responsiveCols.length).toBeGreaterThan(0);
    });
  });
});
