import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

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

  getTransformedUrl(originalUrl: string, options: TransformOptions): string {
    if (!originalUrl || !this.isSupabaseStorageUrl(originalUrl)) {
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
    return this.getTransformedUrl(originalUrl, {
      width: CARD_IMAGE_WIDTH,
      height: CARD_IMAGE_HEIGHT,
      resize: 'cover',
      format: 'webp',
      quality: 80
    });
  }

  getCardSrcSet(originalUrl: string): string {
    if (!originalUrl || !this.isSupabaseStorageUrl(originalUrl)) {
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
    return this.getTransformedUrl(originalUrl, {
      width: 120,
      height: 120,
      resize: 'cover',
      format: 'webp',
      quality: 80
    });
  }

  getListSrcSet(originalUrl: string): string {
    if (!originalUrl || !this.isSupabaseStorageUrl(originalUrl)) {
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
    return this.getTransformedUrl(originalUrl, {
      width: DETAIL_IMAGE_WIDTH,
      format: 'webp',
      quality: 85
    });
  }

  getDetailSrcSet(originalUrl: string): string {
    if (!originalUrl || !this.isSupabaseStorageUrl(originalUrl)) {
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
    return this.getTransformedUrl(originalUrl, {
      width: THUMBNAIL_WIDTH,
      height: 60,
      resize: 'cover',
      format: 'webp',
      quality: 70
    });
  }

  getTinyPlaceholderUrl(originalUrl: string): string {
    return this.getTransformedUrl(originalUrl, {
      width: 20,
      quality: 20,
      format: 'webp'
    });
  }

  private isSupabaseStorageUrl(url: string): boolean {
    return url.includes(this.supabaseUrl) && url.includes('/storage/');
  }
}
