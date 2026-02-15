import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SupabaseAuthService } from './supabase-auth.service';
import {
  UserRole,
  Permission,
  getPermissionsForRole
} from '../../enums/user-role.enum';
import {
  UserRoleResponse,
  UserRoleListResponse,
  UpdateUserRoleRequest,
  AssignUserRoleRequest,
  UserRoleFilter,
  RoleStats,
  RolePermissionRecord,
  UpdatePermissionRequest
} from '../../models/user-role.model';

/**
 * User Role Service
 * Manages RBAC state and API calls
 * Feature: F-013 Role-Based Access Control
 */
@Injectable({
  providedIn: 'root'
})
export class UserRoleService {
  constructor(
    private supabaseService: SupabaseService,
    private authService: SupabaseAuthService
  ) { }

  private readonly _currentRole = signal<UserRole | null>(null);
  private readonly _permissions = signal<Record<Permission, boolean> | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _initialized = signal<boolean>(false);

  readonly currentRole = this._currentRole.asReadonly();
  readonly permissions = this._permissions.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly initialized = this._initialized.asReadonly();

  readonly isAdmin = computed(() => this._currentRole() === UserRole.ADMIN);
  readonly isManager = computed(() => this._currentRole() === UserRole.MANAGER);
  readonly isCashier = computed(() => this._currentRole() === UserRole.CASHIER);
  readonly isManagerOrAdmin = computed(() =>
    this._currentRole() === UserRole.ADMIN || this._currentRole() === UserRole.MANAGER
  );

  readonly canAccessDashboard = computed(() => this._permissions()?.canAccessDashboard ?? false);
  readonly canAccessInventory = computed(() => this._permissions()?.canAccessInventory ?? false);
  readonly canAccessBrands = computed(() => this._permissions()?.canAccessBrands ?? false);
  readonly canAccessPurchaseOrders = computed(() => this._permissions()?.canAccessPurchaseOrders ?? false);
  readonly canAccessSuppliers = computed(() => this._permissions()?.canAccessSuppliers ?? false);
  readonly canAccessSales = computed(() => this._permissions()?.canAccessSales ?? false);
  readonly canProcessRefunds = computed(() => this._permissions()?.canProcessRefunds ?? false);
  readonly canAccessReports = computed(() => this._permissions()?.canAccessReports ?? false);
  readonly canAccessMessages = computed(() => this._permissions()?.canAccessMessages ?? false);
  readonly canAccessStorage = computed(() => this._permissions()?.canAccessStorage ?? false);
  readonly canAccessReceiptSequences = computed(() => this._permissions()?.canAccessReceiptSequences ?? false);
  readonly canManageUsers = computed(() => this._permissions()?.canManageUsers ?? false);
  readonly canAccessSystemSettings = computed(() => this._permissions()?.canAccessSystemSettings ?? false);

  /**
   * Initialize user role on login
   */
  async initializeRole(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      this._currentRole.set(null);
      this._permissions.set(null);
      this._initialized.set(false);
      return;
    }

    this._loading.set(true);

