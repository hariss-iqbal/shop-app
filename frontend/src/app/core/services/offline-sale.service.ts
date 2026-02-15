import { Injectable, signal, computed } from '@angular/core';
import { OfflineStorageService } from './offline-storage.service';
import { SyncQueueService } from './sync-queue.service';
import { NetworkStatusService } from './network-status.service';
import { SaleService } from './sale.service';
import { ProductService } from './product.service';
import {
  OfflineSalePayload,
  CachedProduct,
  SyncQueueItem
} from '../../models/offline-sync.model';
import {
  MarkAsSoldRequest,
  CompleteSaleTransactionRequest,
  Sale,
  SaleWithInventoryDeductionResponse,
  BatchSaleWithInventoryDeductionResponse,
  CartItem
} from '../../models/sale.model';
import { ProductStatus } from '../../enums';

/**
 * Offline Sale Response - mimics online response for offline operations
 */
export interface OfflineSaleResponse {
  success: boolean;
  isOffline: boolean;
  localId: string;
  localReceiptNumber: string;
  message: string;
  queueItem?: SyncQueueItem;
}

/**
 * Offline Batch Sale Response
 */
export interface OfflineBatchSaleResponse {
  success: boolean;
  isOffline: boolean;
  totalItems: number;
  processedItems: number;
  localIds: string[];
  localReceiptNumber: string;
  message: string;
  queueItems?: SyncQueueItem[];
}

