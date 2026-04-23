import { Component, ElementRef, HostListener, ViewChild, computed, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd, Event } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SkipLinkComponent } from '../../../shared/components/skip-link.component';
import { BackToTopComponent } from '../../../shared/components/back-to-top.component';
import { ThemeService } from '../../../shared';
import { ShopDetailsService } from '../../../core/services/shop-details.service';
import { ViewportScroller } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-public-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    InputTextModule,
    SkipLinkComponent,
    BackToTopComponent
  ],
  templateUrl: './public-layout.component.html',
  styleUrls: ['./public-layout.component.scss']
})
export class PublicLayoutComponent {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor(
    private router: Router,
    public themeService: ThemeService,
    public shopDetailsService: ShopDetailsService
  ) {
    const scroller = inject(ViewportScroller);
    router.events.pipe(
      filter((e: Event): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      scroller.scrollToPosition([0, 0]);
      this.showFooter.set(!e.urlAfterRedirects.startsWith('/catalog'));
    });
  }

  currentYear = new Date().getFullYear();
  searchOpen = signal(false);
  searchQuery = signal('');
  showFooter = signal(true);

  shopName = this.shopDetailsService.shopName;
  whatsappNumber = this.shopDetailsService.whatsappNumber;
  facebookUrl = computed(() => this.shopDetailsService.facebookUrl() || '#');
  instagramUrl = computed(() => this.shopDetailsService.instagramUrl() || '#');
  twitterUrl = computed(() => this.shopDetailsService.twitterUrl() || '#');

  openSearch(): void {
    this.searchOpen.set(true);
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 50);
  }

  closeSearch(): void {
    this.searchOpen.set(false);
    this.searchQuery.set('');
  }

  submitSearch(): void {
    const q = this.searchQuery().trim();
    if (q) {
      this.router.navigate(['/catalog'], { queryParams: { search: q } });
      this.closeSearch();
    }
  }

  navigateToCatalog(): void {
    this.router.navigate(['/catalog']);
  }

  @HostListener('window:keydown.escape')
  onEscapeKey(): void {
    if (this.searchOpen()) {
      this.closeSearch();
    }
  }
}
