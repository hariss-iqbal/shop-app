import { UserRoleRepository } from '../repositories/user-role.repository';
import { UserRole, RolePermissions, Permission } from '../enums';
import {
  UserRoleResponseDto,
  CurrentUserRoleResponseDto,
  UserRoleListResponseDto,
  UserRoleFilterDto,
  UpdateUserRoleDto,
  AssignUserRoleDto,
  getPermissionsForRole
} from '../dto/user-role.dto';
import { UserRoleEntity, UserRoleWithUser } from '../entities/user-role.entity';

/**
 * User Role Service
 * Business logic for RBAC
 * Owner Module: M-02 Auth
 * Feature: F-013 Role-Based Access Control
 */
export class UserRoleService {
  constructor(private readonly userRoleRepository: UserRoleRepository) {}

  /**
   * Get all users with their roles (admin only)
   */
  async findAll(filter?: UserRoleFilterDto): Promise<UserRoleListResponseDto> {
    const roles = await this.userRoleRepository.findAll({
      role: filter?.role,
      limit: filter?.limit,
      offset: filter?.page && filter?.limit ? (filter.page - 1) * filter.limit : undefined
    });

    const total = await this.userRoleRepository.count({
      role: filter?.role
    });

    return {
      data: roles.map(this.toResponseDto),
      total
    };
  }

  /**
   * Get user role by ID
   */
  async findById(id: string): Promise<UserRoleResponseDto | null> {
    const role = await this.userRoleRepository.findById(id);
    return role ? this.toResponseDto(role) : null;
  }

  /**
   * Get user role by user ID
   */
  async findByUserId(userId: string): Promise<UserRoleResponseDto | null> {
    const role = await this.userRoleRepository.findByUserId(userId);
    return role ? this.toResponseDto(role) : null;
  }

  /**
   * Get current user's role and permissions
   */
  async getCurrentUserRole(userId: string, email: string): Promise<CurrentUserRoleResponseDto> {
    const role = await this.userRoleRepository.getCurrentUserRole();

    return {
      userId,
      email,
      role,
      permissions: getPermissionsForRole(role)
    };
  }

  /**
   * Check if current user is admin
   */
  async isAdmin(): Promise<boolean> {
    return this.userRoleRepository.isAdmin();
  }

  /**
   * Check if current user is manager or admin
   */
  async isManagerOrAdmin(): Promise<boolean> {
    return this.userRoleRepository.isManagerOrAdmin();
  }

  /**
   * Check if current user can process refunds
   */
  async canProcessRefund(): Promise<boolean> {
    return this.userRoleRepository.canProcessRefund();
  }

  /**
   * Check if user has a specific permission
   */
  async hasPermission(permission: Permission): Promise<boolean> {
    const role = await this.userRoleRepository.getCurrentUserRole();
    return RolePermissions[role][permission];
  }

  /**
   * Update user role (admin only)
   */
  async updateRole(userId: string, dto: UpdateUserRoleDto): Promise<UserRoleResponseDto> {
    // Check if admin
    const isAdmin = await this.userRoleRepository.isAdmin();
    if (!isAdmin) {
      throw new Error('Access denied: Only admins can modify user roles');
    }

    // Prevent changing own role
    const currentRole = await this.userRoleRepository.findByUserId(userId);
    if (!currentRole) {
      throw new Error('User role not found');
    }

    const updated = await this.userRoleRepository.updateByUserId(userId, {
      role: dto.role
    });

    return this.toResponseDto(updated);
  }

  /**
   * Assign role to a user (admin only)
   */
  async assignRole(dto: AssignUserRoleDto, createdBy: string): Promise<UserRoleResponseDto> {
    // Check if admin
    const isAdmin = await this.userRoleRepository.isAdmin();
    if (!isAdmin) {
      throw new Error('Access denied: Only admins can assign user roles');
    }

    // Check if user already has a role
    const existingRole = await this.userRoleRepository.findByUserId(dto.userId);
    if (existingRole) {
      // Update existing role
      const updated = await this.userRoleRepository.updateByUserId(dto.userId, {
        role: dto.role
      });
      return this.toResponseDto(updated);
    }

    // Create new role assignment
    const created = await this.userRoleRepository.create({
      user_id: dto.userId,
      role: dto.role,
      created_by: createdBy
    });

    return this.toResponseDto(created);
  }

  /**
   * Get role statistics
   */
  async getRoleStats(): Promise<{ role: UserRole; count: number }[]> {
    const roles = Object.values(UserRole);
    const stats = await Promise.all(
      roles.map(async (role) => ({
        role,
        count: await this.userRoleRepository.count({ role })
      }))
    );
    return stats;
  }

  private toResponseDto(entity: UserRoleEntity | UserRoleWithUser): UserRoleResponseDto {
    const userWithRole = entity as UserRoleWithUser;
    return {
      id: entity.id,
      userId: entity.user_id,
      email: userWithRole.user?.email || '',
      role: entity.role,
      permissions: getPermissionsForRole(entity.role),
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
      lastSignInAt: userWithRole.user?.last_sign_in_at || null
    };
  }
}
