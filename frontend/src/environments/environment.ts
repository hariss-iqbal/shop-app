import { Environment } from './environment.type';

/**
 * Development environment configuration.
 *
 * Supabase URL and anon key must be set to your local or development Supabase project.
 * Copy environment.example.ts and fill in your values if starting fresh.
 *
 * SECURITY: Only the Supabase anon (public) key is permitted here.
 * NEVER include the service_role key or any admin/secret credentials in client-side code.
 */
export const environment: Environment = {
  production: false,
  siteUrl: 'http://192.168.100.111:4200',
  siteName: 'Spring Mobiles',
  currency: {
    code: 'PKR',
    locale: 'en-PK',
    symbol: 'Rs.',
    decimals: 0
  },
  supabase: {
    url: 'http://192.168.100.111:54321',
    anonKey: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
  },
  recaptcha: {
    enabled: false,
    siteKey: ''
  },
  cloudinary: {
    cloudName: 'dvvqiwfmk',
    uploadPreset: 'phone-shop-unsigned'
  },
  apiServer: {
    url: 'http://192.168.100.111:3001'
  },
  whatsapp: {
    phoneNumber: '1234567890'
  },
  businessInfo: {
    name: 'Spring Mobiles',
    address: 'Shop G7, Fazal Trade Center, Lahore',
    phoneDisplay: '+1 234 567 890',
    phoneLink: '+1234567890',
    email: 'info@phoneshop.com',
    hours: {
      weekdays: 'Mon - Sat: 9:00 AM - 6:00 PM',
      weekend: 'Sun: Closed'
    },
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3400.0!2d74.3587!3d31.5204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sFazal%20Trade%20Center%2C%20Lahore!5e0!3m2!1sen!2spk!4v1700000000000',
    mapSearchUrl: 'https://www.google.com/maps/search/?api=1&query=Fazal+Trade+Center+Lahore',
    storeId: 'DEFAULT'
  }
};
