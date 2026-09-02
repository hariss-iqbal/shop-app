/**
 * Inventory lookup for the WhatsApp bot.
 *
 * Reads the SAME live data the public catalog shows — the `variants` table
 * joined to `models` and `brands`. RLS already allows anon SELECT on all three,
 * but we use the service key so the same client can also log inquiries.
 *
 * Matching strategy (no external NLU required):
 *   1. Pull the (small) list of active models once and cache briefly.
 *   2. Score each model name by token overlap with the customer's query,
 *      with brand-synonym expansion (iphone -> Apple, pixel -> Google, ...).
 *   3. For the best model(s), return in-stock variants ordered by price.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import NodeCache from 'node-cache';
import { VariantSummary, VariantFilters } from './types';

// Product page base, derived from the catalog URL (…/catalog → …/product).
const PRODUCT_BASE =
  (process.env.SHOP_CATALOG_URL || 'https://www.smartcell.pk/catalog').replace(/\/catalog\/?$/, '') + '/product';

// When a customer gives a budget, also surface options up to this much above it
// as "stretch" upsell suggestions. Configurable via env.
const BUDGET_STRETCH = Number(process.env.BUDGET_STRETCH_PKR) || 30000;

/** Words that point at a brand even when the customer doesn't name it. */
const BRAND_SYNONYMS: Record<string, string> = {
  iphone: 'apple',
  apple: 'apple',
  pixel: 'google',
  google: 'google',
  galaxy: 'samsung',
  samsung: 'samsung',
  oneplus: 'oneplus',
  nothing: 'nothing',
  redmi: 'xiaomi',
  poco: 'xiaomi',
  mi: 'xiaomi',
  xiaomi: 'xiaomi',
};

interface ModelRow {
  id: string;
  name: string;
  brand: string;
}

export class InventoryLookupService {
  // Null when Supabase env vars aren't configured yet — methods degrade to empty
  // results instead of throwing at construction (which would crash the whole API).
  private readonly supabase: SupabaseClient | null;
  private readonly cache = new NodeCache({ stdTTL: 120 }); // 2 min

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    const url = supabaseUrl || process.env.SUPABASE_URL || '';
    const key = supabaseKey || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';
    this.supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
    if (!this.supabase) {
      console.warn('[whatsapp] Supabase not configured — inventory lookups will return empty.');
    }
  }

  /** Whether the inventory backend is configured. */
  get isConfigured(): boolean {
    return this.supabase !== null;
  }

  /** Load active models (id, name, brand) with a short cache. */
  private async getModels(): Promise<ModelRow[]> {
    if (!this.supabase) return [];
    const cached = this.cache.get<ModelRow[]>('models');
    if (cached) return cached;

    const { data, error } = await this.supabase
      .from('models')
      .select('id, name, brands(name)');
    if (error) throw error;

    const rows: ModelRow[] = (data || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      brand: m.brands?.name ?? '',
    }));
    this.cache.set('models', rows);
    return rows;
  }

  /** Normalize text for matching: lowercase, strip punctuation, collapse spaces. */
  private norm(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Find the best-matching model id(s) for a free-text query.
   * Returns up to `limit` model ids ordered by match score (best first).
   */
  private async matchModels(query: string, limit = 3): Promise<ModelRow[]> {
    const models = await this.getModels();
    const qTokens = new Set(this.norm(query).split(' ').filter(Boolean));

    // Expand brand hints from synonyms.
    const brandHints = new Set<string>();
    for (const t of qTokens) {
      if (BRAND_SYNONYMS[t]) brandHints.add(BRAND_SYNONYMS[t]);
    }

    const scored = models.map((m) => {
      const nameTokens = this.norm(`${m.brand} ${m.name}`).split(' ').filter(Boolean);
      let score = 0;
      for (const nt of nameTokens) {
        if (qTokens.has(nt)) score += 2;                 // exact token hit
        else if ([...qTokens].some((qt) => qt.length >= 3 && nt.includes(qt))) score += 1;
      }
      if (brandHints.has(this.norm(m.brand))) score += 1; // brand synonym bonus
      return { model: m, score };
    });

    const ranked = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
    if (ranked.length === 0) return [];
    // Keep only the strongest tier (top score and one below), so "Pixel 7"
    // returns Pixel 7 / 7 Pro — not every Google model that merely shares "pixel".
    const maxScore = ranked[0].score;
    return ranked
      .filter((s) => s.score >= maxScore - 1)
      .slice(0, limit)
      .map((s) => s.model);
  }

  /**
   * Look up in-stock variants for a free-text model query.
   * @param storageGb  Optional storage filter.
   */
  async findVariants(query: string, storageGb?: number): Promise<VariantSummary[]> {
    return this.searchVariants({ modelQuery: query, storageGb });
  }

  /**
   * Unified in-stock search. Resolves which models to consider (by free-text
   * model match, by brand, or all), then applies storage / PTA / condition /
   * price filters. Used by both the keyword and LLM paths.
   */
  async searchVariants(f: VariantFilters): Promise<VariantSummary[]> {
    if (!this.supabase) return [];

    // 1) Resolve candidate models.
    let modelById = new Map<string, ModelRow>();
    let modelIds: string[] | null = null;

    if (f.modelQuery) {
      const matches = await this.matchModels(f.modelQuery);
      if (matches.length === 0) return [];
      modelIds = matches.map((m) => m.id);
      modelById = new Map(matches.map((m) => [m.id, m]));
    } else if (f.brand) {
      const brand = this.norm(f.brand);
      const models = (await this.getModels()).filter((m) => this.norm(m.brand) === brand);
      if (models.length === 0) return [];
      modelIds = models.map((m) => m.id);
      modelById = new Map(models.map((m) => [m.id, m]));
    } else {
      // Pure budget / no model or brand: search all in-stock, keep names for display.
      modelById = new Map((await this.getModels()).map((m) => [m.id, m]));
    }

    // 2) Build the filtered query.
    let q = this.supabase
      .from('variants')
      .select('id, model_id, storage_gb, pta_status, condition, selling_price, stock_count, available_colors, slug')
      .eq('is_active', true)
      .gt('stock_count', 0)
      .order('selling_price', { ascending: true })
      .limit(40);

    if (modelIds) q = q.in('model_id', modelIds);
    if (f.storageGb) q = q.eq('storage_gb', f.storageGb);
    if (f.pta) q = q.eq('pta_status', f.pta);
    if (f.condition) q = q.eq('condition', f.condition);
    // Budget: include a stretch window above the cap so we can show upsell options.
    if (f.maxPrice) q = q.lte('selling_price', f.maxPrice + BUDGET_STRETCH);
    if (f.minPrice) q = q.gte('selling_price', f.minPrice);

    const { data, error } = await q;
    if (error) throw error;

    return (data || []).map((v: any) => {
      const m = modelById.get(v.model_id);
      return {
        id: v.id,
        brand: m?.brand ?? '',
        model: m?.name ?? '',
        storageGb: v.storage_gb,
        ptaStatus: v.pta_status,
        condition: v.condition,
        sellingPrice: Number(v.selling_price),
        stockCount: v.stock_count,
        availableColors: v.available_colors ?? [],
        productUrl: v.slug ? `${PRODUCT_BASE}/${v.slug}` : null,
      } as VariantSummary;
    });
  }
}
