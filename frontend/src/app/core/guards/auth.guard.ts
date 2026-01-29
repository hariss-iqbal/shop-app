import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { filter, first, map, timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { SupabaseAuthService } from '../services/supabase-auth.service';

/**
 * Maximum time to wait for auth initialization (in milliseconds).
 * After this timeout, the guard will redirect to login.
 */
const AUTH_INIT_TIMEOUT = 5000;

/**
 * Auth guard that protects admin routes.
 * Redirects unauthenticated users to login with returnUrl preservation.
 */
export const authGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(SupabaseAuthService);
  const router = inject(Router);

  const redirectToLogin = (): boolean => {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  };

  // If not loading, check authentication immediately
  if (!authService.loading()) {
    if (authService.isAuthenticated()) {
      return true;
    }
    return redirectToLogin();
  }

  // Wait for loading to complete using reactive approach
  const loading$ = toObservable(authService.loading);

  return loading$.pipe(
    // Wait for loading to become false
    filter(loading => !loading),
    // Take only the first emission
    first(),
    // Check authentication status
    map(() => {
      if (authService.isAuthenticated()) {
        return true;
      }
      return redirectToLogin();
    }),
    // Add timeout to prevent indefinite waiting
    timeout(AUTH_INIT_TIMEOUT),
    // Handle timeout by redirecting to login
    catchError(() => {
      console.warn('Auth guard timed out waiting for auth initialization');
      return of(redirectToLogin());
    })
  );
};

/**
 * Guest guard that prevents authenticated users from accessing auth pages.
 * Redirects authenticated users to the admin dashboard.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(SupabaseAuthService);
  const router = inject(Router);

  const redirectToDashboard = (): boolean => {
    router.navigate(['/admin/dashboard']);
    return false;
  };

  // If not loading, check authentication immediately
  if (!authService.loading()) {
    if (!authService.isAuthenticated()) {
      return true;
    }
    return redirectToDashboard();
  }

  // Wait for loading to complete using reactive approach
  const loading$ = toObservable(authService.loading);

  return loading$.pipe(
    // Wait for loading to become false
    filter(loading => !loading),
    // Take only the first emission
    first(),
    // Check authentication status
    map(() => {
      if (!authService.isAuthenticated()) {
        return true;
      }
      return redirectToDashboard();
    }),
    // Add timeout to prevent indefinite waiting
    timeout(AUTH_INIT_TIMEOUT),
    // Handle timeout by allowing access (assume not authenticated)
    catchError(() => {
      console.warn('Guest guard timed out waiting for auth initialization');
      return of(true);
    })
  );
};
