import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skip-link',
  template: `
    <a [href]="'#' + targetId()"
       class="skip-link"
       (click)="skipToContent($event)">
      Skip to main content
    </a>
  `,
  styles: [`
    /* F-042: Skip-link styles — visually hidden until focused (WCAG 2.4.1) */
    .skip-link {
      position: absolute;
      top: -100%;
      left: 0;
      z-index: 10001;
      padding: 0.75rem 1.5rem;
      background: var(--primary-color, #3B82F6);
      color: #ffffff;
      font-weight: 600;
      font-size: 0.875rem;
      text-decoration: none;
      border-radius: 0 0 8px 0;
      outline: none;
      transition: top 0.15s ease;

      &:focus {
        top: 0;
      }
    }
  `]
})
export class SkipLinkComponent {
  targetId = input<string>('main-content');

  skipToContent(event: Event): void {
    event.preventDefault();
    const target = document.getElementById(this.targetId());
    if (target) {
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
