import { ErrorHandlingService } from '../services/error-handling.service';
import { ErrorResponseDto, ErrorLogEntryDto } from '../dto/error-handling.dto';

/**
 * Error Handling Controller
 * Provides structured error response generation for API consumers
 * Route: /api/errors
 */
export class ErrorHandlingController {
  constructor(private readonly errorHandlingService: ErrorHandlingService) {}

  handleError(statusCode: number, internalMessage?: string): ErrorResponseDto {
    return this.errorHandlingService.createErrorResponse(statusCode, internalMessage);
  }

  handleValidationError(details: string): ErrorResponseDto {
    return this.errorHandlingService.createValidationErrorResponse(details);
  }

  logError(entry: ErrorLogEntryDto): void {
    this.errorHandlingService.logError(entry);
  }
}
