import { Component, inject, OnInit, OnDestroy, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { SupabaseAuthService } from '../../../core';
import { ToastService, MessageCountService, ThemeService } from '../../../shared';
import { SkipLinkComponent } from '../../../shared/components/skip-link.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
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
    SkipLinkComponent
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  authService = inject(SupabaseAuthService);
  messageCountService = inject(MessageCountService);
  themeService = inject(ThemeService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  sidebarVisible = signal(false);
  sidebarCollapsed = signal(this.loadSidebarState());
  loggingOut = false;

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-chart-bar', route: '/admin/dashboard' },
    { label: 'Inventory', icon: 'pi pi-mobile', route: '/admin/inventory' },
    { label: 'Brands', icon: 'pi pi-tag', route: '/admin/brands' },
    { label: 'Purchase Orders', icon: 'pi pi-file', route: '/admin/purchase-orders' },
    { label: 'Suppliers', icon: 'pi pi-truck', route: '/admin/suppliers' },
    { label: 'Sales', icon: 'pi pi-dollar', route: '/admin/sales' },
    { label: 'Messages', icon: 'pi pi-envelope', route: '/admin/messages', showBadge: true },
    { label: 'Storage', icon: 'pi pi-cloud', route: '/admin/storage' }
  ];

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
}
