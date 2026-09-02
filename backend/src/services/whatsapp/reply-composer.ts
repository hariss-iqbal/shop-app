/**
 * Reply composer — turns inventory results + intent into WhatsApp message text.
 *
 * Phrasing is bilingual (English / Roman Urdu) based on the detected language.
 * Keep replies short — WhatsApp users skim. Prices are formatted as PKR.
 *
 * IMPORTANT (safety): the bot never negotiates or commits to a discount. It
 * quotes the listed price only and offers a human handoff for deals.
 */

import { BotReply, ParsedIntent, VariantSummary } from './types';

const CATALOG_URL = process.env.SHOP_CATALOG_URL || 'https://www.smartcell.pk/catalog';

function pkr(n: number): string {
  return 'PKR ' + n.toLocaleString('en-PK');
}

function prettyCondition(c: string): string {
  return c.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()); // open_box -> Open Box
}

function prettyPta(p: string | null): string {
  if (p === 'pta_approved') return 'PTA Approved';
  if (p === 'non_pta') return 'Non-PTA';
  return '—';
}

function variantLine(v: VariantSummary): string {
  const storage = v.storageGb ? `${v.storageGb}GB` : '';
  const colors = v.availableColors.length ? ` · ${v.availableColors.slice(0, 4).join(', ')}` : '';
  const link = v.productUrl ? `\n   ${v.productUrl}` : '';
  return `• ${v.brand} ${v.model} ${storage} — ${pkr(v.sellingPrice)}\n   ${prettyCondition(v.condition)} · ${prettyPta(v.ptaStatus)}${colors}${link}`;
}

