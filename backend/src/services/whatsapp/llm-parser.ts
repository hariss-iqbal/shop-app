/**
 * LLM understanding layer (GLM / Zhipu — OpenAI-compatible API).
 *
 * Turns free-form customer text (any phrasing, Roman Urdu, budgets, multi-
 * attribute) into a structured ParsedIntent. The LLM ONLY interprets intent +
 * filters — it never produces prices or stock. Real data always comes from
 * Supabase, so prices can't be hallucinated.
 *
 * Provider-agnostic via env (defaults to GLM):
 *   GLM_API_KEY   (required to enable; without it we fall back to keywords)
 *   GLM_BASE_URL  (default https://api.z.ai/api/paas/v4 ; Zhipu CN users:
 *                  https://open.bigmodel.cn/api/paas/v4)
 *   GLM_MODEL     (default glm-4-flash)
 *
 * Returns null on any problem (no key, timeout, bad JSON) so the caller can
 * fall back to the deterministic keyword parser.
 */

import axios from 'axios';
import { ParsedIntent, ConvoMessage } from './types';

const SYSTEM_PROMPT = `You convert a Pakistani mobile-phone shop customer's WhatsApp message into a structured search request.
Context: the shop is "Smart Cell" in Lahore, PAKISTAN. ALL prices are in Pakistani Rupees (PKR).
Stock is mostly Google Pixel, plus Apple, Samsung, OnePlus, Nothing, Xiaomi.
Customers write English or Roman Urdu, e.g. "iphone 13 kitnay ka hai", "80k mein konsa pixel", "pta wala 7a", "my budget is 1 lakh".

Earlier messages may be provided as context — use them to resolve follow-ups like "aur black mein?", "the cheaper one", "256 wala". If the new message clearly starts a new topic, ignore the old context.

Map the message ONLY into this finite set of fields. Output ONLY a JSON object (no prose, no code fences):
{
  "type": "greeting" | "product_query" | "see_first" | "human" | "catalog" | "confirm_order" | "need_help" | "unknown",
  "brand": "google" | "apple" | "samsung" | "oneplus" | "nothing" | "xiaomi" | null,   // the make
  "model": string | null,          // e.g. "Pixel 7a", "iPhone 13"; null if only brand/budget given
  "storageGb": number | null,      // 64 | 128 | 256 | 512
  "pta": "pta_approved" | "non_pta" | null,
  "condition": "new" | "open_box" | "used" | null,
  "maxPrice": number | null,       // PKR integer
  "minPrice": number | null,       // PKR integer
  "lang": "en" | "roman_ur"
}

PRICE NORMALIZATION (Pakistan) — always output a plain PKR integer:
- "80k" / "80 k" / "80,000" / "80000" / "80 hazaar"  -> 80000
- "1 lac" / "1 lakh" / "1 lac" / "1 lak"              -> 100000
- "1.5 lac" / "150k" / "150000" / "1.5 lakh"          -> 150000
- "2 lakh"                                            -> 200000
- "budget is X" / "X tak" / "under X" / "below X" / "max X" / "X se kam"  -> maxPrice = X
- "above X" / "over X" / "X se zyada" / "minimum X"   -> minPrice = X
- "between X and Y"                                   -> minPrice=X, maxPrice=Y

COMPARATIVE FOLLOW-UPS — VERY IMPORTANT. A follow-up like "cheaper", "sasta", "any cheaper options", "kuch aur sasta" means the customer wants to BROADEN the search to other phones, NOT to filter the same model. You MUST:
  (a) set "model": null  AND  "brand": null   (we are no longer looking at just that one model), and
  (b) set "maxPrice" to JUST BELOW the LOWEST price we quoted most recently in the conversation.
  Read the prices from our earlier messages to find that number.

  WORKED EXAMPLE:
  History (assistant just said): "Pixel 8 Pro 128GB - PKR 123,000; 256GB - PKR 130,000"
  Customer now says: "Do you have any cheaper options?"
  => Correct output: { "type":"product_query", "model":null, "brand":null, "maxPrice":122999, "minPrice":null, ... }
  (NOT model:"Pixel 8 Pro" — that would wrongly return only Pixel 8 Pro.)

  Other comparatives:
  - "more expensive / better / upgrade / behtar" -> "minPrice" = just above the last quoted price; "model":null, "brand":null.
  - "bigger / more storage / zyada storage" -> raise "storageGb" to the next size, keep the same model.
  - a colour only ("black mein?", "white") -> keep the SAME model/brand from context; ignore colour.
  - resolve "that / ye / wo / the other one" against the last phone discussed.

INTENT RULES:
- "product_query": references any phone, brand, spec, or budget (incl. "my budget is 80k").
- "see_first": wants a real photo/video of the actual unit before paying (dekhna, video, condition dekhni).
- "confirm_order": ready to buy / place / confirm an order ("ye le lunga", "order kar do", "confirm", "I'll take it", "book it").
- "human": wants to talk to a person / negotiate price / call.
- "need_help": confused, or asks how this works / what they can do.
- "catalog": asks for the whole list with no specifics ("sab dikhao", "full list").
- "greeting": a bare hello/salam with nothing else.
- "unknown": genuinely unclear.

OTHER:
- Brand shorthand: iphone->apple, pixel->google, galaxy->samsung, redmi/poco/mi->xiaomi.
- There is NO "year" field — ignore release years; fold any model generation into "model".
- If a detail isn't stated, use null. NEVER invent a model the customer didn't mention.`;

