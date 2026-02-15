import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProductSpecSuggestion {
  ram: number[];
  storage: number[];
  colors: string[];
  modelName?: string;
}

export interface FetchProductSpecsResponse {
  success: boolean;
  data?: ProductSpecSuggestion;
  error?: string;
  source?: string;
  sourceUrl?: string;
}

/**
 * Product Specifications Scraper Service
 *
 * Scrapes product specifications from GSMArena.com
 * This is a frontend-only implementation that doesn't rely on backend imports
 */
@Injectable({
  providedIn: 'root'
})
export class ProductSpecsScraperService {
  // Backend API URL from environment (supports both local and network access)
  private readonly API_URL = `${environment.apiServer.url}/api/products/fetch-specs`;

  // In-memory cache (survives for session only)
  private cache = new Map<string, { data: ProductSpecSuggestion; timestamp: number }>();
  private readonly CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  constructor(private http: HttpClient) {}

  /**
   * Fetch product specifications from GSMArena
   */
  async fetchSpecs(brand: string, model: string): Promise<FetchProductSpecsResponse> {
    try {
      // Check cache first
      const cacheKey = `${brand.toLowerCase()}_${model.toLowerCase()}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log(`[ProductSpecsScraper] Cache hit for ${brand} ${model}`);
        return {
          success: true,
          data: cached.data,
          source: 'gsmarena (cached)'
        };
      }

      console.log(`[ProductSpecsScraper] Fetching specs for ${brand} ${model}`);

      // Call backend API to fetch specs (avoids CORS issues)
      const result = await firstValueFrom(
        this.http.post<FetchProductSpecsResponse>(this.API_URL, {
          brand: brand.trim(),
          model: model.trim()
        })
      );

      if (result.success && result.data) {
        // Cache the result
        this.cache.set(cacheKey, { data: result.data, timestamp: Date.now() });
      }

      return result;

    } catch (error) {
      console.error('[ProductSpecsScraper] Error fetching specs:', error);

      // Check if it's a network error (backend not running)
      if (error instanceof Error && error.message.includes('Http failure')) {
        return {
          success: false,
          error: 'Backend API server is not running. Please start it with: npm run api-server'
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

}
