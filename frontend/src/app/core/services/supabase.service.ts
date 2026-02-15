import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          // Custom lock implementation to prevent "signal is aborted without reason"
          // AbortErrors from the Web Locks API during navigation/route changes.
          // The default Supabase lock uses AbortController with navigator.locks
          // which throws benign AbortErrors that cascade through Angular's error handling.
          lock: async (name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
            if (typeof navigator === 'undefined' || !navigator?.locks?.request) {
              return await fn();
            }
            try {
              return await navigator.locks.request(
                name,
                { mode: 'exclusive' },
                async () => await fn()
              );
            } catch (err: any) {
              if (err?.name === 'AbortError') {
                // Lock was aborted during navigation — benign, run without lock
                return await fn();
              }
              throw err;
            }
          }
        },
        global: {
          // Global fetch timeout to prevent queries from hanging forever
          // when the database becomes unresponsive. Without this, a hung
          // DB connection blocks all subsequent queries and freezes the app.
          fetch: (url: RequestInfo | URL, options?: RequestInit) => {
            const timeoutSignal = AbortSignal.timeout(15000);
            const signal = options?.signal
              ? AbortSignal.any([timeoutSignal, options.signal])
              : timeoutSignal;
            return fetch(url, { ...options, signal });
          }
        }
      }
    );
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  get auth() {
    return this.supabase.auth;
  }

  get storage() {
    return this.supabase.storage;
  }

  from(table: string) {
    return this.supabase.from(table);
  }

  rpc(fn: string, args?: Record<string, unknown>) {
    return this.supabase.rpc(fn, args);
  }

  channel(name: string) {
    return this.supabase.channel(name);
  }

  removeChannel(channel: ReturnType<SupabaseClient['channel']>) {
    return this.supabase.removeChannel(channel);
  }
}
