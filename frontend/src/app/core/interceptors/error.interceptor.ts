import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorHandlingService } from '../services/error-handling.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandlingService = inject(ErrorHandlingService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        errorHandlingService.handleNetworkError();
      } else if (error.status === 401) {
        errorHandlingService.handleSupabaseError({
          message: 'Unauthorized',
          status: 401
        });
      } else if (error.status === 403) {
        errorHandlingService.handleSupabaseError({
          message: 'Forbidden',
          status: 403
        });
      } else if (error.status >= 500) {
        errorHandlingService.handleSupabaseError({
          message: error.message || 'Server error',
          status: error.status
        });
      } else if (error.status >= 400) {
        errorHandlingService.handleSupabaseError({
          message: error.error?.message || error.message || 'Request failed',
          status: error.status,
          code: error.error?.code,
          details: error.error?.details
        });
      }

      return throwError(() => error);
    })
  );
};
