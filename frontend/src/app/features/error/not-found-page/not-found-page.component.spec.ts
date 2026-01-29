import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NotFoundPageComponent } from './not-found-page.component';
import { ButtonModule } from 'primeng/button';

describe('NotFoundPageComponent', () => {
  let component: NotFoundPageComponent;
  let fixture: ComponentFixture<NotFoundPageComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NotFoundPageComponent,
        RouterTestingModule,
        ButtonModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('navigateHome', () => {
    it('should navigate to home page (catalog)', () => {
      const navigateSpy = spyOn(router, 'navigate');

      component.navigateHome();

      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });
  });

  describe('navigateBack', () => {
    it('should call window.history.back', () => {
      const historySpy = spyOn(window.history, 'back');

      component.navigateBack();

      expect(historySpy).toHaveBeenCalled();
    });
  });

  describe('template - F-059 acceptance criteria', () => {
    it('should display 404 error code', () => {
      const errorCode = fixture.nativeElement.querySelector('h1');
      expect(errorCode).toBeTruthy();
      expect(errorCode.textContent).toContain('404');
    });

    it('should display a friendly "Page Not Found" message', () => {
      const heading = fixture.nativeElement.querySelector('h2');
      expect(heading).toBeTruthy();
      expect(heading.textContent).toContain('Page Not Found');
    });

    it('should display a helpful description message', () => {
      const description = fixture.nativeElement.querySelector('.not-found-description');
      expect(description).toBeTruthy();
      expect(description.textContent.length).toBeGreaterThan(10);
    });

    it('should have a link/button to return to home catalog page', () => {
      const homeButton = fixture.nativeElement.querySelector('[aria-label="Return to the catalog home page"]');
      expect(homeButton).toBeTruthy();
    });

    it('should have a "Back to Catalog" button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('p-button');
      const catalogButton = Array.from(buttons).find(
        (btn: any) => btn.getAttribute('label') === 'Back to Catalog'
      );
      expect(catalogButton).toBeTruthy();
    });

    it('should have a "Go Back" button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('p-button');
      const backButton = Array.from(buttons).find(
        (btn: any) => btn.getAttribute('label') === 'Go Back'
      );
      expect(backButton).toBeTruthy();
    });

    it('should display the 404 icon', () => {
      const icon = fixture.nativeElement.querySelector('.icon-circle .pi-search');
      expect(icon).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should have proper aria-hidden on decorative icon', () => {
      const icon = fixture.nativeElement.querySelector('.icon-circle .pi-search');
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });

    it('should have proper aria-label on home button', () => {
      const homeButton = fixture.nativeElement.querySelector('[aria-label="Return to the catalog home page"]');
      expect(homeButton).toBeTruthy();
    });

    it('should have proper aria-label on back button', () => {
      const backButton = fixture.nativeElement.querySelector('[aria-label="Go back to the previous page"]');
      expect(backButton).toBeTruthy();
    });
  });
});
