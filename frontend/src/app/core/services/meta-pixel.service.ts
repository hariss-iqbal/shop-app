import { Injectable } from '@angular/core';

/**
 * Meta (Facebook) Pixel events.
 *
 * The base pixel in `index.html` only fires `PageView`, which tells Meta that
 * someone visited but nothing about what they looked at. These events add the
 * detail that makes two things possible:
 *
 *  - retargeting audiences ("everyone who viewed a phone in the last 30 days")
 *  - conversion optimisation (telling Meta to find people likely to *message us*
 *    rather than people likely to click)
 *
 * Both are built from *past* events, so nothing can be reconstructed later —
 * an event that isn't firing today is audience permanently lost.
 *
 * Every call is best-effort: the pixel script is blocked by most ad blockers, so
 * `window.fbq` is frequently absent. Tracking must never break the page.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** What identifies a product to Meta. Must match the catalog feed — see catalogId(). */
export interface PixelProduct {
  variantSlug: string | null;
  color: string | null;
  name: string;
  price: number;
}

@Injectable({ providedIn: 'root' })
export class MetaPixelService {
  private readonly currency = 'PKR';

  /**
   * Rebuilds the id used by the Meta catalog feed so pixel events and catalog
   * products line up — that match is what enables dynamic retargeting ads
   * ("the phone you were looking at") instead of generic ones.
   *
   * MUST stay identical to `buildRow()` in
   * `backend/supabase/functions/meta-catalog/index.ts`. If the feed's id format
   * changes, change it here in the same commit or retargeting silently degrades:
   * events still fire, they just stop matching any catalog item.
   */
  catalogId(variantSlug: string | null, color: string | null): string {
    const colorPart = (color || 'default')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${variantSlug ?? ''}-${colorPart}`.slice(0, 100);
  }

  /** Someone opened a specific phone's page. The seed for every retargeting audience. */
  viewContent(product: PixelProduct): void {
    this.track('ViewContent', {
      content_ids: [this.catalogId(product.variantSlug, product.color)],
      content_type: 'product',
      content_name: product.name,
      value: product.price,
      currency: this.currency
    });
  }

  /** Someone searched the catalog — an intent signal, and a retargeting pool of its own. */
  search(query: string): void {
    const term = query.trim();
    if (!term) return;
    this.track('Search', { search_string: term });
  }

  /**
   * The money event: a visitor became a lead.
   *
   * `source` distinguishes the channel (WhatsApp vs the contact form) so the two
   * can be compared, but both report as `Contact` so Meta optimises toward the
   * combined signal rather than splitting an already-small conversion volume.
   */
  contact(source: 'whatsapp' | 'form', product?: PixelProduct): void {
    const params: Record<string, unknown> = { content_category: source };

    if (product) {
      params['content_ids'] = [this.catalogId(product.variantSlug, product.color)];
      params['content_name'] = product.name;
      params['value'] = product.price;
      params['currency'] = this.currency;
    }

    this.track('Contact', params);
  }

  private track(event: string, params: Record<string, unknown>): void {
    // Absent whenever the pixel script was blocked — the common case, not an error.
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;

    try {
      window.fbq('track', event, params);
    } catch {
      // Tracking is never worth breaking a page over.
    }
  }
}
