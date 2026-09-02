/**
 * WhatsApp Cloud API — shared types
 * Feature: F-XXX WhatsApp Inbound Bot
 *
 * Inbound webhook payload shapes (subset we use) + internal intent model.
 * Reference: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
 */

/** Minimal shape of an inbound text message from the Cloud API webhook. */
export interface InboundMessage {
  /** Sender's WhatsApp phone number in international format, no '+', e.g. "923214495690". */
  from: string;
  /** WhatsApp message id, used for idempotency / read receipts. */
  messageId: string;
  /** Plain text body (we only handle text in the first version). */
  text: string;
  /** Profile name from the contacts block, if present. */
  profileName?: string;
  /** Unix timestamp (seconds) the message was sent. */
  timestamp?: string;
}

/** Intent the parser believes the customer expressed. */
export type IntentType =
  | 'greeting'
  | 'product_query'   // asking price / availability / specs for a model or budget
  | 'see_first'       // wants a live video / photos of the actual unit before paying
  | 'human'           // wants to talk to a person
  | 'catalog'         // wants the full list / link
  | 'confirm_order'   // ready to place / confirm an order → route to a human
  | 'need_help'       // confused / asking how it works
  | 'unknown';

/** One turn of conversation history, for short-term context. */
export interface ConvoMessage {
  direction: 'in' | 'out';
  text: string;
}

export interface ParsedIntent {
  type: IntentType;
  /** Free-text model query extracted from the message, e.g. "pixel 7a 128". */
  modelQuery?: string;
  /** Brand hint (google/apple/samsung/…) — used for brand-only or budget queries. */
  brand?: string;
  /** Storage in GB if the customer specified one (128/256/512). */
  storageGb?: number;
  /** Whether the customer explicitly mentioned PTA / non-PTA preference. */
  ptaPreference?: 'pta_approved' | 'non_pta';
  /** Condition preference (new/open_box/used). */
  condition?: 'new' | 'open_box' | 'used';
  /** Budget ceiling in PKR (e.g. "under 80k" → 80000). */
  maxPrice?: number;
  /** Budget floor in PKR. */
  minPrice?: number;
  /** Confidence 0..1 — used to decide between a confident reply and a clarifying one. */
  confidence: number;
  /** Language we detected, for reply phrasing. */
  lang: 'en' | 'roman_ur';
  /** Which parser produced this — for logging/debugging. */
  source?: 'keyword' | 'llm';
}

/** A reply the bot wants to send back. */
export interface BotReply {
  /** Text to send. */
  text: string;
  /** Optional image URL (e.g. a variant's primary image). */
  imageUrl?: string;
  /** Whether this conversation should be flagged for a human to pick up. */
  handoff?: boolean;
}

/** Filters for an inventory search (from keyword or LLM parsing). */
export interface VariantFilters {
  modelQuery?: string;
  brand?: string;
  storageGb?: number;
  pta?: 'pta_approved' | 'non_pta';
  condition?: 'new' | 'open_box' | 'used';
  maxPrice?: number;
  minPrice?: number;
}

/** A variant row joined with its model + brand, as the bot needs it. */
export interface VariantSummary {
  id: string;
  brand: string;
  model: string;
  storageGb: number | null;
  ptaStatus: string | null;       // 'pta_approved' | 'non_pta' | null
  condition: string;              // product_condition enum value
  sellingPrice: number;
  stockCount: number;
  availableColors: string[];
  /** Direct link to this product's page, built from its slug. */
  productUrl: string | null;
}
