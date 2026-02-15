import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  LocationInventory,
  AssignProductToLocationRequest,
  UpdateLocationInventoryRequest,
  LocationInventoryListResponse,
  LocationInventoryStats,
  LocationInventoryFilter
} from '../../models/location-inventory.model';

/**
 * Location Inventory Service
 * API client for location-based inventory management
 * Feature: F-024 Multi-Location Inventory Support
 */
@Injectable({
  providedIn: 'root'
})
export class LocationInventoryService {
  constructor(private supabase: SupabaseService) { }

  async getInventoryByLocation(locationId: string, filter?: LocationInventoryFilter): Promise<LocationInventoryListResponse> {
    let query = this.supabase
      .from('location_inventory')
      .select(`
        *,
        product:products(
          id, model, status, selling_price, cost_price, condition,
          brand:brands(id, name)
        ),
        location:store_locations(id, name, code)
      `, { count: 'exact' })
      .eq('location_id', locationId)
      .gt('quantity', 0);

    if (filter?.lowStockOnly) {
      query = query.lte('quantity', 0);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const inventory = (data || []).map(this.mapToLocationInventory);
    const stats = await this.getLocationStats(locationId);

    return {
      data: inventory,
      total: count ?? 0,
      stats
    };
  }

  async getInventoryByProduct(productId: string): Promise<LocationInventory[]> {
    const { data, error } = await this.supabase
      .from('location_inventory')
      .select(`
        *,
        product:products(
          id, model, status, selling_price, cost_price, condition,
          brand:brands(id, name)
        ),
        location:store_locations(id, name, code)
      `)
      .eq('product_id', productId);

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(this.mapToLocationInventory);
  }

  async getQuantityAtLocation(productId: string, locationId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('location_inventory')
      .select('quantity')
      .eq('product_id', productId)
      .eq('location_id', locationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return 0;
      }
      throw new Error(error.message);
    }

    return data?.quantity || 0;
  }

  async assignProductToLocation(request: AssignProductToLocationRequest): Promise<LocationInventory> {
    const { data: result, error } = await this.supabase.rpc('assign_product_to_location', {
      p_product_id: request.productId,
      p_location_id: request.locationId,
      p_quantity: request.quantity ?? 1
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to assign product to location');
    }

    const inventory = await this.getInventoryByProduct(request.productId);
    return inventory.find(i => i.locationId === request.locationId)!;
  }

  async updateInventory(
    productId: string,
    locationId: string,
    request: UpdateLocationInventoryRequest
  ): Promise<LocationInventory> {
    const updateData: Record<string, unknown> = {};

    if (request.quantity !== undefined) updateData['quantity'] = request.quantity;
    if (request.minStockLevel !== undefined) updateData['min_stock_level'] = request.minStockLevel;
    if (request.maxStockLevel !== undefined) updateData['max_stock_level'] = request.maxStockLevel;

    const { error } = await this.supabase
      .from('location_inventory')
      .update(updateData)
      .eq('product_id', productId)
      .eq('location_id', locationId);

    if (error) {
      throw new Error(error.message);
    }

    const inventory = await this.getInventoryByProduct(productId);
    return inventory.find(i => i.locationId === locationId)!;
  }

  async adjustQuantity(productId: string, locationId: string, quantityChange: number): Promise<LocationInventory> {
    const currentQuantity = await this.getQuantityAtLocation(productId, locationId);
    const newQuantity = currentQuantity + quantityChange;

    if (newQuantity < 0) {
      throw new Error('Insufficient stock at location');
    }

    return this.updateInventory(productId, locationId, { quantity: newQuantity });
  }

  async deductStock(productId: string, locationId: string, quantity: number = 1): Promise<void> {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    await this.adjustQuantity(productId, locationId, -quantity);
  }

  async getLocationStats(locationId: string): Promise<LocationInventoryStats> {
    const { data, error } = await this.supabase
      .from('location_inventory')
      .select(`
        quantity,
        min_stock_level,
        product:products(selling_price)
      `)
      .eq('location_id', locationId)
      .gt('quantity', 0);

    if (error) {
      throw new Error(error.message);
    }

    const items = data || [];
    const totalProducts = items.length;
    const totalUnits = items.reduce((sum, item) => sum + (item.quantity as number), 0);
    const totalValue = items.reduce((sum, item) => {
      const productData = item.product as unknown as Record<string, unknown> | null;
      const price = (productData?.['selling_price'] as number) || 0;
      return sum + ((item.quantity as number) * price);
    }, 0);
    const lowStockCount = items.filter(item =>
      item.min_stock_level !== null && (item.quantity as number) <= (item.min_stock_level as number)
    ).length;

    return { totalProducts, totalUnits, totalValue, lowStockCount };
  }

  async getLowStockItems(locationId?: string): Promise<LocationInventory[]> {
    let query = this.supabase
      .from('location_inventory')
      .select(`
        *,
        product:products(
          id, model, status, selling_price, cost_price, condition,
          brand:brands(id, name)
        ),
        location:store_locations(id, name, code)
      `)
      .gt('quantity', 0);

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const items = (data || [])
      .filter(item => item.min_stock_level !== null && item.quantity <= item.min_stock_level)
      .map(this.mapToLocationInventory);

    return items;
  }

  private mapToLocationInventory(data: Record<string, unknown>): LocationInventory {
    const product = data['product'] as Record<string, unknown> | null;
    const location = data['location'] as Record<string, unknown> | null;
    const brand = product?.['brand'] as Record<string, unknown> | null;

    return {
      id: data['id'] as string,
      productId: data['product_id'] as string,
      locationId: data['location_id'] as string,
      quantity: data['quantity'] as number,
      minStockLevel: data['min_stock_level'] as number | null,
      maxStockLevel: data['max_stock_level'] as number | null,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string | null,
      product: product ? {
        id: product['id'] as string,
        model: product['model'] as string,
        status: product['status'] as string,
        sellingPrice: product['selling_price'] as number,
        costPrice: product['cost_price'] as number,
        condition: product['condition'] as string,
        brandId: brand?.['id'] as string || '',
        brandName: brand?.['name'] as string || ''
      } : undefined,
      location: location ? {
        id: location['id'] as string,
        name: location['name'] as string,
        code: location['code'] as string
      } : undefined
    };
  }
}
