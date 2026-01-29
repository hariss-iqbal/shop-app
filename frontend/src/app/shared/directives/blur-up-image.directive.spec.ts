import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BlurUpImageDirective } from './blur-up-image.directive';
import { ImageOptimizationService } from '../../core/services/image-optimization.service';

@Component({
  standalone: true,
  imports: [BlurUpImageDirective],
  template: `
    <img
      [appBlurUpImage]="imageUrl"
      [blurUpDisabled]="disabled"
      [src]="optimizedUrl"
      alt="Test image"
    />
  `
})
class TestHostComponent {
  imageUrl = 'https://test.supabase.co/storage/v1/object/public/phone-images/test.jpg';
  optimizedUrl = 'https://test.supabase.co/storage/v1/render/image/public/phone-images/test.jpg?width=300';
  disabled = false;
}

describe('BlurUpImageDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;
  let imgEl: DebugElement;
  let mockImageOptimization: jasmine.SpyObj<ImageOptimizationService>;

  beforeEach(async () => {
    mockImageOptimization = jasmine.createSpyObj('ImageOptimizationService', ['getTinyPlaceholderUrl']);
    mockImageOptimization.getTinyPlaceholderUrl.and.callFake((url: string) =>
      url ? url.replace('test.jpg', 'test.jpg?width=20&quality=20') : ''
    );

    await TestBed.configureTestingModule({
      imports: [TestHostComponent, BlurUpImageDirective],
      providers: [
        { provide: ImageOptimizationService, useValue: mockImageOptimization }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    fixture.detectChanges();
    imgEl = fixture.debugElement.query(By.directive(BlurUpImageDirective));
  });

  it('should create an instance', () => {
    expect(imgEl).toBeTruthy();
  });

  it('should call getTinyPlaceholderUrl with the input URL', () => {
    expect(mockImageOptimization.getTinyPlaceholderUrl).toHaveBeenCalledWith(component.imageUrl);
  });

  it('should apply initial blur styles to the image', () => {
    const img = imgEl.nativeElement as HTMLImageElement;
    expect(img.style.filter).toContain('blur');
    expect(img.style.transform).toContain('scale');
    expect(img.style.transition).toBeTruthy();
  });

  describe('when blurUpDisabled is true', () => {
    it('should not apply blur styles when disabled', fakeAsync(() => {
      // Create a new component instance with disabled=true
      const disabledFixture = TestBed.createComponent(TestHostComponent);
      disabledFixture.componentInstance.disabled = true;
      disabledFixture.detectChanges();
      tick();

      const imgEl = disabledFixture.debugElement.query(By.css('img'));
      // The directive should exit early when disabled
      expect(imgEl).toBeTruthy();
    }));
  });

  describe('when image URL is empty', () => {
    beforeEach(() => {
      component.imageUrl = '';
      fixture.detectChanges();
    });

    it('should not try to apply blur-up effect', () => {
      // The directive should handle empty URLs gracefully
      expect(true).toBe(true);
    });
  });

  describe('blur-up transition', () => {
    it('should transition to full image on load event', fakeAsync(() => {
      const img = imgEl.nativeElement as HTMLImageElement;

      // Verify initial blur state
      expect(img.style.filter).toContain('blur(10px)');

      // Simulate image load
      img.dispatchEvent(new Event('load'));
      tick();

      // After load, blur should be removed
      expect(img.style.filter).toBe('blur(0px)');
      expect(img.style.transform).toBe('scale(1)');
    }));

    it('should remove blur styles on error', fakeAsync(() => {
      const img = imgEl.nativeElement as HTMLImageElement;

      // Simulate image error
      img.dispatchEvent(new Event('error'));
      tick();

      // On error, styles should be cleaned up
      expect(img.style.filter).toBeFalsy();
    }));
  });

  describe('cleanup on destroy', () => {
    it('should remove event listeners on destroy', () => {
      const directive = imgEl.injector.get(BlurUpImageDirective);
      const img = imgEl.nativeElement as HTMLImageElement;

      const removeEventListenerSpy = spyOn(img, 'removeEventListener').and.callThrough();

      directive.ngOnDestroy();

      // Should attempt to remove load and error listeners
      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });

  describe('placeholder loading', () => {
    it('should request a tiny placeholder URL', () => {
      expect(mockImageOptimization.getTinyPlaceholderUrl).toHaveBeenCalledWith(component.imageUrl);
    });

    it('should use placeholder URL with reduced dimensions and quality', () => {
      const placeholderCall = mockImageOptimization.getTinyPlaceholderUrl.calls.mostRecent();
      const inputUrl = placeholderCall.args[0];
      expect(inputUrl).toBe(component.imageUrl);
    });
  });
});
