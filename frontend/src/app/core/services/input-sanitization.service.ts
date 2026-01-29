import { Injectable } from '@angular/core';

/**
 * InputSanitizationService
 * Client-side input sanitization to complement Angular's built-in XSS protection.
 *
 * Angular's template binding ({{ }}) already escapes HTML by default.
 * This service provides additional sanitization for form submissions,
 * stripping HTML tags and dangerous content before sending to the server.
 *
 * Referenced by: F-058 (Input Sanitization and XSS Prevention)
 */
@Injectable({
  providedIn: 'root'
})
export class InputSanitizationService {
  /**
   * Sanitize a string by stripping HTML tags and dangerous content.
   * Returns plain text suitable for safe storage.
   */
  sanitize(value: string): string {
    if (!value) return value;

    let sanitized = value;

    // Remove <script> tags and their content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove all HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Remove javascript: protocol patterns
    sanitized = sanitized.replace(/javascript\s*:/gi, '');

    // Remove on* event handler attributes
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
  }

  /**
   * Sanitize a string or return null if empty.
   */
  sanitizeOrNull(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;

    const sanitized = this.sanitize(value);
    return sanitized.length === 0 ? null : sanitized;
  }

  /**
   * Sanitize all string values in a form data object.
   * Non-string values (numbers, booleans, dates) are passed through unchanged.
   * Null/undefined values are preserved.
   */
  sanitizeFormData<T extends Record<string, unknown>>(data: T): T {
    const result = { ...data };

    for (const key of Object.keys(result)) {
      const value = result[key];
      if (typeof value === 'string') {
        (result as Record<string, unknown>)[key] = this.sanitize(value);
      }
    }

    return result;
  }

  /**
   * Check if a string contains potentially dangerous HTML/script content.
   */
  containsDangerousContent(value: string): boolean {
    if (!value) return false;

    const patterns = [
      /<script\b/i,
      /<\/script>/i,
      /javascript\s*:/i,
      /on\w+\s*=/i,
      /<iframe\b/i,
      /<object\b/i,
      /<embed\b/i
    ];

    return patterns.some(pattern => pattern.test(value));
  }
}
