import { NotificationService } from '../services/notification.service';
import { NotificationDto, NotificationSeverity } from '../dto/notification.dto';

/**
 * Notification Controller
 * Provides notification message templates for the frontend toast system
 * Route: /api/notifications
 */
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  getCrudNotification(entity: string, operation: 'create' | 'update' | 'delete'): NotificationDto {
    return this.notificationService.crudNotification(entity, operation);
  }

  getCustomNotification(
    severity: NotificationSeverity,
    summary: string,
    detail?: string
  ): NotificationDto {
    return this.notificationService.createNotification(severity, summary, detail);
  }
}
