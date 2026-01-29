import { PhoneService } from '../services/phone.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import { PhoneCondition, PhoneStatus } from '../enums';
import {
  CreatePhoneDto,
  UpdatePhoneDto,
  PhoneResponseDto,
  PhoneListResponseDto,
  PhoneFilterDto,
  PhoneSortDto,
  PhonePaginationDto,
  UpdatePhoneStatusDto,
  BulkUpdatePhoneStatusDto
} from '../dto/phone.dto';
import { PHONE_CONSTRAINTS } from '../constants/validation.constants';

/**
 * Phone Controller
 * HTTP request handling for Phone entity
 * Routes: /api/phones
 *
 * Security: All text inputs are sanitized to prevent XSS (F-058).
 * Notes and description are stored as plain text without HTML interpretation.
 */
export class PhoneController {
  private readonly sanitizer = new InputSanitizationService();

  constructor(private readonly phoneService: PhoneService) {}

  async getAll(
    filter?: PhoneFilterDto,
    sort?: PhoneSortDto,
    pagination?: PhonePaginationDto
  ): Promise<PhoneListResponseDto> {
    return this.phoneService.findAll(filter, sort, pagination);
  }

  async getAvailable(
    filter?: PhoneFilterDto,
    sort?: PhoneSortDto,
    pagination?: PhonePaginationDto
  ): Promise<PhoneListResponseDto> {
    return this.phoneService.findAvailable(filter, sort, pagination);
  }

  async getById(id: string): Promise<PhoneResponseDto> {
    const phone = await this.phoneService.findById(id);
    if (!phone) {
      throw new Error('Phone not found');
    }
    return phone;
  }

  async create(dto: CreatePhoneDto): Promise<PhoneResponseDto> {
    const sanitizedDto = this.sanitizeCreateDto(dto);
    this.validateCreateDto(sanitizedDto);
    return this.phoneService.create(sanitizedDto);
  }

  async update(id: string, dto: UpdatePhoneDto): Promise<PhoneResponseDto> {
    const sanitizedDto = this.sanitizeUpdateDto(dto);
    this.validateUpdateDto(sanitizedDto);
    return this.phoneService.update(id, sanitizedDto);
  }

  async updateStatus(id: string, status: PhoneStatus): Promise<PhoneResponseDto> {
    if (!Object.values(PhoneStatus).includes(status)) {
      throw new Error('Invalid phone status');
    }
    return this.phoneService.updateStatus(id, status);
  }

  async updateQuickStatus(id: string, dto: UpdatePhoneStatusDto): Promise<PhoneResponseDto> {
    if (!dto.status || !Object.values(PhoneStatus).includes(dto.status)) {
      throw new Error('Invalid phone status');
    }
    return this.phoneService.updateQuickStatus(id, dto.status);
  }

  async bulkUpdateStatus(dto: BulkUpdatePhoneStatusDto): Promise<void> {
    if (!dto.ids || dto.ids.length === 0) {
      throw new Error('At least one phone ID is required');
    }
    if (!dto.status || !Object.values(PhoneStatus).includes(dto.status)) {
      throw new Error('Invalid phone status');
    }
    return this.phoneService.bulkUpdateStatus(dto.ids, dto.status);
  }

  async delete(id: string): Promise<void> {
    return this.phoneService.delete(id);
  }

  async getStockCount(): Promise<{ count: number }> {
    const count = await this.phoneService.getStockCount();
    return { count };
  }

  async getStockValue(): Promise<{ value: number }> {
    const value = await this.phoneService.getStockValue();
    return { value };
  }

  async getRecentPhones(limit: number = 5): Promise<PhoneResponseDto[]> {
    return this.phoneService.getRecentPhones(limit);
  }

  async getExportData(filter?: PhoneFilterDto): Promise<PhoneResponseDto[]> {
    return this.phoneService.findAllForExport(filter);
  }

  private sanitizeCreateDto(dto: CreatePhoneDto): CreatePhoneDto {
    return {
      ...dto,
      model: this.sanitizer.sanitizeString(dto.model),
      description: dto.description ? this.sanitizer.sanitizeString(dto.description) : dto.description,
      color: dto.color ? this.sanitizer.sanitizeString(dto.color) : dto.color,
      imei: dto.imei ? this.sanitizer.sanitizeString(dto.imei) : dto.imei,
      notes: dto.notes ? this.sanitizer.sanitizeString(dto.notes) : dto.notes
    };
  }

  private sanitizeUpdateDto(dto: UpdatePhoneDto): UpdatePhoneDto {
    return {
      ...dto,
      model: dto.model ? this.sanitizer.sanitizeString(dto.model) : dto.model,
      description: dto.description ? this.sanitizer.sanitizeString(dto.description) : dto.description,
      color: dto.color ? this.sanitizer.sanitizeString(dto.color) : dto.color,
      imei: dto.imei ? this.sanitizer.sanitizeString(dto.imei) : dto.imei,
      notes: dto.notes ? this.sanitizer.sanitizeString(dto.notes) : dto.notes
    };
  }

