import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { SupabaseAuthService } from '../services/supabase-auth.service';
import { signal, WritableSignal } from '@angular/core';
import { firstValueFrom, isObservable } from 'rxjs';

describe('Auth Guards', () => {
  let mockAuthService: {
    loading: WritableSignal<boolean>;
    isAuthenticated: WritableSignal<boolean>;
  };
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    mockAuthService = {
      loading: signal(false),
      isAuthenticated: signal(false)
    };

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/admin/dashboard' } as RouterStateSnapshot;

    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseAuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  describe('authGuard', () => {
    it('should allow access when user is authenticated', () => {
      mockAuthService.isAuthenticated.set(true);

      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should redirect to login when user is not authenticated', () => {
      mockAuthService.isAuthenticated.set(false);

      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/admin/dashboard' }
      });
    });

    it('should pass correct return URL to login page', () => {
      mockAuthService.isAuthenticated.set(false);
      mockState = { url: '/admin/inventory/edit/123' } as RouterStateSnapshot;

      TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/admin/inventory/edit/123' }
      });
    });

    it('should return observable when loading is true', () => {
      mockAuthService.loading.set(true);

      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      expect(isObservable(result)).toBe(true);
    });

    it('should resolve to true when loading completes and user is authenticated', async () => {
      mockAuthService.loading.set(true);
      mockAuthService.isAuthenticated.set(true);

      const result$ = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      // Simulate loading completion
      setTimeout(() => {
        mockAuthService.loading.set(false);
      }, 10);

      if (isObservable(result$)) {
        const result = await firstValueFrom(result$);
        expect(result).toBe(true);
      } else {
        fail('Expected an observable when loading is true');
      }
    });

    it('should redirect when loading completes and user is not authenticated', async () => {
      mockAuthService.loading.set(true);
      mockAuthService.isAuthenticated.set(false);

      const result$ = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      // Simulate loading completion
      setTimeout(() => {
        mockAuthService.loading.set(false);
      }, 10);

      if (isObservable(result$)) {
        const result = await firstValueFrom(result$);
        expect(result).toBe(false);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login'], {
          queryParams: { returnUrl: '/admin/dashboard' }
        });
      } else {
        fail('Expected an observable when loading is true');
      }
    });
  });

  describe('guestGuard', () => {
    it('should allow access when user is not authenticated', () => {
      mockAuthService.isAuthenticated.set(false);

      const result = TestBed.runInInjectionContext(() =>
        guestGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should redirect to dashboard when user is authenticated', () => {
      mockAuthService.isAuthenticated.set(true);

      const result = TestBed.runInInjectionContext(() =>
        guestGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    });

    it('should return observable when loading is true', () => {
      mockAuthService.loading.set(true);

      const result = TestBed.runInInjectionContext(() =>
        guestGuard(mockRoute, mockState)
      );

      expect(isObservable(result)).toBe(true);
    });

    it('should resolve to true when loading completes and user is not authenticated', async () => {
      mockAuthService.loading.set(true);
      mockAuthService.isAuthenticated.set(false);

      const result$ = TestBed.runInInjectionContext(() =>
        guestGuard(mockRoute, mockState)
      );

      // Simulate loading completion
      setTimeout(() => {
        mockAuthService.loading.set(false);
      }, 10);

      if (isObservable(result$)) {
        const result = await firstValueFrom(result$);
        expect(result).toBe(true);
      } else {
        fail('Expected an observable when loading is true');
      }
    });

    it('should redirect when loading completes and user is authenticated', async () => {
      mockAuthService.loading.set(true);
      mockAuthService.isAuthenticated.set(true);

      const result$ = TestBed.runInInjectionContext(() =>
        guestGuard(mockRoute, mockState)
      );

      // Simulate loading completion
      setTimeout(() => {
        mockAuthService.loading.set(false);
      }, 10);

      if (isObservable(result$)) {
        const result = await firstValueFrom(result$);
        expect(result).toBe(false);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
      } else {
        fail('Expected an observable when loading is true');
      }
    });
  });

  describe('guard integration scenarios', () => {
    it('authGuard should protect admin routes from unauthenticated access', () => {
      mockAuthService.isAuthenticated.set(false);
      const adminRoutes = [
        '/admin/dashboard',
        '/admin/inventory',
        '/admin/purchase-orders',
        '/admin/suppliers',
        '/admin/sales',
        '/admin/messages'
      ];

      adminRoutes.forEach(url => {
        mockRouter.navigate.calls.reset();
        mockState = { url } as RouterStateSnapshot;
        const result = TestBed.runInInjectionContext(() =>
          authGuard(mockRoute, mockState)
        );
        expect(result).toBe(false);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login'], {
          queryParams: { returnUrl: url }
        });
      });
    });

    it('guestGuard should prevent authenticated users from accessing login page', () => {
      mockAuthService.isAuthenticated.set(true);
      mockState = { url: '/auth/login' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        guestGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    });

    it('authGuard should allow authenticated users to access all admin routes', () => {
      mockAuthService.isAuthenticated.set(true);
      const adminRoutes = [
        '/admin/dashboard',
        '/admin/inventory',
        '/admin/purchase-orders',
        '/admin/suppliers',
        '/admin/sales',
        '/admin/messages'
      ];

      adminRoutes.forEach(url => {
        mockState = { url } as RouterStateSnapshot;
        const result = TestBed.runInInjectionContext(() =>
          authGuard(mockRoute, mockState)
        );
        expect(result).toBe(true);
      });
    });
  });

  describe('session expiration scenario', () => {
    it('should redirect to login when session expires during navigation', () => {
      // User was authenticated but session expired
      mockAuthService.isAuthenticated.set(false);
      mockState = { url: '/admin/inventory' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/admin/inventory' }
      });
    });
  });
});
