import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { ErrorHandlingService } from './error-handling.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(
    private errorHandlingService: ErrorHandlingService,
    private zone: NgZone
  ) { }

  handleError(error: unknown): void {
    const unwrapped = this.unwrapError(error);

    // Silently ignore AbortErrors — these are benign signals from Supabase's
    // Web Locks API during navigation/route changes and should not trigger
    // error toasts or change detection cascades.
    if (this.isAbortError(unwrapped)) {
      return;
    }

    console.error('[GlobalErrorHandler]', unwrapped);

    this.zone.run(() => {
      if (this.errorHandlingService.isNetworkError(unwrapped)) {
        this.errorHandlingService.handleNetworkError();
      } else if (this.errorHandlingService.isSupabaseError(unwrapped)) {
        this.errorHandlingService.handleSupabaseError(unwrapped);
      } else {
        this.errorHandlingService.handleUnexpectedError(unwrapped);
      }
    });
  }

  private isAbortError(error: unknown): boolean {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return true;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      return true;
    }
    if (typeof error === 'object' && error !== null) {
      const e = error as Record<string, unknown>;
      if (e['name'] === 'AbortError' || (e['code'] === 20 && typeof e['message'] === 'string' && (e['message'] as string).includes('aborted'))) {
        return true;
      }
    }
    return false;
  }

  private unwrapError(error: unknown): unknown {
    if (error && typeof error === 'object' && 'rejection' in error) {
      return (error as Record<string, unknown>)['rejection'];
    }
    if (error && typeof error === 'object' && 'error' in error) {
      return (error as Record<string, unknown>)['error'];
    }
    return error;
  }
}