export function composeGreeting(lang: ParsedIntent['lang']): BotReply {
  const text = lang === 'roman_ur'
    ? 'Assalam o Alaikum! 👋 Smart Cell mein khush aamdeed. Kis phone ke baare mein maloomat chahiye? (model ya budget likh dein)'
    : 'Hello! 👋 Welcome to Smart Cell. Which phone are you looking for? (send a model name or your budget)';
  return { text };
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** A short phrase describing what the customer asked for, for the empty message. */
function subjectPhrase(intent: ParsedIntent): string {
  if (intent.modelQuery) return `"${intent.modelQuery}"`;
  if (intent.brand && intent.maxPrice) return `${titleCase(intent.brand)} under ${pkr(intent.maxPrice)}`;
  if (intent.maxPrice) return `phones under ${pkr(intent.maxPrice)}`;
  if (intent.brand) return titleCase(intent.brand);
  return 'that';
}

function buildHeader(intent: ParsedIntent, ur: boolean): string {
  if (intent.modelQuery) {
    return ur ? `Yeh ${intent.modelQuery} mein available hain:` : `Here's what we have for ${intent.modelQuery}:`;
  }
  if (intent.maxPrice) {
    const p = pkr(intent.maxPrice);
    const b = intent.brand ? ` ${titleCase(intent.brand)}` : '';
    return ur ? `${p} tak yeh${b} phones available hain:` : `Within ${p}, here are the${b} phones we have:`;
  }
  if (intent.brand) {
    const b = titleCase(intent.brand);
    return ur ? `${b} ke yeh phones available hain:` : `Here are the ${b} phones we have:`;
  }
  return ur ? `Yeh available hain:` : `Here's what we have:`;
}

export function composeProductReply(intent: ParsedIntent, variants: VariantSummary[]): BotReply {
  const ur = intent.lang === 'roman_ur';

  if (variants.length === 0) {
    const subj = subjectPhrase(intent);
    return {
      text: ur
        ? `Is waqt ${subj} stock mein nahi mil raha. 🙏 Aap poori list yahan dekh sakte hain:\n${CATALOG_URL}\n\nYa koi doosra model/budget batayein?`
        : `I couldn't find ${subj} in stock right now. 🙏 You can see everything here:\n${CATALOG_URL}\n\nOr tell me another model or budget?`,
    };
  }

  const footer = ur
    ? `\n\nKoi pasand aaya to bata dein — order WhatsApp par hi confirm ho jata hai. 📦 (COD + TCS/Leopards)`
    : `\n\nWant any of these? We confirm the order right here on WhatsApp. 📦 (COD + TCS/Leopards delivery)`;

  // Budget query → show everything within budget, plus a few "stretch" options
  // just above it as upsell suggestions.
  if (intent.maxPrice) {
    const within = variants.filter((v) => v.sellingPrice <= intent.maxPrice!);
    const stretch = variants.filter((v) => v.sellingPrice > intent.maxPrice!);

    const WITHIN_MAX = 14;
    let text = buildHeader(intent, ur) + '\n';
    if (within.length) {
      text += within.slice(0, WITHIN_MAX).map(variantLine).join('\n');
      if (within.length > WITHIN_MAX) {
        text += ur ? `\n…aur ${within.length - WITHIN_MAX} options` : `\n…and ${within.length - WITHIN_MAX} more`;
      }
    } else {
      text += ur ? '(is budget mein filhal kuch nahi)' : '(nothing exactly in this budget right now)';
    }

    if (stretch.length) {
      const ceil = pkr(intent.maxPrice + (Number(process.env.BUDGET_STRETCH_PKR) || 30000));
      const sLines = stretch.slice(0, 5).map(variantLine).join('\n');
      text += ur
        ? `\n\nThora upar (≤ ${ceil}) — agar budget thora barha sakein:\n${sLines}`
        : `\n\nA little above (≤ ${ceil}) if you can stretch a bit:\n${sLines}`;
    }
    return { text: text + footer };
  }

  // Model / brand query → show a generous list.
  const lines = variants.slice(0, 10).map(variantLine).join('\n');
  return { text: `${buildHeader(intent, ur)}\n${lines}${footer}` };
}

export function composeSeeFirst(intent: ParsedIntent, variants: VariantSummary[]): BotReply {
  const ur = intent.lang === 'roman_ur';
  const base = ur
    ? 'Bilkul! Hum aapko is exact unit ki live video bhej dete hain payment se pehle. 🎥 Team thori dair mein video share karegi.'
    : 'Of course! We\'ll send you a live video of the exact unit before you pay. 🎥 Our team will share it shortly.';
  // This is a human-touch moment — flag for handoff so a person sends the real video.
  return { text: base, handoff: true };
}

export function composeCatalog(lang: ParsedIntent['lang']): BotReply {
  const text = lang === 'roman_ur'
    ? `Hamari poori available list yahan hai 👇\n${CATALOG_URL}\n\nKisi model ka naam likh dein to main qeemat aur stock bata doon.`
    : `Here's our full live list 👇\n${CATALOG_URL}\n\nSend me a model name and I'll give you price + stock.`;
  return { text };
}

export function composeOrderConfirm(lang: ParsedIntent['lang']): BotReply {
  const text = lang === 'roman_ur'
    ? 'Zabardast! 🎉 Aapka order confirm karne ke liye hamari team abhi aap se rabta karegi — address aur payment (COD/bank transfer) wahin set kar lenge. 🙌'
    : 'Awesome! 🎉 To confirm your order, our team will reach out to you right now — they\'ll sort delivery address and payment (COD / bank transfer). 🙌';
  // Placing an order is a money action — always hand to a human.
  return { text, handoff: true };
}

export function composeHelp(lang: ParsedIntent['lang']): BotReply {
  const text = lang === 'roman_ur'
    ? `Main aapki phone dhoondhne mein madad kar sakta hoon 📱\n• Model likhein (jaise "Pixel 7a")\n• Ya budget (jaise "80k mein konsa")\n• Ya brand (Pixel, iPhone, Samsung…)\n\nKisi insan se baat karni ho to "team" likh dein.`
    : `I can help you find a phone 📱\n• Send a model (e.g. "Pixel 7a")\n• Or a budget (e.g. "under 80k")\n• Or a brand (Pixel, iPhone, Samsung…)\n\nType "team" anytime to talk to a person.`;
  return { text };
}

export function composeHumanHandoff(lang: ParsedIntent['lang']): BotReply {
  const text = lang === 'roman_ur'
    ? 'Theek hai, main aapko hamari team se connect kar deta hoon — thori dair mein reply aa jayega. 🙌'
    : 'Sure — I\'m connecting you with our team, you\'ll hear back shortly. 🙌';
  return { text, handoff: true };
}

export function composeFallback(lang: ParsedIntent['lang']): BotReply {
  const text = lang === 'roman_ur'
    ? `Maaf kijiye, samajh nahi paaya. 🙏 Aap model ka naam likhein (jaise "Pixel 7a 128") ya poori list dekhein:\n${CATALOG_URL}`
    : `Sorry, I didn't quite get that. 🙏 Send a model name (e.g. "Pixel 7a 128") or browse the full list:\n${CATALOG_URL}`;
  return { text };
}
