import { SupabaseClient } from '@supabase/supabase-js';
import {
  OfflineSyncLog,
  OfflineSyncLogInsert,
  OfflineSyncLogUpdate,
  OfflineSyncLogWithUser,
  SyncStatus,
  SyncOperationType
} from '../entities/offline-sync-log.entity';

/**
 * Offline Sync Log Repository
 * Feature: F-020 Offline Mode and Sync
 *
 * Handles database operations for offline sync audit logs.
 * Table: offline_sync_logs
 */
export class OfflineSyncLogRepository {
  private readonly tableName = 'offline_sync_logs';

  constructor(private readonly supabase: SupabaseClient) {}

  async findAll(options?: {
    userId?: string;
    status?: SyncStatus;
    operationType?: SyncOperationType;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: OfflineSyncLogWithUser[]; total: number }> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' });

    if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.operationType) {
      query = query.eq('operation_type', options.operationType);
    }
    if (options?.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) {
      const offset = options.offset || 0;
      query = query.range(offset, offset + options.limit - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], total: count || 0 };
  }

  async findById(id: string): Promise<OfflineSyncLog | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByLocalId(localId: string): Promise<OfflineSyncLog | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('local_id', localId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(log: OfflineSyncLogInsert): Promise<OfflineSyncLog> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(log)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, log: OfflineSyncLogUpdate): Promise<OfflineSyncLog> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(log)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getStats(userId?: string): Promise<{
    totalSynced: number;
    totalFailed: number;
    totalConflicts: number;
    lastSyncAt: string | null;
  }> {
    let baseQuery = this.supabase
      .from(this.tableName)
      .select('status, synced_at');

    if (userId) {
      baseQuery = baseQuery.eq('user_id', userId);
    }

    const { data, error } = await baseQuery;

    if (error) throw error;

    const logs = data || [];
    const synced = logs.filter(l => l.status === 'synced');
    const lastSyncedLog = synced.sort((a, b) =>
      new Date(b.synced_at || 0).getTime() - new Date(a.synced_at || 0).getTime()
    )[0];

    return {
      totalSynced: logs.filter(l => l.status === 'synced').length,
      totalFailed: logs.filter(l => l.status === 'failed').length,
      totalConflicts: logs.filter(l => l.status === 'conflict').length,
      lastSyncAt: lastSyncedLog?.synced_at || null
    };
  }

  async countByStatus(status: SyncStatus, userId?: string): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }

  async markAsSynced(id: string, serverId: string): Promise<OfflineSyncLog> {
    return this.update(id, {
      status: 'synced',
      server_id: serverId,
      synced_at: new Date().toISOString()
    });
  }

  async markAsFailed(id: string): Promise<OfflineSyncLog> {
    return this.update(id, {
      status: 'failed'
    });
  }

  async markAsConflict(
    id: string,
    conflictType: string,
    conflictDetails: string
  ): Promise<OfflineSyncLog> {
    return this.update(id, {
      status: 'conflict',
      conflict_type: conflictType as any,
      conflict_details: conflictDetails
    });
  }

  async cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('status', 'synced')
      .lt('synced_at', cutoffDate.toISOString())
      .select('id');

    if (error) throw error;
    return data?.length || 0;
  }
}
