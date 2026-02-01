import { AuditLogService } from '../services/audit-log.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import {
  AuditLogResponseDto,
  AuditLogListResponseDto,
  AuditLogFilterDto,
  AuditLogPaginationDto,
  AuditLogSummaryDto,
  CreateSaleAuditLogDto,
  CreateRefundAuditLogDto,
  CreatePermissionChangeAuditLogDto,
  CreateInventoryAuditLogDto
} from '../dto/audit-log.dto';
import { AuditEventType } from '../entities/audit-log.entity';

/**
 * Audit Log Controller
 * HTTP request handling for Audit Log entity
 * Routes: /api/audit-logs
 *
 * Feature: F-014 Audit Logging and Transaction Tracking
 *
 * Security:
 * - All audit logs are read-only (cannot be modified or deleted)
 * - Only authenticated users can view audit logs
 * - Admin role required to access the audit log viewer
 */
export class AuditLogController {
  private readonly sanitizer = new InputSanitizationService();

  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * Get all audit logs with filtering and pagination
   */
  async getAll(
    filter?: AuditLogFilterDto,
    pagination?: AuditLogPaginationDto
  ): Promise<AuditLogListResponseDto> {
    const sanitizedFilter = this.sanitizeFilterDto(filter);
    return this.auditLogService.findAll(sanitizedFilter, pagination);
  }

  /**
   * Get a single audit log by ID
   */
  async getById(id: string): Promise<AuditLogResponseDto> {
    const auditLog = await this.auditLogService.findById(id);
    if (!auditLog) {
      throw new Error('Audit log not found');
    }
    return auditLog;
  }

  /**
   * Get audit logs for a specific entity
   */
  async getByEntity(entityType: string, entityId: string): Promise<AuditLogResponseDto[]> {
    if (!entityType || !entityId) {
      throw new Error('Entity type and ID are required');
    }
    return this.auditLogService.findByEntity(entityType, entityId);
  }

  /**
   * Get audit logs for a specific user
   */
  async getByUser(userId: string, limit?: number): Promise<AuditLogResponseDto[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.auditLogService.findByUser(userId, limit || 100);
  }

  /**
   * Get audit log summary for dashboard
   */
  async getSummary(filter?: AuditLogFilterDto): Promise<AuditLogSummaryDto> {
    const sanitizedFilter = this.sanitizeFilterDto(filter);
    return this.auditLogService.getSummary(sanitizedFilter);
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit?: number): Promise<AuditLogResponseDto[]> {
    return this.auditLogService.getRecentActivity(limit || 10);
  }

  /**
   * Log a sale audit event
   */
  async logSale(dto: CreateSaleAuditLogDto): Promise<{ auditLogId: string }> {
    this.validateSaleAuditDto(dto);
    const auditLogId = await this.auditLogService.logSale({
      eventType: dto.eventType,
      saleId: dto.saleId,
      phoneId: dto.phoneId,
      amount: dto.amount,
      buyerName: dto.buyerName,
      buyerPhone: dto.buyerPhone,
      itemsSold: dto.itemsSold,
      clientIp: dto.clientIp,
      userAgent: dto.userAgent
    });
    return { auditLogId };
  }

  /**
   * Log a refund audit event
   */
  async logRefund(dto: CreateRefundAuditLogDto): Promise<{ auditLogId: string }> {
    this.validateRefundAuditDto(dto);
    const auditLogId = await this.auditLogService.logRefund({
      eventType: dto.eventType,
      refundId: dto.refundId,
      originalReceiptId: dto.originalReceiptId,
      refundNumber: dto.refundNumber,
      originalReceiptNumber: dto.originalReceiptNumber,
      refundAmount: dto.refundAmount,
      refundReason: dto.refundReason,
      approvingUserId: dto.approvingUserId,
      isPartial: dto.isPartial,
      clientIp: dto.clientIp,
      userAgent: dto.userAgent
    });
    return { auditLogId };
  }

  /**
   * Log a permission change audit event
   */
  async logPermissionChange(dto: CreatePermissionChangeAuditLogDto): Promise<{ auditLogId: string }> {
    this.validatePermissionChangeAuditDto(dto);
    const auditLogId = await this.auditLogService.logPermissionChange({
      targetUserId: dto.targetUserId,
      previousRole: dto.previousRole,
      newRole: dto.newRole,
      adminUserId: dto.adminUserId,
      reason: dto.reason,
      clientIp: dto.clientIp,
      userAgent: dto.userAgent
    });
    return { auditLogId };
  }

  /**
   * Log an inventory audit event
   */
  async logInventoryChange(dto: CreateInventoryAuditLogDto): Promise<{ auditLogId: string }> {
    this.validateInventoryAuditDto(dto);
    const auditLogId = await this.auditLogService.logInventoryChange({
      eventType: dto.eventType,
      phoneId: dto.phoneId,
      previousStatus: dto.previousStatus,
      newStatus: dto.newStatus,
      saleId: dto.saleId,
      refundId: dto.refundId,
      notes: dto.notes,
      clientIp: dto.clientIp,
      userAgent: dto.userAgent
    });
    return { auditLogId };
  }

  /**
   * Get available event types for filtering
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
      label: this.formatEventTypeLabel(type)
    }));
  }

  private formatEventTypeLabel(eventType: AuditEventType): string {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private sanitizeFilterDto(filter?: AuditLogFilterDto): AuditLogFilterDto | undefined {
    if (!filter) return undefined;
    return {
      ...filter,
      searchText: filter.searchText ? this.sanitizer.sanitizeString(filter.searchText) : undefined
    };
  }

  private validateSaleAuditDto(dto: CreateSaleAuditLogDto): void {
    if (!dto.eventType) {
      throw new Error('Event type is required');
    }
    if (!dto.saleId) {
      throw new Error('Sale ID is required');
    }
    if (!dto.phoneId) {
      throw new Error('Phone ID is required');
    }
    if (dto.amount === undefined || dto.amount < 0) {
      throw new Error('Valid amount is required');
    }
  }

  private validateRefundAuditDto(dto: CreateRefundAuditLogDto): void {
    if (!dto.eventType) {
      throw new Error('Event type is required');
    }
    if (!dto.refundId) {
      throw new Error('Refund ID is required');
    }
    if (!dto.refundNumber) {
      throw new Error('Refund number is required');
    }
    if (dto.refundAmount === undefined || dto.refundAmount < 0) {
      throw new Error('Valid refund amount is required');
    }
    if (!dto.refundReason) {
      throw new Error('Refund reason is required');
    }
  }

  private validatePermissionChangeAuditDto(dto: CreatePermissionChangeAuditLogDto): void {
    if (!dto.targetUserId) {
      throw new Error('Target user ID is required');
    }
    if (!dto.previousRole) {
      throw new Error('Previous role is required');
    }
    if (!dto.newRole) {
      throw new Error('New role is required');
    }
    if (!dto.adminUserId) {
      throw new Error('Admin user ID is required');
    }
  }

  private validateInventoryAuditDto(dto: CreateInventoryAuditLogDto): void {
    if (!dto.eventType) {
      throw new Error('Event type is required');
    }
    if (!dto.phoneId) {
      throw new Error('Phone ID is required');
    }
    if (!dto.previousStatus) {
      throw new Error('Previous status is required');
    }
    if (!dto.newStatus) {
      throw new Error('New status is required');
    }
  }
}
