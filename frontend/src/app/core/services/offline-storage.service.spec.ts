import { TestBed } from '@angular/core/testing';
import { OfflineStorageService } from './offline-storage.service';
import {
  SyncQueueItem,
  CachedProduct,
  CachedBrand,
  DEFAULT_OFFLINE_SYNC_CONFIG,
  OFFLINE_DB_NAME
} from '../../models/offline-sync.model';

/**
 * Unit tests for OfflineStorageService
 * Feature: F-020 Offline Mode and Sync
 */
describe('OfflineStorageService', () => {
  let service: OfflineStorageService;

  const mockSyncQueueItem: SyncQueueItem = {
    id: 'test-id-1',
    operationType: 'CREATE_SALE',
    payload: {
      productId: 'product-1',
      saleDate: '2024-01-15',
      salePrice: 500,
      costPrice: 400,
      buyerName: 'Test Buyer',
      buyerPhone: '1234567890',
      buyerEmail: 'test@example.com',
      notes: null,
      productDetails: {
        brandName: 'Apple',
        model: 'iPhone 13',
        storageGb: 128,
        color: 'Black',
        condition: 'excellent',
        imei: '123456789012345'
      },
      localReceiptNumber: 'OFF-20240115-ABC1',
      taxRate: 10,
      taxAmount: 50,
      basePrice: 450,
      isTaxExempt: false
    },
    status: 'pending',
    priority: 'high',
    retryCount: 0,
    maxRetries: 3,
    createdAt: '2024-01-15T10:00:00Z',
    lastAttemptAt: null,
    lastError: null,
    localTempId: 'test-id-1',
    entityType: 'sale'
  };

  const mockCachedProduct: CachedProduct = {
    id: 'product-1',
    brandId: 'brand-1',
    brandName: 'Apple',
    model: 'iPhone 13',
    storageGb: 128,
    ramGb: 4,
    color: 'Black',
    condition: 'excellent',
    imei: '123456789012345',
    costPrice: 400,
    sellingPrice: 500,
    status: 'available',
    taxRate: 10,
    isTaxInclusive: false,
    isTaxExempt: false,
    primaryImageUrl: 'https://example.com/image.jpg',
    cachedAt: '2024-01-15T10:00:00Z'
  };

  const mockCachedBrand: CachedBrand = {
    id: 'brand-1',
    name: 'Apple',
    logoUrl: 'https://example.com/logo.png',
    cachedAt: '2024-01-15T10:00:00Z'
  };

  beforeEach(() => {
    // Skip real IndexedDB initialization for tests
    TestBed.configureTestingModule({
      providers: [OfflineStorageService]
    });

    // We test the service without actually initializing IndexedDB
    // So we test the public methods that don't require DB access
    service = TestBed.inject(OfflineStorageService);
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should expose isInitialized signal', () => {
      expect(service.isInitialized).toBeDefined();
    });

    it('should expose initError signal', () => {
      expect(service.initError).toBeDefined();
    });

    it('should expose isReady computed signal', () => {
      expect(service.isReady).toBeDefined();
    });
  });

  describe('generateLocalId', () => {
    it('should generate a unique local ID', () => {
      const id1 = service.generateLocalId();
      const id2 = service.generateLocalId();

      expect(id1).toMatch(/^local_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^local_\d+_[a-z0-9]+$/);
      expect(id1).not.toEqual(id2);
    });

    it('should generate IDs with timestamp prefix', () => {
      const before = Date.now();
      const id = service.generateLocalId();
      const after = Date.now();

      const parts = id.split('_');
      const timestamp = parseInt(parts[1], 10);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('generateLocalReceiptNumber', () => {
    it('should generate a receipt number with OFF prefix', () => {
      const receiptNumber = service.generateLocalReceiptNumber();
      expect(receiptNumber).toMatch(/^OFF-\d{8}-[A-Z0-9]{4}$/);
    });

    it('should include date in receipt number', () => {
      const receiptNumber = service.generateLocalReceiptNumber();
      const date = new Date();
      const expectedDate = date.toISOString().slice(0, 10).replace(/-/g, '');

      expect(receiptNumber).toContain(expectedDate);
    });

    it('should generate unique receipt numbers', () => {
      const receipts = new Set<string>();
      for (let i = 0; i < 100; i++) {
        receipts.add(service.generateLocalReceiptNumber());
      }
      // Should have at least 90 unique (allowing for some collisions due to random)
      expect(receipts.size).toBeGreaterThan(90);
    });
  });

  describe('model types validation', () => {
    it('should have correct SyncQueueItem structure', () => {
      expect(mockSyncQueueItem.id).toBeDefined();
      expect(mockSyncQueueItem.operationType).toBe('CREATE_SALE');
      expect(mockSyncQueueItem.status).toBe('pending');
      expect(mockSyncQueueItem.priority).toBe('high');
      expect(mockSyncQueueItem.entityType).toBe('sale');
    });

    it('should have correct CachedProduct structure', () => {
      expect(mockCachedProduct.id).toBeDefined();
      expect(mockCachedProduct.brandName).toBe('Apple');
      expect(mockCachedProduct.status).toBe('available');
      expect(mockCachedProduct.taxRate).toBe(10);
    });

    it('should have correct CachedBrand structure', () => {
      expect(mockCachedBrand.id).toBeDefined();
      expect(mockCachedBrand.name).toBe('Apple');
      expect(mockCachedBrand.cachedAt).toBeDefined();
    });

    it('should have correct default sync config values', () => {
      expect(DEFAULT_OFFLINE_SYNC_CONFIG.autoSyncEnabled).toBe(true);
      expect(DEFAULT_OFFLINE_SYNC_CONFIG.autoSyncDelayMs).toBe(2000);
      expect(DEFAULT_OFFLINE_SYNC_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_OFFLINE_SYNC_CONFIG.syncBatchSize).toBe(10);
    });
  });

  describe('database constants', () => {
    it('should have correct database name', () => {
      expect(OFFLINE_DB_NAME).toBe('shop-app-offline');
    });
  });
});
