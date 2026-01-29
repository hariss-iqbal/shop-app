import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SupabaseAuthService } from '../../../core';
import { ToastService } from '../../../shared';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(SupabaseAuthService);
  private toastService = inject(ToastService);

  loginForm: FormGroup;
  loading = false;
  errorMessage: string | null = null;
  private returnUrl: string = '/admin/dashboard';

  constructor() {
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
      this.toastService.success('Login Successful', 'Welcome back!');
      this.router.navigateByUrl(this.returnUrl);
    } else {
      this.errorMessage = result.error || 'Invalid credentials';
    }
  }
}
