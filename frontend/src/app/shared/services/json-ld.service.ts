import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { PhoneDetail } from '../../models/phone.model';
import { PhoneCondition } from '../../enums/phone-condition.enum';
import { PhoneStatus } from '../../enums/phone-status.enum';
import { environment } from '../../../environments/environment';

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
  private document = inject(DOCUMENT);

  private readonly siteUrl = environment.siteUrl;
  private readonly scriptId = 'json-ld-product';

  setProductStructuredData(phone: PhoneDetail): void {
    const jsonLd = this.buildProductJsonLd(phone);
    this.injectJsonLd(jsonLd);
  }

  removeStructuredData(): void {
    const existing = this.document.getElementById(this.scriptId);
    if (existing) {
      existing.remove();
    }
  }

  private buildProductJsonLd(phone: PhoneDetail): JsonLdProduct {
    const productName = `${phone.brandName} ${phone.model}`;
    const imageUrls = this.getImageUrls(phone);
    const productUrl = `${this.siteUrl}/phone/${phone.id}`;

    // Build offer with seller information
    const offer: JsonLdOffer = {
      '@type': 'Offer',
      price: phone.sellingPrice,
      priceCurrency: environment.currency.code,
      availability: this.mapAvailability(phone.status),
      itemCondition: this.mapCondition(phone.condition),
      url: productUrl
    };

    // Add priceValidUntil (30 days from now for dynamic pricing)
    offer.priceValidUntil = this.getPriceValidUntilDate();

    // Add seller organization if business info is available
    if (environment.businessInfo?.name) {
      offer.seller = {
        '@type': 'Organization',
        name: environment.businessInfo.name,
        url: this.siteUrl
      };
    }

    const jsonLd: JsonLdProduct = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: productName,
      brand: {
        '@type': 'Brand',
        name: phone.brandName
      },
      offers: offer,
      category: 'Mobile Phones'
    };

    if (phone.description) {
      jsonLd.description = phone.description;
    }

    if (imageUrls.length > 0) {
      jsonLd.image = imageUrls;
    }

    if (phone.imei) {
      jsonLd.sku = phone.imei;
    }

    if (phone.color) {
      jsonLd.color = phone.color;
    }

    return jsonLd;
  }

  private getPriceValidUntilDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  }

  private getImageUrls(phone: PhoneDetail): string[] {
    if (phone.images && phone.images.length > 0) {
      const sorted = [...phone.images].sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return a.displayOrder - b.displayOrder;
      });
      return sorted.map(img => img.imageUrl);
    }

    if (phone.primaryImageUrl) {
      return [phone.primaryImageUrl];
    }

    return [];
  }

  private mapCondition(condition: PhoneCondition): string {
    switch (condition) {
      case PhoneCondition.NEW:
        return 'https://schema.org/NewCondition';
      case PhoneCondition.USED:
        return 'https://schema.org/UsedCondition';
      case PhoneCondition.REFURBISHED:
        return 'https://schema.org/RefurbishedCondition';
      default:
        return 'https://schema.org/UsedCondition';
    }
  }

  private mapAvailability(status: PhoneStatus): string {
    switch (status) {
      case PhoneStatus.AVAILABLE:
        return 'https://schema.org/InStock';
      case PhoneStatus.SOLD:
        return 'https://schema.org/SoldOut';
      case PhoneStatus.RESERVED:
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
