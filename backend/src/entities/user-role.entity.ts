import { UserRole } from '../enums';

/**
 * User Role Entity
 * Database table: user_roles
 * Owner Module: M-02 Auth
 * Feature: F-013 Role-Based Access Control
 */
export interface UserRoleEntity {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

/**
 * User Role with User Info
 * Joined with auth.users for user management display
 */
export interface UserRoleWithUser extends UserRoleEntity {
  user?: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
  };
}

/**
 * Create User Role Input
 */
export interface CreateUserRoleInput {
  user_id: string;
  role: UserRole;
  created_by?: string;
}

/**
 * Update User Role Input
 */
export interface UpdateUserRoleInput {
  role: UserRole;
}
