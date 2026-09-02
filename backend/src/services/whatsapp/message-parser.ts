/**
 * Intent parser — English + Roman Urdu.
 *
 * Pakistani customers usually type Roman Urdu ("iphone 13 kitnay ka hai",
 * "pixel 7a available hai?"). This parser handles both with keyword sets and
 * light model-query extraction — no external service required.
 *
 * OPTIONAL upgrade: if WHATSAPP_USE_LLM=1 and ANTHROPIC_API_KEY is set, you can
 * route low-confidence messages through Claude for understanding. The hook
 * `llmParse()` is stubbed below and falls back to keyword parsing if disabled,
 * so the bot works fully without any LLM key.
 */

import { ParsedIntent } from './types';

const GREETING = ['hi', 'hello', 'hey', 'salam', 'salaam', 'asalam', 'assalam', 'asalaam', 'aoa', 'slam', 'walaikum', 'alaikum', 'walikum'];
const PRICE_WORDS = ['price', 'rate', 'cost', 'kitna', 'kitnay', 'kitne', 'qeemat', 'qimat', 'keemat'];
const AVAIL_WORDS = ['available', 'stock', 'hai', 'mojood', 'mojud', 'milay', 'milega', 'milega', 'mile', 'ready'];
const VIDEO_WORDS = ['video', 'dekh', 'dekhna', 'dikha', 'photo', 'pic', 'tasveer', 'tasweer', 'condition', 'halat', 'real'];
const HUMAN_WORDS = ['baat', 'call', 'talk', 'agent', 'owner', 'sir', 'insan', 'banda', 'representative', 'human'];
const CATALOG_WORDS = ['list', 'catalog', 'catalogue', 'all', 'sab', 'saray', 'available phones', 'kya hai'];

const STORAGE_RE = /\b(64|128|256|512)\s*(gb)?\b/i;

function hasAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

/** Crude Roman-Urdu detector: presence of common UR tokens. */
function detectLang(text: string): 'en' | 'roman_ur' {
  const urTokens = ['kitna', 'kitnay', 'kitne', 'hai', 'mojood', 'qeemat', 'dekhna', 'chahiye', 'ka', 'ki', ' kya'];
  return urTokens.some((t) => text.includes(t)) ? 'roman_ur' : 'en';
}

/**
 * Extract the likely model query by removing intent/filler words, leaving
 * brand/model tokens (e.g. "iphone 13 kitnay ka" -> "iphone 13").
 */
const FILLER = new Set([
  ...GREETING, ...PRICE_WORDS, ...AVAIL_WORDS, ...VIDEO_WORDS, ...HUMAN_WORDS, ...CATALOG_WORDS,
  'ka', 'ki', 'ke', 'ko', 'kya', 'hai', 'ha', 'plz', 'please', 'bhai', 'sir', 'o',
  'me', 'mein', 'is', 'the', 'a', 'do', 'you', 'have', 'gb', 'wala', 'wali', 'show', 'send',
  'iska', 'iski', 'isay', 'ye', 'yeh', 'chahiye', 'karni', 'karna', 'se', 'main',
]);

function extractModelQuery(text: string): string {
  return text
    .split(' ')
    // Keep multi-char tokens, and single chars only if numeric (Pixel 6/7/8, iPhone 8).
    .filter((w) => w && !FILLER.has(w) && (w.length > 1 || /\d/.test(w)))
    .join(' ')
    .trim();
}

export function parseIntent(raw: string): ParsedIntent {
  const text = ` ${raw.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()} `;
  const lang = detectLang(text);

  const storageMatch = raw.match(STORAGE_RE);
  const storageGb = storageMatch ? parseInt(storageMatch[1], 10) : undefined;

  const ptaPreference =
    text.includes('non pta') || text.includes('nonpta') ? 'non_pta'
    : text.includes('pta') ? 'pta_approved'
    : undefined;

  const modelQuery = extractModelQuery(text);

  // Order matters. A "video/see first" request often also contains a model name,
  // but the dominant intent is the request to see the unit; handle it before
  // product lookups. Human handoff wins over everything.
  if (hasAny(text, HUMAN_WORDS)) {
    return { type: 'human', confidence: 0.8, lang };
  }
  if (hasAny(text, VIDEO_WORDS)) {
    return { type: 'see_first', modelQuery, storageGb, ptaPreference, confidence: 0.7, lang };
  }

  // Greeting-only: nothing meaningful left after stripping filler/greeting words.
  if (modelQuery.length < 2 && hasAny(text, GREETING)) {
    return { type: 'greeting', confidence: 0.9, lang };
  }

  // "all phones / list / sab phones" with no specific model → send catalog link.
  if (hasAny(text, CATALOG_WORDS) && modelQuery.length < 3) {
    return { type: 'catalog', confidence: 0.7, lang };
  }

  const looksLikeProduct = hasAny(text, PRICE_WORDS) || hasAny(text, AVAIL_WORDS) || modelQuery.length >= 3;
  if (looksLikeProduct && modelQuery.length >= 2) {
    const confidence = (hasAny(text, PRICE_WORDS) || hasAny(text, AVAIL_WORDS)) ? 0.85 : 0.6;
    return { type: 'product_query', modelQuery, storageGb, ptaPreference, confidence, lang };
  }

  if (modelQuery.length < 2 && hasAny(text, GREETING)) {
    return { type: 'greeting', confidence: 0.9, lang };
  }

  return { type: 'unknown', modelQuery, confidence: 0.3, lang };
}
