import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhoneCardKeyboardDirective } from './phone-card-keyboard.directive';

@Component({
  selector: 'app-test-host',
  imports: [PhoneCardKeyboardDirective],
  template: `
    <div class="grid" role="list">
      <div
        appPhoneCardKeyboard
        #card1
        role="listitem"
        tabindex="0"
        id="card1"
        (cardActivated)="onActivated('card1')"
      >Card 1</div>
      <div
        appPhoneCardKeyboard
        #card2
        role="listitem"
        tabindex="0"
        id="card2"
        (cardActivated)="onActivated('card2')"
      >Card 2</div>
      <div
        appPhoneCardKeyboard
        #card3
        role="listitem"
        tabindex="0"
        id="card3"
        (cardActivated)="onActivated('card3')"
      >Card 3</div>
      <div
        appPhoneCardKeyboard
        #card4
        role="listitem"
        tabindex="0"
        id="card4"
        (cardActivated)="onActivated('card4')"
      >Card 4</div>
    </div>
  `
})
class TestHostComponent {
  @ViewChild('card1', { read: PhoneCardKeyboardDirective }) card1Directive!: PhoneCardKeyboardDirective;
  @ViewChild('card2', { read: PhoneCardKeyboardDirective }) card2Directive!: PhoneCardKeyboardDirective;

  activatedCard: string | null = null;

  onActivated(cardId: string): void {
    this.activatedCard = cardId;
  }
}

describe('PhoneCardKeyboardDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let card1: HTMLElement;
  let card2: HTMLElement;
  let card3: HTMLElement;
  let card4: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();

    card1 = fixture.nativeElement.querySelector('#card1');
    card2 = fixture.nativeElement.querySelector('#card2');
    card3 = fixture.nativeElement.querySelector('#card3');
    card4 = fixture.nativeElement.querySelector('#card4');
  });

  it('should create directives', () => {
    expect(hostComponent.card1Directive).toBeTruthy();
    expect(hostComponent.card2Directive).toBeTruthy();
  });

  describe('activation keys', () => {
    it('should emit cardActivated on Enter key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(event, 'preventDefault');

      card1.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(hostComponent.activatedCard).toBe('card1');
    });

    it('should emit cardActivated on Space key', () => {
      const event = new KeyboardEvent('keydown', { key: ' ' });
      spyOn(event, 'preventDefault');

      card2.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(hostComponent.activatedCard).toBe('card2');
    });
  });

  describe('horizontal navigation', () => {
    it('should move focus to next card on ArrowRight', () => {
      card1.focus();
      spyOn(card2, 'focus');

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      spyOn(event, 'preventDefault');
      card1.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(card2.focus).toHaveBeenCalled();
    });

    it('should move focus to previous card on ArrowLeft', () => {
      card2.focus();
      spyOn(card1, 'focus');

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      spyOn(event, 'preventDefault');
      card2.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(card1.focus).toHaveBeenCalled();
    });

    it('should not go before first card on ArrowLeft', () => {
      card1.focus();
      spyOn(card1, 'focus');

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      card1.dispatchEvent(event);

      expect(card1.focus).toHaveBeenCalled();
    });

    it('should not go past last card on ArrowRight', () => {
      card4.focus();
      spyOn(card4, 'focus');

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      card4.dispatchEvent(event);

      expect(card4.focus).toHaveBeenCalled();
    });
  });

  describe('vertical navigation', () => {
    beforeEach(() => {
      // Mock getBoundingClientRect to simulate a 2-column grid layout
      const mockRect = (top: number) => ({
        top,
        bottom: top + 100,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
        x: 0,
        y: top
      });

      // Cards 1 and 2 on row 1 (top: 0), Cards 3 and 4 on row 2 (top: 100)
      spyOn(card1, 'getBoundingClientRect').and.returnValue(mockRect(0) as DOMRect);
      spyOn(card2, 'getBoundingClientRect').and.returnValue(mockRect(0) as DOMRect);
      spyOn(card3, 'getBoundingClientRect').and.returnValue(mockRect(100) as DOMRect);
      spyOn(card4, 'getBoundingClientRect').and.returnValue(mockRect(100) as DOMRect);
    });

    it('should move focus down by row on ArrowDown', () => {
      card1.focus();
      spyOn(card3, 'focus');

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      spyOn(event, 'preventDefault');
      card1.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(card3.focus).toHaveBeenCalled();
    });

    it('should move focus up by row on ArrowUp', () => {
      card3.focus();
      spyOn(card1, 'focus');

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      spyOn(event, 'preventDefault');
      card3.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(card1.focus).toHaveBeenCalled();
    });

    it('should not move up when already on first row', () => {
      card1.focus();
      // Spy on all other cards' focus methods to ensure they are not called
      const focusSpy2 = spyOn(card2, 'focus');
      const focusSpy3 = spyOn(card3, 'focus');
      const focusSpy4 = spyOn(card4, 'focus');

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      card1.dispatchEvent(event);

      // Should not call focus on any other card (targetIndex = 0 + (-2) = -2, which is out of bounds)
      expect(focusSpy2).not.toHaveBeenCalled();
      expect(focusSpy3).not.toHaveBeenCalled();
      expect(focusSpy4).not.toHaveBeenCalled();
    });

    it('should not move down when already on last row', () => {
      card3.focus();
      // Spy on all other cards' focus methods to ensure they are not called
      const focusSpy1 = spyOn(card1, 'focus');
      const focusSpy2 = spyOn(card2, 'focus');
      const focusSpy4 = spyOn(card4, 'focus');

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      card3.dispatchEvent(event);

      // Should not call focus on any other card (targetIndex = 2 + 2 = 4, which is out of bounds)
      expect(focusSpy1).not.toHaveBeenCalled();
      expect(focusSpy2).not.toHaveBeenCalled();
      expect(focusSpy4).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle card not in a grid container', () => {
      // Create an orphan card
      const orphanCard = document.createElement('div');
      document.body.appendChild(orphanCard);

      // Should not throw
      expect(() => {
        const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        orphanCard.dispatchEvent(event);
      }).not.toThrow();

      document.body.removeChild(orphanCard);
    });

    it('should ignore other keys', () => {
      card1.focus();
      spyOn(card2, 'focus');

      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      card1.dispatchEvent(event);

      expect(card2.focus).not.toHaveBeenCalled();
    });
  });
});

describe('PhoneCardKeyboardDirective column estimation', () => {
  @Component({
    selector: 'app-single-card-host',
    imports: [PhoneCardKeyboardDirective],
    template: `
      <div class="grid" role="list">
        <div
          appPhoneCardKeyboard
          role="listitem"
          tabindex="0"
          id="single-card"
        >Single Card</div>
      </div>
    `
  })
  class SingleCardHostComponent {}

  let fixture: ComponentFixture<SingleCardHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingleCardHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SingleCardHostComponent);
    fixture.detectChanges();
  });

  it('should handle single card grid', () => {
    const card = fixture.nativeElement.querySelector('#single-card');
    card.focus();

    // Should not throw on any arrow key
    expect(() => {
      card.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      card.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      card.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      card.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    }).not.toThrow();
  });
});
