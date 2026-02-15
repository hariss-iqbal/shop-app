import { AuditLogRepository } from '../repositories/audit-log.repository';
import {
  AuditLog,
  AuditLogInsert,
  AuditEventType,
  SaleAuditInput,
  RefundAuditInput,
  PermissionChangeAuditInput,
  InventoryAuditInput
} from '../entities/audit-log.entity';
import {
  AuditLogResponseDto,
  AuditLogListResponseDto,
  AuditLogFilterDto,
  AuditLogPaginationDto,
  AuditLogSummaryDto,
  getEventTypeLabel,
  getEventTypeSeverity
} from '../dto/audit-log.dto';

/**
 * Audit Log Service
 * Business logic for Audit Log entity
 * Feature: F-014 Audit Logging and Transaction Tracking
 *
 * This service provides methods to:
 * - Query and filter audit logs
 * - Log various types of audit events (sales, refunds, permissions, inventory)
 * - Generate audit statistics and summaries
 */
export class AuditLogService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  /**
   * Find all audit logs with filtering and pagination
   */
  async findAll(
    filter?: AuditLogFilterDto,
    pagination?: AuditLogPaginationDto
  ): Promise<AuditLogListResponseDto> {
    const offset = pagination ? (pagination.page - 1) * pagination.limit : 0;
    const limit = pagination?.limit || 100;

    const result = await this.auditLogRepository.findAll({
      startDate: filter?.startDate,
      endDate: filter?.endDate,
      eventTypes: filter?.eventTypes,
      userId: filter?.userId,
      entityType: filter?.entityType,
      entityId: filter?.entityId,
      searchText: filter?.searchText,
      limit,
      offset
    });

    return {
      data: result.data.map(this.toResponseDto),
      total: result.total
    };
  }

  /**
   * Find audit log by ID
   */
  async findById(id: string): Promise<AuditLogResponseDto | null> {
    const auditLog = await this.auditLogRepository.findById(id);
    return auditLog ? this.toResponseDto(auditLog) : null;
  }

  /**
   * Find audit logs for a specific entity
   */
  async findByEntity(entityType: string, entityId: string): Promise<AuditLogResponseDto[]> {
    const auditLogs = await this.auditLogRepository.findByEntity(entityType, entityId);
    return auditLogs.map(this.toResponseDto);
  }

  /**
   * Find audit logs for a specific user
   */
  async findByUser(userId: string, limit: number = 100): Promise<AuditLogResponseDto[]> {
    const auditLogs = await this.auditLogRepository.findByUser(userId, limit);
    return auditLogs.map(this.toResponseDto);
  }

  /**
   * Log a generic audit event
   */
  async logEvent(input: AuditLogInsert): Promise<string> {
    return this.auditLogRepository.create(input);
  }

  /**
   * Log a sale transaction
   */
  async logSale(input: SaleAuditInput): Promise<string> {
    return this.auditLogRepository.logSaleAudit(input);
  }

  /**
   * Log a refund transaction
   */
  async logRefund(input: RefundAuditInput): Promise<string> {
    return this.auditLogRepository.logRefundAudit(input);
  }

  /**
   * Log a permission change
   */
  async logPermissionChange(input: PermissionChangeAuditInput): Promise<string> {
    return this.auditLogRepository.logPermissionChangeAudit(input);
  }

  /**
   * Log an inventory change
   */
  async logInventoryChange(input: InventoryAuditInput): Promise<string> {
    return this.auditLogRepository.logInventoryAudit(input);
  }

  /**
   * Get summary statistics for audit logs
   */
  async getSummary(
    filter?: AuditLogFilterDto
  ): Promise<AuditLogSummaryDto> {
    const [totalEvents, eventsByType, recentLogs] = await Promise.all([
      this.auditLogRepository.count({
        startDate: filter?.startDate,
        endDate: filter?.endDate,
        eventTypes: filter?.eventTypes,
        userId: filter?.userId,
        entityType: filter?.entityType
      }),
      this.auditLogRepository.getEventCountsByType({
        startDate: filter?.startDate,
        endDate: filter?.endDate
      }),
      this.auditLogRepository.getRecentActivity(10)
    ]);

    // Group events by user
    const eventsByUserResult = await this.auditLogRepository.findAll({
      startDate: filter?.startDate,
      endDate: filter?.endDate,
      limit: 1000
    });

    const userCounts: Record<string, { email: string; count: number }> = {};
    eventsByUserResult.data.forEach(log => {
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

    return {
      totalEvents,
      eventsByType,
      eventsByUser,
      recentActivity: recentLogs.map(this.toResponseDto)
    };
  }

  /**
   * Get recent activity for dashboard
   */
  async getRecentActivity(limit: number = 10): Promise<AuditLogResponseDto[]> {
    const auditLogs = await this.auditLogRepository.getRecentActivity(limit);
    return auditLogs.map(this.toResponseDto);
  }

  /**
   * Generate a human-readable event description
   */
  private generateEventDescription(auditLog: AuditLog): string {
    const label = getEventTypeLabel(auditLog.event_type);
    const userInfo = auditLog.user_email || 'System';
    const amountInfo = auditLog.amount ? ` ($${auditLog.amount.toFixed(2)})` : '';
    const entityInfo = auditLog.entity_id ? ` [${auditLog.entity_type}: ${auditLog.entity_id.slice(0, 8)}...]` : '';

    switch (auditLog.event_type) {
      case 'sale_created':
      case 'batch_sale_completed':
        return `${label}${amountInfo} by ${userInfo}${entityInfo}`;

      case 'refund_completed':
      case 'partial_refund_completed':
        return `${label}${amountInfo} - ${auditLog.reason || 'No reason provided'} by ${userInfo}`;

      case 'user_role_changed':
        const fromRole = auditLog.previous_state?.['role'] || 'unknown';
        const toRole = auditLog.new_state?.['role'] || 'unknown';
        return `${label}: ${fromRole} → ${toRole} by ${userInfo}`;

      case 'inventory_deducted':
      case 'inventory_restored':
      case 'product_status_changed':
        const fromStatus = auditLog.previous_state?.['status'] || 'unknown';
        const toStatus = auditLog.new_state?.['status'] || 'unknown';
        return `${label}: ${fromStatus} → ${toStatus}${entityInfo}`;

      default:
        return `${label}${entityInfo} by ${userInfo}`;
    }
  }

  /**
   * Convert AuditLog entity to response DTO
   */
  private toResponseDto = (auditLog: AuditLog): AuditLogResponseDto => {
    return {
      id: auditLog.id,
      eventType: auditLog.event_type,
      eventTimestamp: auditLog.event_timestamp,
      userId: auditLog.user_id,
      userEmail: auditLog.user_email,
      userRole: auditLog.user_role,
      clientIp: auditLog.client_ip,
      entityType: auditLog.entity_type,
      entityId: auditLog.entity_id,
      transactionId: auditLog.transaction_id,
      referenceNumber: auditLog.reference_number,
      originalReferenceNumber: auditLog.original_reference_number,
      amount: auditLog.amount,
      previousAmount: auditLog.previous_amount,
      previousState: auditLog.previous_state,
      newState: auditLog.new_state,
      changes: auditLog.changes,
      reason: auditLog.reason,
      notes: auditLog.notes,
      metadata: auditLog.metadata,
      createdAt: auditLog.created_at,
      eventDescription: this.generateEventDescription(auditLog)
    };
  };
}
