import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { ErrorHandlingService } from './error-handling.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private errorHandlingService = inject(ErrorHandlingService);
  private zone = inject(NgZone);

  handleError(error: unknown): void {
    const unwrapped = this.unwrapError(error);

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
