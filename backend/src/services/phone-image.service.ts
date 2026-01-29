import { PhoneImageRepository } from '../repositories/phone-image.repository';
import { PhoneImage, PhoneImageInsert, PhoneImageUpdate } from '../entities/phone-image.entity';
import {
  CreatePhoneImageDto,
  UpdatePhoneImageDto,
  PhoneImageResponseDto,
  PhoneImageListResponseDto
} from '../dto/phone-image.dto';

/**
 * PhoneImage Service
 * Business logic for PhoneImage entity
 * Owner Module: M-04 Inventory
 */
export class PhoneImageService {
  constructor(private readonly phoneImageRepository: PhoneImageRepository) {}

  async findByPhoneId(phoneId: string): Promise<PhoneImageListResponseDto> {
    const images = await this.phoneImageRepository.findByPhoneId(phoneId);
    const total = await this.phoneImageRepository.countByPhoneId(phoneId);

    return {
      data: images.map(this.toResponseDto),
      total
    };
  }

  async findById(id: string): Promise<PhoneImageResponseDto | null> {
    const image = await this.phoneImageRepository.findById(id);
    return image ? this.toResponseDto(image) : null;
  }

  async create(dto: CreatePhoneImageDto): Promise<PhoneImageResponseDto> {
    const maxOrder = await this.phoneImageRepository.getMaxDisplayOrder(dto.phoneId);
    const imageCount = await this.phoneImageRepository.countByPhoneId(dto.phoneId);

    const imageInsert: PhoneImageInsert = {
      phone_id: dto.phoneId,
      image_url: dto.imageUrl,
      storage_path: dto.storagePath,
      is_primary: dto.isPrimary ?? (imageCount === 0),
      display_order: dto.displayOrder ?? (maxOrder + 1)
    };

    if (imageInsert.is_primary) {
      await this.phoneImageRepository.clearPrimaryByPhoneId(dto.phoneId);
    }

    const image = await this.phoneImageRepository.create(imageInsert);
    return this.toResponseDto(image);
  }

  async update(id: string, dto: UpdatePhoneImageDto): Promise<PhoneImageResponseDto> {
    const existing = await this.phoneImageRepository.findById(id);
    if (!existing) {
      throw new Error(`Phone image with id "${id}" not found`);
    }

    if (dto.isPrimary === true) {
      await this.phoneImageRepository.clearPrimaryByPhoneId(existing.phone_id);
    }

    const imageUpdate: PhoneImageUpdate = {
      ...(dto.isPrimary !== undefined && { is_primary: dto.isPrimary }),
      ...(dto.displayOrder !== undefined && { display_order: dto.displayOrder })
    };

    const image = await this.phoneImageRepository.update(id, imageUpdate);
    return this.toResponseDto(image);
  }

  async setPrimary(id: string): Promise<PhoneImageResponseDto> {
    const existing = await this.phoneImageRepository.findById(id);
    if (!existing) {
      throw new Error(`Phone image with id "${id}" not found`);
    }

    await this.phoneImageRepository.clearPrimaryByPhoneId(existing.phone_id);
    const image = await this.phoneImageRepository.update(id, { is_primary: true });
    return this.toResponseDto(image);
  }

  async reorder(phoneId: string, imageIds: string[]): Promise<PhoneImageResponseDto[]> {
    const results: PhoneImageResponseDto[] = [];

    for (let i = 0; i < imageIds.length; i++) {
      const image = await this.phoneImageRepository.update(imageIds[i], { display_order: i });
      results.push(this.toResponseDto(image));
    }

    return results;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.phoneImageRepository.findById(id);
    if (!existing) {
      throw new Error(`Phone image with id "${id}" not found`);
    }

    await this.phoneImageRepository.delete(id);

    if (existing.is_primary) {
      const images = await this.phoneImageRepository.findByPhoneId(existing.phone_id);
      if (images.length > 0) {
        await this.phoneImageRepository.update(images[0].id, { is_primary: true });
      }
    }
  }

  private toResponseDto(image: PhoneImage): PhoneImageResponseDto {
    return {
      id: image.id,
      phoneId: image.phone_id,
      imageUrl: image.image_url,
      storagePath: image.storage_path,
      isPrimary: image.is_primary,
      displayOrder: image.display_order,
      createdAt: image.created_at
    };
  }
}
