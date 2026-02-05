import { Component, inject, signal, computed, HostListener, PLATFORM_ID } from '@angular/core';
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
import { PhoneComparisonService } from '../../../shared/services/phone-comparison.service';
import { ShopDetailsService } from '../../../core/services/shop-details.service';
import { environment } from '../../../../environments/environment';

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
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private router = inject(Router);

  themeService = inject(ThemeService);
  comparisonService = inject(PhoneComparisonService);
  shopDetailsService = inject(ShopDetailsService);

  currentYear = new Date().getFullYear();
  mobileMenuOpen = signal(false);
  mobileSearchOpen = signal(false);
  searchQuery = '';

  shopName = computed(() => this.shopDetailsService.cachedDetails()?.shopName ?? environment.businessInfo.name);
  phoneDisplay = computed(() => this.shopDetailsService.cachedDetails()?.phoneDisplay ?? environment.businessInfo.phoneDisplay);
  phoneLink = computed(() => this.shopDetailsService.cachedDetails()?.phoneLink ?? environment.businessInfo.phoneLink);
  email = computed(() => this.shopDetailsService.cachedDetails()?.email ?? environment.businessInfo.email);
  whatsappNumber = computed(() => this.shopDetailsService.cachedDetails()?.whatsappNumber ?? environment.whatsapp.phoneNumber);
  address = computed(() => this.shopDetailsService.cachedDetails()?.address ?? environment.businessInfo.address);
  weekdayHours = computed(() => this.shopDetailsService.cachedDetails()?.weekdayHours ?? environment.businessInfo.hours.weekdays);
  facebookUrl = computed(() => this.shopDetailsService.cachedDetails()?.facebookUrl ?? '#');
  instagramUrl = computed(() => this.shopDetailsService.cachedDetails()?.instagramUrl ?? '#');
  twitterUrl = computed(() => this.shopDetailsService.cachedDetails()?.twitterUrl ?? '#');

  hasEmail = computed(() => !!this.shopDetailsService.cachedDetails()?.email);

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
      this.router.navigate(['/catalog'], {
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
