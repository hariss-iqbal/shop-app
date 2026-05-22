import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@env/environment';

/**
 * Thrown when an in-memory lock can't be acquired in time. The `isAcquireTimeout`
 * flag mirrors @supabase/auth-js so GoTrue treats it as a benign "skip" (e.g. the
 * auto-refresh ticker) rather than a hard failure.
 */
class LockAcquireTimeoutError extends Error {
  readonly isAcquireTimeout = true;
  constructor(message: string) {
    super(message);
    this.name = 'LockAcquireTimeoutError';
  }
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  // Per-tab in-memory lock state, keyed by lock name.
  // See the `lock` config below for why we deliberately avoid navigator.locks.
  private readonly processLocks: Record<string, Promise<unknown>> = {};

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          // Per-tab IN-MEMORY lock — deliberately NOT the default navigator.locks.
          //
          // The auth client uses a lock to serialize token refreshes (refresh
          // tokens are single-use, so two concurrent refreshes can race). Supabase's
          // default uses the Web Locks API, which is shared across ALL tabs of the
          // origin. That cross-tab lock was the bug: if a sibling tab held
          // "lock:sb-..." (stuck mid-refresh, or throttled while backgrounded),
          // every Supabase call in THIS tab blocked on it — and because the app
          // bootstraps via a Supabase query, that surfaced as an intermittent blank
          // white screen / loaders that never finish.
          //
          // This is a faithful port of @supabase/auth-js's `processLock`: it only
          // serializes operations WITHIN the current tab (so the client never races
          // itself) and never blocks on other tabs. Concurrent cross-tab refreshes
          // are safe here because GoTrue is configured with refresh_token_reuse_interval
          // (each concurrent caller gets a valid session inside the reuse window) and
          // the app no longer signs out on a transient auth hiccup.
          lock: <T>(name: string, acquireTimeout: number, fn: () => Promise<T>) =>
            this.processLock(name, acquireTimeout, fn)
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

  /**
   * In-memory, per-tab exclusive lock — a faithful port of @supabase/auth-js's
   * `processLock`. Serializes operations that share `name` within this tab only;
   * it never coordinates across browser tabs (unlike navigator.locks).
   *
   * The `acquireTimeout` contract MUST be honored exactly, or the auth client
   * misbehaves:
   *   - `< 0`  wait indefinitely for the previous op (used by getSession/refresh).
   *   - `=== 0` fail immediately if the lock is busy — the auto-refresh ticker uses
   *            this to SKIP a tick rather than queue behind in-flight work. Getting
   *            this wrong makes the ticker park itself in the chain and stall data
   *            queries behind it, producing intermittent never-ending loaders.
   *   - `> 0`  fail if the lock can't be acquired within the timeout.
   *
   * On an acquire-timeout the rejection carries `isAcquireTimeout` so GoTrue treats
   * it as benign; we then keep waiting on the previous op before clearing the slot.
   */
  private processLock<T>(name: string, acquireTimeout: number, fn: () => Promise<T>): Promise<T> {
    const previousOperation = this.processLocks[name] ?? Promise.resolve();

    const currentOperation = Promise.race(
      [
        previousOperation.catch(() => null),
        acquireTimeout >= 0
          ? new Promise<never>((_, reject) => {
              setTimeout(
                () => reject(new LockAcquireTimeoutError(`Acquiring process lock "${name}" timed out after ${acquireTimeout}ms`)),
                acquireTimeout
              );
            })
          : null
      ].filter((p): p is Promise<unknown> => p !== null)
    )
      .catch((err: unknown) => {
        if (err && (err as { isAcquireTimeout?: boolean }).isAcquireTimeout) {
          throw err;
        }
        return null;
      })
      .then(() => fn());

    this.processLocks[name] = currentOperation.catch(async (err: unknown) => {
      if (err && (err as { isAcquireTimeout?: boolean }).isAcquireTimeout) {
        // We timed out acquiring, so the previous op is still running — wait for it
        // to finish before this slot is considered free, then swallow the timeout.
        await previousOperation;
        return null;
      }
      throw err;
    });

    return currentOperation;
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
