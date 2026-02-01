import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  UserLocationAssignment,
  CreateUserLocationAssignmentRequest,
  UpdateUserLocationAssignmentRequest,
  UserLocationsResponse,
  UserLocationDetail
} from '../../models/user-location-assignment.model';

/**
 * User Location Assignment Service
 * API client for user-location assignments
 * Feature: F-024 Multi-Location Inventory Support
 */
@Injectable({
  providedIn: 'root'
})
export class UserLocationAssignmentService {
  private supabase = inject(SupabaseService);

  private _userLocations = signal<UserLocationDetail[]>([]);
  private _canViewAllLocations = signal<boolean>(false);
  private _currentLocationId = signal<string | null>(null);

  readonly userLocations = this._userLocations.asReadonly();
  readonly canViewAllLocations = this._canViewAllLocations.asReadonly();
  readonly currentLocationId = this._currentLocationId.asReadonly();

  readonly currentLocation = computed(() => {
    const locationId = this._currentLocationId();
    if (!locationId) return null;
    return this._userLocations().find(l => l.id === locationId) || null;
  });

  readonly defaultLocation = computed(() => {
    return this._userLocations().find(l => l.isDefault) || this._userLocations()[0] || null;
  });

  async loadUserLocations(userId?: string): Promise<UserLocationsResponse> {
    const { data, error } = await this.supabase.rpc('get_user_locations', {
      p_user_id: userId || null
    });

    if (error) {
      throw new Error(error.message);
    }

    const locations = (data.locations || []).map((loc: Record<string, unknown>) => ({
      id: loc['id'] as string,
      name: loc['name'] as string,
      code: loc['code'] as string,
      address: loc['address'] as string | null,
      phone: loc['phone'] as string | null,
      email: loc['email'] as string | null,
      isActive: loc['isActive'] as boolean,
      isPrimary: loc['isPrimary'] as boolean,
      isDefault: loc['isDefault'] as boolean,
      isAssigned: loc['isAssigned'] as boolean
    }));

    this._userLocations.set(locations);
    this._canViewAllLocations.set(data.canViewAllLocations);

    if (!this._currentLocationId()) {
      const defaultLoc = locations.find((l: UserLocationDetail) => l.isDefault) || locations[0];
      if (defaultLoc) {
        this._currentLocationId.set(defaultLoc.id);
      }
    }

    return {
      success: data.success,
      canViewAllLocations: data.canViewAllLocations,
      locations
    };
  }

  setCurrentLocation(locationId: string): void {
    const location = this._userLocations().find(l => l.id === locationId);
    if (location) {
      this._currentLocationId.set(locationId);
    }
  }

  async getAssignmentsForUser(userId: string): Promise<UserLocationAssignment[]> {
    const { data, error } = await this.supabase
      .from('user_location_assignments')
      .select(`
        *,
        location:store_locations(id, name, code, is_active, is_primary)
      `)
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(this.mapToUserLocationAssignment);
  }

  async getDefaultLocation(userId: string): Promise<UserLocationAssignment | null> {
    const { data, error } = await this.supabase
      .from('user_location_assignments')
      .select(`
        *,
        location:store_locations(id, name, code, is_active, is_primary)
      `)
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return this.mapToUserLocationAssignment(data);
  }

  async assignUserToLocation(request: CreateUserLocationAssignmentRequest): Promise<UserLocationAssignment> {
    const { data, error } = await this.supabase
      .from('user_location_assignments')
      .insert({
        user_id: request.userId,
        location_id: request.locationId,
        is_default: request.isDefault ?? false,
        can_view_all_locations: request.canViewAllLocations ?? false
      })
      .select(`
        *,
        location:store_locations(id, name, code, is_active, is_primary)
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapToUserLocationAssignment(data);
  }

  async updateAssignment(
    userId: string,
    locationId: string,
    request: UpdateUserLocationAssignmentRequest
  ): Promise<UserLocationAssignment> {
    const updateData: Record<string, unknown> = {};

    if (request.isDefault !== undefined) updateData['is_default'] = request.isDefault;
    if (request.canViewAllLocations !== undefined) updateData['can_view_all_locations'] = request.canViewAllLocations;

    const { data, error } = await this.supabase
      .from('user_location_assignments')
      .update(updateData)
      .eq('user_id', userId)
      .eq('location_id', locationId)
      .select(`
        *,
        location:store_locations(id, name, code, is_active, is_primary)
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapToUserLocationAssignment(data);
  }

  async setDefaultLocation(userId: string, locationId: string): Promise<UserLocationAssignment> {
    return this.updateAssignment(userId, locationId, { isDefault: true });
  }

  async removeAssignment(userId: string, locationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_location_assignments')
      .delete()
      .eq('user_id', userId)
      .eq('location_id', locationId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async canUserAccessLocation(userId: string, locationId: string): Promise<boolean> {
    const { data: canViewAll } = await this.supabase
      .from('user_location_assignments')
      .select('can_view_all_locations')
      .eq('user_id', userId)
      .eq('can_view_all_locations', true)
      .limit(1);

    if (canViewAll && canViewAll.length > 0) {
      return true;
    }

    const { data } = await this.supabase
      .from('user_location_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('location_id', locationId)
      .single();

    return data !== null;
  }

  private mapToUserLocationAssignment(data: Record<string, unknown>): UserLocationAssignment {
    const location = data['location'] as Record<string, unknown> | null;

    return {
      id: data['id'] as string,
      userId: data['user_id'] as string,
      locationId: data['location_id'] as string,
      isDefault: data['is_default'] as boolean,
      canViewAllLocations: data['can_view_all_locations'] as boolean,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string | null,
      location: location ? {
        id: location['id'] as string,
        name: location['name'] as string,
        code: location['code'] as string,
        isActive: location['is_active'] as boolean,
        isPrimary: location['is_primary'] as boolean
      } : undefined
    };
  }
}
