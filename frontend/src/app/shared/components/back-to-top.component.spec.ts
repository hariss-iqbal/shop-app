import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackToTopComponent } from './back-to-top.component';

describe('BackToTopComponent', () => {
  let component: BackToTopComponent;
  let fixture: ComponentFixture<BackToTopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackToTopComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BackToTopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not be visible initially', () => {
    expect(component.isVisible()).toBe(false);
  });

  it('should become visible when scrolled past threshold', () => {
    // Simulate scroll
    Object.defineProperty(window, 'scrollY', { value: 500, writable: true });
    component.onWindowScroll();
    expect(component.isVisible()).toBe(true);
  });

  it('should hide when scrolled back up', () => {
    // First scroll down
    Object.defineProperty(window, 'scrollY', { value: 500, writable: true });
    component.onWindowScroll();
    expect(component.isVisible()).toBe(true);

    // Then scroll up
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    component.onWindowScroll();
    expect(component.isVisible()).toBe(false);
  });

  it('should call window.scrollTo when scrollToTop is called', () => {
    const scrollToSpy = spyOn(window, 'scrollTo');
    component.scrollToTop();
    expect(scrollToSpy).toHaveBeenCalled();
  });

  it('should render button with correct aria-label when visible', () => {
    component.isVisible.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button');
    expect(button?.getAttribute('aria-label')).toBe('Scroll back to top of page');
  });

  it('should render chevron-up icon when visible', () => {
    component.isVisible.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const icon = compiled.querySelector('i.pi-chevron-up');
    expect(icon).toBeTruthy();
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should not render button when not visible', () => {
    component.isVisible.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button');
    expect(button).toBeNull();
  });
});
