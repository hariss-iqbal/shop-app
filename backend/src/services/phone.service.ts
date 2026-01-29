import { PhoneRepository } from '../repositories/phone.repository';
import { Phone, PhoneInsert, PhoneUpdate, PhoneWithRelations } from '../entities/phone.entity';
import { PhoneCondition, PhoneStatus } from '../enums';
import {
  CreatePhoneDto,
  UpdatePhoneDto,
  PhoneResponseDto,
  PhoneListResponseDto,
  PhoneFilterDto,
  PhoneSortDto,
  PhonePaginationDto
} from '../dto/phone.dto';

/**
 * Phone Service
 * Business logic for Phone entity
 * Owner Module: M-04 Inventory
 */
export class PhoneService {
  constructor(private readonly phoneRepository: PhoneRepository) {}

  async findAll(
    filter?: PhoneFilterDto,
    sort?: PhoneSortDto,
    pagination?: PhonePaginationDto
  ): Promise<PhoneListResponseDto> {
    const phones = await this.phoneRepository.findAll({
      status: filter?.status,
      brandId: filter?.brandId,
      limit: pagination?.limit,
      offset: pagination ? (pagination.page - 1) * pagination.limit : undefined,
      orderBy: sort?.field,
      orderDirection: sort?.direction
    });

    const total = await this.phoneRepository.count(filter?.status);

    return {
      data: phones.map(this.toResponseDto),
      total
    };
  }

  async findAvailable(
    filter?: PhoneFilterDto,
    sort?: PhoneSortDto,
    pagination?: PhonePaginationDto
  ): Promise<PhoneListResponseDto> {
    return this.findAll(
      { ...filter, status: PhoneStatus.AVAILABLE },
      sort,
      pagination
    );
  }

  async findById(id: string): Promise<PhoneResponseDto | null> {
    const phone = await this.phoneRepository.findById(id);
    return phone ? this.toResponseDto(phone) : null;
  }

  async create(dto: CreatePhoneDto): Promise<PhoneResponseDto> {
    if (dto.imei) {
      const existing = await this.phoneRepository.findByImei(dto.imei);
      if (existing) {
        throw new Error(`Phone with IMEI "${dto.imei}" already exists`);
      }
    }

    this.validateBatteryHealth(dto.condition, dto.batteryHealth);

    const phoneInsert: PhoneInsert = {
      brand_id: dto.brandId,
      model: dto.model.trim(),
      description: dto.description?.trim() || null,
      storage_gb: dto.storageGb || null,
      ram_gb: dto.ramGb || null,
      color: dto.color?.trim() || null,
      condition: dto.condition,
      battery_health: dto.batteryHealth || null,
      imei: dto.imei?.trim() || null,
      cost_price: dto.costPrice,
      selling_price: dto.sellingPrice,
      status: dto.status || PhoneStatus.AVAILABLE,
      purchase_date: dto.purchaseDate || null,
      supplier_id: dto.supplierId || null,
      notes: dto.notes?.trim() || null
    };

    const phone = await this.phoneRepository.create(phoneInsert);
    const phoneWithRelations = await this.phoneRepository.findById(phone.id);
    return this.toResponseDto(phoneWithRelations!);
  }

