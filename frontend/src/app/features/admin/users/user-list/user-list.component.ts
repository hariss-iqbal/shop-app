import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { UserRoleService, SupabaseAuthService } from '../../../../core';
import { ToastService } from '../../../../shared';
import {
  UserRole,
  getRoleDisplayName,
  getRoleSeverity
} from '../../../../enums/user-role.enum';
import { UserRoleResponse, RoleStats } from '../../../../models/user-role.model';

interface RoleOption {
  label: string;
  value: UserRole;
}

/**
 * User Management Component
 * Admin-only view for managing user roles
 * Feature: F-013 Role-Based Access Control
 */
@Component({
  selector: 'app-user-list',
  imports: [
    RouterLink,
    TableModule,
    TagModule,
    ButtonModule,
    SelectModule,
    CardModule,
    DialogModule,
    InputTextModule,
    PasswordModule,
    FormsModule,
    DatePipe
  ],
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit {
  constructor(
    private userRoleService: UserRoleService,
    public authService: SupabaseAuthService,
    private toastService: ToastService
  ) { }

  users = signal<UserRoleResponse[]>([]);
  roleStats = signal<RoleStats[]>([]);
  loading = signal(true);
  saving = signal(false);
  editDialogVisible = false;
  selectedUser = signal<UserRoleResponse | null>(null);
  newRole: UserRole | null = null;

  getRoleDisplayName = getRoleDisplayName;
  getRoleSeverity = getRoleSeverity;

  // Create user dialog
  createDialogVisible = false;
  creating = signal(false);
  newUserEmail = '';
  newUserPassword = '';
  newUserRole: UserRole = UserRole.CASHIER;

  roleOptions: RoleOption[] = [
    { label: 'Administrator', value: UserRole.ADMIN },
    { label: 'Manager', value: UserRole.MANAGER },
    { label: 'Cashier', value: UserRole.CASHIER }
  ];

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const [usersResponse, stats] = await Promise.all([
        this.userRoleService.getAllUserRoles(),
        this.userRoleService.getRoleStats()
      ]);
      this.users.set(usersResponse.data);
      this.roleStats.set(stats);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load users');
      console.error('Failed to load users:', error);
    } finally {
      this.loading.set(false);
    }
  }

  openEditDialog(user: UserRoleResponse): void {
    this.selectedUser.set(user);
    this.newRole = user.role;
    this.editDialogVisible = true;
  }

  async saveRoleChange(): Promise<void> {
    const user = this.selectedUser();
    if (!user || !this.newRole || this.newRole === user.role) return;

    this.saving.set(true);
    try {
      await this.userRoleService.updateUserRole(user.userId, { role: this.newRole });
      this.toastService.success('Success', `Role updated to ${getRoleDisplayName(this.newRole)}`);
      this.editDialogVisible = false;
      await this.loadData();
    } catch (error) {
      this.toastService.error('Error', 'Failed to update user role');
      console.error('Failed to update role:', error);
    } finally {
      this.saving.set(false);
    }
  }

  openCreateDialog(): void {
    this.newUserEmail = '';
    this.newUserPassword = '';
    this.newUserRole = UserRole.CASHIER;
    this.createDialogVisible = true;
  }

  async createUser(): Promise<void> {
    if (!this.newUserEmail || !this.newUserPassword || !this.newUserRole) return;

    this.creating.set(true);
    try {
      const result = await this.userRoleService.createUser(this.newUserEmail, this.newUserPassword, this.newUserRole);
      if (result.warning) {
        this.toastService.warn('User Created', result.warning);
      } else {
        this.toastService.success('User Created', `${this.newUserEmail} created as ${getRoleDisplayName(this.newUserRole)}`);
      }
      this.createDialogVisible = false;
      await this.loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      this.toastService.error('Error', message);
      console.error('Failed to create user:', error);
    } finally {
      this.creating.set(false);
    }
  }
}
