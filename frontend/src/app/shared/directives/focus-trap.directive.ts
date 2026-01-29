import { Directive, ElementRef, OnInit, OnDestroy, inject } from '@angular/core';
import { FocusManagementService } from '../services/focus-management.service';

@Directive({
  selector: '[appFocusTrap]'
})
export class FocusTrapDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private focusService = inject(FocusManagementService);
  private boundKeydown = this.onKeydown.bind(this);

  ngOnInit(): void {
    this.focusService.saveTriggerElement();
    this.el.nativeElement.addEventListener('keydown', this.boundKeydown);
    this.focusFirstElement();
  }

  ngOnDestroy(): void {
    this.el.nativeElement.removeEventListener('keydown', this.boundKeydown);
    this.focusService.restoreFocus();
  }

  private focusFirstElement(): void {
    setTimeout(() => {
      const focusable = this.focusService.getFocusableElements(this.el.nativeElement);
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }, 0);
  }

  private onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    const focusable = this.focusService.getFocusableElements(this.el.nativeElement);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }
}
