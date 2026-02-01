import { SupabaseClient } from '@supabase/supabase-js';
import { UserRoleEntity, UserRoleWithUser, CreateUserRoleInput, UpdateUserRoleInput } from '../entities/user-role.entity';
import { UserRole } from '../enums';

/**
 * User Role Repository
 * Database operations for user_roles table
 * Owner Module: M-02 Auth
 * Feature: F-013 Role-Based Access Control
 */
export class UserRoleRepository {
  private readonly tableName = 'user_roles';

  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Get all user roles with user info
   */
  async findAll(filter?: {
    role?: UserRole;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<UserRoleWithUser[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (filter?.role) {
      query = query.eq('role', filter.role);
    }

    if (filter?.limit) {
      query = query.limit(filter.limit);
    }

    if (filter?.offset) {
      query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch user roles: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get user role by ID
   */
  async findById(id: string): Promise<UserRoleEntity | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch user role: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user role by user ID
   */
  async findByUserId(userId: string): Promise<UserRoleEntity | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch user role: ${error.message}`);
    }

    return data;
  }

  /**
   * Get current user's role using RPC
   */
  async getCurrentUserRole(): Promise<UserRole> {
    const { data, error } = await this.supabase.rpc('get_user_role');

    if (error) {
      console.warn('Failed to get user role, defaulting to cashier:', error.message);
      return UserRole.CASHIER;
    }

    return (data as UserRole) || UserRole.CASHIER;
  }

  /**
   * Check if current user is admin
   */
  async isAdmin(): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('is_admin');

    if (error) {
      console.warn('Failed to check admin status:', error.message);
      return false;
    }

    return !!data;
  }

  /**
   * Check if current user is manager or admin
   */
  async isManagerOrAdmin(): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('is_manager_or_admin');

    if (error) {
      console.warn('Failed to check manager/admin status:', error.message);
      return false;
    }

    return !!data;
  }

  /**
   * Check if current user can process refunds
   */
  async canProcessRefund(): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('can_process_refund');

    if (error) {
      console.warn('Failed to check refund permission:', error.message);
      return false;
    }

    return !!data;
  }

  /**
   * Create user role
   */
  async create(input: CreateUserRoleInput): Promise<UserRoleEntity> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        user_id: input.user_id,
        role: input.role,
        created_by: input.created_by
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user role: ${error.message}`);
    }

    return data;
  }

  /**
   * Update user role
   */
  async update(id: string, input: UpdateUserRoleInput): Promise<UserRoleEntity> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ role: input.role })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user role: ${error.message}`);
    }

    return data;
  }

  /**
   * Update user role by user ID
   */
  async updateByUserId(userId: string, input: UpdateUserRoleInput): Promise<UserRoleEntity> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ role: input.role })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user role: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete user role
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user role: ${error.message}`);
    }
  }

  /**
   * Count user roles
   */
  async count(filter?: { role?: UserRole }): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (filter?.role) {
      query = query.eq('role', filter.role);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count user roles: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Get all users from auth.users with their roles
   * Uses RPC function to access auth schema
   */
  async findAllUsersWithRoles(): Promise<UserRoleWithUser[]> {
    // First get all roles
    const { data: roles, error: rolesError } = await this.supabase
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (rolesError) {
      throw new Error(`Failed to fetch user roles: ${rolesError.message}`);
    }

    return roles || [];
  }
}
