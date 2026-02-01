import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skip-link',
  templateUrl: './skip-link.component.html',
  styleUrls: ['./skip-link.component.scss']
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
