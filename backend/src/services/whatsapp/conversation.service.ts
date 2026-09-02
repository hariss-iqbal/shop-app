/**
 * Conversation history for the WhatsApp bot.
 *
 * Persists each inbound/outbound message and fetches the recent window so the
 * bot can resolve follow-ups ("aur black mein?", "the cheaper one") and feel
 * like a real conversation.
 *
 * Fully fail-soft: if the wa_messages table doesn't exist yet (migration not
 * applied to prod) or Supabase isn't configured, history is simply empty and
 * logging is a no-op — the bot still works, just without memory.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConvoMessage } from './types';

export class ConversationService {
  private readonly supabase: SupabaseClient | null;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    this.supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  }

  /** Recent messages for a phone within the time window, oldest → newest. */
  async getRecent(phone: string, withinMinutes = 15, limit = 5): Promise<ConvoMessage[]> {
    if (!this.supabase) return [];
    const since = new Date(Date.now() - withinMinutes * 60_000).toISOString();
    const { data, error } = await this.supabase
      .from('wa_messages')
      .select('direction, text, created_at')
      .eq('phone', phone)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.warn('[whatsapp] history fetch failed (continuing without memory):', error.message);
      return [];
    }
    return (data || [])
      .reverse()
      .map((r: any) => ({ direction: r.direction, text: r.text } as ConvoMessage));
  }

  /** Append a message to the transcript (best-effort). */
  async log(phone: string, direction: 'in' | 'out', text: string): Promise<void> {
    if (!this.supabase) return;
    const { error } = await this.supabase.from('wa_messages').insert({ phone, direction, text });
    if (error) console.warn('[whatsapp] history log failed:', error.message);
  }
}
