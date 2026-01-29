import {
  ConfirmDialogConfigDto,
  ConfirmDialogSeverity,
  DestructiveActionType
} from '../dto/confirmation-dialog.dto';

/**
 * Confirmation Dialog Service
 * Generates standardized confirmation dialog configurations for destructive actions (F-034)
 * Used by M-11 Shared Services, consumed by M-04 Inventory, M-06 Procurement, M-08 Messaging
 */
export class ConfirmationDialogService {
  getDialogConfig(actionType: DestructiveActionType): ConfirmDialogConfigDto {
    switch (actionType.action) {
      case 'delete':
        return this.buildDeleteConfig(actionType.entityType, actionType.entityLabel);
      case 'bulk_delete':
        return this.buildBulkDeleteConfig(actionType.entityType, actionType.count ?? 0);
      case 'cancel':
        return this.buildCancelConfig(actionType.entityType, actionType.entityLabel);
      case 'bulk_action':
        return this.buildBulkActionConfig(actionType.entityType, actionType.count ?? 0, actionType.entityLabel);
      default:
        return this.buildDefaultConfig(actionType.entityType);
    }
  }

  private buildDeleteConfig(entityType: string, entityLabel?: string): ConfirmDialogConfigDto {
    const detailPart = entityLabel ? ` "${entityLabel}"` : '';
    return {
      header: 'Confirm Delete',
      message: `Are you sure you want to delete this ${entityType}${detailPart}? This action cannot be undone.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Confirm',
      rejectLabel: 'Cancel',
      severity: 'danger'
    };
  }

  private buildBulkDeleteConfig(entityType: string, count: number): ConfirmDialogConfigDto {
    const plural = count > 1 ? `${entityType}s` : entityType;
    return {
      header: 'Confirm Bulk Delete',
      message: `Are you sure you want to delete ${count} ${plural}? This action cannot be undone.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Confirm',
      rejectLabel: 'Cancel',
      severity: 'danger'
    };
  }

  private buildCancelConfig(entityType: string, entityLabel?: string): ConfirmDialogConfigDto {
    const detailPart = entityLabel ? ` "${entityLabel}"` : '';
    return {
      header: `Confirm Cancel`,
      message: `Are you sure you want to cancel this ${entityType}${detailPart}? This action cannot be undone.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Confirm',
      rejectLabel: 'Cancel',
      severity: 'danger'
    };
  }

  private buildBulkActionConfig(entityType: string, count: number, actionLabel?: string): ConfirmDialogConfigDto {
    const action = actionLabel ?? 'process';
    const plural = count > 1 ? `${entityType}s` : entityType;
    return {
      header: `Confirm ${action}`,
      message: `Are you sure you want to ${action.toLowerCase()} ${count} ${plural}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Confirm',
      rejectLabel: 'Cancel',
      severity: 'warning'
    };
  }

  private buildDefaultConfig(entityType: string): ConfirmDialogConfigDto {
    return {
      header: 'Confirm Action',
      message: `Are you sure you want to proceed with this action on ${entityType}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Confirm',
      rejectLabel: 'Cancel',
      severity: 'info'
    };
  }
}
