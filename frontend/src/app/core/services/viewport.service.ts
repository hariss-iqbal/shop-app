import { Injectable, signal, computed, inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Viewport breakpoints following PrimeFlex conventions
 * Feature: F-025 Mobile-Optimized Interface
 */
export enum ViewportBreakpoint {
  XS = 'xs',  // < 576px (mobile phones)
  SM = 'sm',  // >= 576px (small tablets)
  MD = 'md',  // >= 768px (tablets)
  LG = 'lg',  // >= 992px (desktops)
  XL = 'xl',  // >= 1200px (large desktops)
  XXL = 'xxl' // >= 1400px (extra large screens)
}

export interface ViewportInfo {
  width: number;
  height: number;
  breakpoint: ViewportBreakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isTouchDevice: boolean;
  hasCamera: boolean;
}

/**
 * Viewport Detection Service
 * Feature: F-025 Mobile-Optimized Interface
 *
 * Provides reactive viewport information for responsive design decisions.
 * Follows PrimeFlex breakpoint conventions for consistency.
 */
@Injectable({
  providedIn: 'root'
})
export class ViewportService implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private width = signal(this.getInitialWidth());
  private height = signal(this.getInitialHeight());
  private resizeObserver: ResizeObserver | null = null;

  readonly breakpoint = computed<ViewportBreakpoint>(() => {
    const w = this.width();
    if (w < 576) return ViewportBreakpoint.XS;
    if (w < 768) return ViewportBreakpoint.SM;
    if (w < 992) return ViewportBreakpoint.MD;
    if (w < 1200) return ViewportBreakpoint.LG;
    if (w < 1400) return ViewportBreakpoint.XL;
    return ViewportBreakpoint.XXL;
  });

  readonly isMobile = computed(() => {
    const bp = this.breakpoint();
    return bp === ViewportBreakpoint.XS || bp === ViewportBreakpoint.SM;
  });

  readonly isTablet = computed(() => {
    return this.breakpoint() === ViewportBreakpoint.MD;
  });

  readonly isDesktop = computed(() => {
    const bp = this.breakpoint();
    return bp === ViewportBreakpoint.LG || bp === ViewportBreakpoint.XL || bp === ViewportBreakpoint.XXL;
  });

  readonly isLandscape = computed(() => {
    return this.width() > this.height();
  });

  readonly isTouchDevice = computed(() => {
    if (!this.isBrowser) return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  readonly hasCamera = signal(false);

  readonly viewportInfo = computed<ViewportInfo>(() => ({
    width: this.width(),
    height: this.height(),
    breakpoint: this.breakpoint(),
    isMobile: this.isMobile(),
    isTablet: this.isTablet(),
    isDesktop: this.isDesktop(),
    isLandscape: this.isLandscape(),
    isTouchDevice: this.isTouchDevice(),
    hasCamera: this.hasCamera()
  }));

  constructor() {
    if (this.isBrowser) {
      this.initViewportListener();
      this.detectCameraSupport();
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private getInitialWidth(): number {
    if (!this.isBrowser) return 1200;
    return window.innerWidth;
  }

  private getInitialHeight(): number {
    if (!this.isBrowser) return 800;
    return window.innerHeight;
  }

  private initViewportListener(): void {
    if (!this.isBrowser) return;

    const win = window as Window;

    // Use ResizeObserver for better performance than resize event
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateDimensions();
      });
      this.resizeObserver.observe(document.documentElement);
    } else {
      // Fallback to resize event with debounce
      let resizeTimeout: ReturnType<typeof setTimeout>;
      win.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => this.updateDimensions(), 100);
      });
    }

    // Handle orientation change on mobile
    win.addEventListener('orientationchange', () => {
      setTimeout(() => this.updateDimensions(), 100);
    });
  }

  private updateDimensions(): void {
    this.width.set(window.innerWidth);
    this.height.set(window.innerHeight);
  }

  private async detectCameraSupport(): Promise<void> {
    if (!this.isBrowser) {
      this.hasCamera.set(false);
      return;
    }

    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        this.hasCamera.set(false);
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideoInput = devices.some(device => device.kind === 'videoinput');
      this.hasCamera.set(hasVideoInput);
    } catch {
      this.hasCamera.set(false);
    }
  }

  /**
   * Check if current viewport is at or below a specific breakpoint
   */
  isAtMost(breakpoint: ViewportBreakpoint): boolean {
    const order = [
      ViewportBreakpoint.XS,
      ViewportBreakpoint.SM,
      ViewportBreakpoint.MD,
      ViewportBreakpoint.LG,
      ViewportBreakpoint.XL,
      ViewportBreakpoint.XXL
    ];
    return order.indexOf(this.breakpoint()) <= order.indexOf(breakpoint);
  }

  /**
   * Check if current viewport is at or above a specific breakpoint
   */
  isAtLeast(breakpoint: ViewportBreakpoint): boolean {
    const order = [
      ViewportBreakpoint.XS,
      ViewportBreakpoint.SM,
      ViewportBreakpoint.MD,
      ViewportBreakpoint.LG,
      ViewportBreakpoint.XL,
      ViewportBreakpoint.XXL
    ];
    return order.indexOf(this.breakpoint()) >= order.indexOf(breakpoint);
  }
}
