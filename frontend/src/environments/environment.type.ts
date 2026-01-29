export interface Environment {
  /** Whether the app is running in production mode. */
  production: boolean;

  /** Base URL of the deployed site (used for SEO canonical URLs, PWA manifest, etc.). */
  siteUrl: string;

  /** Display name of the application. */
  siteName: string;

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
  };
}
