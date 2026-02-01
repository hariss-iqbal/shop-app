import { CustomerRepository } from '../repositories/customer.repository';
import { Customer, CustomerWithStats, CustomerPurchaseHistory } from '../entities/customer.entity';
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

/**
 * Customer Service
 * Business logic for Customer entity
 * Owner Module: M-07 Sales
 * Feature: F-019 Customer Contact Management
 */
export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async findAll(filter?: CustomerFilterDto): Promise<CustomerListResponseDto> {
    const limit = filter?.limit || 25;
    const offset = filter?.page ? (filter.page - 1) * limit : 0;

    const [customers, total] = await Promise.all([
      this.customerRepository.findAll({
        search: filter?.search,
        limit,
        offset
      }),
      this.customerRepository.count({ search: filter?.search })
    ]);

    return {
      data: customers.map(this.toWithStatsResponseDto),
      total
    };
  }

  async findById(id: string): Promise<CustomerResponseDto | null> {
    const customer = await this.customerRepository.findById(id);
    return customer ? this.toResponseDto(customer) : null;
  }

  async findByPhone(phone: string): Promise<CustomerResponseDto | null> {
    const customer = await this.customerRepository.findByPhone(phone);
    return customer ? this.toResponseDto(customer) : null;
  }

  async create(dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    // Clean phone number
    const cleanedPhone = dto.phone.replace(/[^\d+]/g, '');

    // Check if phone already exists
    const exists = await this.customerRepository.phoneExists(cleanedPhone);
    if (exists) {
      throw new Error('A customer with this phone number already exists');
    }

    const customer = await this.customerRepository.create({
      phone: cleanedPhone,
      name: dto.name.trim(),
      email: dto.email?.trim() || null,
      notes: dto.notes?.trim() || null
    });

    // Link existing sales to this new customer
    await this.customerRepository.linkSalesToCustomer(customer.id, cleanedPhone);

    return this.toResponseDto(customer);
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    const existing = await this.customerRepository.findById(id);
    if (!existing) {
      throw new Error(`Customer with id "${id}" not found`);
    }

    // If phone is being updated, check for duplicates
    if (dto.phone) {
      const cleanedPhone = dto.phone.replace(/[^\d+]/g, '');
      const exists = await this.customerRepository.phoneExists(cleanedPhone, id);
      if (exists) {
        throw new Error('A customer with this phone number already exists');
      }
    }

    const customerUpdate = {
      ...(dto.phone && { phone: dto.phone.replace(/[^\d+]/g, '') }),
      ...(dto.name !== undefined && { name: dto.name?.trim() }),
      ...(dto.email !== undefined && { email: dto.email?.trim() || null }),
      ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null })
    };

    const customer = await this.customerRepository.update(id, customerUpdate);
    return this.toResponseDto(customer);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.customerRepository.findById(id);
    if (!existing) {
      throw new Error(`Customer with id "${id}" not found`);
    }

    await this.customerRepository.delete(id);
  }

  async getCustomerPurchaseHistory(customerId: string): Promise<CustomerPurchaseHistoryResponseDto> {
    const history = await this.customerRepository.getCustomerPurchaseHistory(customerId);

    if (!history.found || !history.customer) {
      throw new Error('Customer not found');
    }

    return {
      customer: this.toResponseDto(history.customer),
      sales: history.sales,
      stats: history.stats
    };
  }

  async findOrCreate(dto: FindOrCreateCustomerDto): Promise<FindOrCreateCustomerResponseDto> {
    const result = await this.customerRepository.findOrCreate(
      dto.phone,
      dto.name,
      dto.email,
      dto.notes
    );

    return {
      found: result.found,
      customer: result.customer ? this.toResponseDto(result.customer) : null,
      isNew: result.isNew
    };
  }

  async linkSalesToCustomer(customerId: string): Promise<LinkSalesToCustomerResponseDto> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new Error(`Customer with id "${customerId}" not found`);
    }

    const linkedCount = await this.customerRepository.linkSalesToCustomer(customerId, customer.phone);

    return {
      linkedCount,
      customerId
    };
  }

  async lookupByPhone(phone: string): Promise<CustomerWithStatsResponseDto | null> {
    const customer = await this.customerRepository.findByPhone(phone);
    if (!customer) {
      return null;
    }

    // Get stats
    const history = await this.customerRepository.getCustomerPurchaseHistory(customer.id);

    return {
      ...this.toResponseDto(customer),
      totalTransactions: history.stats.totalTransactions,
      totalSpent: history.stats.totalSpent,
      lastPurchaseDate: history.stats.lastPurchaseDate
    };
  }

  private toResponseDto(customer: Customer): CustomerResponseDto {
    return {
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
      email: customer.email,
      notes: customer.notes,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at
    };
  }

  private toWithStatsResponseDto(customer: CustomerWithStats): CustomerWithStatsResponseDto {
    return {
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
      email: customer.email,
      notes: customer.notes,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
      totalTransactions: customer.totalTransactions,
      totalSpent: customer.totalSpent,
      lastPurchaseDate: customer.lastPurchaseDate
    };
  }
}
