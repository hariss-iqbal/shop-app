/**
 * Notification DTOs
 * Data Transfer Objects for toast notification responses
 * Used to provide structured feedback messages from API operations
 */

export type NotificationSeverity = 'success' | 'error' | 'warn' | 'info';

export interface NotificationDto {
  severity: NotificationSeverity;
  summary: string;
  detail?: string;
}

export interface ApiResponseDto<T = void> {
  data?: T;
  notification?: NotificationDto;
}

export interface ApiErrorResponseDto {
  error: string;
  notification: NotificationDto;
  statusCode: number;
}
