import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { GlobalErrorHandler } from './global-error-handler.service';
import { ErrorHandlingService } from './error-handling.service';

describe('GlobalErrorHandler', () => {
  let handler: GlobalErrorHandler;
  let mockErrorHandlingService: jasmine.SpyObj<ErrorHandlingService>;
  let mockZone: NgZone;

  beforeEach(() => {
    mockErrorHandlingService = jasmine.createSpyObj('ErrorHandlingService', [
      'isNetworkError',
      'isSupabaseError',
      'handleNetworkError',
      'handleSupabaseError',
      'handleUnexpectedError'
    ]);

    mockZone = new NgZone({ enableLongStackTrace: false });

    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        { provide: ErrorHandlingService, useValue: mockErrorHandlingService },
        { provide: NgZone, useValue: mockZone }
      ]
    });

    handler = TestBed.inject(GlobalErrorHandler);
    spyOn(console, 'error');
  });

  it('should be created', () => {
    expect(handler).toBeTruthy();
  });

  describe('handleError', () => {
    it('should handle network errors', fakeAsync(() => {
      const error = new TypeError('Failed to fetch');
      mockErrorHandlingService.isNetworkError.and.returnValue(true);
      mockErrorHandlingService.isSupabaseError.and.returnValue(false);

      handler.handleError(error);
      tick();

      expect(mockErrorHandlingService.isNetworkError).toHaveBeenCalledWith(error);
      expect(mockErrorHandlingService.handleNetworkError).toHaveBeenCalled();
    }));

    it('should handle Supabase errors', fakeAsync(() => {
      const error = { message: 'Supabase error', code: 'PGRST116' };
      mockErrorHandlingService.isNetworkError.and.returnValue(false);
      mockErrorHandlingService.isSupabaseError.and.returnValue(true);

      handler.handleError(error);
      tick();

      expect(mockErrorHandlingService.isSupabaseError).toHaveBeenCalledWith(error);
      expect(mockErrorHandlingService.handleSupabaseError).toHaveBeenCalledWith(error);
    }));

    it('should handle unexpected errors', fakeAsync(() => {
      const error = new Error('Unexpected error');
      mockErrorHandlingService.isNetworkError.and.returnValue(false);
      mockErrorHandlingService.isSupabaseError.and.returnValue(false);

      handler.handleError(error);
      tick();

      expect(mockErrorHandlingService.handleUnexpectedError).toHaveBeenCalledWith(error);
    }));

    it('should log error to console', fakeAsync(() => {
      const error = new Error('Test error');
      mockErrorHandlingService.isNetworkError.and.returnValue(false);
      mockErrorHandlingService.isSupabaseError.and.returnValue(false);

      handler.handleError(error);
      tick();

      expect(console.error).toHaveBeenCalledWith('[GlobalErrorHandler]', error);
    }));

    it('should unwrap rejection errors', fakeAsync(() => {
      const innerError = { message: 'Inner error', status: 400 };
      const wrappedError = { rejection: innerError };
      mockErrorHandlingService.isNetworkError.and.returnValue(false);
      mockErrorHandlingService.isSupabaseError.and.returnValue(true);

      handler.handleError(wrappedError);
      tick();

      expect(mockErrorHandlingService.isSupabaseError).toHaveBeenCalledWith(innerError);
      expect(mockErrorHandlingService.handleSupabaseError).toHaveBeenCalledWith(innerError);
    }));

    it('should unwrap error property', fakeAsync(() => {
      const innerError = new Error('Inner error');
      const wrappedError = { error: innerError };
      mockErrorHandlingService.isNetworkError.and.returnValue(false);
      mockErrorHandlingService.isSupabaseError.and.returnValue(false);

      handler.handleError(wrappedError);
      tick();

      expect(mockErrorHandlingService.handleUnexpectedError).toHaveBeenCalledWith(innerError);
    }));

    it('should handle null error', fakeAsync(() => {
      mockErrorHandlingService.isNetworkError.and.returnValue(false);
      mockErrorHandlingService.isSupabaseError.and.returnValue(false);

      handler.handleError(null);
      tick();

      expect(mockErrorHandlingService.handleUnexpectedError).toHaveBeenCalledWith(null);
    }));

    it('should handle undefined error', fakeAsync(() => {
      mockErrorHandlingService.isNetworkError.and.returnValue(false);
      mockErrorHandlingService.isSupabaseError.and.returnValue(false);

      handler.handleError(undefined);
      tick();

      expect(mockErrorHandlingService.handleUnexpectedError).toHaveBeenCalledWith(undefined);
    }));

    it('should handle string error', fakeAsync(() => {
      const error = 'String error message';
      mockErrorHandlingService.isNetworkError.and.returnValue(false);
      mockErrorHandlingService.isSupabaseError.and.returnValue(false);

      handler.handleError(error);
      tick();

      expect(mockErrorHandlingService.handleUnexpectedError).toHaveBeenCalledWith(error);
    }));

    it('should prioritize network error check over Supabase error check', fakeAsync(() => {
      const error = { message: 'Failed to fetch', status: 0 };
      mockErrorHandlingService.isNetworkError.and.returnValue(true);
      mockErrorHandlingService.isSupabaseError.and.returnValue(true);

      handler.handleError(error);
      tick();

      expect(mockErrorHandlingService.handleNetworkError).toHaveBeenCalled();
      expect(mockErrorHandlingService.handleSupabaseError).not.toHaveBeenCalled();
    }));
  });
});
