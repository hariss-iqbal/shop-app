-- Migration: WhatsApp conversation history
-- Stores inbound/outbound WhatsApp messages so the bot can use recent context
-- (last few messages within a short window) to handle follow-ups naturally
-- and feel like a real conversation.

CREATE TABLE IF NOT EXISTS wa_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(30) NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast "recent messages for this phone" lookups.
CREATE INDEX IF NOT EXISTS idx_wa_messages_phone_time ON wa_messages(phone, created_at DESC);

ALTER TABLE wa_messages ENABLE ROW LEVEL SECURITY;

-- Anonymous (public catalog) clients must not read conversations.
CREATE POLICY wa_messages_anon_none ON wa_messages FOR SELECT TO anon USING (false);
-- Authenticated admins can read the transcript (for an inbox view later).
CREATE POLICY wa_messages_auth_select ON wa_messages FOR SELECT TO authenticated USING (true);
-- The bot uses the service_role key, which bypasses RLS — no insert policy needed.

COMMENT ON TABLE wa_messages IS 'WhatsApp bot conversation transcript (in/out) for short-term context';