interface LlmJson {
  type?: string;
  brand?: string | null;
  model?: string | null;
  storageGb?: number | null;
  pta?: string | null;
  condition?: string | null;
  maxPrice?: number | null;
  minPrice?: number | null;
  lang?: string | null;
}

const VALID_TYPES = ['greeting', 'product_query', 'see_first', 'human', 'catalog', 'confirm_order', 'need_help', 'unknown'];
const VALID_PTA = ['pta_approved', 'non_pta'];
const VALID_CONDITION = ['new', 'open_box', 'used'];

/** Best-effort JSON extraction (handles code fences / surrounding text). */
function extractJson(content: string): LlmJson | null {
  const fenced = content.replace(/```json|```/gi, '');
  const start = fenced.indexOf('{');
  const end = fenced.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(fenced.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function isLlmEnabled(): boolean {
  return !!process.env.GLM_API_KEY;
}

export async function llmParse(text: string, history: ConvoMessage[] = []): Promise<ParsedIntent | null> {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) return null;

  const baseUrl = (process.env.GLM_BASE_URL || 'https://api.z.ai/api/paas/v4').replace(/\/$/, '');
  const model = process.env.GLM_MODEL || 'glm-4-flash';

  // Prior turns give the model context for follow-ups.
  const historyMsgs = history.map((h) => ({
    role: h.direction === 'in' ? 'user' : 'assistant',
    content: h.text,
  }));

  try {
    const res = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model,
        temperature: 0.1,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...historyMsgs,
          { role: 'user', content: text },
        ],
      },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 7000,
      },
    );

    const content: string = res.data?.choices?.[0]?.message?.content ?? '';
    const j = extractJson(content);
    if (!j) return null;

    const type = (VALID_TYPES.includes(j.type ?? '') ? j.type : 'product_query') as ParsedIntent['type'];
    const lang = j.lang === 'roman_ur' ? 'roman_ur' : 'en';

    const intent: ParsedIntent = {
      type,
      confidence: 0.9,
      lang,
      source: 'llm',
      brand: j.brand ? String(j.brand).toLowerCase() : undefined,
      modelQuery: j.model ? String(j.model) : undefined,
      storageGb: typeof j.storageGb === 'number' ? j.storageGb : undefined,
      ptaPreference: VALID_PTA.includes(j.pta ?? '') ? (j.pta as ParsedIntent['ptaPreference']) : undefined,
      condition: VALID_CONDITION.includes(j.condition ?? '') ? (j.condition as ParsedIntent['condition']) : undefined,
      maxPrice: typeof j.maxPrice === 'number' && j.maxPrice > 0 ? j.maxPrice : undefined,
      minPrice: typeof j.minPrice === 'number' && j.minPrice > 0 ? j.minPrice : undefined,
    };
    return intent;
  } catch (err: any) {
    console.warn('[whatsapp] LLM parse failed, falling back to keywords:', err?.response?.status || err?.message);
    return null;
  }
}
