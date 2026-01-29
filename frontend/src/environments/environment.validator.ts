import { Environment } from './environment.type';

/**
 * Validates that the environment configuration has been properly set up.
 * This prevents the app from running with placeholder values.
 *
 * @param env The environment configuration to validate
 * @returns true if configuration is valid
 * @throws Error if configuration contains placeholder values
 */
export function validateEnvironment(env: Environment): boolean {
  const errors: string[] = [];

  // Check Supabase configuration
  if (!env.supabase.url || env.supabase.url === 'YOUR_SUPABASE_URL') {
    errors.push('Supabase URL is not configured. Update environment.supabase.url');
  }

  if (!env.supabase.anonKey || env.supabase.anonKey === 'YOUR_SUPABASE_ANON_KEY') {
    errors.push('Supabase anon key is not configured. Update environment.supabase.anonKey');
  }

  // Validate URL format
  if (env.supabase.url && !env.supabase.url.startsWith('https://') && !env.supabase.url.startsWith('http://localhost') && !env.supabase.url.startsWith('http://192.168.') && !env.supabase.url.startsWith('http://127.0.0.1')) {
    errors.push('Supabase URL must start with https:// (or http://localhost for local development)');
  }

  // Check for accidental service_role key inclusion
  if (env.supabase.anonKey && env.supabase.anonKey.length > 500) {
    errors.push('SECURITY: The anonKey appears too long. Make sure you are using the anon key, not the service_role key');
  }

  // Check site URL
  if (!env.siteUrl || env.siteUrl === 'https://your-domain.com') {
    // Only warn in production mode
    if (env.production) {
      errors.push('Production site URL is not configured. Update environment.siteUrl');
    }
  }

  if (errors.length > 0) {
    const message = [
      'Environment configuration errors detected:',
      '',
      ...errors.map((e, i) => `  ${i + 1}. ${e}`),
      '',
      'Setup instructions:',
      '  1. Copy src/environments/environment.example.ts to src/environments/environment.ts',
      '  2. Replace placeholder values with your Supabase project credentials',
      '  3. Find credentials at: Supabase Dashboard > Settings > API',
      ''
    ].join('\n');

    console.error(message);
    throw new Error(`Environment configuration invalid: ${errors.length} error(s). Check console for details.`);
  }

  return true;
}

/**
 * Checks if environment appears to be using example/placeholder values.
 * Useful for showing setup instructions without blocking the app entirely.
 */
export function isEnvironmentConfigured(env: Environment): boolean {
  return (
    env.supabase.url !== 'YOUR_SUPABASE_URL' &&
    env.supabase.url !== 'https://your-project-ref.supabase.co' &&
    env.supabase.anonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
    env.supabase.anonKey !== 'your-supabase-anon-key'
  );
}
