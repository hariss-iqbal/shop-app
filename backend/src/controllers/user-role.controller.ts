import { SupabaseClient } from '@supabase/supabase-js';
import { UserRoleService } from '../services/user-role.service';
import { AuditLogService } from '../services/audit-log.service';
import { UserRoleRepository } from '../repositories/user-role.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import {
  UserRoleResponseDto,
  CurrentUserRoleResponseDto,
  UserRoleListResponseDto,
  UserRoleFilterDto,
  UpdateUserRoleDto,
  AssignUserRoleDto
} from '../dto/user-role.dto';
import { UserRole, Permission } from '../enums';

/**
 * User Role Controller
 * API endpoint handlers for RBAC
 * Owner Module: M-02 Auth
 * Feature: F-013 Role-Based Access Control
 * Feature: F-014 Audit Logging and Transaction Tracking
 */
export class UserRoleController {
  private service: UserRoleService;
  private auditLogService?: AuditLogService;

  constructor(supabase: SupabaseClient, enableAuditLogging: boolean = true) {
    const repository = new UserRoleRepository(supabase);
    this.service = new UserRoleService(repository);

    if (enableAuditLogging) {
      const auditLogRepository = new AuditLogRepository(supabase);
      this.auditLogService = new AuditLogService(auditLogRepository);
    }
  }

  /**
   * GET /api/user-roles
   * Get all users with roles (admin only)
   */
  async getAll(filter?: UserRoleFilterDto): Promise<UserRoleListResponseDto> {
    return this.service.findAll(filter);
  }

  /**
   * GET /api/user-roles/:id
   * Get user role by ID
   */
  async getById(id: string): Promise<UserRoleResponseDto | null> {
    return this.service.findById(id);
  }

  /**
   * GET /api/user-roles/user/:userId
   * Get user role by user ID
   */
  async getByUserId(userId: string): Promise<UserRoleResponseDto | null> {
    return this.service.findByUserId(userId);
  }

  /**
   * GET /api/user-roles/me
   * Get current user's role and permissions
   */
  async getCurrentRole(userId: string, email: string): Promise<CurrentUserRoleResponseDto> {
    return this.service.getCurrentUserRole(userId, email);
  }

  /**
   * GET /api/user-roles/check/admin
   * Check if current user is admin
   */
  async checkIsAdmin(): Promise<{ isAdmin: boolean }> {
    const isAdmin = await this.service.isAdmin();
    return { isAdmin };
  }

  /**
   * GET /api/user-roles/check/manager-or-admin
   * Check if current user is manager or admin
   */
  async checkIsManagerOrAdmin(): Promise<{ isManagerOrAdmin: boolean }> {
    const isManagerOrAdmin = await this.service.isManagerOrAdmin();
    return { isManagerOrAdmin };
  }

  /**
   * GET /api/user-roles/check/refund
   * Check if current user can process refunds
   */
  async checkCanProcessRefund(): Promise<{ canProcessRefund: boolean }> {
    const canProcessRefund = await this.service.canProcessRefund();
    return { canProcessRefund };
  }

  /**
   * GET /api/user-roles/check/permission/:permission
   * Check if current user has a specific permission
   */
  async checkPermission(permission: Permission): Promise<{ hasPermission: boolean }> {
    const hasPermission = await this.service.hasPermission(permission);
    return { hasPermission };
  }

  /**
   * PUT /api/user-roles/user/:userId
   * Update user role (admin only)
   * Feature: F-014 Audit Logging
   */
  async updateRole(userId: string, dto: UpdateUserRoleDto, adminUserId: string, clientIp?: string, userAgent?: string): Promise<UserRoleResponseDto> {
    // Get previous role before update
    const previousRoleData = await this.service.findByUserId(userId);
    const previousRole = previousRoleData?.role || 'cashier';

    const result = await this.service.updateRole(userId, dto);

    // Log permission change to audit log
    if (this.auditLogService && previousRole !== dto.role) {
      try {
        await this.auditLogService.logPermissionChange({
          targetUserId: userId,
          previousRole: previousRole as UserRole,
          newRole: dto.role,
          adminUserId,
          reason: `Role changed from ${previousRole} to ${dto.role}`,
          clientIp,
          userAgent
        });
      } catch (auditError) {
        console.error('Failed to log permission change audit:', auditError);
      }
    }

    return result;
  }

  /**
   * POST /api/user-roles/assign
   * Assign role to a user (admin only)
   * Feature: F-014 Audit Logging
   */
  async assignRole(dto: AssignUserRoleDto, createdBy: string, clientIp?: string, userAgent?: string): Promise<UserRoleResponseDto> {
    // Get previous role if exists
    const previousRoleData = await this.service.findByUserId(dto.userId);
    const previousRole = previousRoleData?.role;

    const result = await this.service.assignRole(dto, createdBy);

    // Log permission change to audit log
    if (this.auditLogService) {
      try {
        await this.auditLogService.logPermissionChange({
          targetUserId: dto.userId,
          previousRole: previousRole as UserRole || 'cashier',
          newRole: dto.role,
          adminUserId: createdBy,
          reason: previousRole ? `Role changed from ${previousRole} to ${dto.role}` : `Initial role assignment: ${dto.role}`,
          clientIp,
          userAgent
        });
      } catch (auditError) {
        console.error('Failed to log permission change audit:', auditError);
      }
    }

    return result;
  }

  /**
   * GET /api/user-roles/stats
   * Get role statistics (admin only)
   */
  async getStats(): Promise<{ role: UserRole; count: number }[]> {
    return this.service.getRoleStats();
  }
}
