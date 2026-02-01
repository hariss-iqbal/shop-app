import { CustomerService } from '../services/customer.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
  CustomerWithStatsResponseDto,
  CustomerListResponseDto,
  CustomerFilterDto,
  CustomerPurchaseHistoryResponseDto,
  FindOrCreateCustomerDto,
  FindOrCreateCustomerResponseDto,
  LinkSalesToCustomerResponseDto
} from '../dto/customer.dto';
import { CUSTOMER_CONSTRAINTS } from '../constants/validation.constants';

/**
 * Customer Controller
 * HTTP request handling for Customer entity
 * Routes: /api/customers
 *
 * Security: All text inputs are sanitized to prevent XSS (F-058).
 * Customer info and notes are stored as plain text without HTML interpretation.
 *
 * Feature: F-019 Customer Contact Management
 */
export class CustomerController {
  private readonly sanitizer = new InputSanitizationService();

  constructor(private readonly customerService: CustomerService) {}

  async getAll(filter?: CustomerFilterDto): Promise<CustomerListResponseDto> {
    return this.customerService.findAll(filter);
  }

  async getById(id: string): Promise<CustomerResponseDto> {
    const customer = await this.customerService.findById(id);
    if (!customer) {
      throw new Error('Customer not found');
    }
    return customer;
  }

  async lookupByPhone(phone: string): Promise<CustomerWithStatsResponseDto | null> {
    if (!phone || !phone.trim()) {
      throw new Error('Phone number is required');
    }

    const sanitizedPhone = this.sanitizer.sanitizeString(phone);

    if (sanitizedPhone.length > CUSTOMER_CONSTRAINTS.PHONE_MAX) {
      throw new Error(`Phone number must not exceed ${CUSTOMER_CONSTRAINTS.PHONE_MAX} characters`);
    }

    return this.customerService.lookupByPhone(sanitizedPhone);
  }

  async create(dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    const sanitizedDto = this.sanitizeCustomerDto(dto);
    this.validateCreateDto(sanitizedDto);
    return this.customerService.create(sanitizedDto);
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    const sanitizedDto = this.sanitizeCustomerDto(dto);
    this.validateUpdateDto(sanitizedDto);
    return this.customerService.update(id, sanitizedDto);
  }

  async delete(id: string): Promise<void> {
    return this.customerService.delete(id);
  }

  async getCustomerPurchaseHistory(customerId: string): Promise<CustomerPurchaseHistoryResponseDto> {
    return this.customerService.getCustomerPurchaseHistory(customerId);
  }

  async findOrCreate(dto: FindOrCreateCustomerDto): Promise<FindOrCreateCustomerResponseDto> {
    const sanitizedDto = this.sanitizeCustomerDto(dto);

    if (!sanitizedDto.phone || !sanitizedDto.phone.trim()) {
      throw new Error('Phone number is required');
    }

    if (sanitizedDto.phone.length > CUSTOMER_CONSTRAINTS.PHONE_MAX) {
      throw new Error(`Phone number must not exceed ${CUSTOMER_CONSTRAINTS.PHONE_MAX} characters`);
    }

    if (sanitizedDto.name && sanitizedDto.name.length > CUSTOMER_CONSTRAINTS.NAME_MAX) {
      throw new Error(`Name must not exceed ${CUSTOMER_CONSTRAINTS.NAME_MAX} characters`);
    }

    if (sanitizedDto.email && sanitizedDto.email.length > CUSTOMER_CONSTRAINTS.EMAIL_MAX) {
      throw new Error(`Email must not exceed ${CUSTOMER_CONSTRAINTS.EMAIL_MAX} characters`);
    }

    if (sanitizedDto.notes && sanitizedDto.notes.length > CUSTOMER_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must not exceed ${CUSTOMER_CONSTRAINTS.NOTES_MAX} characters`);
    }

    return this.customerService.findOrCreate(sanitizedDto);
  }

  async linkSalesToCustomer(customerId: string): Promise<LinkSalesToCustomerResponseDto> {
    return this.customerService.linkSalesToCustomer(customerId);
  }

  private sanitizeCustomerDto<T extends Partial<CreateCustomerDto>>(dto: T): T {
    return {
      ...dto,
      phone: dto.phone ? this.sanitizer.sanitizeString(dto.phone) : dto.phone,
      name: dto.name ? this.sanitizer.sanitizeString(dto.name) : dto.name,
      email: dto.email?.trim(),
      notes: dto.notes ? this.sanitizer.sanitizeString(dto.notes) : dto.notes
    };
  }

  private validateCreateDto(dto: CreateCustomerDto): void {
    if (!dto.phone || !dto.phone.trim()) {
      throw new Error('Phone number is required');
    }
    if (!dto.name || !dto.name.trim()) {
      throw new Error('Name is required');
    }
    if (dto.phone.length > CUSTOMER_CONSTRAINTS.PHONE_MAX) {
      throw new Error(`Phone number must not exceed ${CUSTOMER_CONSTRAINTS.PHONE_MAX} characters`);
    }
    if (dto.name.length > CUSTOMER_CONSTRAINTS.NAME_MAX) {
      throw new Error(`Name must not exceed ${CUSTOMER_CONSTRAINTS.NAME_MAX} characters`);
    }
    if (dto.email && dto.email.length > CUSTOMER_CONSTRAINTS.EMAIL_MAX) {
      throw new Error(`Email must not exceed ${CUSTOMER_CONSTRAINTS.EMAIL_MAX} characters`);
    }
    if (dto.notes && dto.notes.length > CUSTOMER_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must not exceed ${CUSTOMER_CONSTRAINTS.NOTES_MAX} characters`);
    }
  }

  private validateUpdateDto(dto: UpdateCustomerDto): void {
    if (dto.phone !== undefined && dto.phone.length > CUSTOMER_CONSTRAINTS.PHONE_MAX) {
      throw new Error(`Phone number must not exceed ${CUSTOMER_CONSTRAINTS.PHONE_MAX} characters`);
    }
    if (dto.name !== undefined && dto.name.length > CUSTOMER_CONSTRAINTS.NAME_MAX) {
      throw new Error(`Name must not exceed ${CUSTOMER_CONSTRAINTS.NAME_MAX} characters`);
    }
    if (dto.email && dto.email.length > CUSTOMER_CONSTRAINTS.EMAIL_MAX) {
      throw new Error(`Email must not exceed ${CUSTOMER_CONSTRAINTS.EMAIL_MAX} characters`);
    }
    if (dto.notes && dto.notes.length > CUSTOMER_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must not exceed ${CUSTOMER_CONSTRAINTS.NOTES_MAX} characters`);
    }
  }
}
