import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { firstValueFrom, isObservable } from 'rxjs';

import {
  roleGuard,
  adminGuard,
  managerGuard,
  dashboardGuard,
  inventoryGuard,
  brandsGuard,
  purchaseOrdersGuard,
  suppliersGuard,
  salesGuard,
  refundsGuard,
  messagesGuard,
  storageGuard,
  receiptSequencesGuard,
  userManagementGuard,
  systemSettingsGuard,
  auditLogsGuard
} from './role.guard';
import { SupabaseAuthService } from '../services/supabase-auth.service';
import { Permission, UserRole, RolePermissions } from '../../enums/user-role.enum';

/**
 * Unit tests for Role-Based Access Control Guards
 * Feature: F-013 Role-Based Access Control
 *
 * Tests cover all acceptance criteria:
 * - Admin has full access including user management and system settings
 * - Manager has access to sales, refunds, and reports but not user management
 * - Cashier only has access to sales processing, refunds are blocked
 * - Access denied redirects with appropriate message
 */
describe('Role Guards', () => {
  let mockAuthService: {
    isAuthenticated: WritableSignal<boolean>;
    roleInitialized: WritableSignal<boolean>;
    roleLoading: WritableSignal<boolean>;
    hasPermission: jasmine.Spy;
    isManagerOrAdmin: WritableSignal<boolean>;
    permissions: WritableSignal<Record<Permission, boolean> | null>;
  };
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    mockAuthService = {
      isAuthenticated: signal(true),
      roleInitialized: signal(true),
      roleLoading: signal(false),
      hasPermission: jasmine.createSpy('hasPermission'),
      isManagerOrAdmin: signal(true),
      permissions: signal(null)
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

  describe('roleGuard factory function', () => {
    it('should redirect to login when user is not authenticated', () => {
      mockAuthService.isAuthenticated.set(false);
      const guard = roleGuard('canAccessDashboard');

      const result = TestBed.runInInjectionContext(() =>
        guard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/admin/dashboard' }
      });
    });

    it('should allow access when user has required permission', () => {
      mockAuthService.isAuthenticated.set(true);
      mockAuthService.roleInitialized.set(true);
      mockAuthService.roleLoading.set(false);
      mockAuthService.hasPermission.and.returnValue(true);

      const guard = roleGuard('canAccessDashboard');

      const result = TestBed.runInInjectionContext(() =>
        guard(mockRoute, mockState)
      );

      expect(result).toBe(true);
      expect(mockAuthService.hasPermission).toHaveBeenCalledWith('canAccessDashboard');
    });

    it('should redirect to access-denied when user lacks permission', () => {
      mockAuthService.isAuthenticated.set(true);
      mockAuthService.roleInitialized.set(true);
      mockAuthService.roleLoading.set(false);
      mockAuthService.hasPermission.and.returnValue(false);
      mockState = { url: '/admin/users' } as RouterStateSnapshot;

      const guard = roleGuard('canManageUsers');

      const result = TestBed.runInInjectionContext(() =>
        guard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/access-denied']);
    });

    it('should return observable when role is not yet initialized', () => {
      mockAuthService.isAuthenticated.set(true);
      mockAuthService.roleInitialized.set(false);
      mockAuthService.roleLoading.set(true);

      const guard = roleGuard('canAccessDashboard');

      const result = TestBed.runInInjectionContext(() =>
        guard(mockRoute, mockState)
      );

      expect(isObservable(result)).toBe(true);
    });

    it('should resolve with access when role initializes with permission', async () => {
      mockAuthService.isAuthenticated.set(true);
      mockAuthService.roleInitialized.set(false);
      mockAuthService.roleLoading.set(true);
      mockAuthService.hasPermission.and.returnValue(true);

      const guard = roleGuard('canAccessDashboard');

      const result$ = TestBed.runInInjectionContext(() =>
        guard(mockRoute, mockState)
      );

      // Simulate role initialization
      setTimeout(() => {
        mockAuthService.roleInitialized.set(true);
        mockAuthService.roleLoading.set(false);
      }, 10);

      if (isObservable(result$)) {
        const result = await firstValueFrom(result$);
        expect(result).toBe(true);
      } else {
        fail('Expected an observable when role is initializing');
      }
    });
  });

  describe('Admin role access (canManageUsers permission)', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.set(true);
      mockAuthService.roleInitialized.set(true);
      mockAuthService.roleLoading.set(false);
    });

    it('adminGuard should allow admin access to user management', () => {
      mockAuthService.hasPermission.and.callFake((permission: Permission) =>
        permission === 'canManageUsers'
      );
      mockState = { url: '/admin/users' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        adminGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('adminGuard should deny manager access to user management', () => {
      mockAuthService.hasPermission.and.returnValue(false);
      mockState = { url: '/admin/users' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        adminGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/access-denied']);
    });

    it('adminGuard should deny cashier access to user management', () => {
      mockAuthService.hasPermission.and.returnValue(false);
      mockState = { url: '/admin/users' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        adminGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/access-denied']);
    });
  });

  describe('Manager role access', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.set(true);
      mockAuthService.roleInitialized.set(true);
      mockAuthService.roleLoading.set(false);
    });

    it('managerGuard should allow admin access', () => {
      mockAuthService.isManagerOrAdmin.set(true);
      mockState = { url: '/admin/refunds' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        managerGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('managerGuard should allow manager access', () => {
      mockAuthService.isManagerOrAdmin.set(true);
      mockState = { url: '/admin/refunds' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        managerGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('managerGuard should deny cashier access', () => {
      mockAuthService.isManagerOrAdmin.set(false);
      mockState = { url: '/admin/refunds' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        managerGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/access-denied']);
    });
  });

  describe('Cashier role restrictions (F-013 Acceptance Criteria)', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.set(true);
      mockAuthService.roleInitialized.set(true);
      mockAuthService.roleLoading.set(false);
      // Simulate cashier permissions
      mockAuthService.hasPermission.and.callFake((permission: Permission) =>
        RolePermissions[UserRole.CASHIER][permission]
      );
      mockAuthService.isManagerOrAdmin.set(false);
    });

    it('cashier should be able to access sales processing', () => {
      mockState = { url: '/admin/sales' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        salesGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('cashier should NOT be able to access dashboard', () => {
      mockState = { url: '/admin/dashboard' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        dashboardGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/access-denied']);
    });

    it('cashier should NOT be able to access inventory', () => {
      mockState = { url: '/admin/inventory' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        inventoryGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/access-denied']);
    });

    it('cashier should NOT be able to process refunds (requires manager)', () => {
      mockState = { url: '/admin/refunds' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        refundsGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/access-denied']);
    });

    it('cashier should NOT be able to access user management', () => {
      mockState = { url: '/admin/users' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        userManagementGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/access-denied']);
    });

    it('cashier should NOT be able to access audit logs', () => {
      mockState = { url: '/admin/audit-logs' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        auditLogsGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/access-denied']);
    });

    it('cashier should NOT be able to access system settings', () => {
      mockState = { url: '/admin/settings' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        systemSettingsGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/access-denied']);
    });
  });

  describe('All specialized guards', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.set(true);
      mockAuthService.roleInitialized.set(true);
      mockAuthService.roleLoading.set(false);
    });

    const guardTests: Array<{
      guard: typeof dashboardGuard;
      permission: Permission;
      name: string;
    }> = [
      { guard: dashboardGuard, permission: 'canAccessDashboard', name: 'dashboardGuard' },
      { guard: inventoryGuard, permission: 'canAccessInventory', name: 'inventoryGuard' },
      { guard: brandsGuard, permission: 'canAccessBrands', name: 'brandsGuard' },
      { guard: purchaseOrdersGuard, permission: 'canAccessPurchaseOrders', name: 'purchaseOrdersGuard' },
      { guard: suppliersGuard, permission: 'canAccessSuppliers', name: 'suppliersGuard' },
      { guard: salesGuard, permission: 'canAccessSales', name: 'salesGuard' },
      { guard: refundsGuard, permission: 'canProcessRefunds', name: 'refundsGuard' },
      { guard: messagesGuard, permission: 'canAccessMessages', name: 'messagesGuard' },
      { guard: storageGuard, permission: 'canAccessStorage', name: 'storageGuard' },
      { guard: receiptSequencesGuard, permission: 'canAccessReceiptSequences', name: 'receiptSequencesGuard' },
      { guard: userManagementGuard, permission: 'canManageUsers', name: 'userManagementGuard' },
      { guard: systemSettingsGuard, permission: 'canAccessSystemSettings', name: 'systemSettingsGuard' },
      { guard: auditLogsGuard, permission: 'canAccessAuditLogs', name: 'auditLogsGuard' }
    ];

    guardTests.forEach(({ guard, permission, name }) => {
      it(`${name} should check for ${permission} permission`, () => {
        mockAuthService.hasPermission.and.returnValue(true);

        TestBed.runInInjectionContext(() =>
          guard(mockRoute, mockState)
        );

        expect(mockAuthService.hasPermission).toHaveBeenCalledWith(permission);
      });
    });
  });

  describe('Permission matrix verification', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.set(true);
      mockAuthService.roleInitialized.set(true);
      mockAuthService.roleLoading.set(false);
    });

    const testRolePermissions = (role: UserRole, expectedPermissions: Permission[]) => {
      mockAuthService.hasPermission.and.callFake((permission: Permission) =>
        RolePermissions[role][permission]
      );

      expectedPermissions.forEach(permission => {
        expect(RolePermissions[role][permission]).toBe(true,
          `${role} should have ${permission}`);
      });
    };

    it('admin should have all permissions', () => {
      const allPermissions: Permission[] = [
        'canAccessDashboard',
        'canAccessInventory',
        'canAccessBrands',
        'canAccessPurchaseOrders',
        'canAccessSuppliers',
        'canAccessSales',
        'canProcessRefunds',
        'canAccessReports',
        'canAccessMessages',
        'canAccessStorage',
        'canAccessReceiptSequences',
        'canManageUsers',
        'canAccessSystemSettings',
        'canAccessAuditLogs'
      ];

      testRolePermissions(UserRole.ADMIN, allPermissions);
    });

    it('manager should have sales, refunds, and reports but not user management', () => {
      const managerPermissions: Permission[] = [
        'canAccessDashboard',
        'canAccessInventory',
        'canAccessBrands',
        'canAccessPurchaseOrders',
        'canAccessSuppliers',
        'canAccessSales',
        'canProcessRefunds',
        'canAccessReports',
        'canAccessMessages'
      ];

      const restrictedPermissions: Permission[] = [
        'canAccessStorage',
        'canAccessReceiptSequences',
        'canManageUsers',
        'canAccessSystemSettings',
        'canAccessAuditLogs'
      ];

      testRolePermissions(UserRole.MANAGER, managerPermissions);

      restrictedPermissions.forEach(permission => {
        expect(RolePermissions[UserRole.MANAGER][permission]).toBe(false,
          `Manager should NOT have ${permission}`);
      });
    });

    it('cashier should only have sales access', () => {
      const cashierPermissions: Permission[] = ['canAccessSales'];

      const restrictedPermissions: Permission[] = [
        'canAccessDashboard',
        'canAccessInventory',
        'canAccessBrands',
        'canAccessPurchaseOrders',
        'canAccessSuppliers',
        'canProcessRefunds',
        'canAccessReports',
        'canAccessMessages',
        'canAccessStorage',
        'canAccessReceiptSequences',
        'canManageUsers',
        'canAccessSystemSettings',
        'canAccessAuditLogs'
      ];

      testRolePermissions(UserRole.CASHIER, cashierPermissions);

      restrictedPermissions.forEach(permission => {
        expect(RolePermissions[UserRole.CASHIER][permission]).toBe(false,
          `Cashier should NOT have ${permission}`);
      });
    });
  });

  describe('Refund permission workflow (F-013 Acceptance Criteria)', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.set(true);
      mockAuthService.roleInitialized.set(true);
      mockAuthService.roleLoading.set(false);
    });

    it('given Manager attempts to process refund, refund workflow should be permitted', () => {
      mockAuthService.hasPermission.and.callFake((permission: Permission) =>
        RolePermissions[UserRole.MANAGER][permission]
      );
      mockState = { url: '/admin/refunds' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        refundsGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('given Cashier attempts to process refund, operation should be blocked and redirect to access-denied', () => {
      mockAuthService.hasPermission.and.callFake((permission: Permission) =>
        RolePermissions[UserRole.CASHIER][permission]
      );
      mockState = { url: '/admin/refunds' } as RouterStateSnapshot;

      const result = TestBed.runInInjectionContext(() =>
        refundsGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/access-denied']);
    });
  });
});
