import { OfflineSyncService } from '../services/offline-sync.service';
import { AuditLogService } from '../services/audit-log.service';
import {
  SyncBatchRequestDto,
  SyncBatchResponseDto,
  SyncLogFilterDto,
  SyncLogListResponseDto,
  SyncStatsDto,
  ConflictCheckRequestDto,
  ConflictCheckResponseDto,
  ResolveConflictDto,
  ResolveConflictResponseDto
} from '../dto/offline-sync.dto';

/**
 * Offline Sync Controller
 * Feature: F-020 Offline Mode and Sync
 *
 * HTTP request handling for offline synchronization operations.
 * Routes: /api/sync
 *
 * Security: All operations require authentication.
 * Audit: Sync operations are logged for tracking.
 */
export class OfflineSyncController {
  constructor(
    private readonly syncService: OfflineSyncService,
    private readonly auditLogService?: AuditLogService
  ) {}

  /**
   * Process a batch of offline operations
   * POST /api/sync/batch
   */
  async syncBatch(
    dto: SyncBatchRequestDto,
    userId: string,
    clientIp?: string,
    userAgent?: string
  ): Promise<SyncBatchResponseDto> {
    this.validateBatchRequest(dto);

    const result = await this.syncService.processBatch(dto, userId, clientIp, userAgent);

    // Log sync operation to audit log
    if (this.auditLogService) {
      try {
        await this.auditLogService.log({
          eventType: 'offline_sync',
          userId,
          metadata: {
            totalItems: result.totalItems,
            syncedItems: result.syncedItems,
            failedItems: result.failedItems,
            conflictItems: result.conflictItems,
            deviceId: dto.deviceId,
            clientTimestamp: dto.clientTimestamp
          },
          clientIp,
          userAgent
        });
      } catch (error) {
        console.error('Failed to log sync audit:', error);
      }
    }

    return result;
  }

  /**
   * Check for potential conflicts before syncing
   * POST /api/sync/check-conflicts
   */
  async checkConflicts(dto: ConflictCheckRequestDto): Promise<ConflictCheckResponseDto> {
    if (!dto.productIds || dto.productIds.length === 0) {
      return { hasConflicts: false, conflicts: [] };
    }

    return this.syncService.checkConflicts(dto);
  }

  /**
   * Get sync logs for the current user
   * GET /api/sync/logs
   */
  async getLogs(filter?: SyncLogFilterDto): Promise<SyncLogListResponseDto> {
    return this.syncService.getSyncLogs(filter);
  }

  /**
   * Get sync statistics
   * GET /api/sync/stats
   */
  async getStats(userId?: string): Promise<SyncStatsDto> {
    return this.syncService.getStats(userId);
  }

  /**
   * Resolve a sync conflict
   * POST /api/sync/resolve
   */
  async resolveConflict(
    dto: ResolveConflictDto,
    userId: string,
    clientIp?: string,
    userAgent?: string
  ): Promise<ResolveConflictResponseDto> {
    if (!dto.syncLogId) {
      return {
        success: false,
        message: 'Sync log ID is required',
        error: 'MISSING_ID'
      };
    }

    if (!dto.resolution) {
      return {
        success: false,
        message: 'Resolution action is required',
        error: 'MISSING_RESOLUTION'
      };
    }

    const validResolutions = ['KEEP_LOCAL', 'KEEP_SERVER', 'GENERATE_NEW_NUMBER', 'MERGE', 'DISCARD'];
    if (!validResolutions.includes(dto.resolution)) {
      return {
        success: false,
        message: `Invalid resolution. Must be one of: ${validResolutions.join(', ')}`,
        error: 'INVALID_RESOLUTION'
      };
    }

    const result = await this.syncService.resolveConflict(dto, userId);

    // Log conflict resolution to audit log
    if (result.success && this.auditLogService) {
      try {
        await this.auditLogService.log({
          eventType: 'conflict_resolved',
          userId,
          metadata: {
            syncLogId: dto.syncLogId,
            resolution: dto.resolution,
            newServerId: result.newServerId
          },
          clientIp,
          userAgent
        });
      } catch (error) {
        console.error('Failed to log conflict resolution audit:', error);
      }
    }

    return result;
  }

  /**
   * Cleanup old sync logs (admin only)
   * POST /api/sync/cleanup
   */
  async cleanup(daysToKeep: number = 30): Promise<{ deletedCount: number }> {
    if (daysToKeep < 1 || daysToKeep > 365) {
      throw new Error('Days to keep must be between 1 and 365');
    }

    const deletedCount = await this.syncService.cleanup(daysToKeep);
    return { deletedCount };
  }

  private validateBatchRequest(dto: SyncBatchRequestDto): void {
    if (!dto.clientTimestamp) {
      throw new Error('Client timestamp is required');
    }

    const totalItems = (dto.sales?.length || 0) + (dto.whatsappMessages?.length || 0);
    if (totalItems === 0) {
      throw new Error('At least one item is required for sync');
    }

    if (totalItems > 100) {
      throw new Error('Maximum 100 items per sync batch');
    }

    // Validate sales
    if (dto.sales) {
      for (const sale of dto.sales) {
        if (!sale.localId) {
          throw new Error('Local ID is required for each sale');
        }
        if (!sale.productId) {
          throw new Error('Product ID is required for each sale');
        }
        if (!sale.saleDate) {
          throw new Error('Sale date is required for each sale');
        }
        if (sale.salePrice === undefined || sale.salePrice < 0) {
          throw new Error('Valid sale price is required for each sale');
        }
        if (!sale.createdOfflineAt) {
          throw new Error('Created offline timestamp is required for each sale');
        }
      }
    }

    // Validate WhatsApp messages
    if (dto.whatsappMessages) {
      for (const message of dto.whatsappMessages) {
        if (!message.localId) {
          throw new Error('Local ID is required for each WhatsApp message');
        }
        if (!message.phoneNumber) {
          throw new Error('Phone number is required for each WhatsApp message');
        }
        if (!message.message) {
          throw new Error('Message content is required for each WhatsApp message');
        }
      }
    }
  }
}
