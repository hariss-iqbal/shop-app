import { Environment } from './environment.type';

/**
 * Production environment configuration.
 *
 * These values are substituted at build time via angular.json fileReplacements.
 * Run `npm run build:prod` to produce a production bundle using this configuration.
 *
 * SECURITY: Only the Supabase anon (public) key is permitted here.
 * NEVER include the service_role key or any admin/secret credentials in client-side code.
 */
export const environment: Environment = {
  production: true,
  siteUrl: 'https://your-domain.com',
  siteName: 'Phone Shop',
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
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