  private validateCreateDto(dto: CreatePhoneDto): void {
    if (!dto.brandId) {
      throw new Error('Brand ID is required');
    }
    if (!dto.model || dto.model.trim().length === 0) {
      throw new Error('Model is required');
    }
    if (dto.model.length > PHONE_CONSTRAINTS.MODEL_MAX) {
      throw new Error(`Model must not exceed ${PHONE_CONSTRAINTS.MODEL_MAX} characters`);
    }
    if (!dto.condition || !Object.values(PhoneCondition).includes(dto.condition)) {
      throw new Error('Valid condition is required');
    }
    if (dto.costPrice === undefined || dto.costPrice < 0) {
      throw new Error('Valid cost price is required');
    }
    if (dto.sellingPrice === undefined || dto.sellingPrice < 0) {
      throw new Error('Valid selling price is required');
    }
    if (dto.description && dto.description.length > PHONE_CONSTRAINTS.DESCRIPTION_MAX) {
      throw new Error(`Description must not exceed ${PHONE_CONSTRAINTS.DESCRIPTION_MAX} characters`);
    }
    if (dto.color && dto.color.length > PHONE_CONSTRAINTS.COLOR_MAX) {
      throw new Error(`Color must not exceed ${PHONE_CONSTRAINTS.COLOR_MAX} characters`);
    }
    if (dto.imei && dto.imei.length > PHONE_CONSTRAINTS.IMEI_MAX) {
      throw new Error(`IMEI must not exceed ${PHONE_CONSTRAINTS.IMEI_MAX} characters`);
    }
    if (dto.notes && dto.notes.length > PHONE_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must not exceed ${PHONE_CONSTRAINTS.NOTES_MAX} characters`);
    }
    if (dto.batteryHealth !== undefined && dto.batteryHealth !== null) {
      if (dto.batteryHealth < PHONE_CONSTRAINTS.BATTERY_HEALTH_MIN || dto.batteryHealth > PHONE_CONSTRAINTS.BATTERY_HEALTH_MAX) {
        throw new Error(`Battery health must be between ${PHONE_CONSTRAINTS.BATTERY_HEALTH_MIN} and ${PHONE_CONSTRAINTS.BATTERY_HEALTH_MAX}`);
      }
    }
  }

  private validateUpdateDto(dto: UpdatePhoneDto): void {
    if (dto.model !== undefined) {
      if (dto.model.trim().length === 0) {
        throw new Error('Model cannot be empty');
      }
      if (dto.model.length > PHONE_CONSTRAINTS.MODEL_MAX) {
        throw new Error(`Model must not exceed ${PHONE_CONSTRAINTS.MODEL_MAX} characters`);
      }
    }
    if (dto.condition && !Object.values(PhoneCondition).includes(dto.condition)) {
      throw new Error('Invalid condition');
    }
    if (dto.costPrice !== undefined && dto.costPrice < 0) {
      throw new Error('Cost price cannot be negative');
    }
    if (dto.sellingPrice !== undefined && dto.sellingPrice < 0) {
      throw new Error('Selling price cannot be negative');
    }
    if (dto.description && dto.description.length > PHONE_CONSTRAINTS.DESCRIPTION_MAX) {
      throw new Error(`Description must not exceed ${PHONE_CONSTRAINTS.DESCRIPTION_MAX} characters`);
    }
    if (dto.color && dto.color.length > PHONE_CONSTRAINTS.COLOR_MAX) {
      throw new Error(`Color must not exceed ${PHONE_CONSTRAINTS.COLOR_MAX} characters`);
    }
    if (dto.imei && dto.imei.length > PHONE_CONSTRAINTS.IMEI_MAX) {
      throw new Error(`IMEI must not exceed ${PHONE_CONSTRAINTS.IMEI_MAX} characters`);
    }
    if (dto.notes && dto.notes.length > PHONE_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must not exceed ${PHONE_CONSTRAINTS.NOTES_MAX} characters`);
    }
    if (dto.batteryHealth !== undefined && dto.batteryHealth !== null) {
      if (dto.batteryHealth < PHONE_CONSTRAINTS.BATTERY_HEALTH_MIN || dto.batteryHealth > PHONE_CONSTRAINTS.BATTERY_HEALTH_MAX) {
        throw new Error(`Battery health must be between ${PHONE_CONSTRAINTS.BATTERY_HEALTH_MIN} and ${PHONE_CONSTRAINTS.BATTERY_HEALTH_MAX}`);
      }
    }
  }
}
