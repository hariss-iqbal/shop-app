import { InventoryTransferStatus } from '../enums';

/**
 * Inventory Transfer Models
 * Frontend models for inventory transfers between locations
 * Feature: F-024 Multi-Location Inventory Support
 */

export interface InventoryTransfer {
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
  items?: InventoryTransferItem[];
}

export interface InventoryTransferItem {
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

export interface TransferItemRequest {
  phoneId: string;
  quantity: number;
  notes?: string | null;
}

export interface InitiateTransferRequest {
  sourceLocationId: string;
  destinationLocationId: string;
  items: TransferItemRequest[];
  notes?: string | null;
}

export interface UpdateTransferRequest {
  notes?: string | null;
}

export interface InventoryTransferListResponse {
  data: InventoryTransfer[];
  total: number;
}

export interface InventoryTransferFilter {
  sourceLocationId?: string;
  destinationLocationId?: string;
  status?: InventoryTransferStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface TransferResult {
  success: boolean;
  transferId?: string;
  transferNumber?: string;
  error?: string;
}
