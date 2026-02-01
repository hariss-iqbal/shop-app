import { InventoryTransferService } from '../services/inventory-transfer.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import { InventoryTransferStatus, isValidInventoryTransferStatus } from '../enums';
import {
  InitiateTransferDto,
  UpdateTransferDto,
  InventoryTransferResponseDto,
  InventoryTransferListResponseDto,
  InventoryTransferFilterDto,
  InventoryTransferSortDto,
  InventoryTransferPaginationDto,
  TransferResultDto
} from '../dto/inventory-transfer.dto';
import { INVENTORY_TRANSFER_CONSTRAINTS } from '../constants/validation.constants';

/**
 * Inventory Transfer Controller
 * HTTP handlers for inventory transfers between locations
 * Feature: F-024 Multi-Location Inventory Support
 */
export class InventoryTransferController {
  constructor(
    private readonly inventoryTransferService: InventoryTransferService,
    private readonly sanitizationService: InputSanitizationService
  ) {}

  async findAll(
    filter?: InventoryTransferFilterDto,
    sort?: InventoryTransferSortDto,
    pagination?: InventoryTransferPaginationDto
  ): Promise<InventoryTransferListResponseDto> {
    if (filter?.status && !isValidInventoryTransferStatus(filter.status)) {
      throw new Error('Invalid transfer status');
    }

    return this.inventoryTransferService.findAll(filter, sort, pagination);
  }

  async findById(id: string): Promise<InventoryTransferResponseDto | null> {
    if (!id) {
      throw new Error('Transfer ID is required');
    }
    return this.inventoryTransferService.findById(id);
  }

  async findByTransferNumber(transferNumber: string): Promise<InventoryTransferResponseDto | null> {
    if (!transferNumber) {
      throw new Error('Transfer number is required');
    }
    return this.inventoryTransferService.findByTransferNumber(transferNumber);
  }

  async initiateTransfer(dto: InitiateTransferDto): Promise<TransferResultDto> {
    this.validateInitiateDto(dto);

    const sanitizedDto: InitiateTransferDto = {
      sourceLocationId: dto.sourceLocationId,
      destinationLocationId: dto.destinationLocationId,
      items: dto.items.map(item => ({
        phoneId: item.phoneId,
        quantity: item.quantity,
        notes: item.notes ? this.sanitizationService.sanitize(item.notes) : null
      })),
      notes: dto.notes ? this.sanitizationService.sanitize(dto.notes) : null
    };

    return this.inventoryTransferService.initiateTransfer(sanitizedDto);
  }

  async completeTransfer(id: string): Promise<TransferResultDto> {
    if (!id) {
      throw new Error('Transfer ID is required');
    }
    return this.inventoryTransferService.completeTransfer(id);
  }

  async cancelTransfer(id: string): Promise<TransferResultDto> {
    if (!id) {
      throw new Error('Transfer ID is required');
    }
    return this.inventoryTransferService.cancelTransfer(id);
  }

  async updateTransfer(id: string, dto: UpdateTransferDto): Promise<InventoryTransferResponseDto> {
    if (!id) {
      throw new Error('Transfer ID is required');
    }

    if (dto.notes && dto.notes.length > INVENTORY_TRANSFER_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must be at most ${INVENTORY_TRANSFER_CONSTRAINTS.NOTES_MAX} characters`);
    }

    const sanitizedDto: UpdateTransferDto = {
      notes: dto.notes ? this.sanitizationService.sanitize(dto.notes) : null
    };

    return this.inventoryTransferService.updateTransfer(id, sanitizedDto);
  }

  async startTransit(id: string): Promise<InventoryTransferResponseDto> {
    if (!id) {
      throw new Error('Transfer ID is required');
    }
    return this.inventoryTransferService.startTransit(id);
  }

  async getPendingTransfersCount(locationId?: string): Promise<number> {
    return this.inventoryTransferService.getPendingTransfersCount(locationId);
  }

  async getInTransitTransfersCount(locationId?: string): Promise<number> {
    return this.inventoryTransferService.getInTransitTransfersCount(locationId);
  }

  private validateInitiateDto(dto: InitiateTransferDto): void {
    if (!dto.sourceLocationId) {
      throw new Error('Source location ID is required');
    }
    if (!dto.destinationLocationId) {
      throw new Error('Destination location ID is required');
    }
    if (dto.sourceLocationId === dto.destinationLocationId) {
      throw new Error('Source and destination locations must be different');
    }
    if (!dto.items || dto.items.length === 0) {
      throw new Error('At least one item is required');
    }

    for (const item of dto.items) {
      if (!item.phoneId) {
        throw new Error('Phone ID is required for each item');
      }
      if (!item.quantity || item.quantity < INVENTORY_TRANSFER_CONSTRAINTS.QUANTITY_MIN) {
        throw new Error(`Quantity must be at least ${INVENTORY_TRANSFER_CONSTRAINTS.QUANTITY_MIN}`);
      }
      if (item.notes && item.notes.length > INVENTORY_TRANSFER_CONSTRAINTS.ITEM_NOTES_MAX) {
        throw new Error(`Item notes must be at most ${INVENTORY_TRANSFER_CONSTRAINTS.ITEM_NOTES_MAX} characters`);
      }
    }

    if (dto.notes && dto.notes.length > INVENTORY_TRANSFER_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must be at most ${INVENTORY_TRANSFER_CONSTRAINTS.NOTES_MAX} characters`);
    }
  }
}
