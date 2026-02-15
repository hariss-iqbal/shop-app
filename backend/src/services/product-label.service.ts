import { ProductService } from './product.service';
import { ProductLabelDto } from '../dto/product-label.dto';

/**
 * Product Label Service
 * Business logic for generating product label/price tag data
 * Feature: F-051 Print Product Label / Price Tag
 * Owner Module: M-04 Inventory
 */
export class ProductLabelService {
  constructor(
    private readonly productService: ProductService,
    private readonly siteUrl: string
  ) {}

  async getLabelData(productId: string): Promise<ProductLabelDto | null> {
    const product = await this.productService.findById(productId);
    if (!product) {
      return null;
    }

    return {
      id: product.id,
      brandName: product.brandName,
      model: product.model,
      storageGb: product.storageGb,
      condition: product.condition,
      sellingPrice: product.sellingPrice,
      detailUrl: `${this.siteUrl}/product/${product.id}`
    };
  }

  async getBulkLabelData(productIds: string[]): Promise<ProductLabelDto[]> {
    const labels: ProductLabelDto[] = [];

    for (const id of productIds) {
      const label = await this.getLabelData(id);
      if (label) {
        labels.push(label);
      }
    }

    return labels;
  }
}
