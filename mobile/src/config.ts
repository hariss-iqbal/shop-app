import { Platform } from 'react-native';

/**
 * Backend configuration.
 *
 * Local Supabase runs on the host at 127.0.0.1:54321. Reaching it depends on
 * where the app runs:
 *   - Web (Expo web on the host)          -> http://localhost:54321
 *   - Android emulator                    -> http://10.0.2.2:54321  (emulator alias for host loopback)
 *   - iOS simulator                       -> http://localhost:54321
 *   - Physical device via Expo Go         -> http://<host-LAN-IP>:54321  (this machine: 192.168.100.217)
 *
 * To target PRODUCTION instead, set EXPO_PUBLIC_SUPABASE_URL to the prod URL
 * (the `npm run *:prod` scripts do this). The matching anon key is selected
 * automatically; override with EXPO_PUBLIC_SUPABASE_ANON_KEY if needed.
 */
const HOST_LAN_IP = '192.168.100.217';

const PROD_URL = 'https://dgatqyxfpvocoyinpshg.supabase.co';
// Public anon (publishable) keys — safe in client code.
const PROD_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnYXRxeXhmcHZvY295aW5wc2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MTYzNTQsImV4cCI6MjA4NTI5MjM1NH0.oNHOwCQ2HlllocQ0hsjVPTJD5qt-KoRZvzaQT8eWfME';
const LOCAL_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

function defaultLocalUrl(): string {
  if (Platform.OS === 'android') return 'http://10.0.2.2:54321';
  return 'http://localhost:54321'; // web + iOS simulator
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || defaultLocalUrl();
const isProd = supabaseUrl === PROD_URL || supabaseUrl.includes('.supabase.co');
const isLocal = !isProd;

// GSMArena scraper proxy (backend/src/api-server.ts). Locally it runs on
// :3001 (reachable from the Android emulator via 10.0.2.2); prod uses the
// deployed Vercel proxy, matching the web app's environment.prod.
function defaultApiServerUrl(): string {
  if (isProd) return 'https://shop-app-api-omega.vercel.app';
  if (Platform.OS === 'android') return 'http://10.0.2.2:3001';
  return 'http://localhost:3001';
}

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || (isProd ? PROD_ANON_KEY : LOCAL_ANON_KEY);

export const config = {
  supabaseUrl,
  supabaseAnonKey,
  isProd,
  isLocal,
  apiServerUrl: process.env.EXPO_PUBLIC_API_SERVER_URL || defaultApiServerUrl(),

  // Cloudinary unsigned upload (same account/preset the web app uses on both envs).
  cloudinary: {
    cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dvvqiwfmk',
    uploadPreset:
      process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'phone-shop-unsigned',
    folder: 'phone-images/variants',
  },

  // Dev-only convenience: skip the login screen. Restricted to DEV builds AND a
  // LOCAL backend — the seed admin (admin@gmail.com) only exists locally, so we
  // never show a bypass that would fail (or touch real accounts) against prod.
  devBypass: {
    enabled: __DEV__ && isLocal,
    email: 'admin@gmail.com',
    password: 'password123',
  },

  hostLanIp: HOST_LAN_IP,

  // Shown on the login screen so a fresh build is visually verifiable.
  version: '1.0.2',
  buildTag: '2026-07-02-glogo',
};
