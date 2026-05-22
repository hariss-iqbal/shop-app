import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';

interface BannerSlide {
  brand: string;
  model: string;
  tagline: string;
  img: string;
  bg: string;
}

/**
 * Promo banner: static text on the left, auto-rotating image slideshow on the right.
 * Seamless infinite loop — a clone of the first slide is appended so advancing past the
 * last slide slides FORWARD into the clone, then snaps back instantly (no rewind).
 */
@Component({
  selector: 'app-promo-banner',
  standalone: true,
  imports: [],
  templateUrl: './promo-banner.component.html',
  styleUrls: ['./promo-banner.component.scss']
})
export class PromoBannerComponent implements OnInit, OnDestroy {
  slides: BannerSlide[] = [
    // Each gradient matches its phone's real body hue, kept darker than the phone so it pops.
    { brand: 'Google Pixel', model: '10 Pro XL', tagline: 'The flagship, maxed out', img: '/phones/pixel-10-pro-xl.png', bg: 'linear-gradient(135deg, #1f7d51 0%, #0b3422 100%)' },   // pale-green phone -> rich green
    { brand: 'Google Pixel', model: '10 Pro', tagline: 'Pro cameras, refined', img: '/phones/pixel-10-pro.png', bg: 'linear-gradient(135deg, #353f52 0%, #12161e 100%)' },          // grey/moonstone phone -> deep graphite-steel (not blue)
    { brand: 'Google Pixel', model: '10', tagline: 'Flagship essentials', img: '/phones/pixel-10.png', bg: 'linear-gradient(135deg, #28408c 0%, #0d1432 100%)' },                    // blue phone -> deep navy
    { brand: 'Google Pixel', model: '10a', tagline: 'The smart value pick', img: '/phones/pixel-10a.png', bg: 'linear-gradient(135deg, #a8364f 0%, #2c0f1a 100%)' },                  // coral phone -> deep rose
  ];

  /** Real slides + a clone of the first appended for the seamless forward loop. */
  trackSlides: BannerSlide[] = [...this.slides, this.slides[0]];

  private readonly N = this.slides.length;
  private readonly INTERVAL = 4000;
  private readonly TRANSITION = 550;   // keep in sync with .promo-track transition

  current = signal(0);        // 0..N (N = clone position)
  animate = signal(true);     // false = snap without transition
  activeDot = computed(() => this.current() % this.N);

  private timer: ReturnType<typeof setInterval> | null = null;
  private resetting = false;

  constructor(private router: Router) {}

  ngOnInit(): void { this.start(); }
  ngOnDestroy(): void { this.stop(); }

  start(): void {
    this.stop();
    this.timer = setInterval(() => this.next(), this.INTERVAL);
  }
  stop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  next(): void {
    if (this.resetting || this.current() >= this.N) return;
    this.current.update(i => i + 1);              // slides forward (… 3 -> 4(clone))
    if (this.current() === this.N) {
      // we've slid onto the clone (looks like slide 0); after the transition, snap to the real slide 0
      this.resetting = true;
      setTimeout(() => {
        this.animate.set(false);
        this.current.set(0);
        setTimeout(() => { this.animate.set(true); this.resetting = false; }, 40);
      }, this.TRANSITION);
    }
  }

  prev(): void {
    if (this.resetting) return;
    if (this.current() === 0) {
      // jump to the clone instantly, then animate back to the last real slide (seamless 1 -> 4)
      this.resetting = true;
      this.animate.set(false);
      this.current.set(this.N);
      setTimeout(() => {
        this.animate.set(true);
        this.current.set(this.N - 1);
        this.resetting = false;
      }, 40);
    } else {
      this.current.update(i => i - 1);
    }
  }

  /** Manual navigation restarts the auto-rotate timer. */
  userNext(): void { this.next(); this.start(); }
  userPrev(): void { this.prev(); this.start(); }
  go(i: number): void { if (this.resetting) return; this.current.set(i); this.start(); }

  shop(): void { this.router.navigate(['/catalog'], { queryParams: { search: 'Pixel' } }); }
}
