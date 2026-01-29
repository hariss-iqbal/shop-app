import { Injectable, inject, isDevMode } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';
import { SupabaseAuthService } from './supabase-auth.service';
import { NetworkStatusService } from './network-status.service';

export interface SupabaseErrorResponse {
  message: string;
  code?: string;
  status?: number;
  details?: string;
  hint?: string;
}

export interface ErrorLogEntry {
  timestamp: Date;
  type: 'supabase' | 'network' | 'unexpected' | 'critical';
  message: string;
  status?: number;
  code?: string;
  stack?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {
  private toastService = inject(ToastService);
  private router = inject(Router);
  private authService = inject(SupabaseAuthService);
  private networkStatusService = inject(NetworkStatusService);

  handleSupabaseError(error: SupabaseErrorResponse): void {
    const status = error.status ?? this.inferStatusFromCode(error.code);

    this.logError({
      timestamp: new Date(),
      type: 'supabase',
      message: error.message,
      status,
      code: error.code
    });

    switch (status) {
      case 401:
        this.handleUnauthorized();
        break;
      case 403:
        this.toastService.error('Permission denied', 'You do not have access to this resource.');
        break;
      case 404:
        this.toastService.error('Not found', 'The requested resource was not found.');
        break;
      case 409:
        this.toastService.error('Conflict', 'The operation could not be completed due to a conflict.');
        break;
      case 422:
        this.toastService.error('Validation error', 'Please check your input and try again.');
        break;
      case 429:
        this.toastService.warn('Too many requests', 'Please wait a moment and try again.');
        break;
      default:
        if (status !== undefined && status >= 500) {
          this.toastService.error('Something went wrong', 'An unexpected error occurred. Please try again later.');
        } else if (status !== undefined && status >= 400) {
          this.toastService.error('Request failed', 'The operation could not be completed.');
        } else {
          this.toastService.error('Something went wrong', 'An unexpected error occurred. Please try again later.');
        }
        break;
    }
  }

  handleNetworkError(): void {
    this.logError({
      timestamp: new Date(),
      type: 'network',
      message: 'Network connection failed'
    });
    this.toastService.error('Network error', 'Please check your connection and try again.');
    this.networkStatusService.reportNetworkFailure();
  }

  handleUnexpectedError(error: unknown): void {
    this.logError({
      timestamp: new Date(),
      type: 'unexpected',
      message: this.extractErrorMessage(error),
      stack: this.extractStack(error)
    });
    this.toastService.error('Something went wrong', 'An unexpected error occurred. Please try again later.');
  }

  handleCriticalError(error: unknown): void {
    this.logError({
      timestamp: new Date(),
      type: 'critical',
      message: this.extractErrorMessage(error),
      stack: this.extractStack(error)
    });
    this.router.navigate(['/error']);
  }

  private async handleUnauthorized(): Promise<void> {
    this.toastService.warn('Session expired', 'Please sign in again.');
    await this.authService.signOut();
    this.router.navigate(['/auth/login']);
  }

  private logError(entry: ErrorLogEntry): void {
    // Log to console in development and production
    // In production, this could be extended to send to a monitoring service
    if (isDevMode()) {
      console.error(`[${entry.type.toUpperCase()} Error]`, {
        timestamp: entry.timestamp.toISOString(),
        message: entry.message,
        ...(entry.status !== undefined && { status: entry.status }),
        ...(entry.code && { code: entry.code }),
        ...(entry.stack && { stack: entry.stack })
      });
    } else {
      // Production logging - only essential info to console
      // Future: integrate with external monitoring service (e.g., Sentry, LogRocket)
      console.error(`[Error] ${entry.type}: ${entry.message}`);
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String((error as Record<string, unknown>)['message']);
    }
    return 'Unknown error';
  }

  private extractStack(error: unknown): string | undefined {
    if (error instanceof Error) {
      return error.stack;
    }
    return undefined;
  }

  private inferStatusFromCode(code?: string): number | undefined {
    if (!code) return undefined;

    const codeStatusMap: Record<string, number> = {
      'PGRST301': 401,
      'PGRST302': 403,
      'PGRST116': 404,
      '23505': 409,
      '23503': 409,
      '42501': 403,
      '42P01': 404,
      'insufficient_scope': 403,
      'not_authenticated': 401,
      'user_not_found': 404,
      'invalid_credentials': 401
    };

    return codeStatusMap[code];
  }

  isNetworkError(error: unknown): boolean {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      return false;
    }
    if (typeof error === 'object' && error !== null) {
      const msg = (error as Record<string, unknown>)['message'];
      if (typeof msg === 'string' && (
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('Network request failed') ||
        msg.includes('net::ERR_')
      )) {
        return true;
      }
    }
    return false;
  }

  isSupabaseError(error: unknown): error is SupabaseErrorResponse {
    if (typeof error !== 'object' || error === null) return false;
    return 'message' in error && (
      'code' in error || 'status' in error || 'details' in error
    );
  }
}
