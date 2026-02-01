import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { UserRoleService } from '../../../../core/services/user-role.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { UserRole, getRoleDisplayName } from '../../../../enums/user-role.enum';
import { RolePermissionRecord } from '../../../../models/user-role.model';

interface PermissionConfig {
  key: string;
  label: string;
  description: string;
  category: string;
}

interface PermissionRow {
  permission: PermissionConfig;
  admin: boolean;
  manager: boolean;
  cashier: boolean;
  saving: { admin: boolean; manager: boolean; cashier: boolean };
}

/**
 * Permission Management Component
 * Allows admins to configure permissions for each role
 * Feature: F-013 Role-Based Access Control
 */
@Component({
  selector: 'app-permission-management',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TagModule,
    ButtonModule,
    CardModule,
    TooltipModule,
    ToggleSwitchModule,
    ProgressSpinnerModule,
    RouterLink
  ],
  templateUrl: './permission-management.component.html'
})
export class PermissionManagementComponent implements OnInit {
  private userRoleService = inject(UserRoleService);
  private toastService = inject(ToastService);

  loading = signal(true);
  permissionRows = signal<PermissionRow[]>([]);

  // Permission definitions with labels and descriptions
  private readonly permissionConfigs: PermissionConfig[] = [
    // Dashboard & Reports
    { key: 'canAccessDashboard', label: 'Access Dashboard', description: 'View dashboard analytics and statistics', category: 'Dashboard & Reports' },
    { key: 'canAccessReports', label: 'Access Reports', description: 'View and generate reports', category: 'Dashboard & Reports' },
    { key: 'canAccessAuditLogs', label: 'Access Audit Logs', description: 'View system audit logs', category: 'Dashboard & Reports' },

    // Inventory Management
    { key: 'canAccessInventory', label: 'Access Inventory', description: 'View and manage phone inventory', category: 'Inventory Management' },
    { key: 'canAccessBrands', label: 'Access Brands', description: 'View and manage phone brands', category: 'Inventory Management' },
    { key: 'canAccessPurchaseOrders', label: 'Access Purchase Orders', description: 'View and manage purchase orders', category: 'Inventory Management' },
    { key: 'canAccessSuppliers', label: 'Access Suppliers', description: 'View and manage suppliers', category: 'Inventory Management' },
    { key: 'canAccessStorage', label: 'Access Storage', description: 'Manage file storage and uploads', category: 'Inventory Management' },

    // Sales & Transactions
    { key: 'canAccessSales', label: 'Access Sales', description: 'Create and view sales transactions', category: 'Sales & Transactions' },
    { key: 'canProcessRefunds', label: 'Process Refunds', description: 'Process customer refunds', category: 'Sales & Transactions' },
    { key: 'canAccessReceiptSequences', label: 'Access Receipt Sequences', description: 'Configure receipt numbering', category: 'Sales & Transactions' },

    // Communication
    { key: 'canAccessMessages', label: 'Access Messages', description: 'View and send messages', category: 'Communication' },

    // Administration
    { key: 'canManageUsers', label: 'Manage Users', description: 'Manage user accounts and roles', category: 'Administration' },
    { key: 'canAccessSystemSettings', label: 'Access System Settings', description: 'Configure system settings', category: 'Administration' }
  ];

  // Protected permissions that cannot be disabled for admin
  private readonly protectedAdminPermissions = ['canManageUsers', 'canAccessSystemSettings'];

  async ngOnInit(): Promise<void> {
    await this.loadPermissions();
  }

  async loadPermissions(): Promise<void> {
    this.loading.set(true);
    try {
      const permissions = await this.userRoleService.getAllPermissions();
      this.buildPermissionRows(permissions);
    } catch (error) {
      console.error('Failed to load permissions:', error);
      this.toastService.error('Error', 'Failed to load permissions');
    } finally {
      this.loading.set(false);
    }
  }

  private buildPermissionRows(dbPermissions: RolePermissionRecord[]): void {
    // Create a map for quick lookup
    const permMap = new Map<string, boolean>();
    for (const p of dbPermissions) {
      permMap.set(`${p.role}:${p.permission}`, p.enabled);
    }

    // Build rows from permission configs
    const rows: PermissionRow[] = this.permissionConfigs.map(config => ({
      permission: config,
      admin: permMap.get(`admin:${config.key}`) ?? false,
      manager: permMap.get(`manager:${config.key}`) ?? false,
      cashier: permMap.get(`cashier:${config.key}`) ?? false,
      saving: { admin: false, manager: false, cashier: false }
    }));

    this.permissionRows.set(rows);
  }

  isProtectedPermission(permission: string, role: string): boolean {
    return role === 'admin' && this.protectedAdminPermissions.includes(permission);
  }

  async onPermissionChange(row: PermissionRow, role: 'admin' | 'manager' | 'cashier', enabled: boolean): Promise<void> {
    // Set saving state
    row.saving[role] = true;

    try {
      await this.userRoleService.updatePermission({
        role: role as UserRole,
        permission: row.permission.key,
        enabled
      });

      this.toastService.success(
        'Permission Updated',
        `${row.permission.label} ${enabled ? 'enabled' : 'disabled'} for ${getRoleDisplayName(role as UserRole)}`
      );
    } catch (error) {
      // Revert the change
      row[role] = !enabled;
      console.error('Failed to update permission:', error);
      this.toastService.error('Error', error instanceof Error ? error.message : 'Failed to update permission');
    } finally {
      row.saving[role] = false;
    }
  }
}
