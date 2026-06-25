-- Red Bean Scheduler: Auto-create profile row on signup
-- Root cause fixed: signUpWithEmail() previously inserted the profile from the
-- client immediately after auth.signUp(), but with email confirmation enabled
-- the user has no session yet at that point, so RLS (auth.uid() = id) silently
-- rejected the insert and no profile was ever created.
-- A SECURITY DEFINER trigger on auth.users bypasses RLS and guarantees the
-- profile always exists, regardless of confirmation timing or client bugs.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'employee')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Backfill any existing auth.users that are missing a profiles row
-- (e.g. accounts created before this trigger existed).
INSERT INTO public.profiles (id, email, role)
SELECT u.id, u.email, 'employee'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
