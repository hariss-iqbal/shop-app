/**
 * Offline Sync Models
 * Feature: F-020 Offline Mode and Sync
 * Provides data structures for offline operation queuing and synchronization
 */

import { PaymentDetail } from './payment.model';

/**
 * Types of operations that can be queued for offline sync
 */
export type SyncOperationType =
  | 'CREATE_SALE'
  | 'UPDATE_SALE'
  | 'DELETE_SALE'
  | 'SEND_WHATSAPP'
  | 'CREATE_RECEIPT'
  | 'CREATE_CUSTOMER';

/**
 * Status of a sync queue item
 */
export type SyncStatus =
  | 'pending'      // Waiting to be synced
  | 'syncing'      // Currently being synced
  | 'synced'       // Successfully synced
  | 'conflict'     // Sync conflict detected
  | 'failed';      // Sync failed (will retry)

/**
 * Priority levels for sync operations
 */
export type SyncPriority = 'high' | 'normal' | 'low';

/**
 * Sync Queue Item - represents a single offline operation to be synced
 */
export interface SyncQueueItem {
  /** Unique identifier for this queue item (generated offline) */
  id: string;
  /** Type of operation to perform when online */
  operationType: SyncOperationType;
  /** The data payload for this operation */
  payload: SyncPayload;
  /** Current status of this sync item */
  status: SyncStatus;
  /** Priority level for sync order */
  priority: SyncPriority;
  /** Number of sync attempts made */
  retryCount: number;
  /** Maximum retry attempts before marking as failed */
  maxRetries: number;
  /** Timestamp when the operation was created offline */
  createdAt: string;
  /** Timestamp of last sync attempt */
  lastAttemptAt: string | null;
  /** Error message from last failed attempt */
  lastError: string | null;
  /** Conflict data if status is 'conflict' */
  conflictData?: SyncConflictData;
  /** Local temporary ID for the entity (for UI display before sync) */
  localTempId: string;
  /** Server ID after successful sync */
  serverId?: string;
  /** Entity type this operation affects */
  entityType: SyncEntityType;
  /** User ID who created this operation */
  userId?: string;
}

/**
 * Entity types that can be synced
 */
export type SyncEntityType = 'sale' | 'receipt' | 'customer' | 'whatsapp_message';

/**
 * Union type for all possible sync payloads
 */
export type SyncPayload =
  | OfflineSalePayload
  | OfflineWhatsAppPayload
  | OfflineReceiptPayload
  | OfflineCustomerPayload;

/**
 * Offline Sale Payload - data for creating a sale offline
 */
export interface OfflineSalePayload {
  productId: string;
  saleDate: string;
  salePrice: number;
  costPrice: number;
  buyerName: string | null;
  buyerPhone: string | null;
  buyerEmail: string | null;
  notes: string | null;
  payments?: PaymentDetail[];
  /** Cached product details for offline display */
  productDetails: {
    brandName: string;
    model: string;
    storageGb: number | null;
    color: string | null;
    condition: string;
    imei: string | null;
  };
  /** Locally generated receipt number */
  localReceiptNumber: string;
  /** Tax information */
  taxRate: number;
  taxAmount: number;
  basePrice: number;
  isTaxExempt: boolean;
}

/**
 * Offline WhatsApp Payload - data for queuing WhatsApp messages
 */
export interface OfflineWhatsAppPayload {
  phoneNumber: string;
  message: string;
  receiptNumber: string;
  receiptLocalId: string;
  customerName: string | null;
  grandTotal: number;
}

/**
 * Offline Receipt Payload - data for creating receipts offline
 */
export interface OfflineReceiptPayload {
  receiptNumber: string;
  transactionDate: string;
  transactionTime: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  notes: string | null;
  items: OfflineReceiptItem[];
  saleLocalIds: string[];
}

/**
 * Offline Receipt Item
 */
export interface OfflineReceiptItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate: number;
  taxAmount: number;
  basePrice: number;
  isTaxExempt: boolean;
  saleLocalId: string;
}

/**
 * Offline Customer Payload
 */
export interface OfflineCustomerPayload {
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
}

/**
 * Sync Conflict Data - information about a conflict that needs resolution
 */
export interface SyncConflictData {
  /** Type of conflict */
  conflictType: SyncConflictType;
  /** Description of the conflict */
  description: string;
  /** Local version of the data */
  localData: unknown;
  /** Server version of the data (if available) */
  serverData: unknown;
  /** When the conflict was detected */
  detectedAt: string;
  /** Suggested resolution options */
  resolutionOptions: SyncResolutionOption[];
}

/**
 * Types of sync conflicts
 */
export type SyncConflictType =
  | 'RECEIPT_NUMBER_EXISTS'    // Receipt number already exists on server
  | 'PRODUCT_ALREADY_SOLD'     // Product was sold by another user
  | 'PRODUCT_NOT_AVAILABLE'    // Product is no longer available
  | 'DATA_MODIFIED'            // Data was modified on server
  | 'ENTITY_DELETED';          // Entity was deleted on server

