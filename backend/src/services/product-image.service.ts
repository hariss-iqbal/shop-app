import { ProductImageRepository } from '../repositories/product-image.repository';
import { ProductImage, ProductImageInsert, ProductImageUpdate } from '../entities/product-image.entity';
import {
  CreateProductImageDto,
  UpdateProductImageDto,
  ProductImageResponseDto,
  ProductImageListResponseDto
} from '../dto/product-image.dto';

/**
 * ProductImage Service
 * Business logic for ProductImage entity
 * Owner Module: M-04 Inventory
 */
export class ProductImageService {
  constructor(private readonly productImageRepository: ProductImageRepository) {}

  async findByProductId(productId: string): Promise<ProductImageListResponseDto> {
    const images = await this.productImageRepository.findByProductId(productId);
    const total = await this.productImageRepository.countByProductId(productId);

    return {
      data: images.map(this.toResponseDto),
      total
    };
  }

  async findById(id: string): Promise<ProductImageResponseDto | null> {
    const image = await this.productImageRepository.findById(id);
    return image ? this.toResponseDto(image) : null;
  }

  async create(dto: CreateProductImageDto): Promise<ProductImageResponseDto> {
    const maxOrder = await this.productImageRepository.getMaxDisplayOrder(dto.productId);
    const imageCount = await this.productImageRepository.countByProductId(dto.productId);

    const imageInsert: ProductImageInsert = {
      product_id: dto.productId,
      image_url: dto.imageUrl,
      storage_path: dto.storagePath,
      is_primary: dto.isPrimary ?? (imageCount === 0),
      display_order: dto.displayOrder ?? (maxOrder + 1)
    };

    if (imageInsert.is_primary) {
      await this.productImageRepository.clearPrimaryByProductId(dto.productId);
    }

    const image = await this.productImageRepository.create(imageInsert);
    return this.toResponseDto(image);
  }

  async update(id: string, dto: UpdateProductImageDto): Promise<ProductImageResponseDto> {
    const existing = await this.productImageRepository.findById(id);
    if (!existing) {
      throw new Error(`Product image with id "${id}" not found`);
    }

    if (dto.isPrimary === true) {
      await this.productImageRepository.clearPrimaryByProductId(existing.product_id);
    }

    const imageUpdate: ProductImageUpdate = {
      ...(dto.isPrimary !== undefined && { is_primary: dto.isPrimary }),
      ...(dto.displayOrder !== undefined && { display_order: dto.displayOrder })
    };

    const image = await this.productImageRepository.update(id, imageUpdate);
    return this.toResponseDto(image);
  }

  async setPrimary(id: string): Promise<ProductImageResponseDto> {
    const existing = await this.productImageRepository.findById(id);
    if (!existing) {
      throw new Error(`Product image with id "${id}" not found`);
    }

    await this.productImageRepository.clearPrimaryByProductId(existing.product_id);
    const image = await this.productImageRepository.update(id, { is_primary: true });
    return this.toResponseDto(image);
  }

  async reorder(productId: string, imageIds: string[]): Promise<ProductImageResponseDto[]> {
    const results: ProductImageResponseDto[] = [];

    for (let i = 0; i < imageIds.length; i++) {
      const image = await this.productImageRepository.update(imageIds[i], { display_order: i });
      results.push(this.toResponseDto(image));
    }

    return results;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.productImageRepository.findById(id);
    if (!existing) {
      throw new Error(`Product image with id "${id}" not found`);
    }

    await this.productImageRepository.delete(id);

    if (existing.is_primary) {
      const images = await this.productImageRepository.findByProductId(existing.product_id);
      if (images.length > 0) {
        await this.productImageRepository.update(images[0].id, { is_primary: true });
      }
    }
  }

  private toResponseDto(image: ProductImage): ProductImageResponseDto {
    return {
      id: image.id,
      productId: image.product_id,
      imageUrl: image.image_url,
      storagePath: image.storage_path,
      isPrimary: image.is_primary,
      displayOrder: image.display_order,
      createdAt: image.created_at
    };
  }
}
