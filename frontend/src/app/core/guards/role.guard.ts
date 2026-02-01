import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { filter, first, map, timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { SupabaseAuthService } from '../services/supabase-auth.service';
import { Permission } from '../../enums/user-role.enum';

/**
 * Maximum time to wait for role initialization (in milliseconds).
 */
const ROLE_INIT_TIMEOUT = 10000;

/**
 * Factory function to create a role-based guard.
 * Note: This guard runs AFTER authGuard, so user is already authenticated.
 * @param requiredPermission The permission required to access the route
 */
export function roleGuard(requiredPermission: Permission): CanActivateFn {
  return (_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) => {
    const authService = inject(SupabaseAuthService);
    const router = inject(Router);

    const redirectToAccessDenied = (): boolean => {
      router.navigate(['/access-denied']);
      return false;
    };

    const checkPermission = (): boolean => {
      return authService.hasPermission(requiredPermission) ? true : redirectToAccessDenied();
    };

    // If role is already initialized, check immediately
    if (authService.roleInitialized()) {
      return checkPermission();
    }

    // Wait for role to be initialized
    const roleInitialized$ = toObservable(authService.roleInitialized);

    return roleInitialized$.pipe(
      filter(initialized => initialized),
      first(),
      map(() => checkPermission()),
      timeout(ROLE_INIT_TIMEOUT),
      catchError(() => {
        console.warn('Role guard timed out waiting for role initialization');
        return of(redirectToAccessDenied());
      })
    );
  };
}

/**
 * Guard for admin-only routes
 */
export const adminGuard: CanActivateFn = roleGuard('canManageUsers');

/**
 * Guard for manager or admin routes.
 * Note: This guard runs AFTER authGuard, so user is already authenticated.
 */
export const managerGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) => {
  const authService = inject(SupabaseAuthService);
  const router = inject(Router);

  const redirectToAccessDenied = (): boolean => {
    router.navigate(['/access-denied']);
    return false;
  };

  const checkPermission = (): boolean => {
    return authService.isManagerOrAdmin() ? true : redirectToAccessDenied();
  };

  // If role is already initialized, check immediately
  if (authService.roleInitialized()) {
    return checkPermission();
  }

  // Wait for role to be initialized
  const roleInitialized$ = toObservable(authService.roleInitialized);

  return roleInitialized$.pipe(
    filter(initialized => initialized),
    first(),
    map(() => checkPermission()),
    timeout(ROLE_INIT_TIMEOUT),
    catchError(() => {
      console.warn('Manager guard timed out waiting for role initialization');
      return of(redirectToAccessDenied());
    })
  );
};

/**
 * Guard for dashboard access
 */
export const dashboardGuard: CanActivateFn = roleGuard('canAccessDashboard');

/**
 * Guard for inventory access
 */
export const inventoryGuard: CanActivateFn = roleGuard('canAccessInventory');

/**
 * Guard for brands access
 */
export const brandsGuard: CanActivateFn = roleGuard('canAccessBrands');

/**
 * Guard for purchase orders access
 */
export const purchaseOrdersGuard: CanActivateFn = roleGuard('canAccessPurchaseOrders');

/**
 * Guard for suppliers access
 */
export const suppliersGuard: CanActivateFn = roleGuard('canAccessSuppliers');

/**
 * Guard for sales access
 */
export const salesGuard: CanActivateFn = roleGuard('canAccessSales');

/**
 * Guard for refunds access
 */
export const refundsGuard: CanActivateFn = roleGuard('canProcessRefunds');

/**
 * Guard for messages access
 */
export const messagesGuard: CanActivateFn = roleGuard('canAccessMessages');

/**
 * Guard for storage access
 */
export const storageGuard: CanActivateFn = roleGuard('canAccessStorage');

/**
 * Guard for receipt sequences access
 */
export const receiptSequencesGuard: CanActivateFn = roleGuard('canAccessReceiptSequences');

/**
 * Guard for user management access
 */
export const userManagementGuard: CanActivateFn = roleGuard('canManageUsers');

/**
 * Guard for system settings access
 */
export const systemSettingsGuard: CanActivateFn = roleGuard('canAccessSystemSettings');

/**
 * Guard for audit logs access (admin only)
 */
export const auditLogsGuard: CanActivateFn = roleGuard('canAccessAuditLogs');
