import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  AuditLog,
  AuditLogListResponse,
  AuditLogFilter,
  AuditLogPagination,
  AuditLogSummary,
  AuditEventType,
  getEventTypeLabel
} from '../../models/audit-log.model';

export interface AuthAuditInput {
  eventType: 'user_logged_in' | 'user_logged_out';
  clientIp?: string;
  userAgent?: string;
}

/**
 * Audit Log Service
 * Handles audit log operations for compliance and security tracking
 * Feature: F-014 Audit Logging and Transaction Tracking
 *
 * Note: Audit logs are immutable - they cannot be modified or deleted.
 * Only read operations are supported.
 */
@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private supabase = inject(SupabaseService);

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(
    filter?: AuditLogFilter,
    pagination?: AuditLogPagination
  ): Promise<AuditLogListResponse> {
    const limit = pagination?.limit || 100;
    const offset = pagination ? (pagination.page - 1) * pagination.limit : 0;

    const { data, error } = await this.supabase.client.rpc('get_audit_logs', {
      p_start_date: filter?.startDate || null,
      p_end_date: filter?.endDate || null,
      p_event_types: filter?.eventTypes || null,
      p_user_id: filter?.userId || null,
      p_entity_type: filter?.entityType || null,
      p_entity_id: filter?.entityId || null,
      p_search_text: filter?.searchText || null,
      p_limit: limit,
      p_offset: offset
    });

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    const results = data || [];
    const total = results.length > 0 ? Number(results[0].total_count) : 0;

    return {
      data: results.map(this.mapToAuditLog),
      total
    };
  }

  /**
   * Get a single audit log by ID
   */
  async getAuditLogById(id: string): Promise<AuditLog | null> {
    const { data, error } = await this.supabase.client
      .from('audit_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch audit log: ${error.message}`);
    }

    return data ? this.mapToAuditLog(data) : null;
  }

  /**
   * Get audit logs for a specific entity
   */
  async getAuditLogsByEntity(
    entityType: string,
    entityId: string
  ): Promise<AuditLog[]> {
    const { data, error } = await this.supabase.client
      .from('audit_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('event_timestamp', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch audit logs for entity: ${error.message}`);
    }

    return (data || []).map(this.mapToAuditLog);
  }

  /**
   * Get audit logs for a specific user
   */
  async getAuditLogsByUser(userId: string, limit: number = 100): Promise<AuditLog[]> {
    const { data, error } = await this.supabase.client
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('event_timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch audit logs for user: ${error.message}`);
    }

    return (data || []).map(this.mapToAuditLog);
  }

  /**
   * Get recent activity for dashboard
   */
  async getRecentActivity(limit: number = 10): Promise<AuditLog[]> {
    const { data, error } = await this.supabase.client
      .from('audit_logs')
      .select('*')
      .order('event_timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent activity: ${error.message}`);
    }

    return (data || []).map(this.mapToAuditLog);
  }

  /**
   * Get audit log summary statistics
   */
  async getSummary(filter?: AuditLogFilter): Promise<AuditLogSummary> {
    // Get total count
    let countQuery = this.supabase.client
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    if (filter?.startDate) {
      countQuery = countQuery.gte('event_timestamp', filter.startDate);
    }
    if (filter?.endDate) {
      countQuery = countQuery.lte('event_timestamp', filter.endDate);
    }

    const { count } = await countQuery;

    // Get events by type
    let typeQuery = this.supabase.client
      .from('audit_logs')
      .select('event_type');

    if (filter?.startDate) {
      typeQuery = typeQuery.gte('event_timestamp', filter.startDate);
    }
    if (filter?.endDate) {
      typeQuery = typeQuery.lte('event_timestamp', filter.endDate);
    }

    const { data: typeData } = await typeQuery;

    const eventsByType: Record<string, number> = {};
    (typeData || []).forEach((log: { event_type: string }) => {
      eventsByType[log.event_type] = (eventsByType[log.event_type] || 0) + 1;
    });

    // Get events by user
    let userQuery = this.supabase.client
      .from('audit_logs')
      .select('user_id, user_email');

    if (filter?.startDate) {
      userQuery = userQuery.gte('event_timestamp', filter.startDate);
    }
    if (filter?.endDate) {
      userQuery = userQuery.lte('event_timestamp', filter.endDate);
    }

    const { data: userData } = await userQuery;

    const userCounts: Record<string, { email: string; count: number }> = {};
    (userData || []).forEach((log: { user_id: string; user_email: string }) => {
      if (log.user_id) {
        if (!userCounts[log.user_id]) {
          userCounts[log.user_id] = {
            email: log.user_email || 'Unknown',
            count: 0
          };
        }
        userCounts[log.user_id].count++;
      }
    });

    const eventsByUser = Object.entries(userCounts)
      .map(([userId, data]) => ({
        userId,
        userEmail: data.email,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get recent activity
    const recentActivity = await this.getRecentActivity(10);

    return {
      totalEvents: count || 0,
      eventsByType,
      eventsByUser,
      recentActivity
    };
  }

  /**
   * Get available event types for dropdown
   */
  getEventTypes(): { value: AuditEventType; label: string }[] {
    const eventTypes: AuditEventType[] = [
      'sale_created',
      'sale_updated',
      'sale_deleted',
      'batch_sale_completed',
      'refund_initiated',
      'refund_completed',
      'refund_cancelled',
      'partial_refund_completed',
      'inventory_deducted',
      'inventory_restored',
      'phone_status_changed',
      'phone_created',
      'phone_updated',
      'phone_deleted',
      'user_role_assigned',
      'user_role_changed',
      'user_role_revoked',
      'user_logged_in',
      'user_logged_out',
      'receipt_created',
      'receipt_sent',
      'receipt_resent',
      'settings_changed',
      'stock_alert_triggered',
      'system_config_changed'
    ];

    return eventTypes.map(type => ({
      value: type,
      label: getEventTypeLabel(type)
    }));
  }

  /**
   * Get entity types for dropdown
   */
  getEntityTypes(): { value: string; label: string }[] {
    return [
      { value: 'sale', label: 'Sale' },
      { value: 'refund', label: 'Refund' },
      { value: 'phone', label: 'Phone' },
      { value: 'user_role', label: 'User Role' },
      { value: 'receipt', label: 'Receipt' },
      { value: 'settings', label: 'Settings' }
    ];
  }

  /**
   * Export audit logs to CSV format
   */
  async exportToCsv(filter?: AuditLogFilter): Promise<string> {
    const result = await this.getAuditLogs(filter, { page: 1, limit: 10000 });

    const headers = [
      'ID',
      'Event Type',
      'Timestamp',
      'User Email',
      'User Role',
      'Entity Type',
      'Entity ID',
      'Amount',
      'Reason',
      'Client IP',
      'Description'
    ];

    const rows = result.data.map(log => [
      log.id,
      getEventTypeLabel(log.eventType),
      new Date(log.eventTimestamp).toLocaleString(),
      log.userEmail || '',
      log.userRole || '',
      log.entityType,
      log.entityId || '',
      log.amount?.toString() || '',
      log.reason || '',
      log.clientIp || '',
      log.eventDescription || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Download audit logs as CSV file
   */
  async downloadCsv(filter?: AuditLogFilter): Promise<void> {
    const csv = await this.exportToCsv(filter);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Log authentication event (login/logout)
   * Called from auth service to track user authentication activities
   */
  async logAuthEvent(input: AuthAuditInput): Promise<void> {
    try {
      const { error } = await this.supabase.client.rpc('create_audit_log', {
        p_event_type: input.eventType,
        p_entity_type: 'auth',
        p_client_ip: input.clientIp || null,
        p_user_agent: input.userAgent || navigator.userAgent
      });

      if (error) {
        console.warn('Failed to log auth event:', error.message);
      }
    } catch (err) {
      // Non-blocking: auth events are logged but failures don't prevent auth operations
      console.warn('Failed to log auth event:', err);
    }
  }

  /**
   * Map database record to AuditLog model
   */
  private mapToAuditLog = (data: Record<string, unknown>): AuditLog => {
    const eventType = data['event_type'] as AuditEventType;

    return {
      id: data['id'] as string,
      eventType,
      eventTimestamp: data['event_timestamp'] as string,
      userId: data['user_id'] as string | null,
      userEmail: data['user_email'] as string | null,
      userRole: data['user_role'] as string | null,
      clientIp: data['client_ip'] as string | null,
      userAgent: data['user_agent'] as string | null,
      entityType: data['entity_type'] as string,
      entityId: data['entity_id'] as string | null,
      transactionId: data['transaction_id'] as string | null,
      referenceNumber: data['reference_number'] as string | null,
      originalReferenceNumber: data['original_reference_number'] as string | null,
      amount: data['amount'] as number | null,
      previousAmount: data['previous_amount'] as number | null,
      previousState: data['previous_state'] as Record<string, unknown> | null,
      newState: data['new_state'] as Record<string, unknown> | null,
      changes: data['changes'] as Record<string, unknown> | null,
      reason: data['reason'] as string | null,
      notes: data['notes'] as string | null,
      metadata: data['metadata'] as Record<string, unknown> | null,
      createdAt: data['created_at'] as string,
      eventDescription: this.generateEventDescription(data)
    };
  };

  /**
   * Generate human-readable event description
   */
  private generateEventDescription(data: Record<string, unknown>): string {
    const eventType = data['event_type'] as AuditEventType;
    const label = getEventTypeLabel(eventType);
    const userEmail = data['user_email'] as string | null;
    const amount = data['amount'] as number | null;
    const reason = data['reason'] as string | null;
    const previousState = data['previous_state'] as Record<string, unknown> | null;
    const newState = data['new_state'] as Record<string, unknown> | null;

    const userInfo = userEmail || 'System';
    const amountInfo = amount ? ` ($${amount.toFixed(2)})` : '';

    switch (eventType) {
      case 'sale_created':
      case 'batch_sale_completed':
        return `${label}${amountInfo} by ${userInfo}`;

      case 'refund_completed':
      case 'partial_refund_completed':
        return `${label}${amountInfo} - ${reason || 'No reason provided'} by ${userInfo}`;

      case 'user_role_changed':
        const fromRole = previousState?.['role'] || 'unknown';
        const toRole = newState?.['role'] || 'unknown';
        return `${label}: ${fromRole} to ${toRole} by ${userInfo}`;

      case 'inventory_deducted':
      case 'inventory_restored':
      case 'phone_status_changed':
        const fromStatus = previousState?.['status'] || 'unknown';
        const toStatus = newState?.['status'] || 'unknown';
        return `${label}: ${fromStatus} to ${toStatus}`;

      default:
        return `${label} by ${userInfo}`;
    }
  }
}
