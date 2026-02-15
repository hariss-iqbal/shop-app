import { Component, HostListener, Inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule],
  templateUrl: './back-to-top.component.html',
  styleUrls: ['./back-to-top.component.scss']
})
export class BackToTopComponent {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }
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
