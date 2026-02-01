import { InventoryTransferStatus } from '../enums';

/**
 * Inventory Transfer DTOs
 * Data Transfer Objects for inventory transfers between locations
 * Feature: F-024 Multi-Location Inventory Support
 */

export interface TransferItemDto {
  phoneId: string;
  quantity: number;
  notes?: string | null;
}

export interface InitiateTransferDto {
  sourceLocationId: string;
  destinationLocationId: string;
  items: TransferItemDto[];
  notes?: string | null;
}

export interface UpdateTransferDto {
  notes?: string | null;
}

export interface InventoryTransferItemResponseDto {
  id: string;
  transferId: string;
  phoneId: string;
  quantity: number;
  notes: string | null;
  createdAt: string;
  phone?: {
    id: string;
    model: string;
    condition: string;
    brandId: string;
    brandName: string;
  };
}

export interface InventoryTransferResponseDto {
  id: string;
  transferNumber: string;
  sourceLocationId: string;
  destinationLocationId: string;
  status: InventoryTransferStatus;
  initiatedByUserId: string | null;
  completedByUserId: string | null;
  notes: string | null;
  initiatedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  sourceLocation?: {
    id: string;
    name: string;
    code: string;
  };
  destinationLocation?: {
    id: string;
    name: string;
    code: string;
  };
  items?: InventoryTransferItemResponseDto[];
}

export interface InventoryTransferListResponseDto {
  data: InventoryTransferResponseDto[];
  total: number;
}

export interface InventoryTransferFilterDto {
  sourceLocationId?: string;
  destinationLocationId?: string;
  status?: InventoryTransferStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface InventoryTransferSortDto {
  field: 'transfer_number' | 'initiated_at' | 'completed_at' | 'status';
  direction: 'asc' | 'desc';
}

export interface InventoryTransferPaginationDto {
  page: number;
  limit: number;
}

export interface TransferResultDto {
  success: boolean;
  transferId?: string;
  transferNumber?: string;
  error?: string;
}
