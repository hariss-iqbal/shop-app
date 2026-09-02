import { Component, OnDestroy, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SeoService } from '../../../shared/services/seo.service';
import { ShopDetailsService } from '../../../core/services/shop-details.service';
import { MetaPixelService } from '../../../core/services/meta-pixel.service';
import { PromoBannerComponent } from '../promo-banner/promo-banner.component';

interface FaqItem {
  question: string;
  answer: string;
  open: boolean;
}

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [PromoBannerComponent],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent implements OnInit, OnDestroy {

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
    {
      question: 'Are your phones PTA approved?',
      answer: 'We keep both PTA-approved and Non-PTA phones, so you can pick whatever suits you best. We also stock open-box and freshly imported units — genuinely brand new, with not a single day of use in Pakistan. Every listing clearly shows its PTA status up front, so there are no surprises.',
      open: false
    },
    {
      question: 'How does 0% installment work?',
      answer: 'Installment plans are available through our trusted third-party providers. Just reach out to us first on WhatsApp, and we\'ll walk you through the available options, eligibility, and the simple steps to get set up.',
      open: false
    },
    {
      question: 'Delivery to my city?',
      answer: 'Absolutely — we deliver nationwide across Pakistan through reliable couriers.',
      open: false
    },
    {
      question: "Can I return if I don't like it?",
      answer: 'All our phones are pre-checked before sale, and you\'re welcome to inspect your device at handover so you\'re fully sure of it before you commit. Each phone is also backed by a checking warranty on its main functions, for complete peace of mind.',
      open: false
    },
    {
      question: 'Do you offer warranty?',
      answer: 'Yes. Brand-new, sealed phones come with the official manufacturer\'s warranty. Every device is also thoroughly tested before sale and backed by our in-store checking warranty for added peace of mind.',
      open: false
    }
  ];

  constructor(
    private seoService: SeoService,
    public shopDetailsService: ShopDetailsService,
    private router: Router,
    private metaPixel: MetaPixelService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.shopDetailsService.getShopDetails();

    const shopName = this.shopDetailsService.shopName() || 'Smart Cell';
    this.seoService.updateMetaTags({
      title: `${shopName} — Pixel, iPhone & Samsung, delivered nationwide`,
      description: 'Hand-picked Google Pixel, iPhone & Samsung — new and pre-owned. PTA-checked, pre-tested, and delivered to your door nationwide.',
      url: '/'
    });

    this.startRotation();
  }

  ngOnDestroy(): void {
    this.stopRotation();
  }

  toggleFaq(index: number): void {
    this.faqs[index].open = !this.faqs[index].open;
  }

  navigateToCatalog(): void {
    this.router.navigate(['/catalog']);
  }

  whatsappLink(): string {
    const num = this.shopDetailsService.whatsappNumber();
    if (num) return `https://wa.me/${num.replace(/[^0-9]/g, '')}`;
    return '#';
  }

  /** No product context here — the visitor hasn't picked a phone yet. */
  trackWhatsAppClick(): void {
    this.metaPixel.contact('whatsapp');
  }
}
