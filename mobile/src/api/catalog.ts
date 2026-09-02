import { supabase } from '../lib/supabase';
import { config } from '../config';

export type Brand = { id: string; name: string; logoUrl: string | null };

export type GsmArenaSpecs = {
  ram: number[];
  storage: number[];
  colors: string[];
  modelName?: string;
};

export async function listBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from('brands')
    .select('id, name, logo_url')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((b: any) => ({ id: b.id, name: b.name, logoUrl: b.logo_url ?? null }));
}

/** Search GSMArena (via the backend proxy) for model-name matches. */
export async function searchGsmArenaModels(
  query: string
): Promise<{ ok: boolean; results: { name: string; url: string }[]; error?: string }> {
  try {
    const res = await fetch(`${config.apiServerUrl}/api/products/search-models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim() }),
    });
    const json = await res.json();
    return { ok: !!json.success, results: json.data ?? [], error: json.error };
  } catch (e: any) {
    return { ok: false, results: [], error: e?.message ?? 'GSMArena lookup unavailable' };
  }
}

/** Fetch storage/RAM/colors + canonical name from GSMArena (via proxy). */
export async function fetchGsmArenaSpecs(
  brand: string,
  model: string
): Promise<{ ok: boolean; specs?: GsmArenaSpecs; error?: string }> {
  try {
    const res = await fetch(`${config.apiServerUrl}/api/products/fetch-specs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand: brand.trim(), model: model.trim() }),
    });
    const json = await res.json();
    if (!json.success) return { ok: false, error: json.error };
    return { ok: true, specs: json.data };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'GSMArena lookup unavailable' };
  }
}

/** Find a model by brand + name (case-insensitive), creating it if absent. */
export async function findOrCreateModel(brandId: string, name: string): Promise<string> {
  const trimmed = name.trim();
  const { data: existing, error: findErr } = await supabase
    .from('models')
    .select('id, name')
    .eq('brand_id', brandId)
    .ilike('name', trimmed)
    .maybeSingle();
  if (findErr) throw findErr;
  if (existing) return existing.id as string;

  const { data, error } = await supabase
    .from('models')
    .insert({ brand_id: brandId, name: trimmed })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

/**
 * Find-or-create a variant for (model, storage, pta, condition) — mirrors the
 * web app's resolveVariant. Sets selling_price + available_colors. Returns the
 * variant id and whether it already existed.
 */
export async function findOrCreateVariant(args: {
  modelId: string;
  storageGb: number | null;
  ptaStatus: string | null;
  condition: string;
  sellingPrice: number;
  availableColors: string[];
  isActive: boolean;
}): Promise<{ id: string; existed: boolean }> {
  let query = supabase
    .from('variants')
    .select('id')
    .eq('model_id', args.modelId)
    .eq('condition', args.condition);
  query = args.storageGb == null ? query.is('storage_gb', null) : query.eq('storage_gb', args.storageGb);
  query = args.ptaStatus == null ? query.is('pta_status', null) : query.eq('pta_status', args.ptaStatus);

  const { data: existing, error: findErr } = await query.maybeSingle();
  if (findErr) throw findErr;
  if (existing) {
    // Update price/colors/visibility on the existing variant.
    const { error: upErr } = await supabase
      .from('variants')
      .update({
        selling_price: args.sellingPrice,
        available_colors: args.availableColors,
        is_active: args.isActive,
      })
      .eq('id', existing.id);
    if (upErr) throw upErr;
    return { id: existing.id as string, existed: true };
  }

  const { data, error } = await supabase
    .from('variants')
    .insert({
      model_id: args.modelId,
      storage_gb: args.storageGb,
      pta_status: args.ptaStatus,
      condition: args.condition,
      selling_price: args.sellingPrice,
      available_colors: args.availableColors,
      is_active: args.isActive,
    })
    .select('id')
    .single();
  if (error) throw error;
  return { id: data.id as string, existed: false };
}
