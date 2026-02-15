import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID, computed, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { filter, Subscription } from 'rxjs';
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
import { ShopDetailsService } from '../../../core/services/shop-details.service';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  permission: Permission;
  showBadge?: boolean;
}

const SIDEBAR_COLLAPSED_KEY = 'shop-sidebar-collapsed';

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
export class AdminLayoutComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mainContent') mainContent!: ElementRef<HTMLElement>;
  private routerSub?: Subscription;

  shopName = this.shopDetailsService.shopName;

  constructor(
    public authService: SupabaseAuthService,
    public messageCountService: MessageCountService,
    public themeService: ThemeService,
    public viewportService: ViewportService,
    private router: Router,
    private toastService: ToastService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private shopDetailsService: ShopDetailsService
  ) { }
  private isBrowser = isPlatformBrowser(this.platformId);

  sidebarVisible = signal(false);
  sidebarCollapsed = signal(this.loadSidebarState());
  loggingOut = false;

  getRoleDisplayName = getRoleDisplayName;
  getRoleSeverity = getRoleSeverity;

  private readonly allNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'pi pi-chart-bar', route: '/admin/dashboard', permission: 'canAccessDashboard' },
    { id: 'inventory', label: 'Inventory', icon: 'pi pi-mobile', route: '/admin/inventory', permission: 'canAccessInventory' },
    { id: 'location-inventory', label: 'Location Inventory', icon: 'pi pi-map-marker', route: '/admin/location-inventory', permission: 'canAccessInventory' },
    { id: 'locations', label: 'Store Locations', icon: 'pi pi-building', route: '/admin/locations', permission: 'canAccessInventory' },
    { id: 'inventory-transfers', label: 'Stock Transfers', icon: 'pi pi-arrows-h', route: '/admin/inventory-transfers', permission: 'canAccessInventory' },
    { id: 'brands', label: 'Brands', icon: 'pi pi-tag', route: '/admin/brands', permission: 'canAccessBrands' },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: 'pi pi-file', route: '/admin/purchase-orders', permission: 'canAccessPurchaseOrders' },
    { id: 'suppliers', label: 'Suppliers', icon: 'pi pi-truck', route: '/admin/suppliers', permission: 'canAccessSuppliers' },
    { id: 'sales', label: 'Sales', icon: 'pi pi-dollar', route: '/admin/sales', permission: 'canAccessSales' },
    { id: 'sales-dashboard', label: 'Sales Dashboard', icon: 'pi pi-chart-line', route: '/admin/sales-dashboard', permission: 'canAccessSales' },
    { id: 'customers', label: 'Customers', icon: 'pi pi-id-card', route: '/admin/customers', permission: 'canAccessSales' },
    { id: 'customer-lookup', label: 'Customer Lookup', icon: 'pi pi-search', route: '/admin/sales/customer-lookup', permission: 'canAccessSales' },
    { id: 'receipts', label: 'Receipts', icon: 'pi pi-receipt', route: '/admin/receipts', permission: 'canAccessSales' },
    { id: 'receipt-sequences', label: 'Receipt Numbers', icon: 'pi pi-hashtag', route: '/admin/receipt-sequences', permission: 'canAccessReceiptSequences' },
    { id: 'refunds', label: 'Refunds', icon: 'pi pi-refresh', route: '/admin/refunds', permission: 'canProcessRefunds' },
    { id: 'messages', label: 'Messages', icon: 'pi pi-envelope', route: '/admin/messages', permission: 'canAccessMessages', showBadge: true },
    // { id: 'storage', label: 'Storage', icon: 'pi pi-cloud', route: '/admin/storage', permission: 'canAccessStorage' },
    { id: 'users', label: 'User Management', icon: 'pi pi-users', route: '/admin/users', permission: 'canManageUsers' },
    { id: 'audit-logs', label: 'Audit Logs', icon: 'pi pi-history', route: '/admin/audit-logs', permission: 'canAccessAuditLogs' },
    // { id: 'loyalty', label: 'Loyalty Program', icon: 'pi pi-gift', route: '/admin/loyalty', permission: 'canAccessSales' },
    // { id: 'coupons', label: 'Coupons', icon: 'pi pi-ticket', route: '/admin/coupons', permission: 'canAccessSales' },
    { id: 'sidebar-settings', label: 'Sidebar Settings', icon: 'pi pi-sliders-h', route: '/admin/sidebar-settings', permission: 'canAccessDashboard' },
    { id: 'shop-details', label: 'Shop Details', icon: 'pi pi-cog', route: '/admin/shop-details', permission: 'canAccessDashboard' }
  ];

  readonly navItems = computed(() => {
    const permissions = this.authService.permissions();
    if (!permissions) return [];

    const filtered = this.allNavItems.filter(item => permissions[item.permission]);
    const order = this.shopDetailsService.sidebarItemOrder();
    if (!order || order.length === 0) return filtered;

    // Sort by configured order; items not in the order list go to the end
    return [...filtered].sort((a, b) => {
      const aIdx = order.indexOf(a.id);
      const bIdx = order.indexOf(b.id);
      if (aIdx === -1 && bIdx === -1) return 0;
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
  });

  ngOnInit(): void {
    this.messageCountService.initAuthAwareSubscription();
  }

  ngAfterViewInit(): void {
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.mainContent?.nativeElement) {
          this.mainContent.nativeElement.scrollTop = 0;
        }
      });
  }

  ngOnDestroy(): void {
    this.messageCountService.destroyAuthAwareSubscription();
    this.routerSub?.unsubscribe();
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
