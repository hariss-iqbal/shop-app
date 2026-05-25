import { Inject, Injectable, OnDestroy, PLATFORM_ID, computed, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { User, Session, AuthChangeEvent, RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { AuditLogService } from './audit-log.service';
import { UserRole, Permission, getPermissionsForRole } from '../../enums/user-role.enum';

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

interface StoredSessionData {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  lastActivity: number;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseAuthService implements OnDestroy {
  private authSubscription: { unsubscribe: () => void } | null = null;
  private approvalChannel: RealtimeChannel | null = null;

  private readonly _user = signal<User | null>(null);
  private readonly _session = signal<Session | null>(null);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);
  private readonly _userRole = signal<UserRole | null>(null);
  private readonly _permissions = signal<Record<Permission, boolean> | null>(null);
  private readonly _isApproved = signal<boolean>(false);
  private readonly _roleLoading = signal<boolean>(false);
  private readonly _roleInitialized = signal<boolean>(false);

  // Flag to prevent auth listener from calling loadUserRole during initial boot
  private isInitializing = true;

  // localStorage keys
  private readonly STORAGE_KEY = 'supabase_auth_session';
  private readonly ACTIVITY_KEY = 'supabase_last_activity';
  private readonly SESSION_EXPIRY_KEY = 'supabase_session_expires_at';

  // Inactivity timeout in milliseconds (default: 30 minutes)
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000;

  // Background recovery for transient permission-load failures, so a brief
  // backend hiccup doesn't leave an admin stuck with default (cashier) access
  // until they manually reload.
  private roleRecoveryTimer: ReturnType<typeof setTimeout> | null = null;
  private roleRecoveryAttempts = 0;
  private readonly MAX_ROLE_RECOVERY_ATTEMPTS = 5;

  // Activity tracking
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  private activityHandler: (() => void) | null = null;
  private isActivityTrackingSetup = false;

  // Proactive token refresh when the tab regains focus. A backgrounded tab has its
  // refresh timer throttled by the browser, so the access token is often already
  // expired when the user returns — then their first click forces an INLINE refresh
  // under the auth lock that blocks every data request until it completes (the
  // "stuck loading until I reload" symptom). Refreshing eagerly on focus moves that
  // unavoidable refresh into the idle moment BEFORE the click, so getSession() (used
  // by every data call) returns a fresh token instantly.
  private visibilityHandler: (() => void) | null = null;
  private lastProactiveRefresh = 0;
  private readonly PROACTIVE_REFRESH_MIN_INTERVAL = 30 * 1000; // at most once per 30s
  private readonly PROACTIVE_REFRESH_LEAD = 2 * 60 * 1000;     // only if token expires within 2 min

  readonly user = this._user.asReadonly();
  readonly session = this._session.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly userRole = this._userRole.asReadonly();
  readonly permissions = this._permissions.asReadonly();
  readonly isApproved = this._isApproved.asReadonly();
  readonly roleLoading = this._roleLoading.asReadonly();
  readonly roleInitialized = this._roleInitialized.asReadonly();

  readonly isAuthenticated = computed(() => !!this._session());
  readonly userEmail = computed(() => this._user()?.email ?? null);

  readonly isAdmin = computed(() => this._userRole() === UserRole.ADMIN);
  readonly isManager = computed(() => this._userRole() === UserRole.MANAGER);
  readonly isCashier = computed(() => this._userRole() === UserRole.CASHIER);
  readonly isManagerOrAdmin = computed(() =>
    this._userRole() === UserRole.ADMIN || this._userRole() === UserRole.MANAGER
  );

  readonly canAccessDashboard = computed(() => this._permissions()?.canAccessDashboard ?? false);
  readonly canAccessInventory = computed(() => this._permissions()?.canAccessInventory ?? false);
  readonly canAccessBrands = computed(() => this._permissions()?.canAccessBrands ?? false);
  readonly canAccessPurchaseOrders = computed(() => this._permissions()?.canAccessPurchaseOrders ?? false);
  readonly canAccessSuppliers = computed(() => this._permissions()?.canAccessSuppliers ?? false);
  readonly canAccessSales = computed(() => this._permissions()?.canAccessSales ?? false);
  readonly canProcessRefunds = computed(() => this._permissions()?.canProcessRefunds ?? false);
  readonly canAccessReports = computed(() => this._permissions()?.canAccessReports ?? false);
  readonly canAccessMessages = computed(() => this._permissions()?.canAccessMessages ?? false);
  readonly canAccessStorage = computed(() => this._permissions()?.canAccessStorage ?? false);
  readonly canAccessReceiptSequences = computed(() => this._permissions()?.canAccessReceiptSequences ?? false);
  readonly canManageUsers = computed(() => this._permissions()?.canManageUsers ?? false);
  readonly canAccessSystemSettings = computed(() => this._permissions()?.canAccessSystemSettings ?? false);
  readonly canAccessAuditLogs = computed(() => this._permissions()?.canAccessAuditLogs ?? false);

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    private auditLogService: AuditLogService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.initializeAuthListener();
    this.checkInitialSession();
    if (isPlatformBrowser(this.platformId)) {
      this.setupActivityTracking();
      this.setupProactiveRefresh();
    }
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.unsubscribeApprovalChannel();
    this.cleanupActivityTracking();
    this.cleanupProactiveRefresh();
    this.cancelRoleRecovery();
  }

  // ============ localStorage Methods ============

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private saveSessionToStorage(session: Session): void {
    if (!this.isBrowser()) return;

    const now = Date.now();
    const expiresAt = now + this.INACTIVITY_TIMEOUT;

    const sessionData: StoredSessionData = {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      userId: session.user.id,
      email: session.user.email || '',
      lastActivity: now,
      expiresAt
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
    localStorage.setItem(this.ACTIVITY_KEY, now.toString());
    localStorage.setItem(this.SESSION_EXPIRY_KEY, expiresAt.toString());

    this.resetInactivityTimer();
  }

  private clearSessionFromStorage(): void {
    if (!this.isBrowser()) return;

    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.ACTIVITY_KEY);
    localStorage.removeItem(this.SESSION_EXPIRY_KEY);

    // Clear the inactivity timer
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  // ============ Activity Tracking Methods ============

  private setupActivityTracking(): void {
    if (!this.isBrowser() || this.isActivityTrackingSetup) return;

    // Create bound handler once and store it
    const handler = this.handleUserActivity.bind(this);
    this.activityHandler = handler;

    // Track user activity to reset inactivity timer
    this.ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, handler, { passive: true });
    });

    this.isActivityTrackingSetup = true;
    // Initial timer setup
    this.resetInactivityTimer();
  }

  private cleanupActivityTracking(): void {
    if (!this.isBrowser() || !this.isActivityTrackingSetup) return;

    const handler = this.activityHandler;
    if (handler) {
      this.ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, handler);
      });
      this.activityHandler = null;
    }

    this.isActivityTrackingSetup = false;

    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  // ============ Proactive Token Refresh ============

  private setupProactiveRefresh(): void {
    if (!this.isBrowser() || this.visibilityHandler) return;

    const handler = () => {
      if (document.visibilityState !== 'visible') return;
      void this.proactivelyRefreshIfNeeded();
    };
    this.visibilityHandler = handler;
    document.addEventListener('visibilitychange', handler);
    window.addEventListener('focus', handler);
  }

  private cleanupProactiveRefresh(): void {
    if (!this.isBrowser() || !this.visibilityHandler) return;
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    window.removeEventListener('focus', this.visibilityHandler);
    this.visibilityHandler = null;
  }

  /**
   * Refreshes the access token eagerly when the tab regains focus, but only when it
   * is at/near expiry — so the refresh happens during the idle moment instead of
   * blocking the user's first data-loading click. Throttled and best-effort; any
   * failure is harmless because the auto-refresh ticker and getSession() still run.
   */
  private async proactivelyRefreshIfNeeded(): Promise<void> {
    const session = this._session();
    if (!session) return;

    const now = Date.now();
    if (now - this.lastProactiveRefresh < this.PROACTIVE_REFRESH_MIN_INTERVAL) return;

    const expiresAtMs = (session.expires_at ?? 0) * 1000;
    if (expiresAtMs - now > this.PROACTIVE_REFRESH_LEAD) return;

    this.lastProactiveRefresh = now;
    try {
      await this.refreshSession();
    } catch {
      // refreshSession() already records the error; the ticker will retry.
    }
  }

  private handleUserActivity(): void {
    if (!this.isAuthenticated()) return;

    // Update last activity timestamp
    const now = Date.now();
    localStorage.setItem(this.ACTIVITY_KEY, now.toString());

    // Extend session expiry
    const newExpiresAt = now + this.INACTIVITY_TIMEOUT;
    localStorage.setItem(this.SESSION_EXPIRY_KEY, newExpiresAt.toString());

    // Reset the inactivity timer
    this.resetInactivityTimer();
  }

  private resetInactivityTimer(): void {
    if (!this.isBrowser()) return;

    // Clear existing timer
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    // Set new timer - auto logout after inactivity timeout
    this.inactivityTimer = setTimeout(async () => {
      console.log('User inactive for too long, signing out...');
      await this.signOut().catch(err => {
        console.error('Error during inactivity sign out:', err);
      });
    }, this.INACTIVITY_TIMEOUT);
  }

  private initializeAuthListener(): void {
    const { data } = this.supabaseService.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // During initialization, let checkInitialSession handle everything
        if (this.isInitializing) {
          return;
        }

        this._session.set(session);
        this._user.set(session?.user ?? null);
        this._error.set(null);

        if (event === 'SIGNED_IN' && session) {
          this.saveSessionToStorage(session);
          const roleResult = await this.loadUserRole();
          this._loading.set(false);
          // Only sign out on a definitive "not approved" answer, never on a
          // transient permission-check failure.
          if (roleResult.definitive && !this._isApproved()) {
            await this.signOutAndRedirectToPending();
            return;
          }
          this.subscribeToApprovalChanges(session.user.id);
        }

        if (event === 'SIGNED_OUT') {
          this.unsubscribeApprovalChannel();
          this.clearRole();
          this.clearSessionFromStorage();
          this._loading.set(false);
          this.router.navigate(['/']);
        }

        if (event === 'TOKEN_REFRESHED' && session) {
          this.saveSessionToStorage(session);
        }
      }
    );
    this.authSubscription = data.subscription;
  }

  private async checkInitialSession(): Promise<void> {
    this.isInitializing = true;

    try {
      // Get session from Supabase (it handles token validation internally)
      const { data: { session }, error } = await this.supabaseService.auth.getSession();

      if (error) {
        this._error.set(error.message);
        this.clearSessionFromStorage();
        this.finalizeInitialization(null);
        return;
      }

      if (session) {
        // Valid session - save and load role
        this.saveSessionToStorage(session);
        this._session.set(session);
        this._user.set(session.user);
        const roleResult = await this.loadUserRole();

        // Only sign out if we DEFINITIVELY know the user isn't approved.
        // A transient permission-check failure must never log out a valid session.
        if (roleResult.definitive && !this._isApproved()) {
          // Session exists but user not approved — sign out silently
          await this.signOutAndRedirectToPending();
          return;
        }

        this.subscribeToApprovalChanges(session.user.id);
        this.resetInactivityTimer();
      } else {
        // No session - user is not authenticated
        this.clearSessionFromStorage();
        this._roleInitialized.set(true);
      }

      this.finalizeInitialization(session);
    } catch (err) {
      // AbortErrors and Web Locks acquisition timeouts from Supabase's auth lock
      // are benign (they happen during navigation or cross-tab refresh races) —
      // don't treat them as an auth failure and, crucially, don't clear the
      // stored session, otherwise the user gets bounced to login intermittently.
      const name = (err as { name?: string })?.name;
      const message = (err as { message?: string })?.message ?? '';
      const isBenignLockError =
        (err instanceof DOMException && err.name === 'AbortError') ||
        name === 'AbortError' ||
        name === 'NavigatorLockAcquireTimeoutError' ||
        message.includes('Navigator LockManager');
      if (isBenignLockError) {
        this._roleInitialized.set(true);
        this.finalizeInitialization(null);
        return;
      }
      console.error('Failed to check authentication status:', err);
      this._error.set('Failed to check authentication status');
      this.clearSessionFromStorage();
      this._roleInitialized.set(true);
      this.finalizeInitialization(null);
    }
  }

  /**
   * Marks initialization as complete and enables auth listener
   */
  private finalizeInitialization(session: Session | null): void {
    this._loading.set(false);
    this.isInitializing = false;

    // If no session, ensure role is marked as initialized
    if (!session) {
      this._roleInitialized.set(true);
    }
  }

  /**
   * Loads the current user's role and permissions via the get_my_permissions RPC.
   *
   * Returns `{ definitive: true }` only when the RPC actually answered (so callers
   * can safely act on the approval status). On a transient failure (gateway 502/503,
   * timeout, network blip, token-refresh race) it returns `{ definitive: false }`
   * WITHOUT flipping `isApproved` to false — otherwise a momentary backend hiccup
   * would force-sign-out a legitimately approved admin and bounce them to
   * /pending-approval or the public site. The RPC is retried a few times with
   * backoff to ride out brief outages.
   */
  private async loadUserRole(isRecovery = false): Promise<{ definitive: boolean }> {
    this._roleLoading.set(true);

    try {
      const result = await this.fetchPermissionsWithRetry();

      if (!result.ok) {
        console.warn('Could not load permissions (transient); keeping current session:', result.error);
        // Couldn't determine permissions. Don't downgrade approval destructively.
        // Ensure the UI has a safe default role only if we have nothing yet.
        if (this._userRole() === null) {
          this.setRole(UserRole.CASHIER);
        }
        // Keep trying in the background so the admin auto-recovers full access
        // once the backend settles, without needing a manual reload.
        if (!isRecovery) {
          this.scheduleRoleRecovery();
        }
        return { definitive: false };
      }

      this.roleRecoveryAttempts = 0;
      const data = result.data;
      const role = (data.role as UserRole) || UserRole.CASHIER;
      const permissions = data.permissions as Record<Permission, boolean>;
      this._userRole.set(role);
      this._permissions.set(permissions);
      this._isApproved.set(!!data.isApproved);
      return { definitive: true };
    } finally {
      this._roleLoading.set(false);
      this._roleInitialized.set(true);
    }
  }

  /**
   * Schedules a bounded background retry of the permission load after a transient
   * failure. Uses linear backoff and stops once a definitive answer is obtained,
   * the session ends, or the attempt cap is reached.
   */
  private scheduleRoleRecovery(): void {
    if (!this.isBrowser()) return;
    if (this.roleRecoveryTimer) return; // a recovery is already pending
    if (this.roleRecoveryAttempts >= this.MAX_ROLE_RECOVERY_ATTEMPTS) return;

    this.roleRecoveryAttempts++;
    const backoff = Math.min(2000 * this.roleRecoveryAttempts, 10000);

    this.roleRecoveryTimer = setTimeout(async () => {
      this.roleRecoveryTimer = null;
      if (!this._session()) return; // signed out in the meantime

      const result = await this.loadUserRole(true);
      if (result.definitive) {
        if (!this._isApproved()) {
          await this.signOutAndRedirectToPending();
        }
      } else {
        this.scheduleRoleRecovery();
      }
    }, backoff);
  }

  private cancelRoleRecovery(): void {
    if (this.roleRecoveryTimer) {
      clearTimeout(this.roleRecoveryTimer);
      this.roleRecoveryTimer = null;
    }
    this.roleRecoveryAttempts = 0;
  }

  /**
   * Calls get_my_permissions, retrying on transient errors with linear backoff.
   */
  private async fetchPermissionsWithRetry(
    maxAttempts = 3
  ): Promise<{ ok: true; data: any } | { ok: false; error?: string }> {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { data, error } = await this.supabaseService.client.rpc('get_my_permissions');
        if (!error && data) {
          return { ok: true, data };
        }
        lastError = error?.message;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }

      if (attempt < maxAttempts) {
        await this.delay(300 * attempt);
      }
    }

    return { ok: false, error: lastError };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private setRole(role: UserRole): void {
    this._userRole.set(role);
    this._permissions.set(getPermissionsForRole(role));
  }

  private clearRole(): void {
    this.cancelRoleRecovery();
    this._userRole.set(null);
    this._permissions.set(null);
    this._isApproved.set(false);
    this._roleInitialized.set(false);
  }

  // ============ Realtime Approval Monitoring ============

  private subscribeToApprovalChanges(userId: string): void {
    this.unsubscribeApprovalChannel();

    this.approvalChannel = this.supabaseService.client
      .channel('user-approval')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${userId}`
        },
        (payload: { new: { is_approved: boolean } }) => {
          const wasApproved = this._isApproved();
          const nowApproved = payload.new.is_approved;

          if (wasApproved && !nowApproved) {
            // Approval was revoked — sign out and redirect
            console.warn('Approval revoked, signing out...');
            this.signOutAndRedirectToPending();
          } else if (!wasApproved && nowApproved) {
            // User was just approved while on pending page
            this._isApproved.set(true);
          }
        }
      )
      .subscribe();
  }

  private unsubscribeApprovalChannel(): void {
    if (this.approvalChannel) {
      this.supabaseService.removeChannel(this.approvalChannel);
      this.approvalChannel = null;
    }
  }

  /**
   * Sign out silently and redirect to pending-approval page.
   * Used when an unapproved user is detected or approval is revoked.
   */
  async signOutAndRedirectToPending(): Promise<void> {
    this.unsubscribeApprovalChannel();
    try {
      await this.supabaseService.auth.signOut();
    } catch {
      // Ignore errors — we're force-clearing anyway
    }
    this._session.set(null);
    this._user.set(null);
    this.clearRole();
    this.clearSessionFromStorage();
    this._loading.set(false);
    this.router.navigate(['/pending-approval']);
  }

  /**
   * Check if current user has a specific permission
   */
  hasPermission(permission: Permission): boolean {
    const permissions = this._permissions();
    return permissions ? permissions[permission] : false;
  }

  /**
   * Check if current user can access a specific route
   */
  canAccessRoute(route: string): boolean {
    const permissions = this._permissions();
    if (!permissions) return false;

    const routePermissions: Record<string, Permission> = {
      '/admin/dashboard': 'canAccessDashboard',
      '/admin/inventory': 'canAccessInventory',
      '/admin/brands': 'canAccessBrands',
      '/admin/purchase-orders': 'canAccessPurchaseOrders',
      '/admin/suppliers': 'canAccessSuppliers',
      '/admin/sales': 'canAccessSales',
      '/admin/refunds': 'canProcessRefunds',
      '/admin/messages': 'canAccessMessages',
      '/admin/storage': 'canAccessStorage',
      '/admin/receipt-sequences': 'canAccessReceiptSequences',
      '/admin/users': 'canManageUsers',
      '/admin/settings': 'canAccessSystemSettings',
      '/admin/receipts': 'canAccessSales',
      '/admin/sales/customer-lookup': 'canAccessSales',
      '/admin/sales/new': 'canAccessSales'
    };

    for (const [path, permission] of Object.entries(routePermissions)) {
      if (route.startsWith(path)) {
        return permissions[permission];
      }
    }

    return true;
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

      // Save session to localStorage for persistence
      if (data.session) {
        this.saveSessionToStorage(data.session);
      }

      const roleResult = await this.loadUserRole();

      if (roleResult.definitive && !this._isApproved()) {
        // User is definitively not approved — sign out silently, return indicator.
        // A transient permission-check failure must not block a valid login.
        await this.signOutAndRedirectToPending();
        return { success: true };
      }

      this.subscribeToApprovalChanges(data.user.id);

      // Log successful login to audit log
      this.auditLogService.logAuthEvent({
        eventType: 'user_logged_in',
        userAgent: navigator.userAgent
      });

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

    // Log logout before actually signing out (while we still have the session)
    this.auditLogService.logAuthEvent({
      eventType: 'user_logged_out',
      userAgent: navigator.userAgent
    });

    try {
      const { error } = await this.supabaseService.auth.signOut();

      if (error) {
        this._error.set(error.message);
        this._loading.set(false);
        return { success: false, error: error.message };
      }

      this._session.set(null);
      this._user.set(null);
      this.clearRole();
      this.clearSessionFromStorage(); // Clear localStorage on logout
      this._loading.set(false);
      return { success: true };
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during sign out';
      this._error.set(errorMessage);
      this._loading.set(false);
      // Still clear local storage even on error
      this.clearSessionFromStorage();
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

      // Save refreshed session to localStorage
      if (session) {
        this.saveSessionToStorage(session);
      }
    } catch (err) {
      this._error.set('Failed to refresh session');
    }
  }

  async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    this._error.set(null);

    try {
      const redirectTo = `${window.location.origin}/admin/sales`;
      const { error } = await this.supabaseService.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo }
      });

      if (error) {
        this._error.set(error.message);
        return { success: false, error: error.message };
      }

      // OAuth redirects away from the app; onAuthStateChange handles the rest on return
      return { success: true };
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during Google sign in';
      this._error.set(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  clearError(): void {
    this._error.set(null);
  }
}
