/**
 * Confirmation Dialog DTOs
 * Data Transfer Objects for confirmation dialog configuration
 * Used by M-11 Shared Services for destructive action confirmations (F-034)
 */

export type ConfirmDialogSeverity = 'danger' | 'warning' | 'info';

export interface ConfirmDialogConfigDto {
  header: string;
  message: string;
  icon: string;
  acceptLabel: string;
  rejectLabel: string;
  severity: ConfirmDialogSeverity;
}

export interface DestructiveActionType {
  action: 'delete' | 'bulk_delete' | 'cancel' | 'bulk_action';
  entityType: string;
  entityLabel?: string;
  count?: number;
}
