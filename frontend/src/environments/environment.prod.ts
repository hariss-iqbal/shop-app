import { Environment } from './environment.type';

/**
 * Production environment configuration.
 *
 * These values are substituted at build time via angular.json fileReplacements.
 * Run `npm run build:prod` to produce a production bundle using this configuration.
 *
 * SECURITY: Only the Supabase anon (public) key is permitted here.
 * NEVER include the service_role key or any admin/secret credentials in client-side code.
 *
 * Business info (shop name, address, currency, etc.) is managed via the
 * ShopDetails entity in the database and the Admin > Shop Details form.
 */
export const environment: Environment = {
  production: true,
  siteUrl: 'https://shop-app-phi-wine.vercel.app',
  supabase: {
    url: 'https://dgatqyxfpvocoyinpshg.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnYXRxeXhmcHZvY295aW5wc2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTYzNTQsImV4cCI6MjA4NTI5MjM1NH0.oNHOwCQ2HlllocQ0hsjVPTJD5qt-KoRZvzaQT8eWfME'
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
    url: 'https://shop-app-api-omega.vercel.app'
  },
  storeId: 'MAIN'
};
