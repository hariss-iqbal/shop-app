/**
 * Grounded reply generation (GLM).
 *
 * The model writes a natural, human-sounding reply — but it is given the REAL
 * matching stock from our database as the ONLY source of product facts, and is
 * forbidden to invent prices, stock, or discounts. This is what keeps a
 * conversational bot from ever quoting a wrong price.
 *
 * Returns null on any failure so the caller can fall back to the deterministic
 * composer (the bot never goes silent).
 */

import axios from 'axios';
import { ConvoMessage, ParsedIntent, VariantSummary } from './types';

const CATALOG_URL = process.env.SHOP_CATALOG_URL || 'https://www.smartcell.pk/catalog';

const SYSTEM_PROMPT = `You are the WhatsApp assistant for "Smart Cell", a smartphone shop in Lahore, Pakistan. You reply like a friendly, efficient Pakistani shopkeeper.

STYLE:
- Reply in the SAME language/style as the customer (English or Roman Urdu). Keep it short — this is WhatsApp.
- Be warm and helpful, not robotic. Use the conversation history to stay on topic.
- When listing phones, show: model + storage, price, condition, PTA status, and the product link. A compact bulleted list is good.
- Prices in PKR with thousands separators (e.g. PKR 80,000).
- End a product reply by inviting them to order on WhatsApp (we do COD + TCS/Leopards delivery).

HARD RULES (never break):
- Use ONLY the products, prices, stock, colors, and links in the DATA block below. NEVER invent or guess a price, a model, or availability. If it's not in the data, you don't have it.
- If the DATA is empty, say we don't have a match right now and point them to ${CATALOG_URL} or ask a clarifying question. Do NOT make up alternatives.
- NEVER promise a discount, negotiate a price, or commit to anything beyond the listed price. If they want a discount or to negotiate, tell them our team will help and keep it friendly.
- Don't claim delivery times beyond "usually next-day via TCS/Leopards".
- Output ONLY the reply message text — no JSON, no notes, no quotes around it.`;

export async function llmCompose(args: {
  message: string;
  history: ConvoMessage[];
  intent: ParsedIntent;
  results: VariantSummary[];
}): Promise<string | null> {
  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) return null;

  const baseUrl = (process.env.GLM_BASE_URL || 'https://api.z.ai/api/paas/v4').replace(/\/$/, '');
  const model = process.env.GLM_MODEL || 'glm-4-flash';

  // Compact, ground-truth facts the model is allowed to use.
  const facts = args.results.slice(0, 15).map((v) => ({
    brand: v.brand,
    model: v.model,
    storageGb: v.storageGb,
    condition: v.condition,
    pta: v.ptaStatus,
    pricePKR: v.sellingPrice,
    colors: v.availableColors,
    link: v.productUrl,
  }));

  const dataBlock =
    facts.length > 0
      ? `DATA (the ONLY products/prices you may mention):\n${JSON.stringify(facts)}`
      : `DATA: [] (no matching stock found)`;

  const historyMsgs = args.history.map((h) => ({
    role: h.direction === 'in' ? 'user' : 'assistant',
    content: h.text,
  }));

  try {
    const res = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model,
        temperature: 0.3,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...historyMsgs,
          { role: 'user', content: `Customer's latest message: "${args.message}"\n\n${dataBlock}\n\nWrite the reply.` },
        ],
      },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 9000,
      },
    );
    const txt: string = (res.data?.choices?.[0]?.message?.content ?? '').trim();
    return txt || null;
  } catch (err: any) {
    console.warn('[whatsapp] LLM compose failed, using deterministic reply:', err?.response?.status || err?.message);
    return null;
  }
}
