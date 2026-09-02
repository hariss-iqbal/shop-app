import { supabase } from '../lib/supabase';

export type Location = { id: string; name: string; code: string; isPrimary: boolean };
export type Partner = { id: string; name: string; phone: string | null; isActive: boolean };
export type PartnerBalance = Partner & {
  outCount: number;
  inCount: number;
  receivable: number;
  payable: number;
  net: number; // >0 they owe us, <0 we owe them
};

export type AvailableDevice = {
  id: string;
  model: string;
  brand: string;
  storageGb: number | null;
  color: string | null;
  condition: string;
  imei: string | null;
  costPrice: number;
  sellingPrice: number;
  locationId: string | null;
  locationCode: string | null;
  variantId: string | null;
};

export type DeviceOut = {
  id: string;
  status: 'out' | 'in_stock' | 'sold' | 'returned' | 'cancelled';
  direction: 'out' | 'in';
  productId: string;
  imei: string | null;
  imei2: string | null;
  model: string;
  brand: string;
  storageGb: number | null;
  color: string | null;
  destinationKind: 'partner' | 'branch';
  destinationName: string | null;
  fromLocation: string | null;
  outPrice: number;
  settledPrice: number | null;
  amountReceived: number;
  outstanding: number;
  outDate: string;
  daysOut: number;
  notes: string | null;
  recallRequestedAt: string | null;
  claimedUntil: string | null;
  claimedBy: string | null;
  claimedByEmail: string | null;
};

export type ProductHistoryEvent = {
  type: 'intake' | 'out' | 'consignment_in' | 'settled' | 'returned' | 'cancelled' | 'sold';
  at: string;
  location?: string | null;
  destination?: string | null;
  destinationKind?: 'partner' | 'branch';
  price?: number | null;
  actor?: string | null;
  buyer?: string | null;
  buyerPhone?: string | null;
  notes?: string | null;
};

export type BulkResult = {
  success: boolean;
  okCount?: number;
  failCount?: number;
  items?: Array<{ productId?: string; outId?: string; success: boolean; error?: string }>;
  error?: string;
};

export async function listLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('store_locations')
    .select('id, name, code, is_primary')
    .eq('is_active', true)
    .order('is_primary', { ascending: false })
    .order('name');
  if (error) throw error;
  return (data ?? []).map((l: any) => ({ id: l.id, name: l.name, code: l.code, isPrimary: !!l.is_primary }));
}

/** Make this shop the master. The DB trigger clears is_primary on the others. */
export async function setPrimaryLocation(locationId: string): Promise<void> {
  const { error } = await supabase
    .from('store_locations')
    .update({ is_primary: true })
    .eq('id', locationId);
  if (error) throw error;
}

export async function listPartners(): Promise<Partner[]> {
  const { data, error } = await supabase
    .from('partner_shops')
    .select('id, name, phone, is_active')
    .order('name');
  if (error) throw error;
  return (data ?? []).map((p: any) => ({ id: p.id, name: p.name, phone: p.phone, isActive: p.is_active }));
}

export async function createPartner(name: string, phone?: string): Promise<Partner> {
  const { data, error } = await supabase
    .from('partner_shops')
    .insert({ name: name.trim(), phone: phone?.trim() || null })
    .select('id, name, phone, is_active')
    .single();
  if (error) throw error;
  return { id: data.id, name: data.name, phone: data.phone, isActive: data.is_active };
}

export async function getPartnerBalances(): Promise<PartnerBalance[]> {
  const { data, error } = await supabase.rpc('get_partner_balances');
  if (error) throw error;
  return (data ?? []) as PartnerBalance[];
}

export async function searchAvailableDevices(search: string): Promise<AvailableDevice[]> {
  // Fetch available devices and filter client-side (model name lives on an
  // embedded table, and IMEIs are often null — a server-side imei filter would
  // wrongly exclude everything).
  const { data, error } = await supabase
    .from('products')
    .select(
      `id, storage_gb, color, condition, imei, cost_price, selling_price, location_id, variant_id,
       model:models!model_id(name), brand:brands!brand_id(name),
       loc:store_locations!location_id(code)`
    )
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  let rows = (data ?? []) as any[];
  const s = search.trim().toLowerCase();
  if (s)
    rows = rows.filter(
      (r) =>
        (r.model?.name ?? '').toLowerCase().includes(s) ||
        (r.brand?.name ?? '').toLowerCase().includes(s) ||
        (r.color ?? '').toLowerCase().includes(s) ||
        (r.imei ?? '').includes(s)
    );
  return rows.map((r) => ({
    id: r.id,
    model: r.model?.name ?? '—',
    brand: r.brand?.name ?? '—',
    storageGb: r.storage_gb,
    color: r.color,
    condition: r.condition,
    imei: r.imei,
    costPrice: Number(r.cost_price ?? 0),
    sellingPrice: Number(r.selling_price ?? 0),
    locationId: r.location_id,
    locationCode: r.loc?.code ?? null,
    variantId: r.variant_id ?? null,
  }));
}

/** How many available units exist per variant (for the last-unit warning). */
export async function countAvailableByVariant(variantIds: string[]): Promise<Record<string, number>> {
  if (variantIds.length === 0) return {};
  const { data, error } = await supabase
    .from('products')
    .select('variant_id')
    .eq('status', 'available')
    .in('variant_id', variantIds);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const r of (data ?? []) as any[]) {
    if (r.variant_id) counts[r.variant_id] = (counts[r.variant_id] ?? 0) + 1;
  }
  return counts;
}

