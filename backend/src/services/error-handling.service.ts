import {
  ErrorResponseDto,
  ErrorLogEntryDto,
  USER_FRIENDLY_MESSAGES
} from '../dto/error-handling.dto';

/**
 * Error Handling Service
 * Centralized error processing for API responses
 * Ensures sensitive error details are logged but never exposed to end users
 */
export class ErrorHandlingService {
  createErrorResponse(statusCode: number, internalMessage?: string): ErrorResponseDto {
    const userMessage = USER_FRIENDLY_MESSAGES[statusCode]
      ?? USER_FRIENDLY_MESSAGES[500]!;

    this.logError({
      timestamp: new Date().toISOString(),
      statusCode,
      message: internalMessage ?? userMessage
    });

    return {
      error: this.getErrorLabel(statusCode),
      message: userMessage,
      statusCode
    };
  }

  createValidationErrorResponse(details: string): ErrorResponseDto {
    this.logError({
      timestamp: new Date().toISOString(),
      statusCode: 422,
      message: details
    });

    return {
      error: 'Validation Error',
      message: USER_FRIENDLY_MESSAGES[422]!,
      statusCode: 422
    };
  }

  logError(entry: ErrorLogEntryDto): void {
    console.error('[ErrorHandlingService]', JSON.stringify(entry));
  }

  private getErrorLabel(statusCode: number): string {
    const labels: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Validation Error',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    };
    return labels[statusCode] ?? 'Error';
  }
}
