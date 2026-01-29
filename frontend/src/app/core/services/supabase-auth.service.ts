import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseAuthService implements OnDestroy {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private authSubscription: { unsubscribe: () => void } | null = null;

  private readonly _user = signal<User | null>(null);
  private readonly _session = signal<Session | null>(null);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly session = this._session.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isAuthenticated = computed(() => !!this._session());
  readonly userEmail = computed(() => this._user()?.email ?? null);

  constructor() {
    this.initializeAuthListener();
    this.checkInitialSession();
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  private initializeAuthListener(): void {
    const { data } = this.supabaseService.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        this._session.set(session);
        this._user.set(session?.user ?? null);
        this._loading.set(false);
        this._error.set(null);

        if (event === 'SIGNED_OUT') {
          this.router.navigate(['/']);
        }
      }
    );
    this.authSubscription = data.subscription;
  }

  private async checkInitialSession(): Promise<void> {
    try {
      const { data: { session }, error } = await this.supabaseService.auth.getSession();

      if (error) {
        this._error.set(error.message);
        this._loading.set(false);
        return;
      }

      this._session.set(session);
      this._user.set(session?.user ?? null);
      this._loading.set(false);
    } catch (err) {
      this._error.set('Failed to check authentication status');
      this._loading.set(false);
    }
  }

  async signIn(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const { data, error } = await this.supabaseService.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        this._error.set(error.message);
        this._loading.set(false);
        return { success: false, error: error.message };
      }

      this._session.set(data.session);
      this._user.set(data.user);
      this._loading.set(false);
      return { success: true };
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during sign in';
      this._error.set(errorMessage);
      this._loading.set(false);
      return { success: false, error: errorMessage };
    }
  }

  async signOut(): Promise<{ success: boolean; error?: string }> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const { error } = await this.supabaseService.auth.signOut();

      if (error) {
        this._error.set(error.message);
        this._loading.set(false);
        return { success: false, error: error.message };
      }

      this._session.set(null);
      this._user.set(null);
      this._loading.set(false);
      return { success: true };
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during sign out';
      this._error.set(errorMessage);
      this._loading.set(false);
      return { success: false, error: errorMessage };
    }
  }

  async refreshSession(): Promise<void> {
    try {
      const { data: { session }, error } = await this.supabaseService.auth.refreshSession();

      if (error) {
        this._error.set(error.message);
        return;
      }

      this._session.set(session);
      this._user.set(session?.user ?? null);
    } catch (err) {
      this._error.set('Failed to refresh session');
    }
  }

  clearError(): void {
    this._error.set(null);
  }
}
