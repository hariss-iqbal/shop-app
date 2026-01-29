import { Injectable, inject } from '@angular/core';
import { ConfirmationService } from 'primeng/api';

/**
 * Options for configuring a custom confirmation dialog.
 */
export interface ConfirmOptions {
  /** Dialog header text. Defaults to 'Confirm'. */
  header?: string;
  /** Main message displayed in the dialog body. Supports HTML. */
  message: string;
  /** PrimeNG icon class to display. Defaults to 'pi pi-exclamation-triangle'. */
  icon?: string;
  /** Label for the accept/confirm button. Defaults to 'Yes'. */
  acceptLabel?: string;
  /** Label for the reject/cancel button. Defaults to 'No'. */
  rejectLabel?: string;
  /** CSS class for the accept button. Defaults to 'p-button-danger'. */
  acceptButtonStyleClass?: string;
  /** CSS class for the reject button. Defaults to 'p-button-text'. */
  rejectButtonStyleClass?: string;
}

/**
 * Service for displaying confirmation dialogs for destructive actions.
 *
 * This service wraps PrimeNG's ConfirmationService to provide a consistent,
 * Promise-based API for confirmation dialogs throughout the application.
 *
 * @example
 * ```typescript
 * // Single item deletion
 * const confirmed = await this.confirmDialogService.confirmDelete('phone', 'iPhone 15 Pro');
 * if (confirmed) {
 *   await this.phoneService.deletePhone(id);
 * }
 *
 * // Bulk deletion
 * const confirmed = await this.confirmDialogService.confirmBulkDelete('phone', 5);
 * if (confirmed) {
 *   await this.phoneService.deletePhones(ids);
 * }
 *
 * // Custom confirmation
 * const confirmed = await this.confirmDialogService.confirm({
 *   header: 'Cancel Order',
 *   message: 'Are you sure you want to cancel this order?',
 *   icon: 'pi pi-exclamation-triangle',
 *   acceptLabel: 'Yes, Cancel',
 *   rejectLabel: 'Keep Order'
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  private confirmationService = inject(ConfirmationService);

  /**
   * Displays a custom confirmation dialog.
   *
   * @param options - Configuration options for the dialog
   * @returns Promise that resolves to true if accepted, false if rejected
   */
  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmationService.confirm({
        header: options.header ?? 'Confirm',
        message: options.message,
        icon: options.icon ?? 'pi pi-exclamation-triangle',
        acceptLabel: options.acceptLabel ?? 'Yes',
        rejectLabel: options.rejectLabel ?? 'No',
        acceptButtonStyleClass: options.acceptButtonStyleClass ?? 'p-button-danger',
        rejectButtonStyleClass: options.rejectButtonStyleClass ?? 'p-button-text',
        accept: () => resolve(true),
        reject: () => resolve(false)
      });
    });
  }

  /**
   * Displays a confirmation dialog for deleting a single item.
   *
   * @param entityName - The type of entity being deleted (e.g., 'phone', 'supplier')
   * @param itemDetails - Optional details about the specific item (e.g., 'iPhone 15 Pro')
   * @returns Promise that resolves to true if confirmed, false if cancelled
   *
   * @example
   * ```typescript
   * const confirmed = await this.confirmDialogService.confirmDelete('phone', 'iPhone 15 Pro');
   * ```
   */
  confirmDelete(entityName: string, itemDetails?: string): Promise<boolean> {
    const detailLine = itemDetails
      ? `<br/><br/><strong>${itemDetails}</strong><br/><br/>`
      : ' ';
    return this.confirm({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete this ${entityName}?${detailLine}This action cannot be undone.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Confirm',
      rejectLabel: 'Cancel'
    });
  }

  /**
   * Displays a confirmation dialog for bulk deletion of multiple items.
   *
   * @param entityName - The type of entities being deleted (will be pluralized if count > 1)
   * @param count - The number of items to be deleted
   * @returns Promise that resolves to true if confirmed, false if cancelled
   *
   * @example
   * ```typescript
   * const confirmed = await this.confirmDialogService.confirmBulkDelete('phone', 5);
   * // Dialog shows: "Are you sure you want to delete 5 phones?"
   * ```
   */
  confirmBulkDelete(entityName: string, count: number): Promise<boolean> {
    return this.confirm({
      header: 'Confirm Bulk Delete',
      message: `Are you sure you want to delete <strong>${count}</strong> ${entityName}${count > 1 ? 's' : ''}?<br/><br/>This action cannot be undone.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Confirm',
      rejectLabel: 'Cancel'
    });
  }

  /**
   * Displays a confirmation dialog for bulk actions (non-delete operations).
   *
   * @param action - The action being performed (e.g., 'Mark as Sold', 'Reserve')
   * @param entityName - The type of entities being acted upon
   * @param count - The number of items affected
   * @returns Promise that resolves to true if confirmed, false if cancelled
   *
   * @example
   * ```typescript
   * const confirmed = await this.confirmDialogService.confirmBulkAction('Mark as Sold', 'phone', 3);
   * // Dialog shows: "Are you sure you want to mark as sold 3 phones?"
   * ```
   */
  confirmBulkAction(action: string, entityName: string, count: number): Promise<boolean> {
    return this.confirm({
      header: `Confirm ${action}`,
      message: `Are you sure you want to ${action.toLowerCase()} <strong>${count}</strong> ${entityName}${count > 1 ? 's' : ''}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Confirm',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-warning'
    });
  }

  /**
   * Displays a confirmation dialog for a single item action (non-delete operations).
   *
   * @param action - The action being performed (e.g., 'Cancel', 'Archive')
   * @param entityName - The type of entity being acted upon
   * @param itemDetails - Optional details about the specific item
   * @returns Promise that resolves to true if confirmed, false if cancelled
   *
   * @example
   * ```typescript
   * const confirmed = await this.confirmDialogService.confirmAction('Cancel', 'order', 'PO-0001');
   * ```
   */
  confirmAction(action: string, entityName: string, itemDetails?: string): Promise<boolean> {
    const detailLine = itemDetails
      ? `<br/><br/><strong>${itemDetails}</strong><br/><br/>`
      : ' ';
    return this.confirm({
      header: `Confirm ${action}`,
      message: `Are you sure you want to ${action.toLowerCase()} this ${entityName}?${detailLine}This action cannot be undone.`,
      acceptLabel: 'Confirm',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger'
    });
  }
}
