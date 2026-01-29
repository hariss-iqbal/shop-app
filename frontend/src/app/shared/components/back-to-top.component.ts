import { Component, inject, signal, HostListener, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule],
  template: `
    @if (isVisible()) {
      <button
        type="button"
        class="back-to-top-button"
        (click)="scrollToTop()"
        pTooltip="Back to top"
        tooltipPosition="left"
        aria-label="Scroll back to top of page"
      >
        <i class="pi pi-chevron-up" aria-hidden="true"></i>
      </button>
    }
  `,
  styles: [`
    .back-to-top-button {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      z-index: 999;
      animation: fadeInUp 0.3s ease;
    }

    .back-to-top-button:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      background: var(--primary-600, #2563eb);
    }

    .back-to-top-button:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .back-to-top-button i {
      font-size: 1.25rem;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 576px) {
      .back-to-top-button {
        bottom: 1rem;
        right: 1rem;
        width: 44px;
        height: 44px;
      }
    }

    :host-context(.dark-theme) .back-to-top-button {
      background: var(--primary-400, #60a5fa);
    }

    :host-context(.dark-theme) .back-to-top-button:hover {
      background: var(--primary-500, #3b82f6);
    }
  `]
})
export class BackToTopComponent {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  isVisible = signal(false);
  private scrollThreshold = 400;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.isBrowser) {
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      this.isVisible.set(scrollPosition > this.scrollThreshold);
    }
  }

  scrollToTop(): void {
    if (this.isBrowser) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }
}
