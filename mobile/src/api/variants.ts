import { supabase } from '../lib/supabase';
import { uploadToCloudinary, PickedImage } from '../cloudinary';

export type VariantImage = {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
  color: string | null;
};

export type VariantListItem = {
  id: string;
  modelId: string;
  modelName: string;
  brandName: string;
  brandLogoUrl: string | null;
  storageGb: number | null;
  ptaStatus: string | null;
  condition: string;
  sellingPrice: number;
  avgCostPrice: number;
  stockCount: number;
  isActive: boolean;
  availableColors: string[];
  thumbnailUrl: string | null;
};

export type VariantDetail = {
  id: string;
  modelId: string;
  modelName: string;
  brandId: string;
  brandName: string;
  storageGb: number | null;
  ptaStatus: string | null;
  condition: string;
  sellingPrice: number;
  avgCostPrice: number;
  stockCount: number;
  availableColors: string[];
  inactiveColors: string[];
  isActive: boolean;
  primaryImageUrl: string | null;
  slug: string;
  createdAt: string;
  updatedAt: string | null;
  images: VariantImage[];
};

const PAGE_SIZE = 20;

/**
 * Admin variant list — queries the variants table directly (like the web admin),
 * so it includes inactive and zero-stock variants. One row per variant; colors
 * are shown as chips rather than fanned out.
 */
export async function listVariants(opts: {
  search?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ items: VariantListItem[]; total: number }> {
  const page = opts.page ?? 0;
  const pageSize = opts.pageSize ?? PAGE_SIZE;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('variants')
    .select(
      `id, storage_gb, pta_status, condition, selling_price, avg_cost_price,
       stock_count, is_active, available_colors, created_at,
       model:models!model_id!inner(id, name, brand:brands!brand_id!inner(id, name, logo_url)),
       variant_images(image_url, is_primary, display_order)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (opts.search && opts.search.trim()) {
    query = query.ilike('model.name', `%${opts.search.trim()}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const items: VariantListItem[] = (data ?? []).map((row: any) => {
    const model = row.model ?? {};
    const brand = model.brand ?? {};
    const images: any[] = row.variant_images ?? [];
    const primary =
      images.find((i) => i.is_primary)?.image_url ??
      [...images].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))[0]?.image_url ??
      null;
    return {
      id: row.id,
      modelId: model.id ?? row.model_id ?? '',
      modelName: model.name ?? '—',
      brandName: brand.name ?? '—',
      brandLogoUrl: brand.logo_url ?? null,
      storageGb: row.storage_gb,
      ptaStatus: row.pta_status,
      condition: row.condition,
      sellingPrice: Number(row.selling_price ?? 0),
      avgCostPrice: Number(row.avg_cost_price ?? 0),
      stockCount: row.stock_count ?? 0,
      isActive: !!row.is_active,
      availableColors: row.available_colors ?? [],
      thumbnailUrl: primary,
    };
  });

  return { items, total: count ?? items.length };
}

export async function getVariantDetail(id: string): Promise<VariantDetail | null> {
  const { data, error } = await supabase.rpc('get_variant_detail', { p_variant_id: id });
  if (error) throw error;
  if (!data || data.found === false) return null;
  const v = data.variant ?? {};
  const images: VariantImage[] = (data.images ?? []).map((img: any) => ({
    id: img.id,
    imageUrl: img.imageUrl ?? img.image_url,
    isPrimary: !!(img.isPrimary ?? img.is_primary),
    displayOrder: img.displayOrder ?? img.display_order ?? 0,
    color: img.color ?? null,
  }));
  return {
    id: v.id,
    modelId: v.modelId,
    modelName: v.modelName,
    brandId: v.brandId,
    brandName: v.brandName,
    storageGb: v.storageGb,
    ptaStatus: v.ptaStatus,
    condition: v.condition,
    sellingPrice: Number(v.sellingPrice ?? 0),
    avgCostPrice: Number(v.avgCostPrice ?? 0),
    stockCount: v.stockCount ?? 0,
    availableColors: v.availableColors ?? [],
    inactiveColors: v.inactiveColors ?? [],
    isActive: !!v.isActive,
    primaryImageUrl: v.primaryImageUrl ?? null,
    slug: v.slug,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt ?? null,
    images,
  };
}

