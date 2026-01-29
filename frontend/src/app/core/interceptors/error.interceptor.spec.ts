import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';
import { ErrorHandlingService } from '../services/error-handling.service';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let mockErrorHandlingService: jasmine.SpyObj<ErrorHandlingService>;

  beforeEach(() => {
    mockErrorHandlingService = jasmine.createSpyObj('ErrorHandlingService', [
      'handleNetworkError',
      'handleSupabaseError'
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: ErrorHandlingService, useValue: mockErrorHandlingService }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should handle network error (status 0)', () => {
    httpClient.get('/api/test').subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(0);
      }
    });

    const req = httpTestingController.expectOne('/api/test');
    req.error(new ProgressEvent('error'), { status: 0 });

    expect(mockErrorHandlingService.handleNetworkError).toHaveBeenCalled();
  });

  it('should handle 401 Unauthorized error', () => {
    httpClient.get('/api/test').subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(401);
      }
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(mockErrorHandlingService.handleSupabaseError).toHaveBeenCalledWith({
      message: 'Unauthorized',
      status: 401
    });
  });

  it('should handle 403 Forbidden error', () => {
    httpClient.get('/api/test').subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(403);
      }
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(mockErrorHandlingService.handleSupabaseError).toHaveBeenCalledWith({
      message: 'Forbidden',
      status: 403
    });
  });

  it('should handle 500 Server error', () => {
    httpClient.get('/api/test').subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(mockErrorHandlingService.handleSupabaseError).toHaveBeenCalledWith(
      jasmine.objectContaining({
        status: 500
      })
    );
  });

  it('should handle 503 Service Unavailable error', () => {
    httpClient.get('/api/test').subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(503);
      }
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush({ message: 'Service Unavailable' }, { status: 503, statusText: 'Service Unavailable' });

    expect(mockErrorHandlingService.handleSupabaseError).toHaveBeenCalledWith(
      jasmine.objectContaining({
        status: 503
      })
    );
  });

  it('should handle 400 Bad Request error with error details', () => {
    const errorBody = {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: 'Field X is required'
    };

    httpClient.get('/api/test').subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(400);
      }
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush(errorBody, { status: 400, statusText: 'Bad Request' });

    expect(mockErrorHandlingService.handleSupabaseError).toHaveBeenCalledWith({
      message: 'Validation failed',
      status: 400,
      code: 'VALIDATION_ERROR',
      details: 'Field X is required'
    });
  });

  it('should handle 404 Not Found error', () => {
    httpClient.get('/api/test').subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(404);
      }
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

    expect(mockErrorHandlingService.handleSupabaseError).toHaveBeenCalledWith(
      jasmine.objectContaining({
        status: 404
      })
    );
  });

  it('should handle 422 Unprocessable Entity error', () => {
    httpClient.get('/api/test').subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(422);
      }
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush({ message: 'Unprocessable Entity' }, { status: 422, statusText: 'Unprocessable Entity' });

    expect(mockErrorHandlingService.handleSupabaseError).toHaveBeenCalledWith(
      jasmine.objectContaining({
        status: 422
      })
    );
  });

  it('should handle 429 Too Many Requests error', () => {
    httpClient.get('/api/test').subscribe({
      error: (error: HttpErrorResponse) => {
        expect(error.status).toBe(429);
      }
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush({ message: 'Too Many Requests' }, { status: 429, statusText: 'Too Many Requests' });

    expect(mockErrorHandlingService.handleSupabaseError).toHaveBeenCalledWith(
      jasmine.objectContaining({
        status: 429
      })
    );
  });

  it('should pass through successful responses', () => {
    const testData = { id: 1, name: 'Test' };

    httpClient.get('/api/test').subscribe({
      next: (data) => {
        expect(data).toEqual(testData);
      }
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush(testData);

    expect(mockErrorHandlingService.handleNetworkError).not.toHaveBeenCalled();
    expect(mockErrorHandlingService.handleSupabaseError).not.toHaveBeenCalled();
  });

  it('should re-throw the error after handling', () => {
    let caughtError: HttpErrorResponse | undefined;

    httpClient.get('/api/test').subscribe({
      error: (error: HttpErrorResponse) => {
        caughtError = error;
      }
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush({ message: 'Error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(caughtError).toBeDefined();
    expect(caughtError?.status).toBe(500);
  });

  it('should use default message when error body has no message', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {}
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush(null, { status: 500, statusText: 'Internal Server Error' });

    expect(mockErrorHandlingService.handleSupabaseError).toHaveBeenCalledWith(
      jasmine.objectContaining({
        status: 500
      })
    );
  });
});
