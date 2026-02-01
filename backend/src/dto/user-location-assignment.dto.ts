/**
 * User Location Assignment DTOs
 * Data Transfer Objects for user-location assignments
 * Feature: F-024 Multi-Location Inventory Support
 */

export interface CreateUserLocationAssignmentDto {
  userId: string;
  locationId: string;
  isDefault?: boolean;
  canViewAllLocations?: boolean;
}

export interface UpdateUserLocationAssignmentDto {
  isDefault?: boolean;
  canViewAllLocations?: boolean;
}

export interface UserLocationAssignmentResponseDto {
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

export interface UserLocationsResponseDto {
  success: boolean;
  canViewAllLocations: boolean;
  locations: UserLocationDetailDto[];
}

export interface UserLocationDetailDto {
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