/**
 * Resolution options for conflicts
 */
export interface SyncResolutionOption {
  id: string;
  label: string;
  description: string;
  action: SyncResolutionAction;
  isRecommended: boolean;
}

/**
 * Actions that can be taken to resolve conflicts
 */
export type SyncResolutionAction =
  | 'KEEP_LOCAL'           // Use local version
  | 'KEEP_SERVER'          // Use server version
  | 'GENERATE_NEW_NUMBER'  // Generate a new receipt number
  | 'MERGE'                // Merge both versions
  | 'DISCARD';             // Discard the offline operation

/**
 * Overall sync status for the application
 */
export interface AppSyncStatus {
  /** Whether the app is currently online */
  isOnline: boolean;
  /** Whether sync is in progress */
  isSyncing: boolean;
  /** Number of items pending sync */
  pendingCount: number;
  /** Number of items with conflicts */
  conflictCount: number;
  /** Number of failed sync attempts */
  failedCount: number;
  /** Last successful sync timestamp */
  lastSyncAt: string | null;
  /** Current sync progress (0-100) */
  syncProgress: number;
  /** Error message if sync failed */
  lastSyncError: string | null;
}

/**
 * Sync result for a batch sync operation
 */
export interface SyncBatchResult {
  success: boolean;
  totalItems: number;
  syncedItems: number;
  failedItems: number;
  conflictItems: number;
  errors: SyncError[];
  conflicts: SyncQueueItem[];
  syncedAt: string;
}

/**
 * Individual sync error
 */
export interface SyncError {
  itemId: string;
  operationType: SyncOperationType;
  errorCode: string;
  errorMessage: string;
  canRetry: boolean;
}

/**
 * Offline transaction for display purposes
 */
export interface OfflineTransaction {
  id: string;
  type: 'sale' | 'receipt' | 'whatsapp';
  displayName: string;
  amount: number | null;
  status: SyncStatus;
  createdAt: string;
  customerName: string | null;
  receiptNumber: string | null;
  retryCount: number;
  lastError: string | null;
}

/**
 * Configuration for offline sync behavior
 */
export interface OfflineSyncConfig {
  /** Whether to auto-sync when online */
  autoSyncEnabled: boolean;
  /** Delay in milliseconds before starting auto-sync */
  autoSyncDelayMs: number;
  /** Maximum number of retries for failed syncs */
  maxRetries: number;
  /** Delay between retries in milliseconds */
  retryDelayMs: number;
  /** Whether to show sync notifications */
  showNotifications: boolean;
  /** Maximum age of pending items in days before cleanup */
  maxPendingAgeDays: number;
  /** Batch size for sync operations */
  syncBatchSize: number;
}

/**
 * Default sync configuration
 */
export const DEFAULT_OFFLINE_SYNC_CONFIG: OfflineSyncConfig = {
  autoSyncEnabled: true,
  autoSyncDelayMs: 2000,
  maxRetries: 3,
  retryDelayMs: 5000,
  showNotifications: true,
  maxPendingAgeDays: 30,
  syncBatchSize: 10
};

/**
 * IndexedDB database schema version
 */
export const OFFLINE_DB_VERSION = 1;

/**
 * IndexedDB database name
 */
export const OFFLINE_DB_NAME = 'shop-app-offline';

/**
 * IndexedDB store names
 */
export const OFFLINE_STORES = {
  SYNC_QUEUE: 'sync_queue',
  OFFLINE_SALES: 'offline_sales',
  OFFLINE_RECEIPTS: 'offline_receipts',
  CACHED_PHONES: 'cached_phones',
  CACHED_BRANDS: 'cached_brands',
  SYNC_CONFIG: 'sync_config'
} as const;

/**
 * Request to resolve a sync conflict
 */
export interface ResolveConflictRequest {
  queueItemId: string;
  resolution: SyncResolutionAction;
  newReceiptNumber?: string;
  mergedData?: unknown;
}

/**
 * Response from conflict resolution
 */
export interface ResolveConflictResponse {
  success: boolean;
  message: string;
  updatedItem?: SyncQueueItem;
  error?: string;
}

/**
 * Cached phone data for offline use
 */
export interface CachedProduct {
  id: string;
  brandId: string;
  brandName: string;
  model: string;
  storageGb: number | null;
  ramGb: number | null;
  color: string | null;
  condition: string;
  imei: string | null;
  costPrice: number;
  sellingPrice: number;
  status: string;
  taxRate: number;
  isTaxInclusive: boolean;
  isTaxExempt: boolean;
  primaryImageUrl: string | null;
  cachedAt: string;
}

/**
 * Cached brand data for offline use
 */
export interface CachedBrand {
  id: string;
  name: string;
  logoUrl: string | null;
  cachedAt: string;
}
