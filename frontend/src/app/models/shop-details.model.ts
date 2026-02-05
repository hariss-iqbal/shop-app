/**
 * Shop Details Models
 * Frontend models for configurable business information
 */

export interface OpeningHoursEntry {
  day: string;
  hours: string;
  closed: boolean;
}

export interface ShopDetails {
  id: string;
  shopName: string;
  tagline: string | null;
  description: string | null;
  address: string | null;
  phoneDisplay: string | null;
  phoneLink: string | null;
  email: string | null;
  whatsappNumber: string | null;
  weekdayHours: string | null;
  weekendHours: string | null;
  openingHours: OpeningHoursEntry[];
  mapEmbedUrl: string | null;
  mapSearchUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  websiteUrl: string | null;
  currencyCode: string;
  currencyLocale: string;
  currencySymbol: string;
  currencyDecimals: number;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpsertShopDetailsRequest {
  shopName: string;
  tagline?: string | null;
  description?: string | null;
  address?: string | null;
  phoneDisplay?: string | null;
  phoneLink?: string | null;
  email?: string | null;
  whatsappNumber?: string | null;
  weekdayHours?: string | null;
  weekendHours?: string | null;
  openingHours?: OpeningHoursEntry[];
  mapEmbedUrl?: string | null;
  mapSearchUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  websiteUrl?: string | null;
  currencyCode?: string;
  currencyLocale?: string;
  currencySymbol?: string;
  currencyDecimals?: number;
  logoUrl?: string | null;
}
