import { Component, inject, signal, HostListener, PLATFORM_ID } from '@angular/core';
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
  template: `
    <div class="min-h-screen flex flex-column">
      <!-- F-042: Skip Link for keyboard users -->
      <app-skip-link targetId="main-content" />

      <!-- AC_REDESIGN_004: Modern E-commerce Header -->
      <header class="surface-section shadow-1 sticky top-0 z-5">
        <!-- Top Bar (Desktop) -->
        <div class="hidden lg:block surface-ground border-bottom-1 surface-border">
          <div class="flex align-items-center justify-content-between px-6 py-2">
            <div class="flex align-items-center gap-4 text-sm text-color-secondary">
              <span class="flex align-items-center gap-1">
                <i class="pi pi-phone text-xs" aria-hidden="true"></i>
                <a href="tel:+1234567890" class="no-underline text-color-secondary hover:text-primary">+1 234 567 890</a>
              </span>
              <span class="flex align-items-center gap-1">
                <i class="pi pi-envelope text-xs" aria-hidden="true"></i>
                <a href="mailto:info&#64;phoneshop.com" class="no-underline text-color-secondary hover:text-primary">info&#64;phoneshop.com</a>
              </span>
            </div>
            <div class="flex align-items-center gap-3 text-sm">
              <a href="https://wa.me/1234567890"
                 target="_blank"
                 rel="noopener noreferrer"
                 class="no-underline text-color-secondary hover:text-primary flex align-items-center gap-1"
                 aria-label="Chat with us on WhatsApp (opens in new tab)">
                <i class="pi pi-whatsapp" aria-hidden="true"></i>
                <span>WhatsApp</span>
              </a>
              <span class="text-surface-border">|</span>
              <a routerLink="/auth/login"
                 class="no-underline text-color-secondary hover:text-primary flex align-items-center gap-1"
                 aria-label="Admin login">
                <i class="pi pi-user" aria-hidden="true"></i>
                <span>Admin</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Main Navigation -->
        <nav class="flex align-items-center justify-content-between px-3 py-3 sm:px-4 lg:px-6 gap-3"
             aria-label="Main navigation">
          <!-- Logo/Brand -->
          <a routerLink="/"
             class="flex align-items-center gap-2 text-xl font-bold text-primary no-underline flex-shrink-0"
             aria-label="Phone Shop - Home">
            <i class="pi pi-mobile text-2xl" aria-hidden="true"></i>
            <span class="hidden sm:inline">Phone Shop</span>
          </a>

          <!-- Search Bar (Desktop) -->
          <div class="hidden lg:flex flex-grow-1 max-w-30rem mx-4">
            <form (ngSubmit)="performSearch()" class="w-full">
              <p-iconfield iconPosition="left" styleClass="w-full">
                <p-inputicon styleClass="pi pi-search" />
                <input
                  pInputText
                  [(ngModel)]="searchQuery"
                  name="search"
                  class="w-full border-round-xl"
                  placeholder="Search phones..."
                  aria-label="Search phones"
                />
              </p-iconfield>
            </form>
          </div>

          <!-- Desktop Navigation (visible >= 992px) -->
          <div class="hidden lg:flex align-items-center gap-1" role="menubar">
            <a routerLink="/"
               routerLinkActive="text-primary font-semibold"
               [routerLinkActiveOptions]="{ exact: true }"
               class="px-3 py-2 border-round text-color no-underline hover:surface-hover transition-colors transition-duration-200 font-medium"
               role="menuitem"
               aria-label="Home page">
              Home
            </a>
            <a routerLink="/catalog"
               routerLinkActive="text-primary font-semibold"
               class="px-3 py-2 border-round text-color no-underline hover:surface-hover transition-colors transition-duration-200 font-medium"
               role="menuitem"
               aria-label="Browse phone catalog">
              Catalog
            </a>
            <a routerLink="/about"
               routerLinkActive="text-primary font-semibold"
               class="px-3 py-2 border-round text-color no-underline hover:surface-hover transition-colors transition-duration-200 font-medium"
               role="menuitem"
               aria-label="Learn about our shop">
              About
            </a>
            <a routerLink="/contact"
               routerLinkActive="text-primary font-semibold"
               class="px-3 py-2 border-round text-color no-underline hover:surface-hover transition-colors transition-duration-200 font-medium"
               role="menuitem"
               aria-label="Contact us">
              Contact
            </a>
          </div>

          <!-- Action Icons (Desktop) -->
          <div class="hidden lg:flex align-items-center gap-1">
            <!-- F-056: Theme Toggle -->
            <p-button
              [icon]="themeService.isDark() ? 'pi pi-sun' : 'pi pi-moon'"
              [text]="true"
              [rounded]="true"
              severity="secondary"
              (onClick)="themeService.toggleTheme()"
              [pTooltip]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
              tooltipPosition="bottom"
              [ariaLabel]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
            />
            <!-- Compare Button -->
            <a routerLink="/compare" class="no-underline relative" aria-label="Compare phones">
              <p-button
                icon="pi pi-arrows-h"
                [text]="true"
                [rounded]="true"
                severity="secondary"
                pTooltip="Compare phones"
                tooltipPosition="bottom"
              />
              @if (comparisonService.count() > 0) {
                <span class="comparison-badge">{{ comparisonService.count() }}</span>
              }
            </a>
          </div>

          <!-- Mobile Actions -->
          <div class="flex align-items-center gap-1 lg:hidden">
            <!-- Mobile Search Toggle -->
            <p-button
              icon="pi pi-search"
              [text]="true"
              [rounded]="true"
              severity="secondary"
              (onClick)="mobileSearchOpen.set(!mobileSearchOpen())"
              ariaLabel="Toggle search"
            />
            <!-- F-056: Mobile Theme Toggle -->
            <p-button
              [icon]="themeService.isDark() ? 'pi pi-sun' : 'pi pi-moon'"
              [text]="true"
              [rounded]="true"
              severity="secondary"
              (onClick)="themeService.toggleTheme()"
              [ariaLabel]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
            />
            <!-- Compare Icon (Mobile) -->
            <a routerLink="/compare" class="no-underline relative">
              <p-button
                icon="pi pi-arrows-h"
                [text]="true"
                [rounded]="true"
                severity="secondary"
                ariaLabel="Compare phones"
              />
              @if (comparisonService.count() > 0) {
                <span class="comparison-badge">{{ comparisonService.count() }}</span>
              }
            </a>
            <!-- Menu Button -->
            <p-button icon="pi pi-bars"
                      [text]="true"
                      [rounded]="true"
                      severity="secondary"
                      (onClick)="mobileMenuOpen.set(true)"
                      [attr.aria-label]="'Open navigation menu'"
                      [attr.aria-expanded]="mobileMenuOpen()"
                      aria-controls="mobile-nav-sidebar" />
          </div>
        </nav>

        <!-- Mobile Search Bar (Expandable) -->
        @if (mobileSearchOpen()) {
          <div class="lg:hidden px-3 pb-3">
            <form (ngSubmit)="performSearch(); mobileSearchOpen.set(false)" class="w-full">
              <p-iconfield iconPosition="left" styleClass="w-full">
                <p-inputicon styleClass="pi pi-search" />
                <input
                  pInputText
                  [(ngModel)]="searchQuery"
                  name="mobileSearch"
                  class="w-full"
                  placeholder="Search phones..."
                  aria-label="Search phones"
                />
              </p-iconfield>
            </form>
          </div>
        }
      </header>

      <!-- Mobile Navigation Sidebar -->
      <p-drawer [(visible)]="mobileMenuVisible"
                position="right"
                [modal]="true"
                styleClass="w-18rem"
                id="mobile-nav-sidebar"
                ariaCloseLabel="Close navigation menu">
        <ng-template pTemplate="header">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-mobile text-primary text-xl" aria-hidden="true"></i>
            <span class="font-bold text-lg">Phone Shop</span>
          </div>
        </ng-template>

        <nav class="flex flex-column gap-2 mt-3" aria-label="Mobile navigation">
          <a routerLink="/"
             routerLinkActive="bg-primary-100 text-primary"
             [routerLinkActiveOptions]="{ exact: true }"
             class="flex align-items-center gap-3 p-3 border-round text-color no-underline hover:surface-hover transition-colors transition-duration-200"
             (click)="closeMobileMenu()"
             role="menuitem"
             aria-label="Home page">
            <i class="pi pi-home text-xl" aria-hidden="true"></i>
            <span class="font-medium">Home</span>
          </a>
          <a routerLink="/catalog"
             routerLinkActive="bg-primary-100 text-primary"
             class="flex align-items-center gap-3 p-3 border-round text-color no-underline hover:surface-hover transition-colors transition-duration-200"
             (click)="closeMobileMenu()"
             role="menuitem"
             aria-label="Browse phone catalog">
            <i class="pi pi-th-large text-xl" aria-hidden="true"></i>
            <span class="font-medium">Catalog</span>
          </a>
          <a routerLink="/about"
             routerLinkActive="bg-primary-100 text-primary"
             class="flex align-items-center gap-3 p-3 border-round text-color no-underline hover:surface-hover transition-colors transition-duration-200"
             (click)="closeMobileMenu()"
             role="menuitem"
             aria-label="Learn about our shop">
            <i class="pi pi-info-circle text-xl" aria-hidden="true"></i>
            <span class="font-medium">About</span>
          </a>
          <a routerLink="/contact"
             routerLinkActive="bg-primary-100 text-primary"
             class="flex align-items-center gap-3 p-3 border-round text-color no-underline hover:surface-hover transition-colors transition-duration-200"
             (click)="closeMobileMenu()"
             role="menuitem"
             aria-label="Contact us">
            <i class="pi pi-envelope text-xl" aria-hidden="true"></i>
            <span class="font-medium">Contact</span>
          </a>

          <div class="border-top-1 surface-border my-3"></div>

          <a href="https://wa.me/1234567890"
             target="_blank"
             rel="noopener noreferrer"
             class="flex align-items-center gap-3 p-3 border-round text-color no-underline hover:surface-hover transition-colors transition-duration-200"
             (click)="closeMobileMenu()"
             role="menuitem"
             aria-label="Chat with us on WhatsApp (opens in new tab)">
            <i class="pi pi-whatsapp text-xl" aria-hidden="true"></i>
            <span class="font-medium">WhatsApp</span>
          </a>
          <a routerLink="/auth/login"
             class="flex align-items-center gap-3 p-3 border-round text-color no-underline hover:surface-hover transition-colors transition-duration-200"
             (click)="closeMobileMenu()"
             role="menuitem"
             aria-label="Admin login">
            <i class="pi pi-sign-in text-xl" aria-hidden="true"></i>
            <span class="font-medium">Admin Login</span>
          </a>
        </nav>
      </p-drawer>

      <!-- Main Content -->
      <main id="main-content" class="flex-grow-1 px-3 py-4 sm:px-4 lg:px-6" role="main">
        <router-outlet />
      </main>

      <!-- AC_REDESIGN_005: Redesigned Footer -->
      <footer class="footer-section" role="contentinfo">
        <!-- Main Footer Content -->
        <div class="footer-main">
          <div class="grid px-3 py-5 sm:px-4 lg:px-6">
            <!-- Store Info -->
            <div class="col-12 md:col-6 lg:col-4 mb-4 lg:mb-0">
              <div class="flex align-items-center gap-2 mb-4">
                <div class="footer-logo">
                  <i class="pi pi-mobile text-2xl text-white" aria-hidden="true"></i>
                </div>
                <span class="font-bold text-xl text-color">Phone Shop</span>
              </div>
              <p class="text-color-secondary line-height-3 mt-0 mb-4">
                Your trusted destination for quality mobile phones. We offer new, used, and refurbished
                devices at competitive prices with a 30-day quality guarantee.
              </p>
              <!-- Social Media Icons -->
              <div class="flex align-items-center gap-2">
                <a href="#"
                   class="social-icon"
                   aria-label="Visit our Facebook page"
                   rel="noopener noreferrer">
                  <i class="pi pi-facebook" aria-hidden="true"></i>
                </a>
                <a href="#"
                   class="social-icon"
                   aria-label="Visit our Instagram page"
                   rel="noopener noreferrer">
                  <i class="pi pi-instagram" aria-hidden="true"></i>
                </a>
                <a href="#"
                   class="social-icon"
                   aria-label="Visit our Twitter page"
                   rel="noopener noreferrer">
                  <i class="pi pi-twitter" aria-hidden="true"></i>
                </a>
                <a href="https://wa.me/1234567890"
                   class="social-icon"
                   target="_blank"
                   rel="noopener noreferrer"
                   aria-label="Chat with us on WhatsApp (opens in new tab)">
                  <i class="pi pi-whatsapp" aria-hidden="true"></i>
                </a>
              </div>
            </div>

            <!-- Quick Links -->
            <div class="col-12 md:col-6 lg:col-2 mb-4 lg:mb-0">
              <h3 class="font-semibold mb-3 mt-0 text-color">Quick Links</h3>
              <nav aria-label="Footer navigation">
                <ul class="list-none p-0 m-0">
                  <li class="mb-2">
                    <a routerLink="/"
                       class="footer-link"
                       aria-label="Home page">
                      Home
                    </a>
                  </li>
                  <li class="mb-2">
                    <a routerLink="/catalog"
                       class="footer-link"
                       aria-label="Browse phone catalog">
                      Catalog
                    </a>
                  </li>
                  <li class="mb-2">
                    <a routerLink="/about"
                       class="footer-link"
                       aria-label="Learn about our shop">
                      About Us
                    </a>
                  </li>
                  <li class="mb-2">
                    <a routerLink="/contact"
                       class="footer-link"
                       aria-label="Contact us">
                      Contact
                    </a>
                  </li>
                </ul>
              </nav>
            </div>

            <!-- Customer Service -->
            <div class="col-12 md:col-6 lg:col-2 mb-4 lg:mb-0">
              <h3 class="font-semibold mb-3 mt-0 text-color">Support</h3>
              <nav aria-label="Support links">
                <ul class="list-none p-0 m-0">
                  <li class="mb-2">
                    <a routerLink="/contact"
                       class="footer-link"
                       aria-label="FAQ">
                      FAQ
                    </a>
                  </li>
                  <li class="mb-2">
                    <a routerLink="/about"
                       class="footer-link"
                       aria-label="Warranty information">
                      Warranty
                    </a>
                  </li>
                  <li class="mb-2">
                    <a routerLink="/contact"
                       class="footer-link"
                       aria-label="Returns policy">
                      Returns
                    </a>
                  </li>
                  <li class="mb-2">
                    <a routerLink="/contact"
                       class="footer-link"
                       aria-label="Shipping information">
                      Shipping
                    </a>
                  </li>
                </ul>
              </nav>
            </div>

            <!-- Contact Info -->
            <div class="col-12 md:col-6 lg:col-4">
              <h3 class="font-semibold mb-3 mt-0 text-color">Contact Us</h3>
              <address class="not-italic">
                <ul class="list-none p-0 m-0">
                  <li class="flex align-items-start gap-3 mb-3">
                    <i class="pi pi-map-marker text-primary mt-1" aria-hidden="true"></i>
                    <span class="text-color-secondary">123 Mobile Street, Tech City, TC 12345</span>
                  </li>
                  <li class="flex align-items-center gap-3 mb-3">
                    <i class="pi pi-phone text-primary" aria-hidden="true"></i>
                    <a href="tel:+1234567890"
                       class="footer-link"
                       aria-label="Call us at +1 234 567 890">
                      +1 234 567 890
                    </a>
                  </li>
                  <li class="flex align-items-center gap-3 mb-3">
                    <i class="pi pi-envelope text-primary" aria-hidden="true"></i>
                    <a href="mailto:info&#64;phoneshop.com"
                       class="footer-link"
                       aria-label="Email us at info at phoneshop.com">
                      info&#64;phoneshop.com
                    </a>
                  </li>
                  <li class="flex align-items-center gap-3">
                    <i class="pi pi-clock text-primary" aria-hidden="true"></i>
                    <span class="text-color-secondary">Mon - Sat: 9:00 AM - 6:00 PM</span>
                  </li>
                </ul>
              </address>
            </div>
          </div>
        </div>

        <!-- Copyright Bar -->
        <div class="footer-bottom">
          <div class="flex flex-column md:flex-row align-items-center justify-content-between gap-2 px-3 py-3 sm:px-4 lg:px-6">
            <p class="m-0 text-color-secondary text-sm">
              &copy; {{ currentYear }} Phone Shop. All rights reserved.
            </p>
            <div class="flex align-items-center gap-4 text-sm">
              <a routerLink="/about" class="footer-link text-sm" aria-label="Privacy Policy">
                Privacy Policy
              </a>
              <a routerLink="/about" class="footer-link text-sm" aria-label="Terms of Service">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>

      <!-- Back to Top Button -->
      <app-back-to-top />
    </div>
  `,
  styles: [`
    /* Header Top Bar */
    .footer-section {
      background: var(--surface-section);
      border-top: 1px solid var(--surface-border);
    }

    .footer-main {
      border-bottom: 1px solid var(--surface-border);
    }

    .footer-bottom {
      background: var(--surface-ground);
    }

    .footer-logo {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, var(--primary-color) 0%, #1d4ed8 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .footer-link {
      color: var(--text-color-secondary);
      text-decoration: none;
      transition: color 0.2s ease;
      display: inline-block;
      padding: 0.25rem 0;
      min-height: 32px;
      line-height: 1.5;
    }

    .footer-link:hover {
      color: var(--primary-color);
    }

    .social-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--surface-ground);
      color: var(--text-color-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .social-icon:hover {
      background: var(--primary-color);
      color: white;
      transform: translateY(-2px);
    }

    .social-icon i {
      font-size: 1.125rem;
    }

    /* Comparison Badge */
    .comparison-badge {
      position: absolute;
      top: 0;
      right: 0;
      background: var(--primary-color);
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }

    /* Dark Theme Adjustments */
    :host-context(.dark-theme) {
      .footer-logo {
        background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
      }

      .social-icon {
        background: rgba(255, 255, 255, 0.05);
      }

      .social-icon:hover {
        background: var(--primary-color);
      }
    }
  `]
})
export class PublicLayoutComponent {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private router = inject(Router);

  themeService = inject(ThemeService);
  comparisonService = inject(PhoneComparisonService);
  currentYear = new Date().getFullYear();
  mobileMenuOpen = signal(false);
  mobileSearchOpen = signal(false);
  searchQuery = '';

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
