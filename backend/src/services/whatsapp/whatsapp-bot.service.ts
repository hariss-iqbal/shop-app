/**
 * WhatsApp bot orchestrator.
 *
 * Flow per message:
 *   fetch recent history -> understand (LLM + history, keyword fallback)
 *   -> route by intent -> for product: query DB -> AI writes a GROUNDED reply
 *   (deterministic fallback) -> send -> log transcript.
 *
 * Safety:
 *  - Prices/stock always come from the DB; the AI is given them as the only
 *    facts it may use and is forbidden to invent (see llm-composer).
 *  - confirm_order / human are handed to a person — the bot never transacts
 *    or negotiates on its own.
 *  - Every external dependency is fail-soft, so the bot never goes silent.
 */

import { InboundMessage, BotReply, ParsedIntent, VariantFilters, ConvoMessage } from './types';
import { parseIntent } from './message-parser';
import { llmParse } from './llm-parser';
import { llmCompose } from './llm-composer';
import { InventoryLookupService } from './inventory-lookup.service';
import { ConversationService } from './conversation.service';
import {
  composeGreeting,
  composeProductReply,
  composeSeeFirst,
  composeCatalog,
  composeHumanHandoff,
  composeOrderConfirm,
  composeHelp,
  composeFallback,
} from './reply-composer';
import { WhatsAppCloudApiClient } from './cloud-api.client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class WhatsAppBotService {
  private readonly inventory: InventoryLookupService;
  private readonly convo: ConversationService;
  private readonly client: WhatsAppCloudApiClient | null;
  private readonly supabase: SupabaseClient | null;

  constructor() {
    this.inventory = new InventoryLookupService();
    this.convo = new ConversationService();
    this.client = WhatsAppCloudApiClient.fromEnv();
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    this.supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  }

  /** Map a parsed intent to inventory search filters. */
  private toFilters(i: ParsedIntent): VariantFilters {
    return {
      modelQuery: i.modelQuery,
      brand: i.brand,
      storageGb: i.storageGb,
      pta: i.ptaPreference,
      condition: i.condition,
      maxPrice: i.maxPrice,
      minPrice: i.minPrice,
    };
  }

  /** Decide what to reply, given the message and recent conversation history. */
  async decideReply(msg: InboundMessage, history: ConvoMessage[] = []): Promise<BotReply> {
    // Understand: LLM (with context) first, deterministic keyword parser as fallback.
    const intent = (await llmParse(msg.text, history)) ?? parseIntent(msg.text);

    // Debug: show exactly what the parser extracted (helps diagnose comparatives).
    console.log(
      '[whatsapp] intent:',
      JSON.stringify({
        text: msg.text,
        type: intent.type,
        source: intent.source ?? 'keyword',
        model: intent.modelQuery,
        brand: intent.brand,
        storageGb: intent.storageGb,
        pta: intent.ptaPreference,
        condition: intent.condition,
        minPrice: intent.minPrice,
        maxPrice: intent.maxPrice,
        historyTurns: history.length,
      }),
    );

    switch (intent.type) {
      case 'greeting':
        return composeGreeting(intent.lang);
      case 'catalog':
        return composeCatalog(intent.lang);
      case 'need_help':
        return composeHelp(intent.lang);
      case 'human':
        return composeHumanHandoff(intent.lang);
      case 'confirm_order':
        return composeOrderConfirm(intent.lang);
      case 'see_first': {
        const variants =
          intent.modelQuery || intent.brand || intent.maxPrice
            ? await this.inventory.searchVariants(this.toFilters(intent))
            : [];
        return composeSeeFirst(intent, variants);
      }
      case 'product_query': {
        const variants = await this.inventory.searchVariants(this.toFilters(intent));
        console.log('[whatsapp] product results:', variants.length);
        // AI writes a grounded reply from the real rows; fall back to the
        // deterministic listing if the LLM is unavailable.
        const aiText = await llmCompose({ message: msg.text, history, intent, results: variants });
        return aiText ? { text: aiText } : composeProductReply(intent, variants);
      }
      default: {
        // Unknown / chit-chat — let the AI handle it conversationally (no product
        // facts to ground), else a safe clarifying fallback.
        const aiText = await llmCompose({ message: msg.text, history, intent, results: [] });
        return aiText ? { text: aiText } : composeFallback(intent.lang);
      }
    }
  }

  /** Full handle: fetch context, decide, send, and record the exchange. */
  async handleMessage(msg: InboundMessage): Promise<void> {
    const history = await this.convo.getRecent(msg.from).catch(() => [] as ConvoMessage[]);

    let reply: BotReply;
    try {
      reply = await this.decideReply(msg, history);
    } catch (err) {
      console.error('[whatsapp-bot] decideReply failed:', err);
      reply = composeFallback('en');
    }

    // Send via Cloud API if credentials are present.
    if (this.client) {
      try {
        if (reply.imageUrl) {
          await this.client.sendImage(msg.from, reply.imageUrl, reply.text);
        } else {
          await this.client.sendText(msg.from, reply.text);
        }
      } catch (err) {
        console.error('[whatsapp-bot] send failed:', err);
      }
    } else {
      console.warn('[whatsapp-bot] Cloud API not configured — reply not sent. Reply was:', reply.text);
    }

    // Record the transcript (for context next time) and flag handoffs to the inbox.
    await this.convo.log(msg.from, 'in', msg.text).catch(() => {});
    await this.convo.log(msg.from, 'out', reply.text).catch(() => {});
    if (reply.handoff) {
      await this.logHandoff(msg, reply).catch((e) => console.error('[whatsapp-bot] logHandoff failed:', e));
    }
  }

  /**
   * When a conversation needs a person (order confirmation, negotiation, "see it
   * first"), drop a lead into the existing `contact_messages` inbox so the team
   * picks it up.
   */
  private async logHandoff(msg: InboundMessage, reply: BotReply): Promise<void> {
    if (!this.supabase) return;
    await this.supabase.from('contact_messages').insert({
      name: msg.profileName || `WhatsApp ${msg.from}`,
      email: `${msg.from}@whatsapp.lead`, // placeholder; contact_messages requires email
      phone: msg.from,
      subject: 'WhatsApp — needs human',
      message: msg.text,
      is_read: false,
    });
  }
}
