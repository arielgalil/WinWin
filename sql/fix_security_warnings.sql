-- =============================================================================
-- Fix Security Warnings
-- Run in Supabase SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Fix mutable search_path on all affected functions
--    Uses pg_proc OIDs so exact parameter lists are not needed.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  func_names text[] := ARRAY[
    'is_super_admin',
    'set_user_role',
    'is_campaign_admin',
    'is_campaign_member',
    'handle_action_log_score_sync',
    'add_score_transaction',
    'is_any_campaign_admin',
    'check_is_campaign_admin',
    'add_existing_user_to_campaign',
    'handle_new_user',
    'is_campaign_member_safe',
    'get_my_role',
    'is_campaign_admin_safe'
  ];
  func_name text;
  func_oid  oid;
BEGIN
  FOREACH func_name IN ARRAY func_names LOOP
    FOR func_oid IN
      SELECT oid
      FROM   pg_proc
      WHERE  proname = func_name
        AND  pronamespace = 'public'::regnamespace
    LOOP
      EXECUTE format(
        'ALTER FUNCTION %s SET search_path = public',
        func_oid::regprocedure
      );
      RAISE NOTICE 'Fixed search_path for: %', func_oid::regprocedure;
    END LOOP;
  END LOOP;
END $$;


-- -----------------------------------------------------------------------------
-- 2. Fix overly-permissive RLS policies on lucky_wheel_templates
--    (replace USING (true) ALL with proper admin check)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage wheel templates" ON public.lucky_wheel_templates;

CREATE POLICY "Admins can manage wheel templates"
  ON public.lucky_wheel_templates
  FOR ALL
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.campaign_users
      WHERE user_id    = auth.uid()
        AND campaign_id = lucky_wheel_templates.campaign_id
    )
  )
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.campaign_users
      WHERE user_id    = auth.uid()
        AND campaign_id = lucky_wheel_templates.campaign_id
    )
  );


-- -----------------------------------------------------------------------------
-- 3. Fix overly-permissive RLS policies on lucky_wheel_winners
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage wheel winners" ON public.lucky_wheel_winners;

CREATE POLICY "Admins can manage wheel winners"
  ON public.lucky_wheel_winners
  FOR ALL
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.campaign_users
      WHERE user_id    = auth.uid()
        AND campaign_id = lucky_wheel_winners.campaign_id
    )
  )
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.campaign_users
      WHERE user_id    = auth.uid()
        AND campaign_id = lucky_wheel_winners.campaign_id
    )
  );
