/**
 * User Location Assignment Models
 * Frontend models for user-location assignments
 * Feature: F-024 Multi-Location Inventory Support
 */

export interface UserLocationAssignment {
  id: string;
  userId: string;
  locationId: string;
  isDefault: boolean;
  canViewAllLocations: boolean;
  createdAt: string;
  updatedAt: string | null;
  location?: {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
    isPrimary: boolean;
  };
}

export interface CreateUserLocationAssignmentRequest {
  userId: string;
  locationId: string;
  isDefault?: boolean;
  canViewAllLocations?: boolean;
}

export interface UpdateUserLocationAssignmentRequest {
  isDefault?: boolean;
  canViewAllLocations?: boolean;
}

export interface UserLocationsResponse {
  success: boolean;
  canViewAllLocations: boolean;
  locations: UserLocationDetail[];
}

export interface UserLocationDetail {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  isPrimary: boolean;
  isDefault: boolean;
  isAssigned: boolean;
}
