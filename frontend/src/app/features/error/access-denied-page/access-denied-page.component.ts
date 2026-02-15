import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SupabaseAuthService } from '../../../core';
import { getRoleDisplayName, getRoleSeverity, UserRole } from '../../../enums/user-role.enum';

/**
 * Access Denied Page Component
 * Displayed when user attempts to access a feature they don't have permission for
 * Feature: F-013 Role-Based Access Control
 *
 * Acceptance Criteria:
 * - Given Cashier attempts to access admin features, when access is attempted,
 *   then 'Access Denied' message is displayed
 */
@Component({
  selector: 'app-access-denied-page',
  imports: [ButtonModule, CardModule, TagModule],
  templateUrl: './access-denied-page.component.html',
  styleUrls: ['./access-denied-page.component.scss']
})
export class AccessDeniedPageComponent {
  constructor(
    public authService: SupabaseAuthService,
    private router: Router
  ) { }

  isLoggingOut = false;

  getRoleDisplayName = getRoleDisplayName;
  getRoleSeverity = getRoleSeverity;

  /**
   * Get a context-aware message based on the user's role
   */
  getContextMessage(): string {
    const role = this.authService.userRole();

    if (role === UserRole.CASHIER) {
      return 'As a Cashier, you have access to sales processing only. Features like inventory, refunds, and reports require a Manager or Admin role.';
    }

    if (role === UserRole.MANAGER) {
      return 'As a Manager, you have access to most features. However, some administrative functions like user management and system settings require Admin privileges.';
    }

    return 'You do not have the required permissions to access this feature.';
  }

  navigateToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  navigateToSales(): void {
    this.router.navigate(['/admin/sales']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  async logout(): Promise<void> {
    if (this.isLoggingOut) return;

    this.isLoggingOut = true;
    try {
      await this.authService.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.isLoggingOut = false;
    }
    // Always navigate to home page, regardless of signOut result
    await this.router.navigate(['/']);
  }
}
