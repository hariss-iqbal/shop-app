import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { CloudinaryService } from './cloudinary.service';

export interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'origin';
  resize?: 'cover' | 'contain' | 'fill';
}

export interface OptimizedImageUrls {
  src: string;
  srcset: string;
  thumbnailSrc: string;
}

const CARD_WIDTHS = [300, 600, 900];
const DETAIL_WIDTHS = [400, 800, 1200];
const THUMBNAIL_WIDTH = 80;
const CARD_IMAGE_WIDTH = 300;
const CARD_IMAGE_HEIGHT = 200;
const DETAIL_IMAGE_WIDTH = 800;

@Injectable({
  providedIn: 'root'
})
export class ImageOptimizationService {
  private supabaseUrl = environment.supabase.url;
  private storagePath = '/storage/v1/object/public/phone-images/';
  private cloudinary = inject(CloudinaryService);

  getTransformedUrl(originalUrl: string, options: TransformOptions): string {
    if (!originalUrl) {
      return originalUrl;
    }

    // Use Cloudinary transformations if it's a Cloudinary URL
    if (this.isCloudinaryUrl(originalUrl)) {
      const publicId = this.cloudinary.getPublicIdFromUrl(originalUrl);
      if (publicId) {
        return this.cloudinary.getTransformedUrl(publicId, this.mapTransformOptions(options));
      }
    }

    // Fall back to Supabase transformations for non-Cloudinary URLs
    if (!this.isSupabaseStorageUrl(originalUrl)) {
      return originalUrl;
    }

    const params: string[] = [];

    if (options.width) {
      params.push(`width=${options.width}`);
    }
    if (options.height) {
      params.push(`height=${options.height}`);
    }
    if (options.quality) {
      params.push(`quality=${options.quality}`);
    }
    if (options.format) {
      params.push(`format=${options.format}`);
    }
    if (options.resize) {
      params.push(`resize=${options.resize}`);
    }

    if (params.length === 0) {
      return originalUrl;
    }

    const renderPath = originalUrl.replace(
      this.storagePath,
      '/storage/v1/render/image/public/phone-images/'
    );

    const separator = renderPath.includes('?') ? '&' : '?';
    return `${renderPath}${separator}${params.join('&')}`;
  }

  getCardImageUrl(originalUrl: string): string {
    if (!originalUrl) {
      return originalUrl;
    }

    if (this.isCloudinaryUrl(originalUrl)) {
      const publicId = this.cloudinary.getPublicIdFromUrl(originalUrl);
      if (publicId) {
        return this.cloudinary.getCardImageUrl(publicId);
      }
    }

    return this.getTransformedUrl(originalUrl, {
      width: CARD_IMAGE_WIDTH,
      height: CARD_IMAGE_HEIGHT,
      resize: 'cover',
      format: 'webp',
      quality: 80
    });
  }

  getCardSrcSet(originalUrl: string): string {
    if (!originalUrl) {
      return '';
    }

    if (this.isCloudinaryUrl(originalUrl)) {
      const publicId = this.cloudinary.getPublicIdFromUrl(originalUrl);
      if (publicId) {
        return this.cloudinary.getCardSrcSet(publicId);
      }
    }

    if (!this.isSupabaseStorageUrl(originalUrl)) {
      return '';
    }

    return CARD_WIDTHS
      .map(width => {
        const url = this.getTransformedUrl(originalUrl, {
          width,
          resize: 'cover',
          format: 'webp',
          quality: 80
        });
        return `${url} ${width}w`;
      })
      .join(', ');
  }

  getListImageUrl(originalUrl: string): string {
    if (!originalUrl) {
      return originalUrl;
    }

    if (this.isCloudinaryUrl(originalUrl)) {
      const publicId = this.cloudinary.getPublicIdFromUrl(originalUrl);
      if (publicId) {
        return this.cloudinary.getListImageUrl(publicId);
      }
    }

    return this.getTransformedUrl(originalUrl, {
      width: 120,
      height: 120,
      resize: 'cover',
      format: 'webp',
      quality: 80
    });
  }

