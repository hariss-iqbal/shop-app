import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FocusTrapDirective } from './focus-trap.directive';
import { FocusManagementService } from '../services/focus-management.service';

@Component({
  selector: 'app-test-host',
  imports: [FocusTrapDirective],
  template: `
    <div appFocusTrap id="trap-container">
      <button id="btn1">First</button>
      <input id="input1" type="text" />
      <button id="btn2">Last</button>
    </div>
  `
})
class TestHostComponent {}

@Component({
  selector: 'app-empty-host',
  imports: [FocusTrapDirective],
  template: `
    <div appFocusTrap id="empty-trap">
      <div>No focusable elements</div>
    </div>
  `
})
class EmptyTestHostComponent {}

describe('FocusTrapDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let mockFocusService: jasmine.SpyObj<FocusManagementService>;
  let triggerButton: HTMLElement;

  beforeEach(async () => {
    mockFocusService = jasmine.createSpyObj('FocusManagementService', [
      'saveTriggerElement',
      'restoreFocus',
      'getFocusableElements'
    ]);

    // Create a trigger button outside the trap
    triggerButton = document.createElement('button');
    triggerButton.id = 'trigger-button';
    document.body.appendChild(triggerButton);

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        { provide: FocusManagementService, useValue: mockFocusService }
      ]
    }).compileComponents();
  });

  afterEach(() => {
    if (document.body.contains(triggerButton)) {
      document.body.removeChild(triggerButton);
    }
  });

  describe('initialization', () => {
    it('should create', () => {
      mockFocusService.getFocusableElements.and.returnValue([]);
      fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();

      const directive = fixture.nativeElement.querySelector('[appFocusTrap]');
      expect(directive).toBeTruthy();
    });

    it('should save trigger element on init', fakeAsync(() => {
      mockFocusService.getFocusableElements.and.returnValue([]);
      triggerButton.focus();

      fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      tick();

      expect(mockFocusService.saveTriggerElement).toHaveBeenCalled();
    }));

    it('should focus first focusable element on init', fakeAsync(() => {
      const firstButton = document.createElement('button');
      spyOn(firstButton, 'focus');
      mockFocusService.getFocusableElements.and.returnValue([firstButton]);

      fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      tick();

      expect(firstButton.focus).toHaveBeenCalled();
    }));

    it('should not focus anything if no focusable elements', fakeAsync(() => {
      mockFocusService.getFocusableElements.and.returnValue([]);

      fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      tick();

      // Should not throw and should complete normally
      expect(mockFocusService.getFocusableElements).toHaveBeenCalled();
    }));
  });

  describe('destruction', () => {
    it('should restore focus on destroy', () => {
      mockFocusService.getFocusableElements.and.returnValue([]);

      fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      fixture.destroy();

      expect(mockFocusService.restoreFocus).toHaveBeenCalled();
    });
  });

  describe('tab key handling', () => {
    let btn1: HTMLElement;
    let btn2: HTMLElement;
    let input1: HTMLElement;

    beforeEach(fakeAsync(() => {
      // Set up initial return value for ngOnInit
      mockFocusService.getFocusableElements.and.returnValue([]);

      fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      tick();

      btn1 = fixture.nativeElement.querySelector('#btn1');
      btn2 = fixture.nativeElement.querySelector('#btn2');
      input1 = fixture.nativeElement.querySelector('#input1');

      // Now update the mock for tab handling tests
      mockFocusService.getFocusableElements.and.returnValue([btn1, input1, btn2]);
    }));

    it('should wrap focus from last to first on Tab', () => {
      const trapContainer = fixture.nativeElement.querySelector('#trap-container');
      spyOn(btn1, 'focus');

      // Simulate focus on last element
      Object.defineProperty(document, 'activeElement', { value: btn2, configurable: true });

      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false });
      spyOn(event, 'preventDefault');

      trapContainer.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(btn1.focus).toHaveBeenCalled();
    });

    it('should wrap focus from first to last on Shift+Tab', () => {
      const trapContainer = fixture.nativeElement.querySelector('#trap-container');
      spyOn(btn2, 'focus');

      // Simulate focus on first element
      Object.defineProperty(document, 'activeElement', { value: btn1, configurable: true });

      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
      spyOn(event, 'preventDefault');

      trapContainer.dispatchEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(btn2.focus).toHaveBeenCalled();
    });

    it('should not interfere with Tab when not at boundary', () => {
      const trapContainer = fixture.nativeElement.querySelector('#trap-container');

      // Simulate focus on middle element
      Object.defineProperty(document, 'activeElement', { value: input1, configurable: true });

      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false });
      spyOn(event, 'preventDefault');

      trapContainer.dispatchEvent(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should ignore non-Tab keys', () => {
      const trapContainer = fixture.nativeElement.querySelector('#trap-container');
      spyOn(btn1, 'focus');
      spyOn(btn2, 'focus');

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(event, 'preventDefault');

      trapContainer.dispatchEvent(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(btn1.focus).not.toHaveBeenCalled();
      expect(btn2.focus).not.toHaveBeenCalled();
    });

    it('should handle empty focusable list gracefully', () => {
      const trapContainer = fixture.nativeElement.querySelector('#trap-container');
      mockFocusService.getFocusableElements.and.returnValue([]);

      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      spyOn(event, 'preventDefault');

      // Should not throw
      expect(() => trapContainer.dispatchEvent(event)).not.toThrow();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('with empty container', () => {
    let emptyFixture: ComponentFixture<EmptyTestHostComponent>;

    beforeEach(async () => {
      mockFocusService.getFocusableElements.and.returnValue([]);

      await TestBed.configureTestingModule({
        imports: [EmptyTestHostComponent],
        providers: [
          { provide: FocusManagementService, useValue: mockFocusService }
        ]
      }).compileComponents();
    });

    it('should handle container with no focusable elements', fakeAsync(() => {
      emptyFixture = TestBed.createComponent(EmptyTestHostComponent);

      // Should not throw
      expect(() => {
        emptyFixture.detectChanges();
        tick();
      }).not.toThrow();
    }));
  });
});

describe('FocusTrapDirective with real FocusManagementService', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();
  });

  it('should integrate correctly with real service', fakeAsync(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    // Flush the setTimeout(0) in focusFirstElement
    tick(10);

    // Verify focus is on one of the focusable elements within the trap
    const focusedElement = document.activeElement;
    expect(focusedElement?.id).toMatch(/btn1|input1|btn2/);
  }));
});
