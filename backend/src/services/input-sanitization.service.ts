/**
 * InputSanitizationService
 * Provides server-side input sanitization to prevent XSS attacks.
 * Strips HTML tags, script content, and dangerous patterns from user input.
 * All text fields are stored as plain text without HTML interpretation.
 */
export class InputSanitizationService {
  /**
   * Sanitize a single string value by stripping HTML tags and dangerous content.
   * Returns plain text suitable for safe storage and rendering.
   */
  sanitizeString(value: string): string {
    if (!value) return value;

    let sanitized = value;

    // Remove <script> tags and their content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove all HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // Decode common HTML entities to plain text
    sanitized = sanitized.replace(/&lt;/g, '<');
    sanitized = sanitized.replace(/&gt;/g, '>');
    sanitized = sanitized.replace(/&amp;/g, '&');
    sanitized = sanitized.replace(/&quot;/g, '"');
    sanitized = sanitized.replace(/&#x27;/g, "'");
    sanitized = sanitized.replace(/&#x2F;/g, '/');

    // Re-encode dangerous characters for storage
    sanitized = sanitized.replace(/</g, '&lt;');
    sanitized = sanitized.replace(/>/g, '&gt;');

    // Remove javascript: protocol patterns
    sanitized = sanitized.replace(/javascript\s*:/gi, '');

    // Remove on* event handler attributes that might have survived
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
  }

  /**
   * Sanitize a string and enforce maximum length.
   * Returns null if the input is null/undefined or empty after sanitization.
   */
  sanitizeAndTruncate(value: string | null | undefined, maxLength: number): string | null {
    if (value === null || value === undefined) return null;

    const sanitized = this.sanitizeString(value);
    if (sanitized.length === 0) return null;

    return sanitized.substring(0, maxLength);
  }

  /**
   * Sanitize a required string field.
   * Throws an error if the result is empty after sanitization.
   */
  sanitizeRequired(value: string, fieldName: string, maxLength: number): string {
    const sanitized = this.sanitizeString(value);

    if (!sanitized || sanitized.trim().length === 0) {
      throw new Error(`${fieldName} is required`);
    }

    return sanitized.substring(0, maxLength);
  }

  /**
   * Sanitize all string fields in an object.
   * Non-string fields are passed through unchanged.
   */
  sanitizeObject<T extends Record<string, unknown>>(obj: T, fieldConfigs: FieldSanitizationConfig[]): T {
    const result = { ...obj };

    for (const config of fieldConfigs) {
      const value = result[config.field];

      if (typeof value === 'string') {
        if (config.required) {
          (result as Record<string, unknown>)[config.field] = this.sanitizeRequired(
            value,
            config.displayName || config.field,
            config.maxLength
          );
        } else {
          (result as Record<string, unknown>)[config.field] = this.sanitizeAndTruncate(
            value,
            config.maxLength
          );
        }
      }
    }

    return result;
  }

  /**
   * Check if a string contains potentially dangerous HTML/script content.
   * Useful for logging/monitoring without modifying the content.
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
      /<embed\b/i,
      /<form\b/i,
      /<img\b[^>]*\bonerror\b/i
    ];

    return patterns.some(pattern => pattern.test(value));
  }
}

export interface FieldSanitizationConfig {
  field: string;
  maxLength: number;
  required?: boolean;
  displayName?: string;
}
