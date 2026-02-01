import { Injectable, signal, computed } from '@angular/core';
import {
  SyncQueueItem,
  CachedPhone,
  CachedBrand,
  OfflineSyncConfig,
  DEFAULT_OFFLINE_SYNC_CONFIG,
  OFFLINE_DB_NAME,
  OFFLINE_DB_VERSION,
  OFFLINE_STORES,
  SyncStatus
} from '../../models/offline-sync.model';

/**
 * Offline Storage Service
 * Feature: F-020 Offline Mode and Sync
 *
 * Provides IndexedDB-based persistent storage for offline operations.
 * Manages sync queue items, cached data, and offline configuration.
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private readonly _isInitialized = signal(false);
  private readonly _initError = signal<string | null>(null);

  readonly isInitialized = this._isInitialized.asReadonly();
  readonly initError = this._initError.asReadonly();
  readonly isReady = computed(() => this._isInitialized() && !this._initError());

  constructor() {
    this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    if (!('indexedDB' in window)) {
      this._initError.set('IndexedDB is not supported in this browser');
      return;
    }

    try {
      this.db = await this.openDatabase();
      this._isInitialized.set(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize offline database';
      this._initError.set(errorMessage);
      console.error('Failed to initialize IndexedDB:', error);
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });
  }

  private createStores(db: IDBDatabase): void {
    // Sync Queue Store
    if (!db.objectStoreNames.contains(OFFLINE_STORES.SYNC_QUEUE)) {
      const syncQueueStore = db.createObjectStore(OFFLINE_STORES.SYNC_QUEUE, { keyPath: 'id' });
      syncQueueStore.createIndex('status', 'status', { unique: false });
      syncQueueStore.createIndex('operationType', 'operationType', { unique: false });
      syncQueueStore.createIndex('priority', 'priority', { unique: false });
      syncQueueStore.createIndex('createdAt', 'createdAt', { unique: false });
      syncQueueStore.createIndex('entityType', 'entityType', { unique: false });
    }

    // Cached Phones Store
    if (!db.objectStoreNames.contains(OFFLINE_STORES.CACHED_PHONES)) {
      const phonesStore = db.createObjectStore(OFFLINE_STORES.CACHED_PHONES, { keyPath: 'id' });
      phonesStore.createIndex('brandId', 'brandId', { unique: false });
      phonesStore.createIndex('status', 'status', { unique: false });
      phonesStore.createIndex('cachedAt', 'cachedAt', { unique: false });
    }

    // Cached Brands Store
    if (!db.objectStoreNames.contains(OFFLINE_STORES.CACHED_BRANDS)) {
      const brandsStore = db.createObjectStore(OFFLINE_STORES.CACHED_BRANDS, { keyPath: 'id' });
      brandsStore.createIndex('name', 'name', { unique: false });
      brandsStore.createIndex('cachedAt', 'cachedAt', { unique: false });
    }

    // Sync Config Store
    if (!db.objectStoreNames.contains(OFFLINE_STORES.SYNC_CONFIG)) {
      db.createObjectStore(OFFLINE_STORES.SYNC_CONFIG, { keyPath: 'id' });
    }
  }

  private ensureDatabase(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  // ==================== Sync Queue Operations ====================

  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.SYNC_QUEUE, 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORES.SYNC_QUEUE);
      const request = store.add(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to add to sync queue: ${request.error?.message}`));
    });
  }

  async updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.SYNC_QUEUE, 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORES.SYNC_QUEUE);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to update sync queue item: ${request.error?.message}`));
    });
  }

  async getSyncQueueItem(id: string): Promise<SyncQueueItem | null> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.SYNC_QUEUE, 'readonly');
      const store = transaction.objectStore(OFFLINE_STORES.SYNC_QUEUE);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error(`Failed to get sync queue item: ${request.error?.message}`));
    });
  }

  async getAllSyncQueueItems(): Promise<SyncQueueItem[]> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.SYNC_QUEUE, 'readonly');
      const store = transaction.objectStore(OFFLINE_STORES.SYNC_QUEUE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error(`Failed to get all sync queue items: ${request.error?.message}`));
    });
  }

  async getSyncQueueItemsByStatus(status: SyncStatus): Promise<SyncQueueItem[]> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.SYNC_QUEUE, 'readonly');
      const store = transaction.objectStore(OFFLINE_STORES.SYNC_QUEUE);
      const index = store.index('status');
      const request = index.getAll(status);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error(`Failed to get sync queue items by status: ${request.error?.message}`));
    });
  }

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    const pending = await this.getSyncQueueItemsByStatus('pending');
    const failed = await this.getSyncQueueItemsByStatus('failed');

    // Combine and sort by priority and creation time
    const items = [...pending, ...failed];
    return items.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  async getConflictItems(): Promise<SyncQueueItem[]> {
    return this.getSyncQueueItemsByStatus('conflict');
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.SYNC_QUEUE, 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORES.SYNC_QUEUE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to remove sync queue item: ${request.error?.message}`));
    });
  }

  async clearSyncedItems(): Promise<void> {
    const items = await this.getSyncQueueItemsByStatus('synced');
    for (const item of items) {
      await this.removeSyncQueueItem(item.id);
    }
  }

  async getSyncQueueCount(): Promise<{ pending: number; conflict: number; failed: number; total: number }> {
    const all = await this.getAllSyncQueueItems();
    return {
      pending: all.filter(i => i.status === 'pending').length,
      conflict: all.filter(i => i.status === 'conflict').length,
      failed: all.filter(i => i.status === 'failed').length,
      total: all.filter(i => i.status !== 'synced').length
    };
  }

  // ==================== Cached Phones Operations ====================

  async cachePhone(phone: CachedPhone): Promise<void> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.CACHED_PHONES, 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORES.CACHED_PHONES);
      const request = store.put(phone);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to cache phone: ${request.error?.message}`));
    });
  }

  async cachePhones(phones: CachedPhone[]): Promise<void> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.CACHED_PHONES, 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORES.CACHED_PHONES);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error(`Failed to cache phones: ${transaction.error?.message}`));

      for (const phone of phones) {
        store.put(phone);
      }
    });
  }

  async getCachedPhone(id: string): Promise<CachedPhone | null> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.CACHED_PHONES, 'readonly');
      const store = transaction.objectStore(OFFLINE_STORES.CACHED_PHONES);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error(`Failed to get cached phone: ${request.error?.message}`));
    });
  }

  async getAllCachedPhones(): Promise<CachedPhone[]> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.CACHED_PHONES, 'readonly');
      const store = transaction.objectStore(OFFLINE_STORES.CACHED_PHONES);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error(`Failed to get all cached phones: ${request.error?.message}`));
    });
  }

  async getAvailableCachedPhones(): Promise<CachedPhone[]> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.CACHED_PHONES, 'readonly');
      const store = transaction.objectStore(OFFLINE_STORES.CACHED_PHONES);
      const index = store.index('status');
      const request = index.getAll('available');

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error(`Failed to get available cached phones: ${request.error?.message}`));
    });
  }

  async updateCachedPhoneStatus(id: string, status: string): Promise<void> {
    const phone = await this.getCachedPhone(id);
    if (phone) {
      phone.status = status;
      await this.cachePhone(phone);
    }
  }

  async removeCachedPhone(id: string): Promise<void> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.CACHED_PHONES, 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORES.CACHED_PHONES);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to remove cached phone: ${request.error?.message}`));
    });
  }

  async clearCachedPhones(): Promise<void> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.CACHED_PHONES, 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORES.CACHED_PHONES);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to clear cached phones: ${request.error?.message}`));
    });
  }

  // ==================== Cached Brands Operations ====================

  async cacheBrand(brand: CachedBrand): Promise<void> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.CACHED_BRANDS, 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORES.CACHED_BRANDS);
      const request = store.put(brand);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to cache brand: ${request.error?.message}`));
    });
  }

  async cacheBrands(brands: CachedBrand[]): Promise<void> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.CACHED_BRANDS, 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORES.CACHED_BRANDS);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error(`Failed to cache brands: ${transaction.error?.message}`));

      for (const brand of brands) {
        store.put(brand);
      }
    });
  }

  async getCachedBrand(id: string): Promise<CachedBrand | null> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.CACHED_BRANDS, 'readonly');
      const store = transaction.objectStore(OFFLINE_STORES.CACHED_BRANDS);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error(`Failed to get cached brand: ${request.error?.message}`));
    });
  }

  async getAllCachedBrands(): Promise<CachedBrand[]> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.CACHED_BRANDS, 'readonly');
      const store = transaction.objectStore(OFFLINE_STORES.CACHED_BRANDS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error(`Failed to get all cached brands: ${request.error?.message}`));
    });
  }

  async clearCachedBrands(): Promise<void> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.CACHED_BRANDS, 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORES.CACHED_BRANDS);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to clear cached brands: ${request.error?.message}`));
    });
  }

  // ==================== Sync Config Operations ====================

  async getSyncConfig(): Promise<OfflineSyncConfig> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.SYNC_CONFIG, 'readonly');
      const store = transaction.objectStore(OFFLINE_STORES.SYNC_CONFIG);
      const request = store.get('config');

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.config : DEFAULT_OFFLINE_SYNC_CONFIG);
      };
      request.onerror = () => reject(new Error(`Failed to get sync config: ${request.error?.message}`));
    });
  }

  async saveSyncConfig(config: OfflineSyncConfig): Promise<void> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.SYNC_CONFIG, 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORES.SYNC_CONFIG);
      const request = store.put({ id: 'config', config });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to save sync config: ${request.error?.message}`));
    });
  }

  async getLastSyncTime(): Promise<string | null> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.SYNC_CONFIG, 'readonly');
      const store = transaction.objectStore(OFFLINE_STORES.SYNC_CONFIG);
      const request = store.get('lastSync');

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.timestamp : null);
      };
      request.onerror = () => reject(new Error(`Failed to get last sync time: ${request.error?.message}`));
    });
  }

  async saveLastSyncTime(timestamp: string): Promise<void> {
    const db = this.ensureDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORES.SYNC_CONFIG, 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORES.SYNC_CONFIG);
      const request = store.put({ id: 'lastSync', timestamp });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to save last sync time: ${request.error?.message}`));
    });
  }

  // ==================== Utility Operations ====================

  async clearAllData(): Promise<void> {
    await this.clearSyncedItems();
    await this.clearCachedPhones();
    await this.clearCachedBrands();
  }

  async getStorageStats(): Promise<{ syncQueue: number; phones: number; brands: number }> {
    const [syncItems, phones, brands] = await Promise.all([
      this.getAllSyncQueueItems(),
      this.getAllCachedPhones(),
      this.getAllCachedBrands()
    ]);

    return {
      syncQueue: syncItems.length,
      phones: phones.length,
      brands: brands.length
    };
  }

  generateLocalId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  generateLocalReceiptNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `OFF-${dateStr}-${random}`;
  }
}
