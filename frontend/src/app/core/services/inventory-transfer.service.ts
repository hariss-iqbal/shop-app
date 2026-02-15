import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { InventoryTransferStatus } from '../../enums';
import {
  InventoryTransfer,
  InventoryTransferItem,
  InitiateTransferRequest,
  UpdateTransferRequest,
  InventoryTransferListResponse,
  InventoryTransferFilter,
  TransferResult
} from '../../models/inventory-transfer.model';

export interface TransferLazyLoadParams {
  first: number;
  rows: number;
  sortField?: string;
  sortOrder?: number;
}

/**
 * Inventory Transfer Service
 * API client for inventory transfers between locations
 * Feature: F-024 Multi-Location Inventory Support
 */
@Injectable({
  providedIn: 'root'
})
export class InventoryTransferService {
  constructor(private supabase: SupabaseService) { }

  async getTransfers(
    params: TransferLazyLoadParams,
    filter?: InventoryTransferFilter
  ): Promise<InventoryTransferListResponse> {
    let query = this.supabase
      .from('inventory_transfers')
      .select(`
        *,
        source_location:store_locations!source_location_id(id, name, code),
        destination_location:store_locations!destination_location_id(id, name, code),
        items:inventory_transfer_items(
          id, transfer_id, product_id, quantity, notes, created_at,
          product:products(id, model, condition, brand:brands(id, name))
        )
      `, { count: 'exact' });

    if (filter?.sourceLocationId) {
      query = query.eq('source_location_id', filter.sourceLocationId);
    }
    if (filter?.destinationLocationId) {
      query = query.eq('destination_location_id', filter.destinationLocationId);
    }
    if (filter?.status) {
      query = query.eq('status', filter.status);
    }
    if (filter?.dateFrom) {
      query = query.gte('initiated_at', filter.dateFrom);
    }
    if (filter?.dateTo) {
      query = query.lte('initiated_at', filter.dateTo);
    }

    const sortField = params.sortField || 'initiated_at';
    const sortOrder = params.sortOrder === 1;
    query = query.order(sortField, { ascending: sortOrder });

    const end = params.first + params.rows - 1;
    query = query.range(params.first, end);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: (data || []).map(this.mapToInventoryTransfer),
      total: count ?? 0
    };
  }

  async getTransferById(id: string): Promise<InventoryTransfer | null> {
    const { data, error } = await this.supabase
      .from('inventory_transfers')
      .select(`
        *,
        source_location:store_locations!source_location_id(id, name, code),
        destination_location:store_locations!destination_location_id(id, name, code),
        items:inventory_transfer_items(
          id, transfer_id, product_id, quantity, notes, created_at,
          product:products(id, model, condition, brand:brands(id, name))
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return this.mapToInventoryTransfer(data);
  }

  async getTransferByNumber(transferNumber: string): Promise<InventoryTransfer | null> {
    const { data, error } = await this.supabase
      .from('inventory_transfers')
      .select(`
        *,
        source_location:store_locations!source_location_id(id, name, code),
        destination_location:store_locations!destination_location_id(id, name, code),
        items:inventory_transfer_items(
          id, transfer_id, product_id, quantity, notes, created_at,
          product:products(id, model, condition, brand:brands(id, name))
        )
      `)
      .eq('transfer_number', transferNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return this.mapToInventoryTransfer(data);
  }

  async initiateTransfer(request: InitiateTransferRequest): Promise<TransferResult> {
    const { data, error } = await this.supabase.rpc('initiate_inventory_transfer', {
      p_source_location_id: request.sourceLocationId,
      p_destination_location_id: request.destinationLocationId,
      p_items: request.items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        notes: item.notes || null
      })),
      p_notes: request.notes || null
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: data.success,
      transferId: data.transferId,
      transferNumber: data.transferNumber,
      error: data.error
    };
  }

  async completeTransfer(id: string): Promise<TransferResult> {
    const { data, error } = await this.supabase.rpc('complete_inventory_transfer', {
      p_transfer_id: id
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: data.success,
      transferId: data.transferId,
      error: data.error
    };
  }

  async cancelTransfer(id: string): Promise<TransferResult> {
    const { data, error } = await this.supabase.rpc('cancel_inventory_transfer', {
      p_transfer_id: id
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: data.success,
      transferId: data.transferId,
      error: data.error
    };
  }

  async updateTransfer(id: string, request: UpdateTransferRequest): Promise<InventoryTransfer> {
    const { error } = await this.supabase
      .from('inventory_transfers')
      .update({ notes: request.notes })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    const transfer = await this.getTransferById(id);
    return transfer!;
  }

  async startTransit(id: string): Promise<InventoryTransfer> {
    const { error } = await this.supabase
      .from('inventory_transfers')
      .update({ status: InventoryTransferStatus.IN_TRANSIT })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    const transfer = await this.getTransferById(id);
    return transfer!;
  }

  async getPendingTransfersCount(locationId?: string): Promise<number> {
    let query = this.supabase
      .from('inventory_transfers')
      .select('*', { count: 'exact', head: true })
      .eq('status', InventoryTransferStatus.PENDING);

    if (locationId) {
      query = query.eq('source_location_id', locationId);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return count ?? 0;
  }

  async getInTransitTransfersCount(locationId?: string): Promise<number> {
    let query = this.supabase
      .from('inventory_transfers')
      .select('*', { count: 'exact', head: true })
      .eq('status', InventoryTransferStatus.IN_TRANSIT);

    if (locationId) {
      query = query.eq('destination_location_id', locationId);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return count ?? 0;
  }

  private mapToInventoryTransfer(data: Record<string, unknown>): InventoryTransfer {
    const sourceLocation = data['source_location'] as Record<string, unknown> | null;
    const destinationLocation = data['destination_location'] as Record<string, unknown> | null;
    const items = (data['items'] as Array<Record<string, unknown>>) || [];

    return {
      id: data['id'] as string,
      transferNumber: data['transfer_number'] as string,
      sourceLocationId: data['source_location_id'] as string,
      destinationLocationId: data['destination_location_id'] as string,
      status: data['status'] as InventoryTransferStatus,
      initiatedByUserId: data['initiated_by_user_id'] as string | null,
      completedByUserId: data['completed_by_user_id'] as string | null,
      notes: data['notes'] as string | null,
      initiatedAt: data['initiated_at'] as string,
      completedAt: data['completed_at'] as string | null,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string | null,
      sourceLocation: sourceLocation ? {
        id: sourceLocation['id'] as string,
        name: sourceLocation['name'] as string,
        code: sourceLocation['code'] as string
      } : undefined,
      destinationLocation: destinationLocation ? {
        id: destinationLocation['id'] as string,
        name: destinationLocation['name'] as string,
        code: destinationLocation['code'] as string
      } : undefined,
      items: items.map(this.mapToTransferItem)
    };
  }

  private mapToTransferItem(data: Record<string, unknown>): InventoryTransferItem {
    const product = data['product'] as Record<string, unknown> | null;
    const brand = product?.['brand'] as Record<string, unknown> | null;

    return {
      id: data['id'] as string,
      transferId: data['transfer_id'] as string,
      productId: data['product_id'] as string,
      quantity: data['quantity'] as number,
      notes: data['notes'] as string | null,
      createdAt: data['created_at'] as string,
      product: product ? {
        id: product['id'] as string,
        model: product['model'] as string,
        condition: product['condition'] as string,
        brandId: brand?.['id'] as string || '',
        brandName: brand?.['name'] as string || ''
      } : undefined
    };
  }
}
