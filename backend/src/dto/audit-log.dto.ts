import { AuditEventType } from '../entities/audit-log.entity';

/**
 * Audit Log DTOs
 * Data Transfer Objects for Audit Log entity
 * Feature: F-014 Audit Logging and Transaction Tracking
 */

/**
 * Audit Log Response DTO
 * Returned from API endpoints
 */
export interface AuditLogResponseDto {
  id: string;
  eventType: AuditEventType;
  eventTimestamp: string;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  clientIp: string | null;
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

/**
 * Audit Log List Response DTO
 * Paginated list of audit logs
 */
export interface AuditLogListResponseDto {
  data: AuditLogResponseDto[];
  total: number;
}

/**
 * Audit Log Filter DTO
 * Filtering options for audit log queries
 */
export interface AuditLogFilterDto {
  startDate?: string;
  endDate?: string;
  eventTypes?: AuditEventType[];
  userId?: string;
  entityType?: string;
  entityId?: string;
  searchText?: string;
}

/**
 * Audit Log Pagination DTO
 */
export interface AuditLogPaginationDto {
  page: number;
  limit: number;
}

/**
 * Create Sale Audit Log DTO
 * Input for logging sale transactions
 */
export interface CreateSaleAuditLogDto {
  eventType: AuditEventType;
  saleId: string;
  productId: string;
  amount: number;
  buyerName?: string | null;
  buyerPhone?: string | null;
  itemsSold?: number;
  clientIp?: string | null;
  userAgent?: string | null;
}

/**
 * Create Refund Audit Log DTO
 * Input for logging refund transactions
 */
export interface CreateRefundAuditLogDto {
  eventType: AuditEventType;
  refundId: string;
  originalReceiptId: string;
  refundNumber: string;
  originalReceiptNumber: string;
  refundAmount: number;
  refundReason: string;
  approvingUserId?: string | null;
  isPartial?: boolean;
  clientIp?: string | null;
  userAgent?: string | null;
}

/**
 * Create Permission Change Audit Log DTO
 * Input for logging user permission changes
 */
export interface CreatePermissionChangeAuditLogDto {
  targetUserId: string;
  previousRole: string;
  newRole: string;
  adminUserId: string;
  reason?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
}

/**
 * Create Inventory Audit Log DTO
 * Input for logging inventory changes
 */
export interface CreateInventoryAuditLogDto {
  eventType: AuditEventType;
  productId: string;
  previousStatus: string;
  newStatus: string;
  saleId?: string | null;
  refundId?: string | null;
  notes?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
}

/**
 * Audit Log Summary DTO
 * Statistics summary for dashboard
 */
export interface AuditLogSummaryDto {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByUser: Array<{
    userId: string;
    userEmail: string;
    count: number;
  }>;
  recentActivity: AuditLogResponseDto[];
}

/**
 * Event Type Category
 * Groups event types for filtering UI
 */
export type EventTypeCategory = 'sales' | 'refunds' | 'inventory' | 'users' | 'receipts' | 'system';

/**
 * Event Type Group DTO
 * Groups of event types by category
 */
export interface EventTypeGroupDto {
  category: EventTypeCategory;
  label: string;
  eventTypes: AuditEventType[];
}

/**
 * Available Event Type Groups
 * Pre-defined groups for filtering UI
 */
export const EVENT_TYPE_GROUPS: EventTypeGroupDto[] = [
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
 * Get event type label
 * Human-readable labels for event types
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
 * Get event type severity
 * For color-coding in UI
 */
export function getEventTypeSeverity(eventType: AuditEventType): 'info' | 'success' | 'warn' | 'danger' {
  const severities: Record<AuditEventType, 'info' | 'success' | 'warn' | 'danger'> = {
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
    user_logged_out: 'info',
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
