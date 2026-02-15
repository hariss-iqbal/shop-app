/**
 * Audit Log Model
 * Records all critical system activities for compliance and security
 * Feature: F-014 Audit Logging and Transaction Tracking
 */

export type AuditEventType =
  // Sales events
  | 'sale_created'
  | 'sale_updated'
  | 'sale_deleted'
  | 'batch_sale_completed'
  // Refund events
  | 'refund_initiated'
  | 'refund_completed'
  | 'refund_cancelled'
  | 'partial_refund_completed'
  // Inventory events
  | 'inventory_deducted'
  | 'inventory_restored'
  | 'product_status_changed'
  | 'product_created'
  | 'product_updated'
  | 'product_deleted'
  // User/Permission events
  | 'user_role_assigned'
  | 'user_role_changed'
  | 'user_role_revoked'
  | 'user_logged_in'
  | 'user_logged_out'
  // Receipt events
  | 'receipt_created'
  | 'receipt_sent'
  | 'receipt_resent'
  // System events
  | 'settings_changed'
  | 'stock_alert_triggered'
  | 'system_config_changed';

export interface AuditLog {
  id: string;
  eventType: AuditEventType;
  eventTimestamp: string;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  clientIp: string | null;
  userAgent: string | null;
  entityType: string;
  entityId: string | null;
  transactionId: string | null;
  referenceNumber: string | null;
  originalReferenceNumber: string | null;
  amount: number | null;
  previousAmount: number | null;
  previousState: Record<string, unknown> | null;
  newState: Record<string, unknown> | null;
  changes: Record<string, unknown> | null;
  reason: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  eventDescription?: string;
}

export interface AuditLogListResponse {
  data: AuditLog[];
  total: number;
}

export interface AuditLogFilter {
  startDate?: string;
  endDate?: string;
  eventTypes?: AuditEventType[];
  userId?: string;
  entityType?: string;
  entityId?: string;
  searchText?: string;
}

export interface AuditLogPagination {
  page: number;
  limit: number;
}

export interface AuditLogSummary {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByUser: Array<{
    userId: string;
    userEmail: string;
    count: number;
  }>;
  recentActivity: AuditLog[];
}

export type EventTypeCategory = 'sales' | 'refunds' | 'inventory' | 'users' | 'receipts' | 'system';

export interface EventTypeGroup {
  category: EventTypeCategory;
  label: string;
  eventTypes: AuditEventType[];
}

/**
 * Pre-defined event type groups for filtering UI
 */
export const EVENT_TYPE_GROUPS: EventTypeGroup[] = [
  {
    category: 'sales',
    label: 'Sales',
    eventTypes: ['sale_created', 'sale_updated', 'sale_deleted', 'batch_sale_completed']
  },
  {
    category: 'refunds',
    label: 'Refunds',
    eventTypes: ['refund_initiated', 'refund_completed', 'refund_cancelled', 'partial_refund_completed']
  },
  {
    category: 'inventory',
    label: 'Inventory',
    eventTypes: ['inventory_deducted', 'inventory_restored', 'product_status_changed', 'product_created', 'product_updated', 'product_deleted']
  },
  {
    category: 'users',
    label: 'Users & Permissions',
    eventTypes: ['user_role_assigned', 'user_role_changed', 'user_role_revoked', 'user_logged_in', 'user_logged_out']
  },
  {
    category: 'receipts',
    label: 'Receipts',
    eventTypes: ['receipt_created', 'receipt_sent', 'receipt_resent']
  },
  {
    category: 'system',
    label: 'System',
    eventTypes: ['settings_changed', 'stock_alert_triggered', 'system_config_changed']
  }
];

/**
 * Get human-readable label for event type
 */
