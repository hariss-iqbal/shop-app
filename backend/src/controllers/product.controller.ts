import { ProductService } from '../services/product.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import { PhoneSpecsScraperService } from '../services/phone-specs-scraper.service';
import { ProductCondition, ProductStatus } from '../enums';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  ProductListResponseDto,
  ProductFilterDto,
  ProductSortDto,
  ProductPaginationDto,
  UpdateProductStatusDto,
  BulkUpdateProductStatusDto,
  FetchProductSpecsRequestDto,
  FetchProductSpecsResponseDto
} from '../dto/product.dto';
import { PRODUCT_CONSTRAINTS } from '../constants/validation.constants';

/**
 * Product Controller
 * HTTP request handling for Product entity
 * Routes: /api/products
 *
 * Security: All text inputs are sanitized to prevent XSS (F-058).
 * Notes and description are stored as plain text without HTML interpretation.
 */
export class ProductController {
  private readonly sanitizer = new InputSanitizationService();
  private readonly specsScraperService = new PhoneSpecsScraperService();

  constructor(private readonly productService: ProductService) {}

  async getAll(
    filter?: ProductFilterDto,
    sort?: ProductSortDto,
    pagination?: ProductPaginationDto
  ): Promise<ProductListResponseDto> {
    return this.productService.findAll(filter, sort, pagination);
  }

  async getAvailable(
    filter?: ProductFilterDto,
    sort?: ProductSortDto,
    pagination?: ProductPaginationDto
  ): Promise<ProductListResponseDto> {
    return this.productService.findAvailable(filter, sort, pagination);
  }

  async getById(id: string): Promise<ProductResponseDto> {
    const product = await this.productService.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const sanitizedDto = this.sanitizeCreateDto(dto);
    this.validateCreateDto(sanitizedDto);
    return this.productService.create(sanitizedDto);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const sanitizedDto = this.sanitizeUpdateDto(dto);
    this.validateUpdateDto(sanitizedDto);
    return this.productService.update(id, sanitizedDto);
  }

  async updateStatus(id: string, status: ProductStatus): Promise<ProductResponseDto> {
    if (!Object.values(ProductStatus).includes(status)) {
      throw new Error('Invalid product status');
    }
    return this.productService.updateStatus(id, status);
  }

  async updateQuickStatus(id: string, dto: UpdateProductStatusDto): Promise<ProductResponseDto> {
    if (!dto.status || !Object.values(ProductStatus).includes(dto.status)) {
      throw new Error('Invalid product status');
    }
    return this.productService.updateQuickStatus(id, dto.status);
  }

  async bulkUpdateStatus(dto: BulkUpdateProductStatusDto): Promise<void> {
    if (!dto.ids || dto.ids.length === 0) {
      throw new Error('At least one product ID is required');
    }
    if (!dto.status || !Object.values(ProductStatus).includes(dto.status)) {
      throw new Error('Invalid product status');
    }
    return this.productService.bulkUpdateStatus(dto.ids, dto.status);
  }

  async delete(id: string): Promise<void> {
    return this.productService.delete(id);
  }

  async getStockCount(): Promise<{ count: number }> {
    const count = await this.productService.getStockCount();
    return { count };
  }

  async getStockValue(): Promise<{ value: number }> {
    const value = await this.productService.getStockValue();
    return { value };
  }

  async getRecentProducts(limit: number = 5): Promise<ProductResponseDto[]> {
    return this.productService.getRecentProducts(limit);
  }

  async getExportData(filter?: ProductFilterDto): Promise<ProductResponseDto[]> {
    return this.productService.findAllForExport(filter);
  }

  /**
   * Fetch product specifications from GSMArena
   * Route: POST /api/products/fetch-specs
   *
   * Searches GSMArena for the product model and extracts:
   * - RAM options (e.g., [4, 6, 8] GB)
   * - Storage options (e.g., [64, 128, 256] GB)
   * - Color variants
   *
   * Results are cached for 30 days to reduce external requests.
   */
  async fetchProductSpecs(dto: FetchProductSpecsRequestDto): Promise<FetchProductSpecsResponseDto> {
    // Validate input
    if (!dto.brand || dto.brand.trim().length === 0) {
      return {
        success: false,
        error: 'Brand is required'
      };
    }
    if (!dto.model || dto.model.trim().length === 0) {
      return {
        success: false,
        error: 'Model is required'
      };
    }

    // Sanitize inputs
    const sanitizedBrand = this.sanitizer.sanitizeString(dto.brand.trim());
    const sanitizedModel = this.sanitizer.sanitizeString(dto.model.trim());

    // Fetch specs from GSMArena
    return this.specsScraperService.fetchSpecs(sanitizedBrand, sanitizedModel);
  }

  private sanitizeCreateDto(dto: CreateProductDto): CreateProductDto {
    return {
      ...dto,
      model: this.sanitizer.sanitizeString(dto.model),
      description: dto.description ? this.sanitizer.sanitizeString(dto.description) : dto.description,
      color: dto.color ? this.sanitizer.sanitizeString(dto.color) : dto.color,
      imei: dto.imei ? this.sanitizer.sanitizeString(dto.imei) : dto.imei,
      notes: dto.notes ? this.sanitizer.sanitizeString(dto.notes) : dto.notes
    };
  }

