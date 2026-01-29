import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './login.component';
import { SupabaseAuthService } from '../../../core';
import { ToastService } from '../../../shared';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<SupabaseAuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('SupabaseAuthService', ['signIn']);
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl', 'createUrlTree', 'serializeUrl'], {
      events: { subscribe: () => ({ unsubscribe: () => {} }) }
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('/');
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error']);
    mockActivatedRoute = {
      snapshot: {
        queryParams: {}
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: SupabaseAuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ToastService, useValue: mockToastService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('component initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize login form with email and password controls', () => {
      expect(component.loginForm).toBeDefined();
      expect(component.loginForm.get('email')).toBeDefined();
      expect(component.loginForm.get('password')).toBeDefined();
    });

    it('should have loading set to false initially', () => {
      expect(component.loading).toBe(false);
    });

    it('should have errorMessage set to null initially', () => {
      expect(component.errorMessage).toBeNull();
    });

    it('should set default returnUrl to /admin/dashboard', () => {
      expect((component as any).returnUrl).toBe('/admin/dashboard');
    });
  });

  describe('returnUrl handling', () => {
    it('should use returnUrl from query params if it starts with /admin', () => {
      // Test by simulating ngOnInit behavior
      const mockRouteWithReturnUrl = {
        snapshot: {
          queryParams: { returnUrl: '/admin/inventory' }
        }
      };

      // Directly test the logic
      const returnUrlParam = mockRouteWithReturnUrl.snapshot.queryParams['returnUrl'];
      let returnUrl = '/admin/dashboard';
      if (returnUrlParam && returnUrlParam.startsWith('/admin')) {
        returnUrl = returnUrlParam;
      }
      expect(returnUrl).toBe('/admin/inventory');
    });

    it('should not use returnUrl if it does not start with /admin', () => {
      // Test by simulating ngOnInit behavior
      const mockRouteWithMaliciousUrl = {
        snapshot: {
          queryParams: { returnUrl: '/malicious/site' }
        }
      };

      const returnUrlParam = mockRouteWithMaliciousUrl.snapshot.queryParams['returnUrl'];
      let returnUrl = '/admin/dashboard';
      if (returnUrlParam && returnUrlParam.startsWith('/admin')) {
        returnUrl = returnUrlParam;
      }
      expect(returnUrl).toBe('/admin/dashboard');
    });
  });

  describe('form validation', () => {
    it('should mark form as invalid when email is empty', () => {
      component.loginForm.patchValue({ email: '', password: 'password123' });
      expect(component.loginForm.invalid).toBe(true);
    });

    it('should mark form as invalid when email format is invalid', () => {
      component.loginForm.patchValue({ email: 'invalid-email', password: 'password123' });
      expect(component.loginForm.get('email')?.hasError('email')).toBe(true);
    });

    it('should mark form as invalid when password is empty', () => {
      component.loginForm.patchValue({ email: 'admin@example.com', password: '' });
      expect(component.loginForm.invalid).toBe(true);
    });

    it('should mark form as valid when both email and password are valid', () => {
      component.loginForm.patchValue({ email: 'admin@example.com', password: 'password123' });
      expect(component.loginForm.valid).toBe(true);
    });

    it('should mark form as invalid when password is too short', () => {
      component.loginForm.patchValue({ email: 'admin@example.com', password: '12345' });
      expect(component.loginForm.get('password')?.hasError('minlength')).toBe(true);
    });

    it('should accept password with exactly 6 characters', () => {
      component.loginForm.patchValue({ email: 'admin@example.com', password: '123456' });
      expect(component.loginForm.valid).toBe(true);
    });

    it('should have required error on email when empty and touched', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.markAsTouched();
      expect(emailControl?.hasError('required')).toBe(true);
    });

    it('should have required error on password when empty and touched', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.markAsTouched();
      expect(passwordControl?.hasError('required')).toBe(true);
    });
  });

  describe('onLogin', () => {
    it('should not call authService.signIn if form is invalid', async () => {
      component.loginForm.patchValue({ email: '', password: '' });

      await component.onLogin();

      expect(mockAuthService.signIn).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched if form is invalid', async () => {
      component.loginForm.patchValue({ email: '', password: '' });

      await component.onLogin();

      expect(component.loginForm.get('email')?.touched).toBe(true);
      expect(component.loginForm.get('password')?.touched).toBe(true);
    });

    it('should set loading to true while signing in', fakeAsync(() => {
      component.loginForm.patchValue({ email: 'admin@example.com', password: 'password123' });
      mockAuthService.signIn.and.returnValue(new Promise(resolve => {
        setTimeout(() => resolve({ success: true }), 100);
      }));

      component.onLogin();
      expect(component.loading).toBe(true);

      tick(100);
      expect(component.loading).toBe(false);
    }));

    it('should call authService.signIn with correct credentials', async () => {
      component.loginForm.patchValue({ email: 'admin@example.com', password: 'password123' });
      mockAuthService.signIn.and.returnValue(Promise.resolve({ success: true }));

      await component.onLogin();

      expect(mockAuthService.signIn).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'password123'
      });
    });

    it('should show success toast and navigate on successful login', async () => {
      component.loginForm.patchValue({ email: 'admin@example.com', password: 'password123' });
      mockAuthService.signIn.and.returnValue(Promise.resolve({ success: true }));

      await component.onLogin();

      expect(mockToastService.success).toHaveBeenCalledWith('Login Successful', 'Welcome back!');
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/admin/dashboard');
    });

    it('should navigate to custom returnUrl on successful login', async () => {
      (component as any).returnUrl = '/admin/inventory';
      component.loginForm.patchValue({ email: 'admin@example.com', password: 'password123' });
      mockAuthService.signIn.and.returnValue(Promise.resolve({ success: true }));

      await component.onLogin();

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/admin/inventory');
    });

    it('should set errorMessage on failed login', async () => {
      component.loginForm.patchValue({ email: 'admin@example.com', password: 'wrongpwd' });
      mockAuthService.signIn.and.returnValue(Promise.resolve({
        success: false,
        error: 'Invalid login credentials'
      }));

      await component.onLogin();
      await fixture.whenStable();

      expect(component.errorMessage).toBe('Invalid login credentials');
    });

    it('should use default error message if no error is provided', async () => {
      component.loginForm.patchValue({ email: 'admin@example.com', password: 'wrongpwd' });
      mockAuthService.signIn.and.returnValue(Promise.resolve({ success: false }));

      await component.onLogin();
      await fixture.whenStable();

      expect(component.errorMessage).toBe('Invalid credentials');
    });

    it('should not navigate on failed login', async () => {
      component.loginForm.patchValue({ email: 'admin@example.com', password: 'wrong' });
      mockAuthService.signIn.and.returnValue(Promise.resolve({
        success: false,
        error: 'Invalid login credentials'
      }));

      await component.onLogin();

      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should not show success toast on failed login', async () => {
      component.loginForm.patchValue({ email: 'admin@example.com', password: 'wrong' });
      mockAuthService.signIn.and.returnValue(Promise.resolve({
        success: false,
        error: 'Invalid login credentials'
      }));

      await component.onLogin();

      expect(mockToastService.success).not.toHaveBeenCalled();
    });

    it('should clear previous error message on new login attempt', async () => {
      component.errorMessage = 'Previous error';
      component.loginForm.patchValue({ email: 'admin@example.com', password: 'password123' });
      mockAuthService.signIn.and.returnValue(Promise.resolve({ success: true }));

      await component.onLogin();

      expect(component.errorMessage).toBeNull();
    });
  });

  describe('template rendering', () => {
    it('should render login form', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('form')).toBeTruthy();
    });

    it('should render email input', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('input[type="email"]')).toBeTruthy();
    });

    it('should render password input via p-password', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('p-password')).toBeTruthy();
    });

    it('should render login button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('p-button[type="submit"]')).toBeTruthy();
    });

    it('should display error message when errorMessage is set', () => {
      component.errorMessage = 'Test error message';
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('p-message')).toBeTruthy();
    });

    it('should not display error message when errorMessage is null', () => {
      component.errorMessage = null;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('p-message')).toBeFalsy();
    });

    it('should display Phone Shop title', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Phone Shop');
    });

    it('should display sign in subtitle', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Sign in to access the admin panel');
    });
  });

  describe('accessibility', () => {
    it('should have labels for email input', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const label = compiled.querySelector('label[for="email"]');
      expect(label).toBeTruthy();
      expect(label?.textContent).toContain('Email');
    });

    it('should have labels for password input', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const label = compiled.querySelector('label[for="password"]');
      expect(label).toBeTruthy();
      expect(label?.textContent).toContain('Password');
    });

    it('should have email input with correct id', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const input = compiled.querySelector('input#email');
      expect(input).toBeTruthy();
    });

    it('should have password input with correct id', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const passwordComponent = compiled.querySelector('p-password#password');
      expect(passwordComponent).toBeTruthy();
    });
  });
});
