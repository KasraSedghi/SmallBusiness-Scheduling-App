-- Red Bean Scheduler: Fix infinite recursion in profiles RLS policies
--
-- Root cause: the policies admins_read_all_profiles / admins_update_all_profiles
-- (and employees_update_own_profile's WITH CHECK) live ON the profiles table but
-- contain a subquery against profiles (EXISTS SELECT ... FROM profiles ...).
-- Evaluating the policy re-triggers the policy, so Postgres aborts every profiles
-- query with "infinite recursion detected in policy (42P17)". This made even a
-- user's own-profile SELECT fail, so the middleware's role lookup returned null
-- and bounced admins to /availability?error=unauthorized.
--
-- Fix: check admin status through a SECURITY DEFINER function. SECURITY DEFINER
-- runs with the function owner's rights and bypasses RLS, so the inner profiles
-- read does NOT re-enter the policy -> no recursion.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Rewrite the recursive profiles policies to use the helper.
DROP POLICY IF EXISTS "admins_read_all_profiles" ON profiles;
CREATE POLICY "admins_read_all_profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "admins_update_all_profiles" ON profiles;
CREATE POLICY "admins_update_all_profiles"
  ON profiles FOR UPDATE
  USING (public.is_admin());

-- employees_update_own_profile's WITH CHECK also self-referenced profiles, which
-- recurses on UPDATE. Replace the role-immutability guard with a non-recursive
-- check: a non-admin may only keep role = 'employee' (they can't read their old
-- role row without recursion, so we forbid self-promotion outright instead).
DROP POLICY IF EXISTS "employees_update_own_profile" ON profiles;
CREATE POLICY "employees_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND (role = 'employee' OR public.is_admin()));

-- Note: the admin policies on availabilities / time_off_requests / capacity_settings
-- also use EXISTS(SELECT ... FROM profiles ...), but those live on OTHER tables, so
-- they do not recurse and are left as-is.
