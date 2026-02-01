/**
 * User Location Assignment Entity
 * Links users to their assigned store locations
 * Database table: user_location_assignments
 * Feature: F-024 Multi-Location Inventory Support
 */
export interface UserLocationAssignment {
  id: string;
  user_id: string;
  location_id: string;
  is_default: boolean;
  can_view_all_locations: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface UserLocationAssignmentInsert {
  id?: string;
  user_id: string;
  location_id: string;
  is_default?: boolean;
  can_view_all_locations?: boolean;
  created_at?: string;
  updated_at?: string | null;
}

export interface UserLocationAssignmentUpdate {
  id?: string;
  user_id?: string;
  location_id?: string;
  is_default?: boolean;
  can_view_all_locations?: boolean;
  updated_at?: string | null;
}

export interface UserLocationAssignmentWithRelations extends UserLocationAssignment {
  location?: {
    id: string;
    name: string;
    code: string;
    is_active: boolean;
    is_primary: boolean;
  };
}
