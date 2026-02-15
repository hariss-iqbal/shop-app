import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ProductDetail } from '../../models/product.model';
import { ProductCondition } from '../../enums/product-condition.enum';
import { ProductStatus } from '../../enums/product-status.enum';
import { environment } from '../../../environments/environment';
import { ShopDetailsService } from '../../core/services/shop-details.service';

interface JsonLdOrganization {
  '@type': 'Organization';
  name: string;
  url?: string;
}

interface JsonLdOffer {
  '@type': 'Offer';
  price: number;
  priceCurrency: string;
  availability: string;
  itemCondition: string;
  url: string;
  priceValidUntil?: string;
  seller?: JsonLdOrganization;
}

interface JsonLdProduct {
  '@context': string;
  '@type': string;
  name: string;
  description?: string;
  image?: string[];
  brand: {
    '@type': string;
    name: string;
  };
  offers: JsonLdOffer;
  sku?: string;
  color?: string;
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class JsonLdService {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private shopDetailsService: ShopDetailsService
  ) { }

  private readonly siteUrl = environment.siteUrl;
  private readonly scriptId = 'json-ld-product';

  setProductStructuredData(product: ProductDetail): void {
    const jsonLd = this.buildProductJsonLd(product);
    this.injectJsonLd(jsonLd);
  }

  removeStructuredData(): void {
    const existing = this.document.getElementById(this.scriptId);
    if (existing) {
      existing.remove();
    }
  }

  private buildProductJsonLd(product: ProductDetail): JsonLdProduct {
    const productName = `${product.brandName} ${product.model}`;
    const imageUrls = this.getImageUrls(product);
    const productUrl = `${this.siteUrl}/product/${product.id}`;

    // Build offer with seller information
    const offer: JsonLdOffer = {
      '@type': 'Offer',
      price: product.sellingPrice,
      priceCurrency: this.shopDetailsService.currencyCode(),
      availability: this.mapAvailability(product.status),
      itemCondition: this.mapCondition(product.condition),
      url: productUrl
    };

    // Add priceValidUntil (30 days from now for dynamic pricing)
    offer.priceValidUntil = this.getPriceValidUntilDate();

    // Add seller organization if shop name is available
    const shopName = this.shopDetailsService.shopName();
    if (shopName) {
      offer.seller = {
        '@type': 'Organization',
        name: shopName,
        url: this.siteUrl
      };
    }

    const jsonLd: JsonLdProduct = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: productName,
      brand: {
        '@type': 'Brand',
        name: product.brandName
      },
      offers: offer,
      category: 'Mobile Phones'
    };

    if (product.description) {
      jsonLd.description = product.description;
    }

    if (imageUrls.length > 0) {
      jsonLd.image = imageUrls;
    }

    if (product.imei) {
      jsonLd.sku = product.imei;
    }

    if (product.color) {
      jsonLd.color = product.color;
    }

    return jsonLd;
  }

  private getPriceValidUntilDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  }

  private getImageUrls(product: ProductDetail): string[] {
    if (product.images && product.images.length > 0) {
      const sorted = [...product.images].sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return a.displayOrder - b.displayOrder;
      });
      return sorted.map(img => img.imageUrl);
    }

    if (product.primaryImageUrl) {
      return [product.primaryImageUrl];
    }

    return [];
  }

  private mapCondition(condition: ProductCondition): string {
    switch (condition) {
      case ProductCondition.NEW:
        return 'https://schema.org/NewCondition';
      case ProductCondition.USED:
        return 'https://schema.org/UsedCondition';
      case ProductCondition.OPEN_BOX:
        return 'https://schema.org/RefurbishedCondition';
      default:
        return 'https://schema.org/UsedCondition';
    }
  }

  private mapAvailability(status: ProductStatus): string {
    switch (status) {
      case ProductStatus.AVAILABLE:
        return 'https://schema.org/InStock';
      case ProductStatus.SOLD:
        return 'https://schema.org/SoldOut';
      case ProductStatus.RESERVED:
        return 'https://schema.org/LimitedAvailability';
      default:
        return 'https://schema.org/OutOfStock';
    }
  }

  private injectJsonLd(data: JsonLdProduct): void {
    this.removeStructuredData();

    const script = this.document.createElement('script');
    script.id = this.scriptId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    this.document.head.appendChild(script);
  }
}
