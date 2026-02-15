import { Environment } from './environment.type';

/**
 * Development environment configuration.
 *
 * Supabase URL and anon key must be set to your local or development Supabase project.
 * Copy environment.example.ts and fill in your values if starting fresh.
 *
 * SECURITY: Only the Supabase anon (public) key is permitted here.
 * NEVER include the service_role key or any admin/secret credentials in client-side code.
 *
 * Business info (shop name, address, currency, etc.) is managed via the
 * ShopDetails entity in the database and the Admin > Shop Details form.
 */
export const environment: Environment = {
  production: false,
  siteUrl: 'http://localhost:4200',
  supabase: {
    url: 'http://localhost:54321',
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
    url: 'http://localhost:3001'
  },
  storeId: 'DEFAULT'
};
