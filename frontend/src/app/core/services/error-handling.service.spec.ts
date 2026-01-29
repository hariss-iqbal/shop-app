import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ErrorHandlingService, SupabaseErrorResponse } from './error-handling.service';
import { ToastService } from '../../shared/services/toast.service';
import { SupabaseAuthService } from './supabase-auth.service';
import { NetworkStatusService } from './network-status.service';

describe('ErrorHandlingService', () => {
  let service: ErrorHandlingService;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthService: jasmine.SpyObj<SupabaseAuthService>;
  let mockNetworkStatusService: jasmine.SpyObj<NetworkStatusService>;

  beforeEach(() => {
    mockToastService = jasmine.createSpyObj('ToastService', ['error', 'warn', 'success', 'info']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockAuthService = jasmine.createSpyObj('SupabaseAuthService', ['signOut']);
    mockAuthService.signOut.and.returnValue(Promise.resolve({ success: true }));
    mockNetworkStatusService = jasmine.createSpyObj('NetworkStatusService', ['reportNetworkFailure', 'resetFailureCount', 'checkConnection']);

    TestBed.configureTestingModule({
      providers: [
        ErrorHandlingService,
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
        { provide: SupabaseAuthService, useValue: mockAuthService },
        { provide: NetworkStatusService, useValue: mockNetworkStatusService }
      ]
    });

    service = TestBed.inject(ErrorHandlingService);
    spyOn(console, 'error');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('handleSupabaseError', () => {
    it('should redirect to login on 401 error', fakeAsync(() => {
      const error: SupabaseErrorResponse = {
        message: 'Unauthorized',
        status: 401
      };

      service.handleSupabaseError(error);
      tick();

      expect(mockToastService.warn).toHaveBeenCalledWith('Session expired', 'Please sign in again.');
      expect(mockAuthService.signOut).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
    }));

    it('should show permission denied toast on 403 error', () => {
      const error: SupabaseErrorResponse = {
        message: 'Forbidden',
        status: 403
      };

      service.handleSupabaseError(error);

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Permission denied',
        'You do not have access to this resource.'
      );
    });

    it('should show not found toast on 404 error', () => {
      const error: SupabaseErrorResponse = {
        message: 'Not found',
        status: 404
      };

      service.handleSupabaseError(error);

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Not found',
        'The requested resource was not found.'
      );
    });

    it('should show conflict toast on 409 error', () => {
      const error: SupabaseErrorResponse = {
        message: 'Conflict',
        status: 409
      };

      service.handleSupabaseError(error);

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Conflict',
        'The operation could not be completed due to a conflict.'
      );
    });

    it('should show validation error toast on 422 error', () => {
      const error: SupabaseErrorResponse = {
        message: 'Validation error',
        status: 422
      };

      service.handleSupabaseError(error);

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Validation error',
        'Please check your input and try again.'
      );
    });

    it('should show rate limit warning toast on 429 error', () => {
      const error: SupabaseErrorResponse = {
        message: 'Too many requests',
        status: 429
      };

      service.handleSupabaseError(error);

      expect(mockToastService.warn).toHaveBeenCalledWith(
        'Too many requests',
        'Please wait a moment and try again.'
      );
    });

    it('should show generic error toast on 500 error', () => {
      const error: SupabaseErrorResponse = {
        message: 'Internal server error',
        status: 500
      };

      service.handleSupabaseError(error);

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Something went wrong',
        'An unexpected error occurred. Please try again later.'
      );
    });

    it('should show generic error toast on 503 error', () => {
      const error: SupabaseErrorResponse = {
        message: 'Service unavailable',
        status: 503
      };

      service.handleSupabaseError(error);

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Something went wrong',
        'An unexpected error occurred. Please try again later.'
      );
    });

    it('should show request failed toast for other 4xx errors', () => {
      const error: SupabaseErrorResponse = {
        message: 'Bad request',
        status: 400
      };

      service.handleSupabaseError(error);

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Request failed',
        'The operation could not be completed.'
      );
    });

    it('should show generic error toast when status is undefined', () => {
      const error: SupabaseErrorResponse = {
        message: 'Unknown error'
      };

      service.handleSupabaseError(error);

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Something went wrong',
        'An unexpected error occurred. Please try again later.'
      );
    });

    it('should infer 401 status from PGRST301 code', fakeAsync(() => {
      const error: SupabaseErrorResponse = {
        message: 'JWT expired',
        code: 'PGRST301'
      };

      service.handleSupabaseError(error);
      tick();

      expect(mockAuthService.signOut).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
    }));

    it('should infer 403 status from PGRST302 code', () => {
      const error: SupabaseErrorResponse = {
        message: 'No permission',
        code: 'PGRST302'
      };

      service.handleSupabaseError(error);

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Permission denied',
        'You do not have access to this resource.'
      );
    });

    it('should infer 404 status from PGRST116 code', () => {
      const error: SupabaseErrorResponse = {
        message: 'Row not found',
        code: 'PGRST116'
      };

      service.handleSupabaseError(error);

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Not found',
        'The requested resource was not found.'
      );
    });

    it('should infer 403 status from 42501 code (insufficient privilege)', () => {
      const error: SupabaseErrorResponse = {
        message: 'Insufficient privilege',
        code: '42501'
      };

      service.handleSupabaseError(error);

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Permission denied',
        'You do not have access to this resource.'
      );
    });

    it('should infer 409 status from 23505 code (unique violation)', () => {
      const error: SupabaseErrorResponse = {
        message: 'Duplicate key',
        code: '23505'
      };

      service.handleSupabaseError(error);

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Conflict',
        'The operation could not be completed due to a conflict.'
      );
    });

    it('should infer 401 status from not_authenticated code', fakeAsync(() => {
      const error: SupabaseErrorResponse = {
        message: 'Not authenticated',
        code: 'not_authenticated'
      };

      service.handleSupabaseError(error);
      tick();

      expect(mockAuthService.signOut).toHaveBeenCalled();
    }));

    it('should log error details to console', () => {
      const error: SupabaseErrorResponse = {
        message: 'Test error',
        status: 500,
        code: 'TEST',
        details: 'Error details',
        hint: 'Try again'
      };

      service.handleSupabaseError(error);

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('handleNetworkError', () => {
    it('should show network error toast', () => {
      service.handleNetworkError();

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Network error',
        'Please check your connection and try again.'
      );
    });

    it('should log network error to console', () => {
      service.handleNetworkError();

      expect(console.error).toHaveBeenCalled();
    });

    it('should report network failure to NetworkStatusService', () => {
      service.handleNetworkError();

      expect(mockNetworkStatusService.reportNetworkFailure).toHaveBeenCalled();
    });
  });

  describe('handleUnexpectedError', () => {
    it('should show generic error toast', () => {
      const error = new Error('Test error');

      service.handleUnexpectedError(error);

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Something went wrong',
        'An unexpected error occurred. Please try again later.'
      );
    });

    it('should log error to console', () => {
      const error = new Error('Test error');

      service.handleUnexpectedError(error);

      expect(console.error).toHaveBeenCalled();
    });

    it('should handle string errors', () => {
      service.handleUnexpectedError('String error');

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Something went wrong',
        'An unexpected error occurred. Please try again later.'
      );
    });

    it('should handle object errors with message property', () => {
      service.handleUnexpectedError({ message: 'Object error' });

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Something went wrong',
        'An unexpected error occurred. Please try again later.'
      );
    });

    it('should handle null errors', () => {
      service.handleUnexpectedError(null);

      expect(mockToastService.error).toHaveBeenCalledWith(
        'Something went wrong',
        'An unexpected error occurred. Please try again later.'
      );
    });
  });

  describe('handleCriticalError', () => {
    it('should navigate to error page', () => {
      const error = new Error('Critical error');

      service.handleCriticalError(error);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/error']);
    });

    it('should log critical error to console', () => {
      const error = new Error('Critical error');

      service.handleCriticalError(error);

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('isNetworkError', () => {
    it('should return true for TypeError with fetch message', () => {
      const error = new TypeError('Failed to fetch');

      expect(service.isNetworkError(error)).toBeTrue();
    });

    it('should return true for error with NetworkError message', () => {
      const error = { message: 'NetworkError when attempting to fetch' };

      expect(service.isNetworkError(error)).toBeTrue();
    });

    it('should return true for error with Network request failed message', () => {
      const error = { message: 'Network request failed' };

      expect(service.isNetworkError(error)).toBeTrue();
    });

    it('should return true for error with net::ERR_ message', () => {
      const error = { message: 'net::ERR_CONNECTION_REFUSED' };

      expect(service.isNetworkError(error)).toBeTrue();
    });

    it('should return false for AbortError', () => {
      const error = new DOMException('Aborted', 'AbortError');

      expect(service.isNetworkError(error)).toBeFalse();
    });

    it('should return false for regular Error', () => {
      const error = new Error('Some other error');

      expect(service.isNetworkError(error)).toBeFalse();
    });

    it('should return false for null', () => {
      expect(service.isNetworkError(null)).toBeFalse();
    });

    it('should return false for undefined', () => {
      expect(service.isNetworkError(undefined)).toBeFalse();
    });

    it('should return false for string', () => {
      expect(service.isNetworkError('error')).toBeFalse();
    });
  });

  describe('isSupabaseError', () => {
    it('should return true for error with message and code', () => {
      const error = { message: 'Error', code: 'PGRST116' };

      expect(service.isSupabaseError(error)).toBeTrue();
    });

    it('should return true for error with message and status', () => {
      const error = { message: 'Error', status: 400 };

      expect(service.isSupabaseError(error)).toBeTrue();
    });

    it('should return true for error with message and details', () => {
      const error = { message: 'Error', details: 'Some details' };

      expect(service.isSupabaseError(error)).toBeTrue();
    });

    it('should return false for error with only message', () => {
      const error = { message: 'Error' };

      expect(service.isSupabaseError(error)).toBeFalse();
    });

    it('should return false for null', () => {
      expect(service.isSupabaseError(null)).toBeFalse();
    });

    it('should return false for undefined', () => {
      expect(service.isSupabaseError(undefined)).toBeFalse();
    });

    it('should return false for string', () => {
      expect(service.isSupabaseError('error')).toBeFalse();
    });

    it('should return false for number', () => {
      expect(service.isSupabaseError(123)).toBeFalse();
    });
  });
});
