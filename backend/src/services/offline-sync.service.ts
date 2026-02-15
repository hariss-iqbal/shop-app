import { OfflineSyncLogRepository } from '../repositories/offline-sync-log.repository';
import { SaleRepository } from '../repositories/sale.repository';
import { ProductRepository } from '../repositories/product.repository';
import { OfflineSyncLogInsert } from '../entities/offline-sync-log.entity';
import {
  SyncBatchRequestDto,
  SyncBatchResponseDto,
  SyncItemResultDto,
  OfflineSaleDto,
  SyncLogFilterDto,
  SyncLogListResponseDto,
  OfflineSyncLogDto,
  SyncStatsDto,
  ConflictCheckRequestDto,
  ConflictCheckResponseDto,
  ResolveConflictDto,
  ResolveConflictResponseDto
} from '../dto/offline-sync.dto';

/**
 * Offline Sync Service
 * Feature: F-020 Offline Mode and Sync
 *
 * Handles synchronization of offline operations with the server.
 * Processes batches of offline sales, detects conflicts, and logs sync activity.
 */
export class OfflineSyncService {
  constructor(
    private readonly syncLogRepository: OfflineSyncLogRepository,
    private readonly saleRepository: SaleRepository,
    private readonly productRepository: ProductRepository
  ) {}

  /**
   * Process a batch of offline operations
   */
  async processBatch(
    request: SyncBatchRequestDto,
    userId: string,
    clientIp?: string,
    userAgent?: string
  ): Promise<SyncBatchResponseDto> {
    const results: SyncItemResultDto[] = [];
    let syncedCount = 0;
    let failedCount = 0;
    let conflictCount = 0;

    // Process sales
    if (request.sales && request.sales.length > 0) {
      for (const sale of request.sales) {
        const result = await this.processSale(sale, userId, clientIp, userAgent, request.deviceId);
        results.push(result);

        if (result.success) {
          syncedCount++;
        } else if (result.conflictType) {
          conflictCount++;
        } else {
          failedCount++;
        }
      }
    }

    // Process WhatsApp messages (log only - actual sending happens client-side)
    if (request.whatsappMessages && request.whatsappMessages.length > 0) {
      for (const message of request.whatsappMessages) {
        await this.logWhatsAppMessage(message, userId, clientIp, userAgent, request.deviceId);
        results.push({
          localId: message.localId,
          serverId: `whatsapp_${message.localId}`,
          success: true
        });
        syncedCount++;
      }
    }

    return {
      success: failedCount === 0 && conflictCount === 0,
      totalItems: results.length,
      syncedItems: syncedCount,
      failedItems: failedCount,
      conflictItems: conflictCount,
      results,
      serverTimestamp: new Date().toISOString()
    };
  }

