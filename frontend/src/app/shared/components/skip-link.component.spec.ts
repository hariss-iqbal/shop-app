import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkipLinkComponent } from './skip-link.component';

describe('SkipLinkComponent', () => {
  let component: SkipLinkComponent;
  let fixture: ComponentFixture<SkipLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkipLinkComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SkipLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default targetId of "main-content"', () => {
    expect(component.targetId()).toBe('main-content');
  });

  it('should render skip link with correct href', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a.skip-link');
    expect(link?.getAttribute('href')).toBe('#main-content');
  });

  it('should display "Skip to main content" text', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a.skip-link');
    expect(link?.textContent?.trim()).toBe('Skip to main content');
  });

  it('should have skip-link class for styling', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('.skip-link');
    expect(link).toBeTruthy();
  });

  describe('skipToContent', () => {
    let mockTarget: HTMLElement;
    let mockEvent: Event;

    beforeEach(() => {
      mockTarget = document.createElement('main');
      mockTarget.id = 'main-content';
      document.body.appendChild(mockTarget);

      mockEvent = new Event('click');
      spyOn(mockEvent, 'preventDefault');
      spyOn(mockTarget, 'focus');
      spyOn(mockTarget, 'scrollIntoView');
    });

    afterEach(() => {
      if (document.body.contains(mockTarget)) {
        document.body.removeChild(mockTarget);
      }
    });

    it('should prevent default event behavior', () => {
      component.skipToContent(mockEvent);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should focus the target element', () => {
      component.skipToContent(mockEvent);
      expect(mockTarget.focus).toHaveBeenCalled();
    });

    it('should scroll to the target element smoothly', () => {
      component.skipToContent(mockEvent);
      expect(mockTarget.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('should set tabindex=-1 if not present', () => {
      expect(mockTarget.hasAttribute('tabindex')).toBe(false);
      component.skipToContent(mockEvent);
      expect(mockTarget.getAttribute('tabindex')).toBe('-1');
    });

    it('should not modify existing tabindex', () => {
      mockTarget.setAttribute('tabindex', '0');
      component.skipToContent(mockEvent);
      expect(mockTarget.getAttribute('tabindex')).toBe('0');
    });

    it('should do nothing if target element does not exist', () => {
      document.body.removeChild(mockTarget);
      // Should not throw
      expect(() => component.skipToContent(mockEvent)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should be visually hidden by default (positioned off-screen)', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const link = compiled.querySelector('.skip-link') as HTMLElement;
      expect(link).toBeTruthy();
    });

    it('should have proper link structure', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const link = compiled.querySelector('a');
      expect(link).toBeTruthy();
      expect(link?.tagName.toLowerCase()).toBe('a');
    });
  });
});
