import { SupplierRepository } from '../repositories/supplier.repository';
import { Supplier, SupplierInsert, SupplierUpdate } from '../entities/supplier.entity';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierResponseDto,
  SupplierListResponseDto
} from '../dto/supplier.dto';

/**
 * Supplier Service
 * Business logic for Supplier entity
 * Owner Module: M-06 Procurement
 */
export class SupplierService {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  async findAll(): Promise<SupplierListResponseDto> {
    const suppliers = await this.supplierRepository.findAll();
    const total = await this.supplierRepository.count();

    return {
      data: suppliers.map(this.toResponseDto),
      total
    };
  }

  async findById(id: string): Promise<SupplierResponseDto | null> {
    const supplier = await this.supplierRepository.findById(id);
    return supplier ? this.toResponseDto(supplier) : null;
  }

  async create(dto: CreateSupplierDto): Promise<SupplierResponseDto> {
    const supplierInsert: SupplierInsert = {
      name: dto.name.trim(),
      contact_person: dto.contactPerson?.trim() || null,
      contact_email: dto.contactEmail?.trim() || null,
      contact_phone: dto.contactPhone?.trim() || null,
      address: dto.address?.trim() || null,
      notes: dto.notes?.trim() || null
    };

    const supplier = await this.supplierRepository.create(supplierInsert);
    return this.toResponseDto(supplier);
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<SupplierResponseDto> {
    const existing = await this.supplierRepository.findById(id);
    if (!existing) {
      throw new Error(`Supplier with id "${id}" not found`);
    }

    const supplierUpdate: SupplierUpdate = {
      ...(dto.name && { name: dto.name.trim() }),
      ...(dto.contactPerson !== undefined && { contact_person: dto.contactPerson?.trim() || null }),
      ...(dto.contactEmail !== undefined && { contact_email: dto.contactEmail?.trim() || null }),
      ...(dto.contactPhone !== undefined && { contact_phone: dto.contactPhone?.trim() || null }),
      ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
      ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null })
    };

    const supplier = await this.supplierRepository.update(id, supplierUpdate);
    return this.toResponseDto(supplier);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.supplierRepository.findById(id);
    if (!existing) {
      throw new Error(`Supplier with id "${id}" not found`);
    }

    const hasPOs = await this.supplierRepository.hasPurchaseOrders(id);
    if (hasPOs) {
      throw new Error('Cannot delete supplier with existing purchase orders');
    }

    await this.supplierRepository.delete(id);
  }

  private toResponseDto(supplier: Supplier): SupplierResponseDto {
    return {
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contact_person,
      contactEmail: supplier.contact_email,
      contactPhone: supplier.contact_phone,
      address: supplier.address,
      notes: supplier.notes,
      createdAt: supplier.created_at,
      updatedAt: supplier.updated_at
    };
  }
}
