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
 * - Go to your Supabase project dashboard → Settings → API
 * - "Project URL" → supabase.url
 * - "anon public" key → supabase.anonKey
 *
 * SECURITY WARNING:
 * - Only the anon (public) key is safe for client-side code.
 * - NEVER place the service_role key, database password, or any admin
 *   credentials in these environment files. They will be included in
 *   the browser bundle and visible to end users.
 */
export const environment: Environment = {
  production: false,
  siteUrl: 'http://localhost:4200',
  siteName: 'Phone Shop',
  supabase: {
    url: 'https://your-project-ref.supabase.co',
    anonKey: 'your-supabase-anon-key'
  },
  recaptcha: {
    enabled: false,
    siteKey: ''
  },
  whatsapp: {
    phoneNumber: '1234567890'
  },
  businessInfo: {
    name: 'Phone Shop',
    address: '123 Mobile Street, Tech City',
    phoneDisplay: '+1 234 567 890',
    phoneLink: '+1234567890',
    email: 'info@phoneshop.com',
    hours: {
      weekdays: 'Mon - Sat: 9:00 AM - 6:00 PM',
      weekend: 'Sun: Closed'
    },
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.2219901290355!2d-74.00369368400567!3d40.71312937933185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a23e28c1191%3A0x49f75d3281df052a!2s123%20Mobile%20St%2C%20New%20York%2C%20NY!5e0!3m2!1sen!2sus!4v1700000000000',
    mapSearchUrl: 'https://www.google.com/maps/search/?api=1&query=123+Mobile+Street+Tech+City'
  }
};
