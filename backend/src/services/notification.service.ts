import {
  NotificationDto,
  NotificationSeverity,
  ApiResponseDto,
  ApiErrorResponseDto
} from '../dto/notification.dto';

/**
 * Notification Service
 * Creates structured notification payloads for API responses
 * Maps to frontend ToastService severity levels
 */
export class NotificationService {
  createNotification(
    severity: NotificationSeverity,
    summary: string,
    detail?: string
  ): NotificationDto {
    return { severity, summary, detail };
  }

  createSuccessResponse<T>(data: T, summary: string, detail?: string): ApiResponseDto<T> {
    return {
      data,
      notification: this.createNotification('success', summary, detail)
    };
  }

  createErrorResponse(error: string, statusCode: number, detail?: string): ApiErrorResponseDto {
    return {
      error,
      notification: this.createNotification('error', 'Error', detail ?? error),
      statusCode
    };
  }

  crudNotification(entity: string, operation: 'create' | 'update' | 'delete'): NotificationDto {
    const operationLabels: Record<string, string> = {
      create: 'created',
      update: 'updated',
      delete: 'deleted'
    };

    return this.createNotification(
      'success',
      'Success',
      `${entity} ${operationLabels[operation]} successfully`
    );
  }
}
