import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { AboutComponent } from './about.component';
import { SeoService } from '../../../shared/services/seo.service';
import { ButtonModule } from 'primeng/button';

describe('AboutComponent', () => {
  let component: AboutComponent;
  let fixture: ComponentFixture<AboutComponent>;
  let mockSeoService: jasmine.SpyObj<SeoService>;

  beforeEach(async () => {
    mockSeoService = jasmine.createSpyObj('SeoService', ['updateMetaTags']);

    await TestBed.configureTestingModule({
      imports: [
        AboutComponent,
        NoopAnimationsModule,
        RouterTestingModule,
        ButtonModule
      ],
      providers: [
        { provide: SeoService, useValue: mockSeoService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AboutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should update SEO meta tags on init', () => {
      expect(mockSeoService.updateMetaTags).toHaveBeenCalledWith({
        title: 'About Us',
        description: 'Learn about Phone Shop - your trusted source for new, used, and refurbished phones since 2015. Quality assured, transparent pricing, and exceptional customer service.',
        url: '/about'
      });
    });

    it('should have values array with 4 items', () => {
      expect(component.values.length).toBe(4);
    });

    it('should have teamMembers array with 3 members', () => {
      expect(component.teamMembers.length).toBe(3);
    });

    it('should have openingHours array with 7 days', () => {
      expect(component.openingHours.length).toBe(7);
    });
  });

  describe('Template rendering', () => {
    describe('Hero Section', () => {
      it('should display page title', () => {
        const titleElement = fixture.nativeElement.querySelector('h1');
        expect(titleElement).toBeTruthy();
        expect(titleElement.textContent).toContain('About Phone Shop');
      });

      it('should display hero badge', () => {
        const badge = fixture.nativeElement.querySelector('.hero-badge');
        expect(badge).toBeTruthy();
        expect(badge.textContent).toContain('Our Story');
      });

      it('should display hero subtitle', () => {
        const subtitle = fixture.nativeElement.querySelector('.hero-subtitle');
        expect(subtitle).toBeTruthy();
        expect(subtitle.textContent).toContain('trusted destination');
      });
    });

    describe('Brand Story Section', () => {
      it('should display story section', () => {
        const storySection = fixture.nativeElement.querySelector('.story-section');
        expect(storySection).toBeTruthy();
      });

      it('should display story heading', () => {
        const heading = fixture.nativeElement.querySelector('#story-heading');
        expect(heading).toBeTruthy();
        expect(heading.textContent).toContain('From Passion to Purpose');
      });

      it('should display story text paragraphs', () => {
        const paragraphs = fixture.nativeElement.querySelectorAll('.story-text');
        expect(paragraphs.length).toBe(3);
      });

      it('should display visual stats', () => {
        const stats = fixture.nativeElement.querySelectorAll('.visual-stat');
        expect(stats.length).toBe(3);
      });
    });

    describe('Values Section', () => {
      it('should display values section', () => {
        const valuesSection = fixture.nativeElement.querySelector('.values-section');
        expect(valuesSection).toBeTruthy();
      });

      it('should display all value cards', () => {
        const valueCards = fixture.nativeElement.querySelectorAll('.value-card');
        expect(valueCards.length).toBe(4);
      });

      it('should display value titles', () => {
        const content = fixture.nativeElement.textContent;
        expect(content).toContain('Quality Assured');
        expect(content).toContain('Transparent Pricing');
        expect(content).toContain('Customer First');
        expect(content).toContain('Built on Trust');
      });
    });

    describe('Team Section', () => {
      it('should display team section', () => {
        const teamSection = fixture.nativeElement.querySelector('.team-section');
        expect(teamSection).toBeTruthy();
      });

      it('should display team heading', () => {
        const heading = fixture.nativeElement.querySelector('#team-heading');
        expect(heading).toBeTruthy();
        expect(heading.textContent).toContain('Meet Our Team');
      });

      it('should display all team cards', () => {
        const teamCards = fixture.nativeElement.querySelectorAll('.team-card');
        expect(teamCards.length).toBe(3);
      });

      it('should display team member names', () => {
        const content = fixture.nativeElement.textContent;
        expect(content).toContain('Ahmed Hassan');
        expect(content).toContain('Sarah Miller');
        expect(content).toContain('James Wilson');
      });

      it('should display team member roles', () => {
        const content = fixture.nativeElement.textContent;
        expect(content).toContain('Founder & CEO');
        expect(content).toContain('Operations Manager');
        expect(content).toContain('Technical Lead');
      });
    });

    describe('Opening Hours Section', () => {
      it('should display opening hours section', () => {
        const content = fixture.nativeElement.textContent;
        expect(content).toContain('Opening Hours');
      });

      it('should display all days of the week', () => {
        const content = fixture.nativeElement.textContent;
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        days.forEach(day => {
          expect(content).toContain(day);
        });
      });

      it('should display hours rows', () => {
        const hoursRows = fixture.nativeElement.querySelectorAll('.hours-row');
        expect(hoursRows.length).toBe(7);
      });

      it('should indicate Sunday as closed', () => {
        const closedElement = fixture.nativeElement.querySelector('.hours-closed');
        expect(closedElement).toBeTruthy();
        expect(closedElement.textContent.trim()).toBe('Closed');
      });
    });

    describe('Contact Info Section', () => {
      it('should display contact section title', () => {
        const content = fixture.nativeElement.textContent;
        expect(content).toContain('Visit Us');
      });

      it('should display address', () => {
        const content = fixture.nativeElement.textContent;
        expect(content).toContain('123 Mobile Street');
      });

      it('should display phone number', () => {
        const phoneLink = fixture.nativeElement.querySelector('a[href^="tel:"]');
        expect(phoneLink).toBeTruthy();
      });

      it('should display email address', () => {
        const emailLink = fixture.nativeElement.querySelector('a[href^="mailto:"]');
        expect(emailLink).toBeTruthy();
      });

      it('should display WhatsApp link', () => {
        const whatsappLink = fixture.nativeElement.querySelector('a[href*="wa.me"]');
        expect(whatsappLink).toBeTruthy();
      });
    });

    describe('CTA Section', () => {
      it('should have call to action section', () => {
        const content = fixture.nativeElement.textContent;
        expect(content).toContain('Ready to Find Your Perfect Phone');
      });

      it('should have browse catalog button', () => {
        const catalogLink = fixture.nativeElement.querySelector('a[routerLink="/"]');
        expect(catalogLink).toBeTruthy();
      });

      it('should have contact us button', () => {
        const contactLink = fixture.nativeElement.querySelector('a[routerLink="/contact"]');
        expect(contactLink).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have aria-hidden on decorative icons', () => {
      const decorativeIcons = fixture.nativeElement.querySelectorAll('i[aria-hidden="true"]');
      expect(decorativeIcons.length).toBeGreaterThan(0);
    });

    it('should have aria-label on phone link', () => {
      const phoneLink = fixture.nativeElement.querySelector('a[href^="tel:"]');
      expect(phoneLink?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-label on email link', () => {
      const emailLink = fixture.nativeElement.querySelector('a[href^="mailto:"]');
      expect(emailLink?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-label on WhatsApp link', () => {
      const whatsappLink = fixture.nativeElement.querySelector('a[href*="wa.me"]');
      expect(whatsappLink?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have proper heading hierarchy', () => {
      const h1 = fixture.nativeElement.querySelector('h1');
      const h2s = fixture.nativeElement.querySelectorAll('h2');
      const h3s = fixture.nativeElement.querySelectorAll('h3');

      expect(h1).toBeTruthy();
      expect(h2s.length).toBeGreaterThan(0);
      expect(h3s.length).toBeGreaterThan(0);
    });

    it('should have rel="noopener noreferrer" on external links', () => {
      const whatsappLink = fixture.nativeElement.querySelector('a[href*="wa.me"]');
      expect(whatsappLink?.getAttribute('rel')).toContain('noopener');
      expect(whatsappLink?.getAttribute('rel')).toContain('noreferrer');
    });

    it('should have target="_blank" on WhatsApp link', () => {
      const whatsappLink = fixture.nativeElement.querySelector('a[href*="wa.me"]');
      expect(whatsappLink?.getAttribute('target')).toBe('_blank');
    });

    it('should have aria-labelledby on sections', () => {
      const heroSection = fixture.nativeElement.querySelector('.about-hero');
      expect(heroSection?.getAttribute('aria-labelledby')).toBe('hero-heading');

      const storySection = fixture.nativeElement.querySelector('.story-section');
      expect(storySection?.getAttribute('aria-labelledby')).toBe('story-heading');

      const valuesSection = fixture.nativeElement.querySelector('.values-section');
      expect(valuesSection?.getAttribute('aria-labelledby')).toBe('values-heading');

      const teamSection = fixture.nativeElement.querySelector('.team-section');
      expect(teamSection?.getAttribute('aria-labelledby')).toBe('team-heading');
    });

    it('should have role="list" on hours list', () => {
      const hoursList = fixture.nativeElement.querySelector('.hours-list');
      expect(hoursList?.getAttribute('role')).toBe('list');
    });

    it('should have role="listitem" on hours rows', () => {
      const hoursRows = fixture.nativeElement.querySelectorAll('.hours-row');
      hoursRows.forEach((row: Element) => {
        expect(row.getAttribute('role')).toBe('listitem');
      });
    });
  });

  describe('Responsive design', () => {
    it('should use grid layout', () => {
      const gridContainers = fixture.nativeElement.querySelectorAll('.grid');
      expect(gridContainers.length).toBeGreaterThan(0);
    });

    it('should have responsive columns for values grid', () => {
      const valuesGrid = fixture.nativeElement.querySelector('.values-grid');
      expect(valuesGrid).toBeTruthy();
    });

    it('should have responsive columns for team grid', () => {
      const teamGrid = fixture.nativeElement.querySelector('.team-grid');
      expect(teamGrid).toBeTruthy();
    });

    it('should have responsive columns for info sections', () => {
      const infoColumns = fixture.nativeElement.querySelectorAll('.col-12.lg\\:col-6');
      // Story section has 2 columns + Info section has 2 columns = 4 total
      expect(infoColumns.length).toBe(4);
    });
  });

  describe('Data Structure', () => {
    it('should have correct value item structure', () => {
      component.values.forEach(value => {
        expect(value.icon).toBeTruthy();
        expect(value.iconClass).toBeTruthy();
        expect(value.title).toBeTruthy();
        expect(value.description).toBeTruthy();
      });
    });

    it('should have correct team member structure', () => {
      component.teamMembers.forEach(member => {
        expect(member.name).toBeTruthy();
        expect(member.initials).toBeTruthy();
        expect(member.role).toBeTruthy();
        expect(member.bio).toBeTruthy();
      });
    });

    it('should have correct opening hours structure', () => {
      component.openingHours.forEach(day => {
        expect(day.day).toBeTruthy();
        expect(typeof day.closed).toBe('boolean');
        if (!day.closed) {
          expect(day.hours).toBeTruthy();
        }
      });
    });

    it('should have Sunday marked as closed', () => {
      const sunday = component.openingHours.find(day => day.day === 'Sunday');
      expect(sunday?.closed).toBeTrue();
    });
  });
});
