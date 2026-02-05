import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ShopDetails, UpsertShopDetailsRequest, OpeningHoursEntry } from '../../models/shop-details.model';

@Injectable({
  providedIn: 'root'
})
export class ShopDetailsService {
  private supabase = inject(SupabaseService);

  cachedDetails = signal<ShopDetails | null>(null);
  loaded = signal(false);

  async getShopDetails(): Promise<ShopDetails | null> {
    if (this.loaded()) {
      return this.cachedDetails();
    }

    const { data, error } = await this.supabase
      .from('shop_details')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows — expected when no details configured yet
        this.loaded.set(true);
        return null;
      }
      // Table doesn't exist or other DB error — return null gracefully
      console.warn('ShopDetailsService: Could not load shop details:', error.message);
      this.loaded.set(true);
      return null;
    }

    const details = this.mapToShopDetails(data);
    this.cachedDetails.set(details);
    this.loaded.set(true);
    return details;
  }

  async saveShopDetails(request: UpsertShopDetailsRequest): Promise<ShopDetails> {
    const existing = this.cachedDetails();
    const dbData = this.mapToDb(request);

    let result;
    if (existing) {
      const { data, error } = await this.supabase
        .from('shop_details')
        .update(dbData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      result = data;
    } else {
      const { data, error } = await this.supabase
        .from('shop_details')
        .insert(dbData)
        .select()
        .single();

      if (error) throw new Error(error.message);
      result = data;
    }

    const details = this.mapToShopDetails(result);
    this.cachedDetails.set(details);
    this.loaded.set(true);
    return details;
  }

  invalidateCache(): void {
    this.cachedDetails.set(null);
    this.loaded.set(false);
  }

  private mapToShopDetails(data: Record<string, unknown>): ShopDetails {
    return {
      id: data['id'] as string,
      shopName: data['shop_name'] as string,
      tagline: data['tagline'] as string | null,
      description: data['description'] as string | null,
      address: data['address'] as string | null,
      phoneDisplay: data['phone_display'] as string | null,
      phoneLink: data['phone_link'] as string | null,
      email: data['email'] as string | null,
      whatsappNumber: data['whatsapp_number'] as string | null,
      weekdayHours: data['weekday_hours'] as string | null,
      weekendHours: data['weekend_hours'] as string | null,
      openingHours: (data['opening_hours'] as OpeningHoursEntry[]) || [],
      mapEmbedUrl: data['map_embed_url'] as string | null,
      mapSearchUrl: data['map_search_url'] as string | null,
      facebookUrl: data['facebook_url'] as string | null,
      instagramUrl: data['instagram_url'] as string | null,
      twitterUrl: data['twitter_url'] as string | null,
      websiteUrl: data['website_url'] as string | null,
      currencyCode: data['currency_code'] as string,
      currencyLocale: data['currency_locale'] as string,
      currencySymbol: data['currency_symbol'] as string,
      currencyDecimals: data['currency_decimals'] as number,
      logoUrl: data['logo_url'] as string | null,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string | null
    };
  }

  private mapToDb(request: UpsertShopDetailsRequest): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    if (request.shopName !== undefined) result['shop_name'] = request.shopName;
    if (request.tagline !== undefined) result['tagline'] = request.tagline;
    if (request.description !== undefined) result['description'] = request.description;
    if (request.address !== undefined) result['address'] = request.address;
    if (request.phoneDisplay !== undefined) result['phone_display'] = request.phoneDisplay;
    if (request.phoneLink !== undefined) result['phone_link'] = request.phoneLink;
    if (request.email !== undefined) result['email'] = request.email;
    if (request.whatsappNumber !== undefined) result['whatsapp_number'] = request.whatsappNumber;
    if (request.weekdayHours !== undefined) result['weekday_hours'] = request.weekdayHours;
    if (request.weekendHours !== undefined) result['weekend_hours'] = request.weekendHours;
    if (request.openingHours !== undefined) result['opening_hours'] = request.openingHours;
    if (request.mapEmbedUrl !== undefined) result['map_embed_url'] = request.mapEmbedUrl;
    if (request.mapSearchUrl !== undefined) result['map_search_url'] = request.mapSearchUrl;
    if (request.facebookUrl !== undefined) result['facebook_url'] = request.facebookUrl;
    if (request.instagramUrl !== undefined) result['instagram_url'] = request.instagramUrl;
    if (request.twitterUrl !== undefined) result['twitter_url'] = request.twitterUrl;
    if (request.websiteUrl !== undefined) result['website_url'] = request.websiteUrl;
    if (request.currencyCode !== undefined) result['currency_code'] = request.currencyCode;
    if (request.currencyLocale !== undefined) result['currency_locale'] = request.currencyLocale;
    if (request.currencySymbol !== undefined) result['currency_symbol'] = request.currencySymbol;
    if (request.currencyDecimals !== undefined) result['currency_decimals'] = request.currencyDecimals;
    if (request.logoUrl !== undefined) result['logo_url'] = request.logoUrl;
    return result;
  }
}
