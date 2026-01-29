import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FocusManagementService {
  private triggerElementStack: HTMLElement[] = [];

  saveTriggerElement(element?: HTMLElement): void {
    const el = element || (document.activeElement as HTMLElement);
    if (el) {
      this.triggerElementStack.push(el);
    }
  }

  restoreFocus(): void {
    const el = this.triggerElementStack.pop();
    if (el && typeof el.focus === 'function') {
      setTimeout(() => el.focus(), 0);
    }
  }

  moveFocusToElement(selector: string): void {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) {
      if (!el.hasAttribute('tabindex')) {
        el.setAttribute('tabindex', '-1');
      }
      el.focus();
    }
  }

  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selectors = [
      'a[href]:not([disabled]):not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'input:not([disabled]):not([tabindex="-1"]):not([type="hidden"])',
      'select:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      '[contenteditable]:not([tabindex="-1"])'
    ].join(',');

    return Array.from(container.querySelectorAll<HTMLElement>(selectors))
      .filter(el => el.offsetParent !== null);
  }
}
