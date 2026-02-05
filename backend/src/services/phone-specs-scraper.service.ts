import axios from 'axios';
import * as cheerio from 'cheerio';
import NodeCache from 'node-cache';
import { PhoneSpecSuggestion, FetchPhoneSpecsResponseDto } from '../dto/phone.dto';

/**
 * Phone Specs Scraper Service
 *
 * Scrapes phone specifications from GSMArena.com
 * Features:
 * - Searches GSMArena for phone model
 * - Extracts RAM, storage, and color specifications
 * - Caches results for 30 days to reduce requests
 * - Implements rate limiting and polite scraping
 *
 * Note: This is a web scraping service for educational/personal use.
 * Please respect GSMArena's terms of service and robots.txt.
 */
export class PhoneSpecsScraperService {
  private cache: NodeCache;
  private readonly CACHE_TTL = 30 * 24 * 60 * 60; // 30 days in seconds
  private readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  private readonly BASE_URL = 'https://www.gsmarena.com';
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

  constructor() {
    this.cache = new NodeCache({ stdTTL: this.CACHE_TTL });
  }

  /**
   * Fetch phone specifications from GSMArena
   */
  async fetchSpecs(brand: string, model: string): Promise<FetchPhoneSpecsResponseDto> {
    try {
      // Check cache first
      const cacheKey = `${brand.toLowerCase()}_${model.toLowerCase()}`;
      const cached = this.cache.get<PhoneSpecSuggestion>(cacheKey);

      if (cached) {
        console.log(`[PhoneSpecsScraper] Cache hit for ${brand} ${model}`);
        return {
          success: true,
          data: cached,
          source: 'gsmarena (cached)'
        };
      }

      console.log(`[PhoneSpecsScraper] Fetching specs for ${brand} ${model}`);

      // Step 1: Search for the phone
      const searchQuery = `${brand} ${model}`.trim();
      const searchResults = await this.searchPhone(searchQuery);

      if (!searchResults || searchResults.length === 0) {
        return {
          success: false,
          error: `No results found for "${brand} ${model}" on GSMArena`
        };
      }

      // Step 2: Find the best matching result (not just the first one!)
      const bestMatch = this.findBestMatch(searchResults, brand, model);

      if (!bestMatch) {
        return {
          success: false,
          error: `No exact match found for "${brand} ${model}". Found: ${searchResults.slice(0, 3).map(r => r.name).join(', ')}`
        };
      }

      const phoneUrl = bestMatch.url;
      const phoneName = bestMatch.name;

      console.log(`[PhoneSpecsScraper] Found exact match: ${phoneName} at ${phoneUrl}`);

      // Step 3: Scrape phone specifications page
      const specs = await this.scrapePhoneSpecs(phoneUrl);

      if (!specs) {
        return {
          success: false,
          error: 'Failed to extract specifications from phone page'
        };
      }

      // Cache the result
      this.cache.set(cacheKey, specs);

      return {
        success: true,
        data: specs,
        source: 'gsmarena',
        phoneUrl
      };

    } catch (error) {
      console.error('[PhoneSpecsScraper] Error fetching specs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Find the best matching phone from search results
   * Prioritizes exact matches over variants (Pro, Plus, Ultra, etc.)
   */
  private findBestMatch(
    results: Array<{ name: string; url: string }>,
    brand: string,
    model: string
  ): { name: string; url: string } | null {
    if (results.length === 0) return null;

    const searchTerms = `${brand} ${model}`.toLowerCase().trim();

    // Normalize function - removes spaces, special chars for comparison
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

    const normalizedSearch = normalize(searchTerms);

    // Score each result
    const scored = results.map(result => {
      const normalizedName = normalize(result.name);
      let score = 0;

      // Exact match (highest priority)
      if (normalizedName === normalizedSearch) {
        score = 1000;
      }
      // Exact match with brand/model only (ignoring extra words)
      else if (normalizedName.includes(normalizedSearch)) {
        score = 900;
      }
      // Check if it's the base model (not a variant)
      else {
        // Calculate similarity
        const similarity = this.calculateSimilarity(normalizedName, normalizedSearch);
        score = similarity * 100;

        // Penalize variants if user didn't search for them
        const searchLower = searchTerms.toLowerCase();
        const nameLower = result.name.toLowerCase();

        const variantKeywords = ['pro', 'plus', 'ultra', 'max', 'lite', 'mini', 'pro+', 'xl', 'edge', 'note'];

        for (const variant of variantKeywords) {
          // If the result has a variant but the search doesn't, penalize heavily
          if (nameLower.includes(variant) && !searchLower.includes(variant)) {
            score -= 500;
          }
        }

        // Special penalty for single-letter suffixes (9a, 14a, etc.)
        const suffixMatch = nameLower.match(/\s+(\d+)([a-z])\s*$/);
        if (suffixMatch && !searchLower.includes(suffixMatch[2])) {
          score -= 500;
        }
      }

      return { ...result, score };
    });

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    // Only return if the best match has a reasonable score
    const best = scored[0];

    console.log(`[PhoneSpecsScraper] Match scores for "${searchTerms}":`);
    scored.slice(0, 3).forEach(r => {
      console.log(`  - ${r.name}: ${r.score}`);
    });

    if (best.score < 50) {
      return null; // No good match found
    }

    return { name: best.name, url: best.url };
  }

  /**
   * Calculate similarity between two strings (0-1)
   * Uses simple character overlap for now
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Search GSMArena for phone model
   */
  private async searchPhone(query: string): Promise<Array<{ name: string; url: string }>> {
    await this.respectRateLimit();

    const searchUrl = `${this.BASE_URL}/results.php3?sQuickSearch=yes&sName=${encodeURIComponent(query)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': this.USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://www.gsmarena.com/'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const results: Array<{ name: string; url: string }> = [];

    // Try different possible selectors for search results
    // Pattern 1: .makers li a (older style)
    $('.makers li a').each((_, element) => {
      const $link = $(element);
      const name = $link.find('span, strong').first().text().trim() || $link.text().trim();
      const relativeUrl = $link.attr('href');

      if (name && relativeUrl && relativeUrl.includes('.php')) {
        results.push({
          name,
          url: `${this.BASE_URL}/${relativeUrl}`
        });
      }
    });

    // Pattern 2: Links in search results divs
    if (results.length === 0) {
      $('div.makers a[href*=".php"]').each((_, element) => {
        const $link = $(element);
        const name = $link.text().trim();
        const relativeUrl = $link.attr('href');

        if (name && relativeUrl && !relativeUrl.includes('brands') && !relativeUrl.includes('-phones-')) {
          results.push({
            name,
            url: `${this.BASE_URL}/${relativeUrl}`
          });
        }
      });
    }

    // Pattern 3: Any phone model links (fallback)
    if (results.length === 0) {
      $('a[href*=".php"]').each((_, element) => {
        const $link = $(element);
        const href = $link.attr('href') || '';
        const name = $link.text().trim();

        // Match phone page pattern: brand_model-number.php
        if (href.match(/^[a-z_]+-\d+\.php$/) && name.length > 3) {
          results.push({
            name,
            url: `${this.BASE_URL}/${href}`
          });
        }
      });
    }

    return results;
  }

  /**
   * Scrape phone specifications from phone detail page
   */
  private async scrapePhoneSpecs(phoneUrl: string): Promise<PhoneSpecSuggestion | null> {
    await this.respectRateLimit();

    const response = await axios.get(phoneUrl, {
      headers: {
        'User-Agent': this.USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);

    // Extract specifications
    const ram = this.extractRAM($);
    const storage = this.extractStorage($);
    const colors = this.extractColors($);

    // Validate that we got at least some data
    if (ram.length === 0 && storage.length === 0 && colors.length === 0) {
      console.warn('[PhoneSpecsScraper] No specs found on page');
      return null;
    }

    return { ram, storage, colors };
  }

  /**
   * Extract RAM options from page
   */
  private extractRAM($: cheerio.CheerioAPI): number[] {
    const ramSet = new Set<number>();

    // Look for Internal storage field which contains RAM info
    $('tr').each((_, tr) => {
      const $tr = $(tr);
      const header = $tr.find('td.ttl').text().trim();

      if (header === 'Internal' || header.toLowerCase().includes('memory')) {
        const text = $tr.find('td.nfo').text();

        // Match patterns like "12GB RAM", "8 GB RAM"
        // Format is typically: "128GB 12GB RAM, 256GB 12GB RAM"
        const matches = text.match(/(\d+)\s*GB\s*RAM/gi);
        if (matches) {
          matches.forEach(match => {
            const ramValue = parseInt(match.match(/(\d+)/)?.[1] || '0');
            if (ramValue > 0 && ramValue <= 64) {
              ramSet.add(ramValue);
            }
          });
        }
      }
    });

    return Array.from(ramSet).sort((a, b) => a - b);
  }

  /**
   * Extract storage options from page
   */
  private extractStorage($: cheerio.CheerioAPI): number[] {
    const storageSet = new Set<number>();

    // Look for Internal storage field
    $('tr').each((_, tr) => {
      const $tr = $(tr);
      const header = $tr.find('td.ttl').text().trim();

      if (header === 'Internal' || header.toLowerCase().includes('memory')) {
        const text = $tr.find('td.nfo').text();

        // Match patterns like "128GB", "256GB" (but not RAM)
        // Format is typically: "128GB 12GB RAM, 256GB 12GB RAM"
        // We want to extract: 128, 256
        const variants = text.split(',').map(v => v.trim());

        variants.forEach(variant => {
          // Extract the storage value (first number before GB)
          const match = variant.match(/^(\d+)\s*(GB|TB)/i);
          if (match) {
            let value = parseInt(match[1]);
            if (match[2].toUpperCase() === 'TB') {
              value = value * 1024; // Convert TB to GB
            }
            if (value >= 8 && value <= 2048) {
              storageSet.add(value);
            }
          }
        });

        // Also handle single format like "512 GB"
        if (!text.includes(',')) {
          const gbMatch = text.match(/(\d+)\s*GB(?!\s*RAM)/i);
          if (gbMatch) {
            const value = parseInt(gbMatch[1]);
            if (value >= 8 && value <= 2048) {
              storageSet.add(value);
            }
          }
        }
      }
    });

    return Array.from(storageSet).sort((a, b) => a - b);
  }

  /**
   * Extract color options from page
   */
  private extractColors($: cheerio.CheerioAPI): string[] {
    const colorSet = new Set<string>();

    // Look for colors in specifications table
    $('td.ttl:contains("Colors")').parent().find('td.nfo').each((_, element) => {
      const text = $(element).text();

      // Split by comma and clean up
      const colors = text.split(/[,;]/).map(c => c.trim()).filter(c => {
        // Filter out empty strings and non-color text
        return c.length > 0 &&
               c.length < 50 &&
               !c.toLowerCase().includes('available') &&
               !c.toLowerCase().includes('color');
      });

      colors.forEach(color => {
        if (color) {
          // Capitalize first letter
          const formatted = color.charAt(0).toUpperCase() + color.slice(1);
          colorSet.add(formatted);
        }
      });
    });

    // Also check for color variations in body text
    const bodyText = $('.accent-camera').text();
    const colorPatterns = [
      /Available\s+in\s+([^.]+)/i,
      /Colors?:\s*([^.]+)/i,
      /Comes?\s+in\s+([^.]+)/i
    ];

    colorPatterns.forEach(pattern => {
      const match = bodyText.match(pattern);
      if (match && match[1]) {
        const colors = match[1].split(/[,;&]/).map(c => c.trim());
        colors.forEach(color => {
          if (color && color.length < 50) {
            const formatted = color.charAt(0).toUpperCase() + color.slice(1);
            colorSet.add(formatted);
          }
        });
      }
    });

    return Array.from(colorSet).slice(0, 20); // Limit to 20 colors max
  }

  /**
   * Respect rate limiting - wait between requests
   */
  private async respectRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`[PhoneSpecsScraper] Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.flushAll();
    console.log('[PhoneSpecsScraper] Cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { keys: number; hits: number; misses: number } {
    const stats = this.cache.getStats();
    return {
      keys: this.cache.keys().length,
      hits: stats.hits,
      misses: stats.misses
    };
  }
}
