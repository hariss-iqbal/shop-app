/**
 * Audit Log Entity
 * Immutable audit trail for all critical system activities
 * Database table: audit_logs
 * Owner Module: M-14 Security
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
  event_type: AuditEventType;
  event_timestamp: string;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  client_ip: string | null;
  user_agent: string | null;
  entity_type: string;
  entity_id: string | null;
  transaction_id: string | null;
  reference_number: string | null;
  original_reference_number: string | null;
  amount: number | null;
  previous_amount: number | null;
  previous_state: Record<string, unknown> | null;
  new_state: Record<string, unknown> | null;
  changes: Record<string, unknown> | null;
  reason: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Audit Log Insert Interface
 * Note: Most fields are populated automatically by database functions
 */
export interface AuditLogInsert {
  event_type: AuditEventType;
  entity_type: string;
  entity_id?: string | null;
  transaction_id?: string | null;
  reference_number?: string | null;
  original_reference_number?: string | null;
  amount?: number | null;
  previous_amount?: number | null;
  previous_state?: Record<string, unknown> | null;
  new_state?: Record<string, unknown> | null;
  changes?: Record<string, unknown> | null;
  reason?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  client_ip?: string | null;
  user_agent?: string | null;
}

/**
 * Audit Log with View Data
 * Extended interface with computed fields from audit_logs_view
 */
export interface AuditLogWithDescription extends AuditLog {
  event_description?: string;
}

/**
 * Sale Audit Log Input
 * Specialized input for logging sale transactions
 */
export interface SaleAuditInput {
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
 * Refund Audit Log Input
 * Specialized input for logging refund transactions
 */
export interface RefundAuditInput {
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
 * Permission Change Audit Input
 * Specialized input for logging user permission changes
 */
export interface PermissionChangeAuditInput {
  targetUserId: string;
  previousRole: string;
  newRole: string;
  adminUserId: string;
  reason?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
}

/**
 * Inventory Audit Log Input
 * Specialized input for logging inventory changes
 */
export interface InventoryAuditInput {
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
 * Audit Log Query Result
 * Result from get_audit_logs RPC function
 */
export interface AuditLogQueryResult extends AuditLog {
  total_count: number;
}
