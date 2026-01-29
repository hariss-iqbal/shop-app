-- Migration: Enable Supabase Realtime for contact_messages
-- Feature: F-052 - Supabase Realtime for Live Unread Message Badge
-- Enables realtime subscriptions on the contact_messages table for live badge updates.

-- ============================================================
-- ENABLE REALTIME FOR contact_messages TABLE
-- ============================================================

-- Enable the realtime publication for contact_messages table.
-- This allows clients to subscribe to INSERT, UPDATE, and DELETE events.
-- The admin sidebar badge uses this for live unread count updates.

-- Supabase Realtime is enabled by adding tables to the 'supabase_realtime' publication.
-- If the publication doesn't exist (fresh instance), create it.

DO $$
BEGIN
  -- Check if supabase_realtime publication exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    -- Create the publication if it doesn't exist
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Add contact_messages to the realtime publication
-- This enables INSERT, UPDATE events which are used for:
-- - Live unread count badge in admin sidebar (M-10 Layout)
-- - Real-time message list updates in admin message management (M-08 Messaging)
ALTER PUBLICATION supabase_realtime ADD TABLE contact_messages;

-- IMPLEMENTATION NOTE:
-- The frontend subscribes to this table using:
--   supabase.channel('contact-messages')
--     .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, callback)
--     .subscribe()
--
-- Subscription lifecycle:
-- - Established on admin login
-- - Cleaned up on logout
-- - Auto-reconnects on network interruption
