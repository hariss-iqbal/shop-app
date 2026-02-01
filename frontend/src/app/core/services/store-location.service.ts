import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  StoreLocation,
  CreateStoreLocationRequest,
  UpdateStoreLocationRequest,
  StoreLocationListResponse,
  StoreLocationFilter
} from '../../models/store-location.model';

/**
 * Store Location Service
 * API client for store location management
 * Feature: F-024 Multi-Location Inventory Support
 */
@Injectable({
  providedIn: 'root'
})
export class StoreLocationService {
  private supabase = inject(SupabaseService);

  async getLocations(filter?: StoreLocationFilter): Promise<StoreLocationListResponse> {
    let query = this.supabase.from('store_locations').select('*', { count: 'exact' });

    if (filter?.isActive !== undefined) {
      query = query.eq('is_active', filter.isActive);
    }

    if (filter?.search) {
      query = query.or(`name.ilike.%${filter.search}%,code.ilike.%${filter.search}%`);
    }

    query = query.order('name', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: (data || []).map(this.mapToStoreLocation),
      total: count ?? 0
    };
  }

  async getActiveLocations(): Promise<StoreLocation[]> {
    const response = await this.getLocations({ isActive: true });
    return response.data;
  }

  async getLocationById(id: string): Promise<StoreLocation | null> {
    const { data, error } = await this.supabase
      .from('store_locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return this.mapToStoreLocation(data);
  }

  async getLocationByCode(code: string): Promise<StoreLocation | null> {
    const { data, error } = await this.supabase
      .from('store_locations')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return this.mapToStoreLocation(data);
  }

  async getPrimaryLocation(): Promise<StoreLocation | null> {
    const { data, error } = await this.supabase
      .from('store_locations')
      .select('*')
      .eq('is_primary', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return this.mapToStoreLocation(data);
  }

  async createLocation(request: CreateStoreLocationRequest): Promise<StoreLocation> {
    const { data, error } = await this.supabase
      .from('store_locations')
      .insert({
        name: request.name,
        code: request.code.toUpperCase(),
        address: request.address,
        phone: request.phone,
        email: request.email,
        is_active: request.isActive ?? true,
        is_primary: request.isPrimary ?? false,
        manager_user_id: request.managerUserId,
        notes: request.notes
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapToStoreLocation(data);
  }

  async updateLocation(id: string, request: UpdateStoreLocationRequest): Promise<StoreLocation> {
    const updateData: Record<string, unknown> = {};

    if (request.name !== undefined) updateData['name'] = request.name;
    if (request.code !== undefined) updateData['code'] = request.code.toUpperCase();
    if (request.address !== undefined) updateData['address'] = request.address;
    if (request.phone !== undefined) updateData['phone'] = request.phone;
    if (request.email !== undefined) updateData['email'] = request.email;
    if (request.isActive !== undefined) updateData['is_active'] = request.isActive;
    if (request.isPrimary !== undefined) updateData['is_primary'] = request.isPrimary;
    if (request.managerUserId !== undefined) updateData['manager_user_id'] = request.managerUserId;
    if (request.notes !== undefined) updateData['notes'] = request.notes;

    const { data, error } = await this.supabase
      .from('store_locations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapToStoreLocation(data);
  }

  async deleteLocation(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('store_locations')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async setLocationActive(id: string, isActive: boolean): Promise<StoreLocation> {
    return this.updateLocation(id, { isActive });
  }

  async setLocationPrimary(id: string): Promise<StoreLocation> {
    return this.updateLocation(id, { isPrimary: true });
  }

  private mapToStoreLocation(data: Record<string, unknown>): StoreLocation {
    return {
      id: data['id'] as string,
      name: data['name'] as string,
      code: data['code'] as string,
      address: data['address'] as string | null,
      phone: data['phone'] as string | null,
      email: data['email'] as string | null,
      isActive: data['is_active'] as boolean,
      isPrimary: data['is_primary'] as boolean,
      managerUserId: data['manager_user_id'] as string | null,
      notes: data['notes'] as string | null,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string | null
    };
  }
}