    try {
      const role = await this.fetchCurrentUserRole();
      this._currentRole.set(role);
      this._permissions.set(getPermissionsForRole(role));
      this._initialized.set(true);
    } catch (error) {
      console.error('Failed to fetch user role:', error);
      // Default to cashier on error
      this._currentRole.set(UserRole.CASHIER);
      this._permissions.set(getPermissionsForRole(UserRole.CASHIER));
      this._initialized.set(true);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Clear role on logout
   */
  clearRole(): void {
    this._currentRole.set(null);
    this._permissions.set(null);
    this._initialized.set(false);
  }

  /**
   * Fetch current user's role from database
   */
  private async fetchCurrentUserRole(): Promise<UserRole> {
    const { data, error } = await this.supabaseService.client.rpc('get_user_role');

    if (error) {
      console.warn('Failed to get user role, defaulting to cashier:', error.message);
      return UserRole.CASHIER;
    }

    return (data as UserRole) || UserRole.CASHIER;
  }

  /**
   * Check if current user has a specific permission
   */
  hasPermission(permission: Permission): boolean {
    const permissions = this._permissions();
    return permissions ? permissions[permission] : false;
  }

  /**
   * Check if current user can access a specific route
   */
  canAccessRoute(route: string): boolean {
    const permissions = this._permissions();
    if (!permissions) return false;

    // Route to permission mapping
    const routePermissions: Record<string, Permission> = {
      '/admin/dashboard': 'canAccessDashboard',
      '/admin/inventory': 'canAccessInventory',
      '/admin/brands': 'canAccessBrands',
      '/admin/purchase-orders': 'canAccessPurchaseOrders',
      '/admin/suppliers': 'canAccessSuppliers',
      '/admin/sales': 'canAccessSales',
      '/admin/refunds': 'canProcessRefunds',
      '/admin/messages': 'canAccessMessages',
      '/admin/storage': 'canAccessStorage',
      '/admin/receipt-sequences': 'canAccessReceiptSequences',
      '/admin/users': 'canManageUsers',
      '/admin/settings': 'canAccessSystemSettings'
    };

    // Find matching permission for route
    for (const [path, permission] of Object.entries(routePermissions)) {
      if (route.startsWith(path)) {
        return permissions[permission];
      }
    }

    // Allow access by default for routes not in the mapping
    return true;
  }

  /**
   * Get all users with roles (admin only)
   * Uses RPC function to fetch user emails from auth.users
   */
  async getAllUserRoles(filter?: UserRoleFilter): Promise<UserRoleListResponse> {
    // Use RPC function to get user roles with email addresses
    const { data, error } = await this.supabaseService.client
      .rpc('get_all_user_roles_with_email');

    if (error) {
      throw new Error(`Failed to fetch user roles: ${error.message}`);
    }

    // Transform to response format
    let roles: UserRoleResponse[] = (data || []).map((item: {
      id: string;
      user_id: string;
      email: string;
      role: string;
      created_at: string;
      updated_at: string | null;
      last_sign_in_at: string | null;
    }) => ({
      id: item.id,
      userId: item.user_id,
      email: item.email || '',
      role: item.role as UserRole,
      permissions: getPermissionsForRole(item.role as UserRole),
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      lastSignInAt: item.last_sign_in_at
    }));

    // Apply filters client-side (RPC doesn't support filtering directly)
    if (filter?.role) {
      roles = roles.filter(r => r.role === filter.role);
    }

    // Apply pagination client-side
    const total = roles.length;
    if (filter?.limit) {
      const offset = filter.page ? (filter.page - 1) * filter.limit : 0;
      roles = roles.slice(offset, offset + filter.limit);
    }

    return {
      data: roles,
      total
    };
  }

  /**
   * Get user role by user ID
   */
  async getUserRole(userId: string): Promise<UserRoleResponse | null> {
    const { data, error } = await this.supabaseService.client
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch user role: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      email: '',
      role: data.role as UserRole,
      permissions: getPermissionsForRole(data.role as UserRole),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastSignInAt: null
    };
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, request: UpdateUserRoleRequest): Promise<UserRoleResponse> {
    const { data, error } = await this.supabaseService.client
      .from('user_roles')
      .update({ role: request.role })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user role: ${error.message}`);
    }

    return {
      id: data.id,
      userId: data.user_id,
      email: '',
      role: data.role as UserRole,
      permissions: getPermissionsForRole(data.role as UserRole),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastSignInAt: null
    };
  }

  /**
   * Assign role to a user (admin only)
   */
  async assignUserRole(request: AssignUserRoleRequest): Promise<UserRoleResponse> {
    // Check if user already has a role
    const existing = await this.getUserRole(request.userId);

    if (existing) {
      return this.updateUserRole(request.userId, { role: request.role });
    }

    const { data, error } = await this.supabaseService.client
      .from('user_roles')
      .insert({
        user_id: request.userId,
        role: request.role
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to assign user role: ${error.message}`);
    }

    return {
      id: data.id,
      userId: data.user_id,
      email: '',
      role: data.role as UserRole,
      permissions: getPermissionsForRole(data.role as UserRole),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastSignInAt: null
    };
  }

  /**
   * Get role statistics (admin only)
   */
  async getRoleStats(): Promise<RoleStats[]> {
    const roles = Object.values(UserRole);
    const stats: RoleStats[] = [];

    for (const role of roles) {
      const { count, error } = await this.supabaseService.client
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', role);

      if (!error) {
        stats.push({ role, count: count || 0 });
      }
    }

    return stats;
  }

  // ============================================================
  // DYNAMIC PERMISSION MANAGEMENT
  // ============================================================

  /**
   * Get all role permissions from database (admin only)
   */
  async getAllPermissions(): Promise<RolePermissionRecord[]> {
    const { data, error } = await this.supabaseService.client
      .rpc('get_all_role_permissions');

    if (error) {
      throw new Error(`Failed to fetch permissions: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch permissions');
    }

    return (data.permissions || []).map((p: {
      id: string;
      role: string;
      permission: string;
      enabled: boolean;
      updatedAt: string | null;
    }) => ({
      id: p.id,
      role: p.role as UserRole,
      permission: p.permission,
      enabled: p.enabled,
      updatedAt: p.updatedAt
    }));
  }

  /**
   * Update a single permission (admin only)
   */
  async updatePermission(request: UpdatePermissionRequest): Promise<void> {
    const { data, error } = await this.supabaseService.client
      .rpc('update_role_permission', {
        p_role: request.role,
        p_permission: request.permission,
        p_enabled: request.enabled
      });

    if (error) {
      throw new Error(`Failed to update permission: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to update permission');
    }
  }

  /**
   * Get permissions for current user from database
   */
  async getMyPermissionsFromDb(): Promise<{ role: UserRole; permissions: Record<string, boolean> }> {
    const { data, error } = await this.supabaseService.client
      .rpc('get_my_permissions');

    if (error) {
      throw new Error(`Failed to fetch permissions: ${error.message}`);
    }

    return {
      role: data.role as UserRole,
      permissions: data.permissions || {}
    };
  }

  /**
   * Initialize role from database (uses dynamic permissions)
   */
  async initializeRoleFromDb(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      this._currentRole.set(null);
      this._permissions.set(null);
      this._initialized.set(false);
      return;
    }

    this._loading.set(true);

    try {
      const { role, permissions } = await this.getMyPermissionsFromDb();
      this._currentRole.set(role);

      // Convert string keys to Permission type
      const typedPermissions: Record<Permission, boolean> = {
        canAccessDashboard: permissions['canAccessDashboard'] ?? false,
        canAccessInventory: permissions['canAccessInventory'] ?? false,
        canAccessBrands: permissions['canAccessBrands'] ?? false,
        canAccessPurchaseOrders: permissions['canAccessPurchaseOrders'] ?? false,
        canAccessSuppliers: permissions['canAccessSuppliers'] ?? false,
        canAccessSales: permissions['canAccessSales'] ?? false,
        canProcessRefunds: permissions['canProcessRefunds'] ?? false,
        canAccessReports: permissions['canAccessReports'] ?? false,
        canAccessMessages: permissions['canAccessMessages'] ?? false,
        canAccessStorage: permissions['canAccessStorage'] ?? false,
        canAccessReceiptSequences: permissions['canAccessReceiptSequences'] ?? false,
        canManageUsers: permissions['canManageUsers'] ?? false,
        canAccessSystemSettings: permissions['canAccessSystemSettings'] ?? false,
        canAccessAuditLogs: permissions['canAccessAuditLogs'] ?? false
      };

      this._permissions.set(typedPermissions);
      this._initialized.set(true);
    } catch (error) {
      console.error('Failed to fetch permissions from DB, falling back to defaults:', error);
      // Fall back to hardcoded permissions
      await this.initializeRole();
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Create a new user with a temporary password (admin only).
   * Calls the create-user Edge Function which uses the service_role key.
   */
  async createUser(email: string, password: string, role: UserRole): Promise<{ success: boolean; userId?: string; error?: string; warning?: string }> {
    const { data, error } = await this.supabaseService.client.functions.invoke('create-user', {
      body: { email, password, role }
    });

    if (error) {
      throw new Error(error.message || 'Failed to create user');
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to create user');
    }

    return data;
  }
}