/**
 * Update a variant's selling price. Mirrors the web app: write the variant,
 * then cascade the same price to all linked phone products.
 */
export async function updateVariantPrice(id: string, price: number): Promise<void> {
  const { error } = await supabase.from('variants').update({ selling_price: price }).eq('id', id);
  if (error) throw error;
  const { error: prodErr } = await supabase
    .from('products')
    .update({ selling_price: price })
    .eq('variant_id', id)
    .eq('product_type', 'phone');
  if (prodErr) throw prodErr;
}

export async function toggleVariantActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('variants').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
}

/** Turn a single color on/off for a variant (catalog hides inactive colors). */
export async function setVariantColorActive(
  id: string,
  color: string,
  active: boolean,
  currentInactive: string[]
): Promise<string[]> {
  const set = new Set(currentInactive);
  if (active) set.delete(color);
  else set.add(color);
  const next = Array.from(set);
  const { error } = await supabase.from('variants').update({ inactive_colors: next }).eq('id', id);
  if (error) throw error;
  return next;
}

/**
 * Move one color's units to a different config (model+storage+pta+condition),
 * creating that config if needed. The source config's other colors are untouched.
 * This is how Option A changes PTA/storage/condition "for one color only".
 */
export async function moveVariantColor(args: {
  variantId: string;
  color: string;
  targetStorageGb: number | null;
  targetPta: string | null; // 'pta_approved' | 'non_pta' | null
  targetCondition: string; // 'new' | 'used' | 'refurbished' | 'open_box'
}): Promise<{ success: boolean; targetVariantId?: string; moved?: number; error?: string }> {
  const { data, error } = await supabase.rpc('move_variant_color', {
    p_variant_id: args.variantId,
    p_color: args.color,
    p_target_storage_gb: args.targetStorageGb,
    p_target_pta: args.targetPta,
    p_target_condition: args.targetCondition,
  });
  if (error) throw error;
  return {
    success: !!data?.success,
    targetVariantId: data?.targetVariantId,
    moved: data?.moved,
    error: data?.error,
  };
}

/**
 * Update the editable variant columns (storage / condition / PTA / colors).
 * Changing storage/condition/PTA can collide with the (model, storage, pta,
 * condition) uniqueness constraint — the error is surfaced to the caller.
 */