  /**
   * Process a single offline sale
   */
  private async processSale(
    sale: OfflineSaleDto,
    userId: string,
    clientIp?: string,
    userAgent?: string,
    deviceId?: string
  ): Promise<SyncItemResultDto> {
    // Create sync log entry
    const logEntry: OfflineSyncLogInsert = {
      user_id: userId,
      operation_type: 'CREATE_SALE',
      local_id: sale.localId,
      status: 'syncing',
      payload: sale,
      created_offline_at: sale.createdOfflineAt,
      device_id: deviceId || null,
      client_ip: clientIp || null,
      user_agent: userAgent || null
    };

    const log = await this.syncLogRepository.create(logEntry);

    try {
      // Check if product is available
      const product = await this.productRepository.findById(sale.productId);

      if (!product) {
        await this.syncLogRepository.markAsConflict(
          log.id,
          'PRODUCT_NOT_AVAILABLE',
          'The product no longer exists in the system'
        );
        return {
          localId: sale.localId,
          success: false,
          conflictType: 'PRODUCT_NOT_AVAILABLE',
          conflictDetails: 'The product no longer exists in the system'
        };
      }

      if (product.status !== 'available') {
        await this.syncLogRepository.markAsConflict(
          log.id,
          'PRODUCT_ALREADY_SOLD',
          `Product is currently marked as "${product.status}"`
        );
        return {
          localId: sale.localId,
          success: false,
          conflictType: 'PRODUCT_ALREADY_SOLD',
          conflictDetails: `Product is currently marked as "${product.status}"`,
          serverData: { productId: product.id, currentStatus: product.status }
        };
      }

      // Process the sale
      const result = await this.saleRepository.completeSaleWithInventoryDeduction(
        sale.productId,
        sale.saleDate,
        sale.salePrice,
        sale.buyerName,
        sale.buyerPhone,
        sale.buyerEmail,
        sale.notes ? `[Offline Sale - ${sale.localReceiptNumber}] ${sale.notes}` : `[Offline Sale - ${sale.localReceiptNumber}]`
      );

      if (!result.success) {
        await this.syncLogRepository.markAsFailed(log.id);
        return {
          localId: sale.localId,
          success: false,
          error: result.error || 'Failed to create sale'
        };
      }

      await this.syncLogRepository.markAsSynced(log.id, result.saleId!);

      return {
        localId: sale.localId,
        serverId: result.saleId!,
        success: true
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.syncLogRepository.markAsFailed(log.id);

      return {
        localId: sale.localId,
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Log a WhatsApp message send attempt
   */
  private async logWhatsAppMessage(
    message: any,
    userId: string,
    clientIp?: string,
    userAgent?: string,
    deviceId?: string
  ): Promise<void> {
    const logEntry: OfflineSyncLogInsert = {
      user_id: userId,
      operation_type: 'SEND_WHATSAPP',
      local_id: message.localId,
      server_id: `whatsapp_${message.localId}`,
      status: 'synced',
      payload: message,
      created_offline_at: message.createdOfflineAt,
      synced_at: new Date().toISOString(),
      device_id: deviceId || null,
      client_ip: clientIp || null,
      user_agent: userAgent || null
    };

    await this.syncLogRepository.create(logEntry);
  }

  /**
   * Check for potential conflicts before syncing
   */
  async checkConflicts(request: ConflictCheckRequestDto): Promise<ConflictCheckResponseDto> {
    const conflicts: ConflictCheckResponseDto['conflicts'] = [];

    // Check product availability
    for (const productId of request.productIds) {
      const product = await this.productRepository.findById(productId);

      if (!product) {
        conflicts.push({
          type: 'product',
          id: productId,
          reason: 'Product not found in inventory'
        });
      } else if (product.status !== 'available') {
        conflicts.push({
          type: 'product',
          id: productId,
          reason: `Product is marked as "${product.status}"`,
          currentStatus: product.status
        });
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  }

  /**
   * Get sync logs with optional filtering
   */
  async getSyncLogs(filter?: SyncLogFilterDto): Promise<SyncLogListResponseDto> {
    const { data, total } = await this.syncLogRepository.findAll({
      userId: filter?.userId,
      status: filter?.status,
      operationType: filter?.operationType,
      startDate: filter?.startDate,
      endDate: filter?.endDate,
      limit: filter?.limit,
      offset: filter?.offset
    });

    return {
      data: data.map(this.toLogDto),
      total
    };
  }

  /**
   * Get sync statistics
   */
  async getStats(userId?: string): Promise<SyncStatsDto> {
    const stats = await this.syncLogRepository.getStats(userId);
    const pendingCount = await this.syncLogRepository.countByStatus('pending', userId);

    return {
      totalSynced: stats.totalSynced,
      totalFailed: stats.totalFailed,
      totalConflicts: stats.totalConflicts,
      lastSyncAt: stats.lastSyncAt,
      pendingCount
    };
  }

  /**
   * Resolve a sync conflict
   */
  async resolveConflict(request: ResolveConflictDto, userId: string): Promise<ResolveConflictResponseDto> {
    const log = await this.syncLogRepository.findById(request.syncLogId);

    if (!log) {
      return {
        success: false,
        message: 'Sync log not found',
        error: 'NOT_FOUND'
      };
    }

    if (log.status !== 'conflict') {
      return {
        success: false,
        message: 'Log is not in conflict state',
        error: 'INVALID_STATE'
      };
    }

    switch (request.resolution) {
      case 'DISCARD':
        await this.syncLogRepository.update(log.id, {
          status: 'failed',
          conflict_details: 'Discarded by user'
        });
        return {
          success: true,
          message: 'Conflict discarded successfully'
        };

      case 'GENERATE_NEW_NUMBER':
        // Re-process the sale with a new receipt number
        const salePayload = log.payload as OfflineSaleDto;
        salePayload.localReceiptNumber = request.newReceiptNumber ||
          `SYNC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const result = await this.processSale(
          salePayload,
          userId
        );

        if (result.success) {
          await this.syncLogRepository.update(log.id, {
            status: 'synced',
            server_id: result.serverId,
            synced_at: new Date().toISOString(),
            conflict_details: `Resolved with new receipt number: ${salePayload.localReceiptNumber}`
          });
          return {
            success: true,
            message: 'Conflict resolved with new receipt number',
            newServerId: result.serverId
          };
        } else {
          return {
            success: false,
            message: result.error || 'Failed to resolve conflict',
            error: result.conflictType || 'SYNC_FAILED'
          };
        }

      case 'KEEP_SERVER':
        await this.syncLogRepository.update(log.id, {
          status: 'failed',
          conflict_details: 'User chose to keep server version'
        });
        return {
          success: true,
          message: 'Server version kept, offline operation discarded'
        };

      default:
        return {
          success: false,
          message: 'Unknown resolution action',
          error: 'INVALID_ACTION'
        };
    }
  }

  /**
   * Cleanup old sync logs
   */
  async cleanup(daysToKeep: number = 30): Promise<number> {
    return this.syncLogRepository.cleanupOldLogs(daysToKeep);
  }

  private toLogDto(log: any): OfflineSyncLogDto {
    return {
      id: log.id,
      userId: log.user_id,
      operationType: log.operation_type,
      localId: log.local_id,
      serverId: log.server_id,
      status: log.status,
      conflictType: log.conflict_type,
      conflictDetails: log.conflict_details,
      payload: log.payload,
      createdOfflineAt: log.created_offline_at,
      syncedAt: log.synced_at,
      deviceId: log.device_id,
      clientIp: log.client_ip,
      userAgent: log.user_agent,
      createdAt: log.created_at,
      updatedAt: log.updated_at
    };
  }
}
