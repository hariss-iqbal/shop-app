import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface CloudinaryUploadError {
  message: string;
  statusCode?: number;
}

export interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png' | 'auto';
  crop?: 'fill' | 'fit' | 'crop' | 'scale' | 'limit' | 'pad' | 'thumb';
  fetchFormat?: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/image/upload';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private cloudName = environment.cloudinary.cloudName;
  private uploadPreset = environment.cloudinary.uploadPreset;

  /**
   * Upload an image to Cloudinary
   * @param file - The file to upload
   * @param folder - Optional folder path (e.g., 'phone-images/{phoneId}')
   * @param onProgress - Optional callback for upload progress
   * @returns Promise with upload result including publicId and secureUrl
   */
  async uploadImage(
    file: File,
    folder?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<CloudinaryUploadResult> {
    this.validateFile(file);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    if (folder) {
      formData.append('folder', folder);
    }

    try {
      const response = await this.uploadWithProgress(
        CLOUDINARY_UPLOAD_URL.replace('/image/upload', `/${this.cloudName}/image/upload`),
        formData,
        onProgress
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Upload failed' } }));
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();

      return {
        publicId: data.public_id,
        secureUrl: data.secure_url,
        width: data.width,
        height: data.height,
        format: data.format,
        bytes: data.bytes
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to upload image to Cloudinary');
    }
  }

  /**
   * Delete an image from Cloudinary
   * Note: This requires a backend service with API secret for secure deletion
   * @param _publicId - The public ID of the image to delete
   */
  async deleteImage(_publicId: string): Promise<void> {
    // Client-side deletion requires the API secret, which should not be exposed
    // This should be called through a backend endpoint
    throw new Error(
      'Direct deletion from client is not supported. ' +
      'Use the backend API endpoint to delete images securely.'
    );
  }

  /**
   * Get a transformed URL for an image
   * @param publicId - The Cloudinary public ID of the image
   * @param options - Transformation options
   * @returns Transformed image URL
   */
  getTransformedUrl(publicId: string, options: TransformOptions = {}): string {
    const transformations: string[] = [];

    if (options.width) {
      transformations.push(`w_${options.width}`);
    }
    if (options.height) {
      transformations.push(`h_${options.height}`);
    }
    if (options.quality) {
      transformations.push(`q_${options.quality}`);
    }
    if (options.format && options.format !== 'auto') {
      transformations.push(`f_${options.format}`);
    }
    if (options.crop) {
      transformations.push(`c_${options.crop}`);
    }
    if (options.fetchFormat) {
      transformations.push('fl_any_format');
    }

    const transformationString = transformations.length > 0 ? transformations.join(',') : '';
    const baseUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload`;

    if (transformationString) {
      return `${baseUrl}/${transformationString}/${publicId}`;
    }

    return `${baseUrl}/${publicId}`;
  }

  /**
   * Get the public ID from a Cloudinary URL
   * @param url - Cloudinary image URL
   * @returns Public ID or null if not a Cloudinary URL
   */
  getPublicIdFromUrl(url: string): string | null {
    if (!this.isCloudinaryUrl(url)) {
      return null;
    }

    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');

    if (uploadIndex === -1 || uploadIndex + 1 >= urlParts.length) {
      return null;
    }

    // Extract everything after 'upload' (excluding transformations)
    const afterUpload = urlParts.slice(uploadIndex + 1);
    const publicIdStart = afterUpload.findIndex(part =>
      !part.startsWith('w_') &&
      !part.startsWith('h_') &&
      !part.startsWith('q_') &&
      !part.startsWith('c_') &&
      !part.startsWith('f_') &&
      !part.startsWith('fl_') &&
      part !== 'v1'
    );

    if (publicIdStart === -1) {
      return null;
    }

    return afterUpload.slice(publicIdStart).join('/');
  }

  /**
   * Check if a URL is a Cloudinary URL
   */
  isCloudinaryUrl(url: string): boolean {
    return url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): void {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(
        `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(`File size (${sizeMB}MB) exceeds maximum allowed (${MAX_FILE_SIZE / (1024 * 1024)}MB)`);
    }
  }

  /**
   * Upload with progress tracking using XMLHttpRequest
   */
  private uploadWithProgress(
    url: string,
    formData: FormData,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText
          }));
        } else {
          reject(new Error(xhr.responseText || 'Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was cancelled'));
      });

      xhr.open('POST', url);
      xhr.send(formData);
    });
  }

  /**
   * Upload multiple images in parallel
   */
  async uploadMultipleImages(
    files: File[],
    folder?: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<CloudinaryUploadResult[]> {
    const uploadPromises = files.map((file, index) =>
      this.uploadImage(file, folder, (progress) => {
        onProgress?.(index, progress);
      })
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Get optimized image URL for card display
   */
  getCardImageUrl(publicId: string): string {
    return this.getTransformedUrl(publicId, {
      width: 300,
      height: 200,
      crop: 'fill',
      quality: 80,
      format: 'webp'
    });
  }

  /**
   * Get optimized image URL for detail view
   */
  getDetailImageUrl(publicId: string): string {
    return this.getTransformedUrl(publicId, {
      width: 800,
      quality: 85,
      format: 'webp'
    });
  }

  /**
   * Get thumbnail URL
   */
  getThumbnailUrl(publicId: string): string {
    return this.getTransformedUrl(publicId, {
      width: 80,
      height: 60,
      crop: 'fill',
      quality: 70,
      format: 'webp'
    });
  }

  /**
   * Get list view image URL
   */
  getListImageUrl(publicId: string): string {
    return this.getTransformedUrl(publicId, {
      width: 120,
      height: 120,
      crop: 'fill',
      quality: 80,
      format: 'webp'
    });
  }

  /**
   * Get srcset for responsive images
   */
  getSrcSet(publicId: string, widths: number[]): string {
    return widths
      .map(width => {
        const url = this.getTransformedUrl(publicId, {
          width,
          quality: 80,
          format: 'webp'
        });
        return `${url} ${width}w`;
      })
      .join(', ');
  }

  /**
   * Get card srcset for responsive images
   */
  getCardSrcSet(publicId: string): string {
    return this.getSrcSet(publicId, [300, 600, 900]);
  }

  /**
   * Get detail srcset for responsive images
   */
  getDetailSrcSet(publicId: string): string {
    return this.getSrcSet(publicId, [400, 800, 1200]);
  }
}