/**
 * Offline Sale Service
 * Feature: F-020 Offline Mode and Sync
 *
 * Handles sales operations when offline. Queues transactions locally
 * and provides cached product data for offline sale processing.
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineSaleService {
  constructor(
    private readonly offlineStorage: OfflineStorageService,
    private readonly syncQueue: SyncQueueService,
    private readonly networkStatus: NetworkStatusService,
    private readonly saleService: SaleService,
    private readonly productService: ProductService
  ) { }

  // Cache refresh state
  private readonly _isRefreshingCache = signal(false);
  private readonly _lastCacheRefresh = signal<string | null>(null);
  private readonly _cacheError = signal<string | null>(null);

  readonly isRefreshingCache = this._isRefreshingCache.asReadonly();
  readonly lastCacheRefresh = this._lastCacheRefresh.asReadonly();
  readonly cacheError = this._cacheError.asReadonly();

  readonly isOfflineMode = computed(() => this.networkStatus.isOffline());

  /**
   * Process a sale - online or offline depending on network status
   */
  async processSale(request: MarkAsSoldRequest, productDetails: {
    brandName: string;
    model: string;
    storageGb: number | null;
    color: string | null;
    condition: string;
    imei: string | null;
    costPrice: number;
    taxRate: number;
    isTaxInclusive: boolean;
    isTaxExempt: boolean;
  }): Promise<SaleWithInventoryDeductionResponse | OfflineSaleResponse> {
    if (this.networkStatus.isOnline()) {
      // Process online
      return this.saleService.markAsSold(request);
    }

    // Process offline
    return this.processOfflineSale(request, productDetails);
  }

  /**
   * Process a sale offline - queue for later sync
   */
  async processOfflineSale(
    request: MarkAsSoldRequest,
    productDetails: {
      brandName: string;
      model: string;
      storageGb: number | null;
      color: string | null;
      condition: string;
      imei: string | null;
      costPrice: number;
      taxRate: number;
      isTaxInclusive: boolean;
      isTaxExempt: boolean;
    }
  ): Promise<OfflineSaleResponse> {
    const localReceiptNumber = this.offlineStorage.generateLocalReceiptNumber();

    // Calculate tax amounts
    const taxRate = productDetails.taxRate;
    const isTaxInclusive = productDetails.isTaxInclusive;
    const isTaxExempt = productDetails.isTaxExempt;

    let basePrice: number;
    let taxAmount: number;

    if (isTaxExempt) {
      basePrice = request.salePrice;
      taxAmount = 0;
    } else if (isTaxInclusive) {
      basePrice = request.salePrice / (1 + taxRate / 100);
      taxAmount = request.salePrice - basePrice;
    } else {
      basePrice = request.salePrice;
      taxAmount = request.salePrice * (taxRate / 100);
    }

    const payload: OfflineSalePayload = {
      productId: request.productId,
      saleDate: request.saleDate,
      salePrice: request.salePrice,
      costPrice: productDetails.costPrice,
      buyerName: request.buyerName || null,
      buyerPhone: request.buyerPhone || null,
      buyerEmail: request.buyerEmail || null,
      notes: request.notes || null,
      payments: request.payments,
      productDetails: {
        brandName: productDetails.brandName,
        model: productDetails.model,
        storageGb: productDetails.storageGb,
        color: productDetails.color,
        condition: productDetails.condition,
        imei: productDetails.imei
      },
      localReceiptNumber,
      taxRate,
      taxAmount,
      basePrice,
      isTaxExempt
    };

    const queueItem = await this.syncQueue.queueSale(payload);

    // Mark product as sold in local cache
    await this.offlineStorage.updateCachedProductStatus(request.productId, 'sold');

    return {
      success: true,
      isOffline: true,
      localId: queueItem.localTempId,
      localReceiptNumber,
      message: 'Sale saved offline. Will sync when connection is restored.',
      queueItem
    };
  }

  /**
   * Process a batch sale - online or offline
   */
  async processBatchSale(
    request: CompleteSaleTransactionRequest,
    cartItems: CartItem[]
  ): Promise<BatchSaleWithInventoryDeductionResponse | OfflineBatchSaleResponse> {
    if (this.networkStatus.isOnline()) {
      return this.saleService.completeSaleTransaction(request);
    }

    return this.processOfflineBatchSale(request, cartItems);
  }

  /**
   * Process a batch sale offline
   */
  async processOfflineBatchSale(
    request: CompleteSaleTransactionRequest,
    cartItems: CartItem[]
  ): Promise<OfflineBatchSaleResponse> {
    const localReceiptNumber = this.offlineStorage.generateLocalReceiptNumber();
    const queueItems: SyncQueueItem[] = [];
    const localIds: string[] = [];

    for (const item of request.items) {
      const cartItem = cartItems.find(c => c.productId === item.productId);
      if (!cartItem) continue;

      const payload: OfflineSalePayload = {
        productId: item.productId,
        saleDate: request.saleDate,
        salePrice: item.salePrice,
        costPrice: cartItem.costPrice,
        buyerName: request.customerInfo.name || null,
        buyerPhone: request.customerInfo.phone || null,
        buyerEmail: request.customerInfo.email || null,
        notes: request.notes,
        payments: request.payments,
        productDetails: {
          brandName: cartItem.brandName,
          model: cartItem.model,
          storageGb: cartItem.storageGb,
          color: cartItem.color,
          condition: cartItem.condition,
          imei: cartItem.imei
        },
        localReceiptNumber,
        taxRate: cartItem.taxRate,
        taxAmount: cartItem.taxAmount,
        basePrice: cartItem.basePrice,
        isTaxExempt: cartItem.isTaxExempt
      };

      const queueItem = await this.syncQueue.queueSale(payload);
      queueItems.push(queueItem);
      localIds.push(queueItem.localTempId);

      // Mark product as sold in local cache
      await this.offlineStorage.updateCachedProductStatus(item.productId, 'sold');
    }

    return {
      success: true,
      isOffline: true,
      totalItems: request.items.length,
      processedItems: queueItems.length,
      localIds,
      localReceiptNumber,
      message: `${queueItems.length} sale(s) saved offline. Will sync when connection is restored.`,
      queueItems
    };
  }

  /**
   * Get cached products for offline sale
   */
  async getAvailableProducts(): Promise<CachedProduct[]> {
    if (this.networkStatus.isOnline()) {
      // Refresh cache if online
      await this.refreshProductCache();
    }

    return this.offlineStorage.getAvailableCachedProducts();
  }

  /**
   * Get a specific cached product
   */
  async getCachedProduct(id: string): Promise<CachedProduct | null> {
    return this.offlineStorage.getCachedProduct(id);
  }

  /**
   * Refresh the product cache from server
   */
  async refreshProductCache(): Promise<void> {
    if (!this.networkStatus.isOnline()) {
      return;
    }

    this._isRefreshingCache.set(true);
    this._cacheError.set(null);

    try {
      // Fetch available products from server
      const response = await this.productService.getProducts(
        { first: 0, rows: 1000 },
        { status: ProductStatus.AVAILABLE }
      );

      const cachedProducts: CachedProduct[] = response.data.map(product => ({
        id: product.id,
        brandId: product.brandId,
        brandName: product.brandName,
        model: product.model,
        storageGb: product.storageGb,
        ramGb: product.ramGb,
        color: product.color,
        condition: product.condition,
        imei: product.imei,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        status: product.status,
        taxRate: product.taxRate,
        isTaxInclusive: product.isTaxInclusive,
        isTaxExempt: product.isTaxExempt,
        primaryImageUrl: product.primaryImageUrl || null,
        cachedAt: new Date().toISOString()
      }));

      await this.offlineStorage.cacheProducts(cachedProducts);
      this._lastCacheRefresh.set(new Date().toISOString());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh product cache';
      this._cacheError.set(errorMessage);
      console.error('Failed to refresh product cache:', error);
    } finally {
      this._isRefreshingCache.set(false);
    }
  }

  /**
   * Build a cart item from cached product data
   */
  buildCartItemFromCache(product: CachedProduct): CartItem {
    let basePrice: number;
    let taxAmount: number;

    if (product.isTaxExempt) {
      basePrice = product.sellingPrice;
      taxAmount = 0;
    } else if (product.isTaxInclusive) {
      basePrice = product.sellingPrice / (1 + product.taxRate / 100);
      taxAmount = product.sellingPrice - basePrice;
    } else {
      basePrice = product.sellingPrice;
      taxAmount = product.sellingPrice * (product.taxRate / 100);
    }

    return {
      productId: product.id,
      brandName: product.brandName,
      model: product.model,
      storageGb: product.storageGb,
      color: product.color,
      condition: product.condition,
      imei: product.imei,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      salePrice: product.sellingPrice,
      taxRate: product.taxRate,
      primaryImageUrl: product.primaryImageUrl,
      isTaxInclusive: product.isTaxInclusive,
      isTaxExempt: product.isTaxExempt,
      basePrice,
      taxAmount
    };
  }

  /**
   * Create an offline sale object for display
   */
  createOfflineSaleDisplay(payload: OfflineSalePayload, localId: string): Sale {
    const now = new Date().toISOString();

    return {
      id: localId,
      productId: payload.productId,
      brandName: payload.productDetails.brandName,
      productName: payload.productDetails.model,
      saleDate: payload.saleDate,
      salePrice: payload.salePrice,
      costPrice: payload.costPrice,
      profit: payload.salePrice - payload.costPrice,
      buyerName: payload.buyerName,
      buyerPhone: payload.buyerPhone,
      buyerEmail: payload.buyerEmail,
      notes: payload.notes,
      createdAt: now,
      updatedAt: null,
      taxRate: payload.taxRate,
      taxAmount: payload.taxAmount,
      basePrice: payload.basePrice,
      isTaxExempt: payload.isTaxExempt,
      paymentSummary: (payload.payments || []).map(p => ({
        method: p.method,
        amount: p.amount
      })),
      isSplitPayment: (payload.payments || []).length > 1,
      primaryPaymentMethod: payload.payments?.[0]?.method || null,
      locationId: null,
      locationName: null
    };
  }

  /**
   * Check if a product is available (considering offline sales)
   */
  async isProductAvailable(productId: string): Promise<boolean> {
    const cachedProduct = await this.offlineStorage.getCachedProduct(productId);
    return cachedProduct?.status === 'available';
  }

  /**
   * Get offline sales pending sync
   */
  async getOfflineSalesPending(): Promise<SyncQueueItem[]> {
    const items = await this.syncQueue.getPendingItems();
    return items.filter(item => item.operationType === 'CREATE_SALE');
  }

  /**
   * Clear product cache
   */
  async clearProductCache(): Promise<void> {
    await this.offlineStorage.clearCachedProducts();
    this._lastCacheRefresh.set(null);
  }
}
