import { Component, ElementRef, OnInit, signal, computed, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { SeoService } from '../../../shared/services/seo.service';
import { ShopDetailsService } from '../../../core/services/shop-details.service';
import { ProductService, ModelCatalogItem } from '../../../core/services/product.service';

interface FaqItem {
  question: string;
  open: boolean;
}

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent implements OnInit, OnDestroy {

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  searchOpen = signal(false);
  searchQuery = signal('');
  searchResults = signal<ModelCatalogItem[]>([]);
  searchLoading = signal(false);
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  modelCatalog = signal<ModelCatalogItem[]>([]);
  featuredModel = computed(() => {
    const items = this.modelCatalog();
    return items.length > 0 ? items[0] : null;
  });
  spotlightModels = computed(() =>
    this.modelCatalog().filter(m =>
      m.brandName.toLowerCase().includes('google')
    )
  );
  budgetModels = computed(() =>
    this.modelCatalog()
      .slice()
      .sort((a, b) => a.sellingPrice - b.sellingPrice)
      .slice(0, 3)
  );
  loadingProducts = signal(false);

  /* ─── Hero brand rotation ─── */
  brandSlides = [
    {
      brand: 'Pixel',
      model: 'Google Pixel 10 Pro XL',
      colors: [
        { name: 'Moonstone', swatch: '#A8A8A8', img: '/phones/pixel-moonstone.webp' },
        { name: 'Jade', swatch: '#5E7D5A', img: '/phones/pixel-jade.webp' },
        { name: 'Porcelain', swatch: '#E8E2D8', img: '/phones/pixel-porcelain.webp' },
        { name: 'Obsidian', swatch: '#2C2C2C', img: '/phones/pixel-obsidian.webp' },
      ]
    },
    {
      brand: 'Samsung',
      model: 'Samsung Galaxy S26 Ultra',
      colors: [
        { name: 'Black', swatch: '#2C2C2C', img: '/phones/samsung-s26-ultra-black.webp' },
        { name: 'White', swatch: '#E8E4E0', img: '/phones/samsung-s26-ultra-white.webp' },
        { name: 'Cobalt Violet', swatch: '#9080B8', img: '/phones/samsung-s26-ultra-cobalt-violet.webp' },
        { name: 'Sky Blue', swatch: '#A0C8E8', img: '/phones/samsung-s26-ultra-sky-blue.webp' },
      ]
    },
    {
      brand: 'iPhone',
      model: 'iPhone 17 Pro Max',
      colors: [
        { name: 'Silver', swatch: '#B8B8B8', img: '/phones/iphone-17-pro-max-silver.webp' },
        { name: 'Cosmic Orange', swatch: '#C48040', img: '/phones/iphone-17-pro-max-cosmic-orange.webp' },
        { name: 'Deep Blue', swatch: '#304880', img: '/phones/iphone-17-pro-max-deep-blue.webp' },
      ]
    },
    {
      brand: 'OnePlus',
      model: 'OnePlus 15',
      colors: [
        { name: 'Midnight Ocean', swatch: '#1A1A2E', img: '/phones/oneplus-15-midnight-ocean.webp' },
        { name: 'Sand Storm', swatch: '#C8B898', img: '/phones/oneplus-15-sand-storm.webp' },
        { name: 'Lunar Radiance', swatch: '#A0B8D0', img: '/phones/oneplus-15-lunar-radiance.webp' },
      ]
    },
  ];

  selectedBrand = signal(0);
  selectedColor = signal(0);
  brandSlide = computed(() => this.brandSlides[this.selectedBrand()]);
  heroColorName = computed(() => this.brandSlide().colors[this.selectedColor()].name);
  private rotationTimer: ReturnType<typeof setInterval> | null = null;

  selectBrand(index: number): void {
    this.selectedBrand.set(index);
    this.selectedColor.set(0);
    this.stopRotation();
  }

  selectColor(index: number): void {
    this.selectedColor.set(index);
    this.stopRotation();
  }

  private stopRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
  }

  private startRotation(): void {
    this.rotationTimer = setInterval(() => {
      const nextBrand = (this.selectedBrand() + 1) % this.brandSlides.length;
      this.selectedBrand.set(nextBrand);
      this.selectedColor.set(0);
    }, 5000);
  }

  faqs: FaqItem[] = [
    { question: 'Are your phones PTA approved?', open: false },
    { question: "What's the difference between Grade A, B, and C?", open: false },
    { question: 'How does 0% installment work?', open: false },
    { question: 'Delivery to my city?', open: false },
    { question: "Can I return if I don't like it?", open: false },
    { question: 'Do you offer warranty?', open: false }
  ];

  tradeInQuery = '';

  constructor(
    private seoService: SeoService,
    public shopDetailsService: ShopDetailsService,
    private router: Router,
    private productService: ProductService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.shopDetailsService.getShopDetails();

    const shopName = this.shopDetailsService.shopName() || 'Smart Cell';
    this.seoService.updateMetaTags({
      title: `${shopName} — Pixel, iPhone & Samsung, delivered nationwide`,
      description: 'Hand-picked Google Pixel, iPhone & Samsung — new and pre-owned. PTA-checked, graded, delivered to your door with a 7-day return.',
      url: '/'
    });

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => this.performSearch(query));

    this.startRotation();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopRotation();
  }

  private async loadProducts(): Promise<void> {
    this.loadingProducts.set(true);
    try {
      const resp = await this.productService.getModelCatalog(
        { first: 0, rows: 8 },
        {}
      );
      this.modelCatalog.set(resp.data);
    } catch {
      // silently fail — cards just won't show
    } finally {
      this.loadingProducts.set(false);
    }
  }

  openSearch(): void {
    this.searchOpen.set(true);
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 50);
  }

  closeSearch(): void {
    this.searchOpen.set(false);
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.searchLoading.set(false);
  }

  onSearchInput(query: string): void {
    this.searchQuery.set(query);
    if (query.trim().length < 2) {
      this.searchResults.set([]);
      this.searchLoading.set(false);
      return;
    }
    this.searchLoading.set(true);
    this.searchSubject.next(query.trim());
  }

  private async performSearch(query: string): Promise<void> {
    try {
      const resp = await this.productService.getModelCatalog(
        { first: 0, rows: 3 },
        { search: query }
      );
      this.searchResults.set(resp.data);
    } catch {
      this.searchResults.set([]);
    } finally {
      this.searchLoading.set(false);
    }
  }

  submitSearch(): void {
    const q = this.searchQuery().trim();
    if (q) {
      this.router.navigate(['/catalog'], { queryParams: { search: q } });
      this.closeSearch();
    }
  }

  goToResult(item: ModelCatalogItem): void {
    this.router.navigate(['/catalog'], { queryParams: { search: item.modelName } });
    this.closeSearch();
  }

  fmt(n: number): string {
    return n.toLocaleString('en-PK');
  }

  toggleFaq(index: number): void {
    this.faqs[index].open = !this.faqs[index].open;
  }

  navigateToCatalog(): void {
    this.router.navigate(['/catalog']);
  }

  getSpecs(item: ModelCatalogItem): string[] {
    const specs: string[] = [];
    if (item.storageGb) specs.push(`${item.storageGb}GB`);
    if (item.color) specs.push(item.color);
    if (item.condition) specs.push(this.getCondLabel(item.condition));
    return specs;
  }

  getCondLabel(condition: string): string {
    if (condition === 'new') return 'New';
    if (condition === 'used') return 'Pre-owned · A';
    if (condition === 'open_box') return 'Open box';
    return condition;
  }

  getCondClass(condition: string): string {
    if (condition === 'new') return 'new';
    if (condition === 'used') return 'used';
    return 'open';
  }

  gradientId(name: string): string {
    return 'pb' + name.replace(/\s/g, '');
  }

  gradientUrl(name: string): string {
    return 'url(#pb' + name.replace(/\s/g, '') + ')';
  }

  whatsappLink(): string {
    const num = this.shopDetailsService.whatsappNumber();
    if (num) return `https://wa.me/${num.replace(/[^0-9]/g, '')}`;
    return '#';
  }
}