export async function getDeviceOuts(
  opts: { status?: string; fromLocationId?: string; direction?: 'out' | 'in' } = {}
): Promise<DeviceOut[]> {
  const { data, error } = await supabase.rpc('get_device_outs', {
    p_status: opts.status ?? null,
    p_from_location_id: opts.fromLocationId ?? null,
    p_direction: opts.direction ?? null,
  });
  if (error) throw error;
  return (data ?? []) as DeviceOut[];
}

export async function createDeviceIn(args: {
  partnerId: string;
  brandId: string;
  modelName: string;
  inPrice: number;
  storageGb?: number | null;
  color?: string | null;
  imei?: string | null;
  sellPrice?: number | null;
  notes?: string | null;
}): Promise<{ success: boolean; outId?: string; productId?: string; error?: string }> {
  const { data, error } = await supabase.rpc('create_device_in', {
    p_partner_id: args.partnerId,
    p_brand_id: args.brandId,
    p_model_name: args.modelName,
    p_in_price: args.inPrice,
    p_storage_gb: args.storageGb ?? null,
    p_color: args.color ?? null,
    p_imei: args.imei ?? null,
    p_sell_price: args.sellPrice ?? null,
    p_notes: args.notes ?? null,
  });
  if (error) throw error;
  return data;
}

export async function sellDeviceIn(args: {
  outId: string;
  salePrice: number;
  paymentMethod?: string;
}): Promise<{ success: boolean; saleId?: string; profit?: number; weOwe?: number; error?: string }> {
  const { data, error } = await supabase.rpc('sell_device_in', {
    p_out_id: args.outId,
    p_sale_price: args.salePrice,
    p_payment_method: args.paymentMethod ?? null,
  });
  if (error) throw error;
  return data;
}

export async function payPartner(
  partnerId: string,
  amount: number,
  method?: string
): Promise<{ success: boolean; applied?: number; unapplied?: number; error?: string }> {
  const { data, error } = await supabase.rpc('pay_partner', {
    p_partner_id: partnerId,
    p_amount: amount,
    p_method: method ?? null,
  });
  if (error) throw error;
  return data;
}

export async function createDeviceOut(args: {
  productId: string;
  destinationKind: 'partner' | 'branch';
  outPrice: number;
  toPartnerId?: string | null;
  toLocationId?: string | null;
  notes?: string | null;
}): Promise<{ success: boolean; outId?: string; error?: string }> {
  const { data, error } = await supabase.rpc('create_device_out', {
    p_product_id: args.productId,
    p_destination_kind: args.destinationKind,
    p_out_price: args.outPrice,
    p_to_partner_id: args.toPartnerId ?? null,
    p_to_location_id: args.toLocationId ?? null,
    p_notes: args.notes ?? null,
  });
  if (error) throw error;
  return data;
}

export async function settleDeviceOut(args: {
  outId: string;
  settledPrice: number;
  amountReceived: number;
  paymentMethod?: string;
  notes?: string;
  buyerName?: string;
  buyerPhone?: string;
}): Promise<{ success: boolean; saleId?: string; profit?: number; error?: string }> {
  const { data, error } = await supabase.rpc('settle_device_out', {
    p_out_id: args.outId,
    p_settled_price: args.settledPrice,
    p_amount_received: args.amountReceived,
    p_payment_method: args.paymentMethod ?? null,
    p_notes: args.notes ?? null,
    p_buyer_name: args.buyerName ?? null,
    p_buyer_phone: args.buyerPhone ?? null,
  });
  if (error) throw error;
  return data;
}

export async function returnDeviceOut(
  outId: string,
  imeiConfirm?: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('return_device_out', {
    p_out_id: outId,
    p_imei_confirm: imeiConfirm ?? null,
  });
  if (error) throw error;
  return data;
}

export async function createDeviceOutsBulk(args: {
  productIds: string[];
  destinationKind: 'partner' | 'branch';
  outPrice: number;
  toPartnerId?: string | null;
  toLocationId?: string | null;
  notes?: string | null;
}): Promise<BulkResult> {
  const { data, error } = await supabase.rpc('create_device_outs_bulk', {
    p_product_ids: args.productIds,
    p_destination_kind: args.destinationKind,
    p_out_price: args.outPrice,
    p_to_partner_id: args.toPartnerId ?? null,
    p_to_location_id: args.toLocationId ?? null,
    p_notes: args.notes ?? null,
  });
  if (error) throw error;
  return data;
}

export async function returnDeviceOutsBulk(outIds: string[]): Promise<BulkResult> {
  const { data, error } = await supabase.rpc('return_device_outs_bulk', { p_out_ids: outIds });
  if (error) throw error;
  return data;
}

export async function requestReturn(outId: string): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('request_return', { p_out_id: outId });
  if (error) throw error;
  return data;
}

export async function claimDeviceOut(
  outId: string,
  minutes = 120
): Promise<{ success: boolean; claimedUntil?: string; error?: string }> {
  const { data, error } = await supabase.rpc('claim_device_out', {
    p_out_id: outId,
    p_minutes: minutes,
  });
  if (error) throw error;
  return data;
}

export async function releaseDeviceOutClaim(outId: string): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('release_device_out_claim', { p_out_id: outId });
  if (error) throw error;
  return data;
}

export async function updateDeviceOutPrice(
  outId: string,
  newPrice: number
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('update_device_out_price', {
    p_out_id: outId,
    p_new_price: newPrice,
  });
  if (error) throw error;
  return data;
}

export async function getProductHistory(productId: string): Promise<ProductHistoryEvent[]> {
  const { data, error } = await supabase.rpc('get_product_history', { p_product_id: productId });
  if (error) throw error;
  return (data ?? []) as ProductHistoryEvent[];
}

export async function cancelDeviceOut(outId: string): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('cancel_device_out', { p_out_id: outId });
  if (error) throw error;
  return data;
}
