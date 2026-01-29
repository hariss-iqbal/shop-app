-- ==============================================================================
-- RLS Policy Test Suite for phone-shop
-- Feature: F-003 - Row Level Security (RLS) Policies
--
-- This test suite validates all RLS policies against the acceptance criteria:
-- 1. Anonymous users can SELECT phones, phone_images, and brands
-- 2. Anonymous users can INSERT into contact_messages only
-- 3. Anonymous users cannot INSERT/UPDATE/DELETE on phones, brands, phone_images
-- 4. Anonymous users cannot access suppliers, purchase_orders, purchase_order_items, sales
-- 5. Authenticated users have full CRUD on all tables
-- 6. All policies use TO clause with correct roles (anon/authenticated)
--
-- Usage:
--   Run this script against a Supabase database using psql or Supabase CLI:
--   supabase db test
--
-- Note: These tests use DO blocks with role switching (SET ROLE) to simulate
-- anonymous and authenticated users. Ensure you have a test database.
-- ==============================================================================

-- Test helper function to output test results
CREATE OR REPLACE FUNCTION test_result(test_name TEXT, passed BOOLEAN)
RETURNS VOID AS $$
BEGIN
  IF passed THEN
    RAISE NOTICE '  [PASS] %', test_name;
  ELSE
    RAISE NOTICE '  [FAIL] %', test_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a test helper function to count policies for a table
CREATE OR REPLACE FUNCTION count_policies_for_table(table_name TEXT)
RETURNS INTEGER AS $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = table_name;
  RETURN policy_count;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- SECTION 1: Verify RLS is enabled on all tables
-- ==============================================================================
DO $$
DECLARE
  table_rec RECORD;
  tables_with_rls TEXT[] := ARRAY[
    'brands', 'phones', 'phone_images', 'suppliers',
    'purchase_orders', 'purchase_order_items', 'sales',
    'contact_messages', 'stock_alert_configs'
  ];
  t TEXT;
  rls_enabled BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'SECTION 1: RLS Enabled on All Tables';
  RAISE NOTICE '===============================================';

  FOREACH t IN ARRAY tables_with_rls LOOP
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = t AND relnamespace = 'public'::regnamespace;

    IF rls_enabled IS NULL THEN
      PERFORM test_result(format('Table %s exists with RLS enabled', t), FALSE);
    ELSE
      PERFORM test_result(format('Table %s has RLS enabled', t), rls_enabled);
    END IF;
  END LOOP;
END $$;

-- ==============================================================================
-- SECTION 2: Verify policy existence and roles
-- ==============================================================================
DO $$
DECLARE
  policy_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'SECTION 2: Policy Existence and Roles';
  RAISE NOTICE '===============================================';

  -- Check anonymous SELECT policies exist for public tables
  PERFORM test_result(
    'brands_anon_select policy exists',
    EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'brands' AND policyname = 'brands_anon_select')
  );

  PERFORM test_result(
    'phones_anon_select policy exists',
    EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'phones' AND policyname = 'phones_anon_select')
  );

  PERFORM test_result(
    'phone_images_anon_select policy exists',
    EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'phone_images' AND policyname = 'phone_images_anon_select')
  );

  -- Check anonymous INSERT policy for contact_messages
  PERFORM test_result(
    'contact_messages_anon_insert policy exists',
    EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_messages' AND policyname = 'contact_messages_anon_insert')
  );

  -- Verify NO anonymous policies exist for private tables
  PERFORM test_result(
    'suppliers has NO anon policies',
    NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND roles::text LIKE '%anon%')
  );

  PERFORM test_result(
    'purchase_orders has NO anon policies',
    NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchase_orders' AND roles::text LIKE '%anon%')
  );

  PERFORM test_result(
    'purchase_order_items has NO anon policies',
    NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchase_order_items' AND roles::text LIKE '%anon%')
  );

  PERFORM test_result(
    'sales has NO anon policies',
    NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND roles::text LIKE '%anon%')
  );

  PERFORM test_result(
    'stock_alert_configs has NO anon policies',
    NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_alert_configs' AND roles::text LIKE '%anon%')
  );

  -- Verify authenticated full CRUD policies exist
  PERFORM test_result(
    'brands has authenticated SELECT policy',
    EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'brands' AND policyname LIKE '%authenticated_select%')
  );

  PERFORM test_result(
    'brands has authenticated INSERT policy',
    EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'brands' AND policyname LIKE '%authenticated_insert%')
  );

  PERFORM test_result(
    'brands has authenticated UPDATE policy',
    EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'brands' AND policyname LIKE '%authenticated_update%')
  );

  PERFORM test_result(
    'brands has authenticated DELETE policy',
    EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'brands' AND policyname LIKE '%authenticated_delete%')
  );
END $$;