export function getEventTypeLabel(eventType: AuditEventType): string {
  const labels: Record<AuditEventType, string> = {
    // Sales
    sale_created: 'Sale Created',
    sale_updated: 'Sale Updated',
    sale_deleted: 'Sale Deleted',
    batch_sale_completed: 'Batch Sale Completed',
    // Refunds
    refund_initiated: 'Refund Initiated',
    refund_completed: 'Refund Completed',
    refund_cancelled: 'Refund Cancelled',
    partial_refund_completed: 'Partial Refund Completed',
    // Inventory
    inventory_deducted: 'Inventory Deducted',
    inventory_restored: 'Inventory Restored',
    product_status_changed: 'Product Status Changed',
    product_created: 'Product Created',
    product_updated: 'Product Updated',
    product_deleted: 'Product Deleted',
    // Users
    user_role_assigned: 'User Role Assigned',
    user_role_changed: 'User Role Changed',
    user_role_revoked: 'User Role Revoked',
    user_logged_in: 'User Logged In',
    user_logged_out: 'User Logged Out',
    // Receipts
    receipt_created: 'Receipt Created',
    receipt_sent: 'Receipt Sent',
    receipt_resent: 'Receipt Resent',
    // System
    settings_changed: 'Settings Changed',
    stock_alert_triggered: 'Stock Alert Triggered',
    system_config_changed: 'System Config Changed'
  };
  return labels[eventType] || eventType;
}

/**
 * Get severity level for event type (for PrimeNG Tag component)
 */
export function getEventTypeSeverity(eventType: AuditEventType): 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast' {
  const severities: Record<AuditEventType, 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
    // Sales - success
    sale_created: 'success',
    sale_updated: 'info',
    sale_deleted: 'warn',
    batch_sale_completed: 'success',
    // Refunds - warn/danger
    refund_initiated: 'warn',
    refund_completed: 'warn',
    refund_cancelled: 'info',
    partial_refund_completed: 'warn',
    // Inventory - info
    inventory_deducted: 'info',
    inventory_restored: 'info',
    product_status_changed: 'info',
    product_created: 'success',
    product_updated: 'info',
    product_deleted: 'danger',
    // Users - warn
    user_role_assigned: 'success',
    user_role_changed: 'warn',
    user_role_revoked: 'danger',
    user_logged_in: 'info',
    user_logged_out: 'secondary',
    // Receipts - info
    receipt_created: 'info',
    receipt_sent: 'success',
    receipt_resent: 'info',
    // System - info
    settings_changed: 'warn',
    stock_alert_triggered: 'warn',
    system_config_changed: 'warn'
  };
  return severities[eventType] || 'info';
}

/**
 * Get icon for event type (PrimeIcons)
 */
export function getEventTypeIcon(eventType: AuditEventType): string {
  const icons: Record<AuditEventType, string> = {
    // Sales
    sale_created: 'pi pi-shopping-cart',
    sale_updated: 'pi pi-pencil',
    sale_deleted: 'pi pi-trash',
    batch_sale_completed: 'pi pi-shopping-bag',
    // Refunds
    refund_initiated: 'pi pi-replay',
    refund_completed: 'pi pi-check-circle',
    refund_cancelled: 'pi pi-times-circle',
    partial_refund_completed: 'pi pi-percentage',
    // Inventory
    inventory_deducted: 'pi pi-minus-circle',
    inventory_restored: 'pi pi-plus-circle',
    product_status_changed: 'pi pi-sync',
    product_created: 'pi pi-box',
    product_updated: 'pi pi-pencil',
    product_deleted: 'pi pi-trash',
    // Users
    user_role_assigned: 'pi pi-user-plus',
    user_role_changed: 'pi pi-user-edit',
    user_role_revoked: 'pi pi-user-minus',
    user_logged_in: 'pi pi-sign-in',
    user_logged_out: 'pi pi-sign-out',
    // Receipts
    receipt_created: 'pi pi-file',
    receipt_sent: 'pi pi-send',
    receipt_resent: 'pi pi-refresh',
    // System
    settings_changed: 'pi pi-cog',
    stock_alert_triggered: 'pi pi-exclamation-triangle',
    system_config_changed: 'pi pi-sliders-h'
  };
  return icons[eventType] || 'pi pi-info-circle';
}
