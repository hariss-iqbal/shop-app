import { Injectable } from '@angular/core';

/**
 * Renders Facebook post text for a variant from a placeholder template.
 *
 * The post is photo + caption: the variant's existing catalogue image is posted
 * unmodified and this text is the caption. Nothing is uploaded or generated.
 */

/** The data a template is rendered against — mirrors a row in the admin variant list. */
export interface PostTemplateContext {
  modelName: string;
  brandName: string;
  storageGb: number | null;
  color: string | null;
  condition: string;
  ptaStatus: string | null;
  sellingPrice: number;
  stockCount: number;
}

export interface PlaceholderInfo {
  token: string;
  description: string;
  /** False when nothing in the schema backs this placeholder — it renders empty. */
  available: boolean;
}

/**
 * Default template, matching the shop's existing post format.
 *
 * `{ram}` is deliberately listed even though no column backs it (see
 * PLACEHOLDERS): it renders empty and the surrounding spaces collapse, so the
 * line degrades to just the storage. Type the RAM into the preview before
 * copying, or add a `ram_gb` column to `variants` to fill it automatically.
 */
export const DEFAULT_POST_TEMPLATE = [
  '{model}',
  '{ram} {storage}',
  'NON ACTIVE',
  'OEM UNLOCKED',
  '100% ORIGINAL PHONES',
  'LAST {stock} {pieces} LEFT',
  '{price} CASH',
].join('\n');

const CONDITION_LABEL: Record<string, string> = {
  new: 'NEW',
  open_box: 'OPEN BOX',
  used: 'USED',
};

const PTA_LABEL: Record<string, string> = {
  pta_approved: 'PTA APPROVED',
  non_pta: 'NON-PTA',
};

@Injectable({ providedIn: 'root' })
export class FbPostTemplateService {
  /** Every token the renderer understands, for the preview dialog's help list. */
  readonly placeholders: PlaceholderInfo[] = [
    { token: '{model}', description: 'Model name, e.g. Pixel 9', available: true },
    { token: '{brand}', description: 'Brand name, e.g. Google', available: true },
    { token: '{storage}', description: 'Storage, e.g. 128GB', available: true },
    { token: '{color}', description: 'Colour, e.g. Obsidian', available: true },
    { token: '{condition}', description: 'NEW / OPEN BOX / USED', available: true },
    { token: '{pta}', description: 'PTA APPROVED / NON-PTA', available: true },
    { token: '{stock}', description: 'Units in stock right now', available: true },
    { token: '{pieces}', description: 'PIECE or PIECES, matched to {stock}', available: true },
    { token: '{price}', description: 'Short price, e.g. 123K', available: true },
    { token: '{priceFull}', description: 'Full price, e.g. PKR 123,000', available: true },
    { token: '{ram}', description: 'No RAM column exists on variants — renders empty', available: false },
  ];

  /** Short price used in post copy: 123000 -> "123K". Sub-1000 prices stay exact. */
  private shortPrice(price: number): string {
    const n = Math.round(Number(price) || 0);
    return n >= 1000 ? `${Math.round(n / 1000)}K` : String(n);
  }

  private fullPrice(price: number): string {
    return `PKR ${Math.round(Number(price) || 0).toLocaleString('en-PK')}`;
  }

  private values(ctx: PostTemplateContext): Record<string, string> {
    return {
      model: (ctx.modelName || '').toUpperCase(),
      brand: (ctx.brandName || '').toUpperCase(),
      storage: ctx.storageGb ? `${ctx.storageGb}GB` : '',
      color: (ctx.color || '').toUpperCase(),
      condition: CONDITION_LABEL[ctx.condition] ?? (ctx.condition || '').toUpperCase(),
      pta: ctx.ptaStatus ? (PTA_LABEL[ctx.ptaStatus] ?? ctx.ptaStatus.toUpperCase()) : '',
      stock: String(ctx.stockCount ?? 0),
      pieces: ctx.stockCount === 1 ? 'PIECE' : 'PIECES',
      price: this.shortPrice(ctx.sellingPrice),
      priceFull: this.fullPrice(ctx.sellingPrice),
      // No column backs RAM today; renders empty rather than printing "{ram}".
      ram: '',
    };
  }

  /**
   * Substitutes placeholders and tidies the result:
   * - unknown tokens are left as-is, so a typo is visible instead of silently dropped
   * - runs of spaces left by empty values collapse
   * - lines that end up empty are removed (e.g. a bare "{ram}" line)
   * - the stock line is dropped entirely when nothing is in stock, since
   *   "LAST 0 PIECES LEFT" would advertise an unavailable phone
   */
  render(template: string, ctx: PostTemplateContext): string {
    const values = this.values(ctx);
    const outOfStock = (ctx.stockCount ?? 0) <= 0;

    return template
      .split('\n')
      .map(rawLine => {
        const mentionsStock = rawLine.includes('{stock}');
        if (mentionsStock && outOfStock) return null;

        const substituted = rawLine.replace(/\{(\w+)\}/g, (match, key: string) =>
          key in values ? values[key] : match
        );

        return substituted.replace(/[ \t]{2,}/g, ' ').trim();
      })
      .filter((line): line is string => line !== null && line.length > 0)
      .join('\n');
  }
}
