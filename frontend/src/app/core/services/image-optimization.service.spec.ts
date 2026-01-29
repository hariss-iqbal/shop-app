import { TestBed } from '@angular/core/testing';
import { ImageOptimizationService, TransformOptions } from './image-optimization.service';

describe('ImageOptimizationService', () => {
  let service: ImageOptimizationService;
  const supabaseUrl = 'https://test.supabase.co';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ImageOptimizationService]
    });
    service = TestBed.inject(ImageOptimizationService);
    // Mock the supabaseUrl
    (service as unknown as { supabaseUrl: string }).supabaseUrl = supabaseUrl;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTransformedUrl', () => {
    const baseStorageUrl = `${supabaseUrl}/storage/v1/object/public/phone-images/test.jpg`;

    it('should return original URL if URL is falsy', () => {
      expect(service.getTransformedUrl('', { width: 300 })).toBe('');
    });

    it('should return original URL if not a Supabase storage URL', () => {
      const externalUrl = 'https://example.com/image.jpg';
      expect(service.getTransformedUrl(externalUrl, { width: 300 })).toBe(externalUrl);
    });

    it('should return original URL if no transform options provided', () => {
      expect(service.getTransformedUrl(baseStorageUrl, {})).toBe(baseStorageUrl);
    });

    it('should add width parameter', () => {
      const result = service.getTransformedUrl(baseStorageUrl, { width: 300 });
      expect(result).toContain('/storage/v1/render/image/public/phone-images/');
      expect(result).toContain('width=300');
    });

    it('should add height parameter', () => {
      const result = service.getTransformedUrl(baseStorageUrl, { height: 200 });
      expect(result).toContain('height=200');
    });

    it('should add quality parameter', () => {
      const result = service.getTransformedUrl(baseStorageUrl, { quality: 80 });
      expect(result).toContain('quality=80');
    });

    it('should add format parameter', () => {
      const result = service.getTransformedUrl(baseStorageUrl, { format: 'webp' });
      expect(result).toContain('format=webp');
    });

    it('should add resize parameter', () => {
      const result = service.getTransformedUrl(baseStorageUrl, { resize: 'cover' });
      expect(result).toContain('resize=cover');
    });

    it('should combine multiple parameters', () => {
      const options: TransformOptions = {
        width: 300,
        height: 200,
        quality: 80,
        format: 'webp',
        resize: 'cover'
      };
      const result = service.getTransformedUrl(baseStorageUrl, options);

      expect(result).toContain('width=300');
      expect(result).toContain('height=200');
      expect(result).toContain('quality=80');
      expect(result).toContain('format=webp');
      expect(result).toContain('resize=cover');
    });

    it('should replace object path with render path', () => {
      const result = service.getTransformedUrl(baseStorageUrl, { width: 300 });
      expect(result).toContain('/storage/v1/render/image/public/phone-images/');
      expect(result).not.toContain('/storage/v1/object/public/phone-images/');
    });
  });

  describe('getCardImageUrl', () => {
    const baseStorageUrl = `${supabaseUrl}/storage/v1/object/public/phone-images/card.jpg`;

    it('should return optimized URL for card images', () => {
      const result = service.getCardImageUrl(baseStorageUrl);

      expect(result).toContain('width=300');
      expect(result).toContain('height=200');
      expect(result).toContain('resize=cover');
      expect(result).toContain('format=webp');
      expect(result).toContain('quality=80');
    });

    it('should return original URL for non-Supabase URLs', () => {
      const externalUrl = 'https://example.com/card.jpg';
      expect(service.getCardImageUrl(externalUrl)).toBe(externalUrl);
    });
  });

  describe('getCardSrcSet', () => {
    const baseStorageUrl = `${supabaseUrl}/storage/v1/object/public/phone-images/card.jpg`;

    it('should return srcset with multiple widths (300, 600, 900)', () => {
      const result = service.getCardSrcSet(baseStorageUrl);

      expect(result).toContain('300w');
      expect(result).toContain('600w');
      expect(result).toContain('900w');
    });

    it('should include webp format in srcset', () => {
      const result = service.getCardSrcSet(baseStorageUrl);
      expect(result).toContain('format=webp');
    });

    it('should return empty string for falsy URLs', () => {
      expect(service.getCardSrcSet('')).toBe('');
      expect(service.getCardSrcSet(null as unknown as string)).toBe('');
    });

    it('should return empty string for non-Supabase URLs', () => {
      expect(service.getCardSrcSet('https://example.com/image.jpg')).toBe('');
    });
  });

  describe('getListImageUrl', () => {
    const baseStorageUrl = `${supabaseUrl}/storage/v1/object/public/phone-images/list.jpg`;

    it('should return optimized URL for list view images', () => {
      const result = service.getListImageUrl(baseStorageUrl);

      expect(result).toContain('width=120');
      expect(result).toContain('height=120');
      expect(result).toContain('resize=cover');
      expect(result).toContain('format=webp');
      expect(result).toContain('quality=80');
    });
  });

  describe('getListSrcSet', () => {
    const baseStorageUrl = `${supabaseUrl}/storage/v1/object/public/phone-images/list.jpg`;

    it('should return srcset with widths 120 and 240', () => {
      const result = service.getListSrcSet(baseStorageUrl);

      expect(result).toContain('120w');
      expect(result).toContain('240w');
    });

    it('should return empty string for falsy URLs', () => {
      expect(service.getListSrcSet('')).toBe('');
    });
  });

  describe('getDetailImageUrl', () => {
    const baseStorageUrl = `${supabaseUrl}/storage/v1/object/public/phone-images/detail.jpg`;

    it('should return optimized URL for detail view images', () => {
      const result = service.getDetailImageUrl(baseStorageUrl);

      expect(result).toContain('width=800');
      expect(result).toContain('format=webp');
      expect(result).toContain('quality=85');
    });

    it('should not include height to maintain aspect ratio', () => {
      const result = service.getDetailImageUrl(baseStorageUrl);
      expect(result).not.toContain('height=');
    });
  });

  describe('getDetailSrcSet', () => {
    const baseStorageUrl = `${supabaseUrl}/storage/v1/object/public/phone-images/detail.jpg`;

    it('should return srcset with widths 400, 800, 1200', () => {
      const result = service.getDetailSrcSet(baseStorageUrl);

      expect(result).toContain('400w');
      expect(result).toContain('800w');
      expect(result).toContain('1200w');
    });

    it('should include webp format in srcset', () => {
      const result = service.getDetailSrcSet(baseStorageUrl);
      expect(result).toContain('format=webp');
    });

    it('should include quality=85 in srcset', () => {
      const result = service.getDetailSrcSet(baseStorageUrl);
      expect(result).toContain('quality=85');
    });
  });

  describe('getThumbnailUrl', () => {
    const baseStorageUrl = `${supabaseUrl}/storage/v1/object/public/phone-images/thumb.jpg`;

    it('should return optimized URL for thumbnails', () => {
      const result = service.getThumbnailUrl(baseStorageUrl);

      expect(result).toContain('width=80');
      expect(result).toContain('height=60');
      expect(result).toContain('resize=cover');
      expect(result).toContain('format=webp');
      expect(result).toContain('quality=70');
    });
  });

  describe('getTinyPlaceholderUrl', () => {
    const baseStorageUrl = `${supabaseUrl}/storage/v1/object/public/phone-images/placeholder.jpg`;

    it('should return tiny placeholder URL for blur-up effect', () => {
      const result = service.getTinyPlaceholderUrl(baseStorageUrl);

      expect(result).toContain('width=20');
      expect(result).toContain('quality=20');
      expect(result).toContain('format=webp');
    });

    it('should produce a very small image size for efficient loading', () => {
      const result = service.getTinyPlaceholderUrl(baseStorageUrl);
      expect(result).toContain('width=20');
    });
  });

  describe('Supabase URL detection', () => {
    it('should recognize URLs with storage path', () => {
      const validUrl = `${supabaseUrl}/storage/v1/object/public/phone-images/test.jpg`;
      const result = service.getCardImageUrl(validUrl);
      expect(result).toContain('/storage/v1/render/');
    });

    it('should not transform URLs without storage path', () => {
      const invalidUrl = `${supabaseUrl}/api/something/test.jpg`;
      const result = service.getCardImageUrl(invalidUrl);
      expect(result).toBe(invalidUrl);
    });

    it('should not transform URLs from different domains', () => {
      const differentDomain = 'https://other-domain.com/storage/v1/object/public/phone-images/test.jpg';
      const result = service.getCardImageUrl(differentDomain);
      expect(result).toBe(differentDomain);
    });
  });
});
