import { Environment } from './environment.type';

/**
 * Example environment configuration for new developers.
 *
 * SETUP INSTRUCTIONS:
 * 1. Copy this file to `environment.ts` in the same directory.
 * 2. Replace placeholder values with your Supabase project credentials.
 * 3. For production, also update `environment.prod.ts` with production values.
 *
 * WHERE TO FIND YOUR SUPABASE CREDENTIALS:
 * - Go to your Supabase project dashboard > Settings > API
 * - "Project URL" -> supabase.url
 * - "anon public" key -> supabase.anonKey
 *
 * SECURITY WARNING:
 * - Only the anon (public) key is safe for client-side code.
 * - NEVER place the service_role key, database password, or any admin
 *   credentials in these environment files. They will be included in
 *   the browser bundle and visible to end users.
 *
 * BUSINESS CONFIGURATION:
 * - Shop name, address, currency, phone, hours, etc. are managed via
 *   the ShopDetails entity in the database (Admin > Shop Details form).
 */
export const environment: Environment = {
  production: false,
  siteUrl: 'http://localhost:4200',
  supabase: {
    url: 'https://your-project-ref.supabase.co',
    anonKey: 'your-supabase-anon-key'
  },
  recaptcha: {
    enabled: false,
    siteKey: ''
  },
  cloudinary: {
    cloudName: 'your-cloudinary-cloud-name',
    uploadPreset: 'your-unsigned-upload-preset'
  },
  apiServer: {
    url: 'http://localhost:3001'
  },
  storeId: 'DEFAULT'
};
