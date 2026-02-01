import { UserRole, RolePermissions, Permission } from '../enums';

/**
 * User Role DTOs
 * Feature: F-013 Role-Based Access Control
 */

/**
 * Response DTO for user role
 */
export interface UserRoleResponseDto {
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
 * Response DTO for current user's role
 */
export interface CurrentUserRoleResponseDto {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Record<Permission, boolean>;
}

/**
 * DTO for updating user role
 */
export interface UpdateUserRoleDto {
  role: UserRole;
}

/**
 * DTO for assigning role to a user
 */
export interface AssignUserRoleDto {
  userId: string;
  role: UserRole;
}

/**
 * DTO for user role list response
 */
export interface UserRoleListResponseDto {
  data: UserRoleResponseDto[];
  total: number;
}

/**
 * Filter DTO for user roles
 */
export interface UserRoleFilterDto {
  role?: UserRole;
  search?: string;
  limit?: number;
  page?: number;
}

/**
 * Helper function to get permissions for a role
 */
export function getPermissionsForRole(role: UserRole): Record<Permission, boolean> {
  return RolePermissions[role] as Record<Permission, boolean>;
}

/**
 * Helper function to check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return RolePermissions[role][permission];
}
