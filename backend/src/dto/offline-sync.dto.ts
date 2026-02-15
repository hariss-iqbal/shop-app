import { PaymentDetailDto } from './payment.dto';

/**
 * Offline Sync DTOs
 * Feature: F-020 Offline Mode and Sync
 *
 * Data Transfer Objects for offline synchronization operations.
 */

/**
 * Types of operations that can be synced
 */
export type SyncOperationType =
  | 'CREATE_SALE'
  | 'UPDATE_SALE'
  | 'DELETE_SALE'
  | 'SEND_WHATSAPP'
  | 'CREATE_RECEIPT'
  | 'CREATE_CUSTOMER';

/**
 * Status of a sync operation
 */
export type SyncStatus =
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'conflict'
  | 'failed';

/**
 * Types of sync conflicts
 */
export type SyncConflictType =
  | 'RECEIPT_NUMBER_EXISTS'
  | 'PRODUCT_ALREADY_SOLD'
  | 'PRODUCT_NOT_AVAILABLE'
  | 'DATA_MODIFIED'
  | 'ENTITY_DELETED';

/**
 * Offline sale data for syncing
 */
export interface OfflineSaleDto {
  localId: string;
  productId: string;
  saleDate: string;
  salePrice: number;
  costPrice: number;
  buyerName: string | null;
  buyerPhone: string | null;
  buyerEmail: string | null;
  notes: string | null;
  payments?: PaymentDetailDto[];
  localReceiptNumber: string;
  taxRate: number;
  taxAmount: number;
  basePrice: number;
  isTaxExempt: boolean;
  createdOfflineAt: string;
}

/**
 * Offline WhatsApp message for syncing
 */
export interface OfflineWhatsAppDto {
  localId: string;
  phoneNumber: string;
  message: string;
  receiptNumber: string;
  customerName: string | null;
  grandTotal: number;
  createdOfflineAt: string;
}

/**
 * Request to sync multiple offline operations
 */
export interface SyncBatchRequestDto {
  sales?: OfflineSaleDto[];
  whatsappMessages?: OfflineWhatsAppDto[];
  clientTimestamp: string;
  deviceId?: string;
}

/**
 * Result of syncing a single item
 */
export interface SyncItemResultDto {
  localId: string;
  serverId?: string;
  success: boolean;
  error?: string;
  conflictType?: SyncConflictType;
  conflictDetails?: string;
  serverData?: unknown;
}

/**
 * Response from batch sync operation
 */
export interface SyncBatchResponseDto {
  success: boolean;
  totalItems: number;
  syncedItems: number;
  failedItems: number;
  conflictItems: number;
  results: SyncItemResultDto[];
  serverTimestamp: string;
}

/**
 * Request to check for conflicts before syncing
 */
export interface ConflictCheckRequestDto {
  productIds: string[];
  receiptNumbers: string[];
}

/**
 * Response from conflict check
 */
export interface ConflictCheckResponseDto {
  hasConflicts: boolean;
  conflicts: Array<{
    type: 'product' | 'receipt';
    id: string;
    reason: string;
    currentStatus?: string;
  }>;
}

/**
 * Offline sync log entry - stored in database
 */
export interface OfflineSyncLogDto {
  id: string;
  userId: string;
  operationType: SyncOperationType;
  localId: string;
  serverId: string | null;
  status: SyncStatus;
  conflictType: SyncConflictType | null;
  conflictDetails: string | null;
  payload: unknown;
  createdOfflineAt: string;
  syncedAt: string | null;
  deviceId: string | null;
  clientIp: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Create offline sync log request
 */
export interface CreateOfflineSyncLogDto {
  userId: string;
  operationType: SyncOperationType;
  localId: string;
  serverId?: string | null;
  status: SyncStatus;
  conflictType?: SyncConflictType | null;
  conflictDetails?: string | null;
  payload: unknown;
  createdOfflineAt: string;
  syncedAt?: string | null;
  deviceId?: string | null;
}

/**
 * Filter for querying sync logs
 */
export interface SyncLogFilterDto {
  userId?: string;
  status?: SyncStatus;
  operationType?: SyncOperationType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Sync log list response
 */
export interface SyncLogListResponseDto {
  data: OfflineSyncLogDto[];
  total: number;
}

/**
 * Sync statistics
 */
export interface SyncStatsDto {
  totalSynced: number;
  totalFailed: number;
  totalConflicts: number;
  lastSyncAt: string | null;
  pendingCount: number;
}

/**
 * Resolution request for a sync conflict
 */
export interface ResolveConflictDto {
  syncLogId: string;
  resolution: 'KEEP_LOCAL' | 'KEEP_SERVER' | 'GENERATE_NEW_NUMBER' | 'MERGE' | 'DISCARD';
  newReceiptNumber?: string;
  mergedData?: unknown;
}

/**
 * Response from conflict resolution
 */
export interface ResolveConflictResponseDto {
  success: boolean;
  message: string;
  newServerId?: string;
  error?: string;
}
