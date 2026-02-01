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
 * Permissions matrix by role
 * Admin: Full access to all features including user management and system settings
 * Manager: Sales, refunds, reports - no user management or system settings
 * Cashier: Sales processing only - no refunds, reports, or admin features
 */
export const RolePermissions = {
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
    canAccessSystemSettings: true
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
    canAccessSystemSettings: false
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
    canAccessSystemSettings: false
  }
} as const;

export type Permission = keyof typeof RolePermissions[UserRole.ADMIN];