  async update(id: string, dto: UpdatePhoneDto): Promise<PhoneResponseDto> {
    const existing = await this.phoneRepository.findById(id);
    if (!existing) {
      throw new Error(`Phone with id "${id}" not found`);
    }

    if (dto.imei && dto.imei !== existing.imei) {
      const duplicate = await this.phoneRepository.findByImei(dto.imei);
      if (duplicate) {
        throw new Error(`Phone with IMEI "${dto.imei}" already exists`);
      }
    }

    const condition = dto.condition || existing.condition;
    const batteryHealth = dto.batteryHealth !== undefined ? dto.batteryHealth : existing.battery_health;
    this.validateBatteryHealth(condition, batteryHealth);

    const phoneUpdate: PhoneUpdate = {
      ...(dto.brandId && { brand_id: dto.brandId }),
      ...(dto.model && { model: dto.model.trim() }),
      ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
      ...(dto.storageGb !== undefined && { storage_gb: dto.storageGb }),
      ...(dto.ramGb !== undefined && { ram_gb: dto.ramGb }),
      ...(dto.color !== undefined && { color: dto.color?.trim() || null }),
      ...(dto.condition && { condition: dto.condition }),
      ...(dto.batteryHealth !== undefined && { battery_health: dto.batteryHealth }),
      ...(dto.imei !== undefined && { imei: dto.imei?.trim() || null }),
      ...(dto.costPrice !== undefined && { cost_price: dto.costPrice }),
      ...(dto.sellingPrice !== undefined && { selling_price: dto.sellingPrice }),
      ...(dto.status && { status: dto.status }),
      ...(dto.purchaseDate !== undefined && { purchase_date: dto.purchaseDate }),
      ...(dto.supplierId !== undefined && { supplier_id: dto.supplierId }),
      ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null })
    };

    await this.phoneRepository.update(id, phoneUpdate);
    const phoneWithRelations = await this.phoneRepository.findById(id);
    return this.toResponseDto(phoneWithRelations!);
  }

  async updateStatus(id: string, status: PhoneStatus): Promise<PhoneResponseDto> {
    return this.update(id, { status });
  }

  async updateQuickStatus(id: string, status: PhoneStatus): Promise<PhoneResponseDto> {
    if (status === PhoneStatus.SOLD) {
      throw new Error('Use the Mark as Sold workflow to sell a phone');
    }

    const existing = await this.phoneRepository.findById(id);
    if (!existing) {
      throw new Error(`Phone with id "${id}" not found`);
    }

    if (existing.status === PhoneStatus.SOLD) {
      throw new Error('Cannot change status of a sold phone');
    }

    await this.phoneRepository.update(id, { status });
    const phoneWithRelations = await this.phoneRepository.findById(id);
    return this.toResponseDto(phoneWithRelations!);
  }

  async bulkUpdateStatus(ids: string[], status: PhoneStatus): Promise<void> {
    if (status === PhoneStatus.SOLD) {
      throw new Error('Use the Mark as Sold workflow to sell phones');
    }

    for (const id of ids) {
      await this.phoneRepository.update(id, { status });
    }
  }

  async delete(id: string): Promise<void> {
    const existing = await this.phoneRepository.findById(id);
    if (!existing) {
      throw new Error(`Phone with id "${id}" not found`);
    }

    await this.phoneRepository.delete(id);
  }

  async getStockCount(): Promise<number> {
    return this.phoneRepository.count(PhoneStatus.AVAILABLE);
  }

  async getStockValue(): Promise<number> {
    return this.phoneRepository.getStockValue(PhoneStatus.AVAILABLE);
  }

  async getRecentPhones(limit: number = 5): Promise<PhoneResponseDto[]> {
    const phones = await this.phoneRepository.getRecentPhones(limit);
    return phones.map(this.toResponseDto);
  }

  async findAllForExport(filter?: PhoneFilterDto): Promise<PhoneResponseDto[]> {
    const phones = await this.phoneRepository.findAllForExport({
      status: filter?.status,
      brandId: filter?.brandId,
      search: filter?.search
    });

    return phones.map(this.toResponseDto);
  }

  private validateBatteryHealth(condition: PhoneCondition, batteryHealth: number | null | undefined): void {
    if (condition !== PhoneCondition.NEW && batteryHealth !== null && batteryHealth !== undefined) {
      if (batteryHealth < 0 || batteryHealth > 100) {
        throw new Error('Battery health must be between 0 and 100');
      }
    }
  }

  private toResponseDto(phone: PhoneWithRelations): PhoneResponseDto {
    const primaryImage = phone.images?.find(img => img.is_primary) || phone.images?.[0];
    const profitMargin = phone.selling_price > 0
      ? ((phone.selling_price - phone.cost_price) / phone.selling_price) * 100
      : 0;

    return {
      id: phone.id,
      brandId: phone.brand_id,
      brandName: phone.brand?.name || '',
      brandLogoUrl: phone.brand?.logo_url || null,
      model: phone.model,
      description: phone.description,
      storageGb: phone.storage_gb,
      ramGb: phone.ram_gb,
      color: phone.color,
      condition: phone.condition,
      batteryHealth: phone.battery_health,
      imei: phone.imei,
      costPrice: phone.cost_price,
      sellingPrice: phone.selling_price,
      profitMargin: Math.round(profitMargin * 100) / 100,
      status: phone.status,
      purchaseDate: phone.purchase_date,
      supplierId: phone.supplier_id,
      supplierName: phone.supplier?.name || null,
      notes: phone.notes,
      primaryImageUrl: primaryImage?.image_url || null,
      createdAt: phone.created_at,
      updatedAt: phone.updated_at
    };
  }
}
