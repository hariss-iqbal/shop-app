import { Component, HostListener, Inject, PLATFORM_ID, computed, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { BadgeModule } from 'primeng/badge';
import { SkipLinkComponent } from '../../../shared/components/skip-link.component';
import { BackToTopComponent } from '../../../shared/components/back-to-top.component';
import { ThemeService } from '../../../shared';
import { ProductComparisonService } from '../../../shared/services/product-comparison.service';
import { ShopDetailsService } from '../../../core/services/shop-details.service';

@Component({
  selector: 'app-public-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    ButtonModule,
    DrawerModule,
    TooltipModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    BadgeModule,
    SkipLinkComponent,
    BackToTopComponent
  ],
  templateUrl: './public-layout.component.html',
  styleUrls: ['./public-layout.component.scss']
})
export class PublicLayoutComponent {
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    public themeService: ThemeService,
    public comparisonService: ProductComparisonService,
    public shopDetailsService: ShopDetailsService
  ) { }
  private isBrowser = isPlatformBrowser(this.platformId);

  currentYear = new Date().getFullYear();
  mobileMenuOpen = signal(false);
  mobileSearchOpen = signal(false);
  searchQuery = '';

  shopName = this.shopDetailsService.shopName;
  phoneDisplay = this.shopDetailsService.phoneDisplay;
  phoneLink = this.shopDetailsService.phoneLink;
  email = this.shopDetailsService.email;
  whatsappNumber = this.shopDetailsService.whatsappNumber;
  address = this.shopDetailsService.address;
  weekdayHours = this.shopDetailsService.weekdayHours;
  facebookUrl = computed(() => this.shopDetailsService.facebookUrl() || '#');
  instagramUrl = computed(() => this.shopDetailsService.instagramUrl() || '#');
  twitterUrl = computed(() => this.shopDetailsService.twitterUrl() || '#');

  hasEmail = this.shopDetailsService.hasEmail;

  get mobileMenuVisible(): boolean {
    return this.mobileMenuOpen();
  }

  set mobileMenuVisible(value: boolean) {
    this.mobileMenuOpen.set(value);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  performSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/'], {
        queryParams: { search: this.searchQuery.trim() }
      });
      this.searchQuery = '';
    }
  }

  @HostListener('window:keydown.escape')
  onEscapeKey(): void {
    if (this.mobileMenuOpen()) {
      this.closeMobileMenu();
      // Return focus to menu button
      if (this.isBrowser) {
        const menuButton = document.querySelector('[aria-controls="mobile-nav-sidebar"]') as HTMLElement;
        menuButton?.focus();
      }
    }
    if (this.mobileSearchOpen()) {
      this.mobileSearchOpen.set(false);
    }
  }
}
