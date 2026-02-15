import { ProductImageService } from '../services/product-image.service';
import {
  CreateProductImageDto,
  UpdateProductImageDto,
  ProductImageResponseDto,
  ProductImageListResponseDto,
  ReorderProductImagesDto
} from '../dto/product-image.dto';

/**
 * ProductImage Controller
 * HTTP request handling for ProductImage entity
 * Routes: /api/products/:productId/images
 */
export class ProductImageController {
  constructor(private readonly productImageService: ProductImageService) {}

  async getByProductId(productId: string): Promise<ProductImageListResponseDto> {
    return this.productImageService.findByProductId(productId);
  }

  async getById(id: string): Promise<ProductImageResponseDto> {
    const image = await this.productImageService.findById(id);
    if (!image) {
      throw new Error('Product image not found');
    }
    return image;
  }

  async create(dto: CreateProductImageDto): Promise<ProductImageResponseDto> {
    this.validateCreateDto(dto);
    return this.productImageService.create(dto);
  }

  async update(id: string, dto: UpdateProductImageDto): Promise<ProductImageResponseDto> {
    return this.productImageService.update(id, dto);
  }

  async setPrimary(id: string): Promise<ProductImageResponseDto> {
    return this.productImageService.setPrimary(id);
  }

  async reorder(productId: string, dto: ReorderProductImagesDto): Promise<ProductImageResponseDto[]> {
    if (!dto.imageIds || dto.imageIds.length === 0) {
      throw new Error('Image IDs are required');
    }
    return this.productImageService.reorder(productId, dto.imageIds);
  }

  async delete(id: string): Promise<void> {
    return this.productImageService.delete(id);
  }

  private validateCreateDto(dto: CreateProductImageDto): void {
    if (!dto.productId) {
      throw new Error('Product ID is required');
    }
    if (!dto.imageUrl || dto.imageUrl.trim().length === 0) {
      throw new Error('Image URL is required');
    }
    if (!dto.storagePath || dto.storagePath.trim().length === 0) {
      throw new Error('Storage path is required');
    }
  }
}
