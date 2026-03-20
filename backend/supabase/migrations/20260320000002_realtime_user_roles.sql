-- Migration: Enable Supabase Realtime for user_roles
-- Needed for real-time approval revocation: when admin revokes access,
-- the user's session is terminated immediately.

ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;
