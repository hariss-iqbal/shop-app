import { BrandRepository } from '../repositories/brand.repository';
import { Brand, BrandInsert, BrandUpdate } from '../entities/brand.entity';
import {
  CreateBrandDto,
  UpdateBrandDto,
  BrandResponseDto,
  BrandListResponseDto
} from '../dto/brand.dto';

/**
 * Brand Service
 * Business logic for Brand entity
 * Owner Module: M-04 Inventory
 */
export class BrandService {
  constructor(private readonly brandRepository: BrandRepository) {}

  async findAll(): Promise<BrandListResponseDto> {
    const brands = await this.brandRepository.findAll();
    const total = await this.brandRepository.count();

    return {
      data: brands.map(this.toResponseDto),
      total
    };
  }

  async findById(id: string): Promise<BrandResponseDto | null> {
    const brand = await this.brandRepository.findById(id);
    return brand ? this.toResponseDto(brand) : null;
  }

  async findByName(name: string): Promise<BrandResponseDto | null> {
    const brand = await this.brandRepository.findByName(name);
    return brand ? this.toResponseDto(brand) : null;
  }

  async create(dto: CreateBrandDto): Promise<BrandResponseDto> {
    const existing = await this.brandRepository.findByName(dto.name);
    if (existing) {
      throw new Error(`Brand with name "${dto.name}" already exists`);
    }

    const brandInsert: BrandInsert = {
      name: dto.name.trim(),
      logo_url: dto.logo_url || null
    };

    const brand = await this.brandRepository.create(brandInsert);
    return this.toResponseDto(brand);
  }

  async update(id: string, dto: UpdateBrandDto): Promise<BrandResponseDto> {
    const existing = await this.brandRepository.findById(id);
    if (!existing) {
      throw new Error(`Brand with id "${id}" not found`);
    }

    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.brandRepository.findByName(dto.name);
      if (duplicate) {
        throw new Error(`Brand with name "${dto.name}" already exists`);
      }
    }

    const brandUpdate: BrandUpdate = {
      ...(dto.name && { name: dto.name.trim() }),
      ...(dto.logo_url !== undefined && { logo_url: dto.logo_url })
    };

    const brand = await this.brandRepository.update(id, brandUpdate);
    return this.toResponseDto(brand);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.brandRepository.findById(id);
    if (!existing) {
      throw new Error(`Brand with id "${id}" not found`);
    }

    await this.brandRepository.delete(id);
  }

  private toResponseDto(brand: Brand): BrandResponseDto {
    return {
      id: brand.id,
      name: brand.name,
      logoUrl: brand.logo_url,
      createdAt: brand.created_at,
      updatedAt: brand.updated_at
    };
  }
}
