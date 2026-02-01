/**
 * Offline Sync Log Entity
 * Feature: F-020 Offline Mode and Sync
 *
 * Stores audit trail of offline operations that have been synced.
 * Tracks sync status, conflicts, and resolution history.
 */

/**
 * Sync operation types
 */
export type SyncOperationType =
  | 'CREATE_SALE'
  | 'UPDATE_SALE'
  | 'DELETE_SALE'
  | 'SEND_WHATSAPP'
  | 'CREATE_RECEIPT'
  | 'CREATE_CUSTOMER';

/**
 * Sync status types
 */
export type SyncStatus =
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'conflict'
  | 'failed';

/**
 * Conflict types
 */
export type SyncConflictType =
  | 'RECEIPT_NUMBER_EXISTS'
  | 'PHONE_ALREADY_SOLD'
  | 'PHONE_NOT_AVAILABLE'
  | 'DATA_MODIFIED'
  | 'ENTITY_DELETED';

/**
 * Offline Sync Log - database entity
 * Table: offline_sync_logs
 */
export interface OfflineSyncLog {
  id: string;
  user_id: string;
  operation_type: SyncOperationType;
  local_id: string;
  server_id: string | null;
  status: SyncStatus;
  conflict_type: SyncConflictType | null;
  conflict_details: string | null;
  payload: unknown;
  created_offline_at: string;
  synced_at: string | null;
  device_id: string | null;
  client_ip: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * Insert type for creating new sync log
 */
export interface OfflineSyncLogInsert {
  user_id: string;
  operation_type: SyncOperationType;
  local_id: string;
  server_id?: string | null;
  status: SyncStatus;
  conflict_type?: SyncConflictType | null;
  conflict_details?: string | null;
  payload: unknown;
  created_offline_at: string;
  synced_at?: string | null;
  device_id?: string | null;
  client_ip?: string | null;
  user_agent?: string | null;
}

/**
 * Update type for modifying sync log
 */
export interface OfflineSyncLogUpdate {
  server_id?: string | null;
  status?: SyncStatus;
  conflict_type?: SyncConflictType | null;
  conflict_details?: string | null;
  synced_at?: string | null;
}

/**
 * Sync log with user details
 */
export interface OfflineSyncLogWithUser extends OfflineSyncLog {
  user?: {
    id: string;
    email: string;
  };
}