  getListSrcSet(originalUrl: string): string {
    if (!originalUrl) {
      return '';
    }

    if (this.isCloudinaryUrl(originalUrl)) {
      const publicId = this.cloudinary.getPublicIdFromUrl(originalUrl);
      if (publicId) {
        return this.cloudinary.getSrcSet(publicId, [120, 240]);
      }
    }

    if (!this.isSupabaseStorageUrl(originalUrl)) {
      return '';
    }

    return [120, 240]
      .map(width => {
        const url = this.getTransformedUrl(originalUrl, {
          width,
          resize: 'cover',
          format: 'webp',
          quality: 80
        });
        return `${url} ${width}w`;
      })
      .join(', ');
  }

  getDetailImageUrl(originalUrl: string): string {
    if (!originalUrl) {
      return originalUrl;
    }

    if (this.isCloudinaryUrl(originalUrl)) {
      const publicId = this.cloudinary.getPublicIdFromUrl(originalUrl);
      if (publicId) {
        return this.cloudinary.getDetailImageUrl(publicId);
      }
    }

    return this.getTransformedUrl(originalUrl, {
      width: DETAIL_IMAGE_WIDTH,
      format: 'webp',
      quality: 85
    });
  }

  getDetailSrcSet(originalUrl: string): string {
    if (!originalUrl) {
      return '';
    }

    if (this.isCloudinaryUrl(originalUrl)) {
      const publicId = this.cloudinary.getPublicIdFromUrl(originalUrl);
      if (publicId) {
        return this.cloudinary.getDetailSrcSet(publicId);
      }
    }

    if (!this.isSupabaseStorageUrl(originalUrl)) {
      return '';
    }

    return DETAIL_WIDTHS
      .map(width => {
        const url = this.getTransformedUrl(originalUrl, {
          width,
          format: 'webp',
          quality: 85
        });
        return `${url} ${width}w`;
      })
      .join(', ');
  }

  getThumbnailUrl(originalUrl: string): string {
    if (!originalUrl) {
      return originalUrl;
    }

    if (this.isCloudinaryUrl(originalUrl)) {
      const publicId = this.cloudinary.getPublicIdFromUrl(originalUrl);
      if (publicId) {
        return this.cloudinary.getThumbnailUrl(publicId);
      }
    }

    return this.getTransformedUrl(originalUrl, {
      width: THUMBNAIL_WIDTH,
      height: 60,
      resize: 'cover',
      format: 'webp',
      quality: 70
    });
  }

  getTinyPlaceholderUrl(originalUrl: string): string {
    if (!originalUrl) {
      return originalUrl;
    }

    if (this.isCloudinaryUrl(originalUrl)) {
      const publicId = this.cloudinary.getPublicIdFromUrl(originalUrl);
      if (publicId) {
        return this.cloudinary.getTransformedUrl(publicId, {
          width: 20,
          quality: 20,
          format: 'webp'
        });
      }
    }

    return this.getTransformedUrl(originalUrl, {
      width: 20,
      quality: 20,
      format: 'webp'
    });
  }

  /**
   * Check if a URL is from Cloudinary
   */
  private isCloudinaryUrl(url: string): boolean {
    return this.cloudinary.isCloudinaryUrl(url);
  }

  /**
   * Check if a URL is from Supabase Storage
   */
  private isSupabaseStorageUrl(url: string): boolean {
    return url.includes(this.supabaseUrl) && url.includes('/storage/');
  }

  /**
   * Map generic transform options to Cloudinary transform options
   */
  private mapTransformOptions(options: TransformOptions): {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png' | 'auto';
    crop?: 'fill' | 'fit' | 'crop' | 'scale' | 'limit' | 'pad' | 'thumb';
  } {
    const cloudinaryOptions: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpg' | 'png' | 'auto';
      crop?: 'fill' | 'fit' | 'crop' | 'scale' | 'limit' | 'pad' | 'thumb';
    } = {};

    if (options.width) cloudinaryOptions.width = options.width;
    if (options.height) cloudinaryOptions.height = options.height;
    if (options.quality) cloudinaryOptions.quality = options.quality;

    if (options.format === 'webp') {
      cloudinaryOptions.format = 'webp';
    }

    // Map resize to crop
    if (options.resize) {
      const resizeToCropMap: Record<string, 'fill' | 'fit' | 'crop' | 'scale' | 'limit' | 'pad' | 'thumb'> = {
        'cover': 'fill',
        'contain': 'fit',
        'fill': 'fill'
      };
      cloudinaryOptions.crop = resizeToCropMap[options.resize] || 'fill';
    }

    return cloudinaryOptions;
  }
}