export async function updateVariantFields(
  id: string,
  fields: {
    storageGb: number | null;
    condition: string;
    ptaStatus: string | null;
    availableColors: string[];
  }
): Promise<void> {
  const { error } = await supabase
    .from('variants')
    .update({
      storage_gb: fields.storageGb,
      condition: fields.condition,
      pta_status: fields.ptaStatus,
      available_colors: fields.availableColors,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function getVariantImages(variantId: string): Promise<VariantImage[]> {
  const { data, error } = await supabase
    .from('variant_images')
    .select('id, image_url, is_primary, display_order, color')
    .eq('variant_id', variantId)
    .order('is_primary', { ascending: false })
    .order('display_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((img: any) => ({
    id: img.id,
    imageUrl: img.image_url,
    isPrimary: !!img.is_primary,
    displayOrder: img.display_order ?? 0,
    color: img.color ?? null,
  }));
}

/**
 * Upload a picked image to Cloudinary, then record it in variant_images.
 * First image (or explicit isPrimary) becomes the primary.
 */
export async function uploadVariantImage(
  variantId: string,
  picked: PickedImage,
  opts: { isPrimary?: boolean; color?: string | null } = {}
): Promise<VariantImage> {
  const result = await uploadToCloudinary(picked);
  const color = opts.color ?? null;

  // Primary is PER COLOR: the first image of this color becomes that color's
  // primary, and clearing only affects images of the same color.
  const sameColorQ = supabase.from('variant_images').select('id').eq('variant_id', variantId);
  const { data: sameColor } = await (color === null
    ? sameColorQ.is('color', null)
    : sameColorQ.eq('color', color));
  const { data: maxOrder } = await supabase
    .from('variant_images')
    .select('display_order')
    .eq('variant_id', variantId)
    .order('display_order', { ascending: false })
    .limit(1);
  const nextOrder = ((maxOrder?.[0]?.display_order as number) ?? -1) + 1;
  const isFirstOfColor = !sameColor || sameColor.length === 0;
  const shouldBePrimary = opts.isPrimary || isFirstOfColor;

  const { data, error } = await supabase
    .from('variant_images')
    .insert({
      variant_id: variantId,
      image_url: result.secureUrl,
      storage_path: result.publicId,
      public_id: result.publicId,
      is_primary: shouldBePrimary,
      display_order: nextOrder,
      color,
    })
    .select('id, image_url, is_primary, display_order, color')
    .single();
  if (error) throw error;

  if (shouldBePrimary) {
    const clearQ = supabase
      .from('variant_images')
      .update({ is_primary: false })
      .eq('variant_id', variantId)
      .neq('id', data.id);
    await (color === null ? clearQ.is('color', null) : clearQ.eq('color', color));
  }

  return {
    id: data.id,
    imageUrl: data.image_url,
    isPrimary: !!data.is_primary,
    displayOrder: data.display_order ?? 0,
    color: data.color ?? null,
  };
}

/** Make an image its color's primary (does not touch other colors' primaries). */
export async function setPrimaryImage(
  imageId: string,
  variantId: string,
  color: string | null
): Promise<void> {
  const clearQ = supabase.from('variant_images').update({ is_primary: false }).eq('variant_id', variantId);
  const { error: clearErr } = await (color === null ? clearQ.is('color', null) : clearQ.eq('color', color));
  if (clearErr) throw clearErr;
  const { error } = await supabase.from('variant_images').update({ is_primary: true }).eq('id', imageId);
  if (error) throw error;
}

export async function deleteVariantImage(imageId: string, variantId: string): Promise<void> {
  const { data: image } = await supabase
    .from('variant_images')
    .select('is_primary')
    .eq('id', imageId)
    .single();

  const { error } = await supabase.from('variant_images').delete().eq('id', imageId);
  if (error) throw error;

  // Promote the next image to primary if we removed the primary one.
  if (image?.is_primary) {
    const { data: next } = await supabase
      .from('variant_images')
      .select('id')
      .eq('variant_id', variantId)
      .order('display_order', { ascending: true })
      .limit(1);
    if (next?.[0]) {
      await supabase.from('variant_images').update({ is_primary: true }).eq('id', next[0].id);
    }
  }
}

export async function addStock(args: {
  variantId: string;
  color: string | null;
  costPrice: number;
  quantity: number;
}): Promise<{ success: boolean; productsCreated: number }> {
  const { data, error } = await supabase.rpc('add_stock', {
    p_variant_id: args.variantId,
    p_color: args.color,
    p_cost_price: args.costPrice,
    p_quantity: args.quantity,
    p_supplier_id: null,
    p_notes: null,
    p_purchase_date: null,
  });
  if (error) throw error;
  return { success: !!data?.success, productsCreated: data?.productsCreated ?? 0 };
}

export async function getMyPermissions(): Promise<{
  role: string;
  isApproved: boolean;
  permissions: Record<string, boolean>;
}> {
  const { data, error } = await supabase.rpc('get_my_permissions');
  if (error) throw error;
  return {
    role: data?.role ?? 'cashier',
    isApproved: !!data?.isApproved,
    permissions: data?.permissions ?? {},
  };
}
