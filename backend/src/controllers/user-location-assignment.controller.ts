import { UserLocationAssignmentService } from '../services/user-location-assignment.service';
import {
  CreateUserLocationAssignmentDto,
  UpdateUserLocationAssignmentDto,
  UserLocationAssignmentResponseDto,
  UserLocationsResponseDto
} from '../dto/user-location-assignment.dto';

/**
 * User Location Assignment Controller
 * HTTP handlers for user-location assignments
 * Feature: F-024 Multi-Location Inventory Support
 */
export class UserLocationAssignmentController {
  constructor(
    private readonly userLocationAssignmentService: UserLocationAssignmentService
  ) {}

  async getUserLocations(userId?: string): Promise<UserLocationsResponseDto> {
    return this.userLocationAssignmentService.getUserLocations(userId);
  }

  async getAssignmentsForUser(userId: string): Promise<UserLocationAssignmentResponseDto[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.userLocationAssignmentService.getAssignmentsForUser(userId);
  }

  async getDefaultLocation(userId: string): Promise<UserLocationAssignmentResponseDto | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.userLocationAssignmentService.getDefaultLocation(userId);
  }

  async assignUserToLocation(dto: CreateUserLocationAssignmentDto): Promise<UserLocationAssignmentResponseDto> {
    this.validateCreateDto(dto);
    return this.userLocationAssignmentService.assignUserToLocation(dto);
  }

  async updateAssignment(
    userId: string,
    locationId: string,
    dto: UpdateUserLocationAssignmentDto
  ): Promise<UserLocationAssignmentResponseDto> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    return this.userLocationAssignmentService.updateAssignment(userId, locationId, dto);
  }

  async setDefaultLocation(userId: string, locationId: string): Promise<UserLocationAssignmentResponseDto> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    return this.userLocationAssignmentService.setDefaultLocation(userId, locationId);
  }

  async setCanViewAllLocations(
    userId: string,
    locationId: string,
    canViewAll: boolean
  ): Promise<UserLocationAssignmentResponseDto> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    return this.userLocationAssignmentService.setCanViewAllLocations(userId, locationId, canViewAll);
  }

  async removeAssignment(userId: string, locationId: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    return this.userLocationAssignmentService.removeAssignment(userId, locationId);
  }

  async canUserAccessLocation(userId: string, locationId: string): Promise<boolean> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    return this.userLocationAssignmentService.canUserAccessLocation(userId, locationId);
  }

  async getUsersAssignedToLocation(locationId: string): Promise<string[]> {
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    return this.userLocationAssignmentService.getUsersAssignedToLocation(locationId);
  }

  private validateCreateDto(dto: CreateUserLocationAssignmentDto): void {
    if (!dto.userId) {
      throw new Error('User ID is required');
    }
    if (!dto.locationId) {
      throw new Error('Location ID is required');
    }
  }
}
