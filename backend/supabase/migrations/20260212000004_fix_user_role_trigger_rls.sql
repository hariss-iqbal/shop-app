-- Migration: Fix user role trigger RLS bypass
-- Issue: Creating users from Supabase dashboard (or any non-authenticated context)
-- fails because handle_new_user_role() trigger cannot INSERT into user_roles.
--
-- Root cause: RLS on user_roles requires is_admin() for INSERT, which checks
-- auth.uid(). When creating users from dashboard/service_role context,
-- auth.uid() is NULL, so is_admin() returns FALSE and the INSERT is blocked.
-- Since the trigger has no error handling, the RLS violation rolls back the
-- entire user creation transaction.
--
-- Fix:
-- 1. Recreate trigger function with EXCEPTION handler (don't block user creation)
-- 2. Ensure function is owned by postgres (superuser bypasses RLS)
-- 3. Add explicit RLS policy for postgres role as belt-and-suspenders

-- ============================================================
-- 1. RECREATE TRIGGER FUNCTION WITH ERROR HANDLING
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the first user (make them admin)
  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Otherwise, assign default role (cashier)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'cashier');
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Role already exists for this user, skip silently
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log warning but NEVER block user creation
    RAISE WARNING 'handle_new_user_role failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================================
-- 2. ENSURE FUNCTION OWNER IS POSTGRES (SUPERUSER BYPASSES RLS)
-- ============================================================

ALTER FUNCTION handle_new_user_role() OWNER TO postgres;

-- ============================================================
-- 3. ADD RLS POLICY FOR POSTGRES ROLE ON USER_ROLES
-- ============================================================
-- Belt-and-suspenders: explicitly allow postgres role full access.
-- In standard PostgreSQL, superusers bypass RLS automatically, but
-- Supabase's managed environment may handle this differently.

DO $$
BEGIN
  -- Drop if exists to make migration idempotent
  DROP POLICY IF EXISTS "user_roles_postgres_all" ON user_roles;
END;
$$;

CREATE POLICY "user_roles_postgres_all" ON user_roles
  FOR ALL TO postgres
  USING (true)
  WITH CHECK (true);
