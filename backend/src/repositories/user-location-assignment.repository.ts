import { SupabaseClient } from '@supabase/supabase-js';
import {
  UserLocationAssignment,
  UserLocationAssignmentInsert,
  UserLocationAssignmentUpdate,
  UserLocationAssignmentWithRelations
} from '../entities/user-location-assignment.entity';

/**
 * User Location Assignment Repository
 * Handles database operations for UserLocationAssignment entity
 * Table: user_location_assignments
 * Feature: F-024 Multi-Location Inventory Support
 */
export class UserLocationAssignmentRepository {
  private readonly tableName = 'user_location_assignments';

  constructor(private readonly supabase: SupabaseClient) {}

  async findByUserId(userId: string): Promise<UserLocationAssignmentWithRelations[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        location:store_locations(id, name, code, is_active, is_primary)
      `)
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findByLocationId(locationId: string): Promise<UserLocationAssignment[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('location_id', locationId);

    if (error) throw error;
    return data || [];
  }

  async findByUserAndLocation(userId: string, locationId: string): Promise<UserLocationAssignment | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .eq('location_id', locationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findDefaultForUser(userId: string): Promise<UserLocationAssignmentWithRelations | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        location:store_locations(id, name, code, is_active, is_primary)
      `)
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(assignment: UserLocationAssignmentInsert): Promise<UserLocationAssignment> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(assignment)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, assignment: UserLocationAssignmentUpdate): Promise<UserLocationAssignment> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(assignment)
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

  async deleteByUserAndLocation(userId: string, locationId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('user_id', userId)
      .eq('location_id', locationId);

    if (error) throw error;
  }

  async userCanViewAllLocations(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('can_view_all_locations')
      .eq('user_id', userId)
      .eq('can_view_all_locations', true)
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  }

  async count(userId?: string): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  }
}