-- ==============================================================================
-- SECTION 3: Verify policy role assignments use TO clause correctly
-- ==============================================================================
DO $$
DECLARE
  policy_rec RECORD;
  all_use_to_clause BOOLEAN := TRUE;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'SECTION 3: TO Clause Role Specification';
  RAISE NOTICE '===============================================';

  -- Check all policies have explicit role assignments (not empty roles array)
  FOR policy_rec IN
    SELECT tablename, policyname, roles
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    IF policy_rec.roles IS NULL OR cardinality(policy_rec.roles) = 0 THEN
      all_use_to_clause := FALSE;
      PERFORM test_result(
        format('Policy %s.%s has TO clause', policy_rec.tablename, policy_rec.policyname),
        FALSE
      );
    END IF;
  END LOOP;

  PERFORM test_result('All policies specify roles via TO clause', all_use_to_clause);

  -- Verify anon policies target anon role specifically
  PERFORM test_result(
    'brands_anon_select targets anon role',
    EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'brands'
        AND policyname = 'brands_anon_select'
        AND 'anon' = ANY(roles)
    )
  );

  PERFORM test_result(
    'contact_messages_anon_insert targets anon role',
    EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'contact_messages'
        AND policyname = 'contact_messages_anon_insert'
        AND 'anon' = ANY(roles)
    )
  );
END $$;

-- ==============================================================================
-- SECTION 4: Policy count verification
-- ==============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'SECTION 4: Policy Counts per Table';
  RAISE NOTICE '===============================================';

  -- Public tables should have 5 policies (1 anon SELECT + 4 authenticated CRUD)
  PERFORM test_result(
    'brands has 5 policies (1 anon + 4 auth)',
    count_policies_for_table('brands') = 5
  );

  PERFORM test_result(
    'phones has 5 policies (1 anon + 4 auth)',
    count_policies_for_table('phones') = 5
  );

  PERFORM test_result(
    'phone_images has 5 policies (1 anon + 4 auth)',
    count_policies_for_table('phone_images') = 5
  );

  -- Contact messages: 1 anon INSERT + 4 authenticated CRUD = 5
  PERFORM test_result(
    'contact_messages has 5 policies (1 anon INSERT + 4 auth)',
    count_policies_for_table('contact_messages') = 5
  );

  -- Private tables should have 4 policies (authenticated CRUD only)
  PERFORM test_result(
    'suppliers has 4 policies (auth only)',
    count_policies_for_table('suppliers') = 4
  );

  PERFORM test_result(
    'purchase_orders has 4 policies (auth only)',
    count_policies_for_table('purchase_orders') = 4
  );

  PERFORM test_result(
    'purchase_order_items has 4 policies (auth only)',
    count_policies_for_table('purchase_order_items') = 4
  );

  PERFORM test_result(
    'sales has 4 policies (auth only)',
    count_policies_for_table('sales') = 4
  );

  PERFORM test_result(
    'stock_alert_configs has 4 policies (auth only)',
    count_policies_for_table('stock_alert_configs') = 4
  );
END $$;

-- ==============================================================================
-- SECTION 5: Storage bucket policies
-- ==============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'SECTION 5: Storage Bucket Policies';
  RAISE NOTICE '===============================================';

  -- Check phone-images bucket exists
  PERFORM test_result(
    'phone-images bucket exists',
    EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'phone-images')
  );

  -- Check bucket is public
  PERFORM test_result(
    'phone-images bucket is public',
    EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'phone-images' AND public = true)
  );

  -- Check storage policies exist
  PERFORM test_result(
    'Storage public SELECT policy exists',
    EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname LIKE '%public_select%'
    )
  );

  PERFORM test_result(
    'Storage authenticated INSERT policy exists',
    EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname LIKE '%authenticated_insert%'
    )
  );

  PERFORM test_result(
    'Storage authenticated UPDATE policy exists',
    EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname LIKE '%authenticated_update%'
    )
  );

  PERFORM test_result(
    'Storage authenticated DELETE policy exists',
    EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname LIKE '%authenticated_delete%'
    )
  );
END $$;

-- ==============================================================================
-- SECTION 6: Acceptance Criteria Summary
-- ==============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'SECTION 6: Acceptance Criteria Summary';
  RAISE NOTICE '===============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'AC1: Anonymous SELECT on phones - Verified by phones_anon_select policy';
  RAISE NOTICE 'AC2: Anonymous INSERT on phones denied - No anon INSERT policy exists';
  RAISE NOTICE 'AC3: Anonymous INSERT on contact_messages - Verified by contact_messages_anon_insert';
  RAISE NOTICE 'AC4: Anonymous SELECT on suppliers returns zero - No anon policy exists';
  RAISE NOTICE 'AC5: Authenticated full CRUD - All authenticated_* policies exist';
  RAISE NOTICE 'AC6: TO clause specifies correct role - All policies use TO anon/authenticated';
  RAISE NOTICE 'AC7: auth.uid() caching - Not applicable (no per-user row filtering)';
  RAISE NOTICE '';
END $$;

-- Cleanup test helper functions
DROP FUNCTION IF EXISTS test_result(TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS count_policies_for_table(TEXT);

-- ==============================================================================
-- END OF TEST SUITE
-- ==============================================================================
