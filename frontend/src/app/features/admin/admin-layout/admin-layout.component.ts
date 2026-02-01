import { Component, inject, OnInit, OnDestroy, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { SupabaseAuthService, ViewportService } from '../../../core';
import {
  ToastService,
  MessageCountService,
  ThemeService,
  OfflineIndicatorComponent,
  MobileBottomNavComponent,
  MobileQuickActionsComponent
} from '../../../shared';
import { SkipLinkComponent } from '../../../shared/components/skip-link.component';
import { Permission, getRoleDisplayName, getRoleSeverity } from '../../../enums/user-role.enum';
import { QuickActionEvent } from '../../../shared/components/mobile-quick-actions/mobile-quick-actions.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  permission: Permission;
  showBadge?: boolean;
}

const SIDEBAR_COLLAPSED_KEY = 'phone-shop-sidebar-collapsed';

@Component({
  selector: 'app-admin-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    DrawerModule,
    ButtonModule,
    BadgeModule,
    RippleModule,
    TooltipModule,
    TagModule,
    SkipLinkComponent,
    OfflineIndicatorComponent,
    MobileBottomNavComponent,
    MobileQuickActionsComponent
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  authService = inject(SupabaseAuthService);
  messageCountService = inject(MessageCountService);
  themeService = inject(ThemeService);
  viewportService = inject(ViewportService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  sidebarVisible = signal(false);
  sidebarCollapsed = signal(this.loadSidebarState());
  loggingOut = false;

  getRoleDisplayName = getRoleDisplayName;
  getRoleSeverity = getRoleSeverity;

  private readonly allNavItems: NavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-chart-bar', route: '/admin/dashboard', permission: 'canAccessDashboard' },
    { label: 'Inventory', icon: 'pi pi-mobile', route: '/admin/inventory', permission: 'canAccessInventory' },
    { label: 'Location Inventory', icon: 'pi pi-map-marker', route: '/admin/location-inventory', permission: 'canAccessInventory' },
    { label: 'Store Locations', icon: 'pi pi-building', route: '/admin/locations', permission: 'canAccessInventory' },
    { label: 'Stock Transfers', icon: 'pi pi-arrows-h', route: '/admin/inventory-transfers', permission: 'canAccessInventory' },
    { label: 'Brands', icon: 'pi pi-tag', route: '/admin/brands', permission: 'canAccessBrands' },
    { label: 'Purchase Orders', icon: 'pi pi-file', route: '/admin/purchase-orders', permission: 'canAccessPurchaseOrders' },
    { label: 'Suppliers', icon: 'pi pi-truck', route: '/admin/suppliers', permission: 'canAccessSuppliers' },
    { label: 'Sales', icon: 'pi pi-dollar', route: '/admin/sales', permission: 'canAccessSales' },
    { label: 'Sales Dashboard', icon: 'pi pi-chart-line', route: '/admin/sales-dashboard', permission: 'canAccessSales' },
    { label: 'Customers', icon: 'pi pi-id-card', route: '/admin/customers', permission: 'canAccessSales' },
    { label: 'Customer Lookup', icon: 'pi pi-search', route: '/admin/sales/customer-lookup', permission: 'canAccessSales' },
    { label: 'Receipts', icon: 'pi pi-receipt', route: '/admin/receipts', permission: 'canAccessSales' },
    { label: 'Receipt Numbers', icon: 'pi pi-hashtag', route: '/admin/receipt-sequences', permission: 'canAccessReceiptSequences' },
    { label: 'Refunds', icon: 'pi pi-refresh', route: '/admin/refunds', permission: 'canProcessRefunds' },
    { label: 'Messages', icon: 'pi pi-envelope', route: '/admin/messages', permission: 'canAccessMessages', showBadge: true },
    { label: 'Storage', icon: 'pi pi-cloud', route: '/admin/storage', permission: 'canAccessStorage' },
    { label: 'User Management', icon: 'pi pi-users', route: '/admin/users', permission: 'canManageUsers' },
    { label: 'Audit Logs', icon: 'pi pi-history', route: '/admin/audit-logs', permission: 'canAccessAuditLogs' },
    { label: 'Loyalty Program', icon: 'pi pi-gift', route: '/admin/loyalty', permission: 'canAccessSales' },
    { label: 'Coupons', icon: 'pi pi-ticket', route: '/admin/coupons', permission: 'canAccessSales' }
  ];

  readonly navItems = computed(() => {
    const permissions = this.authService.permissions();
    if (!permissions) return [];

    return this.allNavItems.filter(item => permissions[item.permission]);
  });

  ngOnInit(): void {
    this.messageCountService.initAuthAwareSubscription();
  }

  ngOnDestroy(): void {
    this.messageCountService.destroyAuthAwareSubscription();
  }

  async onLogout(): Promise<void> {
    this.loggingOut = true;
    const result = await this.authService.signOut();
    this.loggingOut = false;

    if (result.success) {
      this.toastService.info('Logged Out', 'You have been signed out successfully');
      this.router.navigate(['/']);
    } else {
      this.toastService.error('Logout Failed', result.error || 'An error occurred');
    }
  }

  toggleSidebar(): void {
    const newState = !this.sidebarCollapsed();
    this.sidebarCollapsed.set(newState);
    this.saveSidebarState(newState);
  }

  private loadSidebarState(): boolean {
    if (!this.isBrowser) return false;
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  }

  private saveSidebarState(collapsed: boolean): void {
    if (!this.isBrowser) return;
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }

  /**
   * Handle quick action events from the mobile FAB
   * Feature: F-025 Mobile-Optimized Interface
   */
  onQuickAction(event: QuickActionEvent): void {
    switch (event.action) {
      case 'scan-barcode':
        // The barcode scanner will be triggered via a separate dialog
        // This could be enhanced to open a global barcode scanner dialog
        this.toastService.info('Scan Barcode', 'Use the scanner button in the sales form');
        break;
      case 'check-inventory':
        this.router.navigate(['/admin/inventory']);
        break;
      // Other actions are handled by the quick actions component itself
    }
  }
}