  private sanitizeUpdateDto(dto: UpdateProductDto): UpdateProductDto {
    return {
      ...dto,
      model: dto.model ? this.sanitizer.sanitizeString(dto.model) : dto.model,
      description: dto.description ? this.sanitizer.sanitizeString(dto.description) : dto.description,
      color: dto.color ? this.sanitizer.sanitizeString(dto.color) : dto.color,
      imei: dto.imei ? this.sanitizer.sanitizeString(dto.imei) : dto.imei,
      notes: dto.notes ? this.sanitizer.sanitizeString(dto.notes) : dto.notes
    };
  }

  private validateCreateDto(dto: CreateProductDto): void {
    if (!dto.brandId) {
      throw new Error('Brand ID is required');
    }
    if (!dto.model || dto.model.trim().length === 0) {
      throw new Error('Model is required');
    }
    if (dto.model.length > PRODUCT_CONSTRAINTS.MODEL_MAX) {
      throw new Error(`Model must not exceed ${PRODUCT_CONSTRAINTS.MODEL_MAX} characters`);
    }
    if (!dto.condition || !Object.values(ProductCondition).includes(dto.condition)) {
      throw new Error('Valid condition is required');
    }
    if (dto.costPrice === undefined || dto.costPrice < 0) {
      throw new Error('Valid cost price is required');
    }
    if (dto.sellingPrice === undefined || dto.sellingPrice < 0) {
      throw new Error('Valid selling price is required');
    }
    if (dto.description && dto.description.length > PRODUCT_CONSTRAINTS.DESCRIPTION_MAX) {
      throw new Error(`Description must not exceed ${PRODUCT_CONSTRAINTS.DESCRIPTION_MAX} characters`);
    }
    if (dto.color && dto.color.length > PRODUCT_CONSTRAINTS.COLOR_MAX) {
      throw new Error(`Color must not exceed ${PRODUCT_CONSTRAINTS.COLOR_MAX} characters`);
    }
    if (dto.imei && dto.imei.length > PRODUCT_CONSTRAINTS.IMEI_MAX) {
      throw new Error(`IMEI must not exceed ${PRODUCT_CONSTRAINTS.IMEI_MAX} characters`);
    }
    if (dto.notes && dto.notes.length > PRODUCT_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must not exceed ${PRODUCT_CONSTRAINTS.NOTES_MAX} characters`);
    }
    if (dto.batteryHealth !== undefined && dto.batteryHealth !== null) {
      if (dto.batteryHealth < PRODUCT_CONSTRAINTS.BATTERY_HEALTH_MIN || dto.batteryHealth > PRODUCT_CONSTRAINTS.BATTERY_HEALTH_MAX) {
        throw new Error(`Battery health must be between ${PRODUCT_CONSTRAINTS.BATTERY_HEALTH_MIN} and ${PRODUCT_CONSTRAINTS.BATTERY_HEALTH_MAX}`);
      }
    }
  }

  private validateUpdateDto(dto: UpdateProductDto): void {
    if (dto.model !== undefined) {
      if (dto.model.trim().length === 0) {
        throw new Error('Model cannot be empty');
      }
      if (dto.model.length > PRODUCT_CONSTRAINTS.MODEL_MAX) {
        throw new Error(`Model must not exceed ${PRODUCT_CONSTRAINTS.MODEL_MAX} characters`);
      }
    }
    if (dto.condition && !Object.values(ProductCondition).includes(dto.condition)) {
      throw new Error('Invalid condition');
    }
    if (dto.costPrice !== undefined && dto.costPrice < 0) {
      throw new Error('Cost price cannot be negative');
    }
    if (dto.sellingPrice !== undefined && dto.sellingPrice < 0) {
      throw new Error('Selling price cannot be negative');
    }
    if (dto.description && dto.description.length > PRODUCT_CONSTRAINTS.DESCRIPTION_MAX) {
      throw new Error(`Description must not exceed ${PRODUCT_CONSTRAINTS.DESCRIPTION_MAX} characters`);
    }
    if (dto.color && dto.color.length > PRODUCT_CONSTRAINTS.COLOR_MAX) {
      throw new Error(`Color must not exceed ${PRODUCT_CONSTRAINTS.COLOR_MAX} characters`);
    }
    if (dto.imei && dto.imei.length > PRODUCT_CONSTRAINTS.IMEI_MAX) {
      throw new Error(`IMEI must not exceed ${PRODUCT_CONSTRAINTS.IMEI_MAX} characters`);
    }
    if (dto.notes && dto.notes.length > PRODUCT_CONSTRAINTS.NOTES_MAX) {
      throw new Error(`Notes must not exceed ${PRODUCT_CONSTRAINTS.NOTES_MAX} characters`);
    }
    if (dto.batteryHealth !== undefined && dto.batteryHealth !== null) {
      if (dto.batteryHealth < PRODUCT_CONSTRAINTS.BATTERY_HEALTH_MIN || dto.batteryHealth > PRODUCT_CONSTRAINTS.BATTERY_HEALTH_MAX) {
        throw new Error(`Battery health must be between ${PRODUCT_CONSTRAINTS.BATTERY_HEALTH_MIN} and ${PRODUCT_CONSTRAINTS.BATTERY_HEALTH_MAX}`);
      }
    }
  }
}
