import { PhoneImageService } from '../services/phone-image.service';
import {
  CreatePhoneImageDto,
  UpdatePhoneImageDto,
  PhoneImageResponseDto,
  PhoneImageListResponseDto,
  ReorderPhoneImagesDto
} from '../dto/phone-image.dto';

/**
 * PhoneImage Controller
 * HTTP request handling for PhoneImage entity
 * Routes: /api/phones/:phoneId/images
 */
export class PhoneImageController {
  constructor(private readonly phoneImageService: PhoneImageService) {}

  async getByPhoneId(phoneId: string): Promise<PhoneImageListResponseDto> {
    return this.phoneImageService.findByPhoneId(phoneId);
  }

  async getById(id: string): Promise<PhoneImageResponseDto> {
    const image = await this.phoneImageService.findById(id);
    if (!image) {
      throw new Error('Phone image not found');
    }
    return image;
  }

  async create(dto: CreatePhoneImageDto): Promise<PhoneImageResponseDto> {
    this.validateCreateDto(dto);
    return this.phoneImageService.create(dto);
  }

  async update(id: string, dto: UpdatePhoneImageDto): Promise<PhoneImageResponseDto> {
    return this.phoneImageService.update(id, dto);
  }

  async setPrimary(id: string): Promise<PhoneImageResponseDto> {
    return this.phoneImageService.setPrimary(id);
  }

  async reorder(phoneId: string, dto: ReorderPhoneImagesDto): Promise<PhoneImageResponseDto[]> {
    if (!dto.imageIds || dto.imageIds.length === 0) {
      throw new Error('Image IDs are required');
    }
    return this.phoneImageService.reorder(phoneId, dto.imageIds);
  }

  async delete(id: string): Promise<void> {
    return this.phoneImageService.delete(id);
  }

  private validateCreateDto(dto: CreatePhoneImageDto): void {
    if (!dto.phoneId) {
      throw new Error('Phone ID is required');
    }
    if (!dto.imageUrl || dto.imageUrl.trim().length === 0) {
      throw new Error('Image URL is required');
    }
    if (!dto.storagePath || dto.storagePath.trim().length === 0) {
      throw new Error('Storage path is required');
    }
  }
}
