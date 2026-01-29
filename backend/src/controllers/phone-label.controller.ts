import { PhoneLabelService } from '../services/phone-label.service';
import { PhoneLabelDto } from '../dto/phone-label.dto';

/**
 * Phone Label Controller
 * HTTP request handling for phone label/price tag generation
 * Feature: F-051 Print Phone Label / Price Tag
 * Routes: /api/phones/labels
 */
export class PhoneLabelController {
  constructor(private readonly phoneLabelService: PhoneLabelService) {}

  async getLabelData(phoneId: string): Promise<PhoneLabelDto> {
    if (!phoneId) {
      throw new Error('Phone ID is required');
    }

    const label = await this.phoneLabelService.getLabelData(phoneId);
    if (!label) {
      throw new Error('Phone not found');
    }

    return label;
  }

  async getBulkLabelData(phoneIds: string[]): Promise<PhoneLabelDto[]> {
    if (!phoneIds || phoneIds.length === 0) {
      throw new Error('At least one phone ID is required');
    }

    return this.phoneLabelService.getBulkLabelData(phoneIds);
  }
}
