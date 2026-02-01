import { SupabaseClient } from '@supabase/supabase-js';
import { UserLocationAssignmentRepository } from '../repositories/user-location-assignment.repository';
import { StoreLocationRepository } from '../repositories/store-location.repository';
import { UserLocationAssignmentWithRelations } from '../entities/user-location-assignment.entity';
import {
  CreateUserLocationAssignmentDto,
  UpdateUserLocationAssignmentDto,
  UserLocationAssignmentResponseDto,
  UserLocationsResponseDto,
  UserLocationDetailDto
} from '../dto/user-location-assignment.dto';

/**
 * User Location Assignment Service
 * Business logic for user-location assignments
 * Feature: F-024 Multi-Location Inventory Support
 */
export class UserLocationAssignmentService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly userLocationAssignmentRepository: UserLocationAssignmentRepository,
    private readonly storeLocationRepository: StoreLocationRepository
  ) {}

  async getUserLocations(userId?: string): Promise<UserLocationsResponseDto> {
    const { data, error } = await this.supabase.rpc('get_user_locations', {
      p_user_id: userId || null
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: data.success,
      canViewAllLocations: data.canViewAllLocations,
      locations: (data.locations || []).map((loc: Record<string, unknown>) => ({
        id: loc.id as string,
        name: loc.name as string,
        code: loc.code as string,
        address: loc.address as string | null,
        phone: loc.phone as string | null,
        email: loc.email as string | null,
        isActive: loc.isActive as boolean,
        isPrimary: loc.isPrimary as boolean,
        isDefault: loc.isDefault as boolean,
        isAssigned: loc.isAssigned as boolean
      }))
    };
  }

  async getAssignmentsForUser(userId: string): Promise<UserLocationAssignmentResponseDto[]> {
    const assignments = await this.userLocationAssignmentRepository.findByUserId(userId);
    return assignments.map(this.toResponseDto);
  }

  async getDefaultLocation(userId: string): Promise<UserLocationAssignmentResponseDto | null> {
    const assignment = await this.userLocationAssignmentRepository.findDefaultForUser(userId);
    return assignment ? this.toResponseDto(assignment) : null;
  }

  async assignUserToLocation(dto: CreateUserLocationAssignmentDto): Promise<UserLocationAssignmentResponseDto> {
    const location = await this.storeLocationRepository.findById(dto.locationId);
    if (!location) {
      throw new Error(`Location with id "${dto.locationId}" not found`);
    }

    if (!location.is_active) {
      throw new Error(`Location "${location.name}" is not active`);
    }

    const existing = await this.userLocationAssignmentRepository.findByUserAndLocation(dto.userId, dto.locationId);
    if (existing) {
      throw new Error('User is already assigned to this location');
    }

    const assignment = await this.userLocationAssignmentRepository.create({
      user_id: dto.userId,
      location_id: dto.locationId,
      is_default: dto.isDefault ?? false,
      can_view_all_locations: dto.canViewAllLocations ?? false
    });

    const withRelations = await this.userLocationAssignmentRepository.findByUserAndLocation(dto.userId, dto.locationId);
    return this.toResponseDto(withRelations as UserLocationAssignmentWithRelations);
  }

  async updateAssignment(
    userId: string,
    locationId: string,
    dto: UpdateUserLocationAssignmentDto
  ): Promise<UserLocationAssignmentResponseDto> {
    const existing = await this.userLocationAssignmentRepository.findByUserAndLocation(userId, locationId);
    if (!existing) {
      throw new Error('User assignment not found');
    }

    const updateData = {
      ...(dto.isDefault !== undefined && { is_default: dto.isDefault }),
      ...(dto.canViewAllLocations !== undefined && { can_view_all_locations: dto.canViewAllLocations })
    };

    await this.userLocationAssignmentRepository.update(existing.id, updateData);

    const withRelations = await this.userLocationAssignmentRepository.findByUserAndLocation(userId, locationId);
    return this.toResponseDto(withRelations as UserLocationAssignmentWithRelations);
  }

  async setDefaultLocation(userId: string, locationId: string): Promise<UserLocationAssignmentResponseDto> {
    return this.updateAssignment(userId, locationId, { isDefault: true });
  }

  async setCanViewAllLocations(userId: string, locationId: string, canViewAll: boolean): Promise<UserLocationAssignmentResponseDto> {
    return this.updateAssignment(userId, locationId, { canViewAllLocations: canViewAll });
  }

  async removeAssignment(userId: string, locationId: string): Promise<void> {
    const existing = await this.userLocationAssignmentRepository.findByUserAndLocation(userId, locationId);
    if (!existing) {
      throw new Error('User assignment not found');
    }

    await this.userLocationAssignmentRepository.deleteByUserAndLocation(userId, locationId);
  }

  async canUserAccessLocation(userId: string, locationId: string): Promise<boolean> {
    const canViewAll = await this.userLocationAssignmentRepository.userCanViewAllLocations(userId);
    if (canViewAll) {
      return true;
    }

    const assignment = await this.userLocationAssignmentRepository.findByUserAndLocation(userId, locationId);
    return assignment !== null;
  }

  async getUsersAssignedToLocation(locationId: string): Promise<string[]> {
    const assignments = await this.userLocationAssignmentRepository.findByLocationId(locationId);
    return assignments.map(a => a.user_id);
  }

  private toResponseDto(assignment: UserLocationAssignmentWithRelations): UserLocationAssignmentResponseDto {
    return {
      id: assignment.id,
      userId: assignment.user_id,
      locationId: assignment.location_id,
      isDefault: assignment.is_default,
      canViewAllLocations: assignment.can_view_all_locations,
      createdAt: assignment.created_at,
      updatedAt: assignment.updated_at,
      location: assignment.location ? {
        id: assignment.location.id,
        name: assignment.location.name,
        code: assignment.location.code,
        isActive: assignment.location.is_active,
        isPrimary: assignment.location.is_primary
      } : undefined
    };
  }
}
