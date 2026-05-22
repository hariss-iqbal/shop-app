import { Component, DestroyRef, ElementRef, HostListener, ViewChild, computed, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd, Event } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SkipLinkComponent } from '../../../shared/components/skip-link.component';
import { BackToTopComponent } from '../../../shared/components/back-to-top.component';
import { ThemeService } from '../../../shared';
import { ShopDetailsService } from '../../../core/services/shop-details.service';
import { ProductService, ModelCatalogItem, ModelCatalogResponse } from '../../../core/services/product.service';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';
import { ProductFilter } from '../../../models/product.model';
import { ViewportScroller } from '@angular/common';
import { Subject, from, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';

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

  /** Minimum characters before a live search fires. */
  readonly MIN_SEARCH_CHARS = 2;
  /** How many suggestions to show in the dropdown. */
  private readonly MAX_SEARCH_RESULTS = 6;

  private readonly destroyRef = inject(DestroyRef);
  private readonly searchInput$ = new Subject<string>();

  constructor(
    private router: Router,
    private productService: ProductService,
    private imageOptimization: ImageOptimizationService,
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

    this.searchInput$.pipe(
      map(q => q.trim()),
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(term => {
        this.activeIndex.set(-1);
        if (term.length < this.MIN_SEARCH_CHARS) {
          this.searching.set(false);
          return of<ModelCatalogResponse | null>(null);
        }
        this.searching.set(true);
        return from(this.productService.getModelCatalog(
          { first: 0, rows: this.MAX_SEARCH_RESULTS, sortField: '', sortOrder: -1 },
          { search: term } as ProductFilter
        )).pipe(catchError(() => of<ModelCatalogResponse>({ data: [], total: 0 })));
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      this.searching.set(false);
      this.results.set(res?.data ?? []);
      this.totalResults.set(res?.total ?? 0);
    });
  }

  currentYear = new Date().getFullYear();
  searchOpen = signal(false);
  searchQuery = signal('');
  showFooter = signal(true);

  // Live search state
  results = signal<ModelCatalogItem[]>([]);
  totalResults = signal(0);
  searching = signal(false);
  activeIndex = signal(-1);

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
    this.results.set([]);
    this.totalResults.set(0);
    this.searching.set(false);
    this.activeIndex.set(-1);
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.searchInput$.next(value);
  }

  /** Enter key: open the highlighted suggestion if any, else run a full catalog search. */
  onSearchEnter(): void {
    const idx = this.activeIndex();
    const list = this.results();
    if (idx >= 0 && idx < list.length) {
      this.selectResult(list[idx]);
    } else {
      this.submitSearch();
    }
  }

  moveActive(delta: number): void {
    const len = this.results().length;
    if (!len) return;
    const next = (this.activeIndex() + delta + len) % len;
    this.activeIndex.set(next);
  }

  selectResult(item: ModelCatalogItem): void {
    this.router.navigate(['/product', item.slug], item.color ? { queryParams: { color: item.color } } : {});
    this.closeSearch();
  }

  submitSearch(): void {
    const q = this.searchQuery().trim();
    if (q) {
      this.router.navigate(['/catalog'], { queryParams: { search: q } });
      this.closeSearch();
    }
  }

  thumbUrl(url: string): string {
    return this.imageOptimization.getListImageUrl(url);
  }

  fmt(n: number): string {
    return n.toLocaleString('en-PK');
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

  /** Cmd+K (macOS) / Ctrl+K opens the search overlay. */
  @HostListener('window:keydown.meta.k', ['$event'])
  @HostListener('window:keydown.control.k', ['$event'])
  onSearchShortcut(event: KeyboardEvent): void {
    event.preventDefault();
    if (!this.searchOpen()) {
      this.openSearch();
    }
  }
}
