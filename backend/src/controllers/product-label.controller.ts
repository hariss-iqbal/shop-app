import { ProductLabelService } from '../services/product-label.service';
import { ProductLabelDto } from '../dto/product-label.dto';

/**
 * Product Label Controller
 * HTTP request handling for product label/price tag generation
 * Feature: F-051 Print Product Label / Price Tag
 * Routes: /api/products/labels
 */
export class ProductLabelController {
  constructor(private readonly productLabelService: ProductLabelService) {}

  async getLabelData(productId: string): Promise<ProductLabelDto> {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const label = await this.productLabelService.getLabelData(productId);
    if (!label) {
      throw new Error('Product not found');
    }

    return label;
  }

  async getBulkLabelData(productIds: string[]): Promise<ProductLabelDto[]> {
    if (!productIds || productIds.length === 0) {
      throw new Error('At least one product ID is required');
    }

    return this.productLabelService.getBulkLabelData(productIds);
  }
}
