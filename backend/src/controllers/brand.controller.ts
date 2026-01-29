import { BrandService } from '../services/brand.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import {
  CreateBrandDto,
  UpdateBrandDto,
  BrandResponseDto,
  BrandListResponseDto
} from '../dto/brand.dto';
import { BRAND_CONSTRAINTS } from '../constants/validation.constants';

/**
 * Brand Controller
 * HTTP request handling for Brand entity
 * Routes: /api/brands
 *
 * Security: All text inputs are sanitized to prevent XSS (F-058).
 * Brand name is stored as plain text.
 */
export class BrandController {
  private readonly sanitizer = new InputSanitizationService();

  constructor(private readonly brandService: BrandService) {}

  async getAll(): Promise<BrandListResponseDto> {
    return this.brandService.findAll();
  }

  async getById(id: string): Promise<BrandResponseDto> {
    const brand = await this.brandService.findById(id);
    if (!brand) {
      throw new Error(`Brand not found`);
    }
    return brand;
  }

  async create(dto: CreateBrandDto): Promise<BrandResponseDto> {
    const sanitizedDto = this.sanitizeDto(dto);
    this.validateCreateDto(sanitizedDto);
    return this.brandService.create(sanitizedDto);
  }

  async update(id: string, dto: UpdateBrandDto): Promise<BrandResponseDto> {
    const sanitizedDto = this.sanitizeDto(dto);
    this.validateUpdateDto(sanitizedDto);
    return this.brandService.update(id, sanitizedDto);
  }

  async delete(id: string): Promise<void> {
    return this.brandService.delete(id);
  }

  private sanitizeDto<T extends { name?: string }>(dto: T): T {
    return {
      ...dto,
      name: dto.name ? this.sanitizer.sanitizeString(dto.name) : dto.name
    };
  }

  private validateCreateDto(dto: CreateBrandDto): void {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('Brand name is required');
    }
    if (dto.name.length > BRAND_CONSTRAINTS.NAME_MAX) {
      throw new Error(`Brand name must not exceed ${BRAND_CONSTRAINTS.NAME_MAX} characters`);
    }
  }

  private validateUpdateDto(dto: UpdateBrandDto): void {
    if (dto.name !== undefined) {
      if (dto.name.trim().length === 0) {
        throw new Error('Brand name cannot be empty');
      }
      if (dto.name.length > BRAND_CONSTRAINTS.NAME_MAX) {
        throw new Error(`Brand name must not exceed ${BRAND_CONSTRAINTS.NAME_MAX} characters`);
      }
    }
  }
}
