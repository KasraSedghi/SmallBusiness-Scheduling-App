-- ============================================================================
-- 004_security_hardening.sql
-- Resolves Supabase Security Advisor warnings:
--   1. Function public.update_updated_at_column has a mutable search_path
--   2/3. public.rls_auto_enable() is a SECURITY DEFINER function callable by
--        the anon and authenticated roles via /rest/v1/rpc/rls_auto_enable
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Pin the search_path on update_updated_at_column
-- ----------------------------------------------------------------------------
-- A mutable search_path lets a caller redefine what unqualified names resolve
-- to, which is a privilege-escalation vector for functions that run with
-- elevated rights. This trigger function only touches NEW.updated_at and
-- CURRENT_TIMESTAMP, so an empty search_path is safe and closes the warning.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


-- ----------------------------------------------------------------------------
-- 2. Lock down rls_auto_enable()
-- ----------------------------------------------------------------------------
-- This SECURITY DEFINER function is NOT defined anywhere in this repo's
-- migrations -- it exists only on the remote database. As a SECURITY DEFINER
-- function in the public schema it is automatically exposed as an RPC endpoint
-- that anon (logged-out) and authenticated users can invoke. Since the app
-- never calls it, the safe move is to revoke EXECUTE from the API roles so it
-- can no longer be triggered from the internet. (The owner/postgres role keeps
-- access, so any internal/admin use still works.)
--
-- Before applying, inspect what it actually does:
--   SELECT pg_get_functiondef('public.rls_auto_enable()'::regprocedure);
-- If it turns out to be dead/unused, you can DROP it instead (see bottom).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'rls_auto_enable'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;

    -- Also pin its search_path while we are here (defense in depth for a
    -- SECURITY DEFINER function).
    ALTER FUNCTION public.rls_auto_enable() SET search_path = '';
  END IF;
END;
$$;


-- ----------------------------------------------------------------------------
-- Optional: if you confirm rls_auto_enable() is unused, drop it entirely.
-- Uncomment to remove it instead of just revoking access.
-- ----------------------------------------------------------------------------
-- DROP FUNCTION IF EXISTS public.rls_auto_enable();
