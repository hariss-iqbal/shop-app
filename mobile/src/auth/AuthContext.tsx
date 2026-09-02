import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getMyPermissions } from '../api/variants';
import { config } from '../config';

export type AccessState = 'unknown' | 'checking' | 'granted' | 'denied';

WebBrowser.maybeCompleteAuthSession();

type AuthState = {
  session: Session | null;
  loading: boolean;
  access: AccessState;
  accessReason: string | null;
  role: string | null;
  /** admin or manager — gates the Variants stack and manager-only actions */
  isAdminish: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  devBypass: () => Promise<void>;
  signOut: () => Promise<void>;
  devBypassEnabled: boolean;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

// supabase-js's auth lock can deadlock on cold-start session restore (no
// network involved, so the client's fetch timeout never fires) — every gate
// call gets a hard deadline so the user can never be stuck on the spinner.
function withDeadline<T>(p: Promise<T>, ms: number, tag: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${tag} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<AccessState>('unknown');
  const [accessReason, setAccessReason] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    withDeadline(supabase.auth.getSession(), 10000, 'getSession')
      .then(({ data }) => {
        setSession(data.session);
      })
      .catch((e) => {
        // restore hung or failed — fall through to the login screen instead of
        // spinning forever; a fresh sign-in rebuilds the session
        setSession(null);
      })
      .finally(() => setLoading(false));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Gate access to approved staff. Admins/managers get the full app (Variants +
  // Outs); approved cashiers get the Outs stack only (branch transfers, settles,
  // returns). Unapproved accounts still see the Access Denied screen.
  const checkedUserRef = useRef<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!session) {
      checkedUserRef.current = null;
      setAccess('unknown');
      setAccessReason(null);
      setRole(null);
      return;
    }
    // onAuthStateChange delivers a NEW session object on every token refresh;
    // re-gating then would unmount the navigator mid-form. Same user = same
    // verdict, so only check when the signed-in user actually changes.
    if (checkedUserRef.current === session.user.id) return;
    checkedUserRef.current = session.user.id;
    setAccess('checking');
    withDeadline(getMyPermissions(), 12000, 'permission check')
      .then((p) => {
        if (cancelled) return;
        setRole(p.role);
        const isStaff = p.role === 'admin' || p.role === 'manager' || p.role === 'cashier';
        if (!p.isApproved) {
          setAccess('denied');
          setAccessReason('Your account is awaiting approval. Ask an admin to approve it.');
        } else if (!isStaff) {
          setAccess('denied');
          setAccessReason(`Your role (${p.role}) doesn't have access to this app.`);
        } else {
          setAccess('granted');
          setAccessReason(null);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        checkedUserRef.current = null; // allow a retry on the next auth event
        setAccess('denied');
        setAccessReason('Could not verify your permissions: ' + (e?.message ?? 'unknown error'));
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // On web we use the standard redirect flow; on native we open the system
    // browser and capture the deep-link redirect back into the app.
    const redirectTo =
      Platform.OS === 'web'
        ? window.location.origin
        : Linking.createURL('auth-callback');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: Platform.OS !== 'web',
      },
    });
    if (error) throw error;
    if (Platform.OS === 'web' || !data?.url) return;

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success' && result.url) {
      const { params } = parseRedirect(result.url);
      if (params.access_token && params.refresh_token) {
        const { error: setErr } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (setErr) throw setErr;
      } else if (params.code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(params.code);
        if (exErr) throw exErr;
      }
    }
  }, []);

  const devBypass = useCallback(async () => {
    if (!config.devBypass.enabled) throw new Error('Dev bypass is disabled in production.');
    const { error } = await supabase.auth.signInWithPassword({
      email: config.devBypass.email,
      password: config.devBypass.password,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        access,
        accessReason,
        role,
        isAdminish: role === 'admin' || role === 'manager',
        signInWithPassword,
        signInWithGoogle,
        devBypass,
        signOut,
        devBypassEnabled: config.devBypass.enabled,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Pull tokens/code out of a Supabase OAuth redirect (hash or query string). */
function parseRedirect(url: string): { params: Record<string, string> } {
  const params: Record<string, string> = {};
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const fragment =
    hashIndex >= 0
      ? url.substring(hashIndex + 1)
      : queryIndex >= 0
      ? url.substring(queryIndex + 1)
      : '';
  for (const pair of fragment.split('&')) {
    const [k, v] = pair.split('=');
    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
  }
  return { params };
}
