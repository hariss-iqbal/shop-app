import { SupplierService } from '../services/supplier.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierResponseDto,
  SupplierListResponseDto
} from '../dto/supplier.dto';
import { SUPPLIER_CONSTRAINTS } from '../constants/validation.constants';

/**
 * Supplier Controller
 * HTTP request handling for Supplier entity
 * Routes: /api/suppliers
 *
 * Security: All text inputs are sanitized to prevent XSS (F-058).
 * Address and notes are stored as plain text without HTML interpretation.
 */
export class SupplierController {
  private readonly sanitizer = new InputSanitizationService();

  constructor(private readonly supplierService: SupplierService) {}

  async getAll(): Promise<SupplierListResponseDto> {
    return this.supplierService.findAll();
  }

  async getById(id: string): Promise<SupplierResponseDto> {
    const supplier = await this.supplierService.findById(id);
    if (!supplier) {
      throw new Error('Supplier not found');
    }
    return supplier;
  }

  async create(dto: CreateSupplierDto): Promise<SupplierResponseDto> {
    const sanitizedDto = this.sanitizeDto(dto);
    this.validateCreateDto(sanitizedDto);
    return this.supplierService.create(sanitizedDto);
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<SupplierResponseDto> {
    const sanitizedDto = this.sanitizeDto(dto);
    this.validateUpdateDto(sanitizedDto);
    return this.supplierService.update(id, sanitizedDto);
  }

  async delete(id: string): Promise<void> {
    return this.supplierService.delete(id);
  }

  private sanitizeDto<T extends Partial<CreateSupplierDto>>(dto: T): T {
    return {
      ...dto,
      name: dto.name ? this.sanitizer.sanitizeString(dto.name) : dto.name,
      contactPerson: dto.contactPerson ? this.sanitizer.sanitizeString(dto.contactPerson) : dto.contactPerson,
      contactEmail: dto.contactEmail?.trim(),
      contactPhone: dto.contactPhone ? this.sanitizer.sanitizeString(dto.contactPhone) : dto.contactPhone,
      address: dto.address ? this.sanitizer.sanitizeString(dto.address) : dto.address,
      notes: dto.notes ? this.sanitizer.sanitizeString(dto.notes) : dto.notes
    };
  }

  private validateCreateDto(dto: CreateSupplierDto): void {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('Supplier name is required');
    }
    if (dto.name.length > SUPPLIER_CONSTRAINTS.NAME_MAX) {
      throw new Error(`Supplier name must not exceed ${SUPPLIER_CONSTRAINTS.NAME_MAX} characters`);
    }
    if (dto.contactPerson && dto.contactPerson.length > SUPPLIER_CONSTRAINTS.CONTACT_PERSON_MAX) {
      throw new Error(`Contact person must not exceed ${SUPPLIER_CONSTRAINTS.CONTACT_PERSON_MAX} characters`);
    }
    if (dto.contactEmail && dto.contactEmail.length > SUPPLIER_CONSTRAINTS.CONTACT_EMAIL_MAX) {
      throw new Error(`Contact email must not exceed ${SUPPLIER_CONSTRAINTS.CONTACT_EMAIL_MAX} characters`);
    }
    if (dto.contactPhone && dto.contactPhone.length > SUPPLIER_CONSTRAINTS.CONTACT_PHONE_MAX) {
      throw new Error(`Contact phone must not exceed ${SUPPLIER_CONSTRAINTS.CONTACT_PHONE_MAX} characters`);
    }
    if (dto.address && dto.address.length > SUPPLIER_CONSTRAINTS.ADDRESS_MAX) {
      throw new Error(`Address must not exceed ${SUPPLIER_CONSTRAINTS.ADDRESS_MAX} characters`);
    }
    if (dto.notes && dto.notes.length > SUPPLIER_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must not exceed ${SUPPLIER_CONSTRAINTS.NOTES_MAX} characters`);
    }
  }

  private validateUpdateDto(dto: UpdateSupplierDto): void {
    if (dto.name !== undefined) {
      if (dto.name.trim().length === 0) {
        throw new Error('Supplier name cannot be empty');
      }
      if (dto.name.length > SUPPLIER_CONSTRAINTS.NAME_MAX) {
        throw new Error(`Supplier name must not exceed ${SUPPLIER_CONSTRAINTS.NAME_MAX} characters`);
      }
    }
    if (dto.contactPerson && dto.contactPerson.length > SUPPLIER_CONSTRAINTS.CONTACT_PERSON_MAX) {
      throw new Error(`Contact person must not exceed ${SUPPLIER_CONSTRAINTS.CONTACT_PERSON_MAX} characters`);
    }
    if (dto.contactEmail && dto.contactEmail.length > SUPPLIER_CONSTRAINTS.CONTACT_EMAIL_MAX) {
      throw new Error(`Contact email must not exceed ${SUPPLIER_CONSTRAINTS.CONTACT_EMAIL_MAX} characters`);
    }
    if (dto.contactPhone && dto.contactPhone.length > SUPPLIER_CONSTRAINTS.CONTACT_PHONE_MAX) {
      throw new Error(`Contact phone must not exceed ${SUPPLIER_CONSTRAINTS.CONTACT_PHONE_MAX} characters`);
    }
    if (dto.address && dto.address.length > SUPPLIER_CONSTRAINTS.ADDRESS_MAX) {
      throw new Error(`Address must not exceed ${SUPPLIER_CONSTRAINTS.ADDRESS_MAX} characters`);
    }
    if (dto.notes && dto.notes.length > SUPPLIER_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must not exceed ${SUPPLIER_CONSTRAINTS.NOTES_MAX} characters`);
    }
  }
}
