import { validateEnvironment, isEnvironmentConfigured } from './environment.validator';
import { Environment } from './environment.type';

describe('Environment Validator', () => {
  const createValidEnvironment = (): Environment => ({
    production: false,
    siteUrl: 'http://localhost:4200',
    siteName: 'Phone Shop',
    supabase: {
      url: 'https://abcdefghijk.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkxNTM2MDAwMH0.abcdefghijklmnopqrstuvwxyz'
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
      address: '123 Mobile Street',
      phoneDisplay: '+1 234 567 890',
      phoneLink: '+1234567890',
      email: 'info@phoneshop.com',
      hours: {
        weekdays: 'Mon - Sat: 9:00 AM - 6:00 PM',
        weekend: 'Sun: Closed'
      },
      mapEmbedUrl: 'https://maps.google.com/embed',
      mapSearchUrl: 'https://maps.google.com/search'
    }
  });

  describe('validateEnvironment', () => {
    it('should pass validation for a properly configured environment', () => {
      const env = createValidEnvironment();
      expect(() => validateEnvironment(env)).not.toThrow();
      expect(validateEnvironment(env)).toBe(true);
    });

    it('should throw error when Supabase URL is placeholder value', () => {
      const env = createValidEnvironment();
      env.supabase.url = 'YOUR_SUPABASE_URL';
      expect(() => validateEnvironment(env)).toThrowError(/Environment configuration invalid/);
    });

    it('should throw error when Supabase URL is empty', () => {
      const env = createValidEnvironment();
      env.supabase.url = '';
      expect(() => validateEnvironment(env)).toThrowError(/Environment configuration invalid/);
    });

    it('should throw error when Supabase anon key is placeholder value', () => {
      const env = createValidEnvironment();
      env.supabase.anonKey = 'YOUR_SUPABASE_ANON_KEY';
      expect(() => validateEnvironment(env)).toThrowError(/Environment configuration invalid/);
    });

    it('should throw error when Supabase anon key is empty', () => {
      const env = createValidEnvironment();
      env.supabase.anonKey = '';
      expect(() => validateEnvironment(env)).toThrowError(/Environment configuration invalid/);
    });

    it('should throw error when Supabase URL does not start with https:// or http://localhost', () => {
      const env = createValidEnvironment();
      env.supabase.url = 'http://example.com';
      expect(() => validateEnvironment(env)).toThrowError(/Environment configuration invalid/);
    });

    it('should allow http://localhost for local development', () => {
      const env = createValidEnvironment();
      env.supabase.url = 'http://localhost:54321';
      expect(() => validateEnvironment(env)).not.toThrow();
    });

    it('should warn if anon key appears to be service_role key (too long)', () => {
      const env = createValidEnvironment();
      // Service role keys are typically longer than anon keys
      env.supabase.anonKey = 'x'.repeat(600);
      expect(() => validateEnvironment(env)).toThrowError(/Environment configuration invalid/);
    });

    it('should throw error for production site URL placeholder in production mode', () => {
      const env = createValidEnvironment();
      env.production = true;
      env.siteUrl = 'https://your-domain.com';
      expect(() => validateEnvironment(env)).toThrowError(/Environment configuration invalid/);
    });

    it('should not throw for site URL placeholder in development mode', () => {
      const env = createValidEnvironment();
      env.production = false;
      env.siteUrl = 'https://your-domain.com';
      expect(() => validateEnvironment(env)).not.toThrow();
    });

    it('should collect multiple errors', () => {
      const env = createValidEnvironment();
      env.supabase.url = 'YOUR_SUPABASE_URL';
      env.supabase.anonKey = 'YOUR_SUPABASE_ANON_KEY';
      // Expects 3 errors: URL placeholder, URL format, and anon key placeholder
      expect(() => validateEnvironment(env)).toThrowError(/3 error\(s\)/);
    });
  });

  describe('isEnvironmentConfigured', () => {
    it('should return true for a properly configured environment', () => {
      const env = createValidEnvironment();
      expect(isEnvironmentConfigured(env)).toBe(true);
    });

    it('should return false when Supabase URL is uppercase placeholder', () => {
      const env = createValidEnvironment();
      env.supabase.url = 'YOUR_SUPABASE_URL';
      expect(isEnvironmentConfigured(env)).toBe(false);
    });

    it('should return false when Supabase URL is example placeholder', () => {
      const env = createValidEnvironment();
      env.supabase.url = 'https://your-project-ref.supabase.co';
      expect(isEnvironmentConfigured(env)).toBe(false);
    });

    it('should return false when anon key is uppercase placeholder', () => {
      const env = createValidEnvironment();
      env.supabase.anonKey = 'YOUR_SUPABASE_ANON_KEY';
      expect(isEnvironmentConfigured(env)).toBe(false);
    });

    it('should return false when anon key is lowercase placeholder', () => {
      const env = createValidEnvironment();
      env.supabase.anonKey = 'your-supabase-anon-key';
      expect(isEnvironmentConfigured(env)).toBe(false);
    });
  });
});
