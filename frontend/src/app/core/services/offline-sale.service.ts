import { Injectable, inject, signal, computed } from '@angular/core';
import { OfflineStorageService } from './offline-storage.service';
import { SyncQueueService } from './sync-queue.service';
import { NetworkStatusService } from './network-status.service';
import { SaleService } from './sale.service';
import { PhoneService } from './phone.service';
import {
  OfflineSalePayload,
  CachedPhone,
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
import { PhoneStatus } from '../../enums';

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
 * and provides cached phone data for offline sale processing.
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineSaleService {
  private readonly offlineStorage = inject(OfflineStorageService);
  private readonly syncQueue = inject(SyncQueueService);
  private readonly networkStatus = inject(NetworkStatusService);
  private readonly saleService = inject(SaleService);
  private readonly phoneService = inject(PhoneService);

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
  async processSale(request: MarkAsSoldRequest, phoneDetails: {
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
    return this.processOfflineSale(request, phoneDetails);
  }

  /**
   * Process a sale offline - queue for later sync
   */
  async processOfflineSale(
    request: MarkAsSoldRequest,
    phoneDetails: {
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
    const taxRate = phoneDetails.taxRate;
    const isTaxInclusive = phoneDetails.isTaxInclusive;
    const isTaxExempt = phoneDetails.isTaxExempt;

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
      phoneId: request.phoneId,
      saleDate: request.saleDate,
      salePrice: request.salePrice,
      costPrice: phoneDetails.costPrice,
      buyerName: request.buyerName || null,
      buyerPhone: request.buyerPhone || null,
      buyerEmail: request.buyerEmail || null,
      notes: request.notes || null,
      payments: request.payments,
      phoneDetails: {
        brandName: phoneDetails.brandName,
        model: phoneDetails.model,
        storageGb: phoneDetails.storageGb,
        color: phoneDetails.color,
        condition: phoneDetails.condition,
        imei: phoneDetails.imei
      },
      localReceiptNumber,
      taxRate,
      taxAmount,
      basePrice,
      isTaxExempt
    };

    const queueItem = await this.syncQueue.queueSale(payload);

    // Mark phone as sold in local cache
    await this.offlineStorage.updateCachedPhoneStatus(request.phoneId, 'sold');

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
      const cartItem = cartItems.find(c => c.phoneId === item.phoneId);
      if (!cartItem) continue;

      const payload: OfflineSalePayload = {
        phoneId: item.phoneId,
        saleDate: request.saleDate,
        salePrice: item.salePrice,
        costPrice: cartItem.costPrice,
        buyerName: request.customerInfo.name || null,
        buyerPhone: request.customerInfo.phone || null,
        buyerEmail: request.customerInfo.email || null,
        notes: request.notes,
        payments: request.payments,
        phoneDetails: {
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

      // Mark phone as sold in local cache
      await this.offlineStorage.updateCachedPhoneStatus(item.phoneId, 'sold');
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
   * Get cached phones for offline sale
   */
  async getAvailablePhones(): Promise<CachedPhone[]> {
    if (this.networkStatus.isOnline()) {
      // Refresh cache if online
      await this.refreshPhoneCache();
    }

    return this.offlineStorage.getAvailableCachedPhones();
  }

  /**
   * Get a specific cached phone
   */
  async getCachedPhone(id: string): Promise<CachedPhone | null> {
    return this.offlineStorage.getCachedPhone(id);
  }

  /**
   * Refresh the phone cache from server
   */
  async refreshPhoneCache(): Promise<void> {
    if (!this.networkStatus.isOnline()) {
      return;
    }

    this._isRefreshingCache.set(true);
    this._cacheError.set(null);

    try {
      // Fetch available phones from server
      const response = await this.phoneService.getPhones(
        { first: 0, rows: 1000 },
        { status: PhoneStatus.AVAILABLE }
      );

      const cachedPhones: CachedPhone[] = response.data.map(phone => ({
        id: phone.id,
        brandId: phone.brandId,
        brandName: phone.brandName,
        model: phone.model,
        storageGb: phone.storageGb,
        ramGb: phone.ramGb,
        color: phone.color,
        condition: phone.condition,
        imei: phone.imei,
        costPrice: phone.costPrice,
        sellingPrice: phone.sellingPrice,
        status: phone.status,
        taxRate: phone.taxRate,
        isTaxInclusive: phone.isTaxInclusive,
        isTaxExempt: phone.isTaxExempt,
        primaryImageUrl: phone.primaryImageUrl || null,
        cachedAt: new Date().toISOString()
      }));

      await this.offlineStorage.cachePhones(cachedPhones);
      this._lastCacheRefresh.set(new Date().toISOString());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh phone cache';
      this._cacheError.set(errorMessage);
      console.error('Failed to refresh phone cache:', error);
    } finally {
      this._isRefreshingCache.set(false);
    }
  }

  /**
   * Build a cart item from cached phone data
   */
  buildCartItemFromCache(phone: CachedPhone): CartItem {
    let basePrice: number;
    let taxAmount: number;

    if (phone.isTaxExempt) {
      basePrice = phone.sellingPrice;
      taxAmount = 0;
    } else if (phone.isTaxInclusive) {
      basePrice = phone.sellingPrice / (1 + phone.taxRate / 100);
      taxAmount = phone.sellingPrice - basePrice;
    } else {
      basePrice = phone.sellingPrice;
      taxAmount = phone.sellingPrice * (phone.taxRate / 100);
    }

    return {
      phoneId: phone.id,
      brandName: phone.brandName,
      model: phone.model,
      storageGb: phone.storageGb,
      color: phone.color,
      condition: phone.condition,
      imei: phone.imei,
      costPrice: phone.costPrice,
      sellingPrice: phone.sellingPrice,
      salePrice: phone.sellingPrice,
      taxRate: phone.taxRate,
      primaryImageUrl: phone.primaryImageUrl,
      isTaxInclusive: phone.isTaxInclusive,
      isTaxExempt: phone.isTaxExempt,
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
      phoneId: payload.phoneId,
      brandName: payload.phoneDetails.brandName,
      phoneName: payload.phoneDetails.model,
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
   * Check if a phone is available (considering offline sales)
   */
  async isPhoneAvailable(phoneId: string): Promise<boolean> {
    const cachedPhone = await this.offlineStorage.getCachedPhone(phoneId);
    return cachedPhone?.status === 'available';
  }

  /**
   * Get offline sales pending sync
   */
  async getOfflineSalesPending(): Promise<SyncQueueItem[]> {
    const items = await this.syncQueue.getPendingItems();
    return items.filter(item => item.operationType === 'CREATE_SALE');
  }

  /**
   * Clear phone cache
   */
  async clearPhoneCache(): Promise<void> {
    await this.offlineStorage.clearCachedPhones();
    this._lastCacheRefresh.set(null);
  }
}
