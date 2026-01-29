/**
 * Error Handling DTOs
 * Data Transfer Objects for structured error responses
 * Ensures sensitive error details are never exposed to end users
 */

export interface ErrorResponseDto {
  error: string;
  message: string;
  statusCode: number;
}

export interface ErrorLogEntryDto {
  timestamp: string;
  statusCode: number;
  errorCode?: string;
  message: string;
  path?: string;
  method?: string;
  details?: string;
}

export const USER_FRIENDLY_MESSAGES: Record<number, string> = {
  400: 'The request could not be processed. Please check your input.',
  401: 'Your session has expired. Please sign in again.',
  403: 'Permission denied. You do not have access to this resource.',
  404: 'The requested resource was not found.',
  409: 'The operation could not be completed due to a conflict.',
  422: 'Please check your input and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong. Please try again later.',
  502: 'The server is temporarily unavailable. Please try again later.',
  503: 'The service is temporarily unavailable. Please try again later.'
};
