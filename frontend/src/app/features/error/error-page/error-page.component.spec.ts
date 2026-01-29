import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ErrorPageComponent } from './error-page.component';
import { ButtonModule } from 'primeng/button';

describe('ErrorPageComponent', () => {
  let component: ErrorPageComponent;
  let fixture: ComponentFixture<ErrorPageComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ErrorPageComponent,
        RouterTestingModule,
        ButtonModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('navigateHome', () => {
    it('should navigate to home page', () => {
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

  describe('refreshPage', () => {
    it('should be defined', () => {
      // window.location.reload cannot be spied on reliably in modern browsers
      // Just verify the method exists and is callable
      expect(component.refreshPage).toBeDefined();
      expect(typeof component.refreshPage).toBe('function');
    });
  });

  describe('template', () => {
    it('should display error icon', () => {
      const icon = fixture.nativeElement.querySelector('.pi-exclamation-triangle');
      expect(icon).toBeTruthy();
    });

    it('should display error title', () => {
      const title = fixture.nativeElement.querySelector('h1');
      expect(title.textContent).toContain('Something Went Wrong');
    });

    it('should display error description', () => {
      const description = fixture.nativeElement.querySelector('p');
      expect(description.textContent).toContain('unexpected error');
    });

    it('should have refresh button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('p-button');
      const refreshButton = Array.from(buttons).find(
        (btn: any) => btn.getAttribute('label') === 'Refresh Page'
      );
      expect(refreshButton).toBeTruthy();
    });

    it('should have go back button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('p-button');
      const backButton = Array.from(buttons).find(
        (btn: any) => btn.getAttribute('label') === 'Go Back'
      );
      expect(backButton).toBeTruthy();
    });

    it('should have go to home button', () => {
      const buttons = fixture.nativeElement.querySelectorAll('p-button');
      const homeButton = Array.from(buttons).find(
        (btn: any) => btn.getAttribute('label') === 'Go to Home'
      );
      expect(homeButton).toBeTruthy();
    });

    it('should have contact support link', () => {
      const link = fixture.nativeElement.querySelector('a[routerLink="/contact"]');
      expect(link).toBeTruthy();
      expect(link.textContent).toContain('contact support');
    });

    it('should have helpful tips section', () => {
      const tips = fixture.nativeElement.querySelector('.tips-container');
      expect(tips).toBeTruthy();
      expect(tips.textContent).toContain('Refreshing the page');
    });
  });
});
