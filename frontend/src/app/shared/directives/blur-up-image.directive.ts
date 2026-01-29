import { Directive, ElementRef, Input, OnInit, OnDestroy, inject, Renderer2 } from '@angular/core';
import { ImageOptimizationService } from '../../core/services/image-optimization.service';

/**
 * Directive that provides a blur-up placeholder effect for images.
 *
 * Usage:
 * <img [appBlurUpImage]="originalImageUrl" [src]="optimizedUrl" />
 *
 * The directive will:
 * 1. Load a tiny placeholder image (20px wide, heavily compressed)
 * 2. Apply blur filter and scale to the placeholder
 * 3. Fade in the full image once loaded
 */
@Directive({
  selector: 'img[appBlurUpImage]',
  standalone: true
})
export class BlurUpImageDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private imageOptimization = inject(ImageOptimizationService);

  /**
   * The original image URL used to generate the tiny placeholder
   */
  @Input() appBlurUpImage: string = '';

  /**
   * Whether to disable the blur-up effect (e.g., for above-the-fold images)
   */
  @Input() blurUpDisabled: boolean = false;

  private fullImageLoaded = false;
  private loadHandler: (() => void) | null = null;
  private errorHandler: (() => void) | null = null;

  ngOnInit(): void {
    if (this.blurUpDisabled || !this.appBlurUpImage) {
      return;
    }

    this.setupBlurUpEffect();
  }

  ngOnDestroy(): void {
    this.removeEventListeners();
  }

  private setupBlurUpEffect(): void {
    const img = this.el.nativeElement as HTMLImageElement;
    const placeholderUrl = this.imageOptimization.getTinyPlaceholderUrl(this.appBlurUpImage);

    // If no valid placeholder URL, skip the effect
    if (!placeholderUrl || placeholderUrl === this.appBlurUpImage) {
      return;
    }

    // Apply initial blur styles
    this.applyBlurStyles(img);

    // Create a new image to preload the placeholder
    const placeholderImg = new Image();
    placeholderImg.onload = () => {
      // Only set placeholder if full image hasn't loaded yet
      if (!this.fullImageLoaded) {
        // Set the placeholder as background while main image loads
        this.renderer.setStyle(img, 'backgroundImage', `url(${placeholderUrl})`);
        this.renderer.setStyle(img, 'backgroundSize', 'cover');
        this.renderer.setStyle(img, 'backgroundPosition', 'center');
      }
    };
    placeholderImg.src = placeholderUrl;

    // Handle full image load
    this.loadHandler = () => {
      this.fullImageLoaded = true;
      this.transitionToFullImage(img);
    };

    this.errorHandler = () => {
      // On error, just remove blur effect
      this.removeBlurStyles(img);
    };

    // If image is already loaded (cached), handle immediately
    if (img.complete && img.naturalWidth > 0) {
      this.fullImageLoaded = true;
      this.transitionToFullImage(img);
    } else {
      img.addEventListener('load', this.loadHandler);
      img.addEventListener('error', this.errorHandler);
    }
  }

  private applyBlurStyles(img: HTMLImageElement): void {
    this.renderer.setStyle(img, 'filter', 'blur(10px)');
    this.renderer.setStyle(img, 'transform', 'scale(1.1)');
    this.renderer.setStyle(img, 'transition', 'filter 0.3s ease-out, transform 0.3s ease-out');
  }

  private transitionToFullImage(img: HTMLImageElement): void {
    // Remove blur and scale
    this.renderer.setStyle(img, 'filter', 'blur(0)');
    this.renderer.setStyle(img, 'transform', 'scale(1)');

    // Clean up background after transition
    setTimeout(() => {
      this.renderer.removeStyle(img, 'backgroundImage');
      this.renderer.removeStyle(img, 'backgroundSize');
      this.renderer.removeStyle(img, 'backgroundPosition');
    }, 300);
  }

  private removeBlurStyles(img: HTMLImageElement): void {
    this.renderer.removeStyle(img, 'filter');
    this.renderer.removeStyle(img, 'transform');
    this.renderer.removeStyle(img, 'transition');
    this.renderer.removeStyle(img, 'backgroundImage');
    this.renderer.removeStyle(img, 'backgroundSize');
    this.renderer.removeStyle(img, 'backgroundPosition');
  }

  private removeEventListeners(): void {
    const img = this.el.nativeElement as HTMLImageElement;
    if (this.loadHandler) {
      img.removeEventListener('load', this.loadHandler);
    }
    if (this.errorHandler) {
      img.removeEventListener('error', this.errorHandler);
    }
  }
}
