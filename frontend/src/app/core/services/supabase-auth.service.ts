import { Inject, Injectable, OnDestroy, PLATFORM_ID, computed, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
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

  private readonly _user = signal<User | null>(null);
  private readonly _session = signal<Session | null>(null);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);
  private readonly _userRole = signal<UserRole | null>(null);
  private readonly _permissions = signal<Record<Permission, boolean> | null>(null);
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

  // Activity tracking
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  private activityHandler: (() => void) | null = null;
  private isActivityTrackingSetup = false;

  readonly user = this._user.asReadonly();
  readonly session = this._session.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly userRole = this._userRole.asReadonly();
  readonly permissions = this._permissions.asReadonly();
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
    }
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.cleanupActivityTracking();
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
          await this.loadUserRole();
          this._loading.set(false);
        }

        if (event === 'SIGNED_OUT') {
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
        await this.loadUserRole();
        this.resetInactivityTimer();
      } else {
        // No session - user is not authenticated
        this.clearSessionFromStorage();
        this._roleInitialized.set(true);
      }

      this.finalizeInitialization(session);
    } catch (err) {
      // AbortErrors from Supabase's Web Locks API are benign — don't treat as auth failure
      if (err instanceof DOMException && err.name === 'AbortError') {
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

  private async loadUserRole(): Promise<void> {
    this._roleLoading.set(true);

    try {
      const { data, error } = await this.supabaseService.client.rpc('get_user_role');

      if (error) {
        console.warn('Failed to get user role, defaulting to cashier:', error.message);
        this.setRole(UserRole.CASHIER);
      } else {
        const role = (data as UserRole) || UserRole.CASHIER;
        this.setRole(role);
      }
    } catch (err) {
      console.error('Failed to load user role:', err);
      this.setRole(UserRole.CASHIER);
    } finally {
      this._roleLoading.set(false);
      this._roleInitialized.set(true);
    }
  }

  private setRole(role: UserRole): void {
    this._userRole.set(role);
    this._permissions.set(getPermissionsForRole(role));
  }

  private clearRole(): void {
    this._userRole.set(null);
    this._permissions.set(null);
    this._roleInitialized.set(false);
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

      await this.loadUserRole();

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

  clearError(): void {
    this._error.set(null);
  }
}
