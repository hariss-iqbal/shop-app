import { SupabaseClient } from '@supabase/supabase-js';
import {
  AuditLog,
  AuditLogInsert,
  AuditLogQueryResult,
  AuditEventType,
  SaleAuditInput,
  RefundAuditInput,
  PermissionChangeAuditInput,
  InventoryAuditInput
} from '../entities/audit-log.entity';

/**
 * Audit Log Repository
 * Handles database operations for Audit Log entity
 * Table: audit_logs
 * Feature: F-014 Audit Logging and Transaction Tracking
 *
 * Note: This repository uses RPC functions to create audit logs
 * to ensure proper user context is captured and immutability is maintained.
 */
export class AuditLogRepository {
  private readonly tableName = 'audit_logs';

  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Find all audit logs with optional filtering
   * Uses the get_audit_logs RPC function for efficient querying
   */
  async findAll(options?: {
    startDate?: string;
    endDate?: string;
    eventTypes?: AuditEventType[];
    userId?: string;
    entityType?: string;
    entityId?: string;
    searchText?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AuditLog[]; total: number }> {
    const { data, error } = await this.supabase.rpc('get_audit_logs', {
      p_start_date: options?.startDate || null,
      p_end_date: options?.endDate || null,
      p_event_types: options?.eventTypes || null,
      p_user_id: options?.userId || null,
      p_entity_type: options?.entityType || null,
      p_entity_id: options?.entityId || null,
      p_search_text: options?.searchText || null,
      p_limit: options?.limit || 100,
      p_offset: options?.offset || 0
    });

    if (error) throw error;

    const results = (data || []) as AuditLogQueryResult[];
    const total = results.length > 0 ? results[0].total_count : 0;

    return {
      data: results.map(this.mapFromQueryResult),
      total: Number(total)
    };
  }

  /**
   * Find audit log by ID
   */
  async findById(id: string): Promise<AuditLog | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Find audit logs for a specific entity
   */
  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('event_timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Find audit logs for a specific user
   */
  async findByUser(userId: string, limit: number = 100): Promise<AuditLog[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('event_timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Find audit logs by event type
   */
  async findByEventType(eventType: AuditEventType, limit: number = 100): Promise<AuditLog[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('event_type', eventType)
      .order('event_timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a generic audit log entry using RPC
   */
  async create(input: AuditLogInsert): Promise<string> {
    const { data, error } = await this.supabase.rpc('create_audit_log', {
      p_event_type: input.event_type,
      p_entity_type: input.entity_type,
      p_entity_id: input.entity_id || null,
      p_transaction_id: input.transaction_id || null,
      p_reference_number: input.reference_number || null,
      p_original_reference_number: input.original_reference_number || null,
      p_amount: input.amount || null,
      p_previous_amount: input.previous_amount || null,
      p_previous_state: input.previous_state || null,
      p_new_state: input.new_state || null,
      p_changes: input.changes || null,
      p_reason: input.reason || null,
      p_notes: input.notes || null,
      p_metadata: input.metadata || null,
      p_client_ip: input.client_ip || null,
      p_user_agent: input.user_agent || null
    });

    if (error) throw error;
    return data as string;
  }

  /**
   * Log a sale audit event using specialized RPC
   */
  async logSaleAudit(input: SaleAuditInput): Promise<string> {
    const { data, error } = await this.supabase.rpc('log_sale_audit', {
      p_event_type: input.eventType,
      p_sale_id: input.saleId,
      p_product_id: input.productId,
      p_amount: input.amount,
      p_buyer_name: input.buyerName || null,
      p_buyer_phone: input.buyerPhone || null,
      p_items_sold: input.itemsSold || 1,
      p_client_ip: input.clientIp || null,
      p_user_agent: input.userAgent || null
    });

    if (error) throw error;
    return data as string;
  }

  /**
   * Log a refund audit event using specialized RPC
   */
  async logRefundAudit(input: RefundAuditInput): Promise<string> {
    const { data, error } = await this.supabase.rpc('log_refund_audit', {
      p_event_type: input.eventType,
      p_refund_id: input.refundId,
      p_original_receipt_id: input.originalReceiptId,
      p_refund_number: input.refundNumber,
      p_original_receipt_number: input.originalReceiptNumber,
      p_refund_amount: input.refundAmount,
      p_refund_reason: input.refundReason,
      p_approving_user_id: input.approvingUserId || null,
      p_is_partial: input.isPartial || false,
      p_client_ip: input.clientIp || null,
      p_user_agent: input.userAgent || null
    });

    if (error) throw error;
    return data as string;
  }

  /**
   * Log a permission change audit event using specialized RPC
   */
  async logPermissionChangeAudit(input: PermissionChangeAuditInput): Promise<string> {
    const { data, error } = await this.supabase.rpc('log_permission_change_audit', {
      p_target_user_id: input.targetUserId,
      p_previous_role: input.previousRole,
      p_new_role: input.newRole,
      p_admin_user_id: input.adminUserId,
      p_reason: input.reason || null,
      p_client_ip: input.clientIp || null,
      p_user_agent: input.userAgent || null
    });

    if (error) throw error;
    return data as string;
  }

  /**
   * Log an inventory audit event using specialized RPC
   */
  async logInventoryAudit(input: InventoryAuditInput): Promise<string> {
    const { data, error } = await this.supabase.rpc('log_inventory_audit', {
      p_event_type: input.eventType,
      p_product_id: input.productId,
      p_previous_status: input.previousStatus,
      p_new_status: input.newStatus,
      p_sale_id: input.saleId || null,
      p_refund_id: input.refundId || null,
      p_notes: input.notes || null,
      p_client_ip: input.clientIp || null,
      p_user_agent: input.userAgent || null
    });

    if (error) throw error;
    return data as string;
  }

  /**
   * Count audit logs with optional filtering
   */
  async count(options?: {
    startDate?: string;
    endDate?: string;
    eventTypes?: AuditEventType[];
    userId?: string;
    entityType?: string;
  }): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (options?.startDate) {
      query = query.gte('event_timestamp', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('event_timestamp', options.endDate);
    }
    if (options?.eventTypes && options.eventTypes.length > 0) {
      query = query.in('event_type', options.eventTypes);
    }
    if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }
    if (options?.entityType) {
      query = query.eq('entity_type', options.entityType);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get event counts by type for statistics
   */
  async getEventCountsByType(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<Record<string, number>> {
    let query = this.supabase
      .from(this.tableName)
      .select('event_type');

    if (options?.startDate) {
      query = query.gte('event_timestamp', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('event_timestamp', options.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const counts: Record<string, number> = {};
    (data || []).forEach((log: { event_type: string }) => {
      counts[log.event_type] = (counts[log.event_type] || 0) + 1;
    });

    return counts;
  }

  /**
   * Get recent activity for dashboard
   */
  async getRecentActivity(limit: number = 10): Promise<AuditLog[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .order('event_timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Map query result to AuditLog (removes total_count)
   */
  private mapFromQueryResult(result: AuditLogQueryResult): AuditLog {
    const { total_count, ...auditLog } = result;
    return auditLog;
  }
}
