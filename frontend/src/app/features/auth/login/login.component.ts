import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SupabaseAuthService } from '../../../core';
import { ToastService } from '../../../shared';
import { ShopDetailsService } from '../../../core/services/shop-details.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    IconFieldModule,
    InputIconModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  loading = false;
  googleLoading = false;
  errorMessage: string | null = null;
  private returnUrl: string | null = null;

  shopName = this.shopDetailsService.shopName;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: SupabaseAuthService,
    private toastService: ToastService,
    private shopDetailsService: ShopDetailsService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    const returnUrlParam = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrlParam && returnUrlParam.startsWith('/admin')) {
      this.returnUrl = returnUrlParam;
    }
  }

  async onLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    const { email, password } = this.loginForm.value;
    const result = await this.authService.signIn({ email, password });

    this.loading = false;

    if (result.success) {
      // If user is not approved, signIn() already signed out and redirected to /pending-approval
      if (!this.authService.isAuthenticated()) {
        return;
      }
      this.toastService.success('Login Successful', 'Welcome back!');
      const targetUrl = this.getTargetUrl();
      this.router.navigateByUrl(targetUrl);
    } else {
      this.errorMessage = result.error || 'Invalid credentials';
    }
  }

  async onGoogleLogin(): Promise<void> {
    this.googleLoading = true;
    this.errorMessage = null;

    const result = await this.authService.signInWithGoogle();

    if (!result.success) {
      this.googleLoading = false;
      this.errorMessage = result.error || 'Google sign in failed';
    }
    // On success, the browser redirects to Google — no need to reset loading
  }

  /**
   * Get the appropriate target URL based on user role and return URL
   * Feature: F-013 Role-Based Access Control
   */
  private getTargetUrl(): string {
    // If there's a return URL and user can access it, use that
    if (this.returnUrl && this.authService.canAccessRoute(this.returnUrl)) {
      return this.returnUrl;
    }

    // Otherwise, redirect to the most appropriate page for their role
    // Cashiers can only access sales, so redirect them there
    if (this.authService.canAccessDashboard()) {
      return '/admin/dashboard';
    }

    if (this.authService.canAccessSales()) {
      return '/admin/sales';
    }

    // Fallback - this shouldn't happen if permissions are configured correctly
    return '/admin';
  }
}
