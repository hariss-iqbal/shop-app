/**
 * User role enumeration for RBAC
 * Maps to PostgreSQL user_role ENUM
 * Feature: F-013 Role-Based Access Control
 */
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  CASHIER = 'cashier'
}

/**
 * Permissions type
 */
export type Permission =
  | 'canAccessDashboard'
  | 'canAccessInventory'
  | 'canAccessBrands'
  | 'canAccessPurchaseOrders'
  | 'canAccessSuppliers'
  | 'canAccessSales'
  | 'canProcessRefunds'
  | 'canAccessReports'
  | 'canAccessMessages'
  | 'canAccessStorage'
  | 'canAccessReceiptSequences'
  | 'canManageUsers'
  | 'canAccessSystemSettings'
  | 'canAccessAuditLogs';

/**
 * Permissions matrix by role
 * Admin: Full access to all features including user management and system settings
 * Manager: Sales, refunds, reports - no user management or system settings
 * Cashier: Sales processing only - no refunds, reports, or admin features
 */
export const RolePermissions: Record<UserRole, Record<Permission, boolean>> = {
  [UserRole.ADMIN]: {
    canAccessDashboard: true,
    canAccessInventory: true,
    canAccessBrands: true,
    canAccessPurchaseOrders: true,
    canAccessSuppliers: true,
    canAccessSales: true,
    canProcessRefunds: true,
    canAccessReports: true,
    canAccessMessages: true,
    canAccessStorage: true,
    canAccessReceiptSequences: true,
    canManageUsers: true,
    canAccessSystemSettings: true,
    canAccessAuditLogs: true
  },
  [UserRole.MANAGER]: {
    canAccessDashboard: true,
    canAccessInventory: true,
    canAccessBrands: true,
    canAccessPurchaseOrders: true,
    canAccessSuppliers: true,
    canAccessSales: true,
    canProcessRefunds: true,
    canAccessReports: true,
    canAccessMessages: true,
    canAccessStorage: false,
    canAccessReceiptSequences: false,
    canManageUsers: false,
    canAccessSystemSettings: false,
    canAccessAuditLogs: false
  },
  [UserRole.CASHIER]: {
    canAccessDashboard: false,
    canAccessInventory: false,
    canAccessBrands: false,
    canAccessPurchaseOrders: false,
    canAccessSuppliers: false,
    canAccessSales: true,
    canProcessRefunds: false,
    canAccessReports: false,
    canAccessMessages: false,
    canAccessStorage: false,
    canAccessReceiptSequences: false,
    canManageUsers: false,
    canAccessSystemSettings: false,
    canAccessAuditLogs: false
  }
};

/**
 * Helper function to get permissions for a role
 */
export function getPermissionsForRole(role: UserRole): Record<Permission, boolean> {
  return RolePermissions[role];
}

/**
 * Helper function to check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return RolePermissions[role][permission];
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return 'Administrator';
    case UserRole.MANAGER:
      return 'Manager';
    case UserRole.CASHIER:
      return 'Cashier';
    default:
      return 'Unknown';
  }
}

/**
 * Get role severity for PrimeNG Tag
 */
export function getRoleSeverity(role: UserRole): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
  switch (role) {
    case UserRole.ADMIN:
      return 'danger';
    case UserRole.MANAGER:
      return 'warn';
    case UserRole.CASHIER:
      return 'info';
    default:
      return 'secondary';
  }
}
