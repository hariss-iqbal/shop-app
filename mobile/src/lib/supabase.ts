import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

/**
 * Single shared Supabase client.
 *
 * On native we persist the auth session in AsyncStorage. On web we let the
 * supabase-js default (localStorage) handle it so a page reload keeps you
 * signed in.
 */
// Per-request timeout so a hung request fails fast instead of freezing the UI
// (the app gates screens on auth/permission calls; without this a stalled
// request leaves the user stuck on a spinner forever).
const TIMEOUT_MS = 15000;
const timeoutFetch: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const signal = init?.signal;
  if (signal) signal.addEventListener('abort', () => controller.abort());
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
};

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No URL-based session detection on native; only relevant for web OAuth redirects.
    detectSessionInUrl: Platform.OS === 'web',
  },
  global: { fetch: timeoutFetch },
});
