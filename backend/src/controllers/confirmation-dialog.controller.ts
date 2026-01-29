import { ConfirmationDialogService } from '../services/confirmation-dialog.service';
import { ConfirmDialogConfigDto, DestructiveActionType } from '../dto/confirmation-dialog.dto';

/**
 * Confirmation Dialog Controller
 * Provides confirmation dialog configurations for destructive actions (F-034)
 * Route: /api/confirmation-dialogs
 */
export class ConfirmationDialogController {
  constructor(private readonly confirmationDialogService: ConfirmationDialogService) {}

  getDialogConfig(actionType: DestructiveActionType): ConfirmDialogConfigDto {
    return this.confirmationDialogService.getDialogConfig(actionType);
  }
}
