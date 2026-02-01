import { UserRole, Permission } from '../enums/user-role.enum';

/**
 * User Role Model
 * Feature: F-013 Role-Based Access Control
 */

/**
 * User role response from API
 */
export interface UserRoleResponse {
  id: string;
  userId: string;
  email: string;
  role: UserRole;
  permissions: Record<Permission, boolean>;
  createdAt: string;
  updatedAt: string | null;
  lastSignInAt: string | null;
}

/**
 * Current user's role response
 */
export interface CurrentUserRoleResponse {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Record<Permission, boolean>;
}

/**
 * Update user role request
 */
export interface UpdateUserRoleRequest {
  role: UserRole;
}

/**
 * Assign user role request
 */
export interface AssignUserRoleRequest {
  userId: string;
  role: UserRole;
}

/**
 * User role list response
 */
export interface UserRoleListResponse {
  data: UserRoleResponse[];
  total: number;
}

/**
 * User role filter
 */
export interface UserRoleFilter {
  role?: UserRole;
  search?: string;
  limit?: number;
  page?: number;
}

/**
 * Role statistics
 */
export interface RoleStats {
  role: UserRole;
  count: number;
}

/**
 * Permission check response
 */
export interface PermissionCheckResponse {
  hasPermission: boolean;
}

/**
 * Admin check response
 */
export interface AdminCheckResponse {
  isAdmin: boolean;
}

/**
 * Manager or Admin check response
 */
export interface ManagerOrAdminCheckResponse {
  isManagerOrAdmin: boolean;
}

/**
 * Refund permission check response
 */
export interface RefundPermissionCheckResponse {
  canProcessRefund: boolean;
}

/**
 * Role permission record from database
 */
export interface RolePermissionRecord {
  id: string;
  role: UserRole;
  permission: string;
  enabled: boolean;
  updatedAt: string | null;
}

/**
 * Permission update request
 */
export interface UpdatePermissionRequest {
  role: UserRole;
  permission: string;
  enabled: boolean;
}

/**
 * Permission matrix for display
 */
export interface PermissionMatrixItem {
  permission: string;
  label: string;
  description: string;
  admin: boolean;
  manager: boolean;
  cashier: boolean;
}

/**
 * All permissions response from API
 */
export interface AllPermissionsResponse {
  success: boolean;
  permissions?: RolePermissionRecord[];
  error?: string;
}
