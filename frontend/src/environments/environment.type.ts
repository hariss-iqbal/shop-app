export interface Environment {
  /** Whether the app is running in production mode. */
  production: boolean;

  /** Base URL of the deployed site (used for SEO canonical URLs, PWA manifest, etc.). */
  siteUrl: string;

  /** Supabase connection configuration. Only the public anon key is allowed here. */
  supabase: {
    /**
     * Supabase project URL.
     * Example: https://abcdefghijk.supabase.co
     */
    url: string;

    /**
     * Supabase anonymous (public) key.
     * This key is safe to include in client-side code.
     * NEVER place the service_role key or any admin credentials here.
     */
    anonKey: string;
  };

  /** Google reCAPTCHA v3 configuration for contact form spam prevention. */
  recaptcha: {
    /** Whether reCAPTCHA is enabled. */
    enabled: boolean;

    /** reCAPTCHA v3 site key (public). */
    siteKey: string;
  };

  /**
   * Cloudinary configuration for image storage and optimization.
   * Cloudinary provides 25GB/month free bandwidth vs Supabase's 1GB limit.
   * Used for phone image uploads, transformations, and delivery.
   */
  cloudinary: {
    /** Cloudinary cloud name (from dashboard). */
    cloudName: string;

    /** Unsigned upload preset name (configured in Cloudinary dashboard). */
    uploadPreset: string;
  };

  /**
   * API Server configuration for backend services.
   * Used for services like phone specs scraping that require server-side processing.
   */
  apiServer: {
    /** Backend API server URL (e.g., 'http://localhost:3001' for local). */
    url: string;
  };

  /**
   * Store identifier for QR codes and receipts.
   * Used in multi-store environments to identify receipt origin.
   * Feature: F-017 Barcode/QR Code on Receipts
   */
  storeId?: string;
}
