import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SupabaseAuthService, LoginCredentials } from './supabase-auth.service';
import { SupabaseService } from './supabase.service';

describe('SupabaseAuthService', () => {
  let service: SupabaseAuthService;
  let mockSupabaseService: jasmine.SpyObj<SupabaseService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let authStateCallback: ((event: string, session: any) => void) | null = null;

  const mockUser = {
    id: 'test-user-id',
    email: 'admin@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    created_at: new Date().toISOString()
  };

  const mockSession = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_at: Date.now() + 3600000,
    user: mockUser
  };

  beforeEach(() => {
    authStateCallback = null;

    const supabaseServiceSpy = jasmine.createSpyObj('SupabaseService', [], {
      auth: {
        onAuthStateChange: jasmine.createSpy('onAuthStateChange').and.callFake((callback: any) => {
          authStateCallback = callback;
          return {
            data: {
              subscription: {
                unsubscribe: jasmine.createSpy('unsubscribe')
              }
            }
          };
        }),
        getSession: jasmine.createSpy('getSession').and.returnValue(
          Promise.resolve({ data: { session: null }, error: null })
        ),
        signInWithPassword: jasmine.createSpy('signInWithPassword'),
        signOut: jasmine.createSpy('signOut'),
        refreshSession: jasmine.createSpy('refreshSession')
      }
    });

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        SupabaseAuthService,
        { provide: SupabaseService, useValue: supabaseServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    mockSupabaseService = TestBed.inject(SupabaseService) as jasmine.SpyObj<SupabaseService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    service = TestBed.inject(SupabaseAuthService);
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize auth listener on construction', () => {
      expect(mockSupabaseService.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should check initial session on construction', fakeAsync(() => {
      tick();
      expect(mockSupabaseService.auth.getSession).toHaveBeenCalled();
    }));

    it('should set loading to false after initialization', async () => {
      // Wait for the async checkInitialSession to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(service.loading()).toBe(false);
    });
  });

  describe('auth state signals', () => {
    it('should expose readonly user signal', () => {
      expect(service.user).toBeDefined();
      expect(service.user()).toBeNull();
    });

    it('should expose readonly session signal', () => {
      expect(service.session).toBeDefined();
      expect(service.session()).toBeNull();
    });

    it('should expose readonly loading signal', () => {
      expect(service.loading).toBeDefined();
    });

    it('should expose readonly error signal', () => {
      expect(service.error).toBeDefined();
      expect(service.error()).toBeNull();
    });

    it('should compute isAuthenticated from session', fakeAsync(() => {
      tick();
      expect(service.isAuthenticated()).toBe(false);

      if (authStateCallback) {
        authStateCallback('SIGNED_IN', mockSession);
      }
      expect(service.isAuthenticated()).toBe(true);
    }));

    it('should compute userEmail from user', fakeAsync(() => {
      tick();
      expect(service.userEmail()).toBeNull();

      if (authStateCallback) {
        authStateCallback('SIGNED_IN', mockSession);
      }
      expect(service.userEmail()).toBe('admin@example.com');
    }));
  });

  describe('auth state changes', () => {
    it('should update state when auth state changes to SIGNED_IN', fakeAsync(() => {
      tick();

      if (authStateCallback) {
        authStateCallback('SIGNED_IN', mockSession);
      }

      expect(service.session()).toEqual(mockSession as any);
      expect(service.user()).toEqual(mockUser as any);
      expect(service.isAuthenticated()).toBe(true);
    }));

    it('should navigate to home on SIGNED_OUT', fakeAsync(() => {
      tick();

      if (authStateCallback) {
        authStateCallback('SIGNED_OUT', null);
      }

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    }));

    it('should clear user and session on SIGNED_OUT', fakeAsync(() => {
      tick();

      if (authStateCallback) {
        authStateCallback('SIGNED_IN', mockSession);
        authStateCallback('SIGNED_OUT', null);
      }

      expect(service.session()).toBeNull();
      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    }));
  });

  describe('signIn', () => {
    const credentials: LoginCredentials = {
      email: 'admin@example.com',
      password: 'password123'
    };

    it('should return success on valid credentials', async () => {
      (mockSupabaseService.auth.signInWithPassword as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: { session: mockSession, user: mockUser }, error: null })
      );

      const result = await service.signIn(credentials);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should call signInWithPassword with correct credentials', async () => {
      (mockSupabaseService.auth.signInWithPassword as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: { session: mockSession, user: mockUser }, error: null })
      );

      await service.signIn(credentials);

      expect(mockSupabaseService.auth.signInWithPassword).toHaveBeenCalledWith({
        email: credentials.email,
        password: credentials.password
      });
    });

    it('should update session and user on successful sign in', async () => {
      (mockSupabaseService.auth.signInWithPassword as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: { session: mockSession, user: mockUser }, error: null })
      );

      await service.signIn(credentials);

      expect(service.session()).toEqual(mockSession as any);
      expect(service.user()).toEqual(mockUser as any);
    });

    it('should return error on invalid credentials', async () => {
      const errorMessage = 'Invalid login credentials';
      (mockSupabaseService.auth.signInWithPassword as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: { session: null, user: null }, error: { message: errorMessage } })
      );

      const result = await service.signIn(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });

    it('should set error signal on failed sign in', async () => {
      const errorMessage = 'Invalid login credentials';
      (mockSupabaseService.auth.signInWithPassword as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: { session: null, user: null }, error: { message: errorMessage } })
      );

      await service.signIn(credentials);

      expect(service.error()).toBe(errorMessage);
    });

    it('should handle unexpected errors during sign in', async () => {
      (mockSupabaseService.auth.signInWithPassword as jasmine.Spy).and.returnValue(
        Promise.reject(new Error('Network error'))
      );

      const result = await service.signIn(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred during sign in');
    });

    it('should set loading to true while signing in', async () => {
      let loadingDuringSignIn = false;
      (mockSupabaseService.auth.signInWithPassword as jasmine.Spy).and.callFake(() => {
        loadingDuringSignIn = service.loading();
        return Promise.resolve({ data: { session: mockSession, user: mockUser }, error: null });
      });

      await service.signIn(credentials);

      expect(loadingDuringSignIn).toBe(true);
    });

    it('should set loading to false after sign in completes', async () => {
      (mockSupabaseService.auth.signInWithPassword as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: { session: mockSession, user: mockUser }, error: null })
      );

      await service.signIn(credentials);

      expect(service.loading()).toBe(false);
    });
  });

  describe('signOut', () => {
    it('should return success on successful sign out', async () => {
      (mockSupabaseService.auth.signOut as jasmine.Spy).and.returnValue(
        Promise.resolve({ error: null })
      );

      const result = await service.signOut();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should clear session and user on successful sign out', async () => {
      (mockSupabaseService.auth.signOut as jasmine.Spy).and.returnValue(
        Promise.resolve({ error: null })
      );

      await service.signOut();

      expect(service.session()).toBeNull();
      expect(service.user()).toBeNull();
    });

    it('should return error on failed sign out', async () => {
      const errorMessage = 'Sign out failed';
      (mockSupabaseService.auth.signOut as jasmine.Spy).and.returnValue(
        Promise.resolve({ error: { message: errorMessage } })
      );

      const result = await service.signOut();

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });

    it('should handle unexpected errors during sign out', async () => {
      (mockSupabaseService.auth.signOut as jasmine.Spy).and.returnValue(
        Promise.reject(new Error('Network error'))
      );

      const result = await service.signOut();

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred during sign out');
    });

    it('should set loading during sign out', async () => {
      let loadingDuringSignOut = false;
      (mockSupabaseService.auth.signOut as jasmine.Spy).and.callFake(() => {
        loadingDuringSignOut = service.loading();
        return Promise.resolve({ error: null });
      });

      await service.signOut();

      expect(loadingDuringSignOut).toBe(true);
      expect(service.loading()).toBe(false);
    });
  });

  describe('refreshSession', () => {
    it('should update session on successful refresh', async () => {
      const newSession = { ...mockSession, access_token: 'new-access-token' };
      (mockSupabaseService.auth.refreshSession as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: { session: newSession }, error: null })
      );

      await service.refreshSession();

      expect(service.session()).toEqual(newSession as any);
    });

    it('should set error on failed refresh', async () => {
      const errorMessage = 'Refresh failed';
      (mockSupabaseService.auth.refreshSession as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: { session: null }, error: { message: errorMessage } })
      );

      await service.refreshSession();

      expect(service.error()).toBe(errorMessage);
    });

    it('should handle unexpected errors during refresh', async () => {
      (mockSupabaseService.auth.refreshSession as jasmine.Spy).and.returnValue(
        Promise.reject(new Error('Network error'))
      );

      await service.refreshSession();

      expect(service.error()).toBe('Failed to refresh session');
    });
  });

  describe('clearError', () => {
    it('should clear the error signal', async () => {
      const errorMessage = 'Test error';
      (mockSupabaseService.auth.signInWithPassword as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: { session: null, user: null }, error: { message: errorMessage } })
      );

      await service.signIn({ email: 'test@test.com', password: 'test' });
      expect(service.error()).toBe(errorMessage);

      service.clearError();
      expect(service.error()).toBeNull();
    });
  });

  describe('session persistence', () => {
    it('should restore session from getSession on initialization', fakeAsync(() => {
      TestBed.resetTestingModule();

      const persistedSession = { ...mockSession };
      const supabaseServiceWithSession = jasmine.createSpyObj('SupabaseService', [], {
        auth: {
          onAuthStateChange: jasmine.createSpy('onAuthStateChange').and.returnValue({
            data: { subscription: { unsubscribe: jasmine.createSpy() } }
          }),
          getSession: jasmine.createSpy('getSession').and.returnValue(
            Promise.resolve({ data: { session: persistedSession }, error: null })
          ),
          signInWithPassword: jasmine.createSpy('signInWithPassword'),
          signOut: jasmine.createSpy('signOut'),
          refreshSession: jasmine.createSpy('refreshSession')
        }
      });

      TestBed.configureTestingModule({
        providers: [
          SupabaseAuthService,
          { provide: SupabaseService, useValue: supabaseServiceWithSession },
          { provide: Router, useValue: mockRouter }
        ]
      });

      const newService = TestBed.inject(SupabaseAuthService);
      tick();

      expect(newService.session()).toEqual(persistedSession as any);
      expect(newService.isAuthenticated()).toBe(true);
    }));
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from auth state changes on destroy', () => {
      const subscription = (mockSupabaseService.auth.onAuthStateChange as jasmine.Spy).calls.mostRecent().returnValue.data.subscription;

      service.ngOnDestroy();

      expect(subscription.unsubscribe).toHaveBeenCalled();
    });
  });
});
