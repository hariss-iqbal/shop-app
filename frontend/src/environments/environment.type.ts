export interface Environment {
  /** Whether the app is running in production mode. */
  production: boolean;

  /** Base URL of the deployed site (used for SEO canonical URLs, PWA manifest, etc.). */
  siteUrl: string;

  /** Display name of the application. */
  siteName: string;

  /**
   * Currency configuration for the application.
   * Controls how monetary values are displayed throughout the app.
   */
  currency: {
    /** ISO 4217 currency code (e.g., 'PKR', 'USD', 'EUR'). */
    code: string;
    /** Locale for number formatting (e.g., 'en-PK', 'en-US'). */
    locale: string;
    /** Currency symbol for simple display (e.g., 'Rs.', '$'). */
    symbol: string;
    /** Number of decimal places to show (0 for whole numbers, 2 for cents). */
    decimals: number;
  };

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
    /** Backend API server URL (e.g., 'http://192.168.100.111:3001' for local). */
    url: string;
  };

  /**
   * WhatsApp configuration for customer inquiries.
   * Phone number should be in international format without + or spaces.
   * Example: '1234567890' for a US number.
   */
  whatsapp: {
    /** WhatsApp phone number in international format (digits only). */
    phoneNumber: string;
  };

  /** Business contact information displayed on the contact page. */
  businessInfo: {
    /** Business name */
    name: string;
    /** Physical address */
    address: string;
    /** Phone number for display (formatted) */
    phoneDisplay: string;
    /** Phone number for tel: link (digits only with country code) */
    phoneLink: string;
    /** Email address */
    email: string;
    /** Business hours */
    hours: {
      weekdays: string;
      weekend: string;
    };
    /** Google Maps embed URL */
    mapEmbedUrl: string;
    /** Google Maps search URL for fallback link */
    mapSearchUrl: string;
    /**
     * Store identifier for QR codes and receipts.
     * Used in multi-store environments to identify receipt origin.
     * Feature: F-017 Barcode/QR Code on Receipts
     */
    storeId?: string;
  };
}
