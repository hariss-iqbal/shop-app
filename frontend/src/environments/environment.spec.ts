import { environment } from './environment';
import { Environment } from './environment.type';

describe('Environment Configuration', () => {
  it('should export an environment object', () => {
    expect(environment).toBeDefined();
  });

  it('should have correct type structure', () => {
    // This test verifies the environment object matches the expected type
    const env: Environment = environment;
    expect(env).toBeDefined();
  });

  it('should have production flag defined', () => {
    expect(typeof environment.production).toBe('boolean');
  });

  it('should have siteUrl defined', () => {
    expect(typeof environment.siteUrl).toBe('string');
    expect(environment.siteUrl.length).toBeGreaterThan(0);
  });

  it('should have siteName defined', () => {
    expect(typeof environment.siteName).toBe('string');
    expect(environment.siteName.length).toBeGreaterThan(0);
  });

  it('should have supabase configuration', () => {
    expect(environment.supabase).toBeDefined();
    expect(typeof environment.supabase.url).toBe('string');
    expect(typeof environment.supabase.anonKey).toBe('string');
  });

  it('should have recaptcha configuration', () => {
    expect(environment.recaptcha).toBeDefined();
    expect(typeof environment.recaptcha.enabled).toBe('boolean');
    expect(typeof environment.recaptcha.siteKey).toBe('string');
  });

  it('should have whatsapp configuration', () => {
    expect(environment.whatsapp).toBeDefined();
    expect(typeof environment.whatsapp.phoneNumber).toBe('string');
  });

  it('should have businessInfo configuration', () => {
    expect(environment.businessInfo).toBeDefined();
    expect(typeof environment.businessInfo.name).toBe('string');
    expect(typeof environment.businessInfo.address).toBe('string');
    expect(typeof environment.businessInfo.phoneDisplay).toBe('string');
    expect(typeof environment.businessInfo.phoneLink).toBe('string');
    expect(typeof environment.businessInfo.email).toBe('string');
    expect(environment.businessInfo.hours).toBeDefined();
    expect(typeof environment.businessInfo.hours.weekdays).toBe('string');
    expect(typeof environment.businessInfo.hours.weekend).toBe('string');
    expect(typeof environment.businessInfo.mapEmbedUrl).toBe('string');
    expect(typeof environment.businessInfo.mapSearchUrl).toBe('string');
  });

  it('should NOT contain service_role key pattern', () => {
    // Ensure no sensitive keys are exposed
    const envString = JSON.stringify(environment);
    expect(envString).not.toContain('service_role');
    expect(envString).not.toContain('serviceRole');
    expect(envString).not.toContain('SERVICE_ROLE');
  });

  it('should NOT contain database password patterns', () => {
    const envString = JSON.stringify(environment);
    expect(envString.toLowerCase()).not.toContain('db_password');
    expect(envString.toLowerCase()).not.toContain('database_password');
    expect(envString.toLowerCase()).not.toContain('postgres_password');
  });
});
