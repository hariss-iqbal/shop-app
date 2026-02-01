import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { SupabaseAuthService } from '../../core';
import { Permission, UserRole } from '../../enums/user-role.enum';

/**
 * Structural directive to show/hide elements based on user permissions
 * Usage: *appHasPermission="'canProcessRefunds'"
 * Feature: F-013 Role-Based Access Control
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private authService = inject(SupabaseAuthService);
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);

  private hasView = false;
  private requiredPermission: Permission | null = null;

  @Input() set appHasPermission(permission: Permission) {
    this.requiredPermission = permission;
    this.updateView();
  }

  constructor() {
    effect(() => {
      this.authService.permissions();
      this.updateView();
    });
  }

  private updateView(): void {
    if (!this.requiredPermission) return;

    const hasPermission = this.authService.hasPermission(this.requiredPermission);

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

/**
 * Structural directive to show/hide elements based on user role
 * Usage: *appHasRole="'admin'" or *appHasRole="['admin', 'manager']"
 * Feature: F-013 Role-Based Access Control
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective {
  private authService = inject(SupabaseAuthService);
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);

  private hasView = false;
  private allowedRoles: UserRole[] = [];

  @Input() set appHasRole(roles: UserRole | UserRole[]) {
    this.allowedRoles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  constructor() {
    effect(() => {
      this.authService.userRole();
      this.updateView();
    });
  }

  private updateView(): void {
    const currentRole = this.authService.userRole();
    const hasRole = currentRole ? this.allowedRoles.includes(currentRole) : false;

    if (hasRole && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasRole && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

/**
 * Structural directive to show elements only for admin users
 * Usage: *appIsAdmin
 * Feature: F-013 Role-Based Access Control
 */
@Directive({
  selector: '[appIsAdmin]',
  standalone: true
})
export class IsAdminDirective {
  private authService = inject(SupabaseAuthService);
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);

  private hasView = false;

  constructor() {
    effect(() => {
      const isAdmin = this.authService.isAdmin();
      this.updateView(isAdmin);
    });
  }

  private updateView(isAdmin: boolean): void {
    if (isAdmin && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isAdmin && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

/**
 * Structural directive to show elements only for manager or admin users
 * Usage: *appIsManagerOrAdmin
 * Feature: F-013 Role-Based Access Control
 */
@Directive({
  selector: '[appIsManagerOrAdmin]',
  standalone: true
})
export class IsManagerOrAdminDirective {
  private authService = inject(SupabaseAuthService);
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);

  private hasView = false;

  constructor() {
    effect(() => {
      const isManagerOrAdmin = this.authService.isManagerOrAdmin();
      this.updateView(isManagerOrAdmin);
    });
  }

  private updateView(isManagerOrAdmin: boolean): void {
    if (isManagerOrAdmin && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isManagerOrAdmin && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
