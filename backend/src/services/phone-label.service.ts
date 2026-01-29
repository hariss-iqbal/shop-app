import { PhoneService } from './phone.service';
import { PhoneLabelDto } from '../dto/phone-label.dto';

/**
 * Phone Label Service
 * Business logic for generating phone label/price tag data
 * Feature: F-051 Print Phone Label / Price Tag
 * Owner Module: M-04 Inventory
 */
export class PhoneLabelService {
  constructor(
    private readonly phoneService: PhoneService,
    private readonly siteUrl: string
  ) {}

  async getLabelData(phoneId: string): Promise<PhoneLabelDto | null> {
    const phone = await this.phoneService.findById(phoneId);
    if (!phone) {
      return null;
    }

    return {
      id: phone.id,
      brandName: phone.brandName,
      model: phone.model,
      storageGb: phone.storageGb,
      condition: phone.condition,
      sellingPrice: phone.sellingPrice,
      detailUrl: `${this.siteUrl}/phone/${phone.id}`
    };
  }

  async getBulkLabelData(phoneIds: string[]): Promise<PhoneLabelDto[]> {
    const labels: PhoneLabelDto[] = [];

    for (const id of phoneIds) {
      const label = await this.getLabelData(id);
      if (label) {
        labels.push(label);
      }
    }

    return labels;
  }
}
