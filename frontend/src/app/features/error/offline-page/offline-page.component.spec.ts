import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OfflinePageComponent } from './offline-page.component';
import { NetworkStatusService } from '../../../core/services/network-status.service';

/**
 * Unit tests for OfflinePageComponent
 * Feature: F-020 Offline Mode and Sync
 */
describe('OfflinePageComponent', () => {
  let component: OfflinePageComponent;
  let fixture: ComponentFixture<OfflinePageComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockNetworkStatus: jasmine.SpyObj<NetworkStatusService>;
  let mockActivatedRoute: any;

  // Mutable signal
  let isOnlineSignal: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    isOnlineSignal = signal(false);

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));
    mockRouter.navigateByUrl.and.returnValue(Promise.resolve(true));

    mockNetworkStatus = jasmine.createSpyObj('NetworkStatusService', [
      'checkConnection',
      'resetFailureCount'
    ], {
      isOnline: isOnlineSignal.asReadonly()
    });

    mockNetworkStatus.checkConnection.and.returnValue(false);

    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy('get').and.returnValue(null)
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        OfflinePageComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: NetworkStatusService, useValue: mockNetworkStatus },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OfflinePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Clean up intervals
    component.ngOnDestroy();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should expose isOnline signal', () => {
      expect(component.isOnline).toBeDefined();
    });

    it('should expose isRetrying signal', () => {
      expect(component.isRetrying).toBeDefined();
      expect(component.isRetrying()).toBe(false);
    });

    it('should start connection check interval on init', fakeAsync(() => {
      // Fast forward to trigger interval
      tick(3000);
      expect(mockNetworkStatus.checkConnection).toHaveBeenCalled();
    }));
  });

  describe('offline display', () => {
    it('should show offline message when offline', () => {
      isOnlineSignal.set(false);
      fixture.detectChanges();

      const title = fixture.debugElement.query(By.css('.offline-title'));
      expect(title.nativeElement.textContent).toContain("You're Offline");
    });

    it('should show "Connection restored" message when online', () => {
      isOnlineSignal.set(true);
      fixture.detectChanges();

      const message = fixture.debugElement.query(By.css('.offline-message'));
      expect(message.nativeElement.textContent).toContain('Connection restored');
    });

    it('should show hint about cached pages', () => {
      const hint = fixture.debugElement.query(By.css('.offline-hint'));
      expect(hint.nativeElement.textContent).toContain('cache');
    });
  });

  describe('status indicator', () => {
    it('should show offline status dot when offline', () => {
      isOnlineSignal.set(false);
      fixture.detectChanges();

      const statusDot = fixture.debugElement.query(By.css('.status-dot'));
      expect(statusDot.classes['online']).toBeFalsy();
    });

    it('should show online status dot when online', () => {
      isOnlineSignal.set(true);
      fixture.detectChanges();

      const statusDot = fixture.debugElement.query(By.css('.status-dot'));
      expect(statusDot.classes['online']).toBeTruthy();
    });

    it('should show "No internet connection" text when offline', () => {
      isOnlineSignal.set(false);
      fixture.detectChanges();

      const statusText = fixture.debugElement.query(By.css('.status-text'));
      expect(statusText.nativeElement.textContent).toContain('No internet');
    });

    it('should show "Back online" text when online', () => {
      isOnlineSignal.set(true);
      fixture.detectChanges();

      const statusText = fixture.debugElement.query(By.css('.status-text'));
      expect(statusText.nativeElement.textContent).toContain('Back online');
    });
  });

  describe('retry button', () => {
    it('should show "Try Again" when offline', () => {
      isOnlineSignal.set(false);
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('p-button'));
      const retryButton = buttons[0];
      expect(retryButton.attributes['label']).toBe('Try Again');
    });

    it('should show "Go Back" when online', () => {
      isOnlineSignal.set(true);
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('p-button'));
      const retryButton = buttons[0];
      expect(retryButton.attributes['label']).toBe('Go Back');
    });

    it('should show refresh icon when offline', () => {
      isOnlineSignal.set(false);
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('p-button'));
      const retryButton = buttons[0];
      expect(retryButton.attributes['icon']).toBe('pi pi-refresh');
    });

    it('should show arrow icon when online', () => {
      isOnlineSignal.set(true);
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('p-button'));
      const retryButton = buttons[0];
      expect(retryButton.attributes['icon']).toBe('pi pi-arrow-left');
    });
  });

  describe('retry functionality', () => {
    it('should set isRetrying to true when retrying', () => {
      component.retry();

      expect(component.isRetrying()).toBe(true);
    });

    it('should check connection when retrying', () => {
      component.retry();

      expect(mockNetworkStatus.checkConnection).toHaveBeenCalled();
    });

    it('should navigate to home when online without return URL', () => {
      mockNetworkStatus.checkConnection.and.returnValue(true);
      isOnlineSignal.set(true);

      component.retry();

      expect(mockNetworkStatus.resetFailureCount).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should navigate to return URL when online with return URL', () => {
      mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue('/admin/dashboard');
      mockNetworkStatus.checkConnection.and.returnValue(true);
      isOnlineSignal.set(true);

      // Re-create component to pick up new route params
      fixture = TestBed.createComponent(OfflinePageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.retry();

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/admin/dashboard');
    });

    it('should not navigate to /offline as return URL', () => {
      mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue('/offline');
      mockNetworkStatus.checkConnection.and.returnValue(true);
      isOnlineSignal.set(true);

      // Re-create component
      fixture = TestBed.createComponent(OfflinePageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.retry();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should reset isRetrying after timeout when still offline', fakeAsync(() => {
      mockNetworkStatus.checkConnection.and.returnValue(false);

      component.retry();
      expect(component.isRetrying()).toBe(true);

      tick(1000);

      expect(component.isRetrying()).toBe(false);
    }));
  });

  describe('goToCatalog', () => {
    it('should navigate to catalog', () => {
      component.goToCatalog();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('connection check interval', () => {
    it('should check connection every 3 seconds', fakeAsync(() => {
      mockNetworkStatus.checkConnection.calls.reset();

      tick(3000);
      expect(mockNetworkStatus.checkConnection).toHaveBeenCalledTimes(1);

      tick(3000);
      expect(mockNetworkStatus.checkConnection).toHaveBeenCalledTimes(2);

      tick(3000);
      expect(mockNetworkStatus.checkConnection).toHaveBeenCalledTimes(3);
    }));

    it('should stop checking on destroy', fakeAsync(() => {
      mockNetworkStatus.checkConnection.calls.reset();

      component.ngOnDestroy();

      tick(6000);
      expect(mockNetworkStatus.checkConnection).not.toHaveBeenCalled();
    }));
  });

  describe('UI elements', () => {
    it('should have offline icon container', () => {
      const iconContainer = fixture.debugElement.query(By.css('.offline-icon-container'));
      expect(iconContainer).toBeTruthy();
    });

    it('should have pulse animation element', () => {
      const pulse = fixture.debugElement.query(By.css('.offline-pulse'));
      expect(pulse).toBeTruthy();
    });

    it('should have browse catalog button', () => {
      const buttons = fixture.debugElement.queryAll(By.css('p-button'));
      const catalogButton = buttons.find(b => b.attributes['label'] === 'Browse Catalog');
      expect(catalogButton).toBeTruthy();
    });

    it('should have large button styles', () => {
      const buttons = fixture.debugElement.queryAll(By.css('p-button'));
      buttons.forEach(button => {
        expect(button.attributes['styleClass']).toContain('p-button-lg');
      });
    });
  });

  describe('accessibility', () => {
    it('should have descriptive title', () => {
      const title = fixture.debugElement.query(By.css('.offline-title'));
      expect(title.nativeElement.textContent).toBeTruthy();
    });

    it('should have descriptive message', () => {
      const message = fixture.debugElement.query(By.css('.offline-message'));
      expect(message.nativeElement.textContent).toBeTruthy();
    });
  });
});
