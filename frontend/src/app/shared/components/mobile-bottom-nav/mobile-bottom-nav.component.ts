import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';

import { ViewportService } from '../../../core/services/viewport.service';
import { SupabaseAuthService } from '../../../core/services/supabase-auth.service';
import { MessageCountService } from '../../services/message-count.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  permission: string;
  badge?: () => number;
}

/**
 * Mobile Bottom Navigation Component
 * Feature: F-025 Mobile-Optimized Interface
 *
 * Provides a fixed bottom navigation bar for mobile devices with
 * quick access to critical POS features (sales, receipts, refunds).
 */
@Component({
  selector: 'app-mobile-bottom-nav',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    ButtonModule,
    BadgeModule,
    RippleModule
  ],
  templateUrl: './mobile-bottom-nav.component.html',
  styleUrls: ['./mobile-bottom-nav.component.scss']
})
export class MobileBottomNavComponent {
  private viewportService = inject(ViewportService);
  private authService = inject(SupabaseAuthService);
  private messageCountService = inject(MessageCountService);
  private router = inject(Router);

  private readonly allNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-chart-bar',
      route: '/admin/dashboard',
      permission: 'canAccessDashboard'
    },
    {
      label: 'New Sale',
      icon: 'pi pi-plus-circle',
      route: '/admin/sales/new',
      permission: 'canAccessSales'
    },
    {
      label: 'Sales',
      icon: 'pi pi-dollar',
      route: '/admin/sales',
      permission: 'canAccessSales'
    },
    {
      label: 'Receipts',
      icon: 'pi pi-receipt',
      route: '/admin/receipts',
      permission: 'canAccessSales'
    },
    {
      label: 'Messages',
      icon: 'pi pi-envelope',
      route: '/admin/messages',
      permission: 'canAccessMessages',
      badge: () => this.messageCountService.unreadCount()
    }
  ];

  readonly shouldShow = computed(() => {
    // Only show on mobile devices in admin routes
    const isMobile = this.viewportService.isMobile() || this.viewportService.isTablet();
    const isAdminRoute = this.router.url.startsWith('/admin');
    return isMobile && isAdminRoute;
  });

  readonly visibleNavItems = computed(() => {
    const permissions = this.authService.permissions();
    if (!permissions) return [];

    return this.allNavItems.filter(item => {
      const perm = permissions[item.permission as keyof typeof permissions];
      return perm === true;
    });
  });
}
