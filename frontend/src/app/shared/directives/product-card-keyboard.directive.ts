import { Directive, ElementRef, HostListener, output } from '@angular/core';

@Directive({
  selector: '[appProductCardKeyboard]'
})
export class ProductCardKeyboardDirective {
  constructor(private el: ElementRef) { }

  cardActivated = output<void>();

  @HostListener('keydown.enter', ['$event'])
  @HostListener('keydown.space', ['$event'])
  onActivate(event: KeyboardEvent): void {
    event.preventDefault();
    this.cardActivated.emit();
  }

  @HostListener('keydown.arrowRight', ['$event'])
  onArrowRight(event: KeyboardEvent): void {
    event.preventDefault();
    this.moveFocus('next');
  }

  @HostListener('keydown.arrowLeft', ['$event'])
  onArrowLeft(event: KeyboardEvent): void {
    event.preventDefault();
    this.moveFocus('previous');
  }

  @HostListener('keydown.arrowDown', ['$event'])
  onArrowDown(event: KeyboardEvent): void {
    event.preventDefault();
    this.moveFocusByRow('down');
  }

  @HostListener('keydown.arrowUp', ['$event'])
  onArrowUp(event: KeyboardEvent): void {
    event.preventDefault();
    this.moveFocusByRow('up');
  }

  private moveFocus(direction: 'next' | 'previous'): void {
    const cards = this.getSiblingCards();
    const currentIndex = cards.indexOf(this.el.nativeElement);
    if (currentIndex === -1) return;

    const nextIndex = direction === 'next'
      ? Math.min(currentIndex + 1, cards.length - 1)
      : Math.max(currentIndex - 1, 0);

    cards[nextIndex]?.focus();
  }

  private moveFocusByRow(direction: 'up' | 'down'): void {
    const cards = this.getSiblingCards();
    const currentIndex = cards.indexOf(this.el.nativeElement);
    if (currentIndex === -1) return;

    const columnsPerRow = this.estimateColumnsPerRow(cards);
    const offset = direction === 'down' ? columnsPerRow : -columnsPerRow;
    const targetIndex = currentIndex + offset;

    if (targetIndex >= 0 && targetIndex < cards.length) {
      cards[targetIndex]?.focus();
    }
  }

  private getSiblingCards(): HTMLElement[] {
    const parent = this.el.nativeElement.closest('[role="list"], .grid');
    if (!parent) return [];
    return Array.from((parent as Element).querySelectorAll<HTMLElement>('[appProductCardKeyboard], [role="listitem"][tabindex]'));
  }

  private estimateColumnsPerRow(cards: HTMLElement[]): number {
    if (cards.length < 2) return 1;
    const firstTop = cards[0].getBoundingClientRect().top;
    let count = 1;
    for (let i = 1; i < cards.length; i++) {
      if (Math.abs(cards[i].getBoundingClientRect().top - firstTop) < 5) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }
}
